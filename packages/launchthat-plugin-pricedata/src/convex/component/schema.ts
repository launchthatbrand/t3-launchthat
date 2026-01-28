import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Provider-agnostic market price cache.
 *
 * The host app is responsible for selecting a default source and providing a seed
 * identity capable of fetching data for that source (e.g. a TradeLocker-connected user).
 */
export default defineSchema({
  priceSources: defineTable({
    provider: v.union(v.literal("tradelocker")),
    environment: v.union(v.literal("demo"), v.literal("live")),
    server: v.string(), // broker/server name (e.g. HEROFX-Demo)
    jwtHost: v.optional(v.string()),
    baseUrlHost: v.optional(v.string()),
    sourceKey: v.string(), // stable unique key
    isDefault: v.optional(v.boolean()),

    // Host app-managed reference to a seed connection identity.
    // Intentionally opaque at the component boundary to allow reuse across apps.
    seedRef: v.optional(
      v.object({
        organizationId: v.string(),
        userId: v.string(),
      }),
    ),

    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_sourceKey", ["sourceKey"])
    .index("by_isDefault_and_updatedAt", ["isDefault", "updatedAt"])
    .index("by_updatedAt", ["updatedAt"]),

  priceInstruments: defineTable({
    sourceKey: v.string(),
    symbol: v.string(), // canonical symbol (e.g. AUDJPY)
    tradableInstrumentId: v.string(), // provider-specific instrument id
    infoRouteId: v.optional(v.number()),
    metadata: v.optional(v.any()),
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_source_and_symbol", ["sourceKey", "symbol"])
    .index("by_source_and_tradableInstrumentId", [
      "sourceKey",
      "tradableInstrumentId",
    ]),

  priceBarChunks: defineTable({
    sourceKey: v.string(),
    tradableInstrumentId: v.string(),
    resolution: v.string(), // provider string ("15m", "1H", etc.)
    chunkStartMs: v.number(),
    chunkEndMs: v.number(),

    // bars are normalized to {t,o,h,l,c,v} (ms + OHLCV)
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
  }).index("by_source_instrument_resolution_chunkStart", [
    "sourceKey",
    "tradableInstrumentId",
    "resolution",
    "chunkStartMs",
  ]),

  /**
   * Ephemeral cache for the *current* in-progress candle (hybrid model).
   * Finalized candles live in ClickHouse; this table is for low-latency UI updates.
   */
  priceLiveCandles: defineTable({
    sourceKey: v.string(),
    tradableInstrumentId: v.string(),
    resolution: v.string(), // start with "1m"; kept generic
    minuteStartMs: v.number(),
    lastUpdateAt: v.number(),

    o: v.number(),
    h: v.number(),
    l: v.number(),
    c: v.number(),
    v: v.number(),

    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_source_instrument_resolution", [
      "sourceKey",
      "tradableInstrumentId",
      "resolution",
    ])
    .index("by_updatedAt", ["updatedAt"]),
});

