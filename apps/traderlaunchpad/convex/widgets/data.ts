import { v } from "convex/values";

import { internalQuery } from "../_generated/server";
import { components } from "../_generated/api";
import { resolveOrganizationId } from "../traderlaunchpad/lib/resolve";

const tradeIdeasAnalytics = components.launchthat_traderlaunchpad.tradeIdeas.analytics as any;
const tradeIdeasNotes = components.launchthat_traderlaunchpad.tradeIdeas.notes as any;
const rawQueries = components.launchthat_traderlaunchpad.raw.queries as any;

export const getProfileCardData = internalQuery({
  args: { userId: v.string() },
  returns: v.object({
    userId: v.string(),
    name: v.union(v.string(), v.null()),
    publicUsername: v.union(v.string(), v.null()),
    image: v.union(v.string(), v.null()),
    headline: v.object({
      sampleSize: v.number(),
      closedTrades: v.number(),
      openTrades: v.number(),
      winRate: v.number(),
      expectancy: v.number(),
      totalFees: v.number(),
      totalPnl: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");

    const orgId = resolveOrganizationId();

    const viewer = await ctx.db.get(userId as any);
    const name = typeof (viewer as any)?.name === "string" ? String((viewer as any).name) : null;
    const publicUsername =
      typeof (viewer as any)?.publicUsername === "string" ? String((viewer as any).publicUsername) : null;
    const image = typeof (viewer as any)?.image === "string" ? String((viewer as any).image) : null;

    const summary = await ctx.runQuery(tradeIdeasAnalytics.getSummary, {
      organizationId: orgId,
      userId,
      limit: 500,
    });

    return {
      userId,
      name,
      publicUsername,
      image,
      headline: {
        sampleSize: typeof (summary as any)?.sampleSize === "number" ? Number((summary as any).sampleSize) : 0,
        closedTrades: typeof (summary as any)?.closedTrades === "number" ? Number((summary as any).closedTrades) : 0,
        openTrades: typeof (summary as any)?.openTrades === "number" ? Number((summary as any).openTrades) : 0,
        winRate: typeof (summary as any)?.winRate === "number" ? Number((summary as any).winRate) : 0,
        expectancy: typeof (summary as any)?.expectancy === "number" ? Number((summary as any).expectancy) : 0,
        totalFees: typeof (summary as any)?.totalFees === "number" ? Number((summary as any).totalFees) : 0,
        totalPnl: typeof (summary as any)?.totalPnl === "number" ? Number((summary as any).totalPnl) : 0,
      },
    };
  },
});

export const listMyTradesData = internalQuery({
  args: { userId: v.string(), limit: v.number() },
  returns: v.array(
    v.object({
      tradeIdeaGroupId: v.string(),
      symbol: v.string(),
      direction: v.union(v.literal("long"), v.literal("short")),
      closedAt: v.number(),
      realizedPnl: v.union(v.number(), v.null()),
      fees: v.union(v.number(), v.null()),
      reviewStatus: v.union(v.literal("todo"), v.literal("reviewed")),
    }),
  ),
  handler: async (ctx, args) => {
    const orgId = resolveOrganizationId();
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");
    const limit = Math.max(1, Math.min(100, Math.floor(Number(args.limit ?? 20))));

    const rows = await ctx.runQuery(tradeIdeasNotes.listRecentClosedWithReviewStatus, {
      organizationId: orgId,
      userId,
      limit,
      accountId: undefined,
    });

    const list = Array.isArray(rows) ? rows : [];
    return list.map((r: any) => ({
      tradeIdeaGroupId: String(r.tradeIdeaGroupId),
      symbol: String(r.symbol ?? "UNKNOWN"),
      direction: (r.direction === "short" ? "short" : "long") as "long" | "short",
      closedAt: Number(r.closedAt ?? 0),
      realizedPnl: typeof r.realizedPnl === "number" ? Number(r.realizedPnl) : null,
      fees: typeof r.fees === "number" ? Number(r.fees) : null,
      reviewStatus: (r.reviewStatus === "reviewed" ? "reviewed" : "todo") as "todo" | "reviewed",
    }));
  },
});

export const listOpenPositionsData = internalQuery({
  args: { userId: v.string(), limit: v.number() },
  returns: v.array(
    v.object({
      externalPositionId: v.string(),
      symbol: v.union(v.string(), v.null()),
      instrumentId: v.union(v.string(), v.null()),
      side: v.union(v.literal("buy"), v.literal("sell"), v.null()),
      openedAt: v.union(v.number(), v.null()),
      qty: v.union(v.number(), v.null()),
      avgPrice: v.union(v.number(), v.null()),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const orgId = resolveOrganizationId();
    const userId = String(args.userId ?? "").trim();
    if (!userId) throw new Error("Missing userId");
    const limit = Math.max(1, Math.min(200, Math.floor(Number(args.limit ?? 50))));

    const rows = await ctx.runQuery(rawQueries.listPositionsForUser, {
      organizationId: orgId,
      userId,
      limit,
    });
    const list = Array.isArray(rows) ? rows : [];
    return list.map((r: any) => ({
      externalPositionId: String(r.externalPositionId ?? ""),
      symbol: typeof r.symbol === "string" ? r.symbol : null,
      instrumentId: typeof r.instrumentId === "string" ? r.instrumentId : null,
      side: (r.side === "sell" ? "sell" : r.side === "buy" ? "buy" : null) as
        | "buy"
        | "sell"
        | null,
      openedAt: typeof r.openedAt === "number" ? Number(r.openedAt) : null,
      qty: typeof r.qty === "number" ? Number(r.qty) : null,
      avgPrice: typeof r.avgPrice === "number" ? Number(r.avgPrice) : null,
      updatedAt: Number(r.updatedAt ?? 0),
    }));
  },
});

