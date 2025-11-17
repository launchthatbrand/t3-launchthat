import { defineTable } from "convex/server";
import { v } from "convex/values";

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

export const courseSchema = {
  courses: coursesTable,
};
