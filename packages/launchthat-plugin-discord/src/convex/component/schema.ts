import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  orgConfigs: defineTable({
    organizationId: v.string(),
    enabled: v.boolean(),

    /**
     * Bot mode for this org.
     * - global: use the shared Launchthat Discord application + bot (configured in env in the host app)
     * - custom: org provides their own Discord application + bot credentials
     */
    botMode: v.union(v.literal("global"), v.literal("custom")),

    // Custom bot/app credentials (only when botMode = "custom")
    customClientId: v.optional(v.string()),
    customClientSecretEncrypted: v.optional(v.string()),
    customBotTokenEncrypted: v.optional(v.string()),

    /**
     * Legacy fields (pre-multi-guild). Kept optional for migration.
     * TODO: Remove once all orgs migrated to botMode + guildConnections.
     */
    clientId: v.optional(v.string()),
    clientSecretEncrypted: v.optional(v.string()),
    botTokenEncrypted: v.optional(v.string()),
    guildId: v.optional(v.string()),

    connectedAt: v.number(),
    lastValidatedAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
  }).index("by_organizationId", ["organizationId"]),

  guildConnections: defineTable({
    organizationId: v.string(),
    guildId: v.string(),
    guildName: v.optional(v.string()),
    botModeAtConnect: v.union(v.literal("global"), v.literal("custom")),
    connectedAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_guildId", ["guildId"])
    .index("by_organizationId_and_guildId", ["organizationId", "guildId"]),

  guildSettings: defineTable({
    organizationId: v.string(),
    guildId: v.string(),

    // Support AI settings (forum-based support)
    supportAiEnabled: v.boolean(),
    supportForumChannelId: v.optional(v.string()),
    supportStaffRoleId: v.optional(v.string()),
    escalationKeywords: v.optional(v.array(v.string())),
    escalationConfidenceThreshold: v.optional(v.number()),
    threadReplyCooldownMs: v.optional(v.number()),

    // Announcements settings
    courseUpdatesChannelId: v.optional(v.string()),

    updatedAt: v.number(),
  })
    .index("by_organizationId_and_guildId", ["organizationId", "guildId"])
    .index("by_guildId", ["guildId"]),

  supportThreads: defineTable({
    organizationId: v.string(),
    guildId: v.string(),
    threadId: v.string(),
    forumChannelId: v.optional(v.string()),
    title: v.optional(v.string()),
    createdByDiscordUserId: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("pending_human"),
      v.literal("resolved"),
      v.literal("closed"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizationId_and_guildId", ["organizationId", "guildId"])
    .index("by_organizationId_and_threadId", ["organizationId", "threadId"])
    .index("by_guildId_and_threadId", ["guildId", "threadId"]),

  supportMessages: defineTable({
    organizationId: v.string(),
    guildId: v.string(),
    threadId: v.string(),
    messageId: v.string(),
    authorDiscordUserId: v.optional(v.string()),
    authorIsBot: v.boolean(),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_threadId_and_createdAt", ["threadId", "createdAt"])
    .index("by_guildId_and_messageId", ["guildId", "messageId"]),

  supportAiRuns: defineTable({
    organizationId: v.string(),
    guildId: v.string(),
    threadId: v.string(),
    triggerMessageId: v.string(),
    promptHash: v.string(),
    model: v.optional(v.string()),
    confidence: v.optional(v.number()),
    escalated: v.boolean(),
    answer: v.string(),
    createdAt: v.number(),
  })
    .index("by_threadId_and_createdAt", ["threadId", "createdAt"])
    .index("by_guildId_and_triggerMessageId", ["guildId", "triggerMessageId"]),

  discordApiLogs: defineTable({
    organizationId: v.optional(v.string()),
    guildId: v.optional(v.string()),
    kind: v.string(), // e.g. "support_reply", "support_escalate"
    method: v.string(),
    url: v.string(),
    status: v.number(),
    retryAfterMs: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  roleRules: defineTable({
    organizationId: v.string(),
    /**
     * Which Discord server the rule applies to.
     * Optional temporarily for migration; new rules should always include it.
     */
    guildId: v.optional(v.string()),
    kind: v.union(v.literal("product"), v.literal("marketingTag")),
    productId: v.optional(v.string()),
    marketingTagId: v.optional(v.string()),
    roleId: v.string(),
    roleName: v.optional(v.string()),
    enabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizationId_and_kind", ["organizationId", "kind"])
    .index("by_organizationId_and_productId", ["organizationId", "productId"])
    .index("by_organizationId_and_marketingTagId", [
      "organizationId",
      "marketingTagId",
    ])
    .index("by_organizationId_and_guildId_and_kind", [
      "organizationId",
      "guildId",
      "kind",
    ])
    .index("by_organizationId_and_guildId_and_productId", [
      "organizationId",
      "guildId",
      "productId",
    ])
    .index("by_organizationId_and_guildId_and_marketingTagId", [
      "organizationId",
      "guildId",
      "marketingTagId",
    ]),

  userLinks: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    discordUserId: v.string(),
    linkedAt: v.number(),
  })
    .index("by_organizationId_and_userId", ["organizationId", "userId"])
    .index("by_organizationId_and_discordUserId", [
      "organizationId",
      "discordUserId",
    ]),

  oauthStates: defineTable({
    organizationId: v.string(),
    userId: v.optional(v.string()),
    state: v.string(),
    codeVerifier: v.string(),
    returnTo: v.string(),
    kind: v.union(v.literal("org_install"), v.literal("user_link")),
    createdAt: v.number(),
  })
    .index("by_state", ["state"])
    .index("by_organizationId_and_createdAt", ["organizationId", "createdAt"]),

  syncJobs: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    reason: v.union(
      v.literal("purchase"),
      v.literal("tagChange"),
      v.literal("manual"),
    ),
    payload: v.any(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("done"),
      v.literal("failed"),
    ),
    attempts: v.number(),
    lastError: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status_and_createdAt", ["status", "createdAt"]),
});


