import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tradelockerConnectDrafts: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    environment: v.union(v.literal("demo"), v.literal("live")),
    server: v.string(),
    accessTokenEncrypted: v.string(),
    refreshTokenEncrypted: v.string(),
    accessTokenExpiresAt: v.optional(v.number()),
    refreshTokenExpiresAt: v.optional(v.number()),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_org_and_user_and_createdAt", [
      "organizationId",
      "userId",
      "createdAt",
    ])
    .index("by_expiresAt", ["expiresAt"]),

  tradelockerConnections: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    environment: v.union(v.literal("demo"), v.literal("live")),
    server: v.string(),
    selectedAccountId: v.string(),
    selectedAccNum: v.number(),
    accessTokenEncrypted: v.string(),
    refreshTokenEncrypted: v.string(),
    accessTokenExpiresAt: v.optional(v.number()),
    refreshTokenExpiresAt: v.optional(v.number()),
    status: v.union(
      v.literal("connected"),
      v.literal("error"),
      v.literal("disconnected"),
    ),
    lastError: v.optional(v.string()),
    // Polling / scheduling metadata
    lastSyncAt: v.number(),
    lastBrokerActivityAt: v.optional(v.number()),
    hasOpenTrade: v.optional(v.boolean()),
    syncLeaseUntil: v.optional(v.number()),
    syncLeaseOwner: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizationId_and_userId", ["organizationId", "userId"])
    .index("by_organizationId_and_status", ["organizationId", "status"])
    .index("by_status_and_lastSyncAt", ["status", "lastSyncAt"])
    .index("by_status_and_lastBrokerActivityAt", [
      "status",
      "lastBrokerActivityAt",
    ]),

  tradeOrders: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("tradelockerConnections"),
    externalOrderId: v.string(),
    symbol: v.optional(v.string()),
    instrumentId: v.optional(v.string()),
    side: v.optional(v.union(v.literal("buy"), v.literal("sell"))),
    status: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    raw: v.any(),
    updatedAt: v.number(),
  })
    .index("by_org_user_externalOrderId", [
      "organizationId",
      "userId",
      "externalOrderId",
    ])
    .index("by_org_user_createdAt", ["organizationId", "userId", "createdAt"]),

  tradeExecutions: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("tradelockerConnections"),
    externalExecutionId: v.string(),
    externalOrderId: v.optional(v.string()),
    symbol: v.optional(v.string()),
    instrumentId: v.optional(v.string()),
    side: v.optional(v.union(v.literal("buy"), v.literal("sell"))),
    executedAt: v.number(),
    price: v.optional(v.number()),
    qty: v.optional(v.number()),
    fees: v.optional(v.number()),
    raw: v.any(),
    updatedAt: v.number(),
  })
    .index("by_org_user_externalExecutionId", [
      "organizationId",
      "userId",
      "externalExecutionId",
    ])
    .index("by_org_user_executedAt", ["organizationId", "userId", "executedAt"])
    .index("by_org_user_externalOrderId", [
      "organizationId",
      "userId",
      "externalOrderId",
    ]),

  tradeOrdersHistory: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("tradelockerConnections"),
    externalOrderId: v.string(),
    symbol: v.optional(v.string()),
    instrumentId: v.optional(v.string()),
    side: v.optional(v.union(v.literal("buy"), v.literal("sell"))),
    status: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    raw: v.any(),
    updatedAt: v.number(),
  })
    .index("by_org_user_externalOrderId", [
      "organizationId",
      "userId",
      "externalOrderId",
    ])
    .index("by_org_user_createdAt", ["organizationId", "userId", "createdAt"]),

  tradePositions: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("tradelockerConnections"),
    externalPositionId: v.string(),
    symbol: v.optional(v.string()),
    instrumentId: v.optional(v.string()),
    side: v.optional(v.union(v.literal("buy"), v.literal("sell"))),
    openedAt: v.optional(v.number()),
    qty: v.optional(v.number()),
    avgPrice: v.optional(v.number()),
    raw: v.any(),
    updatedAt: v.number(),
  })
    .index("by_org_user_externalPositionId", [
      "organizationId",
      "userId",
      "externalPositionId",
    ])
    .index("by_org_user_openedAt", ["organizationId", "userId", "openedAt"]),

  tradeAccountStates: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("tradelockerConnections"),
    accountId: v.string(),
    raw: v.any(),
    updatedAt: v.number(),
  }).index("by_org_user_accountId", ["organizationId", "userId", "accountId"]),

  tradeIdeaGroups: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("tradelockerConnections"),
    accountId: v.string(),
    symbol: v.string(),
    status: v.union(v.literal("open"), v.literal("closed")),
    direction: v.union(v.literal("long"), v.literal("short")),
    openedAt: v.number(),
    closedAt: v.optional(v.number()),
    netQty: v.number(),
    avgEntryPrice: v.optional(v.number()),
    realizedPnl: v.optional(v.number()),
    fees: v.optional(v.number()),
    lastExecutionAt: v.optional(v.number()),
    lastProcessedExecutionId: v.optional(v.string()),
    thesis: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),

    discordChannelKind: v.optional(
      v.union(v.literal("mentors"), v.literal("members")),
    ),
    discordChannelId: v.optional(v.string()),
    discordMessageId: v.optional(v.string()),
    discordLastSyncedAt: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org_user_status_openedAt", [
      "organizationId",
      "userId",
      "status",
      "openedAt",
    ])
    .index("by_org_user_symbol_openedAt", [
      "organizationId",
      "userId",
      "symbol",
      "openedAt",
    ]),
});
