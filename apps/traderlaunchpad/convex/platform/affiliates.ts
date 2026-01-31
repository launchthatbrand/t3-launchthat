/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-return
*/

import { v } from "convex/values";
import { query, mutation } from "../_generated/server";
import { requirePlatformAdmin } from "../traderlaunchpad/lib/resolve";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const componentsUntyped: any = require("../_generated/api").components;

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
    sponsorLink: v.union(
      v.null(),
      v.object({
        userId: v.string(),
        sponsorUserId: v.string(),
        createdAt: v.number(),
        createdSource: v.string(),
        updatedAt: v.optional(v.number()),
        updatedBy: v.optional(v.string()),
      }),
    ),
    directDownlineCount: v.number(),
    directDownline: v.array(
      v.object({
        userId: v.string(),
        name: v.string(),
        joinedAt: v.number(),
        createdSource: v.string(),
      }),
    ),
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
    payoutAccount: v.union(
      v.null(),
      v.object({
        userId: v.string(),
        provider: v.string(),
        connectAccountId: v.string(),
        status: v.string(),
      }),
    ),
    payoutPreference: v.union(
      v.null(),
      v.object({
        userId: v.string(),
        policy: v.string(),
        currency: v.string(),
        minPayoutCents: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");

    const sponsorLinkUnknown = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.network.queries.getSponsorLinkForUser,
      { userId },
    );
    const sponsorLink =
      sponsorLinkUnknown && typeof sponsorLinkUnknown === "object"
        ? {
            userId: String((sponsorLinkUnknown as any).userId ?? ""),
            sponsorUserId: String((sponsorLinkUnknown as any).sponsorUserId ?? ""),
            createdAt:
              typeof (sponsorLinkUnknown as any).createdAt === "number"
                ? Number((sponsorLinkUnknown as any).createdAt)
                : 0,
            createdSource: String((sponsorLinkUnknown as any).createdSource ?? ""),
            updatedAt:
              typeof (sponsorLinkUnknown as any).updatedAt === "number"
                ? Number((sponsorLinkUnknown as any).updatedAt)
                : undefined,
            updatedBy:
              typeof (sponsorLinkUnknown as any).updatedBy === "string"
                ? String((sponsorLinkUnknown as any).updatedBy)
                : undefined,
          }
        : null;

    const downlineUnknown = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.network.queries.listDirectDownlineForSponsor,
      { sponsorUserId: userId, limit: 5000 },
    );
    const downlineRaw = Array.isArray(downlineUnknown) ? (downlineUnknown as any[]) : [];
    const directDownlineCount = downlineRaw.length;

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

    const stripClerkIssuerPrefix = (userKey: string): string => {
      const s = String(userKey ?? "").trim();
      const pipeIdx = s.indexOf("|");
      if (pipeIdx === -1) return s;
      const tail = s.slice(pipeIdx + 1).trim();
      return tail || s;
    };

    const resolveDisplayName = async (userKey: string): Promise<string> => {
      const normalized = String(userKey ?? "").trim();
      if (!normalized) return "User";
      const clerkId = stripClerkIssuerPrefix(normalized);

      const byClerk = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
        .first();
      const name1 =
        byClerk && typeof (byClerk as any).name === "string"
          ? String((byClerk as any).name).trim()
          : "";
      if (name1) return name1;

      const byToken = await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", normalized))
        .first();
      const name2 =
        byToken && typeof (byToken as any).name === "string"
          ? String((byToken as any).name).trim()
          : "";
      if (name2) return name2;

      return `User ${clerkId.slice(-6)}`;
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

    const directDownline: Array<{
      userId: string;
      name: string;
      joinedAt: number;
      createdSource: string;
    }> = [];
    for (const r of downlineRaw) {
      const downlineUserId = String(r?.userId ?? "").trim();
      if (!downlineUserId) continue;
      directDownline.push({
        userId: downlineUserId,
        name: await resolveDisplayName(downlineUserId),
        joinedAt: typeof r?.createdAt === "number" ? Number(r.createdAt) : 0,
        createdSource: String(r?.createdSource ?? ""),
      });
    }

    const payoutAccountUnknown = await ctx.runQuery(
      componentsUntyped.launchthat_ecommerce.payouts.queries.getPayoutAccount,
      { userId, provider: "stripe" },
    );
    const payoutAccount =
      payoutAccountUnknown && typeof payoutAccountUnknown === "object"
        ? {
            userId: String((payoutAccountUnknown as any).userId ?? ""),
            provider: String((payoutAccountUnknown as any).provider ?? ""),
            connectAccountId: String((payoutAccountUnknown as any).connectAccountId ?? ""),
            status: String((payoutAccountUnknown as any).status ?? ""),
          }
        : null;

    const payoutPreferenceUnknown = await ctx.runQuery(
      componentsUntyped.launchthat_ecommerce.payouts.queries.getPayoutPreference,
      { userId },
    );
    const payoutPreference =
      payoutPreferenceUnknown && typeof payoutPreferenceUnknown === "object"
        ? {
            userId: String((payoutPreferenceUnknown as any).userId ?? ""),
            policy: String((payoutPreferenceUnknown as any).policy ?? ""),
            currency: String((payoutPreferenceUnknown as any).currency ?? "USD").toUpperCase(),
            minPayoutCents:
              typeof (payoutPreferenceUnknown as any).minPayoutCents === "number"
                ? Number((payoutPreferenceUnknown as any).minPayoutCents)
                : 0,
          }
        : null;

    return {
      userId,
      sponsorLink,
      directDownlineCount,
      directDownline,
      profile,
      stats,
      benefits,
      creditEvents,
      logs,
      recruits,
      payoutAccount,
      payoutPreference,
    };
  },
});

