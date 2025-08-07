import type { Doc, Id } from "../../_generated/dataModel";
import { mutation, query } from "../../_generated/server";

import type { MutationCtx } from "../../_generated/server";
import { filter } from "convex-helpers/server/filter";
import { requireAdmin } from "../../lib/permissions/requirePermission";
import { v } from "convex/values";

// ====== CORE PROGRESS TRACKING FUNCTIONS ======

/**
 * Mark a lesson, topic, or quiz as complete
 * This function handles both individual item progress and course-level metadata updates
 */
export const markItemComplete = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
    itemId: v.union(v.id("lessons"), v.id("topics"), v.id("quizzes")),
    itemType: v.union(
      v.literal("lesson"),
      v.literal("topic"),
      v.literal("quiz"),
    ),
    score: v.optional(v.number()),
    timeSpent: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Update or create individual item progress
    const existingProgress = await ctx.db
      .query("progress")
      .withIndex("by_user_item", (q) =>
        q.eq("userId", args.userId).eq("itemId", args.itemId),
      )
      .unique();

    if (existingProgress) {
      await ctx.db.patch(existingProgress._id, {
        completed: true,
        completedAt: now,
        score: args.score,
        attempts: (existingProgress.attempts ?? 0) + 1,
        timeSpent: args.timeSpent,
      });
    } else {
      await ctx.db.insert("progress", {
        userId: args.userId,
        courseId: args.courseId,
        itemId: args.itemId,
        itemType: args.itemType,
        completed: true,
        completedAt: now,
        startedAt: now,
        score: args.score,
        attempts: 1,
        timeSpent: args.timeSpent,
      });
    }

    // Update course-level progress metadata
    await updateCourseProgress(
      ctx,
      args.userId,
      args.courseId,
      args.itemId,
      args.itemType,
    );

    return null;
  },
});

/**
 * Start tracking progress for an item (when user first accesses it)
 */
export const startItem = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
    itemId: v.union(v.id("lessons"), v.id("topics"), v.id("quizzes")),
    itemType: v.union(
      v.literal("lesson"),
      v.literal("topic"),
      v.literal("quiz"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if progress already exists
    const existingProgress = await ctx.db
      .query("progress")
      .withIndex("by_user_item", (q) =>
        q.eq("userId", args.userId).eq("itemId", args.itemId),
      )
      .unique();

    if (!existingProgress) {
      // Create initial progress record
      await ctx.db.insert("progress", {
        userId: args.userId,
        courseId: args.courseId,
        itemId: args.itemId,
        itemType: args.itemType,
        completed: false,
        startedAt: now,
        attempts: 0,
      });
    }

    // Update course progress metadata to track last accessed
    await updateLastAccessed(
      ctx,
      args.userId,
      args.courseId,
      args.itemId,
      args.itemType,
    );

    return null;
  },
});

// ====== COURSE PROGRESS METADATA FUNCTIONS ======

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

// ====== HELPER FUNCTIONS ======

/**
 * Internal helper to update course-level progress metadata
 */
async function updateCourseProgress(
  ctx: MutationCtx,
  userId: Id<"users">,
  courseId: Id<"courses">,
  completedItemId: Id<"lessons"> | Id<"topics"> | Id<"quizzes">,
  completedItemType: "lesson" | "topic" | "quiz",
) {
  const now = Date.now();

  // Get existing course progress
  let courseProgress = await ctx.db
    .query("courseProgress")
    .withIndex("by_user_course", (q) =>
      q.eq("userId", userId).eq("courseId", courseId),
    )
    .unique();

  if (!courseProgress) {
    // Initialize course progress if it doesn't exist
    courseProgress = await initializeCourseProgress(ctx, userId, courseId);
  }

  // Update the progress based on item type
  const updatedLessons = { ...courseProgress.lessons };
  const updatedTopics = { ...courseProgress.topics };
  let updatedCompleted = courseProgress.completed;

  if (completedItemType === "lesson") {
    if (!updatedLessons.completed.includes(completedItemId as Id<"lessons">)) {
      updatedLessons.completed.push(completedItemId as Id<"lessons">);
      updatedCompleted++;
    }
  } else if (completedItemType === "topic") {
    // Find which lesson this topic belongs to
    const topic = await ctx.db.get(completedItemId);
    if (topic && "lessonId" in topic && topic.lessonId) {
      const lessonId = topic.lessonId;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!updatedTopics[lessonId] || !Array.isArray(updatedTopics[lessonId])) {
        updatedTopics[lessonId] = [];
      }
      if (!updatedTopics[lessonId].includes(completedItemId as Id<"topics">)) {
        updatedTopics[lessonId].push(completedItemId as Id<"topics">);
        updatedCompleted++;
      }
    }
  } else {
    // For quizzes, just increment completed count
    updatedCompleted++;
  }

  // Determine course status
  let status: "not_started" | "in_progress" | "completed" = "in_progress";
  if (updatedCompleted === 0) {
    status = "not_started";
  } else if (updatedCompleted >= courseProgress.total) {
    status = "completed";
  }

  // Update course progress
  await ctx.db.patch(courseProgress._id, {
    lessons: updatedLessons,
    topics: updatedTopics,
    completed: updatedCompleted,
    lastAccessedId: completedItemId,
    lastAccessedType: completedItemType,
    status,
    lastAccessedAt: now,
    completedAt: status === "completed" ? now : undefined,
  });
}

