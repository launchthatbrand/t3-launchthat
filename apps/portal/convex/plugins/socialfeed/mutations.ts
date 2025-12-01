// import {
//   notifyComment,
//   notifyFollowers,
//   notifyMentions,
//   notifyReaction,
//   notifyShare,
// } from "../notifications/lib/feedNotifications";
import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { mutation } from "../../_generated/server";
import {
  generateRecommendations,
  markRecommendationInteracted,
  markRecommendationSeen,
} from "./lib/recommendationEngine";
import { updateTrendingMetrics } from "./lib/trendingAlgorithm";

// Helper functions for processing hashtags and mentions
async function processMentionsAndHashtags(
  ctx: MutationCtx,
  text: string,
  creatorId: Id<"users">,
  feedItemId?: Id<"feedItems">, // Optional feedItemId for notifications
): Promise<{
  mentions: string[];
  mentionedUserIds: Id<"users">[];
  hashtags: string[];
}> {
  // Extract mentions and hashtags using regex
  const mentionRegex = /@([a-zA-Z][a-zA-Z0-9._]{1,})\b/g;
  const hashtagRegex = /#([a-zA-Z0-9_]{1,})\b/g;

  // Get all mentions
  const mentions: string[] = [];
  const mentionedUserIds: Id<"users">[] = [];
  let mentionMatch;

  while ((mentionMatch = mentionRegex.exec(text)) !== null) {
    const username = mentionMatch[1];
    if (!username) continue;
    mentions.push(username);

    try {
      // Try to find the user by username
      const user = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", username))
        .first();

      if (user) {
        mentionedUserIds.push(user._id);

        // Notify the mentioned user (unless they're the post creator)
        if (user._id !== creatorId && feedItemId) {
          // await notifyMentions(ctx, {
          //   mentionerId: creatorId,
          //   content: text,
          //   feedItemId: feedItemId,
          // });
        }
      }
    } catch (error) {
      // Silently fail if username index doesn't exist yet
      console.error("Error finding user by username:", error);
    }
  }

  // Get all hashtags
  const hashtags: string[] = [];
  let hashtagMatch;

  while ((hashtagMatch = hashtagRegex.exec(text)) !== null) {
    const rawTag = hashtagMatch[1];
    if (!rawTag) continue;
    const tag = rawTag.toLowerCase();
    hashtags.push(tag);

    try {
      // Check if hashtag exists, if not create it
      const existingHashtag = await ctx.db
        .query("hashtags")
        .withIndex("by_tag", (q) => q.eq("tag", tag))
        .first();

      if (existingHashtag) {
        // Update usage count and last used
        await ctx.db.patch(existingHashtag._id, {
          usageCount: existingHashtag.usageCount + 1,
          lastUsed: Date.now(),
        });
      } else {
        // Create new hashtag record
        await ctx.db.insert("hashtags", {
          tag,
          usageCount: 1,
          lastUsed: Date.now(),
        });
      }
    } catch (error) {
      // Silently fail if hashtags table or index doesn't exist yet
      console.error("Error updating hashtag:", error);
    }
  }

  return { mentions, mentionedUserIds, hashtags };
}

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
  returns: v.id("feedItems"),
  handler: async (ctx, args) => {
    // Validate that the user exists
    const user = await ctx.db.get(args.creatorId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check visibility and moduleId combination validity
    if (
      args.visibility === "group" &&
      (!args.moduleType || args.moduleType !== "group")
    ) {
      throw new Error("Group visibility requires moduleType to be 'group'");
    }

    // Validate content
    if (args.content.trim() === "") {
      throw new Error("Content cannot be empty");
    }

    // Create the feed item first to get its ID for mention notifications
    const feedItemId = await ctx.db.insert("feedItems", {
      contentType: "post",
      creatorId: args.creatorId,
      content: args.content,
      mediaUrls: args.mediaUrls,
      visibility: args.visibility,
      moduleType: args.moduleType,
      moduleId: args.moduleId,
      mentions: [],
      mentionedUserIds: [],
      hashtags: [],
    });

    // Process mentions and hashtags with the feedItemId
    const { mentions, mentionedUserIds, hashtags } =
      await processMentionsAndHashtags(
        ctx,
        args.content,
        args.creatorId,
        feedItemId,
      );

    // Update the feed item with mentions and hashtags
    await ctx.db.patch(feedItemId, {
      mentions,
      mentionedUserIds,
      hashtags,
    });

    // For public posts, notify followers
    if (args.visibility === "public") {
      // await notifyFollowers(ctx, {
      //   creatorId: args.creatorId,
      //   postId: feedItemId,
      //   content: args.content,
      // });
    }

    // Update trending metrics for the new post
    await updateTrendingMetrics(ctx, feedItemId);

    return feedItemId;
  },
});

