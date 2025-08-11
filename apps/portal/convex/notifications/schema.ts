import { defineTable } from "convex/server";
import { v } from "convex/values";

// Notifications table definition
export const notificationsTable = defineTable({
  userId: v.id("users"),
  type: v.string(),
  title: v.string(),
  content: v.optional(v.string()),
  read: v.boolean(),
  actionUrl: v.optional(v.string()),
  actionData: v.optional(v.record(v.string(), v.string())),
  createdAt: v.number(),
  // Sources/relations (optional)
  sourceUserId: v.optional(v.id("users")),
  sourceGroupId: v.optional(v.id("groups")),
  sourceEventId: v.optional(v.id("events")),
  sourceDownloadId: v.optional(v.id("downloads")),
  sourceOrderId: v.optional(v.id("transactions")),
  postId: v.optional(v.id("groupPosts")),
  commentId: v.optional(v.id("groupComments")),
  groupId: v.optional(v.id("groups")),
  invitationId: v.optional(v.id("groupInvitations")),
  joinRequestId: v.optional(v.id("groupJoinRequests")),
  expiresAt: v.optional(v.number()),
  relatedId: v.optional(v.id("groupInvitations")),
})
  .index("by_user", ["userId"]) // For fetching a user's notifications
  .index("by_user_type", ["userId", "type"]); // For filtering by type within a user

// Notification preferences table
export const notificationPreferencesTable = defineTable({
  userId: v.id("users"),
  emailPreferences: v.optional(v.record(v.string(), v.boolean())),
  appPreferences: v.optional(v.record(v.string(), v.boolean())),
  pushEnabled: v.optional(v.boolean()),
  pushToken: v.optional(v.string()),
}).index("by_user", ["userId"]);

// Export schema aggregate for main schema composition
export const notificationsSchema = {
  tables: {
    notifications: notificationsTable,
    notificationPreferences: notificationPreferencesTable,
  },
};
