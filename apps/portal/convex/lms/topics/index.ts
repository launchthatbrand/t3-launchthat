import { filter } from "convex-helpers/server/filter";
import { ConvexError, v } from "convex/values";

import type { Doc } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import { internalMutation, mutation, query } from "../../_generated/server";
import { requireAdmin } from "../../lib/permissions/requirePermission";

// Topics logic will be moved here
export {};

// --- Create Topic Mutation ---
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

// --- Get Available Topics Query ---
export const getAvailable = query({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    // Get all topics that are not attached to this lesson
    const topics = await filter(
      ctx.db.query("topics"),
      (topic: Doc<"topics">) => topic.lessonId !== args.lessonId,
    ).collect();
    return topics;
  },
});

// --- Update Topic (full) ---
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
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { topicId, ...data } = args;

    // Convert undefined optional array to undefined else join? categories will be stored as array of strings
    await ctx.db.patch(topicId, data);
  },
});

// --- Remove Topic ---
export const remove = mutation({
  args: {
    topicId: v.id("topics"),
  },
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
  },
});

// --- Attach Topic to Lesson ---
export const attachToLesson = mutation({
  args: {
    topicId: v.id("topics"),
    lessonId: v.id("lessons"),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.topicId, {
      lessonId: args.lessonId,
      order: args.order,
      menuOrder: args.order,
    });
  },
});

// --- Reorder Topics in Lesson ---
export const reorderTopicsInLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
    orderedTopicIds: v.array(v.id("topics")),
  },
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
 * Public mutation to remove a topic from a lesson.
 * It calls the internal detachFromLesson mutation.
 * Admin-only mutation.
 */
export const removeTopicFromLesson = mutation({
  args: {
    topicId: v.id("topics"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    // Call the internal mutation to detach the topic
    await ctx.runMutation(internal.lms.topics.index.detachFromLesson, {
      topicId: args.topicId,
    });
    return null;
  },
});

/**
 * Detaches a topic from a lesson by setting its lessonId to undefined.
 * This does NOT delete the topic itself. Internal mutation.
 */
export const detachFromLesson = internalMutation({
  args: {
    topicId: v.id("topics"),
  },
  handler: async (ctx, args) => {
    // No need for requireAdmin here as it's an internal mutation
    await ctx.db.patch(args.topicId, { lessonId: undefined, order: undefined });
    return null;
  },
});

/**
 * Get all topics.
 */
export const listTopics = query({
  args: {
    searchTitle: v.optional(v.string()),
    lessonId: v.optional(v.id("lessons")),
    isPublished: v.optional(v.boolean()),
    // Add more filters as needed
  },
  returns: v.array(
    v.object({
      _id: v.id("topics"),
      _creationTime: v.number(),
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
    }),
  ),
  handler: async (ctx, args) => {
    let topics = await ctx.db.query("topics").collect();

    if (args.lessonId !== undefined) {
      topics = topics.filter((topic) => topic.lessonId === args.lessonId);
    }

    if (args.searchTitle) {
      const searchRegex = new RegExp(args.searchTitle, "i");
      topics = topics.filter((topic) => searchRegex.test(topic.title));
    }

    if (args.isPublished !== undefined) {
      topics = topics.filter((topic) => topic.isPublished === args.isPublished);
    }

    // Sort by menuOrder if available, otherwise by creationTime
    topics.sort((a, b) => {
      if (a.menuOrder !== undefined && b.menuOrder !== undefined) {
        return a.menuOrder - b.menuOrder;
      }
      return a._creationTime - b._creationTime;
    });

    return topics;
  },
});

/**
 * Get a single topic by ID.
 */
export const getTopic = query({
  args: {
    id: v.id("topics"),
  },
  returns: v.object({
    _id: v.id("topics"),
    _creationTime: v.number(),
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
  }),
  handler: async (ctx, args) => {
    const topic = await ctx.db.get(args.id);
    if (!topic) {
      throw new ConvexError("Topic not found");
    }
    return topic;
  },
});

/**
 * Create a new topic.
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
 * Update an existing topic.
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
  },
});

/**
 * Paginate topics by lessonId.
 */
export const paginateTopicsByLessonId = query({
  args: {
    lessonId: v.id("lessons"),
    paginationOpts: v.any(), // TODO: Replace with proper paginationOptsValidator
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("topics")
      .withIndex("by_lessonId_menuOrder", (q) =>
        q.eq("lessonId", args.lessonId),
      )
      .order("asc")
      .paginate(args.paginationOpts);
  },
});
