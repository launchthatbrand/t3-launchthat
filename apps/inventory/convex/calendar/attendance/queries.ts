import { v } from "convex/values";

import { query } from "../../_generated/server";
import { getAuthenticatedConvexId } from "../lib/authUtils";

/**
 * Get attendance records for a specific event
 */
export const getEventAttendance = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user's Convex ID
    const _userId = await getAuthenticatedConvexId(ctx);

    // Fetch attendance records for this event
    const attendees = await ctx.db
      .query("eventAttendees")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Return only the attendance data
    return attendees.map((record) => ({
      userId: record.userId,
      status: record.status,
      responseAt: record.responseAt,
      comment: record.comment,
    }));
  },
});

/**
 * Get attendance statistics for a series of events
 */
export const getAttendanceStats = query({
  args: {
    eventIds: v.array(v.id("events")),
  },
  handler: async (ctx, args) => {
    const stats = {
      total: 0,
      accepted: 0,
      declined: 0,
      tentative: 0,
      pending: 0,
      needsAction: 0,
    };

    // Process each event
    for (const eventId of args.eventIds) {
      const attendees = await ctx.db
        .query("eventAttendees")
        .withIndex("by_event", (q) => q.eq("eventId", eventId))
        .collect();

      stats.total += attendees.length;

      // Count by status
      for (const attendee of attendees) {
        switch (attendee.status) {
          case "accepted":
            stats.accepted += 1;
            break;
          case "declined":
            stats.declined += 1;
            break;
          case "tentative":
            stats.tentative += 1;
            break;
          case "pending":
            stats.pending += 1;
            break;
          case "needs-action":
            stats.needsAction += 1;
            break;
        }
      }
    }

    return stats;
  },
});
