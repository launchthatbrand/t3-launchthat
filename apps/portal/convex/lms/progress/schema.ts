import { defineTable } from "convex/server";
import { v } from "convex/values";

// --- Progress Tracking Table ---
export const progressTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy
  userId: v.id("users"),
  courseId: v.optional(v.id("courses")),
  lessonId: v.optional(v.id("lessons")),
  topicId: v.optional(v.id("topics")),
  quizId: v.optional(v.id("quizzes")),
  // Legacy fields for backward compatibility
  itemId: v.optional(v.string()), // Generic item ID
  itemType: v.optional(v.string()), // Generic item type
  startedAt: v.optional(v.number()), // When item was started
  completed: v.boolean(),
  completedAt: v.optional(v.number()), // Timestamp
  score: v.optional(v.number()), // For quizzes
  timeSpent: v.optional(v.number()), // Time spent in seconds
  attempts: v.optional(v.number()), // Number of attempts (for quizzes)
})
  .index("by_user", ["userId"])
  .index("by_user_course", ["userId", "courseId"])
  .index("by_user_lesson", ["userId", "lessonId"])
  .index("by_user_topic", ["userId", "topicId"])
  .index("by_user_quiz", ["userId", "quizId"])
  .index("by_user_item", ["userId", "itemId"]) // For generic item tracking
  .index("by_organization", ["organizationId"]);

// --- Course Progress Table (high-level tracking) ---
export const courseProgressTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy
  userId: v.id("users"),
  courseId: v.id("courses"),
  lessons: v.object({
    completed: v.array(v.id("lessons")),
    total: v.number(),
  }),
  topics: v.record(v.id("lessons"), v.array(v.id("topics"))), // Map of lesson ID to completed topic IDs
  completed: v.number(), // Total completed items
  total: v.number(), // Total items in course
  status: v.union(
    v.literal("not_started"),
    v.literal("in_progress"),
    v.literal("completed"),
  ),
  lastAccessedAt: v.number(),
  lastAccessedId: v.optional(v.string()), // ID of last accessed item
  lastAccessedType: v.optional(v.string()), // Type of last accessed item
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_user_course", ["userId", "courseId"])
  .index("by_course", ["courseId"])
  .index("by_organization", ["organizationId"]);

// --- Lesson Progress Table (detailed tracking) ---
export const lessonProgressTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy
  userId: v.id("users"),
  lessonId: v.id("lessons"),
  courseId: v.optional(v.id("courses")),
  startedAt: v.optional(v.number()), // When user first started
  lastAccessedAt: v.optional(v.number()), // Last time user accessed
  completedAt: v.optional(v.number()), // When marked complete
  timeSpent: v.optional(v.number()), // Total time spent in seconds
  completed: v.boolean(),
  progress: v.optional(v.number()), // Percentage complete (0-100)
})
  .index("by_user", ["userId"])
  .index("by_lesson", ["lessonId"])
  .index("by_user_lesson", ["userId", "lessonId"])
  .index("by_user_course", ["userId", "courseId"])
  .index("by_organization", ["organizationId"]);

// --- Quiz Responses Table ---
export const quizResponsesTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy
  userId: v.id("users"),
  quizId: v.id("quizzes"),
  courseId: v.optional(v.id("courses")),
  lessonId: v.optional(v.id("lessons")),
  responses: v.array(v.any()), // User's answers
  score: v.optional(v.number()),
  maxScore: v.optional(v.number()),
  passed: v.optional(v.boolean()),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  timeSpent: v.optional(v.number()), // In seconds
  attempt: v.number(), // Attempt number
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
