import { defineTable } from "convex/server";
import { v } from "convex/values";

export const trendingContentTable = defineTable({
  contentId: v.id("feedItems"),
  trendingScore: v.number(),
  reactions: v.number(),
  comments: v.number(),
  shares: v.number(),
  views: v.optional(v.number()),
  reactionVelocity: v.optional(v.number()),
  commentVelocity: v.optional(v.number()),
  shareVelocity: v.optional(v.number()),
  hourlyEngagement: v.optional(v.number()),
  dailyEngagement: v.optional(v.number()),
  weeklyEngagement: v.optional(v.number()),
  lastUpdated: v.number(),
  contentQualityScore: v.optional(v.number()),
  relevanceScore: v.optional(v.number()),
  topics: v.optional(v.array(v.string())),
})
  .index("by_trending_score", ["trendingScore"])
  .index("by_content", ["contentId"])
  .index("by_lastUpdated", ["lastUpdated"]);

export const trendingContentSchema = {
  trendingContent: trendingContentTable,
};


