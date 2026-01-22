import { query } from "../server";
import { v } from "convex/values";

export const listInstrumentsByTradableInstrumentIds = query({
  args: {
    sourceKey: v.string(),
    tradableInstrumentIds: v.array(v.string()),
  },
  returns: v.array(
    v.object({
      tradableInstrumentId: v.string(),
      symbol: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const sourceKey = args.sourceKey.trim();
    if (!sourceKey) return [];

    const unique = Array.from(
      new Set(
        args.tradableInstrumentIds
          .map((id) => id.trim())
          .filter(Boolean),
      ),
    ).slice(0, 200);
    if (unique.length === 0) return [];

    const out: Array<{ tradableInstrumentId: string; symbol: string }> = [];

    // Convex doesn't support "IN" queries; resolve by index lookups.
    for (const tradableInstrumentId of unique) {
      const doc = await ctx.db
        .query("priceInstruments")
        .withIndex("by_source_and_tradableInstrumentId", (q: any) =>
          q
            .eq("sourceKey", sourceKey)
            .eq("tradableInstrumentId", tradableInstrumentId),
        )
        .first();
      if (!doc) continue;
      out.push({
        tradableInstrumentId: doc.tradableInstrumentId,
        symbol: doc.symbol,
      });
    }

    return out;
  },
});

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

