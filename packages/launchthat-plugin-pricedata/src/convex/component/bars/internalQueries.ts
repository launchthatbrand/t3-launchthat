import { v } from "convex/values";

import { query } from "../server";

const barChunkValidator = v.object({
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
});

/**
 * Debug helper: list raw `priceBarChunks` for exact keys without time window filtering.
 * Internal-only (for platform tooling / investigations).
 */
export const debugListBarChunks = query({
  args: {
    sourceKey: v.string(),
    tradableInstrumentId: v.string(),
    resolution: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(barChunkValidator),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(50, Number(args.limit ?? 10)));
    return await ctx.db
      .query("priceBarChunks")
      .withIndex("by_source_instrument_resolution_chunkStart", (q: any) =>
        q
          .eq("sourceKey", args.sourceKey)
          .eq("tradableInstrumentId", args.tradableInstrumentId)
          .eq("resolution", args.resolution),
      )
      .order("desc")
      .take(limit);
  },
});

