import { v } from "convex/values";

import { mutation } from "../../../_generated/server";
import { EVENT_POST_TYPE } from "../helpers";

export const linkCalendarEvent = mutation({
  args: {
    orderId: v.id("orders"),
    eventId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event || event.postTypeSlug !== EVENT_POST_TYPE) {
      throw new Error("Event not found");
    }

    await ctx.db.patch(args.orderId, {
      calendarEventId: args.eventId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const unlinkCalendarEvent = mutation({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    await ctx.db.patch(args.orderId, {
      calendarEventId: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const getOrdersByCalendarEvent = mutation({
  args: {
    eventId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("calendarEventId"), args.eventId))
      .collect();
    return orders;
  },
});
