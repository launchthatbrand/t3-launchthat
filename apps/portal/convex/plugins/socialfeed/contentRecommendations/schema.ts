import { defineTable } from "convex/server";
import { v } from "convex/values";

// Define the Content Recommendations table
export const contentRecommendationsTable = defineTable({
  // The user receiving recommendations
  userId: v.id("users"),

  // The content being recommended
  contentId: v.id("feedItems"),

  // Score representing how relevant this content is for the user (higher is better)
  relevanceScore: v.number(),

  // Reason for recommendation (for explanation)
  reasonType: v.union(
    v.literal("topic"),
    v.literal("similarUser"),
    v.literal("engagement"),
    v.literal("trending"),
    v.literal("newContent"),
  ),

  // Additional context for recommendation (e.g., topic ID, similar user ID)
  reasonContext: v.optional(v.string()),

  // When this recommendation was generated
  generatedAt: v.number(),

  // Whether the user has seen this recommendation
  seen: v.optional(v.boolean()),

  // Whether the user interacted with this recommendation
  interacted: v.optional(v.boolean()),

  // User reaction to recommendation (like, dislike, neutral)
  userReaction: v.optional(
    v.union(v.literal("like"), v.literal("dislike"), v.literal("neutral")),
  ),
})
  .index("by_user", ["userId", "generatedAt"]) // For finding recent recommendations for a user
  .index("by_user_and_content", ["userId", "contentId"]) // To avoid duplicate recommendations
  .index("by_relevance", ["userId", "relevanceScore"]) // For finding most relevant recommendations
  .index("by_unseen", ["userId", "seen"]); // For finding recommendations the user hasn't seen

// Export the schema
export const contentRecommendationsSchema = {
  contentRecommendations: contentRecommendationsTable,
};
