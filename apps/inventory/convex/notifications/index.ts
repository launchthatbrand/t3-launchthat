// Utilities and helpers
import * as libModule from "./lib";
// Preferences module
import * as preferencesModule from "./preferences";

/**
 * Notifications module
 *
 * This module provides functionality for creating, managing, and retrieving notifications.
 */

// Re-export public functions from the module files
export {
  // Query functions
  listNotifications,
  listNotificationsByClerkId,
  listNotificationsByType,
  listRecentNotifications,
  countUnreadNotifications,
  getNotificationPreferences,
} from "./queries";

export {
  // Mutation functions
  createNotification,
  batchCreateNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "./mutations";

// Export preference-related functions
export {
  // Preferences queries
  getNotificationPreferences as getPreferences,

  // Preferences mutations
  updateNotificationPreferences,
  resetNotificationPreferences,
  updateSingleNotificationPreference,
} from "./preferences";

// Re-export types
export {
  type NotificationType,
  type NotificationPreference,
  type NotificationContent,
  type NotificationData,
} from "./schema/types";

// Export modules for hierarchical access
export const preferences = preferencesModule;
export const lib = libModule;

// Schema exports
export * as schema from "./schema";

/**
 * Access patterns:
 * - api.notifications.listNotifications - for querying notifications
 * - api.notifications.createNotification - for creating notifications
 * - api.notifications.preferences.getNotificationPreferences - for notification preferences
 * - api.notifications.lib.formatters.formatNotificationForDisplay - for formatting utilities
 */
