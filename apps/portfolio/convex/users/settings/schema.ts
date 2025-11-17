import { defineTable } from "convex/server";
import { v } from "convex/values";

export const userSettingsTable = defineTable({
  userId: v.id("users"),
  calendarSettings: v.optional(
    v.object({
      reminders: v.optional(v.array(v.number())),
    }),
  ),
}).index("by_user", ["userId"]);
