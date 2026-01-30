import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const profileValidator = v.object({
  userId: v.string(),
  referralCode: v.string(),
  status: v.union(v.literal("active"), v.literal("disabled")),
  acceptedTermsAt: v.optional(v.number()),
  acceptedTermsVersion: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const logValidator = v.object({
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
});

const conversionValidator = v.object({
  kind: v.string(),
  externalId: v.string(),
  referredUserId: v.string(),
  referrerUserId: v.string(),
  amountCents: v.number(),
  currency: v.string(),
  occurredAt: v.number(),
});

export const listAffiliateProfiles = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(profileValidator),
  handler: async (ctx, args) => {
    const limitRaw = typeof args.limit === "number" ? args.limit : 500;
    const limit = Math.max(1, Math.min(5000, Math.floor(limitRaw)));

    const rows = await ctx.db.query("affiliateProfiles").order("desc").take(limit);
    return rows.map((row: any) => ({
      userId: String(row.userId),
      referralCode: String(row.referralCode),
      status: row.status === "disabled" ? ("disabled" as const) : ("active" as const),
      acceptedTermsAt:
        typeof row.acceptedTermsAt === "number" ? Number(row.acceptedTermsAt) : undefined,
      acceptedTermsVersion:
        typeof row.acceptedTermsVersion === "string" ? row.acceptedTermsVersion : undefined,
      createdAt: Number(row.createdAt ?? 0),
      updatedAt: Number(row.updatedAt ?? 0),
    }));
  },
});

export const getAffiliateProfileByUserId = query({
  args: { userId: v.string() },
  returns: v.union(v.null(), profileValidator),
  handler: async (ctx, args) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) return null;
    const row = await ctx.db
      .query("affiliateProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!row) return null;
    return {
      userId: String((row as any).userId),
      referralCode: String((row as any).referralCode),
      status: (row as any).status === "disabled" ? ("disabled" as const) : ("active" as const),
      acceptedTermsAt:
        typeof (row as any).acceptedTermsAt === "number"
          ? Number((row as any).acceptedTermsAt)
          : undefined,
      acceptedTermsVersion:
        typeof (row as any).acceptedTermsVersion === "string"
          ? String((row as any).acceptedTermsVersion)
          : undefined,
      createdAt: Number((row as any).createdAt ?? 0),
      updatedAt: Number((row as any).updatedAt ?? 0),
    };
  },
});

export const listReferredUsersForReferrer = query({
  args: { referrerUserId: v.string(), limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      referredUserId: v.string(),
      attributedAt: v.number(),
      activatedAt: v.optional(v.number()),
      firstPaidConversionAt: v.optional(v.number()),
      utmContent: v.optional(v.string()),
      shortlinkCode: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const referrerUserId = String(args.referrerUserId ?? "").trim();
    if (!referrerUserId) return [];
    const limitRaw = typeof args.limit === "number" ? args.limit : 500;
    const limit = Math.max(1, Math.min(5000, Math.floor(limitRaw)));

    const rows = await ctx.db
      .query("affiliateAttributions")
      .withIndex("by_referrerUserId_and_attributedAt", (q) =>
        q.eq("referrerUserId", referrerUserId),
      )
      .order("desc")
      .take(limit);

    return (rows as any[]).map((row) => ({
      referredUserId: String(row?.referredUserId ?? ""),
      attributedAt: typeof row?.attributedAt === "number" ? Number(row.attributedAt) : 0,
      activatedAt: typeof row?.activatedAt === "number" ? Number(row.activatedAt) : undefined,
      firstPaidConversionAt:
        typeof row?.firstPaidConversionAt === "number"
          ? Number(row.firstPaidConversionAt)
          : undefined,
      utmContent: typeof row?.utmContent === "string" ? String(row.utmContent) : undefined,
      shortlinkCode: typeof row?.shortlinkCode === "string" ? String(row.shortlinkCode) : undefined,
    }));
  },
});

