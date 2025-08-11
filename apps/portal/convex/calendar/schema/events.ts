import { defineTable } from "convex/server";
import { v } from "convex/values";

// Events table
export const eventsTable = defineTable({
  // Basic event details
  title: v.string(),
  description: v.optional(v.string()),
  startTime: v.number(), // Timestamp for event start
  endTime: v.number(), // Timestamp for event end
  allDay: v.optional(v.boolean()),
  timezone: v.optional(v.string()), // e.g., "America/New_York"

  // Event categorization
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

  // Color for display in calendar
  color: v.optional(v.string()), // HEX or named color

  // Location information
  location: v.optional(
    v.object({
      type: v.union(
        v.literal("virtual"),
        v.literal("physical"),
        v.literal("hybrid"),
      ),
      address: v.optional(v.string()),
      url: v.optional(v.string()), // For virtual meetings (Zoom, etc.)
      meetingId: v.optional(v.string()),
      passcode: v.optional(v.string()),
    }),
  ),

  // Recurrence rules (iCalendar RRule format)
  recurrence: v.optional(
    v.object({
      frequency: v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("yearly"),
      ),
      interval: v.optional(v.number()), // Every X days/weeks/etc.
      count: v.optional(v.number()), // Number of occurrences
      until: v.optional(v.number()), // End date timestamp
      byDay: v.optional(
        v.array(
          v.union(
            v.literal("MO"),
            v.literal("TU"),
            v.literal("WE"),
            v.literal("TH"),
            v.literal("FR"),
            v.literal("SA"),
            v.literal("SU"),
          ),
        ),
      ),
      byMonthDay: v.optional(v.array(v.number())), // e.g., [1, 15] for 1st and 15th of month
      byMonth: v.optional(v.array(v.number())), // 1-12 for Jan-Dec
      excludeDates: v.optional(v.array(v.number())), // Specific dates to exclude
    }),
  ),

  // Reminder settings
  reminders: v.optional(
    v.array(
      v.object({
        type: v.union(
          v.literal("email"),
          v.literal("notification"),
          v.literal("sms"),
        ),
        minutesBefore: v.number(), // How many minutes before event to send reminder
      }),
    ),
  ),

  // Attachments
  attachments: v.optional(
    v.array(
      v.object({
        name: v.string(),
        url: v.string(),
        type: v.string(), // MIME type
      }),
    ),
  ),

  // Visibility and access control
  visibility: v.union(
    v.literal("public"), // Visible to all users
    v.literal("private"), // Only visible to owner and invitees
    v.literal("restricted"), // Visible to specific group or organization
  ),
  groupId: v.optional(v.id("groups")), // Associated group for group events
  courseId: v.optional(v.id("courses")), // Associated course for course events

  // Administrative details
  createdBy: v.id("users"), // Event creator
  createdAt: v.number(), // Creation timestamp
  updatedAt: v.optional(v.number()), // Last update timestamp

  // For cancellation
  isCancelled: v.optional(v.boolean()),
  cancellationReason: v.optional(v.string()),
})
  .index("by_creator", ["createdBy"]) // Who created it
  .index("by_timeRange", ["startTime", "endTime"]) // For range queries
  .index("by_type", ["type"]) // Filter by type
  .index("by_group", ["groupId"]) // Group-related events
  .index("by_course", ["courseId"]) // Course-related events
  .searchIndex("search_events", {
    searchField: "title",
    filterFields: ["type", "visibility", "isCancelled"],
  });
