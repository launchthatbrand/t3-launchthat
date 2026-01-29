/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-return
*/

import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const componentsUntyped: any = require("../_generated/api").components;

const requirePlatformAdmin = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();

  // Local dev ergonomics: allow platform tooling without identity in non-prod.
  if (!identity) {
    if (process.env.NODE_ENV !== "production") return null;
    throw new Error("Unauthorized");
  }

  let viewer =
    (await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first()) ?? null;

  if (!viewer && typeof identity.subject === "string" && identity.subject.trim()) {
    viewer = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first();
  }

  if (!viewer) throw new Error("Unauthorized");
  if (!viewer.isAdmin) throw new Error("Forbidden");
  return viewer;
};

const dayMs = 24 * 60 * 60 * 1000;

export const getSummary = query({
  args: {
    daysBack: v.optional(v.number()),
  },
  returns: v.object({
    daysBack: v.number(),
    affiliates: v.object({
      total: v.number(),
      active: v.number(),
      disabled: v.number(),
    }),
    activity: v.object({
      clicks: v.number(),
      signups: v.number(),
      activations: v.number(),
      conversions: v.number(),
      creditEvents: v.number(),
      benefitsGranted: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const daysBackRaw = typeof args.daysBack === "number" ? args.daysBack : 30;
    const daysBack = Math.max(1, Math.min(180, Math.floor(daysBackRaw)));
    const sinceMs = Date.now() - daysBack * dayMs;

    const profilesUnknown = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.admin.listAffiliateProfiles,
      { limit: 5000 },
    );
    const profiles = Array.isArray(profilesUnknown) ? profilesUnknown : [];

    let active = 0;
    let disabled = 0;
    for (const p of profiles as any[]) {
      if (p && p.status === "disabled") disabled++;
      else active++;
    }

    const logsUnknown = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.admin.listAffiliateLogs,
      {
        fromMs: sinceMs,
        limit: 5000,
      },
    );
    const logs = Array.isArray(logsUnknown) ? logsUnknown : [];

    let clicks = 0;
    let signups = 0;
    let activations = 0;
    let conversions = 0;
    let creditEvents = 0;
    let benefitsGranted = 0;

    for (const l of logs as any[]) {
      const kind = typeof l?.kind === "string" ? l.kind : "";
      if (kind === "click_logged") clicks++;
      else if (kind === "signup_attributed") signups++;
      else if (kind === "activated") activations++;
      else if (kind === "conversion_recorded") conversions++;
      else if (kind === "credit_event") creditEvents++;
      else if (kind === "benefit_granted") benefitsGranted++;
    }

    return {
      daysBack,
      affiliates: {
        total: profiles.length,
        active,
        disabled,
      },
      activity: {
        clicks,
        signups,
        activations,
        conversions,
        creditEvents,
        benefitsGranted,
      },
    };
  },
});

export const listProfiles = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      userId: v.string(),
      referralCode: v.string(),
      status: v.union(v.literal("active"), v.literal("disabled")),
      acceptedTermsAt: v.optional(v.number()),
      acceptedTermsVersion: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const rowsUnknown = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.admin.listAffiliateProfiles,
      { limit: typeof args.limit === "number" ? args.limit : 500 },
    );
    const rows = Array.isArray(rowsUnknown) ? (rowsUnknown as any[]) : [];
    return rows.map((row) => ({
      userId: String(row?.userId ?? ""),
      referralCode: String(row?.referralCode ?? ""),
      status: row?.status === "disabled" ? ("disabled" as const) : ("active" as const),
      acceptedTermsAt:
        typeof row?.acceptedTermsAt === "number" ? Number(row.acceptedTermsAt) : undefined,
      acceptedTermsVersion:
        typeof row?.acceptedTermsVersion === "string" ? String(row.acceptedTermsVersion) : undefined,
      createdAt: typeof row?.createdAt === "number" ? Number(row.createdAt) : 0,
      updatedAt: typeof row?.updatedAt === "number" ? Number(row.updatedAt) : 0,
    }));
  },
});

