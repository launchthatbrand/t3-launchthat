/**
 * Lessons Mutations
 *
 * Contains all write operations for the lessons feature.
 */
import { filter } from "convex-helpers/server/filter";
import { v } from "convex/values";

import type { Doc } from "../../_generated/dataModel";
import { mutation } from "../../_generated/server";
import { requireAdmin } from "../../lib/permissions/requirePermission";

/**
 * Create a new lesson
 */
export const create = mutation({
  args: {
    title: v.string(),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    featuredMedia: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  returns: v.id("lessons"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const newLessonId = await ctx.db.insert("lessons", {
      title: args.title,
      description: undefined,
      content: args.content,
      excerpt: args.excerpt,
      categories: args.categories,
      featuredMedia: args.featuredMedia,
      isPublished: args.isPublished ?? false,
    });

    console.log(`Created new lesson with ID: ${newLessonId}`);
    return newLessonId;
  },
});

/**
 * Create lesson via webhook (public API)
 */
export const createViaWebhook = mutation({
  args: {
    title: v.string(),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    featuredMedia: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  returns: v.id("lessons"),
  handler: async (ctx, args) => {
    // // Simple shared-secret auth (store secret in Convex env vars)
    // if (args.apiKey !== process.env.MAKE_COM_API_KEY) {
    //   throw new Error("Invalid API key");
    // }

    return await ctx.db.insert("lessons", args);
  },
});

/**
 * Update lesson title
 */
export const updateTitle = mutation({
  args: {
    lessonId: v.id("lessons"),
    title: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.lessonId, { title: args.title });
    return null;
  },
});

/**
 * Update lesson fields
 */
export const update = mutation({
  args: {
    lessonId: v.id("lessons"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    featuredMedia: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { lessonId, ...data } = args;
    await ctx.db.patch(lessonId, data);
    return null;
  },
});

/**
 * Remove lesson and all associated topics
 */
export const remove = mutation({
  args: {
    lessonId: v.id("lessons"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Get all topics associated with this lesson
    const topics = await filter(
      ctx.db.query("topics"),
      (topic: Doc<"topics">) => topic.lessonId === args.lessonId,
    ).collect();

    // Delete all associated topics first
    for (const topic of topics) {
      await ctx.db.delete(topic._id);
    }

    // Delete the lesson
    await ctx.db.delete(args.lessonId);
    return null;
  },
});

/**
 * Attach lesson to a course
 */
export const attachToCourse = mutation({
  args: {
    lessonId: v.id("lessons"),
    courseId: v.id("courses"),
    order: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.lessonId, {
      courseId: args.courseId,
      order: args.order,
    });
    return null;
  },
});
