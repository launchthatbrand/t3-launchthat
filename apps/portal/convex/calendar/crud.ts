import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";
import { generateUniqueSlug, sanitizeSlug } from "../lib/slugs";

/**
 * Create a new calendar for a user, group, or course
 */
export const createCalendar = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    ownerId: v.string(), // Clerk user ID
    ownerType: v.union(
      v.literal("user"),
      v.literal("group"),
      v.literal("course"),
      v.literal("organization"),
    ),
    groupId: v.optional(v.id("groups")),
    courseId: v.optional(v.id("courses")),
    organizationId: v.optional(v.id("organizations")),
    isDefault: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Look up or create a Convex user from the Clerk ID
    let convexUserId: Id<"users">;

    // Find user by tokenIdentifier
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), `clerk:${args.ownerId}`))
      .unique();

    if (existingUser) {
      convexUserId = existingUser._id;
    } else {
      // Create a placeholder user record if needed
      convexUserId = await ctx.db.insert("users", {
        name: "User",
        email: `user-${args.ownerId}@example.com`, // Placeholder email
        role: "user",
        tokenIdentifier: `clerk:${args.ownerId}`,
      });
    }

    // If this is a group calendar, verify the group exists
    if (args.ownerType === "group" && args.groupId) {
      const group = await ctx.db.get(args.groupId);
      if (!group) {
        throw new Error("Group not found");
      }
    }

    // If this is a course calendar, verify the course exists
    if (args.ownerType === "course" && args.courseId) {
      const course = await ctx.db.get(args.courseId);
      if (!course) {
        throw new Error("Course not found");
      }
    }

    // Create the calendar with proper Convex IDs
    const calendarId = await ctx.db.insert("calendars", {
      name: args.name,
      description: args.description,
      color: args.color,
      ownerId: convexUserId,
      ownerType: args.ownerType,
      groupId: args.groupId,
      courseId: args.courseId,
      isDefault: args.isDefault ?? false,
      isPublic: args.isPublic ?? false,
      createdAt: Date.now(),
    });

    return calendarId;
  },
});

/**
 * Update an existing calendar
 */
export const updateCalendar = mutation({
  args: {
    calendarId: v.id("calendars"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const calendar = await ctx.db.get(args.calendarId);
    if (!calendar) {
      throw new Error("Calendar not found");
    }

    await ctx.db.patch(args.calendarId, {
      ...(args.name && { name: args.name }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.color !== undefined && { color: args.color }),
      ...(args.isDefault !== undefined && { isDefault: args.isDefault }),
      ...(args.isPublic !== undefined && { isPublic: args.isPublic }),
      updatedAt: Date.now(),
    });

    return args.calendarId;
  },
});

/**
 * Delete a calendar
 */
export const deleteCalendar = mutation({
  args: {
    calendarId: v.id("calendars"),
  },
  handler: async (ctx, args) => {
    const calendar = await ctx.db.get(args.calendarId);
    if (!calendar) {
      throw new Error("Calendar not found");
    }

    // Find and delete all calendar events links
    const calendarEvents = await ctx.db
      .query("calendarEvents")
      .withIndex("by_calendar", (q) => q.eq("calendarId", args.calendarId))
      .collect();

    for (const calendarEvent of calendarEvents) {
      await ctx.db.delete(calendarEvent._id);
    }

    // Delete calendar permissions
    const calendarPermissions = await ctx.db
      .query("calendarPermissions")
      .withIndex("by_calendar", (q) => q.eq("calendarId", args.calendarId))
      .collect();

    for (const permission of calendarPermissions) {
      await ctx.db.delete(permission._id);
    }

    // Delete the calendar
    await ctx.db.delete(args.calendarId);

    return true;
  },
});

/**
 * Create a calendar event
 */
export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    allDay: v.optional(v.boolean()),
    timezone: v.optional(v.string()),
    type: v.union(
      v.literal("meeting"),
      v.literal("webinar"),
      v.literal("workshop"),
      v.literal("class"),
      v.literal("conference"),
      v.literal("social"),
      v.literal("deadline"),
      v.literal("reminder"),
      v.literal("other"),
    ),
    color: v.optional(v.string()),
    location: v.optional(
      v.object({
        type: v.union(
          v.literal("virtual"),
          v.literal("physical"),
          v.literal("hybrid"),
        ),
        address: v.optional(v.string()),
        url: v.optional(v.string()),
        meetingId: v.optional(v.string()),
        passcode: v.optional(v.string()),
      }),
    ),
    visibility: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("restricted"),
    ),
    calendarId: v.id("calendars"),
    groupId: v.optional(v.id("groups")),
    courseId: v.optional(v.id("courses")),
    createdBy: v.string(), // Clerk user ID
    recurrence: v.optional(
      v.object({
        frequency: v.union(
          v.literal("daily"),
          v.literal("weekly"),
          v.literal("monthly"),
          v.literal("yearly"),
        ),
        interval: v.number(),
        count: v.optional(v.number()),
        until: v.optional(v.number()),
        byDay: v.optional(
          v.array(
            v.union(
              v.literal("MO"),
              v.literal("TU"),
              v.literal("WE"),
              v.literal("TH"),
              v.literal("FR"),
              v.literal("SA"),
              v.literal("SU"),
            ),
          ),
        ),
        byMonthDay: v.optional(v.array(v.number())),
        byMonth: v.optional(v.array(v.number())),
        excludeDates: v.optional(v.array(v.number())),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Check if calendar exists
    const calendar = await ctx.db.get(args.calendarId);
    if (!calendar) {
      throw new Error("Calendar not found");
    }

    // Look up or create a Convex user from the Clerk ID
    let convexUserId: Id<"users">;

    // Find user by tokenIdentifier
    const existingUser = await ctx.db
      .query("users")
      .filter((q) =>
        q.eq(q.field("tokenIdentifier"), `clerk:${args.createdBy}`),
      )
      .unique();

    if (existingUser) {
      convexUserId = existingUser._id;
    } else {
      // Create a placeholder user record if needed
      convexUserId = await ctx.db.insert("users", {
        name: "User",
        email: `user-${args.createdBy}@example.com`, // Placeholder email
        role: "user",
        tokenIdentifier: `clerk:${args.createdBy}`,
      });
    }

    // Create the event
    const eventId = await ctx.db.insert("events", {
      title: args.title,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      allDay: args.allDay ?? false,
      timezone: args.timezone,
      type: args.type,
      color: args.color,
      location: args.location,
      visibility: args.visibility,
      groupId: args.groupId,
      courseId: args.courseId,
      createdBy: convexUserId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      recurrence: args.recurrence,
    });

    // Link the event to the calendar
    await ctx.db.insert("calendarEvents", {
      calendarId: args.calendarId,
      eventId,
      isPrimary: true,
    });

    return eventId;
  },
});

