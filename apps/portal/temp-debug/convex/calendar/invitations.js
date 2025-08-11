import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
/**
 * Invite users to an event
 */
export const inviteToEvent = mutation({
    args: {
        eventId: v.id("events"),
        userIds: v.array(v.id("users")),
        invitedBy: v.id("users"),
        message: v.optional(v.string()),
        role: v.optional(v.union(v.literal("organizer"), v.literal("host"), v.literal("attendee"), v.literal("moderator"))),
    },
    handler: async (ctx, args) => {
        // Verify the event exists
        const event = await ctx.db.get(args.eventId);
        if (!event) {
            throw new Error("Event not found");
        }
        const results = [];
        const invitedAt = Date.now();
        // Create attendee records and notifications for each user
        for (const userId of args.userIds) {
            // Check if user is already invited
            const existingInvite = await ctx.db
                .query("eventAttendees")
                .withIndex("by_event_user", (q) => q.eq("eventId", args.eventId).eq("userId", userId))
                .first();
            if (existingInvite) {
                // Skip if already invited
                results.push({
                    userId,
                    status: "already_invited",
                    attendeeId: existingInvite._id,
                });
                continue;
            }
            // Create the attendee record with "invited" status
            const attendeeId = await ctx.db.insert("eventAttendees", {
                eventId: args.eventId,
                userId,
                status: "invited",
                role: args.role || "attendee",
                invitedBy: args.invitedBy,
                invitedAt,
            });
            // Create a notification for the invited user
            await ctx.db.insert("notifications", {
                userId,
                type: "eventInvite",
                title: `You've been invited to: ${event.title}`,
                content: args.message,
                read: false,
                createdAt: invitedAt,
                sourceUserId: args.invitedBy,
                sourceEventId: args.eventId,
                actionUrl: `/calendar/events/${args.eventId}`,
                message: args.message,
            });
            results.push({
                userId,
                status: "invited",
                attendeeId,
            });
        }
        return results;
    },
});
/**
 * Respond to an event invitation
 */
export const respondToEventInvitation = mutation({
    args: {
        eventId: v.id("events"),
        userId: v.id("users"),
        status: v.union(v.literal("accepted"), v.literal("declined"), v.literal("tentative")),
        responseComment: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Verify the event exists
        const event = await ctx.db.get(args.eventId);
        if (!event) {
            throw new Error("Event not found");
        }
        // Find the attendee record
        const attendee = await ctx.db
            .query("eventAttendees")
            .withIndex("by_event_user", (q) => q.eq("eventId", args.eventId).eq("userId", args.userId))
            .first();
        if (!attendee) {
            throw new Error("Invitation not found");
        }
        // Update the attendee status
        await ctx.db.patch(attendee._id, {
            status: args.status,
            responseTime: Date.now(),
            responseComment: args.responseComment,
        });
        // Notify the event creator
        await ctx.db.insert("notifications", {
            userId: event.createdBy,
            type: "eventUpdate",
            title: `Response to event: ${event.title}`,
            content: `A user has ${args.status} your event invitation`,
            read: false,
            createdAt: Date.now(),
            sourceUserId: args.userId,
            sourceEventId: args.eventId,
            actionUrl: `/calendar/events/${args.eventId}`,
            message: args.responseComment,
        });
        return attendee._id;
    },
});
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
        // If details are requested, include user information
        if (args.includeDetails) {
            const attendeesWithDetails = await Promise.all(attendees.map(async (attendee) => {
                let userDetails = null;
                if (attendee.userId) {
                    userDetails = await ctx.db.get(attendee.userId);
                }
                return {
                    ...attendee,
                    user: userDetails,
                };
            }));
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
        timeframe: v.optional(v.object({
            startDate: v.number(),
            endDate: v.number(),
        })),
        status: v.optional(v.union(v.literal("invited"), v.literal("accepted"), v.literal("declined"), v.literal("tentative"), v.literal("waitlisted"))),
    },
    handler: async (ctx, args) => {
        // Find all events where user is an attendee
        let attendeesQuery = ctx.db
            .query("eventAttendees")
            .withIndex("by_user", (q) => q.eq("userId", args.userId));
        // Apply status filter if provided
        if (args.status) {
            attendeesQuery = attendeesQuery.filter((q) => q.eq(q.field("status"), args.status));
        }
        const attendeeRecords = await attendeesQuery.collect();
        const eventIds = attendeeRecords.map((record) => record.eventId);
        // If no events, return empty array
        if (eventIds.length === 0) {
            return [];
        }
        // Get the event details for each event ID
        const events = [];
        for (const eventId of eventIds) {
            const event = await ctx.db.get(eventId);
            if (!event)
                continue;
            // Apply timeframe filter if provided
            if (args.timeframe) {
                const { startDate, endDate } = args.timeframe;
                const { startTime, endTime } = event;
                if (
                // Event starts within range
                (startTime >= startDate && startTime <= endDate) ||
                    // Event ends within range
                    (endTime >= startDate && endTime <= endDate) ||
                    // Event spans the entire range
                    (startTime <= startDate && endTime >= endDate)) {
                    // Find the attendee record to include the RSVP status
                    const attendeeRecord = attendeeRecords.find((record) => record.eventId === eventId);
                    events.push({
                        ...event,
                        attendeeStatus: attendeeRecord?.status,
                        attendeeId: attendeeRecord?._id,
                    });
                }
            }
            else {
                // No timeframe filter, include all events
                const attendeeRecord = attendeeRecords.find((record) => record.eventId === eventId);
                events.push({
                    ...event,
                    attendeeStatus: attendeeRecord?.status,
                    attendeeId: attendeeRecord?._id,
                });
            }
        }
        return events;
    },
});
