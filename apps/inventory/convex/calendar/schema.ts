import {, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Defining the schema for the calendar module
 */

const calendarsTable = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  color: v.optional(v.string()),
  isPublic: v.boolean(),
  isDefault: v.optional(v.boolean()),
});

const calendarPermissionsTable = defineTable({
  userId: v.id("users"),
  calendarId: v.id("calendars"),
  permissionType: v.union(
    v.literal("read"),
    v.literal("write"),
    v.literal("admin"),
  ),
  grantedBy: v.id("users"),
  grantedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_calendar", ["calendarId"])
  .index("by_calendar_user", ["calendarId", "userId"]),


export const calendarSchema = {
  // Calendar definition

  // Calendar permissions (who can access which calendars)


  // Events
  events: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    allDay: v.boolean(),
    timezone: v.optional(v.string()),
    type: v.union(
      v.literal("meeting"),
      v.literal("webinar"),
      v.literal("workshop"),
      v.literal("class"),
      v.literal("conference"),
      v.literal("social"),
      v.literal("deadline"),
      v.literal("reminder"),
      v.literal("other"),
    ),
    color: v.optional(v.string()),
    location: v.optional(
      v.object({
        type: v.union(
          v.literal("virtual"),
          v.literal("physical"),
          v.literal("hybrid"),
        ),
        address: v.optional(v.string()),
        url: v.optional(v.string()),
        meetingId: v.optional(v.string()),
        passcode: v.optional(v.string()),
      }),
    ),
    visibility: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("restricted"),
    ),
    groupId: v.optional(v.id("groups")),
    courseId: v.optional(v.id("courses")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    slug: v.optional(v.string()),
    recurrence: v.optional(
      v.object({
        frequency: v.union(
          v.literal("daily"),
          v.literal("weekly"),
          v.literal("monthly"),
          v.literal("yearly"),
        ),
        interval: v.optional(v.number()),
        count: v.optional(v.number()),
        until: v.optional(v.number()),
        byDay: v.optional(v.array(v.string())),
        byMonthDay: v.optional(v.array(v.number())),
        byMonth: v.optional(v.array(v.number())),
        excludeDates: v.optional(v.array(v.number())),
      }),
    ),
  })
    .index("by_creator", ["createdBy"])
    .index("by_group", ["groupId"])
    .index("by_course", ["courseId"])
    .index("by_date", ["startTime"])
    .index("by_slug", ["slug"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["visibility", "type", "groupId", "courseId"],
    })
    .searchIndex("search_description", {
      searchField: "description",
      filterFields: ["visibility", "type", "groupId", "courseId"],
    }),

  // Link events to calendars (an event can belong to multiple calendars)
  calendarEvents: defineTable({
    calendarId: v.id("calendars"),
    eventId: v.id("events"),
    isPrimary: v.optional(v.boolean()),
  })
    .index("by_calendar", ["calendarId"])
    .index("by_event", ["eventId"])
    .index("by_calendar_event", ["calendarId", "eventId"]),

  // Event attendees
  eventAttendees: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("tentative"),
      v.literal("needs-action"),
    ),
    addedBy: v.id("users"),
    addedAt: v.number(),
    responseAt: v.optional(v.number()),
    comment: v.optional(v.string()),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_event_user", ["eventId", "userId"]),
});
