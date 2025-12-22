import { defineTable } from "convex/server";
import { v } from "convex/values";

export const commentsTable = defineTable({
  postId: v.string(),
  organizationId: v.optional(v.id("organizations")),
  authorId: v.optional(v.id("users")),
  parentId: v.optional(v.id("comments")),
  content: v.string(),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_post", ["postId"])
  .index("by_org_post", ["organizationId", "postId"])
  .index("by_parent", ["parentId"])
  .index("by_post_parent", ["postId", "parentId"]);

export const commentsSchema = {
  comments: commentsTable,
};
