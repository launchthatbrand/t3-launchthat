import { defineTable } from "convex/server";
import { v } from "convex/values";

export const tagsTable = defineTable({
  name: v.string(), // Display name of the tag
  slug: v.string(), // URL-friendly slug (e.g., "web-development", "beginner")
  description: v.optional(v.string()), // Optional description for the tag
})
  .index("by_name", ["name"])
  .index("by_slug", ["slug"]);

export const tagsSchema = {
  tags: tagsTable,
};
