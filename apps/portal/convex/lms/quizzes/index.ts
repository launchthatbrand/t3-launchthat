import { filter } from "convex-helpers/server/filter";
import { v } from "convex/values";

import type { Doc } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import { internalMutation, mutation, query } from "../../_generated/server";
import { requireAdmin } from "../../lib/permissions/requirePermission";

// --- Create Quiz Mutation ---
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

    console.log(`Created new quiz with ID: ${newQuizId}`);
    return newQuizId;
  },
});

// --- Get Available Quizzes Query ---
export const getAvailable = query({
  args: {
    topicId: v.id("topics"),
  },
  handler: async (ctx, args) => {
    // Get all quizzes that are not attached to this topic
    const quizzes = await filter(
      ctx.db.query("quizzes"),
      (quiz: Doc<"quizzes">) => quiz.topicId !== args.topicId,
    ).collect();
    return quizzes;
  },
});

// --- Update Quiz Title ---
export const updateTitle = mutation({
  args: {
    quizId: v.id("quizzes"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.quizId, { title: args.title });
  },
});

// --- Update Quiz Questions ---
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
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.quizId, { questions: args.questions });
  },
});

// --- Remove Quiz ---
export const remove = mutation({
  args: {
    quizId: v.id("quizzes"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.quizId);
  },
});

// --- Attach Quiz to Topic or Course ---
export const attach = mutation({
  args: {
    quizId: v.id("quizzes"),
    lessonId: v.optional(v.id("lessons")),
    topicId: v.optional(v.id("topics")),
    courseId: v.optional(v.id("courses")),
    order: v.number(),
    isFinal: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const patchData: Partial<Doc<"quizzes">> = {
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
  },
});

/**
 * Public mutation to remove a quiz from a lesson or topic.
 * It calls the internal detachFromLesson mutation.
 * Admin-only mutation.
 */
export const removeQuizFromLesson = mutation({
  args: {
    quizId: v.id("quizzes"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    // Call the internal mutation to detach the quiz
    await ctx.runMutation(internal.lms.quizzes.index.detachFromLesson, {
      quizId: args.quizId,
    });
    return null;
  },
});

/**
 * Detaches a quiz from a lesson or topic by setting its lessonId/topicId to undefined.
 * This does NOT delete the quiz itself. Internal mutation.
 */
export const detachFromLesson = internalMutation({
  args: {
    quizId: v.id("quizzes"),
  },
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
