import { v } from "convex/values";

import { query } from "../../_generated/server";

/**
 * Enhanced query to get complete course structure for real-time subscriptions
 * This supports the unified state management system by providing all necessary data
 * in a single subscription-friendly query
 */
export const getCourseStructureWithItems = query({
  args: { courseId: v.id("courses") },
  returns: v.union(
    v.null(),
    v.object({
      course: v.object({
        _id: v.id("courses"),
        _creationTime: v.number(),
        title: v.string(),
        description: v.optional(v.string()),
        productId: v.optional(v.string()),
        isPublished: v.optional(v.boolean()),
        courseStructure: v.optional(
          v.array(
            v.object({
              lessonId: v.string(),
            }),
          ),
        ),
      }),
      attachedLessons: v.array(
        v.object({
          _id: v.id("lessons"),
          _creationTime: v.number(),
          title: v.string(),
          description: v.optional(v.string()),
          content: v.optional(v.string()),
          videoUrl: v.optional(v.string()),
          duration: v.optional(v.number()),
          order: v.optional(v.number()),
          isPublished: v.optional(v.boolean()),
          courseId: v.optional(v.id("courses")),
        }),
      ),
      attachedTopics: v.array(
        v.object({
          _id: v.id("topics"),
          _creationTime: v.number(),
          title: v.string(),
          description: v.optional(v.string()),
          content: v.optional(v.string()),
          order: v.optional(v.number()),
          lessonId: v.optional(v.id("lessons")),
          contentType: v.union(
            v.literal("text"),
            v.literal("video"),
            v.literal("quiz"),
          ),
          isPublished: v.optional(v.boolean()),
        }),
      ),
      attachedQuizzes: v.array(
        v.object({
          _id: v.id("quizzes"),
          _creationTime: v.number(),
          title: v.string(),
          description: v.optional(v.string()),
          questions: v.optional(v.array(v.any())),
          order: v.optional(v.number()),
          lessonId: v.optional(v.id("lessons")),
          isPublished: v.optional(v.boolean()),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    // Get the course
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      return null;
    }

    // Get all lessons attached to this course
    const attachedLessons = await ctx.db
      .query("lessons")
      .withIndex("by_course_order", (q) => q.eq("courseId", args.courseId))
      .collect();

    // Get all topics attached to lessons in this course
    const lessonIds = attachedLessons.map((lesson) => lesson._id);
    const attachedTopics = [];
    for (const lessonId of lessonIds) {
      const topics = await ctx.db
        .query("topics")
        .withIndex("by_lessonId_order", (q) => q.eq("lessonId", lessonId))
        .collect();
      attachedTopics.push(...topics);
    }

    // Get all quizzes attached to lessons in this course
    const attachedQuizzes = [];
    for (const lessonId of lessonIds) {
      const quizzes = await ctx.db
        .query("quizzes")
        .withIndex("by_lessonId", (q) => q.eq("lessonId", lessonId))
        .collect();
      attachedQuizzes.push(...quizzes);
    }

    return {
      course,
      attachedLessons,
      attachedTopics,
      attachedQuizzes,
    };
  },
});

/**
 * Query to get available lessons (not attached to any course)
 * Supports the available items panel in the course builder
 */
export const getAvailableLessons = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("lessons"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      content: v.optional(v.string()),
      videoUrl: v.optional(v.string()),
      duration: v.optional(v.number()),
      isPublished: v.optional(v.boolean()),
      order: v.optional(v.number()),
    }),
  ),
  handler: async (ctx) => {
    // Get lessons that are not attached to any course
    const availableLessons = await ctx.db
      .query("lessons")
      .filter((q) => q.eq(q.field("courseId"), undefined))
      .collect();

    return availableLessons;
  },
});

/**
 * Query to get available topics (not attached to any lesson)
 * Supports the available items panel in the course builder
 */
export const getAvailableTopics = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("topics"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      content: v.optional(v.string()),
      contentType: v.union(
        v.literal("text"),
        v.literal("video"),
        v.literal("quiz"),
      ),
      isPublished: v.optional(v.boolean()),
    }),
  ),
  handler: async (ctx) => {
    // Get topics that are not attached to any lesson
    const availableTopics = await ctx.db
      .query("topics")
      .filter((q) => q.eq(q.field("lessonId"), undefined))
      .collect();

    return availableTopics;
  },
});

/**
 * Query to get available quizzes (not attached to any lesson)
 * Supports the available items panel in the course builder
 */
export const getAvailableQuizzes = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("quizzes"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      questions: v.optional(v.array(v.any())),
      isPublished: v.optional(v.boolean()),
    }),
  ),
  handler: async (ctx) => {
    // Get quizzes that are not attached to any lesson
    const availableQuizzes = await ctx.db
      .query("quizzes")
      .filter((q) => q.eq(q.field("lessonId"), undefined))
      .collect();

    return availableQuizzes;
  },
});

/**
 * Lightweight query for course metadata only
 * Useful for components that only need basic course info
 */
export const getCourseMetadata = query({
  args: { courseId: v.id("courses") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      isPublished: v.optional(v.boolean()),
      lessonCount: v.number(),
      topicCount: v.number(),
      quizCount: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      return null;
    }

    // Get counts for dashboard/summary views
    const lessonCount = await ctx.db
      .query("lessons")
      .withIndex("by_course_order", (q) => q.eq("courseId", args.courseId))
      .collect()
      .then((lessons) => lessons.length);

    const lessonIds = await ctx.db
      .query("lessons")
      .withIndex("by_course_order", (q) => q.eq("courseId", args.courseId))
      .collect()
      .then((lessons) => lessons.map((l) => l._id));

    let topicCount = 0;
    let quizCount = 0;

    for (const lessonId of lessonIds) {
      const topics = await ctx.db
        .query("topics")
        .withIndex("by_lessonId_order", (q) => q.eq("lessonId", lessonId))
        .collect();
      topicCount += topics.length;

      const quizzes = await ctx.db
        .query("quizzes")
        .withIndex("by_lessonId", (q) => q.eq("lessonId", lessonId))
        .collect();
      quizCount += quizzes.length;
    }

    return {
      ...course,
      lessonCount,
      topicCount,
      quizCount,
    };
  },
});
