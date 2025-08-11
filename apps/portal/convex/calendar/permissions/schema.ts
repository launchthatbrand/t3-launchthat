import { defineTable } from "convex/server";
import { v } from "convex/values";

export const calendarPermissionsTable = defineTable({
  calendarId: v.id("calendars"),
  userId: v.id("users"), // User with permission
  permissionType: v.union(
    v.literal("read"), // Can view events
    v.literal("write"), // Can add/edit events
    v.literal("admin"), // Can share calendar and manage permissions
  ),
  grantedBy: v.id("users"), // Who granted this permission
  grantedAt: v.number(), // When permission was granted
})
  .index("by_calendar", ["calendarId"])
  .index("by_user", ["userId"])
  .index("by_calendar_user", ["calendarId", "userId"]);
