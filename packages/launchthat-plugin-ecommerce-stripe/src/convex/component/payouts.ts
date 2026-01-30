import Stripe from "stripe";
import { action } from "./_generated/server";
import { v } from "convex/values";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const internalUntyped: any = require("./_generated/api").internal;

const normalizeCurrency = (raw: unknown): string => {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return s || "usd";
};

const clampCents = (raw: unknown): number => {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
};

const createStripeClient = (secretKey: string): Stripe => {
  return new Stripe(secretKey, {
    // Keep in sync with the installed Stripe SDK's supported API version type.
    apiVersion: "2025-04-30.basil",
  });
};

export const createOrGetExpressConnectAccountForUser = action({
  args: {
    stripeSecretKey: v.string(),
    userId: v.string(),
    email: v.optional(v.string()),
    businessType: v.optional(v.union(v.literal("individual"), v.literal("company"))),
    fullName: v.optional(v.string()),
    productDescription: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
    // Optional: platform metadata for debugging
    metadata: v.optional(v.any()),
  },
  returns: v.object({
    ok: v.boolean(),
    connectAccountId: v.string(),
  }),
  handler: async (ctx: any, args: any) => {
    const secretKey = String(args.stripeSecretKey ?? "").trim();
    if (!secretKey) throw new Error("Missing stripeSecretKey");
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");

    const stripe = createStripeClient(secretKey);

    const email = typeof args.email === "string" ? args.email.trim() : undefined;
    const businessType =
      args.businessType === "company" || args.businessType === "individual"
        ? args.businessType
        : "individual";

    const fullName = typeof args.fullName === "string" ? args.fullName.trim() : "";
    const nameParts = fullName ? fullName.split(/\s+/).filter(Boolean) : [];
    const firstName = nameParts.length >= 1 ? nameParts[0] : undefined;
    const lastName = nameParts.length >= 2 ? nameParts.slice(1).join(" ") : undefined;

    const productDescription =
      typeof args.productDescription === "string" ? args.productDescription.trim() : "";
    const websiteUrlRaw = typeof args.websiteUrl === "string" ? args.websiteUrl.trim() : "";
    let websiteUrl: string = "";
    if (websiteUrlRaw) {
      try {
        const parsed = new URL(websiteUrlRaw);
        const protocolOk = parsed.protocol === "https:" || parsed.protocol === "http:";
        const host = parsed.hostname.toLowerCase();
        const looksPublic =
          host !== "localhost" &&
          host !== "127.0.0.1" &&
          host !== "::1" &&
          host.includes(".");
        websiteUrl = protocolOk && looksPublic ? parsed.origin : "";
      } catch {
        websiteUrl = "";
      }
    }
    const supportEmail = typeof args.supportEmail === "string" ? args.supportEmail.trim() : "";

    const account = await stripe.accounts.create({
      type: "express",
      email: email || undefined,
      business_type: businessType,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      // Prefill whatever we can; Stripe may still require additional verification fields.
      ...(businessType === "individual"
        ? {
            individual: {
              ...(firstName ? { first_name: firstName } : {}),
              ...(lastName ? { last_name: lastName } : {}),
              ...(email ? { email } : {}),
            },
          }
        : {}),
      business_profile: {
        ...(productDescription ? { product_description: productDescription } : {}),
        ...(websiteUrl ? { url: websiteUrl } : {}),
        ...(supportEmail ? { support_email: supportEmail } : {}),
      },
      metadata: {
        ...(args.metadata && typeof args.metadata === "object" ? (args.metadata as any) : {}),
        userId,
      },
    });

    return { ok: true, connectAccountId: account.id };
  },
});

export const createConnectOnboardingLink = action({
  args: {
    stripeSecretKey: v.string(),
    connectAccountId: v.string(),
    refreshUrl: v.string(),
    returnUrl: v.string(),
  },
  returns: v.object({ ok: v.boolean(), url: v.string() }),
  handler: async (_ctx: any, args: any) => {
    const secretKey = String(args.stripeSecretKey ?? "").trim();
    if (!secretKey) throw new Error("Missing stripeSecretKey");
    const connectAccountId = String(args.connectAccountId ?? "").trim();
    if (!connectAccountId) throw new Error("Missing connectAccountId");
    const refreshUrl = String(args.refreshUrl ?? "").trim();
    const returnUrl = String(args.returnUrl ?? "").trim();
    if (!refreshUrl || !returnUrl) throw new Error("Missing refreshUrl/returnUrl");

    const stripe = createStripeClient(secretKey);
    const link = await stripe.accountLinks.create({
      account: connectAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });
    return { ok: true, url: link.url };
  },
});

