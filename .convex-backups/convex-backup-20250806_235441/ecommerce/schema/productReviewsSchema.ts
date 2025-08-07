import { defineTable } from "convex/server";
import { v } from "convex/values";

// Define product reviews table (from ecommerceSchemaExtended.ts)
export const productReviewsTable = defineTable({
  productId: v.id("products"),
  userId: v.id("users"),
  rating: v.number(), // e.g., 1-5 stars
  title: v.optional(v.string()),
  reviewText: v.string(),
  isVerifiedPurchase: v.boolean(),
  status: v.union(
    v.literal("pending_approval"),
    v.literal("approved"),
    v.literal("rejected"),
  ),
  images: v.optional(
    v.array(
      v.object({
        url: v.string(),
        caption: v.optional(v.string()),
      }),
    ),
  ),
  helpfulVotes: v.optional(v.number()),
  notHelpfulVotes: v.optional(v.number()),
  replies: v.optional(
    v.array(
      v.object({
        userId: v.id("users"), // Admin or original reviewer
        replyText: v.string(),
        createdAt: v.number(),
      }),
    ),
  ),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_product", ["productId"])
  .index("by_user", ["userId"])
  .index("by_product_user", ["productId", "userId"])
  .index("by_status", ["productId", "status"])
  .index("by_rating", ["productId", "rating"]);

export const productReviewsSchema = {
  productReviews: productReviewsTable,
};
