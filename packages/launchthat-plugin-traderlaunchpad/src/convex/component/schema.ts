import { defineSchema, defineTable } from "convex/server";

import { v } from "convex/values";

export default defineSchema({
  strategies: defineTable({
    organizationId: v.string(),

    // Ownership (unifies prior user-owned + org-owned plans).
    ownerType: v.union(v.literal("user"), v.literal("org")),
    ownerId: v.string(),

    // Strategy evolution (Phase 1 uses "plan"; "dsl" reserved for later).
    kind: v.union(v.literal("plan"), v.literal("dsl")),

    name: v.string(),
    version: v.string(),
    summary: v.string(),

    // For kind="plan" this stores the current plan shape. For kind="dsl" it is reserved for later.
    spec: v.any(),

    createdByUserId: v.string(),
    archivedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org_and_ownerType_and_ownerId_and_updatedAt", [
      "organizationId",
      "ownerType",
      "ownerId",
      "updatedAt",
    ])
    .index("by_org_and_ownerType_and_updatedAt", [
      "organizationId",
      "ownerType",
      "updatedAt",
    ]),

  strategySelections: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    activeStrategyId: v.id("strategies"),
    updatedAt: v.number(),
  }).index("by_org_and_user", ["organizationId", "userId"]),

  orgStrategyPolicies: defineTable({
    organizationId: v.string(),
    allowedStrategyIds: v.array(v.id("strategies")),
    forcedStrategyId: v.optional(v.id("strategies")),
    updatedAt: v.number(),
    updatedByUserId: v.string(),
  }).index("by_org", ["organizationId"]),

  orgStrategyAssignments: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    activeStrategyId: v.id("strategies"),
    updatedAt: v.number(),
  })
    .index("by_org_and_user", ["organizationId", "userId"])
    .index("by_org_and_strategy", ["organizationId", "activeStrategyId"])
    .index("by_org_and_updatedAt", ["organizationId", "updatedAt"]),

  journalProfiles: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org_and_user", ["organizationId", "userId"])
    .index("by_org_and_isPublic", ["organizationId", "isPublic"]),

  brokerConnectDrafts: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    environment: v.union(v.literal("demo"), v.literal("live")),
    server: v.string(),
    jwtHost: v.optional(v.string()),
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

  brokerConnections: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    // Future: unify other broker/provider types behind this table.
    provider: v.optional(v.string()),
    environment: v.union(v.literal("demo"), v.literal("live")),
    server: v.string(),
    jwtHost: v.optional(v.string()),
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
    // Platform analytics helpers
    .index("by_createdAt", ["createdAt"])
    .index("by_userId_and_createdAt", ["userId", "createdAt"])
    .index("by_status_and_createdAt", ["status", "createdAt"])
    .index("by_status_and_lastSyncAt", ["status", "lastSyncAt"])
    .index("by_status_and_lastBrokerActivityAt", [
      "status",
      "lastBrokerActivityAt",
    ]),

  /**
   * Platform-level broker connections (e.g. TradingView for price data ingestion).
   * This is scoped to the platform (not per-user).
   */
  platformBrokerConnections: defineTable({
    provider: v.string(), // e.g. "tradingview"
    label: v.string(),
    username: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("disabled")),
    isDefault: v.boolean(),

    // Encrypted secrets (provider-specific).
    secrets: v.any(),

    createdAt: v.number(),
    updatedAt: v.number(),
    lastUsedAt: v.optional(v.number()),
  })
    .index("by_provider_and_updatedAt", ["provider", "updatedAt"])
    .index("by_provider_and_isDefault", ["provider", "isDefault"])
    .index("by_provider_and_status", ["provider", "status"]),

  /**
   * Platform-level connect drafts (multi-step connect flows).
   * For now used by TradeLocker platform connections.
   */
  platformBrokerConnectDrafts: defineTable({
    provider: v.string(), // e.g. "tradelocker"
    environment: v.union(v.literal("demo"), v.literal("live")),
    server: v.string(),
    jwtHost: v.optional(v.string()),
    accessTokenEncrypted: v.string(),
    refreshTokenEncrypted: v.string(),
    accessTokenExpiresAt: v.optional(v.number()),
    refreshTokenExpiresAt: v.optional(v.number()),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_expiresAt", ["expiresAt"]),

  // Multiple broker accounts under a single user connection.
  // We store the "customerAccess" snapshot from /trade/config so the UI can show
  // which accounts are blocked from instruments/trade data.
  brokerConnectionAccounts: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("brokerConnections"),

    accountId: v.string(),
    accNum: v.number(),
    name: v.optional(v.string()),
    currency: v.optional(v.string()),
    status: v.optional(v.string()),

    customerAccess: v.optional(
      v.object({
        orders: v.boolean(),
        ordersHistory: v.boolean(),
        filledOrders: v.boolean(),
        positions: v.boolean(),
        symbolInfo: v.boolean(),
        marketDepth: v.boolean(),
      }),
    ),
    lastConfigOk: v.optional(v.boolean()),
    lastConfigCheckedAt: v.optional(v.number()),
    lastConfigError: v.optional(v.string()),
    lastConfigRaw: v.optional(v.any()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_connectionId", ["connectionId"])
    .index("by_org_user_and_connectionId", [
      "organizationId",
      "userId",
      "connectionId",
    ])
    .index("by_org_user_and_accNum", ["organizationId", "userId", "accNum"]),

  /**
   * Platform-level broker accounts under a platform connection.
   * Mirrors `brokerConnectionAccounts` but is scoped to `platformBrokerConnections`.
   */
  platformBrokerConnectionAccounts: defineTable({
    connectionId: v.id("platformBrokerConnections"),

    accountId: v.string(),
    accNum: v.number(),
    name: v.optional(v.string()),
    currency: v.optional(v.string()),
    status: v.optional(v.string()),

    customerAccess: v.optional(
      v.object({
        orders: v.boolean(),
        ordersHistory: v.boolean(),
        filledOrders: v.boolean(),
        positions: v.boolean(),
        symbolInfo: v.boolean(),
        marketDepth: v.boolean(),
      }),
    ),
    lastConfigOk: v.optional(v.boolean()),
    lastConfigCheckedAt: v.optional(v.number()),
    lastConfigError: v.optional(v.string()),
    lastConfigRaw: v.optional(v.any()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_connectionId", ["connectionId"])
    .index("by_connectionId_and_accNum", ["connectionId", "accNum"]),

  tradeOrders: defineTable({
    userId: v.string(),
    connectionId: v.id("brokerConnections"),
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
    .index("by_user_externalOrderId", ["userId", "externalOrderId"])
    .index("by_user_createdAt", ["userId", "createdAt"])
    // Platform analytics helpers
    .index("by_updatedAt", ["updatedAt"])
    .index("by_userId_and_updatedAt", ["userId", "updatedAt"])
    .index("by_user_instrumentId_updatedAt", ["userId", "instrumentId", "updatedAt"]),

  tradeExecutions: defineTable({
    userId: v.string(),
    connectionId: v.id("brokerConnections"),
    externalExecutionId: v.string(),
    externalOrderId: v.optional(v.string()),
    externalPositionId: v.optional(v.string()),
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
    .index("by_user_externalExecutionId", ["userId", "externalExecutionId"])
    // Platform analytics helpers
    .index("by_updatedAt", ["updatedAt"])
    .index("by_userId_and_updatedAt", ["userId", "updatedAt"])
    .index("by_user_executedAt", ["userId", "executedAt"])
    .index("by_user_externalOrderId", ["userId", "externalOrderId"])
    .index("by_user_externalPositionId", ["userId", "externalPositionId"])
    .index("by_user_instrumentId_executedAt", ["userId", "instrumentId", "executedAt"]),

  tradeOrdersHistory: defineTable({
    userId: v.string(),
    connectionId: v.id("brokerConnections"),
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
    .index("by_user_externalOrderId", ["userId", "externalOrderId"])
    .index("by_user_createdAt", ["userId", "createdAt"])
    .index("by_user_instrumentId_updatedAt", ["userId", "instrumentId", "updatedAt"]),

  tradePositions: defineTable({
    organizationId: v.optional(v.string()),
    userId: v.string(),
    connectionId: v.id("brokerConnections"),
    externalPositionId: v.string(),
    symbol: v.optional(v.string()),
    instrumentId: v.optional(v.string()),
    side: v.optional(v.union(v.literal("buy"), v.literal("sell"))),
    openedAt: v.optional(v.number()),
    qty: v.optional(v.number()),
    avgPrice: v.optional(v.number()),
    // As-of last sync snapshot (optional, broker-dependent).
    unrealizedPnl: v.optional(v.number()),
    raw: v.any(),
    updatedAt: v.number(),
  })
    .index("by_user_externalPositionId", ["userId", "externalPositionId"])
    .index("by_org_user_openedAt", ["organizationId", "userId", "openedAt"])
    .index("by_user_openedAt", ["userId", "openedAt"]),

  tradeRealizationEvents: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("brokerConnections"),
    accountId: v.string(),

    // Stable unique key for idempotent upserts.
    externalEventId: v.string(),

    // Broker identifiers.
    externalOrderId: v.optional(v.string()),
    externalPositionId: v.string(),

    // Link to journaling.
    tradeIdeaGroupId: v.optional(v.id("tradeIdeaGroups")),

    // Event timing and economics.
    // Close-trade report (preferred source) fields.
    openAtMs: v.optional(v.number()),
    openPrice: v.optional(v.number()),
    closePrice: v.optional(v.number()),
    commission: v.optional(v.number()),
    swap: v.optional(v.number()),
    openOrderId: v.optional(v.string()),
    openTradeId: v.optional(v.string()),
    closeTradeId: v.optional(v.string()),
    instrumentId: v.optional(v.string()),
    tradableInstrumentId: v.optional(v.string()),
    positionSide: v.optional(v.string()), // e.g. "Buy"/"Sell"
    orderType: v.optional(v.string()), // e.g. "Market"

    closedAt: v.number(),
    realizedPnl: v.number(),
    fees: v.optional(v.number()),
    qtyClosed: v.optional(v.number()),

    raw: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org_user_externalEventId", [
      "organizationId",
      "userId",
      "externalEventId",
    ])
    .index("by_org_user_closedAt", ["organizationId", "userId", "closedAt"])
    // Platform analytics helpers (proxy for first sync ingestion)
    .index("by_updatedAt", ["updatedAt"])
    .index("by_userId_and_updatedAt", ["userId", "updatedAt"])
    .index("by_org_user_accountId_closedAt", [
      "organizationId",
      "userId",
      "accountId",
      "closedAt",
    ])
    .index("by_org_user_accountId_externalPositionId_closedAt", [
      "organizationId",
      "userId",
      "accountId",
      "externalPositionId",
      "closedAt",
    ])
    .index("by_org_user_tradeIdeaGroupId_closedAt", [
      "organizationId",
      "userId",
      "tradeIdeaGroupId",
      "closedAt",
    ]),

  tradeAccountStates: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("brokerConnections"),
    accountId: v.string(),
    raw: v.any(),
    updatedAt: v.number(),
  }).index("by_org_user_accountId", ["organizationId", "userId", "accountId"]),

  analyticsReports: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    name: v.string(),
    accountId: v.optional(v.string()),
    visibility: v.union(v.literal("private"), v.literal("link")),
    shareToken: v.optional(v.string()),
    shareEnabledAt: v.optional(v.number()),
    spec: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org_user_updatedAt", ["organizationId", "userId", "updatedAt"])
    .index("by_shareToken", ["shareToken"]),

  tradeIdeaSettings: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    // Auto-grouping configuration (varies by trader style/timeframe).
    groupingWindowMs: v.number(),
    splitOnDirectionFlip: v.boolean(),
    defaultTimeframe: v.optional(v.string()), // e.g. "m1" | "h1" | "h4" | "custom"
    updatedAt: v.number(),
  }).index("by_org_user", ["organizationId", "userId"]),

  /**
   * Unified permissions model (replaces visibility/share visibility settings).
   *
   * - scopeType="global": public/platform scope (applies across the app)
   * - scopeType="org": per-org consent (org can include user data in aggregates)
   */
  permissions: defineTable({
    userId: v.string(),
    scopeType: v.union(v.literal("global"), v.literal("org")),
    scopeId: v.union(v.string(), v.null()),

    // Master toggle: if true, all child types are effectively enabled for this scope.
    globalEnabled: v.boolean(),

    tradeIdeasEnabled: v.boolean(),
    openPositionsEnabled: v.boolean(),
    ordersEnabled: v.boolean(),

    updatedAt: v.number(),
  }).index("by_user_scope", ["userId", "scopeType", "scopeId"]),

  tradeIdeas: defineTable({
    userId: v.string(),

    symbol: v.string(), // canonical symbol (e.g. BTCUSD)
    instrumentId: v.optional(v.string()),

    // Thesis-level metadata
    bias: v.union(v.literal("long"), v.literal("short"), v.literal("neutral")),
    timeframe: v.string(), // e.g. "m1" | "h1" | "h4" | "custom" (string for forward compatibility)
    timeframeLabel: v.optional(v.string()),
    thesis: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),

    // Lifecycle
    status: v.union(v.literal("active"), v.literal("closed")),
    openedAt: v.number(),
    // Used for start-gap thesis grouping (avoid overlap issues when lastActivityAt > another group's openedAt).
    lastStartedAt: v.optional(v.number()),
    lastActivityAt: v.number(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_updatedAt", ["userId", "updatedAt"])
    .index("by_user_symbol_status_lastActivityAt", [
      "userId",
      "symbol",
      "status",
      "lastActivityAt",
    ]),

  tradeIdeaGroups: defineTable({
    userId: v.string(),
    connectionId: v.id("brokerConnections"),
    accountId: v.string(),
    // New hedging-safe grouping key. Optional temporarily to avoid breaking legacy rows.
    positionId: v.optional(v.string()),
    instrumentId: v.optional(v.string()),
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

    // Link to shareable thesis-level TradeIdea (optional for backward compatibility).
    tradeIdeaId: v.optional(v.id("tradeIdeas")),
    ideaAssignedAt: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_status_openedAt", ["userId", "status", "openedAt"])
    .index("by_user_symbol_status_openedAt", ["userId", "symbol", "status", "openedAt"])
    .index("by_user_accountId_positionId", ["userId", "accountId", "positionId"])
    .index("by_user_tradeIdeaId_openedAt", ["userId", "tradeIdeaId", "openedAt"])
    .index("by_user_instrumentId_openedAt", ["userId", "instrumentId", "openedAt"]),

  discordSymbolSnapshotFeeds: defineTable({
    organizationId: v.string(),
    symbol: v.string(),

    guildId: v.string(),
    channelId: v.string(),
    messageId: v.string(),

    lastPostedAt: v.optional(v.number()),
    lastEditedAt: v.optional(v.number()),
    lastError: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_org_symbol", ["organizationId", "symbol"]),

  tradeIdeaEvents: defineTable({
    userId: v.string(),
    connectionId: v.id("brokerConnections"),
    tradeIdeaGroupId: v.id("tradeIdeaGroups"),
    externalExecutionId: v.string(),
    externalOrderId: v.optional(v.string()),
    externalPositionId: v.optional(v.string()),
    executedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_user_tradeIdeaGroupId", ["userId", "tradeIdeaGroupId"])
    .index("by_user_externalExecutionId", ["userId", "externalExecutionId"])
    .index("by_user_externalOrderId", ["userId", "externalOrderId"])
    .index("by_user_externalPositionId", ["userId", "externalPositionId"]),

  tradeIdeaNotes: defineTable({
    userId: v.string(),
    tradeIdeaGroupId: v.id("tradeIdeaGroups"),
    reviewStatus: v.union(v.literal("todo"), v.literal("reviewed")),
    reviewedAt: v.optional(v.number()),
    thesis: v.optional(v.string()),
    setup: v.optional(v.string()),
    mistakes: v.optional(v.string()),
    outcome: v.optional(v.string()),
    nextTime: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    updatedAt: v.number(),
  })
    .index("by_user_tradeIdeaGroupId", ["userId", "tradeIdeaGroupId"])
    .index("by_user_reviewStatus_updatedAt", ["userId", "reviewStatus", "updatedAt"]),
});
