import { defineTable } from "convex/server";
import { v } from "convex/values";

export const contentRecommendationsTable = defineTable({
  userId: v.string(),
  contentId: v.id("feedItems"),
  relevanceScore: v.number(),
  reasonType: v.union(
    v.literal("topic"),
    v.literal("similarUser"),
    v.literal("engagement"),
    v.literal("trending"),
    v.literal("newContent"),
  ),
  reasonContext: v.optional(v.string()),
  generatedAt: v.number(),
  seen: v.optional(v.boolean()),
  interacted: v.optional(v.boolean()),
  userReaction: v.optional(
    v.union(v.literal("like"), v.literal("dislike"), v.literal("neutral")),
  ),
})
  .index("by_user", ["userId", "generatedAt"])
  .index("by_user_and_content", ["userId", "contentId"])
  .index("by_relevance", ["userId", "relevanceScore"])
  .index("by_unseen", ["userId", "seen"]);

export const contentRecommendationsSchema = {
  contentRecommendations: contentRecommendationsTable,
};
