import { defineSchema, defineTable } from "convex/server";

import { v } from "convex/values";

import { userPublicProfileConfigV1Validator } from "./publicProfiles/types";

/**
 * TraderLaunchpad app-owned tables.
 *
 * Design decision:
 * - `users` lives in the root app schema (app-owned).
 * - `organizations` + memberships live in the `launchthat_core_tenant` component.
 *   Therefore cross-boundary references (like the active org) are stored as strings.
 */
export default defineSchema({
  authExchangeCodes: defineTable({
    codeHash: v.string(),
    organizationId: v.string(),
    clerkUserId: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
  })
    .index("by_code_hash", ["codeHash"])
    // Portal parity: indexes used for housekeeping + lookups.
    .index("by_organizationId_and_clerkUserId", ["organizationId", "clerkUserId"])
    .index("by_expiresAt", ["expiresAt"]),

  tenantSessions: defineTable({
    /**
     * SHA-256 base64url hash of the session id stored in the `tenant_session` cookie.
     * We only store the hash so the raw cookie value is never persisted.
     */
    sessionIdHash: v.string(),
    organizationId: v.string(),
    clerkUserId: v.string(),
    createdAt: v.number(),
    // Portal parity: expiresAt is always set.
    expiresAt: v.number(),
    revokedAt: v.optional(v.number()),
    lastSeenAt: v.optional(v.number()),
  })
    // Keep the original index name for backwards compatibility with existing code,
    .index("by_session_id_hash", ["sessionIdHash"])
    .index("by_organizationId_and_clerkUserId", ["organizationId", "clerkUserId"])
    .index("by_expiresAt", ["expiresAt"]),

  users: defineTable({
    email: v.string(),
    tokenIdentifier: v.optional(v.string()),
    clerkId: v.optional(v.string()),
    publicUsername: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    bio: v.optional(v.string()),
    role: v.optional(
      v.union(v.literal("user"), v.literal("staff"), v.literal("admin")),
    ),

    // User-scoped media (stored in `userMedia`).
    avatarMediaId: v.optional(v.id("userMedia")),
    coverMediaId: v.optional(v.id("userMedia")),
    publicProfileConfig: v.optional(userPublicProfileConfigV1Validator),

    /**
     * Per-user data source mode.
     * - "live": prefer broker-backed data when available.
     * - "demo": force demo/mock data (admin-only toggle).
     */
    dataMode: v.optional(v.union(v.literal("demo"), v.literal("live"))),

    /**
     * App-level admin flag (used for gated developer/admin tooling).
     * NOTE: this is app-owned and may be derived from an env allowlist.
     */
    isAdmin: v.optional(v.boolean()),

    /**
     * "Active org" selection.
     * This is a string because organizations live in a component and cannot be referenced by `v.id()`.
     */
    organizationId: v.optional(v.string()),

    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_token", ["tokenIdentifier"])
    .index("by_clerk_id", ["clerkId"])
    .index("by_public_username", ["publicUsername"])
    .index("by_organization", ["organizationId"]),

  userEntitlements: defineTable({
    userId: v.string(),
    tier: v.union(v.literal("free"), v.literal("standard"), v.literal("pro")),
    limits: v.optional(v.any()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  /**
   * User-controlled public visibility preferences for `/u/:username/*` pages.
   *
   * Notes:
   * - This is intentionally separate from platform entitlements (paid access).
   * - These flags are used for anonymous/public access decisions, including index vs detail pages.
   */
  userVisibilitySettings: defineTable({
    userId: v.string(),

    publicProfileEnabled: v.boolean(),
    tradeIdeasIndexEnabled: v.boolean(),
    tradeIdeaDetailEnabled: v.boolean(),
    ordersIndexEnabled: v.boolean(),
    orderDetailEnabled: v.boolean(),
    analyticsReportsIndexEnabled: v.boolean(),
    analyticsReportDetailEnabled: v.boolean(),

    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  /**
   * User-controlled consent for organizations to use/aggregate the user's data.
   * (E.g. org dashboards, community aggregates, Discord summaries.)
   */
  orgConsentSettings: defineTable({
    organizationId: v.string(),
    userId: v.string(),

    tradeIdeasEnabled: v.boolean(),
    openPositionsEnabled: v.boolean(),
    ordersEnabled: v.boolean(),

    updatedAt: v.number(),
  })
    .index("by_org_and_user", ["organizationId", "userId"])
    .index("by_user_and_org", ["userId", "organizationId"]),

  /**
   * Feature flags for staged rollouts / kill switches.
   *
   * These are additive on top of entitlements:
   * - entitlements decide whether a user is allowed to use a feature at all
   * - flags decide whether the feature is currently rolled out to the user segment
   */
  flags: defineTable({
    key: v.string(),
    enabled: v.boolean(),
    rolloutPercent: v.optional(v.number()), // 0-100
    allowUserIds: v.optional(v.array(v.string())),
    denyUserIds: v.optional(v.array(v.string())),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  userMedia: defineTable({
    uploadedByUserId: v.string(),
    storageId: v.id("_storage"),
    contentType: v.string(),
    size: v.number(),
    filename: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_uploader", ["uploadedByUserId"])
    .index("by_uploader_createdAt", ["uploadedByUserId", "createdAt"]),

  orgAccessSettings: defineTable({
    organizationId: v.string(),
    visibility: v.union(v.literal("public"), v.literal("private")),
    joinCodesEnabled: v.boolean(),
    updatedAt: v.number(),
  }).index("by_org", ["organizationId"]),

  orgUserInvites: defineTable({
    organizationId: v.string(),
    email: v.string(),
    role: v.string(),
    token: v.string(),
    createdByUserId: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    redeemedAt: v.optional(v.number()),
    redeemedByUserId: v.optional(v.string()),
    revokedAt: v.optional(v.number()),
  })
    .index("by_org", ["organizationId"])
    .index("by_token", ["token"])
    .index("by_expiresAt", ["expiresAt"]),

  /**
   * Platform-managed ClickHouse price data backfill jobs.
   * These are platform-admin only and are used by `/platform/data`.
   */
  platformPriceDataJobs: defineTable({
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("done"),
      v.literal("error"),
    ),
    sourceKey: v.string(),
    tradableInstrumentId: v.string(),
    symbol: v.string(),
    resolution: v.union(v.literal("1m")),
    requestedLookbackDays: v.number(),
    overlapDays: v.number(),

    // Computed fetch window in epoch ms.
    computedFromTs: v.optional(v.number()),
    computedToTs: v.optional(v.number()),

    workflowId: v.optional(v.string()),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    progress: v.optional(v.any()),
    error: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_source_and_instrument", ["sourceKey", "tradableInstrumentId"])
    .index("by_createdAt", ["createdAt"]),

  /**
   * Append-only logs for platform price data job runs (workflow/debug visibility).
   */
  platformPriceDataJobLogs: defineTable({
    jobId: v.id("platformPriceDataJobs"),
    ts: v.number(),
    level: v.union(v.literal("info"), v.literal("warn"), v.literal("error")),
    message: v.string(),
    data: v.optional(v.any()),
  })
    .index("by_ts", ["ts"])
    .index("by_jobId_and_ts", ["jobId", "ts"]),

});