/**
 * Update an existing post
 */
export const updatePost = mutation({
  args: {
    postId: v.id("feedItems"),
    userId: v.id("users"),
    content: v.optional(v.string()),
    mediaUrls: v.optional(v.array(v.string())),
    visibility: v.optional(
      v.union(v.literal("public"), v.literal("private"), v.literal("group")),
    ),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Validate the post exists
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Verify user owns the post
    if (post.creatorId !== args.userId) {
      throw new Error("User does not have permission to update this post");
    }

    // Check if trying to change visibility to group without proper moduleType
    if (
      args.visibility === "group" &&
      (!post.moduleType || post.moduleType !== "group")
    ) {
      throw new Error("Group visibility requires moduleType to be 'group'");
    }

    // Prepare the update object
    const updateData: Partial<{
      content: string;
      mediaUrls: string[];
      visibility: "public" | "private" | "group";
    }> = {};

    if (args.content !== undefined) {
      if (args.content.trim() === "") {
        throw new Error("Content cannot be empty");
      }
      updateData.content = args.content;
    }

    if (args.mediaUrls !== undefined) {
      updateData.mediaUrls = args.mediaUrls;
    }

    if (args.visibility !== undefined) {
      updateData.visibility = args.visibility;
    }

    // Apply the update
    await ctx.db.patch(args.postId, updateData);

    return true;
  },
});

/**
 * Delete a post (soft delete)
 */