/**
 * Update last accessed item without marking as complete
 */
async function updateLastAccessed(
  ctx: MutationCtx,
  userId: Id<"users">,
  courseId: Id<"courses">,
  itemId: Id<"lessons"> | Id<"topics"> | Id<"quizzes">,
  itemType: "lesson" | "topic" | "quiz",
) {
  const now = Date.now();

  let courseProgress = await ctx.db
    .query("courseProgress")
    .withIndex("by_user_course", (q) =>
      q.eq("userId", userId).eq("courseId", courseId),
    )
    .unique();

  if (!courseProgress) {
    courseProgress = await initializeCourseProgress(ctx, userId, courseId);
  }

  await ctx.db.patch(courseProgress._id, {
    lastAccessedId: itemId,
    lastAccessedType: itemType,
    lastAccessedAt: now,
    startedAt: courseProgress.startedAt ?? now,
  });
}

/**
 * Initialize course progress metadata for a user
 */
async function initializeCourseProgress(
  ctx: MutationCtx,
  userId: Id<"users">,
  courseId: Id<"courses">,
): Promise<Doc<"courseProgress">> {
  const now = Date.now();

  // Get course structure to calculate totals
  const course = await ctx.db.get(courseId);
  if (!course) throw new Error("Course not found");

  // Get all lessons in the course
  const lessons = await ctx.db
    .query("lessons")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .collect();

  // Get all topics for these lessons
  const lessonIds = lessons.map((l) => l._id);
  const topics = await filter(ctx.db.query("topics"), (topic: Doc<"topics">) =>
    lessonIds.includes(topic.lessonId as Id<"lessons">),
  ).collect();

  // Get all quizzes for the course
  const quizzes = await ctx.db
    .query("quizzes")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .collect();

  const totalItems = lessons.length + topics.length + quizzes.length;

  const courseProgressId = await ctx.db.insert("courseProgress", {
    userId,
    courseId,
    lessons: {
      completed: [],
      total: lessons.length,
    },
    topics: {},
    completed: 0,
    total: totalItems,
    status: "not_started" as const,
    lastAccessedAt: now,
  });

  const newCourseProgress = await ctx.db.get(courseProgressId);
  if (!newCourseProgress) {
    throw new Error("Failed to create course progress record");
  }

  return newCourseProgress;
}

// ====== ADMIN FUNCTIONS ======

/**
 * Reset all progress for a user in a course
 */
export const resetUserCourseProgress = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Delete all individual progress records
    const progressRecords = await ctx.db
      .query("progress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId),
      )
      .collect();

    for (const record of progressRecords) {
      await ctx.db.delete(record._id);
    }

    // Delete course progress metadata
    const courseProgress = await ctx.db
      .query("courseProgress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId),
      )
      .unique();

    if (courseProgress) {
      await ctx.db.delete(courseProgress._id);
    }

    return null;
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

// ====== FRONTEND HELPER QUERIES ======

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
 * Start tracking time for an item (when user begins)
 */
export const startItemProgress = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
    itemId: v.union(v.id("lessons"), v.id("topics"), v.id("quizzes")),
    itemType: v.union(
      v.literal("lesson"),
      v.literal("topic"),
      v.literal("quiz"),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("progress")
      .withIndex("by_user_item", (q) =>
        q.eq("userId", args.userId).eq("itemId", args.itemId),
      )
      .filter((q) => q.eq(q.field("courseId"), args.courseId))
      .unique();

    if (existing) {
      // Update started time if not already set
      if (!existing.startedAt) {
        await ctx.db.patch(existing._id, {
          startedAt: Date.now(),
        });
      }
      return existing._id;
    } else {
      // Create new progress entry
      return await ctx.db.insert("progress", {
        userId: args.userId,
        courseId: args.courseId,
        itemId: args.itemId,
        itemType: args.itemType,
        completed: false,
        startedAt: Date.now(),
      });
    }
  },
});

// ====== BULK COMPLETION FUNCTIONS ======

/**
 * Complete an entire course - marks all lessons, topics, and quizzes as complete
 */
