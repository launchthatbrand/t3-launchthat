import { v } from "convex/values";

import { query } from "../../_generated/server";
import { getAuthenticatedConvexId } from "../lib/authUtils";

/**
 * Get reminders for a specific event
 */
export const getEventReminders = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user's Convex ID
    const userId = await getAuthenticatedConvexId(ctx);

    // Fetch the event
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      return [];
    }

    // Check if the event has reminders
    if (!event.reminders || !Array.isArray(event.reminders)) {
      return [];
    }

    return event.reminders;
  },
});

/**
 * Get user reminder preferences
 */
export const getUserReminderPreferences = query({
  args: {},
  handler: async (ctx) => {
    // Get the authenticated user's Convex ID
    const userId = await getAuthenticatedConvexId(ctx);

    // Fetch the user's preferences
    const userPreferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!userPreferences || !userPreferences.calendarSettings) {
      // Return default preferences
      return {
        defaultReminderTimes: [15, 60], // 15 min and 1 hour before by default
        reminderMethods: ["notification", "email"],
        enabled: true,
      };
    }

    return (
      userPreferences.calendarSettings.reminders || {
        defaultReminderTimes: [15, 60],
        reminderMethods: ["notification", "email"],
        enabled: true,
      }
    );
  },
});

/**
 * Get pending reminders that need to be sent
 * This is an internal query used by the scheduler
 */
export const getPendingReminders = query({
  args: {
    beforeTime: v.number(),
  },
  handler: async (ctx, args) => {
    // Find all reminders that need to be sent
    const pendingReminders = await ctx.db
      .query("eventReminders")
      .withIndex("by_reminder_time", (q) =>
        q.lt("reminderTime", args.beforeTime).eq("sent", false),
      )
      .collect();

    return pendingReminders;
  },
});
