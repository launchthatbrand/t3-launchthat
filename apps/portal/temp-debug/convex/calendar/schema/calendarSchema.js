import { defineTable } from "convex/server";
import { v } from "convex/values";
// Define main events table
export const eventsTable = defineTable({
    // Basic event details
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(), // Timestamp for event start
    endTime: v.number(), // Timestamp for event end
    allDay: v.optional(v.boolean()),
    timezone: v.optional(v.string()), // e.g., "America/New_York"
    // Event categorization
    type: v.union(v.literal("meeting"), v.literal("webinar"), v.literal("workshop"), v.literal("class"), v.literal("conference"), v.literal("social"), v.literal("deadline"), v.literal("reminder"), v.literal("other")),
    // Color for display in calendar
    color: v.optional(v.string()), // HEX or named color
    // Location information
    location: v.optional(v.object({
        type: v.union(v.literal("virtual"), v.literal("physical"), v.literal("hybrid")),
        address: v.optional(v.string()),
        url: v.optional(v.string()), // For virtual meetings (Zoom, etc.)
        meetingId: v.optional(v.string()),
        passcode: v.optional(v.string()),
    })),
    // Recurrence rules (iCalendar RRule format)
    recurrence: v.optional(v.object({
        frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly")),
        interval: v.optional(v.number()), // Every X days/weeks/etc.
        count: v.optional(v.number()), // Number of occurrences
        until: v.optional(v.number()), // End date timestamp
        byDay: v.optional(v.array(v.union(v.literal("MO"), v.literal("TU"), v.literal("WE"), v.literal("TH"), v.literal("FR"), v.literal("SA"), v.literal("SU")))),
        byMonthDay: v.optional(v.array(v.number())), // e.g., [1, 15] for 1st and 15th of month
        byMonth: v.optional(v.array(v.number())), // 1-12 for Jan-Dec
        excludeDates: v.optional(v.array(v.number())), // Specific dates to exclude
    })),
    // Reminder settings
    reminders: v.optional(v.array(v.object({
        type: v.union(v.literal("email"), v.literal("notification"), v.literal("sms")),
        minutesBefore: v.number(), // How many minutes before event to send reminder
    }))),
    // Attachments
    attachments: v.optional(v.array(v.object({
        name: v.string(),
        url: v.string(),
        type: v.string(), // MIME type
    }))),
    // Visibility and access control
    visibility: v.union(v.literal("public"), // Visible to all users
    v.literal("private"), // Only visible to owner and invitees
    v.literal("restricted")),
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
    .index("by_creator", ["createdBy"])
    .index("by_timeRange", ["startTime", "endTime"])
    .index("by_type", ["type"])
    .index("by_group", ["groupId"])
    .index("by_course", ["courseId"])
    .searchIndex("search_events", {
    searchField: "title",
    filterFields: ["type", "visibility", "isCancelled"],
});
// Define event participants/attendees
export const eventAttendeesTable = defineTable({
    eventId: v.id("events"),
    userId: v.optional(v.id("users")),
    status: v.union(v.literal("invited"), v.literal("accepted"), v.literal("declined"), v.literal("tentative"), v.literal("waitlisted")),
    role: v.union(v.literal("organizer"), v.literal("host"), v.literal("attendee"), v.literal("moderator")),
    invitedBy: v.optional(v.id("users")),
    invitedAt: v.optional(v.number()),
    responseTime: v.optional(v.number()),
    responseComment: v.optional(v.string()),
    notificationSettings: v.optional(v.object({
        reminders: v.optional(v.boolean()),
        updates: v.optional(v.boolean()),
    })),
    externalEmail: v.optional(v.string()),
    externalName: v.optional(v.string()),
})
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_event_user", ["eventId", "userId"])
    .index("by_event_status", ["eventId", "status"]);
// Define calendars (for users, groups, etc. to organize events)
export const calendarsTable = defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()), // Default display color for events
    // Ownership
    ownerId: v.id("users"), // Calendar owner
    ownerType: v.union(v.literal("user"), // Personal calendar
    v.literal("group"), // Group calendar
    v.literal("course"), // Course calendar
    v.literal("organization")),
    // Related entities
    groupId: v.optional(v.id("groups")), // If owner type is group
    courseId: v.optional(v.id("courses")), // If owner type is course
    organizationId: v.optional(v.id("organizations")), // If owner type is organization
    // Visibility and sharing
    isDefault: v.optional(v.boolean()), // Is this the default calendar
    isPublic: v.optional(v.boolean()), // Publicly visible
    // Administrative
    createdAt: v.number(), // Creation timestamp
    updatedAt: v.optional(v.number()), // Last update timestamp
})
    .index("by_owner", ["ownerId", "ownerType"])
    .index("by_group", ["groupId"])
    .index("by_course", ["courseId"])
    .index("by_organization", ["organizationId"]);
// Link events to calendars
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
// Define calendar sharing permissions
export const calendarPermissionsTable = defineTable({
    calendarId: v.id("calendars"),
    userId: v.id("users"), // User with permission
    permissionType: v.union(v.literal("read"), // Can view events
    v.literal("write"), // Can add/edit events
    v.literal("admin")),
    grantedBy: v.id("users"), // Who granted this permission
    grantedAt: v.number(), // When permission was granted
})
    .index("by_calendar", ["calendarId"])
    .index("by_user", ["userId"])
    .index("by_calendar_user", ["calendarId", "userId"]);
// Define event categories/types
export const eventCategoriesTable = defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    color: v.optional(v.string()), // HEX color code
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
})
    .index("by_name", ["name"])
    .index("by_visibility", ["isPublic"]);
// Combine all Calendar related tables
export const calendarSchema = {
    events: eventsTable,
    eventAttendees: eventAttendeesTable,
    calendars: calendarsTable,
    calendarEvents: calendarEventsTable,
    calendarPermissions: calendarPermissionsTable,
    eventCategories: eventCategoriesTable,
};
