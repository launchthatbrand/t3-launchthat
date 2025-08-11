import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";

/**
 * Link a calendar event to an order
 */
export const linkCalendarEvent = mutation({
  args: {
    orderId: v.id("orders"),
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    // Verify the order exists
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new ConvexError({
        message: "Order not found",
        code: "ORDER_NOT_FOUND",
      });
    }

    // Verify the event exists
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new ConvexError({
        message: "Calendar event not found",
        code: "EVENT_NOT_FOUND",
      });
    }

    // Update the order with the calendar event ID
    await ctx.db.patch(args.orderId, {
      calendarEventId: args.eventId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Unlink a calendar event from an order
 */
export const unlinkCalendarEvent = mutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    // Verify the order exists
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new ConvexError({
        message: "Order not found",
        code: "ORDER_NOT_FOUND",
      });
    }

    // Remove the calendar event ID from the order
    await ctx.db.patch(args.orderId, {
      calendarEventId: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get orders linked to a specific calendar event
 */
export const getOrdersByCalendarEvent = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("calendarEventId"), args.eventId))
      .collect();

    return orders;
  },
});
