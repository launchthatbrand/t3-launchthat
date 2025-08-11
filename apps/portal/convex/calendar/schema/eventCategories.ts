import { defineTable } from "convex/server";
import { v } from "convex/values";

export const eventCategoriesTable = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  isPublic: v.boolean(),
  color: v.optional(v.string()), // HEX color code
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_name", ["name"])
  .index("by_visibility", ["isPublic"]);
