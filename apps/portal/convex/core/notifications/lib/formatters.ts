import type { Doc } from "../../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../../_generated/server";
import { getNotificationTypeDisplayName } from "./preferences";

/**
 * Generate default content for a notification based on its type and context
 */
export function generateNotificationContent(
  ctx: MutationCtx | QueryCtx,
  args: {
    type: string;
    // Core notifications should not require any plugin/core table IDs.
    // Plugins are responsible for constructing a human-friendly `message`.
    title?: string;
    message?: string;
    // Use record-like structure for additional notification data instead of any
    metadata?: Record<string, string | number | boolean | null>;
    data?: Record<string, string | number | boolean | string[] | number[]>;
  },
): string {
  void ctx;
  return args.message ?? args.title ?? "You have a new notification.";
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
  // Plugin-agnostic: if a plugin wants a specific icon, it can provide one in actionData.
  // (We keep the type as string so UI renderers can map however they want.)
  const icon = notification.actionData?.icon ?? "bell";

  return {
    title: notification.title,
    message: notification.content ?? "",
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
      const key = notification.eventKey;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(notification);
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
  return `You have ${count} ${getNotificationTypeDisplayName(type)} ${count === 1 ? "notification" : "notifications"}.`;
}
