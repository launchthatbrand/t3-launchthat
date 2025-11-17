import { defineTable } from "convex/server";
import { v } from "convex/values";

export const eventRemindersTable = defineTable({
  eventId: v.id("events"),
  userId: v.id("users"),
  reminderTime: v.number(),
  sent: v.boolean(),
  sentAt: v.optional(v.number()),
})
  .index("by_reminder_time", ["reminderTime", "sent"])
  .index("by_event_user", ["eventId", "userId"]);
