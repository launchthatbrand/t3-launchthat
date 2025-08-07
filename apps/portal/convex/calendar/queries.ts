import type { Doc, Id } from "../_generated/dataModel";

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get calendars for the currently authenticated user
 */
export const getUserCalendars = query({
  args: {},
  handler: async (ctx) => {
    // Get current user from auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Find the Convex user from the auth identity
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) {
      return [];
    }

    // Get user's own calendars
    const userCalendars = await ctx.db
      .query("calendars")
      .filter((q) =>
        q.and(
          q.eq(q.field("ownerType"), "user"),
          q.eq(q.field("ownerId"), user._id),
        ),
      )
      .collect();

    // Get calendars the user has permissions for
    const permissionedCalendarIds = await ctx.db
      .query("calendarPermissions")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    const permissionedCalendars = await Promise.all(
      permissionedCalendarIds.map(async (permission) => {
        return await ctx.db.get(permission.calendarId);
      }),
    );

    // Filter out any null values (in case calendars were deleted)
    const validPermissionedCalendars = permissionedCalendars.filter(Boolean);

    return [...userCalendars, ...validPermissionedCalendars];
  },
});

/**
 * Get calendars for a specific user
 */
export const getCalendars = query({
  args: {
    userId: v.string(), // Clerk user ID
  },
  handler: async (ctx, args) => {
    // First, find the Convex user ID from the Clerk user ID
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), `clerk:${args.userId}`))
      .unique();

    if (!user) {
      return []; // No user found, return empty array
    }

    // Now get user's own calendars using the Convex user ID
    const userCalendars = await ctx.db
      .query("calendars")
      .filter((q) =>
        q.and(
          q.eq(q.field("ownerType"), "user"),
          q.eq(q.field("ownerId"), user._id),
        ),
      )
      .collect();

    // Get calendars the user has permissions for
    const permissionedCalendarIds = await ctx.db
      .query("calendarPermissions")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    const permissionedCalendars = await Promise.all(
      permissionedCalendarIds.map(async (permission) => {
        return await ctx.db.get(permission.calendarId);
      }),
    );

    // Filter out any null values (in case calendars were deleted)
    const validPermissionedCalendars = permissionedCalendars.filter(Boolean);

    return [...userCalendars, ...validPermissionedCalendars];
  },
});

/**
 * Get public calendars
 */
export const getPublicCalendars = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("calendars")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .collect();
  },
});

/**
 * Get group calendars
 */
export const getGroupCalendars = query({
  args: {
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calendars")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
  },
});

/**
 * Get events for a specific calendar
 */
