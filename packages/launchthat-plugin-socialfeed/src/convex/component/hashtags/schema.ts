import { defineTable } from "convex/server";
import { v } from "convex/values";

export const hashtagResponseValidator = v.object({
  _id: v.id("hashtags"),
  _creationTime: v.number(),
  tag: v.string(),
  usageCount: v.number(),
  lastUsed: v.number(),
  category: v.optional(v.string()),
  isBlocked: v.optional(v.boolean()),
  relatedTags: v.optional(v.array(v.string())),
  followerCount: v.optional(v.number()),
  description: v.optional(v.string()),
  coverImage: v.optional(v.string()),
  isTopic: v.optional(v.boolean()),
});

export const hashtagsTable = defineTable({
  tag: v.string(),
  usageCount: v.number(),
  lastUsed: v.number(),
  category: v.optional(v.string()),
  isBlocked: v.optional(v.boolean()),
  relatedTags: v.optional(v.array(v.string())),
  followerCount: v.optional(v.number()),
  description: v.optional(v.string()),
  coverImage: v.optional(v.string()),
  isTopic: v.optional(v.boolean()),
  recentEngagement: v.optional(v.number()),
  weeklyEngagement: v.optional(v.number()),
  lastUpdated: v.optional(v.number()),
})
  .index("by_tag", ["tag"])
  .index("by_usageCount", ["usageCount"])
  .index("by_lastUsed", ["lastUsed"])
  .index("by_category", ["category"])
  .index("by_followerCount", ["followerCount"])
  .index("by_isTopic", ["isTopic"])
  .index("by_recentEngagement", ["recentEngagement"]);

export const hashtagsSchema = {
  hashtags: hashtagsTable,
};


