import { v } from "convex/values";

import { mutation } from "../_generated/server";

/**
 * Share a calendar with another user
 */
export const shareCalendar = mutation({
  args: {
    calendarId: v.id("calendars"),
    userId: v.id("users"),
    permissionType: v.union(
      v.literal("read"),
      v.literal("write"),
      v.literal("admin"),
    ),
    grantedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const calendar = await ctx.db.get(args.calendarId);
    if (!calendar) {
      throw new Error("Calendar not found");
    }

    // Check if user already has permissions
    const existingPermission = await ctx.db
      .query("calendarPermissions")
      .withIndex("by_calendar_user", (q) =>
        q.eq("calendarId", args.calendarId).eq("userId", args.userId),
      )
      .first();

    if (existingPermission) {
      // Update existing permission
      await ctx.db.patch(existingPermission._id, {
        permissionType: args.permissionType,
        grantedBy: args.grantedBy,
        grantedAt: Date.now(),
      });
      return existingPermission._id;
    }

    // Create new permission
    return await ctx.db.insert("calendarPermissions", {
      calendarId: args.calendarId,
      userId: args.userId,
      permissionType: args.permissionType,
      grantedBy: args.grantedBy,
      grantedAt: Date.now(),
    });
  },
});

/**
 * Remove calendar sharing permission
 */
export const removeCalendarPermission = mutation({
  args: {
    permissionId: v.id("calendarPermissions"),
  },
  handler: async (ctx, args) => {
    const permission = await ctx.db.get(args.permissionId);
    if (!permission) {
      throw new Error("Permission not found");
    }

    await ctx.db.delete(args.permissionId);
    return true;
  },
});
