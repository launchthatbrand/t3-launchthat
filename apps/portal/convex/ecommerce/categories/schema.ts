import { defineTable } from "convex/server";
import { v } from "convex/values";

// Define product categories table with hierarchical structure
export const productCategoriesTable = defineTable({
  // Basic information
  name: v.string(),
  slug: v.string(), // URL-friendly version of name
  description: v.optional(v.string()),

  // Hierarchical structure
  parentId: v.optional(v.id("productCategories")), // Reference to parent category
  level: v.number(), // Hierarchy level (0 for root categories)
  path: v.array(v.id("productCategories")), // Array of ancestor category IDs from root to parent

  // Display options
  imageUrl: v.optional(v.string()),
  iconUrl: v.optional(v.string()),
  displayOrder: v.optional(v.number()), // For custom ordering

  // Status and visibility
  isActive: v.boolean(), // Whether the category is active or disabled
  isVisible: v.boolean(), // Whether to show in navigation

  // SEO fields
  metaTitle: v.optional(v.string()),
  metaDescription: v.optional(v.string()),
  metaKeywords: v.optional(v.array(v.string())),

  // Timestamps
  createdAt: v.number(), // Timestamp when created
  updatedAt: v.number(), // Timestamp when last updated
})
  .index("by_parent", ["parentId"])
  .index("by_level", ["level"])
  .index("by_slug", ["slug"])
  .index("by_active", ["isActive"])
  .index("by_visible", ["isVisible"])
  .index("by_created", ["createdAt"])
  .index("by_updated", ["updatedAt"])
  .searchIndex("search_categories", {
    searchField: "name",
    filterFields: ["isActive", "isVisible", "level"],
  });

export const categoriesSchema = {
  productCategories: productCategoriesTable,
};
