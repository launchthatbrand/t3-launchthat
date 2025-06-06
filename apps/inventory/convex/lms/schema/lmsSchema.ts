import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const coursesTable = defineTable({
  title: v.string(),
  description: v.optional(v.string()),
  productId: v.optional(v.id("products")), // Link to ecommerce product
  isPublished: v.optional(v.boolean()),
  courseStructure: v.optional(
    v.array(v.object({ lessonId: v.id("lessons") })), // Store ordered lesson IDs
  ),
  finalQuizId: v.optional(v.id("quizzes")), // Added field for final quiz
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
  isPublished: v.optional(v.boolean()),
});

export const topicsTable = defineTable({
  lessonId: v.optional(v.id("lessons")),
  title: v.string(),
  contentType: v.union(
    v.literal("text"),
    v.literal("video"),
    v.literal("quiz"),
  ),
  // Store text content directly, video URL for video type
  content: v.optional(v.string()),
  order: v.optional(v.number()),
  isPublished: v.optional(v.boolean()),
})
  .index("by_lessonId_order", ["lessonId", "order"])
  .index("by_unattached", ["lessonId"]);

// Define quizzes directly within the lmsSchema for simplicity now
export const quizzesTable = defineTable({
  title: v.string(),
  // Link to either a lesson or a topic
  lessonId: v.optional(v.id("lessons")),
  topicId: v.optional(v.id("topics")),
  questions: v.array(
    v.object({
      questionText: v.string(),
      options: v.array(v.string()), // Array of possible answers
      correctAnswerIndex: v.number(), // Index of the correct answer in the options array
    }),
  ),
})
  .index("by_lessonId", ["lessonId"])
  .index("by_topicId", ["topicId"]);

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

// Export a proper Convex schema using defineSchema
export const lmsSchema = defineSchema({
  courses: coursesTable,
  lessons: lessonsTable,
  topics: topicsTable,
  quizzes: quizzesTable,
  courseEnrollments: courseEnrollmentsTable, // Added courseEnrollments
});
