import { v } from "convex/values";

import { query } from "../../_generated/server";

/**
 * Get all event attendees with their status
 */
export const getEventAttendees = query({
  args: {
    eventId: v.id("events"),
    includeDetails: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const attendees = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    if (args.includeDetails) {
      const attendeesWithDetails = await Promise.all(
        attendees.map(async (attendee) => {
          let userDetails = null;
          if (attendee.userId) {
            userDetails = await ctx.db.get(attendee.userId);
          }
          return { ...attendee, user: userDetails };
        }),
      );
      return attendeesWithDetails;
    }

    return attendees;
  },
});

/**
 * Get all events for a user with optional filtering by status
 */
export const getUserEvents = query({
  args: {
    userId: v.id("users"),
    timeframe: v.optional(
      v.object({
        startDate: v.number(),
        endDate: v.number(),
      }),
    ),
    status: v.optional(
      v.union(
        v.literal("invited"),
        v.literal("accepted"),
        v.literal("declined"),
        v.literal("tentative"),
        v.literal("waitlisted"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    let attendeesQuery = ctx.db
      .query("eventAttendees")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    if (args.status) {
      attendeesQuery = attendeesQuery.filter((q) =>
        q.eq(q.field("status"), args.status),
      );
    }

    const attendeeRecords = await attendeesQuery.collect();
    const eventIds = attendeeRecords.map((record) => record.eventId);

    if (eventIds.length === 0) return [];

    const events: any[] = [];
    for (const eventId of eventIds) {
      const event = await ctx.db.get(eventId);
      if (!event) continue;

      if (args.timeframe) {
        const { startDate, endDate } = args.timeframe;
        const { startTime, endTime } = event;
        const overlapsRange =
          (startTime >= startDate && startTime <= endDate) ||
          (endTime >= startDate && endTime <= endDate) ||
          (startTime <= startDate && endTime >= endDate);
        if (!overlapsRange) continue;
      }

      const attendeeRecord = attendeeRecords.find(
        (record) => record.eventId === eventId,
      );
      events.push({
        ...event,
        attendeeStatus: attendeeRecord?.status,
        attendeeId: attendeeRecord?._id,
      });
    }

    return events;
  },
});
