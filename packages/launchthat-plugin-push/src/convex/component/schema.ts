import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Per-user web push subscription storage.
 *
 * Notes:
 * - Each app deploys its own Convex deployment, so we do not scope by appKey here.
 * - We store userId as a string (typically Clerk user id / JWT subject).
 */
export default defineSchema({
  pushSubscriptions: defineTable({
    userId: v.string(),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    expirationTime: v.optional(v.union(v.number(), v.null())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_endpoint", ["userId", "endpoint"]),
});

