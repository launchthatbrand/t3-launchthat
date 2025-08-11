import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { getNotificationTypeDisplayName } from "./preferences";

/**
 * Generate default content for a notification based on its type and context
 */
export async function generateNotificationContent(
  ctx: MutationCtx | QueryCtx,
  args: {
    type: string;
    userId: Id<"users">;
    sourceUserId?: Id<"users">;
    sourceGroupId?: Id<"groups">;
    sourceEventId?: Id<"events">;
    sourceDownloadId?: Id<"downloads">;
    title?: string;
    message?: string;
    // Use record-like structure for additional notification data instead of any
    metadata?: Record<string, string | number | boolean | null>;
    data?: Record<string, string | number | boolean | string[] | number[]>;
  },
): Promise<string> {
  const { type } = args;
  let content = "";

  // Get user names for better notifications
  let sourceUserName = "Someone";
  if (args.sourceUserId) {
    const sourceUser = await ctx.db.get(args.sourceUserId);
    if (sourceUser) {
      sourceUserName = sourceUser.name || "Someone";
    }
  }

  // Get group name if relevant
  let groupName = "a group";
  if (args.sourceGroupId) {
    const group = await ctx.db.get(args.sourceGroupId);
    if (group) {
      groupName = group.name ?? "a group";
    }
  }

  // Get event name if relevant
  let eventName = "an event";
  if (args.sourceEventId) {
    const event = await ctx.db.get(args.sourceEventId);
    if (event) {
      eventName = event.title || "an event";
    }
  }

  // Generate content based on notification type
  switch (type) {
    case "friendRequest":
      content = `${sourceUserName} sent you a friend request.`;
      break;
    case "friendAccepted":
      content = `${sourceUserName} accepted your friend request.`;
      break;
    case "message":
      content = `You received a new message from ${sourceUserName}.`;
      break;
    case "mention":
      content = `${sourceUserName} mentioned you in a post.`;
      break;
    case "groupInvite":
      content = `${sourceUserName} invited you to join ${groupName}.`;
      break;
    case "groupJoinRequest":
      content = `${sourceUserName} requested to join ${groupName}.`;
      break;
    case "groupJoinApproved":
      content = `Your request to join ${groupName} was approved.`;
      break;
    case "groupJoinRejected":
      content = `Your request to join ${groupName} was declined.`;
      break;
    case "groupInvitation":
      content = `You've been invited to join ${groupName}.`;
      break;
    case "invitationAccepted":
      content = `${sourceUserName} accepted your invitation to ${groupName}.`;
      break;
    case "invitationDeclined":
      content = `${sourceUserName} declined your invitation to ${groupName}.`;
      break;
    case "groupPost":
      content = `New post in ${groupName}.`;
      break;
    case "groupComment":
      content = `${sourceUserName} commented on a post in ${groupName}.`;
      break;
    case "eventInvite":
      content = `You've been invited to ${eventName}.`;
      break;
    case "eventReminder":
      content = `Reminder: ${eventName} is coming up soon.`;
      break;
    case "eventUpdate":
      content = `The event ${eventName} has been updated.`;
      break;
    case "newDownload":
      content = `A new download is available.`;
      break;
    case "courseUpdate":
      content = `One of your courses has been updated.`;
      break;
    case "orderConfirmation":
      content = `Your order has been confirmed.`;
      break;
    case "paymentSuccess":
      content = `Your payment was successful.`;
      break;
    case "paymentFailed":
      content = `There was an issue with your payment.`;
      break;
    case "productUpdate":
      content = `A product you're interested in has been updated.`;
      break;
    case "systemAnnouncement":
      content = `System announcement: ${args.message || "Important information from the system."}`;
      break;
    // Social feed notification types
    case "reaction":
      content = `${sourceUserName} reacted to your post.`;
      break;
    case "comment":
      content = `${sourceUserName} commented on your post.`;
      break;
    case "commentReply":
      content = `${sourceUserName} replied to your comment.`;
      break;
    case "share":
      content = `${sourceUserName} shared your post.`;
      break;
    case "newFollowedUserPost":
      content = `${sourceUserName} posted something new.`;
      break;
    default:
      content = args.message || "You have a new notification.";
  }

  return content;
}

/**
 * Format a notification for display, with proper context
 */
export function formatNotificationForDisplay(
  notification: Doc<"notifications">,
): {
  title: string;
  message: string;
  timestamp: string;
  icon?: string;
  link?: string;
} {
  const timestamp = new Date(notification.createdAt).toLocaleString();

  let icon = "bell";

  // Set appropriate icon based on notification type
  switch (notification.type) {
    case "friendRequest":
    case "friendAccepted":
      icon = "user-plus";
      break;
    case "message":
      icon = "message-square";
      break;
    case "mention":
      icon = "at-sign";
      break;
    case "groupInvite":
    case "groupJoinRequest":
    case "groupJoinApproved":
    case "groupJoinRejected":
    case "groupInvitation":
    case "invitationAccepted":
    case "invitationDeclined":
    case "groupPost":
    case "groupComment":
      icon = "users";
      break;
    case "eventInvite":
    case "eventReminder":
    case "eventUpdate":
      icon = "calendar";
      break;
    case "newDownload":
      icon = "download";
      break;
    case "courseUpdate":
      icon = "book";
      break;
    case "orderConfirmation":
    case "paymentSuccess":
    case "paymentFailed":
      icon = "shopping-cart";
      break;
    case "productUpdate":
      icon = "package";
      break;
    case "systemAnnouncement":
      icon = "alert-triangle";
      break;
    // Social feed notification types
    case "reaction":
      icon = "heart";
      break;
    case "comment":
      icon = "message-circle";
      break;
    case "commentReply":
      icon = "corner-down-right";
      break;
    case "share":
      icon = "share-2";
      break;
    case "newFollowedUserPost":
      icon = "file-text";
      break;
  }

  return {
    title: notification.title,
    message: notification.content || "",
    timestamp,
    icon,
    link: notification.actionUrl,
  };
}

/**
 * Group notifications by type for summary display
 */
export function groupNotificationsByType(
  notifications: Doc<"notifications">[],
): Record<string, Doc<"notifications">[]> {
  return notifications.reduce(
    (groups, notification) => {
      const type = notification.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(notification);
      return groups;
    },
    {} as Record<string, Doc<"notifications">[]>,
  );
}

/**
 * Create a summary of multiple notifications of the same type
 */
export function summarizeNotifications(
  notifications: Doc<"notifications">[],
  type: string,
): string {
  const count = notifications.length;

  // Type-specific messages
  switch (type) {
    case "friendRequest":
      return `You have ${count} new friend ${count === 1 ? "request" : "requests"}.`;
    case "message":
      return `You have ${count} unread ${count === 1 ? "message" : "messages"}.`;
    case "groupInvite":
    case "groupInvitation":
      return `You have ${count} group ${count === 1 ? "invitation" : "invitations"}.`;
    case "eventInvite":
      return `You have ${count} event ${count === 1 ? "invitation" : "invitations"}.`;
    default:
      return `You have ${count} ${getNotificationTypeDisplayName(type)} ${count === 1 ? "notification" : "notifications"}.`;
  }
}
