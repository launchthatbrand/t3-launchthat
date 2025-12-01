import { v } from "convex/values";

import type { Id } from "../../../_generated/dataModel";
import { mutation } from "../../../_generated/server";
import { generateUniqueSlug, sanitizeSlug } from "../../../lib/slugs";
import { getAuthenticatedUserId } from "../../../shared/auth";
import {
  deleteAllMetaForPost,
  EVENT_META_KEYS,
  EVENT_POST_TYPE,
  getPostMetaMap,
  hydrateEvent,
  serializeJsonMeta,
  setPostMetaValue,
} from "../helpers";

const eventTypeValidator = v.union(
  v.literal("meeting"),
  v.literal("webinar"),
  v.literal("workshop"),
  v.literal("class"),
  v.literal("conference"),
  v.literal("social"),
  v.literal("deadline"),
  v.literal("reminder"),
  v.literal("other"),
);

const visibilityValidator = v.union(
  v.literal("public"),
  v.literal("private"),
  v.literal("restricted"),
);

const locationValidator = v.object({
  type: v.union(
    v.literal("virtual"),
    v.literal("physical"),
    v.literal("hybrid"),
  ),
  address: v.optional(v.string()),
  url: v.optional(v.string()),
});

const recurrenceValidator = v.object({
  frequency: v.union(
    v.literal("daily"),
    v.literal("weekly"),
    v.literal("monthly"),
    v.literal("yearly"),
  ),
  interval: v.optional(v.number()),
  count: v.optional(v.number()),
  until: v.optional(v.number()),
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
});

function assertCalendarPost(post: any): asserts post is {
  _id: Id<"posts">;
  postTypeSlug: string;
  organizationId?: Id<"organizations"> | null;
} {
  if (!post || post.postTypeSlug !== "calendars") {
    throw new Error("Calendar not found");
  }
}

export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    calendarId: v.id("posts"),
    startTime: v.number(),
    endTime: v.number(),
    allDay: v.optional(v.boolean()),
    timezone: v.optional(v.string()),
    type: eventTypeValidator,
    visibility: visibilityValidator,
    color: v.optional(v.string()),
    location: v.optional(locationValidator),
    recurrence: v.optional(recurrenceValidator),
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.startTime > args.endTime) {
      throw new Error("Start time must come before end time");
    }

    const calendar = await ctx.db.get(args.calendarId);
    assertCalendarPost(calendar);

    const identity = await getAuthenticatedUserId(ctx);
    const now = Date.now();
    const slugBase = args.slug ? sanitizeSlug(args.slug) : args.title;
    const slug = await generateUniqueSlug(ctx.db, "posts", slugBase);

    const eventId = await ctx.db.insert("posts", {
      title: args.title,
      content: args.description ?? null,
      postTypeSlug: EVENT_POST_TYPE,
      organizationId: calendar.organizationId ?? undefined,
      slug,
      status: "published",
      createdAt: now,
      updatedAt: now,
    });

    await Promise.all([
      setPostMetaValue(
        ctx,
        eventId,
        EVENT_META_KEYS.calendarId,
        args.calendarId,
      ),
      setPostMetaValue(ctx, eventId, EVENT_META_KEYS.startTime, args.startTime),
      setPostMetaValue(ctx, eventId, EVENT_META_KEYS.endTime, args.endTime),
      setPostMetaValue(
        ctx,
        eventId,
        EVENT_META_KEYS.allDay,
        args.allDay ?? false,
      ),
      args.timezone
        ? setPostMetaValue(
            ctx,
            eventId,
            EVENT_META_KEYS.timezone,
            args.timezone,
          )
        : Promise.resolve(),
      args.color
        ? setPostMetaValue(ctx, eventId, EVENT_META_KEYS.color, args.color)
        : Promise.resolve(),
      setPostMetaValue(ctx, eventId, EVENT_META_KEYS.type, args.type),
      setPostMetaValue(
        ctx,
        eventId,
        EVENT_META_KEYS.visibility,
        args.visibility,
      ),
      setPostMetaValue(ctx, eventId, EVENT_META_KEYS.createdBy, identity),
      args.location
        ? setPostMetaValue(
            ctx,
            eventId,
            EVENT_META_KEYS.location,
            serializeJsonMeta(args.location),
          )
        : Promise.resolve(),
      args.recurrence
        ? setPostMetaValue(
            ctx,
            eventId,
            EVENT_META_KEYS.recurrence,
            serializeJsonMeta(args.recurrence),
          )
        : Promise.resolve(),
    ]);

    return eventId;
  },
});

