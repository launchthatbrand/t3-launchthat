import { filter } from "convex-helpers/server/filter";
import { v } from "convex/values";

import type { Doc, Id } from "../../_generated/dataModel";
import { mutation, query } from "../../_generated/server";
import { requireAdmin } from "../../lib/permissions/requirePermission";

// --- Create Lesson Mutation ---
export const create = mutation({
  args: {
    title: v.string(),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const newLessonId = await ctx.db.insert("lessons", {
      title: args.title,
      description: undefined,
      isPublished: args.isPublished ?? false,
    });

    console.log(`Created new lesson with ID: ${newLessonId}`);
    return newLessonId;
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
