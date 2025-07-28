import {
  contentAccessLogTable,
  contentAccessRulesTable,
} from "./contentAccessSchema";
import { defineSchema, defineTable } from "convex/server";

import { v } from "convex/values";

export const coursesTable = defineTable({
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
  // Add a search index on the title field
  .searchIndex("search_title", {
    searchField: "title",
    // Optionally add filter fields if needed for combined search/filter queries later
    // filterFields: ["isPublished"],
  });
// No indexes needed for courses yet, add later if query patterns emerge

export const lessonsTable = defineTable({
  title: v.string(),
  description: v.optional(v.string()),
  wp_id: v.optional(v.float64()),
  content: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  categories: v.optional(v.array(v.string())),
  tagIds: v.optional(v.array(v.id("tags"))), // New field for global tags
  featuredImage: v.optional(v.string()),
  featuredMedia: v.optional(
    v.union(
      v.object({ type: v.literal("convex"), mediaItemId: v.id("mediaItems") }),
      v.object({
        type: v.literal("vimeo"),
        vimeoId: v.string(),
        vimeoUrl: v.string(),
      }),
      v.string(),
    ),
  ),
  isPublished: v.optional(v.boolean()),
  // Order of lessons within a course (fallback if not using courseStructure)
  menuOrder: v.optional(v.number()),
  courseId: v.optional(v.id("courses")), // Link to parent course
})
  .index("by_course", ["courseId"])
  .index("by_tagIds", ["tagIds"]);

export const topicsTable = defineTable({
  lessonId: v.optional(v.id("lessons")),
  title: v.string(),
  description: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  categories: v.optional(v.array(v.string())),
  tagIds: v.optional(v.array(v.id("tags"))), // New field for global tags
  wp_id: v.optional(v.float64()),
  featuredImage: v.optional(v.string()),
  featuredMedia: v.optional(
    v.union(
      v.object({ type: v.literal("convex"), mediaItemId: v.id("mediaItems") }),
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
  // Store text content directly, video URL for video type
  content: v.optional(v.string()),
  order: v.optional(v.number()),
  // New field for admin-controlled ordering
  menuOrder: v.optional(v.number()),
  isPublished: v.optional(v.boolean()),
})
  .index("by_lessonId_order", ["lessonId", "order"])
  .index("by_lessonId_menuOrder", ["lessonId", "menuOrder"])
  .index("by_unattached", ["lessonId"])
  .index("by_tagIds", ["tagIds"]);

// Define quizzes directly within the lmsSchema for simplicity now
export const quizzesTable = defineTable({
  title: v.string(),
  description: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  categories: v.optional(v.array(v.string())),
  featuredImage: v.optional(v.string()),
  content: v.optional(v.string()),
  isPublished: v.optional(v.boolean()),
  // Link to either a lesson, topic, or course (for final quiz)
  lessonId: v.optional(v.id("lessons")),
  topicId: v.optional(v.id("topics")),
  courseId: v.optional(v.id("courses")), // For final quiz
  order: v.optional(v.number()), // Order within parent
  questions: v.array(
    v.object({
      type: v.union(
        v.literal("single-choice"),
        v.literal("multiple-choice"),
        v.literal("true-false"),
      ),
      questionText: v.string(),
      options: v.optional(v.array(v.string())), // Array of possible answers
      explanation: v.optional(v.string()),
      correctAnswer: v.union(
        v.string(), // For single-choice
        v.array(v.string()), // For multiple-choice
        v.boolean(), // For true-false
      ),
    }),
  ),
})
  .index("by_lessonId", ["lessonId"])
  .index("by_topicId", ["topicId"])
  .index("by_course", ["courseId"]);

export const courseEnrollmentsTable = defineTable({
  userId: v.id("users"),
  courseId: v.id("courses"),
  enrollmentDate: v.number(), // Timestamp of enrollment
  status: v.optional(v.string()), // e.g., "active", "completed"
  // progress: v.optional(v.number()), // Percentage or could be its own table
})
  .index("by_user_course", ["userId", "courseId"])
  .index("by_course", ["courseId"])
  .index("by_user", ["userId"]);

// Track user progress through course content
export const progressTable = defineTable({
  userId: v.id("users"),
  courseId: v.id("courses"),
  itemId: v.union(v.id("lessons"), v.id("topics"), v.id("quizzes")),
  itemType: v.union(v.literal("lesson"), v.literal("topic"), v.literal("quiz")),
  completed: v.boolean(),
  completedAt: v.optional(v.number()), // Timestamp of completion
  score: v.optional(v.number()), // For quizzes
  attempts: v.optional(v.number()), // For quizzes
  startedAt: v.optional(v.number()), // When user first accessed the item
  timeSpent: v.optional(v.number()), // Time spent in seconds
})
  .index("by_user_course", ["userId", "courseId"])
  .index("by_item", ["itemId"])
  .index("by_user_item", ["userId", "itemId"])
  .index("by_user_course_type", ["userId", "courseId", "itemType"]);

// Course-level progress metadata (similar to LearnDash _sfwd-course_progress)
export const courseProgressTable = defineTable({
  userId: v.id("users"),
  courseId: v.id("courses"),
  // Lesson completion tracking
  lessons: v.object({
    completed: v.array(v.id("lessons")), // Array of completed lesson IDs
    total: v.number(), // Total number of lessons in course
  }),
  // Topic completion tracking (per lesson)
  topics: v.record(v.id("lessons"), v.array(v.id("topics"))), // lessonId -> completed topic IDs
  // Overall progress
  completed: v.number(), // Total completed items (lessons + topics + quizzes)
  total: v.number(), // Total items in course
  lastAccessedId: v.optional(
    v.union(v.id("lessons"), v.id("topics"), v.id("quizzes")),
  ), // Last accessed item
  lastAccessedType: v.optional(
    v.union(v.literal("lesson"), v.literal("topic"), v.literal("quiz")),
  ),
  status: v.union(
    v.literal("not_started"),
    v.literal("in_progress"),
    v.literal("completed"),
  ),
  // Timestamps
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  lastAccessedAt: v.number(),
})
  .index("by_user_course", ["userId", "courseId"])
  .index("by_user", ["userId"])
  .index("by_course", ["courseId"]);

// Export a proper Convex schema using defineSchema
export const lmsSchema = defineSchema({
  courses: coursesTable,
  lessons: lessonsTable,
  topics: topicsTable,
  quizzes: quizzesTable,
  courseEnrollments: courseEnrollmentsTable,
  progress: progressTable, // Added progress table
  courseProgress: courseProgressTable, // Course-level progress metadata
  contentAccessRules: contentAccessRulesTable, // Content access control rules
  contentAccessLog: contentAccessLogTable, // Content access audit log
});
