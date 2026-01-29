import { v } from "convex/values";
import { mutation } from "./_generated/server";

import { evaluateRewardsForReferrerImpl } from "./rewards";

const normalizeCode = (raw: string) => raw.trim().toLowerCase();

export const recordClick = mutation({
  args: {
    referralCode: v.string(),
    visitorId: v.string(),
    landingPath: v.optional(v.string()),
    referrer: v.optional(v.string()),
    uaHash: v.optional(v.string()),
    ipHash: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const referralCode = normalizeCode(String(args.referralCode ?? ""));
    const visitorId = String(args.visitorId ?? "").trim();
    if (!referralCode || !visitorId) return null;

    // Basic dedupe: if same visitor clicked same code recently, skip.
    const recent = await ctx.db
      .query("affiliateClicks")
      .withIndex("by_visitorId_and_clickedAt", (q) => q.eq("visitorId", visitorId))
      .order("desc")
      .first();
    const now = Date.now();
    if (
      recent &&
      String((recent as any).referralCode) === referralCode &&
      typeof (recent as any).clickedAt === "number" &&
      now - Number((recent as any).clickedAt) < 2 * 60 * 1000
    ) {
      return null;
    }

    await ctx.db.insert("affiliateClicks", {
      referralCode,
      visitorId,
      clickedAt: now,
      landingPath: args.landingPath,
      referrer: args.referrer,
      uaHash: args.uaHash,
      ipHash: args.ipHash,
    });
    return null;
  },
});

/**
 * Attribute a newly created user to an affiliate. First-touch wins.
 *
 * Inputs:
 * - referredUserId: the newly created app user id
 * - visitorId: the anonymous visitor id cookie that captured the ref
 * - referralCode: optional explicit code (if you captured it)
 * - nowMs: injected for testing
 */
export const attributeSignup = mutation({
  args: {
    referredUserId: v.string(),
    visitorId: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    attributionWindowDays: v.optional(v.number()),
    nowMs: v.optional(v.number()),
  },
  returns: v.union(
    v.null(),
    v.object({
      referrerUserId: v.string(),
      referredUserId: v.string(),
      referralCode: v.string(),
      expiresAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const referredUserId = String(args.referredUserId ?? "").trim();
    if (!referredUserId) throw new Error("Missing referredUserId");

    // If already attributed, keep the existing (first-touch).
    const existing = await ctx.db
      .query("affiliateAttributions")
      .withIndex("by_referredUserId", (q) => q.eq("referredUserId", referredUserId))
      .first();
    if (existing) {
      return {
        referrerUserId: String((existing as any).referrerUserId),
        referredUserId: String((existing as any).referredUserId),
        referralCode: String((existing as any).referralCode),
        expiresAt: Number((existing as any).expiresAt ?? 0),
      };
    }

    const now = typeof args.nowMs === "number" ? Number(args.nowMs) : Date.now();
    const windowDays = Math.max(1, Math.min(90, Number(args.attributionWindowDays ?? 30)));
    const expiresAt = now + windowDays * 24 * 60 * 60 * 1000;

    // Determine referralCode
    let referralCode = normalizeCode(String(args.referralCode ?? ""));
    if (!referralCode) {
      const visitorId = String(args.visitorId ?? "").trim();
      if (!visitorId) return null;
      const click = await ctx.db
        .query("affiliateClicks")
        .withIndex("by_visitorId_and_clickedAt", (q) => q.eq("visitorId", visitorId))
        .order("desc")
        .first();
      referralCode = click ? normalizeCode(String((click as any).referralCode ?? "")) : "";
    }
    if (!referralCode) return null;

    // Resolve referrer by referralCode
    const refProfile = await ctx.db
      .query("affiliateProfiles")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", referralCode))
      .first();
    if (!refProfile) return null;
    if ((refProfile as any).status === "disabled") return null;

    const referrerUserId = String((refProfile as any).userId ?? "");
    if (!referrerUserId) return null;
    if (referrerUserId === referredUserId) return null;

    await ctx.db.insert("affiliateAttributions", {
      referralCode,
      referrerUserId,
      referredUserId,
      attributedAt: now,
      expiresAt,
      status: "active",
    });

    return { referrerUserId, referredUserId, referralCode, expiresAt };
  },
});

/**
 * Mark a referred user as activated (e.g. email verified).
 * This mutation is idempotent per `referredUserId`.
 */
export const markActivated = mutation({
  args: {
    referredUserId: v.string(),
    source: v.optional(
      v.union(v.literal("email_verified"), v.literal("manual")),
    ),
  },
  returns: v.object({
    ok: v.boolean(),
    activated: v.boolean(),
    referrerUserId: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const referredUserId = String(args.referredUserId ?? "").trim();
    if (!referredUserId) throw new Error("Missing referredUserId");

    const attribution = await ctx.db
      .query("affiliateAttributions")
      .withIndex("by_referredUserId", (q) =>
        q.eq("referredUserId", referredUserId),
      )
      .first();
    if (!attribution) return { ok: true, activated: false, referrerUserId: null };

    const now = Date.now();
    const expiresAt =
      typeof (attribution as any).expiresAt === "number"
        ? Number((attribution as any).expiresAt)
        : 0;
    if (expiresAt > 0 && expiresAt < now) {
      return { ok: true, activated: false, referrerUserId: null };
    }

    const referrerUserId = String((attribution as any).referrerUserId ?? "");
    if (!referrerUserId) return { ok: true, activated: false, referrerUserId: null };

    const existingActivation = await ctx.db
      .query("affiliateActivations")
      .withIndex("by_referredUserId", (q) =>
        q.eq("referredUserId", referredUserId),
      )
      .first();
    if (existingActivation) {
      return { ok: true, activated: false, referrerUserId };
    }

    await ctx.db.insert("affiliateActivations", {
      referredUserId,
      activatedAt: now,
      source: args.source ?? "email_verified",
    });

    await evaluateRewardsForReferrerImpl(ctx as any, { referrerUserId });

    return { ok: true, activated: true, referrerUserId };
  },
});

