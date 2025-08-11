import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { api } from "../../_generated/api";
import { query } from "../../_generated/server";
import { timestampValidator } from "../../shared/validators";
import { getAuthenticatedConvexId, hasCalendarAccess } from "../lib/authUtils";
import { getCalendarViewDateRange, getRecurringEventInstances, } from "../lib/dateUtils";
/**
 * Get a single event by ID
 */
export const getEvent = query({
    args: {
        eventId: v.id("events"),
    },
    handler: async (ctx, args) => {
        // Get the authenticated user's Convex ID
        const userId = await getAuthenticatedConvexId(ctx);
        // Fetch the event
        const event = await ctx.db.get(args.eventId);
        if (!event) {
            throw new ConvexError({
                message: "Event not found",
                code: "EVENT_NOT_FOUND",
            });
        }
        // Check if the event belongs to any calendar the user has access to
        const calendarEvent = await ctx.db
            .query("calendarEvents")
            .filter((q) => q.eq(q.field("eventId"), args.eventId))
            .first();
        if (!calendarEvent) {
            throw new ConvexError({
                message: "Event not found in any calendar",
                code: "EVENT_CALENDAR_NOT_FOUND",
            });
        }
        // Check calendar access
        const hasAccess = await hasCalendarAccess(ctx, calendarEvent.calendarId, userId);
        if (!hasAccess) {
            throw new ConvexError({
                message: "You don't have access to this event",
                code: "EVENT_ACCESS_DENIED",
            });
        }
        return event;
    },
});
/**
 * Get events for a specific calendar
 */
export const getCalendarEvents = query({
    args: {
        calendarId: v.id("calendars"),
        startDate: timestampValidator,
        endDate: timestampValidator,
        includeRecurrences: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        // Get the authenticated user's Convex ID
        const userId = await getAuthenticatedConvexId(ctx);
        // Check if the user has access to the calendar
        const hasAccess = await hasCalendarAccess(ctx, args.calendarId, userId);
        if (!hasAccess) {
            throw new ConvexError({
                message: "You don't have access to this calendar",
                code: "CALENDAR_ACCESS_DENIED",
            });
        }
        // Get the calendar events links
        const calendarEvents = await ctx.db
            .query("calendarEvents")
            .withIndex("by_calendar", (q) => q.eq("calendarId", args.calendarId))
            .collect();
        // Collect all event IDs
        const eventIds = calendarEvents.map((ce) => ce.eventId);
        // Batch fetch all events in the given date range
        const events = await Promise.all(eventIds.map(async (eventId) => {
            return await ctx.db.get(eventId);
        }));
        // Filter out null events (in case some were deleted)
        const validEvents = events.filter((event) => event !== null &&
            event.startTime <= args.endDate &&
            event.endTime >= args.startDate);
        // Include recurring event instances if requested
        if (args.includeRecurrences) {
            const allInstances = validEvents.flatMap((event) => getRecurringEventInstances(event, args.startDate, args.endDate));
            return allInstances;
        }
        return validEvents;
    },
});
/**
 * Get events for a specific date range across all accessible calendars
 */
