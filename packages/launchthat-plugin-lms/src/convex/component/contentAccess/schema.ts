import { defineTable } from "convex/server";
import { v } from "convex/values";

const contentTypeValidator = v.union(
  v.literal("course"),
  v.literal("lesson"),
  v.literal("topic"),
  v.literal("download"),
  v.literal("product"),
  v.literal("quiz"),
);

export const contentAccessRulesTable = defineTable({
  contentType: contentTypeValidator,
  contentId: v.string(),
  isPublic: v.optional(v.boolean()),
  isActive: v.optional(v.boolean()),
  priority: v.optional(v.number()),
  requiredTags: v.object({
    mode: v.union(v.literal("all"), v.literal("some")),
    tagIds: v.array(v.string()),
  }),
  excludedTags: v.object({
    mode: v.union(v.literal("all"), v.literal("some")),
    tagIds: v.array(v.string()),
  }),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  createdBy: v.optional(v.string()),
})
  .index("by_content", ["contentType", "contentId"])
  .index("by_contentType", ["contentType"])
  .index("by_active", ["isActive"])
  .index("by_priority", ["priority"]);

export const contentAccessLogTable = defineTable({
  userId: v.string(),
  contentType: contentTypeValidator,
  contentId: v.string(),
  accessGranted: v.boolean(),
  reason: v.optional(v.string()),
  userTags: v.optional(v.array(v.string())),
  accessedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_content", ["contentType", "contentId"])
  .index("by_time", ["accessedAt"]);


