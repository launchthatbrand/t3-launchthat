import { defineTable } from "convex/server";
import { v } from "convex/values";

const quizQuestionTypeLiteral = v.union(
  v.literal("singleChoice"),
  v.literal("multipleChoice"),
  v.literal("shortText"),
  v.literal("longText"),
);

export const quizAttemptResponseValidator = v.object({
  questionId: v.id("posts"),
  questionType: quizQuestionTypeLiteral,
  selectedOptionIds: v.optional(v.array(v.string())),
  answerText: v.optional(v.string()),
  isCorrect: v.optional(v.boolean()),
});

export const courseProgressTable = defineTable({
  organizationId: v.optional(v.id("organizations")),
  userId: v.id("users"),
  courseId: v.id("posts"),
  completedLessonIds: v.array(v.id("posts")),
  completedTopicIds: v.array(v.id("posts")),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  updatedAt: v.number(),
  lastAccessedAt: v.optional(v.number()),
  lastAccessedId: v.optional(v.id("posts")),
  lastAccessedType: v.optional(
    v.union(v.literal("lesson"), v.literal("topic")),
  ),
})
  .index("by_user", ["userId"])
  .index("by_course", ["courseId"])
  .index("by_user_course", ["userId", "courseId"]);

export const quizAttemptsTable = defineTable({
  quizId: v.id("posts"),
  userId: v.id("users"),
  organizationId: v.optional(v.id("organizations")),
  courseId: v.optional(v.id("posts")),
  lessonId: v.optional(v.id("posts")),
  responses: v.array(quizAttemptResponseValidator),
  totalQuestions: v.number(),
  gradedQuestions: v.number(),
  correctCount: v.number(),
  scorePercent: v.number(),
  durationMs: v.optional(v.number()),
  completedAt: v.number(),
})
  .index("by_quiz", ["quizId"])
  .index("by_user", ["userId"])
  .index("by_quiz_user", ["quizId", "userId"]);

export const progressSchema = {
  courseProgress: courseProgressTable,
  quizAttempts: quizAttemptsTable,
};
