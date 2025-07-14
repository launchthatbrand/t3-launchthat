import { filter } from "convex-helpers/server/filter";
import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
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
        wp_id: v.optional(v.number()),
        productId: v.optional(v.string()),
        isPublished: v.optional(v.boolean()),
        courseStructure: v.optional(
          v.array(
            v.object({
              lessonId: v.id("lessons"),
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
          wp_id: v.optional(v.float64()),
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
          isBuiltIn: v.optional(v.boolean()),
          excerpt: v.optional(v.string()),
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
          wp_id: v.optional(v.float64()),
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
      wp_id: v.optional(v.number()),
      excerpt: v.optional(v.string()),
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
      wp_id: v.optional(v.float64()),
      content: v.optional(v.string()),
      contentType: v.optional(
        v.union(v.literal("text"), v.literal("video"), v.literal("quiz")),
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

    // Return only the whitelisted fields expected by the validator
    return {
      _id: course._id,
      _creationTime: course._creationTime,
      title: course.title,
      description: course.description,
      isPublished: course.isPublished,
      lessonCount,
      topicCount,
      quizCount,
    };
  },
});

/**
 * List all published courses for frontend view
 */
export const listPublishedCourses = query({
  args: { searchTitle: v.optional(v.string()) },
  returns: v.array(
    v.object({
      _id: v.id("courses"),
      title: v.string(),
      description: v.optional(v.string()),
      isPublished: v.optional(v.boolean()),
    }),
  ),
  handler: async (ctx, args) => {
    const queryBuilder = ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("isPublished"), true));

    const results = args.searchTitle
      ? await queryBuilder
          .withSearchIndex("search_title", (q) =>
            q.search("title", args.searchTitle ?? ""),
          )
          .collect()
      : await queryBuilder.collect();

    // Return only the whitelisted fields expected by the validator
    return results.map((course) => ({
      _id: course._id,
      title: course.title,
      description: course.description,
      isPublished: course.isPublished,
    }));
  },
});

// List members enrolled in a course
export const listCourseMembers = query({
  args: {
    courseId: v.id("courses"),
  },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    // Find all enrollments for course
    const enrollments = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    const users = await Promise.all(
      enrollments.map(async (enroll) => {
        const usr = await ctx.db.get(enroll.userId);
        if (!usr) return null;
        return {
          _id: usr._id,
          name: usr.name,
          email: usr.email,
        };
      }),
    );

    return users.filter((u): u is NonNullable<typeof u> => u !== null);
  },
});

// --- Additional queries moved from index.ts ---

export const listCourses = query({
  args: { searchTitle: v.optional(v.string()) },
  returns: v.array(
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      productId: v.optional(v.id("products")),
      isPublished: v.optional(v.boolean()),
      courseStructure: v.optional(
        v.array(v.object({ lessonId: v.id("lessons") })),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    if (args.searchTitle) {
      return await ctx.db
        .query("courses")
        .withSearchIndex("search_title", (q) =>
          q.search("title", args.searchTitle ?? ""),
        )
        .collect();
    }
    return await ctx.db.query("courses").collect();
  },
});

export const getCourse = query({
  args: { courseId: v.id("courses") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      productId: v.optional(v.id("products")),
      isPublished: v.optional(v.boolean()),
      courseStructure: v.optional(
        v.array(v.object({ lessonId: v.id("lessons") })),
      ),
    }),
  ),
  handler: async (ctx, args) => ctx.db.get(args.courseId),
});

