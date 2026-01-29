import { v } from "convex/values";
import { query } from "../_generated/server";

const identityMatchesUserId = (identity: any, userId: string): boolean => {
  if (!identity) return false;
  const tokenIdentifier =
    typeof identity.tokenIdentifier === "string" ? identity.tokenIdentifier.trim() : "";
  const subject = typeof identity.subject === "string" ? identity.subject.trim() : "";
  return tokenIdentifier === userId || subject === userId;
};

export const listMyReferredUsers = query({
  args: {
    referrerUserId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      referredUserId: v.string(),
      attributedAt: v.number(),
      expiresAt: v.number(),
      status: v.string(),
      activatedAt: v.optional(v.number()),
      firstPaidConversionAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const referrerUserId = String(args.referrerUserId ?? "").trim();
    if (!referrerUserId) return [];

    // Only allow the referrer to view their own referred users.
    const identity = await ctx.auth.getUserIdentity();
    if (!identityMatchesUserId(identity, referrerUserId)) {
      throw new Error("Forbidden");
    }

    const limitRaw = typeof args.limit === "number" ? args.limit : 200;
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
      expiresAt: typeof row?.expiresAt === "number" ? Number(row.expiresAt) : 0,
      status: String(row?.status ?? ""),
      activatedAt: typeof row?.activatedAt === "number" ? Number(row.activatedAt) : undefined,
      firstPaidConversionAt:
        typeof row?.firstPaidConversionAt === "number"
          ? Number(row.firstPaidConversionAt)
          : undefined,
    }));
  },
});

