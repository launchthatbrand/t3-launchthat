import { defineTable } from "convex/server";
import { v } from "convex/values";

export const marketingTagsTable = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  color: v.optional(v.string()),
  createdAt: v.optional(v.number()),
  createdBy: v.optional(v.id("users")),
  isActive: v.optional(v.boolean()),
  slug: v.optional(v.string()),
});

export const marketingTagsSchema = {
  marketingTags: marketingTagsTable,
};