export const getCourseStructure = query({
  args: { courseId: v.id("courses") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      productId: v.optional(v.id("products")),
      isPublished: v.optional(v.boolean()),
      courseStructure: v.optional(
        v.array(v.object({ lessonId: v.id("lessons") })),
      ),
      lessons: v.array(
        v.object({
          _id: v.id("lessons"),
          _creationTime: v.number(),
          title: v.string(),
          description: v.optional(v.string()),
          isPublished: v.optional(v.boolean()),
          topics: v.array(
            v.object({
              _id: v.id("topics"),
              _creationTime: v.number(),
              lessonId: v.optional(v.id("lessons")),
              title: v.string(),
              contentType: v.union(
                v.literal("text"),
                v.literal("video"),
                v.literal("quiz"),
              ),
              content: v.optional(v.string()),
              order: v.optional(v.number()),
              isPublished: v.optional(v.boolean()),
            }),
          ),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) return null;

    const orderedIds = (course.courseStructure ?? []).map((i) => i.lessonId);
    const lessonDocs = await Promise.all(
      orderedIds.map((id) => ctx.db.get(id)),
    );
    const validLessons = lessonDocs.filter(
      (l): l is NonNullable<typeof l> => l !== null,
    );
    const lessonsWithTopics = await Promise.all(
      validLessons.map(async (lesson) => {
        const topics = await ctx.db
          .query("topics")
          .withIndex("by_lessonId_order", (q) => q.eq("lessonId", lesson._id))
          .order("asc")
          .collect();
        return { ...lesson, topics };
      }),
    );

    const orderedLessons = orderedIds
      .map((id) => lessonsWithTopics.find((l) => l._id === id))
      .filter((l): l is NonNullable<typeof l> => l !== undefined);

    return { ...course, lessons: orderedLessons };
  },
});

export const getStructure = query({
  args: { courseId: v.id("courses") },
  returns: v.union(
    v.null(),
    v.object({
      course: v.object({
        _id: v.id("courses"),
        _creationTime: v.number(),
        title: v.string(),
        description: v.optional(v.string()),
        productId: v.optional(v.id("products")),
        isPublished: v.optional(v.boolean()),
      }),
      lessons: v.array(
        v.object({
          _id: v.id("lessons"),
          _creationTime: v.number(),
          title: v.string(),
          description: v.optional(v.string()),
        }),
      ),
      topics: v.array(
        v.object({
          _id: v.id("topics"),
          _creationTime: v.number(),
          title: v.string(),
          contentType: v.union(
            v.literal("text"),
            v.literal("video"),
            v.literal("quiz"),
          ),
        }),
      ),
      quizzes: v.array(
        v.object({
          _id: v.id("quizzes"),
          _creationTime: v.number(),
          title: v.string(),
        }),
      ),
      finalQuiz: v.optional(
        v.object({
          _id: v.id("quizzes"),
          _creationTime: v.number(),
          title: v.string(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    const lessonDocs = await ctx.db
      .query("lessons")
      .withIndex("by_course_order", (q) => q.eq("courseId", args.courseId))
      .collect();

    const lessons = lessonDocs.map((l) => ({
      _id: l._id,
      _creationTime: l._creationTime,
      title: l.title,
      description: l.description,
    }));

    const lessonIds = lessonDocs.map((l) => l._id);

    const topicDocs = await filter(
      ctx.db.query("topics").withIndex("by_lessonId_order"),
      (t) => lessonIds.includes(t.lessonId as Id<"lessons">),
    ).collect();

    const topics = topicDocs.map((t) => ({
      _id: t._id,
      _creationTime: t._creationTime,
      title: t.title,
      contentType: t.contentType,
    }));

    const topicIds = topicDocs.map((t) => t._id);

    const quizDocs = await filter(
      ctx.db.query("quizzes").withIndex("by_topicId"),
      (qz) => topicIds.includes(qz.topicId as Id<"topics">),
    ).collect();

    const quizzes = quizDocs.map((q) => ({
      _id: q._id,
      _creationTime: q._creationTime,
      title: q.title,
    }));

    const finalQuizDoc = course.finalQuizId
      ? await ctx.db.get(course.finalQuizId)
      : null;
    const finalQuiz = finalQuizDoc
      ? {
          _id: finalQuizDoc._id,
          _creationTime: finalQuizDoc._creationTime,
          title: finalQuizDoc.title,
        }
      : undefined;

    return {
      course: {
        _id: course._id,
        _creationTime: course._creationTime,
        title: course.title,
        description: course.description,
        productId: course.productId,
        isPublished: course.isPublished,
      },
      lessons,
      topics,
      quizzes,
      finalQuiz,
    };
  },
});
