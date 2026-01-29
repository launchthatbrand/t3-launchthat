import { v } from "convex/values";
import { mutation } from "./_generated/server";

import {
  evaluateRewardsForReferrerImpl,
  maybeGrantSubscriptionDiscountBenefitImpl,
} from "./rewards/actions";
import { insertAffiliateLog } from "./logs";

export const recordPaidConversion = mutation({
  args: {
    kind: v.union(v.literal("paid_subscription"), v.literal("paid_order")),
    externalId: v.string(),
    referredUserId: v.string(),
    amountCents: v.number(),
    currency: v.string(),
    occurredAt: v.optional(v.number()),
    referrerIsPro: v.optional(v.boolean()),
    proDiscountAmountOffCentsMonthly: v.optional(v.number()),
  },
  returns: v.object({
    ok: v.boolean(),
    created: v.boolean(),
    referrerUserId: v.union(v.string(), v.null()),
    discountGranted: v.optional(v.boolean()),
  }),
  handler: async (ctx, args) => {
    const kind = args.kind;
    const externalId = String(args.externalId ?? "").trim();
    const referredUserId = String(args.referredUserId ?? "").trim();
    if (!externalId) throw new Error("Missing externalId");
    if (!referredUserId) throw new Error("Missing referredUserId");

    const occurredAt =
      typeof args.occurredAt === "number" ? Number(args.occurredAt) : Date.now();

    const attribution = await ctx.db
      .query("affiliateAttributions")
      .withIndex("by_referredUserId", (q) => q.eq("referredUserId", referredUserId))
      .first();
    if (!attribution) {
      return { ok: true, created: false, referrerUserId: null };
    }

    const expiresAt =
      typeof (attribution as any).expiresAt === "number"
        ? Number((attribution as any).expiresAt)
        : 0;
    if (expiresAt > 0 && occurredAt > expiresAt) {
      return { ok: true, created: false, referrerUserId: null };
    }

    const referrerUserId = String((attribution as any).referrerUserId ?? "");
    if (!referrerUserId || referrerUserId === referredUserId) {
      return { ok: true, created: false, referrerUserId: null };
    }

    const existing = await ctx.db
      .query("affiliateConversions")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_externalId_and_kind", (q: any) =>
        q.eq("externalId", externalId).eq("kind", kind),
      )
      .unique();
    if (existing) {
      return { ok: true, created: false, referrerUserId };
    }

    // Avoid counting renewals: only the first paid conversion per user+kind counts.
    const priorForUser = await ctx.db
      .query("affiliateConversions")
      .withIndex("by_referredUserId", (q) => q.eq("referredUserId", referredUserId))
      .order("desc")
      .take(100);
    for (const row of priorForUser) {
      if ((row as any).kind === kind) {
        return { ok: true, created: false, referrerUserId };
      }
    }

    await ctx.db.insert("affiliateConversions", {
      kind,
      externalId,
      referredUserId,
      referrerUserId,
      amountCents: Math.max(0, Math.round(args.amountCents)),
      currency: String(args.currency ?? "USD").toUpperCase(),
      occurredAt,
    });

    // Denormalize "first paid conversion" timestamp onto attribution for fast recruit listings.
    if (typeof (attribution as any)._id !== "undefined") {
      const existingFirst =
        typeof (attribution as any).firstPaidConversionAt === "number"
          ? Number((attribution as any).firstPaidConversionAt)
          : null;
      const nextFirst =
        existingFirst === null ? occurredAt : Math.min(existingFirst, occurredAt);
      if (existingFirst === null || nextFirst !== existingFirst) {
        await ctx.db.patch((attribution as any)._id, {
          firstPaidConversionAt: nextFirst,
        });
      }
    }

    await insertAffiliateLog(ctx as any, {
      ts: occurredAt,
      kind: "conversion_recorded",
      ownerUserId: referrerUserId,
      message: `Paid conversion recorded (${kind})`,
      referredUserId,
      externalId,
      amountCents: Math.max(0, Math.round(args.amountCents)),
      currency: String(args.currency ?? "USD").toUpperCase(),
    });

    await evaluateRewardsForReferrerImpl(ctx as any, { referrerUserId });

    let discountGranted: boolean | undefined;
    if (args.referrerIsPro === true) {
      discountGranted = await maybeGrantSubscriptionDiscountBenefitImpl(ctx as any, {
        userId: referrerUserId,
        amountOffCentsMonthly:
          typeof args.proDiscountAmountOffCentsMonthly === "number"
            ? Math.max(0, Math.round(args.proDiscountAmountOffCentsMonthly))
            : 1000,
      });
    }

    return { ok: true, created: true, referrerUserId, discountGranted };
  },
});

