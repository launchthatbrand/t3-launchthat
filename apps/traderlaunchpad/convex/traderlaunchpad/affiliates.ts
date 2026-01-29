import { v } from "convex/values";
import { action, mutation, query } from "../_generated/server";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const componentsUntyped: any = require("../_generated/api").components;

const readUserKey = async (ctx: any): Promise<string | null> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const tokenIdentifier =
    typeof identity.tokenIdentifier === "string" ? identity.tokenIdentifier.trim() : "";
  if (tokenIdentifier) return tokenIdentifier;
  const subject = typeof identity.subject === "string" ? identity.subject.trim() : "";
  return subject || null;
};

export const recordClick = mutation({
  args: {
    referralCode: v.string(),
    visitorId: v.string(),
    landingPath: v.optional(v.string()),
    referrer: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(componentsUntyped.launchthat_affiliates.tracking.recordClick, {
      referralCode: args.referralCode,
      visitorId: args.visitorId,
      landingPath: args.landingPath,
      referrer: args.referrer,
    });
    return null;
  },
});

/**
 * Called post-signup/login to attribute the current user to a captured `visitorId` / `referralCode`.
 * First-touch wins inside the affiliates component.
 */
export const attributeMySignup = mutation({
  args: {
    visitorId: v.optional(v.string()),
    referralCode: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const referredUserId = await readUserKey(ctx);
    if (!referredUserId) return null;
    return await ctx.runMutation(
      componentsUntyped.launchthat_affiliates.tracking.attributeSignup,
      {
        referredUserId,
        visitorId: args.visitorId,
        referralCode: args.referralCode,
      },
    );
  },
});

/**
 * Mark the current user as activated (MVP: a separate client call can invoke this
 * after email verification).
 */
export const markMyActivated = mutation({
  args: { source: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const referredUserId = await readUserKey(ctx);
    if (!referredUserId) return null;
    return await ctx.runMutation(componentsUntyped.launchthat_affiliates.tracking.markActivated, {
      referredUserId,
      source: args.source === "manual" ? "manual" : "email_verified",
    });
  },
});

export const getMyAffiliateDashboard = action({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      profile: v.union(
        v.null(),
        v.object({
          userId: v.string(),
          referralCode: v.string(),
          status: v.union(v.literal("active"), v.literal("disabled")),
        }),
      ),
      stats: v.object({
        userId: v.string(),
        referralCode: v.union(v.string(), v.null()),
        clicks30d: v.number(),
        signups30d: v.number(),
        activations30d: v.number(),
        conversions30d: v.number(),
        creditBalanceCents: v.number(),
      }),
      benefits: v.array(
        v.object({
          kind: v.string(),
          value: v.any(),
          startsAt: v.number(),
          endsAt: v.optional(v.number()),
          status: v.string(),
        }),
      ),
    }),
  ),
  handler: async (ctx) => {
    const userId = await readUserKey(ctx);
    if (!userId) return null;

    const profileUnknown: any = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.profiles.getAffiliateProfileByUserId,
      { userId },
    );
    const profile = profileUnknown ?? null;

    const stats: any = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.profiles.getMyAffiliateStats,
      { userId },
    );

    const benefitsUnknown: any = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.rewards.queries.listActiveBenefitsForUser,
      { userId },
    );

    return {
      profile,
      stats,
      benefits: Array.isArray(benefitsUnknown) ? benefitsUnknown : [],
    };
  },
});

export const becomeAffiliate = mutation({
  args: {
    termsVersion: v.string(),
  },
  returns: v.object({
    userId: v.string(),
    referralCode: v.string(),
    status: v.union(v.literal("active"), v.literal("disabled")),
  }),
  handler: async (ctx, args) => {
    const userId = await readUserKey(ctx);
    if (!userId) throw new Error("Unauthorized");
    const termsVersion = String(args.termsVersion ?? "").trim();
    if (!termsVersion) throw new Error("Missing termsVersion");

    const res: any = await ctx.runMutation(
      componentsUntyped.launchthat_affiliates.profiles.createOrGetMyAffiliateProfile,
      {
        userId,
        acceptTerms: true,
        termsVersion,
      },
    );
    return res;
  },
});

export const listMyRecruits = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      referredUserId: v.string(),
      name: v.string(),
      attributedAt: v.number(),
      activatedAt: v.optional(v.number()),
      firstPaidConversionAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const referrerUserId = await readUserKey(ctx);
    if (!referrerUserId) throw new Error("Unauthorized");

    const limitRaw = typeof args.limit === "number" ? args.limit : 200;
    const limit = Math.max(1, Math.min(5000, Math.floor(limitRaw)));

    const rowsUnknown: any = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.referrals.queries.listMyReferredUsers,
      {
        referrerUserId,
        limit,
      },
    );
    const rows = Array.isArray(rowsUnknown) ? (rowsUnknown as any[]) : [];

    const resolveDisplayName = async (clerkId: string): Promise<string> => {
      const normalized = String(clerkId ?? "").trim();
      if (!normalized) return "User";
      const u = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", normalized))
        .first();
      const name =
        u && typeof (u as any).name === "string" ? String((u as any).name).trim() : "";
      if (name) return name;
      // Fallback: anonymized label (no email).
      return `User ${normalized.slice(-6)}`;
    };

    const out: Array<{
      referredUserId: string;
      name: string;
      attributedAt: number;
      activatedAt?: number;
      firstPaidConversionAt?: number;
    }> = [];

    for (const r of rows) {
      const referredUserId = String(r?.referredUserId ?? "").trim();
      if (!referredUserId) continue;
      const name = await resolveDisplayName(referredUserId);
      out.push({
        referredUserId,
        name,
        attributedAt: typeof r?.attributedAt === "number" ? Number(r.attributedAt) : 0,
        activatedAt: typeof r?.activatedAt === "number" ? Number(r.activatedAt) : undefined,
        firstPaidConversionAt:
          typeof r?.firstPaidConversionAt === "number"
            ? Number(r.firstPaidConversionAt)
            : undefined,
      });
    }

    return out;
  },
});

export const listMyCreditEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      amountCents: v.number(),
      currency: v.string(),
      reason: v.string(),
      createdAt: v.number(),
      referredUserId: v.optional(v.string()),
      conversionId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await readUserKey(ctx);
    if (!userId) throw new Error("Unauthorized");

    const limitRaw = typeof args.limit === "number" ? args.limit : 200;
    const limit = Math.max(1, Math.min(2000, Math.floor(limitRaw)));

    const rowsUnknown: any = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.admin.listAffiliateCreditEventsForUser,
      { userId, limit },
    );
    return Array.isArray(rowsUnknown) ? (rowsUnknown as any[]) : [];
  },
});

