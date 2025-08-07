import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import {
  contentAccessLogTable,
  contentAccessRulesTable,
} from "./contentAccessSchema";

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
  // Add a search index on the title field
  .searchIndex("search_title", {
    searchField: "title",
    filterFields: ["organizationId", "isPublished"],
  });
// No indexes needed for courses yet, add later if query patterns emerge

export const lessonsTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy
  courseId: v.optional(v.id("courses")),
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
  // For ordering within a course
  order: v.optional(v.number()),
  // Topics for this lesson
  topicIds: v.optional(v.array(v.id("topics"))),
  // Course-level tags to inherit
})
  .index("by_organization", ["organizationId"])
  .index("by_organization_course", ["organizationId", "courseId"])
  .index("by_course", ["courseId"])
  .index("by_published", ["isPublished"])
  .index("by_tagIds", ["tagIds"]);

export const topicsTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy
  lessonId: v.optional(v.id("lessons")),
  title: v.string(),
  description: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  categories: v.optional(v.array(v.string())),
  tagIds: v.optional(v.array(v.id("tags"))), // New field for global tags
  wp_id: v.optional(v.float64()),
  featuredImage: v.optional(v.string()),
  attempts: v.optional(v.number()),
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
  .index("by_organization", ["organizationId"])
  .index("by_lessonId_order", ["lessonId", "order"])
  .index("by_lessonId_menuOrder", ["lessonId", "menuOrder"])
  .index("by_unattached", ["lessonId"])
  .index("by_organization_lesson", ["organizationId", "lessonId"])
  .index("by_tagIds", ["tagIds"]);

// Define quizzes directly within the lmsSchema for simplicity now
export const quizzesTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy
  courseId: v.optional(v.id("courses")), // Course this quiz belongs to
  lessonId: v.optional(v.id("lessons")), // Lesson this quiz is associated with (optional)
  title: v.string(),
  description: v.optional(v.string()),
  order: v.optional(v.number()), // Order within parent (lesson/course)
  questions: v.array(
    v.object({
      // Support both old and new field names
      id: v.optional(v.string()), // New field (optional for backward compatibility)
      question: v.optional(v.string()), // New field name
      questionText: v.optional(v.string()), // Legacy field name
      type: v.union(
        v.literal("multiple-choice"),
        v.literal("single-choice"), // Legacy type
        v.literal("true-false"),
        v.literal("short-answer"),
      ),
      options: v.optional(v.array(v.string())), // For multiple choice questions
      correctAnswer: v.string(), // Answer or correct option index
      points: v.optional(v.number()),
    }),
  ),
  passingScore: v.optional(v.number()), // Percentage required to pass
  timeLimit: v.optional(v.number()), // Time limit in minutes
  isPublished: v.optional(v.boolean()),
})
  .index("by_organization", ["organizationId"])
  .index("by_organization_course", ["organizationId", "courseId"])
  .index("by_course", ["courseId"])
  .index("by_lessonId", ["lessonId"]);

export const courseEnrollmentsTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy
  userId: v.id("users"),
  courseId: v.id("courses"),
  enrollmentDate: v.number(),
  enrolledAt: v.optional(v.number()), // Timestamp
  completedAt: v.optional(v.number()), // Timestamp when completed
  progress: v.optional(v.number()), // Percentage completion (0-100)
  status: v.union(
    v.literal("enrolled"),
    v.literal("completed"),
    v.literal("dropped"),
    v.literal("active"),
  ),
})
  .index("by_organization", ["organizationId"])
  .index("by_organization_user", ["organizationId", "userId"])
  .index("by_organization_course", ["organizationId", "courseId"])
  .index("by_user", ["userId"])
  .index("by_course", ["courseId"])
  .index("by_user_course", ["userId", "courseId"]);

export const progressTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy
  userId: v.id("users"),
  courseId: v.id("courses"),

  // Support both old and new structures
  lessonId: v.optional(v.id("lessons")),
  topicId: v.optional(v.id("topics")),
  quizId: v.optional(v.id("quizzes")),

  // Legacy fields (for backward compatibility with existing data)
  itemId: v.optional(v.union(v.id("lessons"), v.id("topics"), v.id("quizzes"))),
  itemType: v.optional(
    v.union(v.literal("lesson"), v.literal("topic"), v.literal("quiz")),
  ),

  completed: v.boolean(),
  completedAt: v.optional(v.number()), // Timestamp
  startedAt: v.optional(v.number()), // When user first accessed the item

  // For quiz attempts
  score: v.optional(v.number()),
  maxScore: v.optional(v.number()),
  attempts: v.optional(v.number()), // For quizzes and retries
  timeSpent: v.optional(v.number()), // Time in minutes or seconds
})
  .index("by_organization", ["organizationId"])
  .index("by_organization_user", ["organizationId", "userId"])
  .index("by_organization_course", ["organizationId", "courseId"])
  .index("by_user", ["userId"])
  .index("by_course", ["courseId"])
  .index("by_user_course", ["userId", "courseId"])
  .index("by_user_lesson", ["userId", "lessonId"])
  .index("by_user_topic", ["userId", "topicId"])
  .index("by_user_quiz", ["userId", "quizId"])
  // Legacy indexes for backward compatibility
  .index("by_item", ["itemId"])
  .index("by_user_item", ["userId", "itemId"])
  .index("by_user_course_type", ["userId", "courseId", "itemType"]);

// Course-level progress metadata (similar to LearnDash _sfwd-course_progress)
export const courseProgressTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Multi-tenancy field
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
  .index("by_organization", ["organizationId"])
  .index("by_user_course", ["userId", "courseId"])
  .index("by_user", ["userId"])
  .index("by_course", ["courseId"])
  .index("by_organization_user", ["organizationId", "userId"]);

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