export const listAffiliateLogs = query({
  args: { limit: v.optional(v.number()), fromMs: v.optional(v.number()) },
  returns: v.array(logValidator),
  handler: async (ctx, args) => {
    const limitRaw = typeof args.limit === "number" ? args.limit : 200;
    const limit = Math.max(1, Math.min(5000, Math.floor(limitRaw)));

    const fromMs = typeof args.fromMs === "number" ? Math.max(0, args.fromMs) : null;

    if (fromMs !== null) {
      const rows = await ctx.db
        .query("affiliateLogs")
        .withIndex("by_ts", (q) => q.gte("ts", fromMs))
        .order("desc")
        .take(limit);
      return rows.map((row: any) => ({
        ts: Number(row.ts ?? 0),
        kind: String(row.kind ?? ""),
        ownerUserId: String(row.ownerUserId ?? ""),
        message: String(row.message ?? ""),
        data: row.data,
        referralCode: typeof row.referralCode === "string" ? row.referralCode : undefined,
        visitorId: typeof row.visitorId === "string" ? row.visitorId : undefined,
        referredUserId: typeof row.referredUserId === "string" ? row.referredUserId : undefined,
        externalId: typeof row.externalId === "string" ? row.externalId : undefined,
        amountCents: typeof row.amountCents === "number" ? Number(row.amountCents) : undefined,
        currency: typeof row.currency === "string" ? row.currency : undefined,
      }));
    }

    const rows = await ctx.db
      .query("affiliateLogs")
      .withIndex("by_ts", (q) => q.gte("ts", 0))
      .order("desc")
      .take(limit);
    return rows.map((row: any) => ({
      ts: Number(row.ts ?? 0),
      kind: String(row.kind ?? ""),
      ownerUserId: String(row.ownerUserId ?? ""),
      message: String(row.message ?? ""),
      data: row.data,
      referralCode: typeof row.referralCode === "string" ? row.referralCode : undefined,
      visitorId: typeof row.visitorId === "string" ? row.visitorId : undefined,
      referredUserId: typeof row.referredUserId === "string" ? row.referredUserId : undefined,
      externalId: typeof row.externalId === "string" ? row.externalId : undefined,
      amountCents: typeof row.amountCents === "number" ? Number(row.amountCents) : undefined,
      currency: typeof row.currency === "string" ? row.currency : undefined,
    }));
  },
});

export const listAffiliateLogsForUser = query({
  args: {
    ownerUserId: v.string(),
    limit: v.optional(v.number()),
    fromMs: v.optional(v.number()),
  },
  returns: v.array(logValidator),
  handler: async (ctx, args) => {
    const ownerUserId = String(args.ownerUserId ?? "").trim();
    if (!ownerUserId) return [];
    const limitRaw = typeof args.limit === "number" ? args.limit : 200;
    const limit = Math.max(1, Math.min(5000, Math.floor(limitRaw)));

    const fromMs = typeof args.fromMs === "number" ? Math.max(0, args.fromMs) : null;

    const rows = await ctx.db
      .query("affiliateLogs")
      .withIndex("by_ownerUserId_and_ts", (q) =>
        fromMs !== null ? q.eq("ownerUserId", ownerUserId).gte("ts", fromMs) : q.eq("ownerUserId", ownerUserId),
      )
      .order("desc")
      .take(limit);

    return rows.map((row: any) => ({
      ts: Number(row.ts ?? 0),
      kind: String(row.kind ?? ""),
      ownerUserId: String(row.ownerUserId ?? ""),
      message: String(row.message ?? ""),
      data: row.data,
      referralCode: typeof row.referralCode === "string" ? row.referralCode : undefined,
      visitorId: typeof row.visitorId === "string" ? row.visitorId : undefined,
      referredUserId: typeof row.referredUserId === "string" ? row.referredUserId : undefined,
      externalId: typeof row.externalId === "string" ? row.externalId : undefined,
      amountCents: typeof row.amountCents === "number" ? Number(row.amountCents) : undefined,
      currency: typeof row.currency === "string" ? row.currency : undefined,
    }));
  },
});

export const listAffiliateConversions = query({
  args: { limit: v.optional(v.number()), fromMs: v.optional(v.number()) },
  returns: v.array(conversionValidator),
  handler: async (ctx, args) => {
    const limitRaw = typeof args.limit === "number" ? args.limit : 200;
    const limit = Math.max(1, Math.min(20000, Math.floor(limitRaw)));
    const fromMs = typeof args.fromMs === "number" ? Math.max(0, Number(args.fromMs)) : null;

    const q = ctx.db.query("affiliateConversions").withIndex("by_occurredAt", (ix: any) =>
      fromMs !== null ? ix.gte("occurredAt", fromMs) : ix.gte("occurredAt", 0),
    );
    const rows = await q.order("desc").take(limit);
    return rows.map((row: any) => ({
      kind: String(row.kind ?? ""),
      externalId: String(row.externalId ?? ""),
      referredUserId: String(row.referredUserId ?? ""),
      referrerUserId: String(row.referrerUserId ?? ""),
      amountCents: typeof row.amountCents === "number" ? Number(row.amountCents) : 0,
      currency: String(row.currency ?? "USD").toUpperCase(),
      occurredAt: typeof row.occurredAt === "number" ? Number(row.occurredAt) : 0,
    }));
  },
});

export const listAffiliateCreditEventsForUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      kind: v.optional(v.string()),
      amountCents: v.number(),
      currency: v.string(),
      reason: v.string(),
      externalEventId: v.optional(v.string()),
      createdAt: v.number(),
      referredUserId: v.optional(v.string()),
      referrerUserId: v.optional(v.string()),
      conversionId: v.optional(v.string()),
      utmContent: v.optional(v.string()),
      shortlinkCode: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) return [];
    const limitRaw = typeof args.limit === "number" ? args.limit : 200;
    const limit = Math.max(1, Math.min(5000, Math.floor(limitRaw)));

    const rows = await ctx.db
      .query("affiliateCreditEvents")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_userId_and_createdAt", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return rows.map((row: any) => ({
      kind: typeof row.kind === "string" ? row.kind : undefined,
      amountCents: typeof row.amountCents === "number" ? Number(row.amountCents) : 0,
      currency: String(row.currency ?? "USD"),
      reason: String(row.reason ?? ""),
      externalEventId: typeof row.externalEventId === "string" ? row.externalEventId : undefined,
      createdAt: typeof row.createdAt === "number" ? Number(row.createdAt) : 0,
      referredUserId: typeof row.referredUserId === "string" ? row.referredUserId : undefined,
      referrerUserId: typeof row.referrerUserId === "string" ? row.referrerUserId : undefined,
      conversionId: typeof row.conversionId === "string" ? row.conversionId : undefined,
      utmContent: typeof row.utmContent === "string" ? row.utmContent : undefined,
      shortlinkCode: typeof row.shortlinkCode === "string" ? row.shortlinkCode : undefined,
    }));
  },
});

const clampBps = (raw: unknown, fallback: number): number => {
  const n = typeof raw === "number" ? Math.round(raw) : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(10000, Math.round(n)));
};

export const getProgramSettings = query({
  args: {
    scopeType: v.union(v.literal("site"), v.literal("org"), v.literal("app")),
    scopeId: v.string(),
  },
  returns: v.object({
    scopeType: v.union(v.literal("site"), v.literal("org"), v.literal("app")),
    scopeId: v.string(),
    mlmEnabled: v.boolean(),
    directCommissionBps: v.number(),
    sponsorOverrideBps: v.number(),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const scopeType = args.scopeType;
    const scopeId = String(args.scopeId ?? "").trim() || "default";

    const row = await ctx.db
      .query("affiliateProgramSettings")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_scope", (q: any) => q.eq("scopeType", scopeType).eq("scopeId", scopeId))
      .first();

    // Defaults: direct 20%, sponsor override 5%, enabled.
    const mlmEnabled = row ? (row as any).mlmEnabled !== false : true;
    const directCommissionBps = clampBps(row ? (row as any).directCommissionBps : undefined, 2000);
    const sponsorOverrideBps = clampBps(row ? (row as any).sponsorOverrideBps : undefined, 500);
    const updatedAt = row && typeof (row as any).updatedAt === "number" ? Number((row as any).updatedAt) : 0;

    return { scopeType, scopeId, mlmEnabled, directCommissionBps, sponsorOverrideBps, updatedAt };
  },
});

export const upsertProgramSettings = mutation({
  args: {
    scopeType: v.union(v.literal("site"), v.literal("org"), v.literal("app")),
    scopeId: v.string(),
    mlmEnabled: v.optional(v.boolean()),
    directCommissionBps: v.optional(v.number()),
    sponsorOverrideBps: v.optional(v.number()),
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
    const scopeType = args.scopeType;
    const scopeId = String(args.scopeId ?? "").trim() || "default";
    const now = Date.now();

    const existing = await ctx.db
      .query("affiliateProgramSettings")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_scope", (q: any) => q.eq("scopeType", scopeType).eq("scopeId", scopeId))
      .first();

    const nextMlmEnabled =
      typeof args.mlmEnabled === "boolean" ? args.mlmEnabled : existing ? (existing as any).mlmEnabled !== false : true;
    const nextDirectCommissionBps = clampBps(
      typeof args.directCommissionBps === "number" ? args.directCommissionBps : existing ? (existing as any).directCommissionBps : undefined,
      2000,
    );
    const nextSponsorOverrideBps = clampBps(
      typeof args.sponsorOverrideBps === "number" ? args.sponsorOverrideBps : existing ? (existing as any).sponsorOverrideBps : undefined,
      500,
    );

    if (existing) {
      await ctx.db.patch((existing as any)._id, {
        mlmEnabled: nextMlmEnabled,
        directCommissionBps: nextDirectCommissionBps,
        sponsorOverrideBps: nextSponsorOverrideBps,
        updatedAt: now,
      });
    } else {
      // Required non-MLM settings: initialize with safe defaults.
      await ctx.db.insert("affiliateProgramSettings", {
        scopeType,
        scopeId,
        attributionWindowDays: 30,
        activationMilestones: [],
        paidConversionDiscountRules: [],
        mlmEnabled: nextMlmEnabled,
        directCommissionBps: nextDirectCommissionBps,
        sponsorOverrideBps: nextSponsorOverrideBps,
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      ok: true,
      scopeType,
      scopeId,
      mlmEnabled: nextMlmEnabled,
      directCommissionBps: nextDirectCommissionBps,
      sponsorOverrideBps: nextSponsorOverrideBps,
      updatedAt: now,
    };
  },
});


