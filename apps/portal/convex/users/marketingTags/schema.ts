import { defineTable } from "convex/server";
import { v } from "convex/values";

export const marketingTagsTable = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  category: v.optional(v.string()),
  color: v.optional(v.string()),
  createdAt: v.optional(v.number()),
  createdBy: v.optional(v.id("users")),
  isActive: v.optional(v.boolean()),
  slug: v.optional(v.string()),
})
  .index("by_slug", ["slug"])
  .index("by_name", ["name"]);

export const userMarketingTagsTable = defineTable({
  userId: v.id("users"),
  marketingTagId: v.id("marketingTags"),
  source: v.optional(v.string()),
  assignedBy: v.optional(v.id("users")),
  assignedAt: v.number(),
  expiresAt: v.optional(v.number()),
  notes: v.optional(v.string()),
})
  .index("by_user", ["userId"])
  .index("by_tag", ["marketingTagId"])
  .index("by_user_tag", ["userId", "marketingTagId"]);

export const marketingTagsSchema = {
  marketingTags: marketingTagsTable,
  userMarketingTags: userMarketingTagsTable,
};
