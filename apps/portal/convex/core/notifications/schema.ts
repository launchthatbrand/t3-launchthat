import { defineTable } from "convex/server";
import { v } from "convex/values";

// Notifications table definition
export const notificationsTable = defineTable({
  userId: v.id("users"),
  orgId: v.id("organizations"),
  eventKey: v.string(),
  // Used for UI grouping (tabs). Core defaults to "system"; plugins can set their own (e.g. "lms").
  tabKey: v.optional(v.string()),
  scopeKind: v.optional(v.string()),
  scopeId: v.optional(v.string()),
  title: v.string(),
  content: v.optional(v.string()),
  read: v.boolean(),
  actionUrl: v.optional(v.string()),
  actionData: v.optional(v.record(v.string(), v.string())),
  createdAt: v.number(),
  // Sources/relations (optional)
  sourceUserId: v.optional(v.id("users")),
  // sourceDownloadId: v.optional(v.id("downloads")),
  expiresAt: v.optional(v.number()),
})
  .index("by_user", ["userId"]) // legacy
  .index("by_user_org", ["userId", "orgId"])
  .index("by_user_org_read", ["userId", "orgId", "read"])
  .index("by_user_org_eventKey", ["userId", "orgId", "eventKey"]);

// Notification preferences table
export const notificationPreferencesTable = defineTable({
  userId: v.id("users"),
  emailPreferences: v.optional(v.record(v.string(), v.boolean())),
  appPreferences: v.optional(v.record(v.string(), v.boolean())),
  pushEnabled: v.optional(v.boolean()),
  pushToken: v.optional(v.string()),
}).index("by_user", ["userId"]);

export const notificationOrgDefaultsTable = defineTable({
  orgId: v.id("organizations"),
  inAppDefaults: v.optional(v.record(v.string(), v.boolean())),
}).index("by_org", ["orgId"]);

export const notificationUserEventPrefsTable = defineTable({
  userId: v.id("users"),
  orgId: v.id("organizations"),
  inAppEnabled: v.optional(v.record(v.string(), v.boolean())),
}).index("by_user_org", ["userId", "orgId"]);

export const notificationSubscriptionsTable = defineTable({
  userId: v.id("users"),
  orgId: v.id("organizations"),
  eventKey: v.string(),
  scopeKind: v.string(),
  scopeId: v.union(v.string(), v.null()),
  enabled: v.boolean(),
})
  .index("by_user_org", ["userId", "orgId"])
  .index("by_user_org_event", ["userId", "orgId", "eventKey"])
  .index("by_user_org_event_scope", [
    "userId",
    "orgId",
    "eventKey",
    "scopeKind",
    "scopeId",
  ])
  .index("by_org_event_scope", ["orgId", "eventKey", "scopeKind", "scopeId"]);

// Export schema aggregate for main schema composition
export const notificationsSchema = {
  notifications: notificationsTable,
  notificationPreferences: notificationPreferencesTable,
  notificationOrgDefaults: notificationOrgDefaultsTable,
  notificationUserEventPrefs: notificationUserEventPrefsTable,
  notificationSubscriptions: notificationSubscriptionsTable,
};
