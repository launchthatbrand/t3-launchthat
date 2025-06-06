import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import {
  notificationTypeValidator,
  timestampValidator,
  userIdValidator,
} from "../../shared/validators";

// Define the notifications table
export const notificationsTable = defineTable({
  userId: userIdValidator, // User receiving the notification
  type: notificationTypeValidator,
  title: v.string(), // Short title/summary of notification
  content: v.optional(v.string()), // Optional detailed content
  read: v.boolean(), // Whether the notification has been read
  createdAt: timestampValidator, // Timestamp of when notification was created

  // Source entity references - only one should be populated based on notification type
  sourceUserId: v.optional(v.id("users")), // If from a user
  sourceGroupId: v.optional(v.id("groups")), // If from a group
  sourceEventId: v.optional(v.id("events")), // If from an event
  sourceDownloadId: v.optional(v.id("downloads")), // If about a download
  sourceOrderId: v.optional(v.id("transactions")), // If about an order/transaction

  // Action references - points to associated action entities
  postId: v.optional(v.id("groupPosts")), // Reference to relevant post
  commentId: v.optional(v.id("groupComments")), // Reference to relevant comment
  groupId: v.optional(v.id("groups")), // Reference to relevant group
  invitationId: v.optional(v.id("groupInvitations")), // Reference to relevant invitation
  joinRequestId: v.optional(v.id("groupJoinRequests")), // Reference to relevant join request

  // Action details
  actionUrl: v.optional(v.string()), // URL to navigate to when notification is clicked
  actionData: v.optional(v.any()), // Additional structured data specific to notification type
  message: v.optional(v.string()), // Custom message for notification

  // Expiration
  expiresAt: v.optional(timestampValidator), // Optional expiration timestamp

  // For related entities
  relatedId: v.optional(v.id("groupInvitations")), // Generic ID for related entities
})
  .index("by_user", ["userId"])
  .index("by_user_read", ["userId", "read"])
  .index("by_user_type", ["userId", "type"])
  .index("by_user_type_read", ["userId", "type", "read"])
  .index("by_user_timestamp", ["userId", "createdAt"])
  .index("by_expiration", ["expiresAt"]);

// Define notification preferences
export const notificationPreferencesTable = defineTable({
  userId: userIdValidator,
  // Email notification preferences by notification type
  emailPreferences: v.object({
    friendRequest: v.optional(v.boolean()),
    friendAccepted: v.optional(v.boolean()),
    message: v.optional(v.boolean()),
    mention: v.optional(v.boolean()),
    groupInvite: v.optional(v.boolean()),
    groupJoinRequest: v.optional(v.boolean()),
    groupJoinApproved: v.optional(v.boolean()),
    groupJoinRejected: v.optional(v.boolean()),
    groupInvitation: v.optional(v.boolean()),
    invitationAccepted: v.optional(v.boolean()),
    invitationDeclined: v.optional(v.boolean()),
    groupPost: v.optional(v.boolean()),
    groupComment: v.optional(v.boolean()),
    eventInvite: v.optional(v.boolean()),
    eventReminder: v.optional(v.boolean()),
    eventUpdate: v.optional(v.boolean()),
    newDownload: v.optional(v.boolean()),
    courseUpdate: v.optional(v.boolean()),
    orderConfirmation: v.optional(v.boolean()),
    paymentSuccess: v.optional(v.boolean()),
    paymentFailed: v.optional(v.boolean()),
    productUpdate: v.optional(v.boolean()),
    systemAnnouncement: v.optional(v.boolean()),
  }),

  // In-app notification preferences by notification type
  appPreferences: v.object({
    friendRequest: v.optional(v.boolean()),
    friendAccepted: v.optional(v.boolean()),
    message: v.optional(v.boolean()),
    mention: v.optional(v.boolean()),
    groupInvite: v.optional(v.boolean()),
    groupJoinRequest: v.optional(v.boolean()),
    groupJoinApproved: v.optional(v.boolean()),
    groupJoinRejected: v.optional(v.boolean()),
    groupInvitation: v.optional(v.boolean()),
    invitationAccepted: v.optional(v.boolean()),
    invitationDeclined: v.optional(v.boolean()),
    groupPost: v.optional(v.boolean()),
    groupComment: v.optional(v.boolean()),
    eventInvite: v.optional(v.boolean()),
    eventReminder: v.optional(v.boolean()),
    eventUpdate: v.optional(v.boolean()),
    newDownload: v.optional(v.boolean()),
    courseUpdate: v.optional(v.boolean()),
    orderConfirmation: v.optional(v.boolean()),
    paymentSuccess: v.optional(v.boolean()),
    paymentFailed: v.optional(v.boolean()),
    productUpdate: v.optional(v.boolean()),
    systemAnnouncement: v.optional(v.boolean()),
  }),

  // Push notification preferences
  pushEnabled: v.optional(v.boolean()),
  pushToken: v.optional(v.string()),
}).index("by_user", ["userId"]);

// Export a proper Convex schema using defineSchema
export const notificationsSchema = defineSchema({
  notifications: notificationsTable,
  notificationPreferences: notificationPreferencesTable,
});
