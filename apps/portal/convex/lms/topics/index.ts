import { filter } from "convex-helpers/server/filter";
import { v } from "convex/values";

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
    });
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

// --- List Topics Query ---
export const listTopics = query({
  args: { searchTitle: v.optional(v.string()) },
  returns: v.array(
    v.object({
      _id: v.id("topics"),
      _creationTime: v.number(),
      title: v.string(),
      contentType: v.optional(
        v.union(v.literal("text"), v.literal("video"), v.literal("quiz")),
      ),
      lessonId: v.optional(v.id("lessons")),
      description: v.optional(v.string()),
      wp_id: v.optional(v.float64()),
      excerpt: v.optional(v.string()),
      categories: v.optional(v.array(v.string())),
      featuredImage: v.optional(v.string()),
      isPublished: v.optional(v.boolean()),
      order: v.optional(v.number()),
      content: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    // Fetch all topics, optionally filter by title
    let topics = await ctx.db.query("topics").collect();
    if (args.searchTitle) {
      const lower = args.searchTitle.toLowerCase();
      topics = topics.filter((t) => t.title.toLowerCase().includes(lower));
    }
    return topics;
  },
});

// --- Get Topic By ID ---
export const getTopic = query({
  args: { topicId: v.id("topics") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("topics"),
      _creationTime: v.number(),
      title: v.string(),
      contentType: v.union(
        v.literal("text"),
        v.literal("video"),
        v.literal("quiz"),
      ),
      description: v.optional(v.string()),
      excerpt: v.optional(v.string()),
      categories: v.optional(v.array(v.string())),
      featuredImage: v.optional(v.string()),
      content: v.optional(v.string()),
      isPublished: v.optional(v.boolean()),
    }),
  ),
  handler: async (ctx, args) => {
    const topic = await ctx.db.get(args.topicId);
    if (!topic) return null;

    return {
      _id: topic._id,
      _creationTime: topic._creationTime,
      title: topic.title,
      contentType: topic.contentType,
      description: topic.description,
      excerpt: topic.excerpt,
      categories: topic.categories,
      featuredImage: topic.featuredImage,
      content: topic.content,
      isPublished: topic.isPublished,
    };
  },
});

// --- Other Topic Mutations/Queries (placeholder) ---
// export const update = mutation({...});
// export const get = query({...});
