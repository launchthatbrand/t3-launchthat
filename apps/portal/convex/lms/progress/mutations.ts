import { filter } from "convex-helpers/server/filter";
/**
 * Progress Mutations
 *
 * Contains all write operations for the progress tracking feature.
 */
import { v } from "convex/values";

import { Doc, Id } from "../../_generated/dataModel";
import { mutation, MutationCtx } from "../../_generated/server";
import { requireAdmin } from "../../lib/permissions/requirePermission";

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
