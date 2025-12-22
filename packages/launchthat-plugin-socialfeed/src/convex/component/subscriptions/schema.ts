import { defineTable } from "convex/server";
import { v } from "convex/values";

export const subscriptionsTable = defineTable({
  userId: v.string(),
  followType: v.union(
    v.literal("user"),
    v.literal("topic"),
    v.literal("group"),
    v.literal("hashtag"),
  ),
  followId: v.string(),
  notificationsEnabled: v.optional(v.boolean()),
})
  .index("by_user", ["userId"])
  .index("by_follow_type_and_id", ["followType", "followId"])
  .index("by_user_and_type", ["userId", "followType"])
  .index("by_user_follow", ["userId", "followType", "followId"]);

export const subscriptionsSchema = {
  subscriptions: subscriptionsTable,
};


