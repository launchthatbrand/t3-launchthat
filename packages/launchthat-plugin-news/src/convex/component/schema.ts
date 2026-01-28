import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  newsSources: defineTable({
    sourceKey: v.string(), // unique (app-generated)
    kind: v.string(), // "rss" | "economic_calendar_api" (string for extensibility)
    label: v.optional(v.string()),
    enabled: v.boolean(),
    cadenceSeconds: v.number(),
    overlapSeconds: v.number(),
    nextRunAt: v.number(),
    // Flexible connector configuration; validated by app/UI.
    config: v.any(),
    // Cursor state for incremental fetch.
    cursor: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sourceKey", ["sourceKey"])
    .index("by_nextRunAt", ["nextRunAt"]),

  newsIngestRuns: defineTable({
    sourceId: v.id("newsSources"),
    sourceKey: v.string(),
    kind: v.string(),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    ok: v.optional(v.boolean()),
    createdRaw: v.optional(v.number()),
    dedupedEvents: v.optional(v.number()),
    createdEvents: v.optional(v.number()),
    updatedEvents: v.optional(v.number()),
    symbolLinksWritten: v.optional(v.number()),
    lastError: v.optional(v.string()),
  })
    .index("by_startedAt", ["startedAt"])
    .index("by_sourceKey_and_startedAt", ["sourceKey", "startedAt"])
    .index("by_sourceId_startedAt", ["sourceId", "startedAt"]),

  newsRawItems: defineTable({
    sourceId: v.id("newsSources"),
    sourceKey: v.string(),
    kind: v.string(),
    externalId: v.optional(v.string()),
    url: v.optional(v.string()),
    urlNormalized: v.optional(v.string()),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    contentHash: v.optional(v.string()),
    payload: v.any(),
    ingestedAt: v.number(),
  })
    .index("by_sourceId_ingestedAt", ["sourceId", "ingestedAt"])
    .index("by_sourceId_urlNormalized", ["sourceId", "urlNormalized"])
    .index("by_sourceId_externalId", ["sourceId", "externalId"]),

  newsEvents: defineTable({
    eventType: v.string(), // "headline" | "economic"
    canonicalKey: v.string(), // unique-ish within component
    title: v.string(),
    summary: v.optional(v.string()),
    // headline timing
    publishedAt: v.optional(v.number()),
    // economic timing
    startsAt: v.optional(v.number()),
    impact: v.optional(v.string()), // "low" | "medium" | "high"
    country: v.optional(v.string()),
    currency: v.optional(v.string()),
    // generic metadata for future extensions
    meta: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_canonicalKey", ["canonicalKey"])
    .index("by_eventType_publishedAt", ["eventType", "publishedAt"])
    .index("by_eventType_startsAt", ["eventType", "startsAt"]),

  newsEventSources: defineTable({
    eventId: v.id("newsEvents"),
    sourceId: v.id("newsSources"),
    sourceKey: v.string(),
    url: v.optional(v.string()),
    externalId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_eventId", ["eventId"])
    .index("by_sourceId_createdAt", ["sourceId", "createdAt"])
    .index("by_sourceId_externalId", ["sourceId", "externalId"])
    .index("by_sourceId_url", ["sourceId", "url"]),

  // symbol-scoped index (only for symbols allowed by the app)
  newsEventSymbols: defineTable({
    eventId: v.id("newsEvents"),
    symbol: v.string(),
    // For headlines we use publishedAt; for economic we use startsAt.
    at: v.number(),
    matchKind: v.optional(v.string()),
  })
    .index("by_symbol_at", ["symbol", "at"])
    .index("by_eventId_symbol", ["eventId", "symbol"])
    .index("by_eventId", ["eventId"]),

  newsUserSubscriptions: defineTable({
    userId: v.string(),
    orgId: v.string(),
    symbol: v.string(),
    enabled: v.boolean(),
    minImpact: v.optional(v.string()), // low|medium|high
    // channels: { inApp: true, email: true } etc.
    channels: v.optional(v.any()),
    cooldownSeconds: v.optional(v.number()),
    lastSentAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_org_symbol", ["userId", "orgId", "symbol"])
    .index("by_symbol_enabled", ["symbol", "enabled"]),
});

