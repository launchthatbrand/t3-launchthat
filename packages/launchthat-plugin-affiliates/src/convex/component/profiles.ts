import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

import { insertAffiliateLog } from "./logs";

const randomCode = (): string => {
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const normalizeCode = (raw: string) => raw.trim().toLowerCase();

export const createOrGetMyAffiliateProfile = mutation({
  args: {
    userId: v.string(),
    acceptTerms: v.optional(v.boolean()),
    termsVersion: v.optional(v.string()),
  },
  returns: v.object({
    userId: v.string(),
    referralCode: v.string(),
    status: v.union(v.literal("active"), v.literal("disabled")),
  }),
  handler: async (ctx, args) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");

    const existing = await ctx.db
      .query("affiliateProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (existing) {
      const status: "active" | "disabled" =
        (existing as any).status === "disabled" ? "disabled" : "active";
      return {
        userId: String((existing as any).userId),
        referralCode: String((existing as any).referralCode),
        status,
      };
    }

    const acceptTerms = args.acceptTerms === true;
    const termsVersion = typeof args.termsVersion === "string" ? args.termsVersion.trim() : "";
    if (!acceptTerms || !termsVersion) {
      throw new Error("Terms not accepted");
    }

    // Generate a unique referral code (retry a few times).
    let referralCode = "";
    for (let i = 0; i < 5; i++) {
      const candidate = normalizeCode(randomCode());
      const dup = await ctx.db
        .query("affiliateProfiles")
        .withIndex("by_referralCode", (q) => q.eq("referralCode", candidate))
        .first();
      if (!dup) {
        referralCode = candidate;
        break;
      }
    }
    if (!referralCode) throw new Error("Failed to generate referral code");

    const now = Date.now();
    await ctx.db.insert("affiliateProfiles", {
      userId,
      referralCode,
      status: "active",
      acceptedTermsAt: now,
      acceptedTermsVersion: termsVersion,
      createdAt: now,
      updatedAt: now,
    });

    await insertAffiliateLog(ctx as any, {
      ts: now,
      kind: "profile_created",
      ownerUserId: userId,
      message: "Affiliate profile created",
      referralCode,
    });

    return { userId, referralCode, status: "active" as const };
  },
});

export const getAffiliateProfileByUserId = query({
  args: { userId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      userId: v.string(),
      referralCode: v.string(),
      status: v.union(v.literal("active"), v.literal("disabled")),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) return null;
    const row = await ctx.db
      .query("affiliateProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!row) return null;
    const status: "active" | "disabled" =
      (row as any).status === "disabled" ? "disabled" : "active";
    return {
      userId: String((row as any).userId),
      referralCode: String((row as any).referralCode),
      status,
    };
  },
});

export const getAffiliateProfileByReferralCode = query({
  args: { referralCode: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      userId: v.string(),
      referralCode: v.string(),
      status: v.union(v.literal("active"), v.literal("disabled")),
    }),
  ),
  handler: async (ctx, args) => {
    const code = normalizeCode(String(args.referralCode ?? ""));
    if (!code) return null;
    const row = await ctx.db
      .query("affiliateProfiles")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", code))
      .first();
    if (!row) return null;
    const status: "active" | "disabled" =
      (row as any).status === "disabled" ? "disabled" : "active";
    return {
      userId: String((row as any).userId),
      referralCode: String((row as any).referralCode),
      status,
    };
  },
});

export const getMyAffiliateStats = query({
  args: {
    userId: v.string(),
    nowMs: v.optional(v.number()),
  },
  returns: v.object({
    userId: v.string(),
    referralCode: v.union(v.string(), v.null()),
    clicks30d: v.number(),
    signups30d: v.number(),
    activations30d: v.number(),
    conversions30d: v.number(),
    creditBalanceCents: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");

    const now = typeof args.nowMs === "number" ? Number(args.nowMs) : Date.now();
    const since = now - 30 * 24 * 60 * 60 * 1000;

    const profile = await ctx.db
      .query("affiliateProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    const referralCode = profile ? String((profile as any).referralCode ?? "") : "";

    let clicks30d = 0;
    if (referralCode) {
      const clicks = await ctx.db
        .query("affiliateClicks")
        .withIndex("by_referralCode_and_clickedAt", (q) =>
          q.eq("referralCode", referralCode),
        )
        .order("desc")
        .take(2000);
      for (const row of clicks) {
        const clickedAt = typeof (row as any).clickedAt === "number" ? (row as any).clickedAt : 0;
        if (clickedAt >= since) clicks30d++;
        else break;
      }
    }

    const attributions = await ctx.db
      .query("affiliateAttributions")
      .withIndex("by_referrerUserId_and_attributedAt", (q) =>
        q.eq("referrerUserId", userId),
      )
      .order("desc")
      .take(2000);
    let signups30d = 0;
    const referred30d: string[] = [];
    for (const row of attributions) {
      const attributedAt =
        typeof (row as any).attributedAt === "number" ? (row as any).attributedAt : 0;
      if (attributedAt >= since) {
        signups30d++;
        const referredUserId = String((row as any).referredUserId ?? "");
        if (referredUserId) referred30d.push(referredUserId);
      } else {
        break;
      }
    }

    let activations30d = 0;
    for (const referredUserId of referred30d) {
      const activation = await ctx.db
        .query("affiliateActivations")
        .withIndex("by_referredUserId", (q) => q.eq("referredUserId", referredUserId))
        .first();
      if (!activation) continue;
      const activatedAt =
        typeof (activation as any).activatedAt === "number"
          ? (activation as any).activatedAt
          : 0;
      if (activatedAt >= since) activations30d++;
    }

    const conversions = await ctx.db
      .query("affiliateConversions")
      .withIndex("by_referrerUserId_and_occurredAt", (q) => q.eq("referrerUserId", userId))
      .order("desc")
      .take(2000);
    let conversions30d = 0;
    for (const row of conversions) {
      const occurredAt =
        typeof (row as any).occurredAt === "number" ? (row as any).occurredAt : 0;
      if (occurredAt >= since) conversions30d++;
      else break;
    }

    // Ledger balance (USD cents by default)
    const creditEvents = await ctx.db
      .query("affiliateCreditEvents")
      .withIndex("by_userId_and_createdAt", (q) => q.eq("userId", userId))
      .order("desc")
      .take(5000);
    let creditBalanceCents = 0;
    for (const row of creditEvents) {
      const amountCents =
        typeof (row as any).amountCents === "number" ? Number((row as any).amountCents) : 0;
      creditBalanceCents += amountCents;
    }

    return {
      userId,
      referralCode: referralCode || null,
      clicks30d,
      signups30d,
      activations30d,
      conversions30d,
      creditBalanceCents,
    };
  },
});

export const setAffiliateProfileStatus = mutation({
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
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");

    const existing = await ctx.db
      .query("affiliateProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!existing) throw new Error("Affiliate profile not found");

    const nextStatus = args.status;
    const now = Date.now();

    await ctx.db.patch(existing._id, {
      status: nextStatus,
      updatedAt: now,
    });

    await insertAffiliateLog(ctx as any, {
      ts: now,
      kind: "profile_status_changed",
      ownerUserId: userId,
      message: `Affiliate profile status set to ${nextStatus}`,
      data: { status: nextStatus },
    });

    return { ok: true, userId, status: nextStatus };
  },
});

