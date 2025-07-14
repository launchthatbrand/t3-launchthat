import { defineTable } from "convex/server";
import { v } from "convex/values";

export const categoriesTable = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  postTypes: v.array(v.string()), // e.g., ["downloads", "posts", "products"]
  // Optionally: parentId, slug, etc.
});
