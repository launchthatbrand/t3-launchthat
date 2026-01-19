import { mutation } from "../server";
import { v } from "convex/values";

export const upsertInstrument = mutation({
  args: {
    sourceKey: v.string(),
    symbol: v.string(),
    tradableInstrumentId: v.string(),
    infoRouteId: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  returns: v.object({ instrumentId: v.id("priceInstruments") }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const symbol = args.symbol.trim().toUpperCase();
    const existing = await ctx.db
      .query("priceInstruments")
      .withIndex("by_source_and_symbol", (q: any) =>
        q.eq("sourceKey", args.sourceKey).eq("symbol", symbol),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        tradableInstrumentId: args.tradableInstrumentId,
        infoRouteId: args.infoRouteId,
        metadata: args.metadata,
        updatedAt: now,
      });
      return { instrumentId: existing._id };
    }

    const instrumentId = await ctx.db.insert("priceInstruments", {
      sourceKey: args.sourceKey,
      symbol,
      tradableInstrumentId: args.tradableInstrumentId,
      infoRouteId: args.infoRouteId,
      metadata: args.metadata,
      updatedAt: now,
      createdAt: now,
    });
    return { instrumentId };
  },
});