export const completeCourse = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get course structure
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    // Get all lessons for this course
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    // Get all topics for these lessons
    const allTopics = [];
    for (const lesson of lessons) {
      const topics = await ctx.db
        .query("topics")
        .withIndex("by_lessonId_order", (q) => q.eq("lessonId", lesson._id))
        .collect();
      allTopics.push(...topics);
    }

    // Get all quizzes for these topics
    const allQuizzes = [];
    for (const topic of allTopics) {
      const quizzes = await ctx.db
        .query("quizzes")
        .withIndex("by_topicId", (q) => q.eq("topicId", topic._id))
        .collect();
      allQuizzes.push(...quizzes);
    }

    // Mark all lessons as complete
    for (const lesson of lessons) {
      await markItemCompleteHelper(ctx, {
        userId: args.userId,
        courseId: args.courseId,
        itemId: lesson._id,
        itemType: "lesson",
      });
    }

    // Mark all topics as complete
    for (const topic of allTopics) {
      await markItemCompleteHelper(ctx, {
        userId: args.userId,
        courseId: args.courseId,
        itemId: topic._id,
        itemType: "topic",
      });
    }

    // Mark all quizzes as complete
    for (const quiz of allQuizzes) {
      await markItemCompleteHelper(ctx, {
        userId: args.userId,
        courseId: args.courseId,
        itemId: quiz._id,
        itemType: "quiz",
      });
    }

    // Mark final quiz as complete if it exists
    if (course.finalQuizId) {
      await markItemCompleteHelper(ctx, {
        userId: args.userId,
        courseId: args.courseId,
        itemId: course.finalQuizId,
        itemType: "quiz",
      });
    }

    return null;
  },
});

/**
 * Complete an entire lesson - marks the lesson and all its topics and quizzes as complete
 */
export const completeLesson = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
    lessonId: v.id("lessons"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get all topics for this lesson
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_lessonId_order", (q) => q.eq("lessonId", args.lessonId))
      .collect();

    // Get all quizzes for these topics
    const allQuizzes = [];
    for (const topic of topics) {
      const quizzes = await ctx.db
        .query("quizzes")
        .withIndex("by_topicId", (q) => q.eq("topicId", topic._id))
        .collect();
      allQuizzes.push(...quizzes);
    }

    // Mark the lesson as complete
    await markItemCompleteHelper(ctx, {
      userId: args.userId,
      courseId: args.courseId,
      itemId: args.lessonId,
      itemType: "lesson",
    });

    // Mark all topics as complete
    for (const topic of topics) {
      await markItemCompleteHelper(ctx, {
        userId: args.userId,
        courseId: args.courseId,
        itemId: topic._id,
        itemType: "topic",
      });
    }

    // Mark all quizzes as complete
    for (const quiz of allQuizzes) {
      await markItemCompleteHelper(ctx, {
        userId: args.userId,
        courseId: args.courseId,
        itemId: quiz._id,
        itemType: "quiz",
      });
    }

    return null;
  },
});

/**
 * Complete a single topic (and any associated quizzes)
 */
export const completeTopic = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
    topicId: v.id("topics"),
    timeSpent: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Mark the topic as complete
    await markItemCompleteHelper(ctx, {
      userId: args.userId,
      courseId: args.courseId,
      itemId: args.topicId,
      itemType: "topic",
      timeSpent: args.timeSpent,
    });

    // Get and mark any associated quizzes as complete
    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_topicId", (q) => q.eq("topicId", args.topicId))
      .collect();

    for (const quiz of quizzes) {
      await markItemCompleteHelper(ctx, {
        userId: args.userId,
        courseId: args.courseId,
        itemId: quiz._id,
        itemType: "quiz",
      });
    }

    return null;
  },
});

/**
 * Complete a single quiz
 */
export const completeQuiz = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
    quizId: v.id("quizzes"),
    score: v.optional(v.number()),
    timeSpent: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await markItemCompleteHelper(ctx, {
      userId: args.userId,
      courseId: args.courseId,
      itemId: args.quizId,
      itemType: "quiz",
      score: args.score,
      timeSpent: args.timeSpent,
    });

    return null;
  },
});

// Helper function to call markItemComplete with proper context
async function markItemCompleteHelper(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    courseId: Id<"courses">;
    itemId: Id<"lessons"> | Id<"topics"> | Id<"quizzes">;
    itemType: "lesson" | "topic" | "quiz";
    score?: number;
    timeSpent?: number;
  },
) {
  const now = Date.now();

  // Update or create individual item progress
  const existingProgress = await ctx.db
    .query("progress")
    .withIndex("by_user_item", (q) =>
      q.eq("userId", args.userId).eq("itemId", args.itemId),
    )
    .unique();

  if (existingProgress) {
    await ctx.db.patch(existingProgress._id, {
      completed: true,
      completedAt: now,
      score: args.score,
      attempts: (existingProgress.attempts ?? 0) + 1,
      timeSpent: args.timeSpent,
    });
  } else {
    await ctx.db.insert("progress", {
      userId: args.userId,
      courseId: args.courseId,
      itemId: args.itemId,
      itemType: args.itemType,
      completed: true,
      completedAt: now,
      startedAt: now,
      score: args.score,
      attempts: 1,
      timeSpent: args.timeSpent,
    });
  }

  // Update course-level progress metadata
  await updateCourseProgress(
    ctx,
    args.userId,
    args.courseId,
    args.itemId,
    args.itemType,
  );
}

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
