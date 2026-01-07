import { v } from "convex/values";

import { mutation } from "../../_generated/server";
import { generateUniqueSlug, sanitizeSlug } from "../../lib/slugs";
import { getAuthenticatedUserId } from "../../shared/auth";
import type {
  CalendarOwnerType} from "./helpers";
import {
  CALENDAR_META_KEYS,
  CALENDAR_POST_TYPE,
  deleteAllMetaForPost,
  setPostMetaValue,
} from "./helpers";

const ownerTypeValidator = v.union(
  v.literal("user"),
  v.literal("group"),
  v.literal("course"),
  v.literal("organization"),
);

export const createCalendar = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    ownerId: v.optional(v.string()),
    ownerType: v.optional(ownerTypeValidator),
    organizationId: v.optional(v.id("organizations")),
    isDefault: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identityId = await getAuthenticatedUserId(ctx);
    const ownerId = args.ownerId ?? identityId;
    const ownerType = (args.ownerType ?? "user") as CalendarOwnerType;

    const now = Date.now();
    const slugBase = args.slug ? sanitizeSlug(args.slug) : args.name;
    const slug = await generateUniqueSlug(ctx.db, "posts", slugBase);

    const calendarId = await ctx.db.insert("posts", {
      title: args.name,
      content: args.description ?? null,
      postTypeSlug: CALENDAR_POST_TYPE,
      organizationId: args.organizationId,
      slug,
      status: "published",
      createdAt: now,
      updatedAt: now,
    });

    await Promise.all([
      args.color
        ? setPostMetaValue(
            ctx,
            calendarId,
            CALENDAR_META_KEYS.color,
            args.color,
          )
        : Promise.resolve(),
      setPostMetaValue(ctx, calendarId, CALENDAR_META_KEYS.ownerId, ownerId),
      setPostMetaValue(
        ctx,
        calendarId,
        CALENDAR_META_KEYS.ownerType,
        ownerType,
      ),
      setPostMetaValue(
        ctx,
        calendarId,
        CALENDAR_META_KEYS.isDefault,
        args.isDefault ?? false,
      ),
      setPostMetaValue(
        ctx,
        calendarId,
        CALENDAR_META_KEYS.isPublic,
        args.isPublic ?? false,
      ),
    ]);

    return calendarId;
  },
});

export const updateCalendar = mutation({
  args: {
    calendarId: v.id("posts"),
    name: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    color: v.optional(v.union(v.string(), v.null())),
    isDefault: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
    ownerId: v.optional(v.string()),
    ownerType: v.optional(ownerTypeValidator),
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const calendar = await ctx.db.get(args.calendarId);
    if (!calendar || calendar.postTypeSlug !== CALENDAR_POST_TYPE) {
      throw new Error("Calendar not found");
    }

    const updates: Record<string, unknown> = {};
    if (typeof args.name === "string") {
      updates.title = args.name;
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
        args.calendarId,
      );
    }
    if (Object.keys(updates).length) {
      updates.updatedAt = Date.now();
      await ctx.db.patch(args.calendarId, updates);
    }

    const metaUpdates: Promise<void>[] = [];
    if (args.color !== undefined) {
      metaUpdates.push(
        setPostMetaValue(
          ctx,
          args.calendarId,
          CALENDAR_META_KEYS.color,
          args.color,
        ),
      );
    }
    if (args.isDefault !== undefined) {
      metaUpdates.push(
        setPostMetaValue(
          ctx,
          args.calendarId,
          CALENDAR_META_KEYS.isDefault,
          args.isDefault,
        ),
      );
    }
    if (args.isPublic !== undefined) {
      metaUpdates.push(
        setPostMetaValue(
          ctx,
          args.calendarId,
          CALENDAR_META_KEYS.isPublic,
          args.isPublic,
        ),
      );
    }
    if (args.ownerId !== undefined) {
      metaUpdates.push(
        setPostMetaValue(
          ctx,
          args.calendarId,
          CALENDAR_META_KEYS.ownerId,
          args.ownerId,
        ),
      );
    }
    if (args.ownerType !== undefined) {
      metaUpdates.push(
        setPostMetaValue(
          ctx,
          args.calendarId,
          CALENDAR_META_KEYS.ownerType,
          args.ownerType,
        ),
      );
    }

    if (metaUpdates.length) {
      await Promise.all(metaUpdates);
    }

    return args.calendarId;
  },
});

export const deleteCalendar = mutation({
  args: {
    calendarId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const calendar = await ctx.db.get(args.calendarId);
    if (!calendar || calendar.postTypeSlug !== CALENDAR_POST_TYPE) {
      throw new Error("Calendar not found");
    }

    await deleteAllMetaForPost(ctx, args.calendarId);
    await ctx.db.delete(args.calendarId);

    return { success: true };
  },
});
