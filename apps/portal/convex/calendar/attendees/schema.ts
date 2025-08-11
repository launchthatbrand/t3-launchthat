import { defineTable } from "convex/server";
import { v } from "convex/values";

import { eventAttendanceStatus } from "../attendance/mutations";

export const eventAttendeesTable = defineTable({
  eventId: v.id("events"),
  userId: v.optional(v.id("users")),
  status: eventAttendanceStatus,
  role: v.union(
    v.literal("organizer"),
    v.literal("host"),
    v.literal("attendee"),
    v.literal("moderator"),
  ),
  invitedBy: v.optional(v.id("users")),
  invitedAt: v.optional(v.number()),
  responseTime: v.optional(v.number()),
  responseComment: v.optional(v.string()),
  notificationSettings: v.optional(
    v.object({
      reminders: v.optional(v.boolean()),
      updates: v.optional(v.boolean()),
    }),
  ),
  externalEmail: v.optional(v.string()),
  externalName: v.optional(v.string()),
})
  .index("by_event", ["eventId"])
  .index("by_user", ["userId"])
  .index("by_event_user", ["eventId", "userId"])
  .index("by_event_status", ["eventId", "status"]);
