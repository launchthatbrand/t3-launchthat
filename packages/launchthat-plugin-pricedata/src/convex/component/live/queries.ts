import { v } from "convex/values";
import { query } from "../server";

export const getLiveCandle = query({
  args: {
    sourceKey: v.string(),
    tradableInstrumentId: v.string(),
    resolution: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      t: v.number(),
      o: v.number(),
      h: v.number(),
      l: v.number(),
      c: v.number(),
      v: v.number(),
      minuteStartMs: v.number(),
      lastUpdateAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const sourceKey = args.sourceKey.trim().toLowerCase();
    const tradableInstrumentId = args.tradableInstrumentId.trim();
    const resolution = args.resolution.trim();
    if (!sourceKey || !tradableInstrumentId || !resolution) return null;

    const row = await ctx.db
      .query("priceLiveCandles")
      .withIndex("by_source_instrument_resolution", (q: any) =>
        q
          .eq("sourceKey", sourceKey)
          .eq("tradableInstrumentId", tradableInstrumentId)
          .eq("resolution", resolution),
      )
      .order("desc")
      .first();

    if (!row) return null;
    return {
      t: row.minuteStartMs,
      o: row.o,
      h: row.h,
      l: row.l,
      c: row.c,
      v: row.v,
      minuteStartMs: row.minuteStartMs,
      lastUpdateAt: row.lastUpdateAt,
    };
  },
});