export const deletePost = mutation({
  args: {
    postId: v.id("feedItems"),
    userId: v.id("users"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Validate the post exists
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Verify user owns the post
    if (post.creatorId !== args.userId) {
      throw new Error("User does not have permission to delete this post");
    }

    // For soft delete, we'll add a field to mark the post as deleted
    // rather than actually removing it from the database
    await ctx.db.patch(args.postId, {
      deleted: true,
      deletedAt: Date.now(),
    });

    // Optional: Delete related comments and reactions
    // This would require finding all comments for this post and marking them as deleted too
    // For a more complex implementation, this could be moved to a separate background process

    return true;
  },
});

/**
 * Share an existing feed item
 */
export const shareContent = mutation({
  args: {
    creatorId: v.id("users"),
    originalContentId: v.id("feedItems"),
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
  returns: v.id("feedItems"),
  handler: async (ctx, args) => {
    // Validate that the user exists
    const user = await ctx.db.get(args.creatorId);
    if (!user) {
      throw new Error("User not found");
    }

    // Validate that the original content exists
    const originalContent = await ctx.db.get(args.originalContentId);
    if (!originalContent) {
      throw new Error("Original content not found");
    }

    // Check if the original content is deleted
    if (originalContent.deleted) {
      throw new Error("Cannot share deleted content");
    }

    // Check visibility and moduleId combination validity
    if (
      args.visibility === "group" &&
      (!args.moduleType || args.moduleType !== "group")
    ) {
      throw new Error("Group visibility requires moduleType to be 'group'");
    }

    // Create the feed item as a share
    const feedItemId = await ctx.db.insert("feedItems", {
      contentType: "share",
      creatorId: args.creatorId,
      content: args.content ?? "",
      originalContentId: args.originalContentId,
      visibility: args.visibility,
      moduleType: args.moduleType,
      moduleId: args.moduleId,
    });

    // Send notification to the original content creator
    // await notifyShare(ctx, {
    //   sharerId: args.creatorId,
    //   originalContentId: args.originalContentId,
    //   newShareId: feedItemId,
    // });

    // Update trending metrics for the original content that was shared
    if (args.originalContentId) {
      await updateTrendingMetrics(ctx, args.originalContentId);
    }

    return feedItemId;
  },
});

/**
 * Add a reaction to a feed item
 */
export const addReaction = mutation({
  args: {
    userId: v.id("users"),
    feedItemId: v.id("feedItems"),
    reactionType: v.union(
      v.literal("like"),
      v.literal("love"),
      v.literal("celebrate"),
      v.literal("support"),
      v.literal("insightful"),
      v.literal("curious"),
    ),
  },
  returns: v.id("reactions"),
  handler: async (ctx, args) => {
    // Validate that the user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Validate that the feed item exists
    const feedItem = await ctx.db.get(args.feedItemId);
    if (!feedItem) {
      throw new Error("Feed item not found");
    }

    // Check if the item is deleted
    if (feedItem.deleted) {
      throw new Error("Cannot react to deleted content");
    }

    // Check if the user has already reacted to this feed item
    const existingReaction = await ctx.db
      .query("reactions")
      .withIndex("by_user_and_item", (q) =>
        q.eq("userId", args.userId).eq("feedItemId", args.feedItemId),
      )
      .first();

    // If a reaction already exists, update it
    if (existingReaction) {
      await ctx.db.patch(existingReaction._id, {
        reactionType: args.reactionType,
      });

      // We don't send a notification for reaction updates
      return existingReaction._id;
    }

    // Otherwise, create a new reaction
    const reactionId = await ctx.db.insert("reactions", {
      userId: args.userId,
      feedItemId: args.feedItemId,
      reactionType: args.reactionType,
    });

    // Send notification to the post creator
    // await notifyReaction(ctx, {
    //   reactorId: args.userId,
    //   feedItemId: args.feedItemId,
    //   reactionType: args.reactionType,
    // });

    // Update trending metrics for the post that was reacted to
    await updateTrendingMetrics(ctx, args.feedItemId);

    return reactionId;
  },
});

/**
 * Add a comment to a feed item
 */
export const addComment = mutation({
  args: {
    userId: v.id("users"),
    feedItemId: v.id("feedItems"),
    content: v.string(),
    parentCommentId: v.optional(v.id("comments")),
    mediaUrls: v.optional(v.array(v.string())),
  },
  returns: v.id("comments"),
  handler: async (ctx, args) => {
    // Validate that the user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Validate that the feed item exists
    const feedItem = await ctx.db.get(args.feedItemId);
    if (!feedItem) {
      throw new Error("Feed item not found");
    }

    // Check if the item is deleted
    if (feedItem.deleted) {
      throw new Error("Cannot comment on deleted content");
    }

    // Validate content
    if (args.content.trim() === "") {
      throw new Error("Comment content cannot be empty");
    }

    // If parentCommentId is provided, validate that it exists
    if (args.parentCommentId) {
      const parentComment = await ctx.db.get(args.parentCommentId);
      if (!parentComment) {
        throw new Error("Parent comment not found");
      }

      // Check if parent comment is deleted
      if (parentComment.deleted) {
        throw new Error("Cannot reply to a deleted comment");
      }
    }

    // Create the comment first to get its ID for mention notifications
    const commentId = await ctx.db.insert("comments", {
      userId: args.userId,
      parentId: args.feedItemId,
      parentType: "feedItem",
      content: args.content,
      parentCommentId: args.parentCommentId,
      mediaUrls: args.mediaUrls,
      updatedAt: Date.now(),
      mentions: [],
      mentionedUserIds: [],
      hashtags: [],
    });

    // Process mentions and hashtags with the feedItemId for mention notifications
    const { mentions, mentionedUserIds, hashtags } =
      await processMentionsAndHashtags(
        ctx,
        args.content,
        args.userId,
        args.feedItemId,
      );

    // Update the comment with mentions and hashtags
    await ctx.db.patch(commentId, {
      mentions,
      mentionedUserIds,
      hashtags,
    });

    // Send notification
    // await notifyComment(ctx, {
    //   commenterId: args.userId,
    //   feedItemId: args.feedItemId,
    //   commentId,
    //   content: args.content,
    //   parentCommentId: args.parentCommentId,
    // });

    // Update trending metrics for the post that was commented on
    await updateTrendingMetrics(ctx, args.feedItemId);

    return commentId;
  },
});

/**
 * Follow a topic
 */
export const followTopic = mutation({
  args: {
    userId: v.id("users"),
    topicId: v.id("hashtags"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Check if user and topic exist
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const topic = await ctx.db.get(args.topicId);
    if (!topic) {
      throw new Error("Topic not found");
    }

    // Check if already following
    const existingFollow = await ctx.db
      .query("topicFollows")
      .withIndex("by_user_and_topic", (q) =>
        q.eq("userId", args.userId).eq("topicId", args.topicId),
      )
      .first();

    if (existingFollow) {
      // Already following, no need to create a duplicate
      return true;
    }

    // Create the follow relationship
    await ctx.db.insert("topicFollows", {
      userId: args.userId,
      topicId: args.topicId,
      followedAt: Date.now(),
    });

    // Update follower count for the topic
    const currentFollowerCount = topic.followerCount ?? 0;
    await ctx.db.patch(args.topicId, {
      followerCount: currentFollowerCount + 1,
      // If not already marked as a topic, mark it as one
      isTopic: true,
    });

    // Generate new recommendations based on this follow
    await generateRecommendations(ctx, args.userId);

    return true;
  },
});

/**
 * Unfollow a topic
 */
export const unfollowTopic = mutation({
  args: {
    userId: v.id("users"),
    topicId: v.id("hashtags"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Find the follow relationship
    const existingFollow = await ctx.db
      .query("topicFollows")
      .withIndex("by_user_and_topic", (q) =>
        q.eq("userId", args.userId).eq("topicId", args.topicId),
      )
      .first();

    if (!existingFollow) {
      // Not following, nothing to do
      return false;
    }

    // Delete the follow relationship
    await ctx.db.delete(existingFollow._id);

    // Update follower count for the topic
    const topic = await ctx.db.get(args.topicId);
    if (topic) {
      const currentFollowerCount = topic.followerCount ?? 0;
      await ctx.db.patch(args.topicId, {
        followerCount: Math.max(0, currentFollowerCount - 1),
      });
    }

    return true;
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
  returns: v.id("hashtags"),
  handler: async (ctx, args) => {
    // Normalize the tag (remove # if present and lowercase)
    const normalizedTag = args.tag.startsWith("#")
      ? args.tag.slice(1).toLowerCase()
      : args.tag.toLowerCase();

    // Check if topic/hashtag already exists
    const existingTopic = await ctx.db
      .query("hashtags")
      .withIndex("by_tag", (q) => q.eq("tag", normalizedTag))
      .first();

    if (existingTopic) {
      // Update existing topic
      await ctx.db.patch(existingTopic._id, {
        description: args.description,
        category: args.category,
        coverImage: args.coverImage,
        isTopic: true,
        // Don't reset usage count or last used
      });

      return existingTopic._id;
    } else {
      // Create new topic
      const topicId = await ctx.db.insert("hashtags", {
        tag: normalizedTag,
        description: args.description,
        category: args.category,
        coverImage: args.coverImage,
        isTopic: true,
        usageCount: 0,
        lastUsed: Date.now(),
        followerCount: 0,
      });

      return topicId;
    }
  },
});

/**
 * Mark recommendation as seen
 */
export const markRecommendationAsSeen = mutation({
  args: {
    userId: v.id("users"),
    contentId: v.id("feedItems"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await markRecommendationSeen(ctx, args.userId, args.contentId);
    return true;
  },
});

/**
 * Mark recommendation as interacted with
 */
export const markRecommendationAsInteracted = mutation({
  args: {
    userId: v.id("users"),
    contentId: v.id("feedItems"),
    reaction: v.optional(
      v.union(v.literal("like"), v.literal("dislike"), v.literal("neutral")),
    ),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await markRecommendationInteracted(
      ctx,
      args.userId,
      args.contentId,
      args.reaction,
    );
    return true;
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
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await generateRecommendations(ctx, args.userId, args.limit);
    return true;
  },
});

/**
 * Update trending metrics for a post (can be called manually)
 */
export const updatePostTrendingMetrics = mutation({
  args: {
    contentId: v.id("feedItems"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await updateTrendingMetrics(ctx, args.contentId);
    return true;
  },
});
