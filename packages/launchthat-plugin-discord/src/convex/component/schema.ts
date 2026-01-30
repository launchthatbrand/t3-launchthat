import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  orgConfigs: defineTable({
    scope: v.union(v.literal("org"), v.literal("platform")),
    organizationId: v.optional(v.string()),
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
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_scope_and_organizationId", ["scope", "organizationId"])
    .index("by_scope", ["scope"]),

  guildConnections: defineTable({
    scope: v.union(v.literal("org"), v.literal("platform")),
    organizationId: v.optional(v.string()),
    guildId: v.string(),
    guildName: v.optional(v.string()),
    botModeAtConnect: v.union(v.literal("global"), v.literal("custom")),
    connectedAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_guildId", ["guildId"])
    .index("by_organizationId_and_guildId", ["organizationId", "guildId"])
    .index("by_scope", ["scope"])
    .index("by_scope_and_guildId", ["scope", "guildId"])
    .index("by_scope_and_organizationId_and_guildId", ["scope", "organizationId", "guildId"]),

  guildSettings: defineTable({
    scope: v.union(v.literal("org"), v.literal("platform")),
    organizationId: v.optional(v.string()),
    guildId: v.string(),

    // Optional: invite URL for “Join Discord” buttons in host apps.
    inviteUrl: v.optional(v.string()),
    // If enabled, org users can be auto-added to the guild during OAuth.
    autoJoinEnabled: v.optional(v.boolean()),

    // Member approvals (optional): choose a role that represents "approved".
    // The admin UI can use this to show "pending" members (missing the role) and to approve by assigning it.
    approvedMemberRoleId: v.optional(v.string()),

    // Support AI settings (forum-based support)
    supportAiEnabled: v.boolean(),
    supportForumChannelId: v.optional(v.string()),
    // Where to create invite-only private support threads when escalation keywords are detected.
    // This should be a normal text channel id.
    supportPrivateIntakeChannelId: v.optional(v.string()),
    supportStaffRoleId: v.optional(v.string()),
    escalationKeywords: v.optional(v.array(v.string())),
    escalationConfidenceThreshold: v.optional(v.number()),
    threadReplyCooldownMs: v.optional(v.number()),
    supportAiDisabledMessageEnabled: v.optional(v.boolean()),
    supportAiDisabledMessageText: v.optional(v.string()),

    // Announcements settings
    // Legacy single-purpose channel (kept for backward compat)
    courseUpdatesChannelId: v.optional(v.string()),
    // New: one announcements channel per guild + event allowlist (notification event keys)
    announcementChannelId: v.optional(v.string()),
    announcementEventKeys: v.optional(v.array(v.string())),

    // TraderLaunchpad trade feed routing (optional)
    mentorTradesChannelId: v.optional(v.string()),
    memberTradesChannelId: v.optional(v.string()),
    mentorTradesTemplateId: v.optional(v.id("messageTemplates")),
    memberTradesTemplateId: v.optional(v.id("messageTemplates")),

    updatedAt: v.number(),
  })
    .index("by_organizationId_and_guildId", ["organizationId", "guildId"])
    .index("by_guildId", ["guildId"])
    .index("by_scope_and_guildId", ["scope", "guildId"])
    .index("by_scope_and_organizationId_and_guildId", ["scope", "organizationId", "guildId"]),

  routingRuleSets: defineTable({
    scope: v.union(v.literal("org"), v.literal("platform")),
    organizationId: v.optional(v.string()),
    guildId: v.string(),
    kind: v.union(v.literal("trade_feed")),
    matchStrategy: v.union(
      v.literal("first_match"),
      v.literal("multi_cast"),
      v.literal("priority"),
    ),
    updatedAt: v.number(),
  })
    .index("by_organizationId_and_guildId_and_kind", [
      "organizationId",
      "guildId",
      "kind",
    ])
    .index("by_scope_and_guildId_and_kind", ["scope", "guildId", "kind"])
    .index("by_scope_and_organizationId_and_guildId_and_kind", [
      "scope",
      "organizationId",
      "guildId",
      "kind",
    ]),

  routingRules: defineTable({
    scope: v.union(v.literal("org"), v.literal("platform")),
    organizationId: v.optional(v.string()),
    guildId: v.optional(v.string()),
    kind: v.union(v.literal("trade_feed")),
    // Legacy field (role-based routing). Kept optional for backwards compatibility.
    channelKind: v.optional(
      v.union(v.literal("mentors"), v.literal("members")),
    ),
    channelId: v.string(),
    enabled: v.boolean(),
    // New rule builder fields
    order: v.optional(v.number()),
    priority: v.optional(v.number()),
    conditions: v.optional(
      v.object({
        actorRoles: v.optional(v.array(v.string())),
        symbols: v.optional(v.array(v.string())),
      }),
    ),
    updatedAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_organizationId_and_guildId", ["organizationId", "guildId"])
    .index("by_organizationId_and_kind", ["organizationId", "kind"])
    .index("by_organizationId_and_guildId_and_kind", [
      "organizationId",
      "guildId",
      "kind",
    ])
    .index("by_organizationId_and_guildId_and_kind_and_channelKind", [
      "organizationId",
      "guildId",
      "kind",
      "channelKind",
    ])
    .index("by_organizationId_and_guildId_and_kind_and_order", [
      "organizationId",
      "guildId",
      "kind",
      "order",
    ])
    .index("by_organizationId_and_kind_and_channelKind", [
      "organizationId",
      "kind",
      "channelKind",
    ])
    .index("by_scope_and_guildId_and_kind", ["scope", "guildId", "kind"])
    .index("by_scope_and_guildId_and_kind_and_channelKind", [
      "scope",
      "guildId",
      "kind",
      "channelKind",
    ])
    .index("by_scope_and_guildId_and_kind_and_order", [
      "scope",
      "guildId",
      "kind",
      "order",
    ])
    .index("by_scope_and_kind_and_channelKind", ["scope", "kind", "channelKind"]),

  messageTemplates: defineTable({
    scope: v.union(v.literal("org"), v.literal("platform")),
    organizationId: v.optional(v.string()),
    guildId: v.optional(v.string()),
    kind: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    template: v.string(),
    /**
     * Optional structured template config (JSON string) for richer templates.
     * Example: snapshot attachment settings (lookbackDays, showSentimentBadge).
     */
    templateJson: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_organizationId_and_kind", ["organizationId", "kind"])
    .index("by_organizationId_and_guildId_and_kind", [
      "organizationId",
      "guildId",
      "kind",
    ])
    .index("by_organizationId_and_kind_and_updatedAt", [
      "organizationId",
      "kind",
      "updatedAt",
    ])
    .index("by_organizationId_and_guildId_and_kind_and_updatedAt", [
      "organizationId",
      "guildId",
      "kind",
      "updatedAt",
    ])
    .index("by_scope_and_kind", ["scope", "kind"])
    .index("by_scope_and_guildId_and_kind", ["scope", "guildId", "kind"])
    .index("by_scope_and_kind_and_updatedAt", ["scope", "kind", "updatedAt"])
    .index("by_scope_and_guildId_and_kind_and_updatedAt", [
      "scope",
      "guildId",
      "kind",
      "updatedAt",
    ]),

  supportThreads: defineTable({
    organizationId: v.string(),
    guildId: v.string(),
    threadId: v.string(),
    forumChannelId: v.optional(v.string()),
    title: v.optional(v.string()),
    createdByDiscordUserId: v.optional(v.string()),
    // If this thread is a public forum support thread that was escalated, we store the created private thread id here.
    escalatedToPrivateThreadId: v.optional(v.string()),
    // If this thread is a private intake thread created from a public thread escalation, we store the originating public thread id here.
    escalatedFromPublicThreadId: v.optional(v.string()),
    // The user who triggered the escalation (Discord user id).
    escalationRequesterDiscordUserId: v.optional(v.string()),
    escalationKeyword: v.optional(v.string()),
    escalatedAt: v.optional(v.number()),
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
    scope: v.union(v.literal("org"), v.literal("platform")),
    organizationId: v.optional(v.string()),
    guildId: v.optional(v.string()),
    kind: v.string(), // e.g. "support_reply", "support_escalate"
    method: v.string(),
    url: v.string(),
    status: v.number(),
    retryAfterMs: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_scope_and_createdAt", ["scope", "createdAt"]),

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
    scope: v.union(v.literal("org"), v.literal("platform")),
    organizationId: v.optional(v.string()),
    userId: v.string(),
    discordUserId: v.string(),
    discordUsername: v.optional(v.string()),
    discordDiscriminator: v.optional(v.string()),
    discordGlobalName: v.optional(v.string()),
    discordAvatar: v.optional(v.string()),
    linkedAt: v.number(),
  })
    .index("by_organizationId_and_userId", ["organizationId", "userId"])
    .index("by_organizationId_and_discordUserId", [
      "organizationId",
      "discordUserId",
    ])
    .index("by_userId", ["userId"])
    .index("by_scope_and_userId", ["scope", "userId"])
    .index("by_scope_and_discordUserId", ["scope", "discordUserId"]),

  userStreamingPrefs: defineTable({
    scope: v.union(v.literal("org"), v.literal("platform")),
    organizationId: v.optional(v.string()),
    userId: v.string(),
    enabled: v.boolean(),
    enabledAt: v.optional(v.number()),
    disabledAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_organizationId_and_userId", ["organizationId", "userId"])
    .index("by_organizationId_and_updatedAt", ["organizationId", "updatedAt"])
    .index("by_scope_and_userId", ["scope", "userId"])
    .index("by_scope_and_updatedAt", ["scope", "updatedAt"]),

  userDeliveryStats: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    kind: v.string(), // e.g. "trade_stream"
    day: v.string(), // YYYY-MM-DD (UTC)
    messagesSent: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizationId_and_userId_and_day", [
      "organizationId",
      "userId",
      "day",
    ])
    .index("by_organizationId_and_userId_and_kind_and_day", [
      "organizationId",
      "userId",
      "kind",
      "day",
    ]),

  /**
   * Zapier-like event stream for Discord automations.
   * Host apps emit events into this shared table.
   */
  discordEvents: defineTable({
    scope: v.union(v.literal("org"), v.literal("platform")),
    organizationId: v.optional(v.string()),
    guildId: v.optional(v.string()),
    eventKey: v.string(),
    payloadJson: v.string(),
    dedupeKey: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_organizationId_and_createdAt", ["organizationId", "createdAt"])
    .index("by_organizationId_and_eventKey_and_createdAt", [
      "organizationId",
      "eventKey",
      "createdAt",
    ])
    .index("by_organizationId_and_guildId_and_eventKey_and_createdAt", [
      "organizationId",
      "guildId",
      "eventKey",
      "createdAt",
    ])
    .index("by_organizationId_and_dedupeKey", ["organizationId", "dedupeKey"])
    .index("by_scope_and_createdAt", ["scope", "createdAt"])
    .index("by_scope_and_eventKey_and_createdAt", ["scope", "eventKey", "createdAt"])
    .index("by_scope_and_guildId_and_eventKey_and_createdAt", [
      "scope",
      "guildId",
      "eventKey",
      "createdAt",
    ])
    .index("by_scope_and_dedupeKey", ["scope", "dedupeKey"]),

  /**
   * Zapier-like automation rules: WHEN (schedule/event) DO (send message).
   * The runner executes in the host app, but config/state is stored here.
   */
  discordAutomations: defineTable({
    scope: v.union(v.literal("org"), v.literal("platform")),
    organizationId: v.optional(v.string()),
    guildId: v.string(),
    name: v.string(),
    enabled: v.boolean(),
    trigger: v.object({
      type: v.union(v.literal("schedule"), v.literal("event")),
      config: v.any(),
    }),
    // Optional conditions evaluated by the host-app runner.
    // Examples:
    // - { marketOpen: true }
    // - { actorRole: "admin" }
    conditions: v.optional(v.any()),
    action: v.object({
      type: v.literal("send_message"),
      config: v.any(),
    }),
    state: v.optional(
      v.object({
        lastRunAt: v.optional(v.number()),
        cursor: v.optional(v.string()),
        nextRunAt: v.optional(v.number()),
      }),
    ),
    // Duplicate of state.nextRunAt for indexing.
    nextRunAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizationId_and_guildId", ["organizationId", "guildId"])
    .index("by_organizationId_and_guildId_and_enabled", [
      "organizationId",
      "guildId",
      "enabled",
    ])
    .index("by_organizationId_and_enabled_and_nextRunAt", [
      "organizationId",
      "enabled",
      "nextRunAt",
    ])
    .index("by_enabled_and_nextRunAt", ["enabled", "nextRunAt"])
    .index("by_scope_and_guildId", ["scope", "guildId"])
    .index("by_scope_and_guildId_and_enabled", ["scope", "guildId", "enabled"])
    .index("by_scope_and_enabled_and_nextRunAt", ["scope", "enabled", "nextRunAt"]),

  oauthStates: defineTable({
    scope: v.union(v.literal("org"), v.literal("platform")),
    organizationId: v.optional(v.string()),
    userId: v.optional(v.string()),
    state: v.string(),
    codeVerifier: v.string(),
    returnTo: v.string(),
    callbackPath: v.optional(v.string()),
    kind: v.union(v.literal("org_install"), v.literal("user_link")),
    createdAt: v.number(),
  })
    .index("by_state", ["state"])
    .index("by_organizationId_and_createdAt", ["organizationId", "createdAt"])
    .index("by_scope_and_createdAt", ["scope", "createdAt"]),

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
