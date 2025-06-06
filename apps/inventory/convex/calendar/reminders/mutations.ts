import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";
import { getAuthenticatedConvexId } from "../lib/authUtils";

/**
 * Update user reminder preferences
 */
export const updateUserReminderPreferences = mutation({
  args: {
    defaultReminderTimes: v.optional(v.array(v.number())),
    reminderMethods: v.optional(v.array(v.string())),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user's Convex ID
    const userId = await getAuthenticatedConvexId(ctx);

    // Find existing user preferences
    const userPreferences = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

    if (!userPreferences) {
      // Create new user preferences record
      return await ctx.db.insert("userSettings", {
        userId,
        calendarSettings: {
          reminders: {
            defaultReminderTimes: args.defaultReminderTimes ?? [15, 60],
            reminderMethods: args.reminderMethods ?? ["notification", "email"],
            enabled: args.enabled ?? true,
          },
        },
        createdAt: now,
        updatedAt: now,
      });
    } else {
      // Update existing preferences
      return await ctx.db.patch(userPreferences._id, {
        calendarSettings: {
          ...userPreferences.calendarSettings,
          reminders: {
            defaultReminderTimes: args.defaultReminderTimes ??
              userPreferences.calendarSettings?.reminders
                ?.defaultReminderTimes ?? [15, 60],
            reminderMethods: args.reminderMethods ??
              userPreferences.calendarSettings?.reminders?.reminderMethods ?? [
                "notification",
                "email",
              ],
            enabled:
              args.enabled ??
              userPreferences.calendarSettings?.reminders?.enabled ??
              true,
          },
        },
        updatedAt: now,
      });
    }
  },
});

/**
 * Mark reminder as sent (for internal use by the scheduler)
 */
export const markReminderSent = mutation({
  args: {
    reminderId: v.id("eventReminders"),
  },
  handler: async (ctx, args) => {
    // Get the reminder
    const reminder = await ctx.db.get(args.reminderId);
    if (!reminder) {
      throw new ConvexError({
        message: "Reminder not found",
        code: "REMINDER_NOT_FOUND",
      });
    }

    // Mark it as sent
    await ctx.db.patch(args.reminderId, {
      sent: true,
      sentAt: Date.now(),
    });

    return { success: true };
  },
});
