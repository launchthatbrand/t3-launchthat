import { defineTable } from "convex/server";
import { v } from "convex/values";

export const categoriesTable = defineTable({
  // Basic information
  name: v.string(),
  slug: v.optional(v.string()), // URL-friendly version of name - optional for existing records
  description: v.optional(v.string()),

  // Post types this category applies to
  postTypes: v.array(v.string()), // e.g., ["posts", "products", "media", "downloads", "lessons", "topics"]

  // Hierarchical structure
  parentId: v.optional(v.id("categories")), // Reference to parent category
  level: v.optional(v.number()), // Hierarchy level (0 for root categories) - optional for existing records
  path: v.optional(v.array(v.id("categories"))), // Array of ancestor category IDs from root to parent - optional for existing records

  // Display options
  imageUrl: v.optional(v.string()),
  iconUrl: v.optional(v.string()),
  color: v.optional(v.string()), // Hex color for UI display
  displayOrder: v.optional(v.number()), // For custom ordering

  // Status and visibility
  isActive: v.optional(v.boolean()), // Whether the category is active or disabled - optional for existing records
  isVisible: v.optional(v.boolean()), // Whether to show in navigation - optional for existing records
  isPublic: v.optional(v.boolean()), // For downloads/media - public visibility

  // SEO fields
  metaTitle: v.optional(v.string()),
  metaDescription: v.optional(v.string()),
  metaKeywords: v.optional(v.array(v.string())),

  // Timestamps
  updatedAt: v.optional(v.number()), // Timestamp when last updated - optional for existing records
})
  .index("by_post_types", ["postTypes"])
  .index("by_parent", ["parentId"])
  .index("by_level", ["level"])
  .index("by_slug", ["slug"])
  .index("by_active", ["isActive"])
  .index("by_visible", ["isVisible"])
  .index("by_public", ["isPublic"])
  .index("by_updated", ["updatedAt"])
  .searchIndex("search_categories", {
    searchField: "name",
    filterFields: ["isActive", "isVisible", "level", "postTypes"],
  });
