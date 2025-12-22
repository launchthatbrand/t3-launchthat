import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { components } from "../../_generated/api";
import { mutation } from "../../_generated/server";
import { isAdmin } from "../../lib/permissions/hasPermission";
import { getAuthenticatedUser } from "../../lib/permissions/userAuth";

const socialfeedMutations = components.launchthat_socialfeed.mutations;

/**
 * Create a new feed post
 */
export const createPost = mutation({
  args: {
    creatorId: v.id("users"),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
    visibility: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("group"),
    ),
    moduleType: v.optional(
      v.union(
        v.literal("blog"),
        v.literal("course"),
        v.literal("group"),
        v.literal("event"),
      ),
    ),
    moduleId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(socialfeedMutations.createPost, {
      ...args,
      creatorId: args.creatorId as unknown as string,
    });
  },
});

/**
 * Update an existing post
 */
export const updatePost = mutation({
  args: {
    postId: v.string(),
    userId: v.id("users"),
    content: v.optional(v.string()),
    mediaUrls: v.optional(v.array(v.string())),
    visibility: v.optional(
      v.union(v.literal("public"), v.literal("private"), v.literal("group")),
    ),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(socialfeedMutations.updatePost, {
      ...args,
      postId: args.postId as unknown as Id<"feedItems">,
      userId: args.userId as unknown as string,
    });
  },
});

/**
 * Delete a post (soft delete)
 */
export const deletePost = mutation({
  args: {
    postId: v.string(),
    userId: v.id("users"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(socialfeedMutations.deletePost, {
      ...args,
      postId: args.postId as unknown as Id<"feedItems">,
      userId: args.userId as unknown as string,
    });
  },
});

/**
 * Share an existing feed item
 */
export const shareContent = mutation({
  args: {
    creatorId: v.id("users"),
    originalContentId: v.string(),
    content: v.optional(v.string()),
    visibility: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("group"),
    ),
    moduleType: v.optional(
      v.union(
        v.literal("blog"),
        v.literal("course"),
        v.literal("group"),
        v.literal("event"),
      ),
    ),
    moduleId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(socialfeedMutations.shareContent, {
      ...args,
      creatorId: args.creatorId as unknown as string,
      originalContentId: args.originalContentId as unknown as Id<"feedItems">,
    });
  },
});

/**
 * Add a reaction to a feed item
 */
export const addReaction = mutation({
  args: {
    userId: v.id("users"),
    feedItemId: v.string(),
    reactionType: v.union(
      v.literal("like"),
      v.literal("love"),
      v.literal("celebrate"),
      v.literal("support"),
      v.literal("insightful"),
      v.literal("curious"),
    ),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(socialfeedMutations.addReaction, {
      ...args,
      userId: args.userId as unknown as string,
      feedItemId: args.feedItemId as unknown as Id<"feedItems">,
    });
  },
});

/**
 * Add a comment to a feed item
 */
export const addComment = mutation({
  args: {
    content: v.string(),
    feedItemId: v.optional(v.string()),
    parentId: v.optional(v.string()),
    parentType: v.optional(
      v.union(
        v.literal("feedItem"),
        v.literal("course"),
        v.literal("lesson"),
        v.literal("topic"),
        v.literal("quiz"),
        v.literal("post"),
        v.literal("download"),
        v.literal("helpdeskArticle"),
      ),
    ),
    parentCommentId: v.optional(v.string()),
    mediaUrls: v.optional(v.array(v.string())),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const resolvedParentId = args.parentId ?? args.feedItemId;
    const resolvedParentType =
      args.parentType ?? (args.feedItemId ? "feedItem" : undefined);
    if (!resolvedParentId || !resolvedParentType) {
      throw new Error(
        "Missing comment parent. Provide (parentId + parentType) or feedItemId.",
      );
    }
    return await ctx.runMutation(socialfeedMutations.addComment, {
      ...args,
      userId: user._id as unknown as string,
      feedItemId:
        resolvedParentType === "feedItem"
          ? (resolvedParentId as unknown as Id<"feedItems">)
          : undefined,
      parentId: resolvedParentId,
      parentType: resolvedParentType,
      parentCommentId:
        args.parentCommentId as unknown as Id<"comments"> | undefined,
    });
  },
});

export const updateComment = mutation({
  args: {
    commentId: v.string(),
    content: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const viewerIsAdmin = await isAdmin(ctx);
    return await ctx.runMutation(socialfeedMutations.updateComment, {
      commentId: args.commentId as unknown as Id<"comments">,
      userId: user._id as unknown as string,
      content: args.content,
      asAdmin: viewerIsAdmin,
    });
  },
});

export const deleteComment = mutation({
  args: {
    commentId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const viewerIsAdmin = await isAdmin(ctx);
    return await ctx.runMutation(socialfeedMutations.deleteComment, {
      commentId: args.commentId as unknown as Id<"comments">,
      userId: user._id as unknown as string,
      asAdmin: viewerIsAdmin,
    });
  },
});

/**
 * Follow a topic
 */
export const followTopic = mutation({
  args: {
    userId: v.id("users"),
    topicId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(socialfeedMutations.followTopic, {
      userId: args.userId as unknown as string,
      topicId: args.topicId as unknown as Id<"hashtags">,
    });
  },
});

/**
 * Unfollow a topic
 */
export const unfollowTopic = mutation({
  args: {
    userId: v.id("users"),
    topicId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(socialfeedMutations.unfollowTopic, {
      userId: args.userId as unknown as string,
      topicId: args.topicId as unknown as Id<"hashtags">,
      });
  },
});

/**
 * Create or update a topic
 */
export const createOrUpdateTopic = mutation({
  args: {
    tag: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    coverImage: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(socialfeedMutations.createOrUpdateTopic, args);
  },
});

/**
 * Mark recommendation as seen
 */
export const markRecommendationAsSeen = mutation({
  args: {
    userId: v.id("users"),
    contentId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(socialfeedMutations.markRecommendationAsSeen, {
      userId: args.userId as unknown as string,
      contentId: args.contentId as unknown as Id<"feedItems">,
    });
  },
});

/**
 * Mark recommendation as interacted with
 */
export const markRecommendationAsInteracted = mutation({
  args: {
    userId: v.id("users"),
    contentId: v.string(),
    reaction: v.optional(
      v.union(v.literal("like"), v.literal("dislike"), v.literal("neutral")),
    ),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      socialfeedMutations.markRecommendationAsInteracted,
      {
        userId: args.userId as unknown as string,
        contentId: args.contentId as unknown as Id<"feedItems">,
        reaction: args.reaction,
      },
    );
  },
});

/**
 * Generate content recommendations for a user
 */
export const generateUserRecommendations = mutation({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(socialfeedMutations.generateUserRecommendations, {
      userId: args.userId as unknown as string,
      limit: args.limit,
    });
  },
});

/**
 * Update trending metrics for a post (can be called manually)
 */
export const updatePostTrendingMetrics = mutation({
  args: {
    contentId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(socialfeedMutations.updatePostTrendingMetrics, {
      contentId: args.contentId as unknown as Id<"feedItems">,
    });
  },
});
