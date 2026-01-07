import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import type { Id } from "../../../_generated/dataModel";
import type { QueryCtx } from "../../../_generated/server";
import type { EventRecord } from "../helpers";
import { query } from "../../../_generated/server";
import {
  EVENT_META_KEYS,
  EVENT_POST_TYPE,
  getCalendarViewDateRange,
  getPostMetaMap,
  hydrateEvent,
} from "../helpers";

const loadEventById = async (ctx: QueryCtx, eventId: Id<"posts">) => {
  const event = await ctx.db.get(eventId);
  if (!event || event.postTypeSlug !== EVENT_POST_TYPE) {
    return null;
  }
  const meta = await getPostMetaMap(ctx, event._id);
  return hydrateEvent(event, meta);
};

const loadAllEvents = async (ctx: QueryCtx) => {
  const posts = await ctx.db
    .query("posts")
    .withIndex("by_postTypeSlug", (q) => q.eq("postTypeSlug", EVENT_POST_TYPE))
    .collect();

  const events: EventRecord[] = [];
  for (const post of posts) {
    const meta = await getPostMetaMap(ctx, post._id);
    events.push(hydrateEvent(post, meta));
  }
  return events;
};

interface DateRangeFilters {
  startDate: number;
  endDate: number;
  calendarIds?: Id<"posts">[];
}

const filterEventsByRange = (
  events: EventRecord[],
  filters: DateRangeFilters,
) => {
  return events.filter((event) => {
    if (
      filters.calendarIds &&
      filters.calendarIds.length > 0 &&
      (!event.calendarId ||
        !filters.calendarIds.some(
          (calendarId) => calendarId === event.calendarId,
        ))
    ) {
      return false;
    }
    if (event.startTime === undefined || event.endTime === undefined) {
      return false;
    }
    return (
      event.startTime <= filters.endDate && event.endTime >= filters.startDate
    );
  });
};

export const getEvent = query({
  args: { eventId: v.id("posts") },
  handler: async (ctx, args) => {
    return await loadEventById(ctx, args.eventId);
  },
});

export const searchEvents = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const normalized = args.searchTerm.toLowerCase();
    const events = await loadAllEvents(ctx);
    const matches = events.filter((event) =>
      event.title.toLowerCase().includes(normalized),
    );
    return matches.slice(0, args.limit ?? 10);
  },
});

export const getCalendarEvents = query({
  args: {
    calendarId: v.id("posts"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const events = await loadAllEvents(ctx);
    return filterEventsByRange(events, {
      startDate: args.startDate,
      endDate: args.endDate,
      calendarIds: [args.calendarId],
    });
  },
});

interface EventsRangeResponse {
  events: EventRecord[];
  hasMore: boolean;
  cursor: string | null;
}

export const getEventsInDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    calendarIds: v.optional(v.array(v.id("posts"))),
    includeRecurrences: v.optional(v.boolean()),
    paginationOpts: v.optional(paginationOptsValidator),
  },
  handler: async (ctx, args): Promise<EventsRangeResponse> => {
    const events = await loadAllEvents(ctx);
    const filtered = filterEventsByRange(events, {
      startDate: args.startDate,
      endDate: args.endDate,
      calendarIds: args.calendarIds,
    });

    if (args.paginationOpts) {
      const startIndex = args.paginationOpts.cursor
        ? Number(args.paginationOpts.cursor)
        : 0;
      const endIndex = startIndex + (args.paginationOpts.numItems ?? 20);
      const page = filtered.slice(startIndex, endIndex);
      const nextCursor = endIndex < filtered.length ? `${endIndex}` : null;
      return {
        events: page,
        hasMore: nextCursor !== null,
        cursor: nextCursor,
      };
    }

    return {
      events: filtered,
      hasMore: false,
      cursor: null,
    };
  },
});

export const getCalendarViewEvents = query({
  args: {
    calendarIds: v.optional(v.array(v.id("posts"))),
    viewDate: v.number(),
    viewType: v.union(
      v.literal("day"),
      v.literal("week"),
      v.literal("month"),
      v.literal("year"),
    ),
    includeRecurrences: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const range = getCalendarViewDateRange(
      new Date(args.viewDate),
      args.viewType,
    );
    const events = await loadAllEvents(ctx);
    return filterEventsByRange(events, {
      startDate: range.start,
      endDate: range.end,
      calendarIds: args.calendarIds,
    });
  },
});