export const getEventsInDateRange = query({
    args: {
        startDate: timestampValidator,
        endDate: timestampValidator,
        calendarIds: v.optional(v.array(v.id("calendars"))),
        includeRecurrences: v.optional(v.boolean()),
        paginationOpts: v.optional(paginationOptsValidator),
    },
    handler: async (ctx, args) => {
        // Get the authenticated user's Convex ID
        const userId = await getAuthenticatedConvexId(ctx);
        // Get all accessible calendars (combining user's own, shared, and public)
        const [userCalendars, calendarPermissions, publicCalendars] = await Promise.all([
            // User's own calendars
            ctx.db
                .query("calendars")
                .filter((q) => q.eq(q.field("ownerId"), userId))
                .collect(),
            // Calendars shared with user
            ctx.db
                .query("calendarPermissions")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .collect(),
            // Public calendars
            ctx.db
                .query("calendars")
                .filter((q) => q.eq(q.field("isPublic"), true))
                .collect(),
        ]);
        // Combine all calendar IDs the user has access to
        let accessibleCalendarIds = [
            ...userCalendars.map((c) => c._id),
            ...calendarPermissions.map((p) => p.calendarId),
            ...publicCalendars.map((c) => c._id),
        ];
        // Remove duplicates
        accessibleCalendarIds = [...new Set(accessibleCalendarIds)];
        // Filter by specific calendar IDs if provided
        if (args.calendarIds && args.calendarIds.length > 0) {
            accessibleCalendarIds = accessibleCalendarIds.filter((id) => args.calendarIds && args.calendarIds.includes(id));
        }
        // If there are no accessible calendars, return empty results
        if (accessibleCalendarIds.length === 0) {
            return {
                events: [],
                hasMore: false,
                cursor: null,
            };
        }
        // Get all calendar-event mappings for these calendars in a single query
        const calendarEvents = await ctx.db
            .query("calendarEvents")
            .filter((q) => {
            // Check if the calendarId is in our list of accessible calendars
            return accessibleCalendarIds.some((calendarId) => q.eq(q.field("calendarId"), calendarId));
        })
            .collect();
        // Extract event IDs
        const eventIds = [...new Set(calendarEvents.map((ce) => ce.eventId))];
        // Batch fetch all events
        const eventPromises = eventIds.map((id) => ctx.db.get(id));
        const eventsResults = await Promise.all(eventPromises);
        // Filter for valid events in the requested date range
        const validEvents = eventsResults.filter((event) => event !== null &&
            event.startTime <= args.endDate &&
            event.endTime >= args.startDate);
        // Include recurring event instances if requested
        if (args.includeRecurrences) {
            const allInstances = validEvents.flatMap((event) => getRecurringEventInstances(event, args.startDate, args.endDate));
            // Sort by start time
            allInstances.sort((a, b) => a.startTime - b.startTime);
            // Handle pagination if opts provided
            if (args.paginationOpts) {
                const startIndex = args.paginationOpts.cursor
                    ? parseInt(args.paginationOpts.cursor)
                    : 0;
                const endIndex = startIndex + (args.paginationOpts.numItems || 20);
                const page = allInstances.slice(startIndex, endIndex);
                const nextCursor = endIndex < allInstances.length ? endIndex.toString() : null;
                return {
                    events: page,
                    hasMore: nextCursor !== null,
                    cursor: nextCursor,
                };
            }
            return {
                events: allInstances,
                hasMore: false,
                cursor: null,
            };
        }
        // Sort by start time
        validEvents.sort((a, b) => a.startTime - b.startTime);
        // Handle pagination if opts provided
        if (args.paginationOpts) {
            const startIndex = args.paginationOpts.cursor
                ? parseInt(args.paginationOpts.cursor)
                : 0;
            const endIndex = startIndex + (args.paginationOpts.numItems || 20);
            const page = validEvents.slice(startIndex, endIndex);
            const nextCursor = endIndex < validEvents.length ? endIndex.toString() : null;
            return {
                events: page,
                hasMore: nextCursor !== null,
                cursor: nextCursor,
            };
        }
        return {
            events: validEvents,
            hasMore: false,
            cursor: null,
        };
    },
});
/**
 * Get events for a specific calendar view (day, week, month, year)
 */
