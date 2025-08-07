/**
 * Topics Mutations
 *
 * Contains all write operations for the topics feature.
 */
import { filter } from "convex-helpers/server/filter";
import { v } from "convex/values";

import { internal } from "../../_generated/api";
import { Doc } from "../../_generated/dataModel";
import { internalMutation, mutation } from "../../_generated/server";
import { requireAdmin } from "../../lib/permissions/requirePermission";

/**
 * Create a new topic (basic)
 */
export const create = mutation({
  args: {
    title: v.string(),
    contentType: v.union(
      v.literal("text"),
      v.literal("video"),
      v.literal("quiz"),
    ),
    content: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  returns: v.id("topics"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const newTopicId = await ctx.db.insert("topics", {
      title: args.title,
      contentType: args.contentType,
      content: args.content,
      isPublished: args.isPublished ?? false,
      lessonId: undefined, // Explicitly unattached
      order: undefined, // Explicitly unattached
    });

    console.log(`Created new topic with ID: ${newTopicId}`);
    return newTopicId;
  },
});

/**
 * Create a new topic (full)
 */
export const createTopic = mutation({
  args: {
    lessonId: v.optional(v.id("lessons")),
    title: v.string(),
    description: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    tagIds: v.optional(v.array(v.id("tags"))),
    wp_id: v.optional(v.float64()),
    featuredImage: v.optional(v.string()),
    featuredMedia: v.optional(
      v.union(
        v.object({
          type: v.literal("convex"),
          mediaItemId: v.id("mediaItems"),
        }),
        v.object({
          type: v.literal("vimeo"),
          vimeoId: v.string(),
          vimeoUrl: v.string(),
        }),
        v.string(),
      ),
    ),
    contentType: v.optional(
      v.union(v.literal("text"), v.literal("video"), v.literal("quiz")),
    ),
    content: v.optional(v.string()),
    order: v.optional(v.number()),
    menuOrder: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
  },
  returns: v.id("topics"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // If lessonId is provided, find the max order for that lesson
    let order = args.order;
    if (args.lessonId && order === undefined) {
      const existingTopics = await ctx.db
        .query("topics")
        .withIndex("by_lessonId_order", (q) => q.eq("lessonId", args.lessonId))
        .order("desc")
        .take(1);
      order = (existingTopics[0]?.order ?? 0) + 1;
    }

    const newTopicId = await ctx.db.insert("topics", {
      lessonId: args.lessonId,
      title: args.title,
      description: args.description,
      excerpt: args.excerpt,
      categories: args.categories,
      tagIds: args.tagIds,
      wp_id: args.wp_id,
      featuredImage: args.featuredImage,
      featuredMedia: args.featuredMedia,
      contentType: args.contentType,
      content: args.content,
      order: order,
      menuOrder: args.menuOrder,
      isPublished: args.isPublished,
    });
    return newTopicId;
  },
});

/**
 * Update topic fields
 */
export const update = mutation({
  args: {
    topicId: v.id("topics"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    featuredImage: v.optional(v.string()),
    contentType: v.optional(
      v.union(v.literal("text"), v.literal("video"), v.literal("quiz")),
    ),
    content: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { topicId, ...data } = args;
    await ctx.db.patch(topicId, data);
    return null;
  },
});

/**
 * Update an existing topic (full)
 */
export const updateTopic = mutation({
  args: {
    id: v.id("topics"),
    lessonId: v.optional(v.id("lessons")),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    tagIds: v.optional(v.array(v.id("tags"))),
    wp_id: v.optional(v.float64()),
    featuredImage: v.optional(v.string()),
    featuredMedia: v.optional(
      v.union(
        v.object({
          type: v.literal("convex"),
          mediaItemId: v.id("mediaItems"),
        }),
        v.object({
          type: v.literal("vimeo"),
          vimeoId: v.string(),
          vimeoUrl: v.string(),
        }),
        v.string(),
      ),
    ),
    contentType: v.optional(
      v.union(v.literal("text"), v.literal("video"), v.literal("quiz")),
    ),
    content: v.optional(v.string()),
    order: v.optional(v.number()),
    menuOrder: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { id, ...patch } = args;

    // If lessonId is being updated and order is not provided, re-calculate order
    if (patch.lessonId !== undefined && patch.order === undefined) {
      const existingTopics = await ctx.db
        .query("topics")
        .withIndex("by_lessonId_order", (q) => q.eq("lessonId", patch.lessonId))
        .order("desc")
        .take(1);
      patch.order = (existingTopics[0]?.order ?? 0) + 1;
    }

    await ctx.db.patch(id, patch);
    return null;
  },
});

/**
 * Remove topic and all associated quizzes
 */
export const remove = mutation({
  args: {
    topicId: v.id("topics"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Get all quizzes associated with this topic
    const quizzes = await filter(
      ctx.db.query("quizzes"),
      (quiz: Doc<"quizzes">) => quiz.topicId === args.topicId,
    ).collect();

    // Delete all associated quizzes first
    for (const quiz of quizzes) {
      await ctx.db.delete(quiz._id);
    }

    // Delete the topic
    await ctx.db.delete(args.topicId);
    return null;
  },
});

/**
 * Attach topic to a lesson
 */
export const attachToLesson = mutation({
  args: {
    topicId: v.id("topics"),
    lessonId: v.id("lessons"),
    order: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.topicId, {
      lessonId: args.lessonId,
      order: args.order,
      menuOrder: args.order,
    });
    return null;
  },
});

/**
 * Reorder topics in a lesson
 */
export const reorderTopicsInLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
    orderedTopicIds: v.array(v.id("topics")),
  },
  returns: v.null(),
  handler: async (ctx, { lessonId, orderedTopicIds }) => {
    await requireAdmin(ctx);
    for (let i = 0; i < orderedTopicIds.length; i++) {
      await ctx.db.patch(orderedTopicIds[i], {
        lessonId,
        order: i,
        menuOrder: i,
      });
    }
    return null;
  },
});

/**
 * Remove a topic from a lesson (public mutation)
 */
export const removeTopicFromLesson = mutation({
  args: {
    topicId: v.id("topics"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    // Detach the topic directly since we're in the same file now
    await ctx.db.patch(args.topicId, { lessonId: undefined, order: undefined });
    return null;
  },
});

/**
 * Detach a topic from a lesson (internal mutation)
 */
export const detachFromLesson = internalMutation({
  args: {
    topicId: v.id("topics"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // No need for requireAdmin here as it's an internal mutation
    await ctx.db.patch(args.topicId, { lessonId: undefined, order: undefined });
    return null;
  },
});