export const getCalendarEvents = query({
  args: {
    calendarId: v.id("calendars"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Get event IDs linked to this calendar
    const calendarEvents = await ctx.db
      .query("calendarEvents")
      .withIndex("by_calendar", (q) => q.eq("calendarId", args.calendarId))
      .collect();

    const eventIds = calendarEvents.map((ce) => ce.eventId);

    // If no events, return empty array
    if (eventIds.length === 0) {
      return [];
    }

    // Process events in batches to avoid filter limitations
    const allEvents: Doc<"events">[] = [];

    // Process in smaller batches of 10 events
    for (let i = 0; i < eventIds.length; i += 10) {
      const batchIds = eventIds.slice(i, i + 10);

      // For each event ID in the batch, fetch if it's in the date range
      for (const eventId of batchIds) {
        const event = await ctx.db.get(eventId);

        // Skip if event doesn't exist
        if (!event) continue;

        // Check if event is in the specified date range
        const { startTime, endTime } = event;

        if (
          // Event starts within range
          (startTime >= args.startDate && startTime <= args.endDate) ||
          // Event ends within range
          (endTime >= args.startDate && endTime <= args.endDate) ||
          // Event spans the entire range
          (startTime <= args.startDate && endTime >= args.endDate)
        ) {
          allEvents.push(event);
        }
      }
    }

    return allEvents;
  },
});

/**
 * Get all events for a user across all their calendars
 */
export const getAllEvents = query({
  args: {
    userId: v.string(), // Clerk user ID
    startDate: v.number(),
    endDate: v.number(),
    calendarIds: v.optional(v.array(v.id("calendars"))), // Optional parameter to filter by specific calendars
    includeRecurring: v.optional(v.boolean()), // Whether to include recurring event instances
  },
  handler: async (ctx, args) => {
    // First, find the Convex user ID from the Clerk user ID
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), `clerk:${args.userId}`))
      .unique();

    if (!user) {
      return []; // No user found, return empty array
    }

    // Determine which calendars to query
    let calendarIds: Id<"calendars">[] = [];

    // If calendarIds are provided, use those directly
    if (args.calendarIds && args.calendarIds.length > 0) {
      calendarIds = args.calendarIds;
    } else {
      // Otherwise get all calendars the user has access to
      // Get user's own calendars using the Convex user ID
      const userCalendars = await ctx.db
        .query("calendars")
        .filter((q) =>
          q.and(
            q.eq(q.field("ownerType"), "user"),
            q.eq(q.field("ownerId"), user._id),
          ),
        )
        .collect();

      // Get calendars the user has permissions for
      const permissionedCalendarIds = await ctx.db
        .query("calendarPermissions")
        .filter((q) => q.eq(q.field("userId"), user._id))
        .collect();

      const permissionedCalendars = await Promise.all(
        permissionedCalendarIds.map(async (permission) => {
          return await ctx.db.get(permission.calendarId);
        }),
      );

      // Combine all calendar IDs
      const allCalendars = [
        ...userCalendars,
        ...permissionedCalendars.filter(Boolean),
      ];

      for (const calendar of allCalendars) {
        if (calendar) {
          calendarIds.push(calendar._id);
        }
      }
    }

    // If no calendars, return empty array
    if (calendarIds.length === 0) {
      return [];
    }

    // Get all events from all calendars
    const allEvents: Doc<"events">[] = [];

    // Process each calendar one by one
    for (const calendarId of calendarIds) {
      // Get events for this calendar
      const calendarEvents = await ctx.db
        .query("calendarEvents")
        .withIndex("by_calendar", (q) => q.eq("calendarId", calendarId))
        .collect();

      // Get event IDs
      const eventIds = calendarEvents.map((ce) => ce.eventId);

      // Process in smaller batches
      for (let i = 0; i < eventIds.length; i += 10) {
        const batchIds = eventIds.slice(i, i + 10);

        // Fetch each event in the batch
        for (const eventId of batchIds) {
          const event = await ctx.db.get(eventId);

          // Skip if event doesn't exist
          if (!event) continue;

          // Check if this is an event in the specified date range
          const inDateRange =
            // Event starts within range
            (event.startTime >= args.startDate &&
              event.startTime <= args.endDate) ||
            // Event ends within range
            (event.endTime >= args.startDate &&
              event.endTime <= args.endDate) ||
            // Event spans the entire range
            (event.startTime <= args.startDate &&
              event.endTime >= args.endDate);

          // Include events in range or those with recurrence patterns that might have instances in range
          if (inDateRange || event.recurrence) {
            // Check for duplicates before adding
            if (!allEvents.some((e) => e._id === event._id)) {
              allEvents.push(event);
            }
          }
        }
      }
    }

    return allEvents;
  },
});

/**
 * Get attendees for an event
 */
export const getEventAttendees = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("eventAttendees")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
  },
});

/**
 * Get a specific event by ID
 */
export const getEventById = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

/**
 * Get calendar for a specific event
 */
export const getCalendarForEvent = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      return [];
    }

    // Find the calendar_events entry for this event
    return await ctx.db
      .query("calendarEvents")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
  },
});

/**
 * Get a specific calendar by ID
 */
export const getCalendarById = query({
  args: {
    calendarId: v.id("calendars"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.calendarId);
  },
});

/**
 * Generate instances of a recurring event within a date range
 */