export const updateEvent = mutation({
  args: {
    eventId: v.id("posts"),
    title: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    allDay: v.optional(v.boolean()),
    timezone: v.optional(v.union(v.string(), v.null())),
    type: v.optional(eventTypeValidator),
    visibility: v.optional(visibilityValidator),
    color: v.optional(v.union(v.string(), v.null())),
    calendarId: v.optional(v.id("posts")),
    location: v.optional(v.union(locationValidator, v.null())),
    recurrence: v.optional(v.union(recurrenceValidator, v.null())),
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.postTypeSlug !== EVENT_POST_TYPE) {
      throw new Error("Event not found");
    }

    if (
      args.startTime !== undefined &&
      args.endTime !== undefined &&
      args.startTime > args.endTime
    ) {
      throw new Error("Start time must come before end time");
    }

    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) {
      updates.title = args.title;
    }
    if (args.description !== undefined) {
      updates.content = args.description;
    }
    if (args.slug) {
      const sanitized = sanitizeSlug(args.slug);
      updates.slug = await generateUniqueSlug(
        ctx.db,
        "posts",
        sanitized,
        args.eventId,
      );
    } else if (args.title && event.title !== args.title) {
      updates.slug = await generateUniqueSlug(
        ctx.db,
        "posts",
        args.title,
        args.eventId,
      );
    }
    if (Object.keys(updates).length) {
      updates.updatedAt = Date.now();
      await ctx.db.patch(args.eventId, updates);
    }

    const metaUpdates: Array<Promise<void>> = [];
    if (args.calendarId) {
      metaUpdates.push(
        setPostMetaValue(
          ctx,
          args.eventId,
          EVENT_META_KEYS.calendarId,
          args.calendarId,
        ),
      );
    }
    if (args.startTime !== undefined) {
      metaUpdates.push(
        setPostMetaValue(
          ctx,
          args.eventId,
          EVENT_META_KEYS.startTime,
          args.startTime,
        ),
      );
    }
    if (args.endTime !== undefined) {
      metaUpdates.push(
        setPostMetaValue(
          ctx,
          args.eventId,
          EVENT_META_KEYS.endTime,
          args.endTime,
        ),
      );
    }
    if (args.allDay !== undefined) {
      metaUpdates.push(
        setPostMetaValue(
          ctx,
          args.eventId,
          EVENT_META_KEYS.allDay,
          args.allDay,
        ),
      );
    }
    if (args.timezone !== undefined) {
      metaUpdates.push(
        setPostMetaValue(
          ctx,
          args.eventId,
          EVENT_META_KEYS.timezone,
          args.timezone,
        ),
      );
    }
    if (args.type !== undefined) {
      metaUpdates.push(
        setPostMetaValue(ctx, args.eventId, EVENT_META_KEYS.type, args.type),
      );
    }
    if (args.visibility !== undefined) {
      metaUpdates.push(
        setPostMetaValue(
          ctx,
          args.eventId,
          EVENT_META_KEYS.visibility,
          args.visibility,
        ),
      );
    }
    if (args.color !== undefined) {
      metaUpdates.push(
        setPostMetaValue(ctx, args.eventId, EVENT_META_KEYS.color, args.color),
      );
    }
    if (args.location !== undefined) {
      metaUpdates.push(
        setPostMetaValue(
          ctx,
          args.eventId,
          EVENT_META_KEYS.location,
          args.location ? serializeJsonMeta(args.location) : null,
        ),
      );
    }
    if (args.recurrence !== undefined) {
      metaUpdates.push(
        setPostMetaValue(
          ctx,
          args.eventId,
          EVENT_META_KEYS.recurrence,
          args.recurrence ? serializeJsonMeta(args.recurrence) : null,
        ),
      );
    }

    if (metaUpdates.length) {
      await Promise.all(metaUpdates);
    }

    const meta = await getPostMetaMap(ctx, args.eventId);
    return hydrateEvent(event, meta);
  },
});

export const deleteEvent = mutation({
  args: { eventId: v.id("posts") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.postTypeSlug !== EVENT_POST_TYPE) {
      throw new Error("Event not found");
    }

    await deleteAllMetaForPost(ctx, args.eventId);
    await ctx.db.delete(args.eventId);

    return { success: true };
  },
});
