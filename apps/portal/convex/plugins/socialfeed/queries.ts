import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { components } from "../../_generated/api";
import { query } from "../../_generated/server";
import { isAdmin } from "../../lib/permissions/hasPermission";
import { getAuthenticatedUser } from "../../lib/permissions/userAuth";

const socialfeedQueries = components.launchthat_socialfeed.queries;

/**
 * Get the universal feed (all public posts)
 */
export const getUniversalFeed = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(socialfeedQueries.getUniversalFeed, args);
  },
});

/**
 * Get personalized feed for the current user
 */
export const getPersonalizedFeed = query({
  args: {
    userId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(socialfeedQueries.getPersonalizedFeed, {
      ...args,
      userId: args.userId,
    });
  },
});

/**
 * Get feed items for a specific group
 */
export const getGroupFeed = query({
  args: {
    groupId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(socialfeedQueries.getGroupFeed, args);
  },
});

/**
 * Get feed items from a specific user's profile
 */
export const getUserProfileFeed = query({
  args: {
    profileId: v.id("users"),
    viewerId: v.optional(v.id("users")),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(socialfeedQueries.getUserProfileFeed, {
      ...args,
      profileId: args.profileId,
      viewerId: args.viewerId,
    });
  },
});

/**
 * Get a single feed item by ID
 */
export const getFeedItem = query({
  args: { feedItemId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(socialfeedQueries.getFeedItem, {
      feedItemId: args.feedItemId,
    });
  },
});

/**
 * Get hashtag details and associated feed items
 */
export const getHashtagFeed = query({
  args: {
    tag: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(socialfeedQueries.getHashtagFeed, args);
  },
});

/**
 * Get comments for a specific feed item or parent content
 */
export const getComments = query({
  args: {
    parentId: v.string(),
    parentType: v.union(
      v.literal("feedItem"),
      v.literal("post"),
      v.literal("download"),
      v.literal("helpdeskArticle"),
    ),
    paginationOpts: paginationOptsValidator,
    sortOrder: v.optional(v.union(v.literal("newest"), v.literal("oldest"))),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(socialfeedQueries.getComments, args);
  },
});

/**
 * Get replies for a specific comment
 */
export const getReplies = query({
  args: {
    parentCommentId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(socialfeedQueries.getReplies, {
      parentCommentId: args.parentCommentId,
      paginationOpts: args.paginationOpts,
    });
  },
});

export const getCommentThreadForParent = query({
  args: {
    parentId: v.string(),
    parentType: v.union(
      v.literal("feedItem"),
      v.literal("course"),
      v.literal("lesson"),
      v.literal("topic"),
      v.literal("quiz"),
      v.literal("post"),
      v.literal("download"),
      v.literal("helpdeskArticle"),
    ),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const viewer = await (async () => {
      try {
        return await getAuthenticatedUser(ctx);
      } catch {
        return null;
      }
    })();

    const viewerIsAdmin = await isAdmin(ctx);
    const viewerUserId = viewer?._id ?? null;

    const comments = await ctx.runQuery(
      socialfeedQueries.getAllCommentsForParent,
      args,
    );

    const uniqueUserIds = Array.from(
      new Set(comments.map((c: any) => String(c.userId))),
    );
    const userDocs = await Promise.all(
      uniqueUserIds.map(async (id) => {
        const user = await ctx.db.get(id as unknown as Id<"users">);
        return [id, user] as const;
      }),
    );
    const userById = new Map<string, any>(userDocs);

    const enriched = comments.map((comment: any) => {
      const author = userById.get(String(comment.userId)) ?? null;
      return {
        ...comment,
        authorId: String(comment.userId),
        author: author
          ? {
              _id: author._id,
              name: author.name ?? author.username ?? "User",
              image: author.image ?? undefined,
            }
          : null,
      };
    });

    return {
      viewerUserId,
      viewerIsAdmin,
      comments: enriched,
    };
  },
});

/**
 * Search for users by username for mentions
 */
export const searchUsersForMentions = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(socialfeedQueries.searchUsersForMentions, args);
  },
});

/**
 * Get recommended content for a user
 */
export const getRecommendedContent = query({
  args: {
    userId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(socialfeedQueries.getRecommendedContent, {
      ...args,
      userId: args.userId,
    });
  },
});

/**
 * Get topics (hashtags marked as topics) for discovery
 */
export const getTopics = query({
  args: {
    paginationOpts: paginationOptsValidator,
    query: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(socialfeedQueries.getTopics, args);
  },
});

/**
 * Get topics followed by a user
 */
export const getUserFollowedTopics = query({
  args: {
    userId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(socialfeedQueries.getUserFollowedTopics, {
      ...args,
      userId: args.userId,
    });
  },
});

/**
 * Get topic suggestions for a user
 */
export const getTopicSuggestions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(socialfeedQueries.getTopicSuggestions, {
      ...args,
      userId: args.userId,
    });
  },
});

/**
 * Get a single topic by ID
 */
export const getTopic = query({
  args: {
    topicId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(socialfeedQueries.getTopic, { topicId: args.topicId });
  },
});

/**
 * Check if a user follows a topic
 */
export const checkTopicFollow = query({
  args: {
    userId: v.id("users"),
    topicId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(socialfeedQueries.checkTopicFollow, {
      userId: args.userId,
      topicId: args.topicId,
    });
  },
});

/**
 * Get recommended hashtags for the current user
 */
export const getRecommendedHashtags = query({
  args: {
    userId: v.id("users"),
    limit: v.number(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(socialfeedQueries.getRecommendedHashtags, {
      ...args,
      userId: args.userId,
    });
  },
});
