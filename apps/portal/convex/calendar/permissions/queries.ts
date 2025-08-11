import { v } from "convex/values";

import { query } from "../../_generated/server";

// Example: list permissions for a calendar (can be expanded as needed)
export const listCalendarPermissions = query({
  args: { calendarId: v.id("calendars") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calendarPermissions")
      .withIndex("by_calendar", (q) => q.eq("calendarId", args.calendarId))
      .collect();
  },
});
