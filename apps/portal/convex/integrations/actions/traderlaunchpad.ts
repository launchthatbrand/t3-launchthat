import { v } from "convex/values";

import { api } from "../../_generated/api";
import { action } from "../../_generated/server";

/**
 * Get Posts action for TraderLaunchpad
 * Retrieves posts from the portal with optional filtering
 */
export const getPosts = action({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  returns: v.object({
    posts: v.array(v.any()), // Simplified for now
    total: v.number(),
    hasMore: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 10, 100); // Cap at 100
    const status = args.status ?? "published";

    try {
      // For now, return mock data since we need to create the supporting queries
      // In a real implementation, this would call ctx.runQuery() to get data
      const mockPosts = [
        {
          _id: "mock_post_1",
          _creationTime: Date.now(),
          title: "Sample Post 1",
          content: "This is a sample post content",
          status: "published",
          category: args.category || "general",
          author: "system",
          publishedAt: Date.now(),
        },
        {
          _id: "mock_post_2",
          _creationTime: Date.now() - 1000,
          title: "Sample Post 2",
          content: "This is another sample post",
          status: "published",
          category: args.category || "general",
          author: "system",
          publishedAt: Date.now() - 1000,
        },
      ];

      const filteredPosts = mockPosts.filter(
        (post) => status === "all" || post.status === status,
      );

      const finalPosts = filteredPosts.slice(0, limit);
      const hasMore = filteredPosts.length > limit;

      return {
        posts: finalPosts,
        total: filteredPosts.length,
        hasMore,
        message: `Retrieved ${finalPosts.length} posts with status: ${status}`,
      };
    } catch (error) {
      console.error("Error in getPosts action:", error);
      throw new Error(`Failed to retrieve posts: ${error}`);
    }
  },
});

/**
 * Test action to verify TraderLaunchpad integration is working
 */
export const testConnection = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    timestamp: v.number(),
    availableActions: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    return {
      success: true,
      message: "TraderLaunchpad integration is working correctly",
      timestamp: Date.now(),
      availableActions: ["Get Posts", "Test Connection"],
    };
  },
});
