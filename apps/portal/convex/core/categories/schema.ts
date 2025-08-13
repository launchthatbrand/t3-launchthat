// Categories Schema
// Note: Currently categories are virtual (derived from posts.category field)
// This file serves as a placeholder for future dedicated categories table

import { defineTable } from "convex/server";
import { v } from "convex/values";

// Future schema would look like:
export const categoriesTable = defineTable({
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  parentId: v.optional(v.id("categories")),
  postTypes: v.optional(v.array(v.string())),
  metadata: v.optional(
    v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
  ),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
})
  .index("by_slug", ["slug"])
  .index("by_parent", ["parentId"])
  .index("by_postTypes", ["postTypes"]);

export const categoriesSchema = {
  categories: categoriesTable,
};
