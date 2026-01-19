import { query } from "../server";
import { v } from "convex/values";

export const getBarChunks = query({
  args: {
    sourceKey: v.string(),
    tradableInstrumentId: v.string(),
    resolution: v.string(),
    fromMs: v.number(),
    toMs: v.number(),
  },
  returns: v.array(
    v.object({
      _id: v.id("priceBarChunks"),
      _creationTime: v.number(),
      sourceKey: v.string(),
      tradableInstrumentId: v.string(),
      resolution: v.string(),
      chunkStartMs: v.number(),
      chunkEndMs: v.number(),
      bars: v.array(
        v.object({
          t: v.number(),
          o: v.number(),
          h: v.number(),
          l: v.number(),
          c: v.number(),
          v: v.number(),
        }),
      ),
      updatedAt: v.number(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const fromMs = Math.min(args.fromMs, args.toMs);
    const toMs = Math.max(args.fromMs, args.toMs);

    // Pull chunks in range using the index. We may over-fetch slightly; filter in memory.
    const candidates = await ctx.db
      .query("priceBarChunks")
      .withIndex("by_source_instrument_resolution_chunkStart", (q: any) =>
        q
          .eq("sourceKey", args.sourceKey)
          .eq("tradableInstrumentId", args.tradableInstrumentId)
          .eq("resolution", args.resolution)
          .gte("chunkStartMs", fromMs),
      )
      .order("asc")
      .take(500);

    return candidates.filter((c) => c.chunkStartMs <= toMs);
  },
});

