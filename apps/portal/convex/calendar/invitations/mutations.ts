import { v } from "convex/values";

import { mutation } from "../../_generated/server";

/**
 * Invite users to an event
 */
export const inviteToEvent = mutation({
  args: {
    eventId: v.id("events"),
    userIds: v.array(v.id("users")),
    invitedBy: v.id("users"),
    message: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("organizer"),
        v.literal("host"),
        v.literal("attendee"),
        v.literal("moderator"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Verify the event exists
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const results: { userId: string; status: string; attendeeId: unknown }[] =
      [];
    const invitedAt = Date.now();

    // Create attendee records and notifications for each user
    for (const userId of args.userIds) {
      // Check if user is already invited
      const existingInvite = await ctx.db
        .query("eventAttendees")
        .withIndex("by_event_user", (q) =>
          q.eq("eventId", args.eventId).eq("userId", userId),
        )
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
        role: args.role ?? "attendee",
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
      });

      results.push({ userId, status: "invited", attendeeId });
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
    status: v.union(
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("tentative"),
    ),
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
      .withIndex("by_event_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", args.userId),
      )
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
      content: `A user has ${args.status} your event invitation${
        args.responseComment ? ": " + args.responseComment : ""
      }`,
      read: false,
      createdAt: Date.now(),
      sourceUserId: args.userId,
      sourceEventId: args.eventId,
      actionUrl: `/calendar/events/${args.eventId}`,
    });

    return attendee._id;
  },
});
