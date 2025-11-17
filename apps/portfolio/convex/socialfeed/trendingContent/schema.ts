import { defineTable } from "convex/server";
import { v } from "convex/values";

// Define the Trending Content metrics table
export const trendingContentTable = defineTable({
  // The content being tracked
  contentId: v.id("feedItems"),

  // Overall trending score (calculated from engagement metrics)
  trendingScore: v.number(),

  // Individual engagement metrics
  reactions: v.number(),
  comments: v.number(),
  shares: v.number(),
  views: v.optional(v.number()),

  // Engagement velocity metrics (change over time)
  reactionVelocity: v.optional(v.number()),
  commentVelocity: v.optional(v.number()),
  shareVelocity: v.optional(v.number()),

  // Time windows for trending calculation
  hourlyEngagement: v.optional(v.number()),
  dailyEngagement: v.optional(v.number()),
  weeklyEngagement: v.optional(v.number()),

  // When this trending record was last updated
  lastUpdated: v.number(),

  // Content quality factors (can be used in score calculation)
  contentQualityScore: v.optional(v.number()),
  relevanceScore: v.optional(v.number()),

  // Topics/hashtags associated with this content (for trending by topic)
  topics: v.optional(v.array(v.string())),
})
  .index("by_trending_score", ["trendingScore"]) // For finding most trending content
  .index("by_content", ["contentId"]) // For finding trending metrics for specific content
  .index("by_lastUpdated", ["lastUpdated"]); // For finding recently updated trending metrics

// Export the schema
export const trendingContentSchema = {
  trendingContent: trendingContentTable,
};
