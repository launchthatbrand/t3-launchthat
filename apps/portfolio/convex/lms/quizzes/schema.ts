import { defineTable } from "convex/server";
import { v } from "convex/values";

export const quizQuestionValidator = v.object({
  questionText: v.string(),
  explanation: v.optional(v.string()),
  options: v.optional(v.array(v.string())),
  correctAnswer: v.union(v.string(), v.array(v.string()), v.boolean()),
  type: v.union(
    v.literal("single-choice"),
    v.literal("multiple-choice"),
    v.literal("boolean"),
  ),
});

export const quizzesTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy
  title: v.string(),
  description: v.optional(v.string()),
  questions: v.optional(v.array(quizQuestionValidator)), // Quiz questions structure
  order: v.optional(v.number()),
  lessonId: v.optional(v.id("lessons")), // Link to lesson
  topicId: v.optional(v.id("topics")), // Legacy: Link to topic (if needed)
  courseId: v.optional(v.id("courses")), // Link to course for final quizzes
  isPublished: v.optional(v.boolean()),
})
  .index("by_lesson", ["lessonId"]) // Used by progress queries
  .index("by_topic", ["topicId"])
  .index("by_course", ["courseId"])
  .index("by_organization", ["organizationId"]);

export const quizSchema = {
  quizzes: quizzesTable,
};
