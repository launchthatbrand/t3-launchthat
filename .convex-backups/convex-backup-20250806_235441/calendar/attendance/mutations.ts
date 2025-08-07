import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";
import { getAuthenticatedConvexId } from "../lib/authUtils";

/**
 * Update a user's attendance status for an event
 */
export const updateAttendanceStatus = mutation({
  args: {
    eventId: v.id("events"),
    status: v.union(
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("tentative"),
      v.literal("pending"),
      v.literal("needs-action"),
    ),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user's Convex ID
    const userId = await getAuthenticatedConvexId(ctx);

    // Check if event exists
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new ConvexError({
        message: "Event not found",
        code: "EVENT_NOT_FOUND",
      });
    }

    // Check if user is already an attendee
    const existingAttendee = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", userId),
      )
      .unique();

    const now = Date.now();

    if (existingAttendee) {
      // Update existing attendance record
      await ctx.db.patch(existingAttendee._id, {
        status: args.status,
        responseAt: now,
        comment: args.comment,
      });

      return existingAttendee._id;
    } else {
      // Create new attendance record
      return await ctx.db.insert("eventAttendees", {
        eventId: args.eventId,
        userId,
        status: args.status,
        addedBy: userId,
        addedAt: now,
        responseAt: now,
        comment: args.comment,
      });
    }
  },
});

/**
 * Add an attendee to an event
 */
export const addAttendee = mutation({
  args: {
    eventId: v.id("events"),
    attendeeId: v.id("users"),
    status: v.optional(
      v.union(v.literal("pending"), v.literal("needs-action")),
    ),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user's Convex ID
    const userId = await getAuthenticatedConvexId(ctx);

    // Check if event exists
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new ConvexError({
        message: "Event not found",
        code: "EVENT_NOT_FOUND",
      });
    }

    // Check if attendee already exists
    const existingAttendee = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", args.attendeeId),
      )
      .unique();

    if (existingAttendee) {
      throw new ConvexError({
        message: "User is already an attendee",
        code: "ALREADY_ATTENDEE",
      });
    }

    const now = Date.now();

    // Add new attendee with pending status
    return await ctx.db.insert("eventAttendees", {
      eventId: args.eventId,
      userId: args.attendeeId,
      status: args.status ?? "pending",
      addedBy: userId,
      addedAt: now,
    });
  },
});