export const setAffiliateSponsor = mutation({
  args: {
    userId: v.string(),
    sponsorReferralCode: v.optional(v.string()),
    sponsorUserId: v.optional(v.string()),
    clear: v.optional(v.boolean()),
  },
  returns: v.object({
    ok: v.boolean(),
    userId: v.string(),
    sponsorUserId: v.union(v.string(), v.null()),
    previousSponsorUserId: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const viewer: any = await requirePlatformAdmin(ctx);
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");

    const clear = args.clear === true;
    let sponsorUserId: string | null = null;
    if (!clear) {
      const fromUserId = typeof args.sponsorUserId === "string" ? args.sponsorUserId.trim() : "";
      if (fromUserId) sponsorUserId = fromUserId;

      const fromCode =
        typeof args.sponsorReferralCode === "string" ? args.sponsorReferralCode.trim().toLowerCase() : "";
      if (!sponsorUserId && fromCode) {
        const profileUnknown = await ctx.runQuery(
          componentsUntyped.launchthat_affiliates.profiles.getAffiliateProfileByReferralCode,
          { referralCode: fromCode },
        );
        if (profileUnknown && typeof profileUnknown === "object") {
          sponsorUserId = String((profileUnknown as any).userId ?? "").trim() || null;
        }
      }
    }

    const resUnknown = await ctx.runMutation(
      componentsUntyped.launchthat_affiliates.network.mutations.setSponsorForUserAdmin,
      {
        userId,
        sponsorUserId,
        adminUserId: typeof viewer?.clerkId === "string" ? viewer.clerkId : "dev",
      },
    );
    return resUnknown as any;
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

const AFFILIATE_SCOPE = { scopeType: "app" as const, scopeId: "traderlaunchpad" as const };

export const getMlmSettings = query({
  args: {},
  returns: v.object({
    scopeType: v.union(v.literal("site"), v.literal("org"), v.literal("app")),
    scopeId: v.string(),
    mlmEnabled: v.boolean(),
    directCommissionBps: v.number(),
    sponsorOverrideBps: v.number(),
    updatedAt: v.number(),
  }),
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);
    const resUnknown = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.admin.getProgramSettings,
      AFFILIATE_SCOPE,
    );
    return resUnknown as any;
  },
});

export const setMlmSettings = mutation({
  args: {
    mlmEnabled: v.boolean(),
    directCommissionBps: v.number(),
    sponsorOverrideBps: v.number(),
  },
  returns: v.object({
    ok: v.boolean(),
    scopeType: v.union(v.literal("site"), v.literal("org"), v.literal("app")),
    scopeId: v.string(),
    mlmEnabled: v.boolean(),
    directCommissionBps: v.number(),
    sponsorOverrideBps: v.number(),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const resUnknown = await ctx.runMutation(
      componentsUntyped.launchthat_affiliates.admin.upsertProgramSettings,
      {
        ...AFFILIATE_SCOPE,
        mlmEnabled: args.mlmEnabled,
        directCommissionBps: args.directCommissionBps,
        sponsorOverrideBps: args.sponsorOverrideBps,
      },
    );
    return resUnknown as any;
  },
});

const startOfMonthUtc = (ms: number): number => {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0);
};

export const getRevenue = query({
  args: { monthsBack: v.optional(v.number()) },
  returns: v.object({
    monthsBack: v.number(),
    allTimeRevenueCents: v.number(),
    byMonth: v.array(v.object({ monthStartMs: v.number(), revenueCents: v.number() })),
  }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const monthsBackRaw = typeof args.monthsBack === "number" ? args.monthsBack : 12;
    const monthsBack = Math.max(1, Math.min(36, Math.floor(monthsBackRaw)));

    const now = Date.now();
    const currentMonthStart = startOfMonthUtc(now);
    const cur = new Date(currentMonthStart);
    const fromMonthStart = Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() - (monthsBack - 1), 1, 0, 0, 0, 0);

    const conversionsUnknown = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.admin.listAffiliateConversions,
      { fromMs: fromMonthStart, limit: 20000 },
    );
    const conversions = Array.isArray(conversionsUnknown) ? (conversionsUnknown as any[]) : [];

    const byMonthMap = new Map<number, number>();
    for (let i = 0; i < monthsBack; i++) {
      const monthStart = Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() - (monthsBack - 1 - i), 1, 0, 0, 0, 0);
      byMonthMap.set(monthStart, 0);
    }

    for (const c of conversions) {
      const ts = typeof c?.occurredAt === "number" ? Number(c.occurredAt) : 0;
      const amt = typeof c?.amountCents === "number" ? Math.max(0, Math.round(c.amountCents)) : 0;
      if (!ts || !amt) continue;
      const monthStart = startOfMonthUtc(ts);
      if (byMonthMap.has(monthStart)) byMonthMap.set(monthStart, (byMonthMap.get(monthStart) ?? 0) + amt);
    }

    // All-time revenue: bounded scan (fine for now since there’s no historical backlog).
    const allUnknown = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.admin.listAffiliateConversions,
      { fromMs: 0, limit: 20000 },
    );
    const all = Array.isArray(allUnknown) ? (allUnknown as any[]) : [];
    let allTimeRevenueCents = 0;
    for (const c of all) {
      if (typeof c?.amountCents === "number") allTimeRevenueCents += Math.max(0, Math.round(c.amountCents));
    }

    const byMonth = Array.from(byMonthMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([monthStartMs, revenueCents]) => ({ monthStartMs, revenueCents }));

    return { monthsBack, allTimeRevenueCents, byMonth };
  },
});

