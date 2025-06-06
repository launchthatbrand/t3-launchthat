import { cronJobs } from "convex/server";
import { v } from "convex/values";

import { internal } from "../_generated/api";
import { action, internalAction, mutation, query } from "../_generated/server";

/**
 * Set reminder preferences for an event
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
        minutesBefore: v.number(), // How many minutes before event to send reminder
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Check if event exists
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check if user is an attendee of this event
    const attendee = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", args.userId),
      )
      .first();

    if (!attendee) {
      throw new Error("User is not an attendee of this event");
    }

    // Update the event reminders
    await ctx.db.patch(event._id, {
      reminders: args.reminderSettings,
    });

    // Schedule reminders based on settings
    for (const reminder of args.reminderSettings) {
      const reminderTime = event.startTime - reminder.minutesBefore * 60 * 1000;
      const now = Date.now();

      // Only schedule if reminder time is in the future
      if (reminderTime > now) {
        await ctx.scheduler.runAt(
          new Date(reminderTime),
          internal.calendar.reminders.sendEventReminder,
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
 * Get reminder settings for an event
 */
export const getEventReminderSettings = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    return event.reminders || [];
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
    // Get the event details
    const event = await ctx.runQuery(internal.calendar.queries.getEventById, {
      eventId: args.eventId,
    });

    if (!event) {
      console.error("Event not found for reminder", args.eventId);
      return;
    }

    // Format minutes in a human-readable way
    let timeDisplay;
    if (args.minutesBefore < 60) {
      timeDisplay = `${args.minutesBefore} minutes`;
    } else if (args.minutesBefore === 60) {
      timeDisplay = "1 hour";
    } else if (args.minutesBefore % 60 === 0) {
      timeDisplay = `${args.minutesBefore / 60} hours`;
    } else {
      timeDisplay = `${Math.floor(args.minutesBefore / 60)} hours and ${args.minutesBefore % 60} minutes`;
    }

    // Create a notification
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

    // Handle other reminder types
    if (args.reminderType === "email") {
      // TODO: Send email reminder
      console.log(
        `Email reminder sent for event ${args.eventId} to user ${args.userId}`,
      );
    } else if (args.reminderType === "sms") {
      // TODO: Send SMS reminder
      console.log(
        `SMS reminder sent for event ${args.eventId} to user ${args.userId}`,
      );
    }

    return { success: true };
  },
});

/**
 * Check and send scheduled reminders for upcoming events
 * This would typically run on a schedule via a cron job
 */
export const processEventReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get current time and lookahead window (next 24 hours)
    const now = Date.now();
    const lookaheadWindow = now + 24 * 60 * 60 * 1000; // 24 hours in ms

    // Get all events in the lookahead window that have reminders
    const events = await ctx.runQuery(
      internal.calendar.queries.getUpcomingEventsWithReminders,
      {
        startDate: now,
        endDate: lookaheadWindow,
      },
    );

    const remindersSent = [];

    // Process each event
    for (const event of events) {
      if (!event.reminders || event.reminders.length === 0) continue;

      // Get all attendees who have accepted the event
      const attendees = await ctx.runQuery(
        internal.calendar.invitations.getEventAttendees,
        {
          eventId: event._id,
        },
      );

      const acceptedAttendees = attendees.filter(
        (attendee) =>
          attendee.status === "accepted" || attendee.status === "tentative",
      );

      // For each attendee, check and send reminders
      for (const attendee of acceptedAttendees) {
        for (const reminder of event.reminders) {
          const reminderTime =
            event.startTime - reminder.minutesBefore * 60 * 1000;

          // If reminder time is between now and the lookahead window, schedule it
          if (reminderTime > now && reminderTime < lookaheadWindow) {
            await ctx.scheduler.runAt(
              new Date(reminderTime),
              internal.calendar.reminders.sendEventReminder,
              {
                eventId: event._id,
                userId: attendee.userId,
                reminderType: reminder.type,
                minutesBefore: reminder.minutesBefore,
              },
            );

            remindersSent.push({
              eventId: event._id,
              userId: attendee.userId,
              reminderType: reminder.type,
              scheduledFor: new Date(reminderTime).toISOString(),
            });
          }
        }
      }
    }

    return { remindersSent };
  },
});

// Define a cron job to process reminders daily
const crons = cronJobs();

// Run reminder processing every 12 hours
crons.interval(
  "process-event-reminders",
  { hours: 12 },
  internal.calendar.reminders.processEventReminders,
  {},
);

export default crons;
