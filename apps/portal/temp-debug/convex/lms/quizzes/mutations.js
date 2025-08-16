/**
 * Quizzes Mutations
 *
 * Contains all write operations for the quizzes feature.
 */
import { v } from "convex/values";

import { internalMutation, mutation } from "../../_generated/server";
import { requireAdmin } from "../../lib/permissions/requirePermission";

/**
 * Create a new quiz
 */
export const create = mutation({
  args: {
    title: v.string(),
    content: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    questions: v.optional(
      v.array(
        v.object({
          type: v.union(
            v.literal("single-choice"),
            v.literal("multiple-choice"),
            v.literal("true-false"),
          ),
          questionText: v.string(),
          options: v.optional(v.array(v.string())),
          explanation: v.optional(v.string()),
          correctAnswer: v.union(v.string(), v.array(v.string()), v.boolean()),
        }),
      ),
    ),
  },
  returns: v.id("quizzes"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const newQuizId = await ctx.db.insert("quizzes", {
      title: args.title,
      content: args.content,
      isPublished: args.isPublished ?? false,
      topicId: undefined, // Explicitly unattached
      courseId: undefined, // Not a final quiz
      order: undefined, // Explicitly unattached
      questions: args.questions ?? [], // Use provided questions or empty array
    });

    return newQuizId;
  },
});
/**
 * Update quiz title
 */
export const updateTitle = mutation({
  args: {
    quizId: v.id("quizzes"),
    title: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.quizId, { title: args.title });
    return null;
  },
});
/**
 * Update quiz questions
 */
export const updateQuestions = mutation({
  args: {
    quizId: v.id("quizzes"),
    questions: v.array(
      v.object({
        type: v.union(
          v.literal("single-choice"),
          v.literal("multiple-choice"),
          v.literal("true-false"),
        ),
        questionText: v.string(),
        options: v.optional(v.array(v.string())),
        explanation: v.optional(v.string()),
        correctAnswer: v.union(v.string(), v.array(v.string()), v.boolean()),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.quizId, { questions: args.questions });
    return null;
  },
});
/**
 * Update quiz (comprehensive)
 */
export const update = mutation({
  args: {
    quizId: v.id("quizzes"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    questions: v.optional(
      v.array(
        v.object({
          type: v.union(
            v.literal("single-choice"),
            v.literal("multiple-choice"),
            v.literal("true-false"),
          ),
          questionText: v.string(),
          options: v.optional(v.array(v.string())),
          explanation: v.optional(v.string()),
          correctAnswer: v.union(v.string(), v.array(v.string()), v.boolean()),
        }),
      ),
    ),
    isPublished: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { quizId, ...patch } = args;
    await ctx.db.patch(quizId, patch);
    return null;
  },
});
/**
 * Remove/delete a quiz
 */
export const remove = mutation({
  args: {
    quizId: v.id("quizzes"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.quizId);
    return null;
  },
});
/**
 * Attach quiz to topic, lesson, or course
 */
export const attach = mutation({
  args: {
    quizId: v.id("quizzes"),
    lessonId: v.optional(v.id("lessons")),
    topicId: v.optional(v.id("topics")),
    courseId: v.optional(v.id("courses")),
    order: v.number(),
    isFinal: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const patchData = {
      order: args.order,
      isPublished: true,
    };
    if (args.isFinal) {
      if (!args.courseId) {
        throw new Error("Final quiz must be attached to a course");
      }
      patchData.courseId = args.courseId;
      patchData.lessonId = undefined;
      patchData.topicId = undefined;
    } else if (args.lessonId) {
      patchData.lessonId = args.lessonId;
      patchData.courseId = undefined;
      patchData.topicId = undefined;
    } else if (args.topicId) {
      patchData.topicId = args.topicId;
      patchData.courseId = undefined;
      patchData.lessonId = undefined;
    } else {
      throw new Error("Quiz must be attached to a course, lesson, or topic");
    }
    await ctx.db.patch(args.quizId, patchData);
    return null;
  },
});
/**
 * Remove quiz from lesson or topic (public mutation)
 */
export const removeQuizFromLesson = mutation({
  args: {
    quizId: v.id("quizzes"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    // Detach the quiz directly since we're in the same file now
    await ctx.db.patch(args.quizId, {
      lessonId: undefined,
      topicId: undefined,
      courseId: undefined,
      order: undefined,
    });
    return null;
  },
});
/**
 * Internal mutation to detach quiz from lesson/topic
 */
export const detachFromLesson = internalMutation({
  args: {
    quizId: v.id("quizzes"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.quizId, {
      lessonId: undefined,
      topicId: undefined,
      courseId: undefined,
      order: undefined,
    });
    return null;
  },
});
