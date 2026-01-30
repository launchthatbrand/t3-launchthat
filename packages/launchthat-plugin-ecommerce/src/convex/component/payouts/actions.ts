import { action } from "../_generated/server";
import { v } from "convex/values";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const componentsUntyped: any = require("../_generated/api").components;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const internalUntyped: any = require("../_generated/api").internal;

const clampCents = (raw: unknown): number => {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
};

export const runMonthly = action({
  args: {
    provider: v.optional(v.string()),
    periodStart: v.number(),
    periodEnd: v.number(),
    dryRun: v.optional(v.boolean()),
    providerConfig: v.optional(v.any()),
  },
  returns: v.object({
    ok: v.boolean(),
    runId: v.union(v.id("payoutRuns"), v.null()),
    processedUsers: v.number(),
    totalCashCents: v.number(),
    totalSubscriptionCreditCents: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx: any, args: any) => {
    const provider = typeof args.provider === "string" ? args.provider.trim() : "stripe";
    const periodStart = Number(args.periodStart ?? 0);
    const periodEnd = Number(args.periodEnd ?? 0);
    const dryRun = args.dryRun === true;
    const providerConfig = args.providerConfig;
    if (!Number.isFinite(periodStart) || !Number.isFinite(periodEnd) || periodEnd <= periodStart) {
      throw new Error("Invalid period");
    }

    const runId = dryRun
      ? null
      : await ctx.runMutation(internalUntyped.payouts.internal.createPayoutRun, {
        provider,
        periodStart,
        periodEnd,
        status: "running",
      });

    const errors: string[] = [];
    let processedUsers = 0;
    let totalCashCents = 0;
    let totalSubscriptionCreditCents = 0;

    // Iterate payout preferences as the primary set of opted-in affiliates.
    const prefs = (await ctx.runQuery(internalUntyped.payouts.internal.listPayoutPreferences, {
      limit: 5000,
    })) as any[];

    for (const pref of Array.isArray(prefs) ? prefs : []) {
      const userId = String(pref?.userId ?? "").trim();
      if (!userId) continue;

      try {
        const currency = typeof pref?.currency === "string" ? pref.currency.toUpperCase() : "USD";
        const minPayoutCents = clampCents(pref?.minPayoutCents);
        const policy = String(pref?.policy ?? "payout_only");

        const balanceRes: any = await ctx.runQuery(
          componentsUntyped.launchthat_affiliates.credit.queries.getCreditBalance,
          { userId, currency },
        );
        const balanceCents = clampCents(balanceRes?.balanceCents);
        if (balanceCents <= 0 || balanceCents < minPayoutCents) continue;

        // Connected account must exist for cash payouts.
        const account = await ctx.runQuery(internalUntyped.payouts.internal.getPayoutAccountByProviderUserId, {
          userId,
          provider,
        });
        if (!account) continue;
        const connectAccountId =
          account && typeof account.connectAccountId === "string" ? String(account.connectAccountId).trim() : "";
        if (!connectAccountId) continue;

        let subscriptionCreditCents = 0;
        let cashCents = balanceCents;

        if (policy === "apply_to_subscription_then_payout") {
          // Stripe-specific computation of upcoming subscription due is delegated to the stripe plugin.
          const dueRes: any = await ctx.runAction(
            componentsUntyped.stripe.payouts.getUpcomingSubscriptionDueCentsForUser,
            { userId, currency, ...(providerConfig ? providerConfig : {}) },
          );
          const dueCents = clampCents(dueRes?.dueCents);
          subscriptionCreditCents = Math.min(balanceCents, dueCents);
          cashCents = Math.max(0, balanceCents - subscriptionCreditCents);
        }

        if (dryRun) {
          processedUsers++;
          totalCashCents += cashCents;
          totalSubscriptionCreditCents += subscriptionCreditCents;
          continue;
        }

        // Write a pending transfer row (idempotency handled later with external ids + run).
        const transferRowId = await ctx.runMutation(internalUntyped.payouts.internal.insertPayoutTransfer, {
          runId,
          provider,
          userId,
          currency,
          cashCents,
          subscriptionCreditCents,
        });

        // Apply subscription credit + cash transfer using Stripe plugin.
        let externalBalanceTxnId: string | undefined;
        let externalTransferId: string | undefined;

        if (subscriptionCreditCents > 0) {
          const res: any = await ctx.runAction(
            componentsUntyped.stripe.payouts.applyCustomerBalanceCredit,
            {
              userId,
              amountCents: subscriptionCreditCents,
              currency,
              runId: String(runId),
              ...(providerConfig ? providerConfig : {}),
            },
          );
          externalBalanceTxnId =
            typeof res?.balanceTransactionId === "string" ? res.balanceTransactionId : undefined;
        }

        if (cashCents > 0) {
          const res: any = await ctx.runAction(
            componentsUntyped.stripe.payouts.createTransferToConnectedAccount,
            {
              connectAccountId,
              userId,
              amountCents: cashCents,
              currency,
              runId: String(runId),
              ...(providerConfig ? providerConfig : {}),
            },
          );
          externalTransferId = typeof res?.transferId === "string" ? res.transferId : undefined;
        }

        // Consume the affiliate credit only after external operations succeed.
        await ctx.runMutation(componentsUntyped.launchthat_affiliates.credit.actions.consumeForPayout, {
          userId,
          runId: String(runId),
          cashCents,
          subscriptionCreditCents,
          currency,
          source: `ecommerce:${provider}`,
        });

        await ctx.runMutation(internalUntyped.payouts.internal.patchPayoutTransfer, {
          transferRowId,
          status: "sent",
          externalTransferId,
          externalBalanceTxnId,
        });

        processedUsers++;
        totalCashCents += cashCents;
        totalSubscriptionCreditCents += subscriptionCreditCents;
      } catch (err: any) {
        const msg = `[runMonthly] userId=${String(pref?.userId ?? "")}: ${String(err?.message ?? err)}`;
        errors.push(msg);
      }
    }

    if (!dryRun && runId) {
      await ctx.runMutation(internalUntyped.payouts.internal.patchPayoutRunStatus, {
        runId,
        status: errors.length ? "failed" : "completed",
      });
    }

    return {
      ok: true,
      runId,
      processedUsers,
      totalCashCents,
      totalSubscriptionCreditCents,
      errors,
    };
  },
});

export const getUpcomingSubscriptionDueCentsForUser = action({
  args: {
    stripeSecretKey: v.string(),
    userId: v.string(),
    currency: v.optional(v.string()),
  },
  returns: v.object({ ok: v.boolean(), dueCents: v.number() }),
  handler: async (ctx: any, args: any) => {
    const stripeSecretKey = String(args.stripeSecretKey ?? "").trim();
    const userId = String(args.userId ?? "").trim();
    const currency = typeof args.currency === "string" ? args.currency : undefined;
    if (!stripeSecretKey) throw new Error("Missing stripeSecretKey");
    if (!userId) throw new Error("Missing userId");

    const res: any = await ctx.runAction(
      componentsUntyped.stripe.payouts.getUpcomingSubscriptionDueCentsForUser,
      {
        stripeSecretKey,
        userId,
        currency,
      },
    );

    return { ok: true, dueCents: clampCents(res?.dueCents) };
  },
});

export const createStripeConnectOnboardingLinkForUser = action({
  args: {
    stripeSecretKey: v.string(),
    userId: v.string(),
    refreshUrl: v.string(),
    returnUrl: v.string(),
    email: v.optional(v.string()),
    fullName: v.optional(v.string()),
    businessType: v.optional(v.union(v.literal("individual"), v.literal("company"))),
    productDescription: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  returns: v.object({
    ok: v.boolean(),
    url: v.string(),
    connectAccountId: v.string(),
  }),
  handler: async (ctx: any, args: any) => {
    const stripeSecretKey = String(args.stripeSecretKey ?? "").trim();
    const userId = String(args.userId ?? "").trim();
    const refreshUrl = String(args.refreshUrl ?? "").trim();
    const returnUrl = String(args.returnUrl ?? "").trim();
    if (!stripeSecretKey) throw new Error("Missing stripeSecretKey");
    if (!userId) throw new Error("Missing userId");
    if (!refreshUrl || !returnUrl) throw new Error("Missing refreshUrl/returnUrl");

    const provider = "stripe";
    const existingAccount: any = await ctx.runQuery(
      internalUntyped.payouts.internal.getPayoutAccountByProviderUserId,
      {
        userId,
        provider,
      },
    );
    let connectAccountId =
      existingAccount && typeof existingAccount.connectAccountId === "string"
        ? String(existingAccount.connectAccountId).trim()
        : "";

    if (!connectAccountId) {
      const acct: any = await ctx.runAction(
        componentsUntyped.stripe.payouts.createOrGetExpressConnectAccountForUser,
        {
          stripeSecretKey,
          userId,
          email: typeof args.email === "string" ? args.email : undefined,
          fullName: typeof args.fullName === "string" ? args.fullName : undefined,
          businessType:
            args.businessType === "company" || args.businessType === "individual"
              ? args.businessType
              : undefined,
          productDescription: typeof args.productDescription === "string" ? args.productDescription : undefined,
          websiteUrl: typeof args.websiteUrl === "string" ? args.websiteUrl : undefined,
          supportEmail: typeof args.supportEmail === "string" ? args.supportEmail : undefined,
          metadata: args.metadata,
        },
      );
      connectAccountId = String(acct?.connectAccountId ?? "").trim();
      if (!connectAccountId) throw new Error("Failed to create connect account");

      await ctx.runMutation(internalUntyped.payouts.mutations.upsertPayoutAccount, {
        userId,
        provider,
        connectAccountId,
        status: "pending",
        details: { createdBy: "stripe" },
      });
    }

    const link: any = await ctx.runAction(componentsUntyped.stripe.payouts.createConnectOnboardingLink, {
      stripeSecretKey,
      connectAccountId,
      refreshUrl,
      returnUrl,
    });
    const url = String(link?.url ?? "").trim();
    if (!url) throw new Error("Failed to create onboarding link");

    return { ok: true, url, connectAccountId };
  },
});

export const processStripeWebhook = action({
  args: {
    stripeSecretKey: v.string(),
    stripeWebhookSecret: v.string(),
    signature: v.string(),
    rawBody: v.string(),
    affiliateScopeType: v.optional(v.union(v.literal("site"), v.literal("org"), v.literal("app"))),
    affiliateScopeId: v.optional(v.string()),
  },
  returns: v.object({ ok: v.boolean(), handled: v.boolean() }),
  handler: async (ctx: any, args: any) => {
    const stripeSecretKey = String(args.stripeSecretKey ?? "").trim();
    const stripeWebhookSecret = String(args.stripeWebhookSecret ?? "").trim();
    const signature = String(args.signature ?? "").trim();
    const rawBody = String(args.rawBody ?? "");
    if (!stripeSecretKey) throw new Error("Missing stripeSecretKey");
    if (!stripeWebhookSecret) throw new Error("Missing stripeWebhookSecret");
    if (!signature) throw new Error("Missing signature");

    const res: any = await ctx.runAction(componentsUntyped.stripe.webhooks.processEvent, {
      stripeSecretKey,
      stripeWebhookSecret,
      signature,
      rawBody,
    });
    if (!res || res.ok !== true) {
      throw new Error(String(res?.error ?? "Stripe webhook failed"));
    }

    if (res.handled === true && res.kind === "invoice.paid") {
      const userId = typeof res.userId === "string" ? res.userId : "";
      const amountCents = typeof res.amountCents === "number" ? res.amountCents : 0;
      const currency = typeof res.currency === "string" ? res.currency : "";
      const externalEventId = typeof res.externalEventId === "string" ? res.externalEventId : "";
      const occurredAt = typeof res.occurredAt === "number" ? res.occurredAt : undefined;

      if (userId && amountCents > 0 && currency && externalEventId) {
        await ctx.runMutation(internalUntyped.payouts.paymentEvents.recordCommissionablePayment, {
          source: "stripe",
          kind: "subscription_invoice_paid",
          externalEventId,
          referredUserId: userId,
          amountCents,
          currency,
          occurredAt,
          scopeType: args.affiliateScopeType,
          scopeId: args.affiliateScopeId,
        });
      }
    }

    return { ok: true, handled: Boolean(res.handled) };
  },
});

export const disconnectStripePayoutAccountForUser = action({
  args: {
    stripeSecretKey: v.string(),
    userId: v.string(),
    deleteRemote: v.optional(v.boolean()),
  },
  returns: v.object({
    ok: v.boolean(),
    deletedLocal: v.boolean(),
    deletedRemote: v.boolean(),
  }),
  handler: async (ctx: any, args: any) => {
    const stripeSecretKey = String(args.stripeSecretKey ?? "").trim();
    const userId = String(args.userId ?? "").trim();
    const deleteRemote = args.deleteRemote !== false;
    if (!stripeSecretKey) throw new Error("Missing stripeSecretKey");
    if (!userId) throw new Error("Missing userId");

    const provider = "stripe";
    const existingAccount: any = await ctx.runQuery(
      internalUntyped.payouts.internal.getPayoutAccountByProviderUserId,
      { userId, provider },
    );
    const connectAccountId =
      existingAccount && typeof existingAccount.connectAccountId === "string"
        ? String(existingAccount.connectAccountId).trim()
        : "";

    let deletedRemote = false;
    if (deleteRemote && connectAccountId) {
      try {
        const res: any = await ctx.runAction(componentsUntyped.stripe.payouts.deleteExpressConnectAccount, {
          stripeSecretKey,
          connectAccountId,
        });
        deletedRemote = Boolean(res?.deleted);
      } catch {
        // Best-effort; still allow local reset for re-testing.
        deletedRemote = false;
      }
    }

    const deletedRes: any = await ctx.runMutation(internalUntyped.payouts.mutations.deletePayoutAccount, {
      userId,
      provider,
    });

    return { ok: true, deletedLocal: Boolean(deletedRes?.deleted), deletedRemote };
  },
});

