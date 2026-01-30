import { v } from "convex/values";
import { mutation } from "../_generated/server";

import { insertAffiliateLog } from "../logs";

const normalizeCode = (raw: string) => raw.trim().toLowerCase();

const assertActiveAffiliate = async (ctx: any, userId: string) => {
  const row = await ctx.db
    .query("affiliateProfiles")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first();
  if (!row) throw new Error("Sponsor is not an affiliate");
  if ((row as any).status === "disabled") throw new Error("Sponsor is disabled");
  return {
    userId: String((row as any).userId ?? ""),
    referralCode: String((row as any).referralCode ?? ""),
  };
};

export const setMySponsorByReferralCodeOptIn = mutation({
  args: {
    userId: v.string(),
    referralCode: v.string(),
    nowMs: v.optional(v.number()),
  },
  returns: v.object({
    ok: v.boolean(),
    created: v.boolean(),
    sponsorUserId: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");
    const referralCode = normalizeCode(String(args.referralCode ?? ""));
    if (!referralCode) throw new Error("Missing referralCode");

    const now = typeof args.nowMs === "number" ? Number(args.nowMs) : Date.now();

    const existing = await ctx.db
      .query("affiliateSponsorLinks")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .first();
    if (existing) {
      return {
        ok: true,
        created: false,
        sponsorUserId:
          typeof (existing as any).sponsorUserId === "string"
            ? String((existing as any).sponsorUserId)
            : null,
      };
    }

    const sponsorProfile = await ctx.db
      .query("affiliateProfiles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_referralCode", (q: any) => q.eq("referralCode", referralCode))
      .first();
    if (!sponsorProfile) throw new Error("Invalid referralCode");
    if ((sponsorProfile as any).status === "disabled") throw new Error("Sponsor is disabled");

    const sponsorUserId = String((sponsorProfile as any).userId ?? "").trim();
    if (!sponsorUserId) throw new Error("Invalid sponsor");
    if (sponsorUserId === userId) throw new Error("Cannot sponsor yourself");

    await ctx.db.insert("affiliateSponsorLinks", {
      userId,
      sponsorUserId,
      createdAt: now,
      createdSource: "opt_in_link",
    });

    await insertAffiliateLog(ctx as any, {
      ts: now,
      kind: "sponsor_linked",
      ownerUserId: sponsorUserId,
      message: "New direct downline joined network",
      referredUserId: userId,
      referralCode,
      data: { userId, sponsorUserId, referralCode, createdSource: "opt_in_link" },
    });

    return { ok: true, created: true, sponsorUserId };
  },
});

export const setSponsorForUserAdmin = mutation({
  args: {
    userId: v.string(),
    sponsorUserId: v.union(v.string(), v.null()),
    adminUserId: v.optional(v.string()),
    nowMs: v.optional(v.number()),
  },
  returns: v.object({
    ok: v.boolean(),
    userId: v.string(),
    sponsorUserId: v.union(v.string(), v.null()),
    previousSponsorUserId: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");
    const sponsorUserIdRaw =
      typeof args.sponsorUserId === "string" ? String(args.sponsorUserId).trim() : "";
    const sponsorUserId = sponsorUserIdRaw || null;
    if (sponsorUserId && sponsorUserId === userId) throw new Error("Cannot sponsor yourself");

    const now = typeof args.nowMs === "number" ? Number(args.nowMs) : Date.now();
    const adminUserId = typeof args.adminUserId === "string" ? args.adminUserId.trim() : "";

    if (sponsorUserId) {
      // Ensure sponsor is an active affiliate.
      await assertActiveAffiliate(ctx as any, sponsorUserId);
    }

    const existing = await ctx.db
      .query("affiliateSponsorLinks")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .first();

    const previousSponsorUserId =
      existing && typeof (existing as any).sponsorUserId === "string"
        ? String((existing as any).sponsorUserId)
        : null;

    // No-op if unchanged.
    if (previousSponsorUserId === sponsorUserId) {
      return { ok: true, userId, sponsorUserId, previousSponsorUserId };
    }

    if (existing) {
      if (!sponsorUserId) {
        await ctx.db.delete((existing as any)._id);
      } else {
        await ctx.db.patch((existing as any)._id, {
          sponsorUserId,
          updatedAt: now,
          updatedBy: adminUserId || undefined,
          createdSource: (existing as any).createdSource ?? "admin_change",
        });
      }
    } else {
      if (sponsorUserId) {
        await ctx.db.insert("affiliateSponsorLinks", {
          userId,
          sponsorUserId,
          createdAt: now,
          createdSource: "admin_change",
          updatedAt: now,
          updatedBy: adminUserId || undefined,
        });
      }
    }

    const logChange = async (ownerUserId: string, message: string) => {
      await insertAffiliateLog(ctx as any, {
        ts: now,
        kind: "sponsor_changed",
        ownerUserId,
        message,
        referredUserId: userId,
        data: {
          userId,
          previousSponsorUserId,
          sponsorUserId,
          updatedBy: adminUserId || undefined,
        },
      });
    };

    if (previousSponsorUserId) {
      await logChange(previousSponsorUserId, "Direct downline sponsor changed/removed");
    }
    if (sponsorUserId) {
      await logChange(sponsorUserId, "Direct downline sponsor added/changed");
    }

    return { ok: true, userId, sponsorUserId, previousSponsorUserId };
  },
});

