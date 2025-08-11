import { defineTable } from "convex/server";
import { v } from "convex/values";

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
