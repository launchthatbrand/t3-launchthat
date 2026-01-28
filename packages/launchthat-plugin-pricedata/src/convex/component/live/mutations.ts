import { v } from "convex/values";
import { mutation } from "../server";

export const upsertLiveCandle = mutation({
  args: {
    sourceKey: v.string(),
    tradableInstrumentId: v.string(),
    resolution: v.string(),
    minuteStartMs: v.number(),
    lastUpdateAt: v.number(),
    o: v.number(),
    h: v.number(),
    l: v.number(),
    c: v.number(),
    v: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sourceKey = args.sourceKey.trim().toLowerCase();
    const tradableInstrumentId = args.tradableInstrumentId.trim();
    const resolution = args.resolution.trim();
    const minuteStartMs = Math.floor(args.minuteStartMs);
    const lastUpdateAt = Math.floor(args.lastUpdateAt);
    if (!sourceKey || !tradableInstrumentId || !resolution) return null;
    if (!Number.isFinite(minuteStartMs) || minuteStartMs <= 0) return null;
    if (!Number.isFinite(lastUpdateAt) || lastUpdateAt <= 0) return null;

    const existing = await ctx.db
      .query("priceLiveCandles")
      .withIndex("by_source_instrument_resolution", (q: any) =>
        q
          .eq("sourceKey", sourceKey)
          .eq("tradableInstrumentId", tradableInstrumentId)
          .eq("resolution", resolution),
      )
      .first();

    const now = Date.now();
    const patch = {
      minuteStartMs,
      lastUpdateAt,
      o: args.o,
      h: args.h,
      l: args.l,
      c: args.c,
      v: args.v,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return null;
    }

    await ctx.db.insert("priceLiveCandles", { ...patch, createdAt: now });
    return null;
  },
});

