import { v } from "convex/values";
import { mutation } from "../_generated/server";

import { insertAffiliateLog } from "../logs";

const DEFAULT_ACTIVATION_MILESTONE_COUNT = 5;
const DEFAULT_ACTIVATION_REWARD_CENTS = 1000;
const DEFAULT_CURRENCY = "USD";
const DEFAULT_PRO_DISCOUNT_AMOUNT_OFF_CENTS_MONTHLY = 1000;

const getBalanceCents = async (ctx: any, userId: string): Promise<number> => {
  const rows = await ctx.db
    .query("affiliateCreditEvents")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_userId_and_createdAt", (q: any) => q.eq("userId", userId))
    .order("desc")
    .take(5000);
  let balance = 0;
  for (const row of rows) {
    const amount =
      typeof (row as any).amountCents === "number" ? Number((row as any).amountCents) : 0;
    balance += amount;
  }
  return balance;
};

const grantCreditOnceImpl = async (
  ctx: any,
  args: {
    userId: string;
    kind?: string;
    amountCents: number;
    currency: string;
    reason: string;
    externalEventId?: string;
    source?: string;
    referrerUserId?: string;
    referredUserId?: string;
    conversionId?: string;
  },
): Promise<boolean> => {
  const existing = await ctx.db
    .query("affiliateCreditEvents")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_userId_and_reason", (q: any) =>
      q.eq("userId", args.userId).eq("reason", args.reason),
    )
    .first();
  if (existing) return false;

  const createdAt = Date.now();
  await ctx.db.insert("affiliateCreditEvents", {
    userId: args.userId,
    kind: String(args.kind ?? "promo_credit"),
    amountCents: args.amountCents,
    currency: args.currency,
    reason: args.reason,
    externalEventId: String(args.externalEventId ?? `reason:${args.reason}`),
    source: args.source,
    referrerUserId: args.referrerUserId,
    referredUserId: args.referredUserId,
    conversionId: args.conversionId,
    createdAt,
  });

  await insertAffiliateLog(ctx as any, {
    ts: createdAt,
    kind: "credit_event",
    ownerUserId: args.userId,
    message: `Credit event: ${args.reason}`,
    referredUserId: args.referredUserId,
    externalId: args.conversionId,
    amountCents: args.amountCents,
    currency: args.currency,
    data: {
      reason: args.reason,
      referrerUserId: args.referrerUserId,
      conversionId: args.conversionId,
    },
  });

  return true;
};

export const maybeGrantSubscriptionDiscountBenefitImpl = async (
  ctx: any,
  args: { userId: string; amountOffCentsMonthly: number },
): Promise<boolean> => {
  const existing = await ctx.db
    .query("affiliateBenefits")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_userId_and_kind", (q: any) =>
      q.eq("userId", args.userId).eq("kind", "subscription_discount"),
    )
    .first();
  if (existing && (existing as any).status === "active") return false;

  const now = Date.now();
  await ctx.db.insert("affiliateBenefits", {
    userId: args.userId,
    kind: "subscription_discount",
    value: { amountOffCentsMonthly: args.amountOffCentsMonthly },
    startsAt: now,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  await insertAffiliateLog(ctx as any, {
    ts: now,
    kind: "benefit_granted",
    ownerUserId: args.userId,
    message: "Benefit granted: subscription_discount",
    data: {
      kind: "subscription_discount",
      value: { amountOffCentsMonthly: args.amountOffCentsMonthly },
    },
  });
  return true;
};

export const evaluateRewardsForReferrerImpl = async (
  ctx: any,
  args: { referrerUserId: string },
): Promise<void> => {
  const referrerUserId = String(args.referrerUserId ?? "").trim();
  if (!referrerUserId) return;

  const attributions = await ctx.db
    .query("affiliateAttributions")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_referrerUserId_and_attributedAt", (q: any) =>
      q.eq("referrerUserId", referrerUserId),
    )
    .order("desc")
    .take(5000);

  const referredUserIds: string[] = [];
  for (const row of attributions) {
    const referredUserId = String((row as any).referredUserId ?? "");
    if (referredUserId) referredUserIds.push(referredUserId);
  }

  let activatedCount = 0;
  for (const referredUserId of referredUserIds) {
    const activation = await ctx.db
      .query("affiliateActivations")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_referredUserId", (q: any) => q.eq("referredUserId", referredUserId))
      .first();
    if (activation) activatedCount++;
  }

  if (activatedCount >= DEFAULT_ACTIVATION_MILESTONE_COUNT) {
    const reason = `activation_milestone_${DEFAULT_ACTIVATION_MILESTONE_COUNT}`;
    await grantCreditOnceImpl(ctx, {
      userId: referrerUserId,
      amountCents: DEFAULT_ACTIVATION_REWARD_CENTS,
      currency: DEFAULT_CURRENCY,
      reason,
    });
  }
};

export const evaluateRewardsForReferrer = mutation({
  args: { referrerUserId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await evaluateRewardsForReferrerImpl(ctx as any, {
      referrerUserId: String(args.referrerUserId ?? "").trim(),
    });
    return null;
  },
});

export const grantSubscriptionDiscountBenefit = mutation({
  args: {
    userId: v.string(),
    amountOffCentsMonthly: v.optional(v.number()),
  },
  returns: v.object({ ok: v.boolean(), created: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");
    const created = await maybeGrantSubscriptionDiscountBenefitImpl(ctx as any, {
      userId,
      amountOffCentsMonthly:
        typeof args.amountOffCentsMonthly === "number"
          ? Math.max(0, Math.round(args.amountOffCentsMonthly))
          : DEFAULT_PRO_DISCOUNT_AMOUNT_OFF_CENTS_MONTHLY,
    });
    return { ok: true, created };
  },
});

export const redeemCredit = mutation({
  args: {
    userId: v.string(),
    amountCents: v.number(),
    currency: v.optional(v.string()),
    reason: v.optional(v.string()),
  },
  returns: v.object({ ok: v.boolean(), balanceCents: v.number() }),
  handler: async (ctx, args) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");

    const amountCents = Math.max(0, Math.round(args.amountCents));
    if (amountCents <= 0) throw new Error("amountCents must be > 0");

    const currency = String(args.currency ?? DEFAULT_CURRENCY).toUpperCase();
    const balance = await getBalanceCents(ctx as any, userId);
    if (balance < amountCents) throw new Error("Insufficient balance");

    const createdAt = Date.now();
    await ctx.db.insert("affiliateCreditEvents", {
      userId,
      kind: "redeem",
      amountCents: -amountCents,
      currency,
      reason: String(args.reason ?? "redeem"),
      externalEventId: `redeem:${createdAt}`,
      createdAt,
    });

    await insertAffiliateLog(ctx as any, {
      ts: createdAt,
      kind: "credit_event",
      ownerUserId: userId,
      message: `Credit redeemed: ${String(args.reason ?? "redeem")}`,
      amountCents: -amountCents,
      currency,
      data: { reason: String(args.reason ?? "redeem") },
    });

    const nextBalance = await getBalanceCents(ctx as any, userId);
    return { ok: true, balanceCents: nextBalance };
  },
});

