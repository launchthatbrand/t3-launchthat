import type { Doc, Id } from "../../../_generated/dataModel";
import type { QueryCtx } from "../../../_generated/server";

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
 * Default notification preferences.
 *
 * Core notifications are **plugin-agnostic**: we do not maintain a global list
 * of notification types here.
 *
 * Behavior is controlled by:
 * - `notificationOrgDefaults.inAppDefaults[eventKey]` (optional)
 * - `notificationUserEventPrefs.inAppEnabled[eventKey]` (optional)
 *
 * If there is no explicit setting for an event key, delivery defaults to enabled.
 */
export const defaultEmailPreferences: Record<string, boolean> = {};

// Copy the same defaults for app preferences
export const defaultAppPreferences: Record<string, boolean> = {};

/**
 * Get notification type display name
 */
export function getNotificationTypeDisplayName(type: string): string {
  const normalized = String(type).trim();
  if (!normalized) return "Notification";
  // e.g. "lms.course.stepAdded" -> "Lms Course Step Added"
  const parts = normalized
    .split(/[._/-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));
  return parts.join(" ");
}