/**
 * Update an event
 */
export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    allDay: v.optional(v.boolean()),
    timezone: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("meeting"),
        v.literal("webinar"),
        v.literal("workshop"),
        v.literal("class"),
        v.literal("conference"),
        v.literal("social"),
        v.literal("deadline"),
        v.literal("reminder"),
        v.literal("other"),
      ),
    ),
    color: v.optional(v.string()),
    location: v.optional(
      v.object({
        type: v.union(
          v.literal("virtual"),
          v.literal("physical"),
          v.literal("hybrid"),
        ),
        address: v.optional(v.string()),
        url: v.optional(v.string()),
        meetingId: v.optional(v.string()),
        passcode: v.optional(v.string()),
      }),
    ),
    visibility: v.optional(
      v.union(
        v.literal("public"),
        v.literal("private"),
        v.literal("restricted"),
      ),
    ),
    recurrence: v.optional(
      v.object({
        frequency: v.union(
          v.literal("daily"),
          v.literal("weekly"),
          v.literal("monthly"),
          v.literal("yearly"),
        ),
        interval: v.number(),
        count: v.optional(v.number()),
        until: v.optional(v.number()),
        byDay: v.optional(
          v.array(
            v.union(
              v.literal("MO"),
              v.literal("TU"),
              v.literal("WE"),
              v.literal("TH"),
              v.literal("FR"),
              v.literal("SA"),
              v.literal("SU"),
            ),
          ),
        ),
        byMonthDay: v.optional(v.array(v.number())),
        byMonth: v.optional(v.array(v.number())),
        excludeDates: v.optional(v.array(v.number())),
      }),
    ),
    applyToSeries: v.optional(v.boolean()),
    customSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Extract applyToSeries flag but don't include it in the update
    const { applyToSeries, customSlug, ...updateFields } = args;

    // Handle slug updates when title changes or custom slug is provided
    let updatedSlug;
    if (customSlug) {
      // If a custom slug is provided, sanitize it and ensure uniqueness
      const sanitizedSlug = sanitizeSlug(customSlug);
      updatedSlug = await generateUniqueSlug(
        ctx.db,
        "events",
        sanitizedSlug,
        args.eventId,
      );
    } else if (updateFields.title && event.title !== updateFields.title) {
      // If title changed, generate a new slug
      updatedSlug = await generateUniqueSlug(
        ctx.db,
        "events",
        updateFields.title,
        args.eventId,
      );
    }

    // If this is a recurring event and we're NOT applying to series,
    // we should create an exception instead of updating the event
    if (event.recurrence && applyToSeries === false) {
      // Create an exception for this occurrence
      const exceptionDate = event.startTime;

      // Add this date to the excluded dates
      const excludeDates = event.recurrence.excludeDates ?? [];
      if (!excludeDates.includes(exceptionDate)) {
        excludeDates.push(exceptionDate);
      }

      // Update the recurrence rule to exclude this date
      await ctx.db.patch(args.eventId, {
        recurrence: {
          ...event.recurrence,
          excludeDates,
        },
      });

      // TODO: Create a new single event with the changes for this occurrence

      return args.eventId;
    }

    // Regular update to the event
    await ctx.db.patch(args.eventId, {
      ...(updateFields.title !== undefined && { title: updateFields.title }),
      ...(updatedSlug !== undefined && { slug: updatedSlug }),
      ...(updateFields.description !== undefined && {
        description: updateFields.description,
      }),
      ...(updateFields.startTime !== undefined && {
        startTime: updateFields.startTime,
      }),
      ...(updateFields.endTime !== undefined && {
        endTime: updateFields.endTime,
      }),
      ...(updateFields.allDay !== undefined && { allDay: updateFields.allDay }),
      ...(updateFields.timezone !== undefined && {
        timezone: updateFields.timezone,
      }),
      ...(updateFields.type !== undefined && { type: updateFields.type }),
      ...(updateFields.color !== undefined && { color: updateFields.color }),
      ...(updateFields.location !== undefined && {
        location: updateFields.location,
      }),
      ...(updateFields.visibility !== undefined && {
        visibility: updateFields.visibility,
      }),
      ...(updateFields.recurrence !== undefined && {
        recurrence: updateFields.recurrence,
      }),
      updatedAt: Date.now(),
    });

    return args.eventId;
  },
});

