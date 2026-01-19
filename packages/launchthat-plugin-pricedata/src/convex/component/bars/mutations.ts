import { mutation } from "../server";
import { v } from "convex/values";

export const upsertBarChunk = mutation({
  args: {
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
  },
  returns: v.object({ chunkId: v.id("priceBarChunks") }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("priceBarChunks")
      .withIndex("by_source_instrument_resolution_chunkStart", (q: any) =>
        q
          .eq("sourceKey", args.sourceKey)
          .eq("tradableInstrumentId", args.tradableInstrumentId)
          .eq("resolution", args.resolution)
          .eq("chunkStartMs", args.chunkStartMs),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        chunkEndMs: args.chunkEndMs,
        bars: args.bars,
        updatedAt: now,
      });
      return { chunkId: existing._id };
    }

    const chunkId = await ctx.db.insert("priceBarChunks", {
      sourceKey: args.sourceKey,
      tradableInstrumentId: args.tradableInstrumentId,
      resolution: args.resolution,
      chunkStartMs: args.chunkStartMs,
      chunkEndMs: args.chunkEndMs,
      bars: args.bars,
      updatedAt: now,
      createdAt: now,
    });

    return { chunkId };
  },
});