export const listLogs = query({
  args: { limit: v.optional(v.number()), fromMs: v.optional(v.number()) },
  returns: v.array(
    v.object({
      ts: v.number(),
      kind: v.string(),
      ownerUserId: v.string(),
      message: v.string(),
      data: v.optional(v.any()),
      referralCode: v.optional(v.string()),
      visitorId: v.optional(v.string()),
      referredUserId: v.optional(v.string()),
      externalId: v.optional(v.string()),
      amountCents: v.optional(v.number()),
      currency: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const rowsUnknown = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.admin.listAffiliateLogs,
      {
        limit: typeof args.limit === "number" ? args.limit : 200,
        fromMs: typeof args.fromMs === "number" ? args.fromMs : undefined,
      },
    );
    return Array.isArray(rowsUnknown) ? (rowsUnknown as any[]) : [];
  },
});

export const getAffiliateAdminView = query({
  args: { userId: v.string() },
  returns: v.object({
    userId: v.string(),
    profile: v.union(
      v.null(),
      v.object({
        userId: v.string(),
        referralCode: v.string(),
        status: v.union(v.literal("active"), v.literal("disabled")),
        acceptedTermsAt: v.optional(v.number()),
        acceptedTermsVersion: v.optional(v.string()),
        createdAt: v.number(),
        updatedAt: v.number(),
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
    creditEvents: v.array(
      v.object({
        amountCents: v.number(),
        currency: v.string(),
        reason: v.string(),
        createdAt: v.number(),
        referredUserId: v.optional(v.string()),
        conversionId: v.optional(v.string()),
      }),
    ),
    logs: v.array(
      v.object({
        ts: v.number(),
        kind: v.string(),
        ownerUserId: v.string(),
        message: v.string(),
        data: v.optional(v.any()),
        referralCode: v.optional(v.string()),
        visitorId: v.optional(v.string()),
        referredUserId: v.optional(v.string()),
        externalId: v.optional(v.string()),
        amountCents: v.optional(v.number()),
        currency: v.optional(v.string()),
      }),
    ),
    recruits: v.array(
      v.object({
        referredUserId: v.string(),
        name: v.string(),
        attributedAt: v.number(),
        activatedAt: v.optional(v.number()),
        firstPaidConversionAt: v.optional(v.number()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");

    const profileUnknown = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.admin.getAffiliateProfileByUserId,
      { userId },
    );
    const profile = profileUnknown ?? null;

    const statsUnknown = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.profiles.getMyAffiliateStats,
      { userId },
    );
    const stats = statsUnknown as any;

    const benefitsUnknown = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.rewards.queries.listActiveBenefitsForUser,
      { userId },
    );
    const benefits = Array.isArray(benefitsUnknown) ? (benefitsUnknown as any[]) : [];

    const creditEventsUnknown = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.admin.listAffiliateCreditEventsForUser,
      { userId, limit: 200 },
    );
    const creditEvents = Array.isArray(creditEventsUnknown) ? (creditEventsUnknown as any[]) : [];

    const logsUnknown = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.admin.listAffiliateLogsForUser,
      { ownerUserId: userId, limit: 200 },
    );
    const logs = Array.isArray(logsUnknown) ? (logsUnknown as any[]) : [];

    const recruitsUnknown = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.admin.listReferredUsersForReferrer,
      { referrerUserId: userId, limit: 500 },
    );
    const recruitsRaw = Array.isArray(recruitsUnknown) ? (recruitsUnknown as any[]) : [];

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
      return `User ${normalized.slice(-6)}`;
    };

    const recruits: Array<{
      referredUserId: string;
      name: string;
      attributedAt: number;
      activatedAt?: number;
      firstPaidConversionAt?: number;
    }> = [];

    for (const r of recruitsRaw) {
      const referredUserId = String(r?.referredUserId ?? "").trim();
      if (!referredUserId) continue;
      recruits.push({
        referredUserId,
        name: await resolveDisplayName(referredUserId),
        attributedAt: typeof r?.attributedAt === "number" ? Number(r.attributedAt) : 0,
        activatedAt: typeof r?.activatedAt === "number" ? Number(r.activatedAt) : undefined,
        firstPaidConversionAt:
          typeof r?.firstPaidConversionAt === "number" ? Number(r.firstPaidConversionAt) : undefined,
      });
    }

    return {
      userId,
      profile,
      stats,
      benefits,
      creditEvents,
      logs,
      recruits,
    };
  },
});

export const setAffiliateStatus = mutation({
  args: {
    userId: v.string(),
    status: v.union(v.literal("active"), v.literal("disabled")),
  },
  returns: v.object({
    ok: v.boolean(),
    userId: v.string(),
    status: v.union(v.literal("active"), v.literal("disabled")),
  }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const resUnknown = await ctx.runMutation(
      componentsUntyped.launchthat_affiliates.profiles.setAffiliateProfileStatus,
      {
        userId: String(args.userId ?? ""),
        status: args.status,
      },
    );
    return resUnknown as any;
  },
});

