import { defineTable } from "convex/server";
import { v } from "convex/values";

export const lmsSchema = {
  lmsBadgeAwards: defineTable({
    organizationId: v.optional(v.id("organizations")),
    userId: v.id("users"),
    badgeId: v.id("posts"),
    sourceType: v.union(
      v.literal("course"),
      v.literal("lesson"),
      v.literal("topic"),
      v.literal("quiz"),
    ),
    sourceId: v.id("posts"),
    courseId: v.optional(v.id("posts")),
    awardedAt: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_badge", ["userId", "badgeId"])
    .index("by_user_and_badge_and_source", ["userId", "badgeId", "sourceId"]),
};