export const getCalendarViewEvents = query({
    args: {
        calendarIds: v.optional(v.array(v.id("calendars"))),
        viewDate: v.number(),
        viewType: v.union(v.literal("day"), v.literal("week"), v.literal("month"), v.literal("year")),
        includeRecurrences: v.optional(v.boolean()),
    },
    returns: v.array(v.object({
        _id: v.id("events"),
        _creationTime: v.number(),
        title: v.string(),
        startTime: v.number(),
        endTime: v.number(),
        description: v.optional(v.string()),
        allDay: v.boolean(),
        timezone: v.optional(v.string()),
        type: v.string(),
        color: v.optional(v.string()),
        location: v.optional(v.object({})),
        visibility: v.string(),
        groupId: v.optional(v.id("groups")),
        courseId: v.optional(v.id("courses")),
        createdBy: v.id("users"),
        createdAt: v.number(),
        updatedAt: v.number(),
        recurrence: v.optional(v.object({})),
        isRecurringInstance: v.optional(v.boolean()),
        originalEventId: v.optional(v.id("events")),
    })),
    handler: async (ctx, args) => {
        // Convert viewDate to Date object
        const viewDate = new Date(args.viewDate);
        // Get date range for the specified view
        const dateRange = getCalendarViewDateRange(viewDate, args.viewType);
        // Get events for the date range using the API reference
        const result = await ctx.runQuery(api.calendar.events.queries.getEventsInDateRange, {
            startDate: dateRange.start,
            endDate: dateRange.end,
            calendarIds: args.calendarIds,
            includeRecurrences: args.includeRecurrences ?? true,
        });
        return result.events;
    },
});
export const getEventCount = query({
    args: {
        userId: v.optional(v.id("users")),
        groupId: v.optional(v.id("groups")),
        courseId: v.optional(v.id("courses")),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    returns: v.number(),
    handler: async (ctx, args) => {
        let eventsQuery = ctx.db.query("events");
        // Apply filters
        if (args.userId !== undefined) {
            const userId = args.userId;
            eventsQuery = eventsQuery.withIndex("by_creator", (q) => q.eq("createdBy", userId));
        }
        if (args.groupId !== undefined) {
            const groupId = args.groupId;
            eventsQuery = eventsQuery.withIndex("by_group", (q) => q.eq("groupId", groupId));
        }
        if (args.courseId !== undefined) {
            const courseId = args.courseId;
            eventsQuery = eventsQuery.withIndex("by_course", (q) => q.eq("courseId", courseId));
        }
        if (args.startDate !== undefined && args.endDate !== undefined) {
            const startDate = args.startDate;
            const endDate = args.endDate;
            eventsQuery = eventsQuery.withIndex("by_date", (q) => q.gte("startTime", startDate).lt("startTime", endDate));
        }
        else if (args.startDate !== undefined) {
            const startDate = args.startDate;
            eventsQuery = eventsQuery.withIndex("by_date", (q) => q.gte("startTime", startDate));
        }
        else if (args.endDate !== undefined) {
            const endDate = args.endDate;
            eventsQuery = eventsQuery.withIndex("by_date", (q) => q.lt("startTime", endDate));
        }
        const results = await eventsQuery.collect();
        return results.length;
    },
});
/**
 * Search for events by title
 */
export const searchEvents = query({
    args: {
        searchTerm: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Get the authenticated user's Convex ID
        const userId = await getAuthenticatedConvexId(ctx);
        // Search for events using the search index
        const searchResults = await ctx.db
            .query("events")
            .withSearchIndex("search_events", (q) => q.search("title", args.searchTerm).eq("isCancelled", false))
            .take(args.limit ?? 10);
        // Filter results to only include events the user has access to
        const accessibleEvents = [];
        for (const event of searchResults) {
            // Check if user has access to this event through calendar permissions
            const calendarEvents = await ctx.db
                .query("calendarEvents")
                .withIndex("by_event", (q) => q.eq("eventId", event._id))
                .collect();
            // Check access to any of the calendars this event belongs to
            for (const calendarEvent of calendarEvents) {
                const hasAccess = await hasCalendarAccess(ctx, calendarEvent.calendarId, userId);
                if (hasAccess) {
                    accessibleEvents.push(event);
                    break; // Found access through at least one calendar
                }
            }
        }
        return accessibleEvents;
    },
});
