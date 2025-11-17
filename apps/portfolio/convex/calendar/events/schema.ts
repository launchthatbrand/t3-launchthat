import { defineTable } from "convex/server";
import { v } from "convex/values";

export const eventsTable = defineTable({
  title: v.string(),
  startTime: v.number(),
  endTime: v.number(),
  description: v.optional(v.string()),
  allDay: v.optional(v.boolean()),
  timezone: v.optional(v.string()),
  type: v.string(),
  color: v.optional(v.string()),
  location: v.optional(v.any()),
  visibility: v.string(),
  groupId: v.optional(v.id("groups")),
  courseId: v.optional(v.id("courses")),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  recurrence: v.optional(v.any()),
  slug: v.optional(v.string()),
  isCancelled: v.optional(v.boolean()),
  reminders: v.optional(
    v.array(
      v.object({
        minutesBefore: v.number(),
        method: v.union(v.literal("notification"), v.literal("email")),
      }),
    ),
  ),
})
  .index("by_timeRange", ["startTime"]) // supports time range queries
  .index("by_creator", ["createdBy"]) // supports getEventCount by user
  .index("by_group", ["groupId"]) // supports getEventCount by group
  .index("by_course", ["courseId"]) // supports getEventCount by course
  .index("by_slug", ["slug"]) // supports unique slug lookups
  .searchIndex("search_events", {
    searchField: "title",
    filterFields: ["isCancelled"],
  });

export const calendarEventsTable = defineTable({
  calendarId: v.id("calendars"),
  eventId: v.id("events"),
  isPrimary: v.optional(v.boolean()), // Whether this is the primary calendar for this event

  // These fields are denormalized from the event for faster querying
  startTime: v.optional(v.number()), // Denormalized from event for querying
  endTime: v.optional(v.number()), // Denormalized from event for querying
})
  .index("by_calendar", ["calendarId"])
  .index("by_event", ["eventId"])
  .index("by_calendar_event", ["calendarId", "eventId"])
  .index("by_calendar_date", ["calendarId", "startTime", "endTime"]); // New index for date range queries