export const deleteExpressConnectAccount = action({
  args: {
    stripeSecretKey: v.string(),
    connectAccountId: v.string(),
  },
  returns: v.object({
    ok: v.boolean(),
    deleted: v.boolean(),
  }),
  handler: async (_ctx: any, args: any) => {
    const secretKey = String(args.stripeSecretKey ?? "").trim();
    if (!secretKey) throw new Error("Missing stripeSecretKey");
    const connectAccountId = String(args.connectAccountId ?? "").trim();
    if (!connectAccountId) throw new Error("Missing connectAccountId");

    const stripe = createStripeClient(secretKey);
    const res = await stripe.accounts.del(connectAccountId);
    return { ok: true, deleted: Boolean((res as any)?.deleted) };
  },
});

export const getUpcomingSubscriptionDueCentsForUser = action({
  args: {
    stripeSecretKey: v.string(),
    userId: v.string(),
    currency: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    dueCents: v.number(),
  }),
  handler: async (ctx: any, args: any) => {
    const secretKey = String(args.stripeSecretKey ?? "").trim();
    if (!secretKey) throw new Error("Missing stripeSecretKey");
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");

    const stripe = createStripeClient(secretKey);
    const customerId = await ctx.runQuery(internalUntyped.internal.getStripeCustomerIdForUser, { userId });
    if (!customerId) return { ok: true, dueCents: 0 };

    // Take the first active subscription and compute upcoming invoice.
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const sub = subs.data[0];
    if (!sub) return { ok: true, dueCents: 0 };

    // Stripe SDK versions differ on whether `retrieveUpcoming` is typed.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const upcoming: any = await (stripe.invoices as any).retrieveUpcoming({
      customer: customerId,
      subscription: sub.id,
    });
    const due = typeof upcoming.amount_due === "number" ? upcoming.amount_due : 0;
    return { ok: true, dueCents: Math.max(0, due) };
  },
});

export const applyCustomerBalanceCredit = action({
  args: {
    stripeSecretKey: v.string(),
    userId: v.string(),
    amountCents: v.number(),
    currency: v.optional(v.string()),
    runId: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    balanceTransactionId: v.string(),
  }),
  handler: async (ctx: any, args: any) => {
    const secretKey = String(args.stripeSecretKey ?? "").trim();
    if (!secretKey) throw new Error("Missing stripeSecretKey");
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");
    const amountCents = clampCents(args.amountCents);
    if (amountCents <= 0) throw new Error("amountCents must be > 0");
    const currency = normalizeCurrency(args.currency);

    const stripe = createStripeClient(secretKey);
    const customerId = await ctx.runQuery(internalUntyped.internal.getStripeCustomerIdForUser, { userId });
    if (!customerId) throw new Error("No stripe customer for user");

    // Customer balance: negative amount is a credit (reduces amount due).
    const tx = await stripe.customers.createBalanceTransaction(customerId, {
      amount: -amountCents,
      currency,
      description: `Affiliate credit applied${args.runId ? ` (run ${String(args.runId)})` : ""}`,
      metadata: args.runId ? { runId: String(args.runId) } : undefined,
    });

    return { ok: true, balanceTransactionId: tx.id };
  },
});

export const createTransferToConnectedAccount = action({
  args: {
    stripeSecretKey: v.string(),
    connectAccountId: v.string(),
    userId: v.string(),
    amountCents: v.number(),
    currency: v.optional(v.string()),
    runId: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    transferId: v.string(),
  }),
  handler: async (ctx: any, args: any) => {
    const secretKey = String(args.stripeSecretKey ?? "").trim();
    if (!secretKey) throw new Error("Missing stripeSecretKey");
    const connectAccountId = String(args.connectAccountId ?? "").trim();
    if (!connectAccountId) throw new Error("Missing connectAccountId");
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");
    const amountCents = clampCents(args.amountCents);
    if (amountCents <= 0) throw new Error("amountCents must be > 0");
    const currency = normalizeCurrency(args.currency);

    const stripe = createStripeClient(secretKey);

    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency,
      destination: connectAccountId,
      metadata: {
        ...(args.runId ? { runId: String(args.runId) } : {}),
        userId,
      },
    });

    return { ok: true, transferId: transfer.id };
  },
});

