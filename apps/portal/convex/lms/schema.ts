// Import contentAccess schema tables

/**
 * LMS Schema Definitions
 *
 * Contains all table definitions for the LMS (Learning Management System) feature.
 * This includes courses, lessons, topics, quizzes, enrollments, progress tracking, and content access control.
 */
import { defineTable } from "convex/server";
import { v } from "convex/values";

// import {
//   contentAccessLogTable,
//   contentAccessRulesTable,
// } from "./contentAccess/schema";

// --- Courses Table ---
export const coursesTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy
  title: v.string(),
  description: v.optional(v.string()),
  productId: v.optional(v.id("products")), // Link to ecommerce product
  isPublished: v.optional(v.boolean()),
  // For display ordering in admin lists
  menuOrder: v.optional(v.number()),
  courseStructure: v.optional(
    v.array(v.object({ lessonId: v.id("lessons") })), // Store ordered lesson IDs
  ),
  finalQuizId: v.optional(v.id("quizzes")), // Added field for final quiz
  tagIds: v.optional(v.array(v.id("tags"))), // New field for global tags
  // Add other course metadata as needed
})
  .index("by_organization", ["organizationId"])
  .index("by_organization_published", ["organizationId", "isPublished"])
  .index("by_productId", ["productId"]) // Added to support querying courses by productId
  // Add a search index on the title field
  .searchIndex("search_title", {
    searchField: "title",
    filterFields: ["organizationId", "isPublished"],
  });

// --- Lessons Table ---
export const lessonsTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy
  title: v.string(),
  description: v.optional(v.string()),
  wp_id: v.optional(v.float64()),
  content: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  categories: v.optional(v.array(v.string())),
  tagIds: v.optional(v.array(v.id("tags"))),
  featuredImage: v.optional(v.string()),
  featuredMedia: v.optional(
    v.union(
      v.object({
        type: v.literal("convex"),
        mediaItemId: v.id("mediaItems"),
      }),
      v.object({
        type: v.literal("vimeo"),
        vimeoId: v.string(),
        vimeoUrl: v.string(),
      }),
      v.string(),
    ),
  ),
  isPublished: v.optional(v.boolean()),
  menuOrder: v.optional(v.number()),
  courseId: v.optional(v.id("courses")),
})
  .index("by_course", ["courseId"])
  .index("by_organization", ["organizationId"])
  .searchIndex("search_content", {
    searchField: "content",
    filterFields: ["organizationId", "courseId", "isPublished"],
  });

// --- Topics Table ---
export const topicsTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy
  lessonId: v.optional(v.id("lessons")),
  title: v.string(),
  description: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  categories: v.optional(v.array(v.string())),
  tagIds: v.optional(v.array(v.id("tags"))),
  wp_id: v.optional(v.float64()),
  featuredImage: v.optional(v.string()),
  featuredMedia: v.optional(
    v.union(
      v.object({
        type: v.literal("convex"),
        mediaItemId: v.id("mediaItems"),
      }),
      v.object({
        type: v.literal("vimeo"),
        vimeoId: v.string(),
        vimeoUrl: v.string(),
      }),
      v.string(),
    ),
  ),
  contentType: v.optional(
    v.union(v.literal("text"), v.literal("video"), v.literal("quiz")),
  ),
  content: v.optional(v.string()),
  order: v.optional(v.number()),
  menuOrder: v.optional(v.number()),
  isPublished: v.optional(v.boolean()),
})
  .index("by_lesson", ["lessonId"])
  .index("by_lessonId_order", ["lessonId", "order"])
  .index("by_organization", ["organizationId"])
  .searchIndex("search_content", {
    searchField: "content",
    filterFields: ["organizationId", "lessonId", "isPublished"],
  });

// --- Quizzes Table ---
export const quizzesTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy
  title: v.string(),
  description: v.optional(v.string()),
  questions: v.optional(v.array(v.any())), // Quiz questions structure
  order: v.optional(v.number()),
  lessonId: v.optional(v.id("lessons")), // Link to lesson
  topicId: v.optional(v.id("topics")), // Legacy: Link to topic (if needed)
  courseId: v.optional(v.id("courses")), // Link to course for final quizzes
  isPublished: v.optional(v.boolean()),
})
  .index("by_lessonId", ["lessonId"]) // Used by progress queries
  .index("by_topic", ["topicId"])
  .index("by_course", ["courseId"])
  .index("by_organization", ["organizationId"]);

// --- Course Enrollments Table ---
export const courseEnrollmentsTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy
  userId: v.id("users"),
  courseId: v.id("courses"),
  enrolledAt: v.optional(v.number()), // Timestamp
  enrollmentDate: v.optional(v.number()), // Legacy field for backward compatibility
  status: v.optional(
    v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("suspended"),
      v.literal("cancelled"),
    ),
  ),
  completedAt: v.optional(v.number()), // Timestamp when course was completed
  certificateId: v.optional(v.id("certificates")), // Link to certificate if issued
})
  .index("by_user", ["userId"])
  .index("by_course", ["courseId"])
  .index("by_user_course", ["userId", "courseId"])
  .index("by_organization", ["organizationId"]);

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

// Export all LMS tables in the expected format
export const lmsSchema = {
  tables: {
    courses: coursesTable,
    lessons: lessonsTable,
    topics: topicsTable,
    quizzes: quizzesTable,
    courseEnrollments: courseEnrollmentsTable,
    progress: progressTable,
    courseProgress: courseProgressTable,
    lessonProgress: lessonProgressTable,
    quizResponses: quizResponsesTable,
    // contentAccessRules: contentAccessRulesTable,
    // contentAccessLog: contentAccessLogTable,
  },
};
