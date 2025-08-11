/**
 * Progress Queries
 *
 * Contains all read operations for the progress tracking feature.
 */
import { filter } from "convex-helpers/server/filter";
import { v } from "convex/values";

import { Doc } from "../../_generated/dataModel";
import { query } from "../../_generated/server";
import { requireAdmin } from "../../lib/permissions/requirePermission";

/**
 * Get comprehensive course progress (similar to LearnDash _sfwd-course_progress)
 */
export const getCourseProgress = query({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
  },
  returns: v.union(
    v.null(),
    v.object({
      lessons: v.object({
        completed: v.array(v.id("lessons")),
        total: v.number(),
      }),
      topics: v.record(v.id("lessons"), v.array(v.id("topics"))),
      completed: v.number(),
      total: v.number(),
      lastAccessedId: v.optional(
        v.union(v.id("lessons"), v.id("topics"), v.id("quizzes")),
      ),
      lastAccessedType: v.optional(
        v.union(v.literal("lesson"), v.literal("topic"), v.literal("quiz")),
      ),
      status: v.union(
        v.literal("not_started"),
        v.literal("in_progress"),
        v.literal("completed"),
      ),
      percentComplete: v.number(),
      startedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      lastAccessedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const courseProgress = await ctx.db
      .query("courseProgress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId),
      )
      .unique();

    if (!courseProgress) {
      return null;
    }

    const percentComplete =
      courseProgress.total > 0
        ? Math.round((courseProgress.completed / courseProgress.total) * 100)
        : 0;

    return {
      ...courseProgress,
      percentComplete,
    };
  },
});

/**
 * Check if a specific item is completed
 */
export const isItemCompleted = query({
  args: {
    userId: v.id("users"),
    itemId: v.union(v.id("lessons"), v.id("topics"), v.id("quizzes")),
    courseId: v.optional(v.id("courses")), // Make courseId optional for filtering
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    let queryBuilder = ctx.db
      .query("progress")
      .withIndex("by_user_item", (q) =>
        q.eq("userId", args.userId).eq("itemId", args.itemId),
      );

    // Filter by courseId if provided
    if (args.courseId) {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field("courseId"), args.courseId),
      );
    }

    const progress = await queryBuilder.unique();
    return progress?.completed ?? false;
  },
});

/**
 * Check if a lesson is completed (all its topics must be completed)
 */