/**
 * Delete an event
 */
export const deleteEvent = mutation({
  args: {
    eventId: v.id("events"),
    deleteOption: v.optional(
      v.union(
        v.literal("all"), // Delete all occurrences of a recurring event
        v.literal("this"), // Delete only this occurrence
        v.literal("future"), // Delete this and future occurrences
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { eventId, deleteOption = "all" } = args;

    // First, check if the event exists
    const event = await ctx.db.get(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // For non-recurring events or "all" option, simply delete the event
    if (!event.recurrence || deleteOption === "all") {
      // First, delete the calendar_event join records
      const calendarEvents = await ctx.db
        .query("calendarEvents")
        .withIndex("by_event", (q) => q.eq("eventId", eventId))
        .collect();

      for (const calendarEvent of calendarEvents) {
        await ctx.db.delete(calendarEvent._id);
      }

      // Delete any attendees
      const attendees = await ctx.db
        .query("eventAttendees")
        .withIndex("by_event", (q) => q.eq("eventId", eventId))
        .collect();

      for (const attendee of attendees) {
        await ctx.db.delete(attendee._id);
      }

      // Then delete the event itself
      await ctx.db.delete(eventId);
      return { success: true };
    }

    // For "this" option with recurring events, we need to create an exception
    if (deleteOption === "this") {
      // If this is a recurring event, add an exclusion date for this occurrence
      if (!event.recurrence.excludeDates) {
        event.recurrence.excludeDates = [];
      }

      // Add an exclusion for this occurrence
      const exceptionDate = new Date(event.startTime).getTime();
      if (!event.recurrence.excludeDates.includes(exceptionDate)) {
        event.recurrence.excludeDates.push(exceptionDate);
      }

      await ctx.db.patch(eventId, {
        recurrence: event.recurrence,
      });

      return { success: true };
    }

    // For "future" option, we need to update the recurrence end date
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (deleteOption === "future") {
      // Set the "until" date to one day before this occurrence
      const untilDate = new Date(event.startTime);
      untilDate.setDate(untilDate.getDate() - 1);

      // Update the recurrence rule
      await ctx.db.patch(eventId, {
        recurrence: {
          ...event.recurrence,
          until: untilDate.getTime(),
          count: undefined, // Remove count if it exists
        },
      });

      return { success: true };
    }

    return { success: false };
  },
});
