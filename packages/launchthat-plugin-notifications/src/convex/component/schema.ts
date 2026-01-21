import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Notifications schema, modeled after Portal's notifications tables but tuned for reuse.
 *
 * Assumes `users` and `organizations` tables exist (provided by `launchthat-plugin-core-tenant`).
 */
export default defineSchema({
  notifications: defineTable({
    userId: v.id("users"),
    orgId: v.id("organizations"),
    eventKey: v.string(),
    // UI grouping (tabs). Core defaults to "system"; apps can use "organization", etc.
    tabKey: v.optional(v.string()),
    scopeKind: v.optional(v.string()),
    scopeId: v.optional(v.string()),
    title: v.string(),
    content: v.optional(v.string()),
    read: v.boolean(),
    actionUrl: v.optional(v.string()),
    actionData: v.optional(v.record(v.string(), v.string())),
    createdAt: v.number(),
    sourceUserId: v.optional(v.id("users")),
    expiresAt: v.optional(v.number()),
  })
    .index("by_user_createdAt", ["userId", "createdAt"])
    .index("by_user_org_createdAt", ["userId", "orgId", "createdAt"])
    .index("by_user_org_read", ["userId", "orgId", "read"])
    .index("by_user_org_eventKey", ["userId", "orgId", "eventKey"]),

  notificationOrgDefaults: defineTable({
    orgId: v.id("organizations"),
    inAppDefaults: v.optional(v.record(v.string(), v.boolean())),
    emailDefaults: v.optional(v.record(v.string(), v.boolean())),
  }).index("by_org", ["orgId"]),

  notificationUserEventPrefs: defineTable({
    userId: v.id("users"),
    orgId: v.id("organizations"),
    inAppEnabled: v.optional(v.record(v.string(), v.boolean())),
    emailEnabled: v.optional(v.record(v.string(), v.boolean())),
  }).index("by_user_org", ["userId", "orgId"]),
});

