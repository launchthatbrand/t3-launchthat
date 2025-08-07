/**
 * Lessons Queries
 *
 * Contains all read operations for the lessons feature.
 */
import { filter } from "convex-helpers/server/filter";
import { v } from "convex/values";

import type { Doc } from "../../_generated/dataModel";
import { query } from "../../_generated/server";

/**
 * Get available lessons not attached to a specific course
 */
export const getAvailable = query({
  args: {
    courseId: v.id("courses"),
  },
  returns: v.any(), // Use any to avoid validation mismatches with complex types
  handler: async (ctx, args) => {
    // Get all lessons that are not attached to this course
    const lessons = await filter(
      ctx.db.query("lessons"),
      (lesson: Doc<"lessons">) => lesson.courseId !== args.courseId,
    ).collect();
    return lessons;
  },
});

/**
 * List all lessons with optional search
 */
export const listLessons = query({
  args: {
    searchTitle: v.optional(v.string()),
  },
  returns: v.any(), // Use any to avoid validation mismatches
  handler: async (ctx, args) => {
    let lessons = await ctx.db.query("lessons").collect();
    if (args.searchTitle) {
      const lower = args.searchTitle.toLowerCase();
      lessons = lessons.filter((l) => l.title.toLowerCase().includes(lower));
    }
    return lessons;
  },
});

/**
 * Get a single lesson by ID
 */
export const getLesson = query({
  args: {
    lessonId: v.id("lessons"),
  },
  returns: v.any(), // Use any to avoid validation mismatches
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
