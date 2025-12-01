import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { query } from "../../_generated/server";
import { getAuthenticatedUserId } from "../../shared/auth";
import {
  CALENDAR_META_KEYS,
  CALENDAR_POST_TYPE,
  EVENT_META_KEYS,
  EVENT_POST_TYPE,
  getPostMetaMap,
  hydrateCalendar,
  hydrateEvent,
} from "./helpers";

async function loadCalendarRecord(ctx: QueryCtx, calendarId: Id<"posts">) {
  const calendar = await ctx.db.get(calendarId);
  if (!calendar || calendar.postTypeSlug !== CALENDAR_POST_TYPE) {
    return null;
  }
  const meta = await getPostMetaMap(ctx, calendar._id);
  return hydrateCalendar(calendar, meta);
}

export const getCalendars = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    let cursor = ctx.db
      .query("posts")
      .withIndex("by_postTypeSlug", (q) =>
        q.eq("postTypeSlug", CALENDAR_POST_TYPE),
      );

    if (args.organizationId) {
      cursor = cursor.filter((q) =>
        q.eq(q.field("organizationId"), args.organizationId),
      );
    }

    const calendars = await cursor.collect();
    const results = [];
    for (const calendar of calendars) {
      const meta = await getPostMetaMap(ctx, calendar._id);
      results.push(hydrateCalendar(calendar, meta));
    }
    return results;
  },
});

export const getCalendarById = query({
  args: { calendarId: v.id("posts") },
  handler: async (ctx, args) => {
    return await loadCalendarRecord(ctx, args.calendarId);
  },
});

export const getCalendarForEvent = query({
  args: { eventId: v.id("posts") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.postTypeSlug !== EVENT_POST_TYPE) {
      return [];
    }
    const eventMeta = await getPostMetaMap(ctx, event._id);
    const calendarId = eventMeta.get(EVENT_META_KEYS.calendarId);
    if (typeof calendarId !== "string") {
      return [];
    }
    const calendar = await loadCalendarRecord(ctx, calendarId as Id<"posts">);
    return calendar ? [calendar] : [];
  },
});

export const getEventById = query({
  args: { eventId: v.id("posts") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.postTypeSlug !== EVENT_POST_TYPE) {
      return null;
    }
    const meta = await getPostMetaMap(ctx, event._id);
    return hydrateEvent(event, meta);
  },
});

export const getUserCalendars = query({
  args: {},
  handler: async (ctx) => {
    const userIdentifier = await getAuthenticatedUserId(ctx);
    const calendars = await ctx.db
      .query("posts")
      .withIndex("by_postTypeSlug", (q) =>
        q.eq("postTypeSlug", CALENDAR_POST_TYPE),
      )
      .collect();

    const results = [];
    for (const calendar of calendars) {
      const meta = await getPostMetaMap(ctx, calendar._id);
      if (meta.get(CALENDAR_META_KEYS.ownerId) === userIdentifier) {
        results.push(hydrateCalendar(calendar, meta));
      }
    }
    return results;
  },
});
