import { v } from "convex/values";
import { mutation } from "../_generated/server";
/**
 * Add a user to an event as an attendee
 */
export const addEventAttendee = mutation({
    args: {
        eventId: v.id("events"),
        userId: v.id("users"),
        status: v.union(v.literal("invited"), v.literal("accepted"), v.literal("declined"), v.literal("tentative"), v.literal("waitlisted")),
        role: v.union(v.literal("organizer"), v.literal("host"), v.literal("attendee"), v.literal("moderator")),
        invitedBy: v.id("users"),
        externalEmail: v.optional(v.string()),
        externalName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const event = await ctx.db.get(args.eventId);
        if (!event) {
            throw new Error("Event not found");
        }
        // Check if attendee already exists
        const existingAttendee = await ctx.db
            .query("eventAttendees")
            .withIndex("by_event_user", (q) => q.eq("eventId", args.eventId).eq("userId", args.userId))
            .first();
        if (existingAttendee) {
            throw new Error("User is already an attendee for this event");
        }
        const attendeeId = await ctx.db.insert("eventAttendees", {
            eventId: args.eventId,
            userId: args.userId,
            status: args.status,
            role: args.role,
            invitedBy: args.invitedBy,
            invitedAt: Date.now(),
            externalEmail: args.externalEmail,
            externalName: args.externalName,
        });
        return attendeeId;
    },
});
/**
 * Update an attendee's status
 */
export const updateAttendeeStatus = mutation({
    args: {
        attendeeId: v.id("eventAttendees"),
        status: v.union(v.literal("invited"), v.literal("accepted"), v.literal("declined"), v.literal("tentative"), v.literal("waitlisted")),
        responseComment: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const attendee = await ctx.db.get(args.attendeeId);
        if (!attendee) {
            throw new Error("Attendee not found");
        }
        await ctx.db.patch(args.attendeeId, {
            status: args.status,
            responseTime: Date.now(),
            ...(args.responseComment !== undefined && {
                responseComment: args.responseComment,
            }),
        });
        return args.attendeeId;
    },
});
