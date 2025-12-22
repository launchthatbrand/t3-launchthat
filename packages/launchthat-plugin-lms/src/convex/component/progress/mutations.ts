import { v } from "convex/values";

import { mutation } from "../_generated/server";

export const upsertCourseProgress = mutation({
  args: {
    userId: v.string(),
    courseId: v.string(),
    organizationId: v.optional(v.string()),
    completedLessonIds: v.optional(v.array(v.string())),
    completedTopicIds: v.optional(v.array(v.string())),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    lastAccessedAt: v.optional(v.number()),
    lastAccessedId: v.optional(v.string()),
    lastAccessedType: v.optional(
      v.union(v.literal("lesson"), v.literal("topic")),
    ),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("courseProgress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", args.userId).eq("courseId", args.courseId),
      )
      .unique();

    const now = Date.now();
    if (!existing) {
      const id = await ctx.db.insert("courseProgress", {
        organizationId: args.organizationId,
        userId: args.userId,
        courseId: args.courseId,
        completedLessonIds: args.completedLessonIds ?? [],
        completedTopicIds: args.completedTopicIds ?? [],
        startedAt: args.startedAt ?? now,
        completedAt: args.completedAt,
        updatedAt: now,
        lastAccessedAt: args.lastAccessedAt,
        lastAccessedId: args.lastAccessedId,
        lastAccessedType: args.lastAccessedType,
      });
      return await ctx.db.get(id);
    }

    await ctx.db.patch(existing._id, {
      organizationId: args.organizationId ?? existing.organizationId,
      completedLessonIds:
        args.completedLessonIds ?? existing.completedLessonIds,
      completedTopicIds: args.completedTopicIds ?? existing.completedTopicIds,
      startedAt: args.startedAt ?? existing.startedAt,
      completedAt: args.completedAt ?? existing.completedAt,
      updatedAt: now,
      lastAccessedAt: args.lastAccessedAt ?? existing.lastAccessedAt,
      lastAccessedId: args.lastAccessedId ?? existing.lastAccessedId,
      lastAccessedType: args.lastAccessedType ?? existing.lastAccessedType,
    });

    return await ctx.db.get(existing._id);
  },
});

export const insertQuizAttempt = mutation({
  args: {
    quizId: v.string(),
    userId: v.string(),
    organizationId: v.optional(v.string()),
    courseId: v.optional(v.string()),
    lessonId: v.optional(v.string()),
    responses: v.array(
      v.object({
        questionId: v.string(),
        questionType: v.union(
          v.literal("singleChoice"),
          v.literal("multipleChoice"),
          v.literal("shortText"),
          v.literal("longText"),
        ),
        selectedOptionIds: v.optional(v.array(v.string())),
        answerText: v.optional(v.string()),
        isCorrect: v.optional(v.boolean()),
      }),
    ),
    totalQuestions: v.number(),
    gradedQuestions: v.number(),
    correctCount: v.number(),
    scorePercent: v.number(),
    durationMs: v.optional(v.number()),
    completedAt: v.number(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("quizAttempts", {
      quizId: args.quizId,
      userId: args.userId,
      organizationId: args.organizationId,
      courseId: args.courseId,
      lessonId: args.lessonId,
      responses: args.responses,
      totalQuestions: args.totalQuestions,
      gradedQuestions: args.gradedQuestions,
      correctCount: args.correctCount,
      scorePercent: args.scorePercent,
      durationMs: args.durationMs,
      completedAt: args.completedAt,
    });
    return await ctx.db.get(id);
  },
});
