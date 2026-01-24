import { defineSchema, defineTable } from "convex/server";

import { v } from "convex/values";

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
    name: v.optional(v.string()),
    image: v.optional(v.string()),

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
    .index("by_organization", ["organizationId"]),

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
});

