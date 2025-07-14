import { filter } from "convex-helpers/server/filter";
import { v } from "convex/values";

import type { Doc } from "../../_generated/dataModel";
import { mutation, query } from "../../_generated/server";
import { requireAdmin } from "../../lib/permissions/requirePermission";

// --- Create Lesson Mutation ---
export const create = mutation({
  args: {
    title: v.string(),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    featuredMedia: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
  },
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

// --- Public Create Lesson via API Key ---
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

// --- Get Available Lessons Query ---
export const getAvailable = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    // Get all lessons that are not attached to this course
    const lessons = await filter(
      ctx.db.query("lessons"),
      (lesson: Doc<"lessons">) => lesson.courseId !== args.courseId,
    ).collect();
    return lessons;
  },
});

// --- Update Lesson Title ---
export const updateTitle = mutation({
  args: {
    lessonId: v.id("lessons"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.lessonId, { title: args.title });
  },
});

// --- Update Lesson Fields ---
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
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { lessonId, ...data } = args;
    await ctx.db.patch(lessonId, data);
  },
});

// --- Remove Lesson ---
export const remove = mutation({
  args: {
    lessonId: v.id("lessons"),
  },
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
  },
});

// --- Attach Lesson to Course ---
export const attachToCourse = mutation({
  args: {
    lessonId: v.id("lessons"),
    courseId: v.id("courses"),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.lessonId, {
      courseId: args.courseId,
      order: args.order,
    });
  },
});

// --- List Lessons Query ---
export const listLessons = query({
  args: { searchTitle: v.optional(v.string()) },
  returns: v.array(
    v.object({
      _id: v.id("lessons"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      wp_id: v.optional(v.number()),
      content: v.optional(v.string()),
      excerpt: v.optional(v.string()),
      featuredMedia: v.optional(v.string()),
      courseId: v.optional(v.id("courses")),
      isPublished: v.optional(v.boolean()),
      order: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    let lessons = await ctx.db.query("lessons").collect();
    if (args.searchTitle) {
      const lower = args.searchTitle.toLowerCase();
      lessons = lessons.filter((l) => l.title.toLowerCase().includes(lower));
    }
    return lessons;
  },
});

// --- Get Lesson By ID ---
export const getLesson = query({
  args: { lessonId: v.id("lessons") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("lessons"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      content: v.optional(v.string()),
      excerpt: v.optional(v.string()),
      categories: v.optional(v.array(v.string())),
      featuredMedia: v.optional(v.string()),
      isPublished: v.optional(v.boolean()),
    }),
  ),
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) return null;

    return {
      _id: lesson._id,
      _creationTime: lesson._creationTime,
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      excerpt: lesson.excerpt,
      categories: lesson.categories,
      featuredMedia: lesson.featuredMedia,
      isPublished: lesson.isPublished,
    };
  },
});
