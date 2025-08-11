/**
 * Quizzes Queries
 *
 * Contains all read operations for the quizzes feature.
 */
import { filter } from "convex-helpers/server/filter";
import { v } from "convex/values";

import type { Doc } from "../../_generated/dataModel";
import { query } from "../../_generated/server";

/**
 * Get available quizzes not attached to a specific topic
 */
export const getAvailable = query({
  args: {
    topicId: v.id("topics"),
  },
  returns: v.array(
    v.object({
      _id: v.id("quizzes"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      content: v.optional(v.string()),
      isPublished: v.optional(v.boolean()),
      lessonId: v.optional(v.id("lessons")),
      topicId: v.optional(v.id("topics")),
      courseId: v.optional(v.id("courses")),
      order: v.optional(v.number()),
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
            correctAnswer: v.union(
              v.string(),
              v.array(v.string()),
              v.boolean(),
            ),
          }),
        ),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    // Get all quizzes that are not attached to this topic
    const quizzes = await filter(
      ctx.db.query("quizzes"),
      (quiz: Doc<"quizzes">) => quiz.topicId !== args.topicId,
    ).collect();
    return quizzes;
  },
});

/**
 * List all quizzes with optional search filtering
 */
export const listQuizzes = query({
  args: {
    searchTitle: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("quizzes"),
      title: v.string(),
      isPublished: v.optional(v.boolean()),
    }),
  ),
  handler: async (ctx, args) => {
    // Fetch quizzes (consider adding pagination in future)
    const allQuizzes = await ctx.db.query("quizzes").collect();

    const filtered = args.searchTitle
      ? allQuizzes.filter((q) =>
          q.title.toLowerCase().includes(args.searchTitle!.toLowerCase()),
        )
      : allQuizzes;

    return filtered.map(({ _id, title, isPublished }) => ({
      _id,
      title,
      isPublished,
    }));
  },
});

/**
 * Get a single quiz by ID
 */
export const getQuiz = query({
  args: { quizId: v.id("quizzes") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("quizzes"),
      _creationTime: v.number(),
      title: v.string(),
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
            correctAnswer: v.union(
              v.string(),
              v.array(v.string()),
              v.boolean(),
            ),
          }),
        ),
      ),
      isPublished: v.optional(v.boolean()),
    }),
  ),
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) return null;
    return {
      _id: quiz._id,
      _creationTime: quiz._creationTime,
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions,
      isPublished: quiz.isPublished,
    };
  },
});

/**
 * Get quizzes by lesson ID
 */
export const getQuizzesByLesson = query({
  args: { lessonId: v.id("lessons") },
  returns: v.array(
    v.object({
      _id: v.id("quizzes"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      order: v.optional(v.number()),
      isPublished: v.optional(v.boolean()),
      lessonId: v.optional(v.id("lessons")),
      topicId: v.optional(v.id("topics")),
    }),
  ),
  handler: async (ctx, args) => {
    // Get quizzes directly attached to the lesson
    const lessonQuizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_lessonId", (q) => q.eq("lessonId", args.lessonId))
      .collect();

    return lessonQuizzes.map((quiz) => ({
      _id: quiz._id,
      _creationTime: quiz._creationTime,
      title: quiz.title,
      description: quiz.description,
      order: quiz.order,
      isPublished: quiz.isPublished,
      lessonId: quiz.lessonId,
      topicId: quiz.topicId,
    }));
  },
});
