import { v } from "convex/values";
import { query } from "../_generated/server";

const sponsorLinkValidator = v.object({
  userId: v.string(),
  sponsorUserId: v.string(),
  createdAt: v.number(),
  createdSource: v.string(),
  updatedAt: v.optional(v.number()),
  updatedBy: v.optional(v.string()),
});

export const getSponsorLinkForUser = query({
  args: { userId: v.string() },
  returns: v.union(v.null(), sponsorLinkValidator),
  handler: async (ctx, args) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) return null;
    const row = await ctx.db
      .query("affiliateSponsorLinks")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .first();
    if (!row) return null;
    return {
      userId: String((row as any).userId ?? ""),
      sponsorUserId: String((row as any).sponsorUserId ?? ""),
      createdAt: typeof (row as any).createdAt === "number" ? Number((row as any).createdAt) : 0,
      createdSource: String((row as any).createdSource ?? ""),
      updatedAt: typeof (row as any).updatedAt === "number" ? Number((row as any).updatedAt) : undefined,
      updatedBy: typeof (row as any).updatedBy === "string" ? String((row as any).updatedBy) : undefined,
    };
  },
});

export const listDirectDownlineForSponsor = query({
  args: { sponsorUserId: v.string(), limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      userId: v.string(),
      createdAt: v.number(),
      createdSource: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const sponsorUserId = String(args.sponsorUserId ?? "").trim();
    if (!sponsorUserId) return [];
    const limitRaw = typeof args.limit === "number" ? args.limit : 500;
    const limit = Math.max(1, Math.min(5000, Math.floor(limitRaw)));

    const rows = await ctx.db
      .query("affiliateSponsorLinks")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_sponsorUserId_and_createdAt", (q: any) => q.eq("sponsorUserId", sponsorUserId))
      .order("desc")
      .take(limit);

    return (rows as any[]).map((row) => ({
      userId: String(row?.userId ?? ""),
      createdAt: typeof row?.createdAt === "number" ? Number(row.createdAt) : 0,
      createdSource: String(row?.createdSource ?? ""),
    }));
  },
});

