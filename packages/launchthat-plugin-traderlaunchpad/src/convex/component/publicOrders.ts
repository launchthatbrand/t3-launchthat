import { v } from "convex/values";
import { query } from "./server";

type PublicOrderRow = {
  externalOrderId: string;
  symbol: string;
  side: "buy" | "sell" | null;
  status: string | null;
  createdAt: number | null;
  closedAt: number | null;
};

export const listPublicOrdersForUser = query({
  args: {
    organizationId: v.string(),
    userId: v.string(), // Clerk user id
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      externalOrderId: v.string(),
      symbol: v.string(),
      side: v.union(v.literal("buy"), v.literal("sell"), v.null()),
      status: v.union(v.string(), v.null()),
      createdAt: v.union(v.number(), v.null()),
      closedAt: v.union(v.number(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const visibility = await ctx.db
      .query("visibilitySettings")
      .withIndex("by_org_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    const globalPublic =
      typeof visibility?.globalPublic === "boolean" ? visibility.globalPublic : false;
    const ordersPublic =
      typeof visibility?.ordersPublic === "boolean" ? visibility.ordersPublic : false;
    const enabled = globalPublic ? true : ordersPublic;
    if (!enabled) return [];

    const limit = Math.max(1, Math.min(200, args.limit ?? 50));
    const rows = await ctx.db
      .query("tradeOrdersHistory")
      .withIndex("by_org_user_createdAt", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .order("desc")
      .take(limit);

    const result: PublicOrderRow[] = rows.map((r: any) => {
      const sideRaw = typeof r.side === "string" ? r.side.toLowerCase() : "";
      const side: PublicOrderRow["side"] =
        sideRaw === "buy" ? "buy" : sideRaw === "sell" ? "sell" : null;

      return {
        externalOrderId: String(r.externalOrderId ?? ""),
        symbol: String(r.symbol ?? ""),
        side,
        status: r.status == null ? null : String(r.status),
        createdAt: typeof r.createdAt === "number" ? r.createdAt : null,
        closedAt: typeof r.closedAt === "number" ? r.closedAt : null,
      };
    });

    return result;
  },
});

