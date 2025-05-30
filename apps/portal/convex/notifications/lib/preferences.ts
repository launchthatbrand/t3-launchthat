import { Doc, Id } from "../../_generated/dataModel";
import { QueryCtx } from "../../_generated/server";

/**
 * Get user notification preferences, creating default preferences if none exist
 */
export async function getUserNotificationPreferences(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<Doc<"notificationPreferences"> | null> {
  const preferences = await ctx.db
    .query("notificationPreferences")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  // Return existing preferences if found
  if (preferences) {
    return preferences;
  }

  // No preferences found
  return null;
}

/**
 * Default notification preferences with all types enabled
 */
export const defaultEmailPreferences = {
  friendRequest: true,
  friendAccepted: true,
  message: true,
  mention: true,
  groupInvite: true,
  groupJoinRequest: true,
  groupJoinApproved: true,
  groupJoinRejected: true,
  groupInvitation: true,
  invitationAccepted: true,
  invitationDeclined: true,
  groupPost: true,
  groupComment: true,
  eventInvite: true,
  eventReminder: true,
  eventUpdate: true,
  newDownload: true,
  courseUpdate: true,
  orderConfirmation: true,
  paymentSuccess: true,
  paymentFailed: true,
  productUpdate: true,
  systemAnnouncement: true,
};

// Copy the same defaults for app preferences
export const defaultAppPreferences = { ...defaultEmailPreferences };

/**
 * Get notification type display name
 */
export function getNotificationTypeDisplayName(type: string): string {
  const displayNames: Record<string, string> = {
    friendRequest: "Friend Request",
    friendAccepted: "Friend Request Accepted",
    message: "New Message",
    mention: "Mention",
    groupInvite: "Group Invite",
    groupJoinRequest: "Group Join Request",
    groupJoinApproved: "Group Join Approved",
    groupJoinRejected: "Group Join Rejected",
    groupInvitation: "Group Invitation",
    invitationAccepted: "Invitation Accepted",
    invitationDeclined: "Invitation Declined",
    groupPost: "Group Post",
    groupComment: "Group Comment",
    eventInvite: "Event Invite",
    eventReminder: "Event Reminder",
    eventUpdate: "Event Update",
    newDownload: "New Download",
    courseUpdate: "Course Update",
    orderConfirmation: "Order Confirmation",
    paymentSuccess: "Payment Success",
    paymentFailed: "Payment Failed",
    productUpdate: "Product Update",
    systemAnnouncement: "System Announcement",
  };

  return displayNames[type] || type;
}
