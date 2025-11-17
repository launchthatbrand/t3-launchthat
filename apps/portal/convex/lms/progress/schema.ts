import { defineTable } from "convex/server";
import { v } from "convex/values";

export const progressTable = defineTable({
  organizationId: v.optional(v.id("organizations")),
  userId: v.id("users"),
  courseId: v.optional(v.id("courses")),
  lessonId: v.optional(v.id("lessons")),
  topicId: v.optional(v.id("topics")),
  quizId: v.optional(v.id("quizzes")),
  itemId: v.optional(v.string()),
  itemType: v.optional(v.string()),
  startedAt: v.optional(v.number()),
  completed: v.boolean(),
  completedAt: v.optional(v.number()),
  score: v.optional(v.number()),
  timeSpent: v.optional(v.number()),
  attempts: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_user_course", ["userId", "courseId"])
  .index("by_user_lesson", ["userId", "lessonId"])
  .index("by_user_topic", ["userId", "topicId"])
  .index("by_user_quiz", ["userId", "quizId"])
  .index("by_user_item", ["userId", "itemId"])
  .index("by_organization", ["organizationId"]);

export const courseProgressTable = defineTable({
  organizationId: v.optional(v.id("organizations")),
  userId: v.id("users"),
  courseId: v.id("courses"),
  lessons: v.object({
    completed: v.array(v.id("lessons")),
    total: v.number(),
  }),
  topics: v.record(v.id("lessons"), v.array(v.id("topics"))),
  completed: v.number(),
  total: v.number(),
  status: v.union(
    v.literal("not_started"),
    v.literal("in_progress"),
    v.literal("completed"),
  ),
  lastAccessedAt: v.number(),
  lastAccessedId: v.optional(v.string()),
  lastAccessedType: v.optional(v.string()),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_user_course", ["userId", "courseId"])
  .index("by_course", ["courseId"])
  .index("by_organization", ["organizationId"]);

export const lessonProgressTable = defineTable({
  organizationId: v.optional(v.id("organizations")),
  userId: v.id("users"),
  lessonId: v.id("lessons"),
  courseId: v.optional(v.id("courses")),
  startedAt: v.optional(v.number()),
  lastAccessedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  timeSpent: v.optional(v.number()),
  completed: v.boolean(),
  progress: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_lesson", ["lessonId"])
  .index("by_user_lesson", ["userId", "lessonId"])
  .index("by_user_course", ["userId", "courseId"])
  .index("by_organization", ["organizationId"]);

export const quizResponsesTable = defineTable({
  organizationId: v.optional(v.id("organizations")),
  userId: v.id("users"),
  quizId: v.id("quizzes"),
  courseId: v.optional(v.id("courses")),
  lessonId: v.optional(v.id("lessons")),
  responses: v.array(v.any()),
  score: v.optional(v.number()),
  maxScore: v.optional(v.number()),
  passed: v.optional(v.boolean()),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  timeSpent: v.optional(v.number()),
  attempt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_quiz", ["quizId"])
  .index("by_user_quiz", ["userId", "quizId"])
  .index("by_user_course", ["userId", "courseId"])
  .index("by_organization", ["organizationId"]);

export const lmsProgressSchema = {
  progress: progressTable,
  courseProgress: courseProgressTable,
  lessonProgress: lessonProgressTable,
  quizResponses: quizResponsesTable,
};