export const generateRecurringEventInstances = query({
  args: {
    eventId: v.id("events"),
    startDate: v.number(), // Start of date range to generate instances for
    endDate: v.number(), // End of date range to generate instances for
  },
  handler: async (ctx, args) => {
    // Get the event
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // If the event doesn't have recurrence rules, just return the original event if it falls in range
    if (!event.recurrence) {
      if (
        (event.startTime >= args.startDate &&
          event.startTime <= args.endDate) ||
        (event.endTime >= args.startDate && event.endTime <= args.endDate) ||
        (event.startTime <= args.startDate && event.endTime >= args.endDate)
      ) {
        return [event];
      }
      return [];
    }

    // Calculate event duration in milliseconds
    const eventDuration = event.endTime - event.startTime;

    // Generate recurring instances
    const instances = [];
    const recurrence = event.recurrence;

    // Determine maximum date (either until date or end of requested range)
    const maxDate = recurrence.until
      ? Math.min(recurrence.until, args.endDate)
      : args.endDate;

    // Determine max count (if specified in recurrence)
    const maxCount = recurrence.count ?? Number.MAX_SAFE_INTEGER;

    let currentDate = new Date(event.startTime);
    let count = 0;

    // Helper function to add days to a date
    const addDays = (date: Date, days: number) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };

    // Helper function to add weeks to a date
    const addWeeks = (date: Date, weeks: number) => {
      return addDays(date, weeks * 7);
    };

    // Helper function to add months to a date
    const addMonths = (date: Date, months: number) => {
      const result = new Date(date);
      result.setMonth(result.getMonth() + months);
      return result;
    };

    // Helper function to add years to a date
    const addYears = (date: Date, years: number) => {
      const result = new Date(date);
      result.setFullYear(result.getFullYear() + years);
      return result;
    };

    // Helper function to check if a day matches the byDay constraint
    const matchesDay = (date: Date, byDay: string[] | undefined) => {
      if (!byDay || byDay.length === 0) return true;

      const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
      const dayOfWeek = days[date.getDay()];
      return byDay.includes(dayOfWeek);
    };

    while (currentDate.getTime() <= maxDate && count < maxCount) {
      // Check if this instance falls within the requested date range
      if (currentDate.getTime() >= args.startDate) {
        // Create an instance of the event
        const instanceStart = currentDate.getTime();
        const instanceEnd = instanceStart + eventDuration;

        // Check if this instance should be excluded
        const shouldExclude =
          recurrence.excludeDates?.includes(instanceStart) ?? false;

        if (!shouldExclude) {
          instances.push({
            ...event,
            _id: `${event._id}_${instanceStart}`, // This is for UI differentiation only
            startTime: instanceStart,
            endTime: instanceEnd,
            isRecurringInstance: true,
            originalEventId: event._id,
          });

          count++;
        }
      }

      // Calculate next occurrence based on frequency
      switch (recurrence.frequency) {
        case "daily":
          currentDate = addDays(currentDate, recurrence.interval ?? 1);
          break;
        case "weekly":
          // For weekly recurrence, we need to handle byDay differently
          if (recurrence.byDay && recurrence.byDay.length > 0) {
            // Move to the next day
            currentDate = addDays(currentDate, 1);

            // Keep moving until we find a matching day or we've gone past a week
            let daysChecked = 1;
            const interval = recurrence.interval ?? 1;
            while (
              !matchesDay(currentDate, recurrence.byDay) &&
              daysChecked < 7 * interval
            ) {
              currentDate = addDays(currentDate, 1);
              daysChecked++;
            }

            // If we've checked a whole week and found no matching days, jump to the next interval
            if (daysChecked >= 7 * interval) {
              currentDate = addWeeks(new Date(event.startTime), interval);
            }
          } else {
            // Simple case: just add weeks
            currentDate = addWeeks(currentDate, recurrence.interval ?? 1);
          }
          break;
        case "monthly":
          currentDate = addMonths(currentDate, recurrence.interval ?? 1);
          break;
        case "yearly":
          currentDate = addYears(currentDate, recurrence.interval ?? 1);
          break;
      }
    }

    return instances;
  },
});

/**
 * Get upcoming events with reminders
 */
export const getUpcomingEventsWithReminders = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Get events in the time range
    const events = await ctx.db
      .query("events")
      .withIndex("by_timeRange", (q) =>
        q.gte("startTime", args.startDate).lte("startTime", args.endDate),
      )
      .collect();

    // Filter only events with reminders
    return events.filter(
      (event) =>
        event.reminders &&
        Array.isArray(event.reminders) &&
        event.reminders.length > 0,
    );
  },
});