export const isLessonCompleted = query({
  args: {
    userId: v.id("users"),
    lessonId: v.id("lessons"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get all topics for this lesson
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_lessonId_order", (q) => q.eq("lessonId", args.lessonId))
      .collect();

    if (topics.length === 0) {
      // If no topics, check if lesson itself is marked complete
      return await ctx.db
        .query("progress")
        .withIndex("by_user_item", (q) =>
          q.eq("userId", args.userId).eq("itemId", args.lessonId),
        )
        .unique()
        .then((progress) => progress?.completed ?? false);
    }

    // Check if all topics are completed
    for (const topic of topics) {
      const progress = await ctx.db
        .query("progress")
        .withIndex("by_user_item", (q) =>
          q.eq("userId", args.userId).eq("itemId", topic._id),
        )
        .unique();

      if (!progress?.completed) {
        return false;
      }
    }

    return true;
  },
});

/**
 * Get detailed progress for a specific course with completion status for all items
 */
export const getDetailedCourseProgress = query({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
  },
  returns: v.object({
    courseProgress: v.union(
      v.null(),
      v.object({
        lessons: v.object({
          completed: v.array(v.id("lessons")),
          total: v.number(),
        }),
        topics: v.record(v.id("lessons"), v.array(v.id("topics"))),
        completed: v.number(),
        total: v.number(),
        lastAccessedId: v.optional(
          v.union(v.id("lessons"), v.id("topics"), v.id("quizzes")),
        ),
        lastAccessedType: v.optional(
          v.union(v.literal("lesson"), v.literal("topic"), v.literal("quiz")),
        ),
        status: v.union(
          v.literal("not_started"),
          v.literal("in_progress"),
          v.literal("completed"),
        ),
        percentComplete: v.number(),
        startedAt: v.optional(v.number()),
        completedAt: v.optional(v.number()),
        lastAccessedAt: v.number(),
      }),
    ),
    itemProgress: v.array(
      v.object({
        _id: v.id("progress"),
        itemId: v.union(v.id("lessons"), v.id("topics"), v.id("quizzes")),
        itemType: v.union(
          v.literal("lesson"),
          v.literal("topic"),
          v.literal("quiz"),
        ),
        completed: v.boolean(),
        completedAt: v.optional(v.number()),
        startedAt: v.optional(v.number()),
        score: v.optional(v.number()),
        attempts: v.optional(v.number()),
        timeSpent: v.optional(v.number()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    // Get course-level progress
    const courseProgress = await ctx.db
      .query("courseProgress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId),
      )
      .unique();

    // Get all individual item progress records
    const itemProgress = await ctx.db
      .query("progress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId),
      )
      .collect();

    const formattedCourseProgress = courseProgress
      ? {
          ...courseProgress,
          percentComplete:
            courseProgress.total > 0
              ? Math.round(
                  (courseProgress.completed / courseProgress.total) * 100,
                )
              : 0,
        }
      : null;

    return {
      courseProgress: formattedCourseProgress,
      itemProgress: itemProgress.map((p) => ({
        _id: p._id,
        itemId: p.itemId,
        itemType: p.itemType,
        completed: p.completed,
        completedAt: p.completedAt,
        startedAt: p.startedAt,
        score: p.score,
        attempts: p.attempts,
        timeSpent: p.timeSpent,
      })),
    };
  },
});

/**
 * Get progress summary for all users in a course (admin only)
 */
export const getCourseProgressSummary = query({
  args: {
    courseId: v.id("courses"),
  },
  returns: v.array(
    v.object({
      userId: v.id("users"),
      userName: v.optional(v.string()),
      userEmail: v.optional(v.string()),
      percentComplete: v.number(),
      status: v.union(
        v.literal("not_started"),
        v.literal("in_progress"),
        v.literal("completed"),
      ),
      lastAccessedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const courseProgressRecords = await ctx.db
      .query("courseProgress")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    const result = [];
    for (const progress of courseProgressRecords) {
      const user = await ctx.db.get(progress.userId);
      const percentComplete =
        progress.total > 0
          ? Math.round((progress.completed / progress.total) * 100)
          : 0;

      result.push({
        userId: progress.userId,
        userName: user?.name,
        userEmail: user?.email,
        percentComplete,
        status: progress.status,
        lastAccessedAt: progress.lastAccessedAt,
        completedAt: progress.completedAt,
      });
    }

    return result;
  },
});

/**
 * Get course progress metadata for a user (LearnDash-style)
 */
export const getCourseProgressMeta = query({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const courseProgress = await ctx.db
      .query("courseProgress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId),
      )
      .unique();

    if (!courseProgress) {
      return null;
    }

    return {
      lessons: courseProgress.lessons,
      topics: courseProgress.topics,
      completed: courseProgress.completed,
      total: courseProgress.total,
      lastId: courseProgress.lastAccessedId,
      status: courseProgress.status,
      percentComplete:
        courseProgress.total > 0
          ? Math.round((courseProgress.completed / courseProgress.total) * 100)
          : 0,
    };
  },
});

/**
 * Get all completed items for a user in a course
 */
export const getCompletedItems = query({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const completedItems = await ctx.db
      .query("progress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId),
      )
      .filter((q) => q.eq(q.field("completed"), true))
      .collect();

    return completedItems.map((item) => ({
      itemId: item.itemId,
      itemType: item.itemType,
      completedAt: item.completedAt,
      score: item.score,
    }));
  },
});

/**
 * Get lesson progress with all topics completion status
 */
export const getLessonProgress = query({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
    lessonId: v.id("lessons"),
  },
  returns: v.object({
    lessonId: v.id("lessons"),
    lessonCompleted: v.boolean(),
    lessonCompletedAt: v.optional(v.number()),
    topics: v.array(
      v.object({
        topicId: v.id("topics"),
        title: v.string(),
        completed: v.boolean(),
        completedAt: v.optional(v.number()),
      }),
    ),
    topicsCompleted: v.number(),
    totalTopics: v.number(),
    percentComplete: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get lesson completion status
    const lessonProgress = await ctx.db
      .query("progress")
      .withIndex("by_user_item", (q) =>
        q.eq("userId", args.userId).eq("itemId", args.lessonId),
      )
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .unique();

    // Get all topics for this lesson
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_lessonId_order", (q) => q.eq("lessonId", args.lessonId))
      .collect();

    // Get completion status for all topics
    const topicProgress = await Promise.all(
      topics.map(async (topic) => {
        const progress = await ctx.db
          .query("progress")
          .withIndex("by_user_item", (q) =>
            q.eq("userId", args.userId).eq("itemId", topic._id),
          )
          .filter((q) => q.eq(q.field("courseId"), args.courseId))
          .unique();

        return {
          topicId: topic._id,
          title: topic.title,
          completed: progress?.completed ?? false,
          completedAt: progress?.completedAt,
        };
      }),
    );

    const completedTopics = topicProgress.filter((t) => t.completed).length;
    const totalTopics = topics.length;

    return {
      lessonId: args.lessonId,
      lessonCompleted: lessonProgress?.completed ?? false,
      lessonCompletedAt: lessonProgress?.completedAt,
      topics: topicProgress,
      topicsCompleted: completedTopics,
      totalTopics,
      percentComplete:
        totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
    };
  },
});

/**
 * Get detailed course progress broken down by lessons
 * This supports segmented progress bars where each lesson has its own progress segment
 */
export const getCourseProgressByLessons = query({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
  },
  returns: v.object({
    courseId: v.id("courses"),
    totalProgress: v.number(), // Overall course completion percentage
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed"),
    ),
    lessons: v.array(
      v.object({
        lessonId: v.id("lessons"),
        title: v.string(),
        order: v.number(), // For proper sequencing
        isLinear: v.optional(v.boolean()), // Whether this lesson must be completed before next
        progress: v.object({
          percentage: v.number(), // 0-100 for this lesson
          topicsCompleted: v.number(),
          totalTopics: v.number(),
          lessonsCompleted: v.boolean(),
          status: v.union(
            v.literal("not_started"),
            v.literal("in_progress"),
            v.literal("completed"),
            v.literal("locked"), // For linear courses
          ),
        }),
        completedTopics: v.array(v.id("topics")),
        totalTopics: v.array(v.id("topics")),
      }),
    ),
    overallStats: v.object({
      totalLessons: v.number(),
      completedLessons: v.number(),
      totalTopics: v.number(),
      completedTopics: v.number(),
      totalQuizzes: v.number(),
      completedQuizzes: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    // Get course structure
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    // Get lessons in order based on course structure
    const lessons = [];
    if (course.courseStructure) {
      for (const structureItem of course.courseStructure) {
        const lesson = await ctx.db.get(structureItem.lessonId);
        if (lesson) {
          lessons.push(lesson);
        }
      }
    } else {
      // Fallback to all lessons for this course
      const courseLessons = await ctx.db
        .query("lessons")
        .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
        .collect();
      lessons.push(...courseLessons);
    }

    // Track overall stats
    let totalTopicsCount = 0;
    let totalQuizzesCount = 0;
    let completedLessonsCount = 0;
    let completedTopicsCount = 0;
    let completedQuizzesCount = 0;

    // Build lesson progress data
    const lessonProgressData = [];

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];

      // Get all topics for this lesson
      const topics = await ctx.db
        .query("topics")
        .withIndex("by_lessonId_order", (q) => q.eq("lessonId", lesson._id))
        .collect();

      // Get all quizzes for this lesson
      const quizzes = await ctx.db
        .query("quizzes")
        .withIndex("by_lessonId", (q) => q.eq("lessonId", lesson._id))
        .collect();

      totalTopicsCount += topics.length;
      totalQuizzesCount += quizzes.length;

      // Get completed items for this lesson
      const topicIds = topics.map((t) => t._id);
      const quizIds = quizzes.map((q) => q._id);
      const allLessonItemIds = [lesson._id, ...topicIds, ...quizIds];

      const completedItems = await ctx.db
        .query("progress")
        .withIndex("by_user_course", (q) =>
          q.eq("userId", args.userId).eq("courseId", args.courseId),
        )
        .filter((q) => q.eq(q.field("completed"), true))
        .collect();

      const completedItemIds = new Set(
        completedItems.map((item) => item.itemId.toString()),
      );

      // Check lesson completion
      const lessonCompleted = completedItemIds.has(lesson._id.toString());

      // Check topic completion
      const completedTopicsInLesson = topicIds.filter((id) =>
        completedItemIds.has(id.toString()),
      );
      completedTopicsCount += completedTopicsInLesson.length;

      // Check quiz completion
      const completedQuizzesInLesson = quizIds.filter((id) =>
        completedItemIds.has(id.toString()),
      );
      completedQuizzesCount += completedQuizzesInLesson.length;

      // Count lesson as complete if all its content is done OR if explicitly marked complete
      const allTopicsCompleteForStats =
        completedTopicsInLesson.length === topics.length;
      const allQuizzesCompleteForStats =
        completedQuizzesInLesson.length === quizzes.length;
      const lessonEffectivelyComplete =
        // Auto-complete if lesson has content and all content is done
        ((topics.length > 0 || quizzes.length > 0) &&
          allTopicsCompleteForStats &&
          allQuizzesCompleteForStats) ||
        // Or if lesson has no content but is explicitly marked complete
        (topics.length === 0 && quizzes.length === 0 && lessonCompleted);

      if (lessonEffectivelyComplete) completedLessonsCount++;

      // Calculate lesson progress percentage
      // A lesson is considered complete when all its topics and quizzes are complete
      const allTopicsComplete =
        completedTopicsInLesson.length === topics.length;
      const allQuizzesComplete =
        completedQuizzesInLesson.length === quizzes.length;
      const lessonAutoComplete =
        (topics.length > 0 || quizzes.length > 0) &&
        allTopicsComplete &&
        allQuizzesComplete;

      // If lesson has no topics or quizzes, rely on explicit lesson completion
      const effectiveLessonCompleted =
        lessonAutoComplete ||
        (topics.length === 0 && quizzes.length === 0 && lessonCompleted);

      // For display purposes, calculate based on topic/quiz completion only
      const totalContentItems = topics.length + quizzes.length;
      const completedContentItems =
        completedTopicsInLesson.length + completedQuizzesInLesson.length;

      const lessonPercentage =
        totalContentItems > 0
          ? Math.round((completedContentItems / totalContentItems) * 100)
          : effectiveLessonCompleted
            ? 100
            : 0;

      // Determine lesson status
      let lessonStatus: "not_started" | "in_progress" | "completed" | "locked" =
        "not_started";

      if (effectiveLessonCompleted) {
        lessonStatus = "completed";
      } else if (completedContentItems > 0) {
        lessonStatus = "in_progress";
      } else {
        // Check if lesson is locked (for linear courses)
        // A lesson is locked if the previous lesson isn't complete and this isn't the first lesson
        if (i > 0) {
          const previousLesson = lessonProgressData[i - 1];
          if (
            previousLesson &&
            previousLesson.progress.status !== "completed"
          ) {
            lessonStatus = "locked";
          }
        }
      }

      lessonProgressData.push({
        lessonId: lesson._id,
        title: lesson.title,
        order: i + 1,
        isLinear: true, // For now, assume all lessons are linear. This could be a lesson property
        progress: {
          percentage: lessonPercentage,
          topicsCompleted: completedTopicsInLesson.length,
          totalTopics: topics.length,
          lessonsCompleted: effectiveLessonCompleted,
          status: lessonStatus,
        },
        completedTopics: completedTopicsInLesson,
        totalTopics: topicIds,
      });
    }

    // Calculate overall progress
    const totalItems = lessons.length + totalTopicsCount + totalQuizzesCount;
    const completedItems =
      completedLessonsCount + completedTopicsCount + completedQuizzesCount;
    const totalProgress =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Determine overall status
    let overallStatus: "not_started" | "in_progress" | "completed" =
      "not_started";
    if (totalProgress === 100) {
      overallStatus = "completed";
    } else if (completedItems > 0) {
      overallStatus = "in_progress";
    }

    return {
      courseId: args.courseId,
      totalProgress,
      status: overallStatus,
      lessons: lessonProgressData,
      overallStats: {
        totalLessons: lessons.length,
        completedLessons: completedLessonsCount,
        totalTopics: totalTopicsCount,
        completedTopics: completedTopicsCount,
        totalQuizzes: totalQuizzesCount,
        completedQuizzes: completedQuizzesCount,
      },
    };
  },
});
