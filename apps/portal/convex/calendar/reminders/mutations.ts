import { cronJobs } from "convex/server";
import { ConvexError, v } from "convex/values";

import { internal } from "../../_generated/api";
import { internalAction, mutation } from "../../_generated/server";
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

/**
 * Set reminder preferences for a specific event & schedule reminders
 */
export const setEventReminders = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
    reminderSettings: v.array(
      v.object({
        type: v.union(
          v.literal("email"),
          v.literal("notification"),
          v.literal("sms"),
        ),
        minutesBefore: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new ConvexError({ message: "Event not found" });

    const attendee = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", args.userId),
      )
      .first();
    if (!attendee) throw new ConvexError({ message: "Not an attendee" });

    await ctx.db.patch(event._id, { reminders: args.reminderSettings });

    for (const reminder of args.reminderSettings) {
      const reminderTime = event.startTime - reminder.minutesBefore * 60 * 1000;
      if (reminderTime > Date.now()) {
        await ctx.scheduler.runAt(
          new Date(reminderTime),
          internal.calendar.reminders.mutations.sendEventReminder,
          {
            eventId: args.eventId,
            userId: args.userId,
            reminderType: reminder.type,
            minutesBefore: reminder.minutesBefore,
          },
        );
      }
    }
    return true;
  },
});

/**
 * Internal action to send an event reminder
 */
export const sendEventReminder = internalAction({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
    reminderType: v.union(
      v.literal("email"),
      v.literal("notification"),
      v.literal("sms"),
    ),
    minutesBefore: v.number(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.runQuery(internal.calendar.queries.getEventById, {
      eventId: args.eventId,
    });
    if (!event) return;

    // Humanize minutes
    let timeDisplay: string;
    if (args.minutesBefore < 60) timeDisplay = `${args.minutesBefore} minutes`;
    else if (args.minutesBefore === 60) timeDisplay = "1 hour";
    else if (args.minutesBefore % 60 === 0)
      timeDisplay = `${args.minutesBefore / 60} hours`;
    else
      timeDisplay = `${Math.floor(args.minutesBefore / 60)} hours and ${
        args.minutesBefore % 60
      } minutes`;

    await ctx.runMutation(internal.notifications.createNotification, {
      userId: args.userId,
      type: "eventReminder",
      title: `Reminder: ${event.title}`,
      content: `This event starts in ${timeDisplay}`,
      sourceEventId: args.eventId,
      actionUrl: `/calendar/events/${args.eventId}`,
      read: false,
      createdAt: Date.now(),
    });

    // TODO: email/SMS integrations here
  },
});

/**
 * Batch process upcoming reminders and schedule send actions
 */
export const processEventReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const lookaheadWindow = now + 24 * 60 * 60 * 1000;

    const events = await ctx.runQuery(
      internal.calendar.queries.getUpcomingEventsWithReminders,
      { startDate: now, endDate: lookaheadWindow },
    );

    for (const event of events) {
      if (!event.reminders?.length) continue;
      const attendees = await ctx.runQuery(
        internal.calendar.invitations.getEventAttendees,
        { eventId: event._id },
      );
      const accepted = attendees.filter(
        (a) => a.status === "accepted" || a.status === "tentative",
      );
      for (const attendee of accepted) {
        for (const reminder of event.reminders) {
          const reminderTime =
            event.startTime - reminder.minutesBefore * 60 * 1000;
          if (reminderTime > now && reminderTime < lookaheadWindow) {
            await ctx.scheduler.runAt(
              new Date(reminderTime),
              internal.calendar.reminders.mutations.sendEventReminder,
              {
                eventId: event._id,
                userId: attendee.userId,
                reminderType: reminder.type,
                minutesBefore: reminder.minutesBefore,
              },
            );
          }
        }
      }
    }
  },
});

// Schedule processing every 12 hours
const crons = cronJobs();
crons.interval(
  "process-event-reminders",
  { hours: 12 },
  internal.calendar.reminders.mutations.processEventReminders,
  {},
);
export default crons;