export const listProfilesWithMetrics = query({
  args: { limit: v.optional(v.number()), daysBack: v.optional(v.number()) },
  returns: v.array(
    v.object({
      userId: v.string(),
      referralCode: v.string(),
      status: v.union(v.literal("active"), v.literal("disabled")),
      createdAt: v.number(),
      updatedAt: v.number(),
      clicks: v.number(),
      revenueCents: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const limitRaw = typeof args.limit === "number" ? args.limit : 500;
    const limit = Math.max(1, Math.min(2000, Math.floor(limitRaw)));
    const daysBackRaw = typeof args.daysBack === "number" ? args.daysBack : 30;
    const daysBack = Math.max(1, Math.min(180, Math.floor(daysBackRaw)));
    const sinceMs = Date.now() - daysBack * dayMs;

    const profilesUnknown = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.admin.listAffiliateProfiles,
      { limit },
    );
    const profiles = Array.isArray(profilesUnknown) ? (profilesUnknown as any[]) : [];

    // Clicks: derived from affiliate logs (bounded window).
    const logsUnknown = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.admin.listAffiliateLogs,
      { fromMs: sinceMs, limit: 5000 },
    );
    const logs = Array.isArray(logsUnknown) ? (logsUnknown as any[]) : [];

    const clicksByUser = new Map<string, number>();
    for (const l of logs) {
      if (l?.kind === "click_logged" && typeof l?.ownerUserId === "string") {
        const id = String(l.ownerUserId);
        clicksByUser.set(id, (clicksByUser.get(id) ?? 0) + 1);
      }
    }

    // Revenue: derived from affiliate conversions (bounded window).
    const conversionsUnknown = await ctx.runQuery(
      componentsUntyped.launchthat_affiliates.admin.listAffiliateConversions,
      { fromMs: sinceMs, limit: 20000 },
    );
    const conversions = Array.isArray(conversionsUnknown) ? (conversionsUnknown as any[]) : [];

    const revenueByUser = new Map<string, number>();
    for (const c of conversions) {
      const id = typeof c?.referrerUserId === "string" ? String(c.referrerUserId) : "";
      const amt = typeof c?.amountCents === "number" ? Math.max(0, Math.round(c.amountCents)) : 0;
      if (!id || !amt) continue;
      revenueByUser.set(id, (revenueByUser.get(id) ?? 0) + amt);
    }

    return profiles.map((row) => {
      const userId = String(row?.userId ?? "");
      return {
        userId,
        referralCode: String(row?.referralCode ?? ""),
        status: row?.status === "disabled" ? ("disabled" as const) : ("active" as const),
        createdAt: typeof row?.createdAt === "number" ? Number(row.createdAt) : 0,
        updatedAt: typeof row?.updatedAt === "number" ? Number(row.updatedAt) : 0,
        clicks: clicksByUser.get(userId) ?? 0,
        revenueCents: revenueByUser.get(userId) ?? 0,
      };
    });
  },
});

