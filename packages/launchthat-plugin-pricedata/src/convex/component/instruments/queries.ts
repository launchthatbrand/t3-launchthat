import { query } from "../server";
import { v } from "convex/values";

export const getInstrumentBySymbol = query({
  args: { sourceKey: v.string(), symbol: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("priceInstruments"),
      _creationTime: v.number(),
      sourceKey: v.string(),
      symbol: v.string(),
      tradableInstrumentId: v.string(),
      infoRouteId: v.optional(v.number()),
      metadata: v.optional(v.any()),
      updatedAt: v.number(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const sym = args.symbol.trim().toUpperCase();
    const doc = await ctx.db
      .query("priceInstruments")
      .withIndex("by_source_and_symbol", (q: any) =>
        q.eq("sourceKey", args.sourceKey).eq("symbol", sym),
      )
      .first();
    return doc ?? null;
  },
});

export const listInstrumentsForSource = query({
  args: { sourceKey: v.string(), limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("priceInstruments"),
      _creationTime: v.number(),
      sourceKey: v.string(),
      symbol: v.string(),
      tradableInstrumentId: v.string(),
      infoRouteId: v.optional(v.number()),
      metadata: v.optional(v.any()),
      updatedAt: v.number(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(5000, args.limit ?? 500));

    // NOTE: Convex requires filtering via indexes; use by_source_and_symbol for stable ordering.
    const rows = await ctx.db
      .query("priceInstruments")
      .withIndex("by_source_and_symbol", (q: any) =>
        q.eq("sourceKey", args.sourceKey),
      )
      .order("asc")
      .take(limit);

    return rows;
  },
});

