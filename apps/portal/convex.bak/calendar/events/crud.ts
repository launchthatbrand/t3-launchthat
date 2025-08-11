import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";
import { generateUniqueSlug, sanitizeSlug } from "../../lib/slugs";
import {
  eventTypeValidator,
  locationValidator,
  recurrenceValidator,
  timestampValidator,
  visibilityValidator,
} from "../../shared/validators";
import { getAuthenticatedConvexId } from "../lib/authUtils";

/**
 * Create a new calendar event
 */
export const createEvent = mutation({
  args: {
    title: v.string(),
    startTime: timestampValidator,
    endTime: timestampValidator,
    description: v.optional(v.string()),
    allDay: v.optional(v.boolean()),
    timezone: v.optional(v.string()),
    type: eventTypeValidator,
    color: v.optional(v.string()),
    location: v.optional(locationValidator),
    visibility: visibilityValidator,
    groupId: v.optional(v.id("groups")),
    courseId: v.optional(v.id("courses")),
    calendarId: v.optional(v.id("calendars")),
    recurrence: v.optional(recurrenceValidator),
    customSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user's Convex ID
    const userId = await getAuthenticatedConvexId(ctx);

    // Basic validation
    if (args.startTime > args.endTime) {
      throw new ConvexError({
        message: "Start time must be before end time",
        code: "INVALID_TIME_RANGE",
      });
    }

    const now = Date.now();

    // Generate a unique slug from the title or use a custom slug if provided
    let slug;
    if (args.customSlug) {
      // Sanitize the custom slug if provided
      const sanitizedSlug = sanitizeSlug(args.customSlug);
      slug = await generateUniqueSlug(ctx.db, "events", sanitizedSlug);
    } else {
      // Generate a slug from the event title
      slug = await generateUniqueSlug(ctx.db, "events", args.title);
    }

    // Create the event
    const eventId = await ctx.db.insert("events", {
      title: args.title,
      slug,
      startTime: args.startTime,
      endTime: args.endTime,
      description: args.description,
      allDay: args.allDay ?? false,
      timezone: args.timezone,
      type: args.type,
      color: args.color,
      location: args.location,
      visibility: args.visibility,
      groupId: args.groupId,
      courseId: args.courseId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      recurrence: args.recurrence,
    });

    // If a calendar ID was provided, link the event to the calendar
    if (args.calendarId) {
      await ctx.db.insert("calendarEvents", {
        calendarId: args.calendarId,
        eventId,
        // Remove fields not in the schema
        isPrimary: true,
      });
    }

    return eventId;
  },
});

/**
 * Update an existing calendar event
 */
export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    title: v.optional(v.string()),
    startTime: v.optional(timestampValidator),
    endTime: v.optional(timestampValidator),
    description: v.optional(v.string()),
    allDay: v.optional(v.boolean()),
    timezone: v.optional(v.string()),
    type: v.optional(eventTypeValidator),
    color: v.optional(v.string()),
    location: v.optional(locationValidator),
    visibility: v.optional(visibilityValidator),
    groupId: v.optional(v.id("groups")),
    courseId: v.optional(v.id("courses")),
    recurrence: v.optional(recurrenceValidator),
    customSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user's Convex ID
    const userId = await getAuthenticatedConvexId(ctx);

    // Get the event
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new ConvexError({
        message: "Event not found",
        code: "EVENT_NOT_FOUND",
      });
    }

    // Check if user is allowed to edit this event
    if (event.createdBy !== userId) {
      // Check if user is an admin or has edit permissions
      // This is a simplified check - real implementation would be more comprehensive
      const isAdmin = await ctx.db
        .query("users")
        .withIndex("by_id", (q) => q.eq("_id", userId))
        .filter((q) => q.eq(q.field("role"), "admin"))
        .unique();

      if (!isAdmin) {
        throw new ConvexError({
          message: "You don't have permission to edit this event",
          code: "PERMISSION_DENIED",
        });
      }
    }

    // Validate start and end times if both are provided
    if (args.startTime !== undefined && args.endTime !== undefined) {
      if (args.startTime > args.endTime) {
        throw new ConvexError({
          message: "Start time must be before end time",
          code: "INVALID_TIME_RANGE",
        });
      }
    }

    // Handle slug updates when title changes or custom slug is provided
    const { customSlug, ...updateFields } = args;

    // Prepare updates
    const updates: Record<string, unknown> = {
      ...updateFields,
      updatedAt: Date.now(),
    };

    // Add slug to updates if needed
    if (customSlug) {
      // If a custom slug is provided, sanitize it and ensure uniqueness
      const sanitizedSlug = sanitizeSlug(customSlug);
      updates.slug = await generateUniqueSlug(
        ctx.db,
        "events",
        sanitizedSlug,
        args.eventId,
      );
    } else if (updateFields.title && event.title !== updateFields.title) {
      // If title changed, generate a new slug
      updates.slug = await generateUniqueSlug(
        ctx.db,
        "events",
        updateFields.title,
        args.eventId,
      );
    }

    // Update the event
    await ctx.db.patch(args.eventId, updates);

    return args.eventId;
  },
});

/**
 * Delete a calendar event
 */
export const deleteEvent = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user's Convex ID
    const userId = await getAuthenticatedConvexId(ctx);

    // Get the event
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new ConvexError({
        message: "Event not found",
        code: "EVENT_NOT_FOUND",
      });
    }

    // Check if user is allowed to delete this event
    if (event.createdBy !== userId) {
      // Check if user is an admin
      const isAdmin = await ctx.db
        .query("users")
        .withIndex("by_id", (q) => q.eq("_id", userId))
        .filter((q) => q.eq(q.field("role"), "admin"))
        .unique();

      if (!isAdmin) {
        throw new ConvexError({
          message: "You don't have permission to delete this event",
          code: "PERMISSION_DENIED",
        });
      }
    }

    // Delete all related attendee records
    const attendees = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const attendee of attendees) {
      await ctx.db.delete(attendee._id);
    }

    // Delete all calendar-event links
    const calendarEvents = await ctx.db
      .query("calendarEvents")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const calendarEvent of calendarEvents) {
      await ctx.db.delete(calendarEvent._id);
    }

    // Delete the event itself
    await ctx.db.delete(args.eventId);

    return true;
  },
});
