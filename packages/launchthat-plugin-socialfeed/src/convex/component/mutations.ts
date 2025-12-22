import { v } from "convex/values";

import type { MutationCtx } from "./_generated/server";
import { mutation } from "./_generated/server";
import {
  generateRecommendations,
  markRecommendationInteracted,
  markRecommendationSeen,
} from "./lib/recommendationEngine";
import { updateTrendingMetrics } from "./lib/trendingAlgorithm";

const processMentionsAndHashtags = async (
  ctx: MutationCtx,
  text: string,
  _creatorId: string,
): Promise<{
  mentions: string[];
  mentionedUserIds: string[];
  hashtags: string[];
}> => {
  const mentionRegex = /@([a-zA-Z][a-zA-Z0-9._]{1,})\b/g;
  const hashtagRegex = /#([a-zA-Z0-9_]{1,})\b/g;

  const mentions: string[] = [];
  const mentionedUserIds: string[] = [];
  let mentionMatch: RegExpExecArray | null;
  while ((mentionMatch = mentionRegex.exec(text)) !== null) {
    const username = mentionMatch[1];
    if (!username) continue;
    mentions.push(username);
  }

  const hashtags: string[] = [];
  let hashtagMatch: RegExpExecArray | null;
  while ((hashtagMatch = hashtagRegex.exec(text)) !== null) {
    const rawTag = hashtagMatch[1];
    if (!rawTag) continue;
    const tag = rawTag.toLowerCase();
    hashtags.push(tag);

    const existingHashtag = await ctx.db
      .query("hashtags")
      .withIndex("by_tag", (q) => q.eq("tag", tag))
      .first();

    if (existingHashtag) {
      await ctx.db.patch(existingHashtag._id, {
        usageCount: existingHashtag.usageCount + 1,
        lastUsed: Date.now(),
      });
    } else {
      await ctx.db.insert("hashtags", {
        tag,
        usageCount: 1,
        lastUsed: Date.now(),
      });
    }
  }

  return { mentions, mentionedUserIds, hashtags };
};

export const createPost = mutation({
  args: {
    creatorId: v.string(),
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
    if (args.visibility === "group" && args.moduleType !== "group") {
      throw new Error("Group visibility requires moduleType to be 'group'");
    }

    if (args.content.trim() === "") {
      throw new Error("Content cannot be empty");
    }

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

    const { mentions, mentionedUserIds, hashtags } =
      await processMentionsAndHashtags(ctx, args.content, args.creatorId);

    await ctx.db.patch(feedItemId, {
      mentions,
      mentionedUserIds,
      hashtags,
    });

    await updateTrendingMetrics(ctx, feedItemId);
    return feedItemId;
  },
});

export const updatePost = mutation({
  args: {
    postId: v.id("feedItems"),
    userId: v.string(),
    content: v.optional(v.string()),
    mediaUrls: v.optional(v.array(v.string())),
    visibility: v.optional(
      v.union(v.literal("public"), v.literal("private"), v.literal("group")),
    ),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    if (post.creatorId !== args.userId) {
      throw new Error("User does not have permission to update this post");
    }

    if (args.visibility === "group" && post.moduleType !== "group") {
      throw new Error("Group visibility requires moduleType to be 'group'");
    }

    const updateData: Partial<{
      content: string;
      mediaUrls: string[];
      visibility: "public" | "private" | "group";
    }> = {};

    if (args.content !== undefined) {
      if (args.content.trim() === "")
        throw new Error("Content cannot be empty");
      updateData.content = args.content;
    }
    if (args.mediaUrls !== undefined) updateData.mediaUrls = args.mediaUrls;
    if (args.visibility !== undefined) updateData.visibility = args.visibility;

    await ctx.db.patch(args.postId, updateData);
    return true;
  },
});

export const deletePost = mutation({
  args: { postId: v.id("feedItems"), userId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    if (post.creatorId !== args.userId) {
      throw new Error("User does not have permission to delete this post");
    }

    await ctx.db.patch(args.postId, { deleted: true, deletedAt: Date.now() });
    return true;
  },
});

export const shareContent = mutation({
  args: {
    creatorId: v.string(),
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
    const originalContent = await ctx.db.get(args.originalContentId);
    if (!originalContent) throw new Error("Original content not found");
    if (originalContent.deleted)
      throw new Error("Cannot share deleted content");

    if (args.visibility === "group" && args.moduleType !== "group") {
      throw new Error("Group visibility requires moduleType to be 'group'");
    }

    const feedItemId = await ctx.db.insert("feedItems", {
      contentType: "share",
      creatorId: args.creatorId,
      content: args.content ?? "",
      originalContentId: args.originalContentId,
      visibility: args.visibility,
      moduleType: args.moduleType,
      moduleId: args.moduleId,
    });

    await updateTrendingMetrics(ctx, args.originalContentId);
    return feedItemId;
  },
});

export const addReaction = mutation({
  args: {
    userId: v.string(),
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
    const feedItem = await ctx.db.get(args.feedItemId);
    if (!feedItem) throw new Error("Feed item not found");
    if (feedItem.deleted) throw new Error("Cannot react to deleted content");

    const existingReaction = await ctx.db
      .query("reactions")
      .withIndex("by_user_and_item", (q) =>
        q.eq("userId", args.userId).eq("feedItemId", args.feedItemId),
      )
      .first();

    if (existingReaction) {
      await ctx.db.patch(existingReaction._id, {
        reactionType: args.reactionType,
      });
      return existingReaction._id;
    }

    const reactionId = await ctx.db.insert("reactions", {
      userId: args.userId,
      feedItemId: args.feedItemId,
      reactionType: args.reactionType,
    });

    await updateTrendingMetrics(ctx, args.feedItemId);
    return reactionId;
  },
});

export const addComment = mutation({
  args: {
    userId: v.string(),
    feedItemId: v.optional(v.id("feedItems")),
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
    content: v.string(),
    parentCommentId: v.optional(v.id("comments")),
    mediaUrls: v.optional(v.array(v.string())),
  },
  returns: v.id("comments"),
  handler: async (ctx, args) => {
    const resolvedParentId =
      args.parentId ?? (args.feedItemId ? String(args.feedItemId) : undefined);
    const resolvedParentType =
      args.parentType ?? (args.feedItemId ? "feedItem" : undefined);

    if (!resolvedParentId || !resolvedParentType) {
      throw new Error(
        "Missing comment parent. Provide (parentId + parentType) or feedItemId.",
      );
    }

    if (resolvedParentType === "feedItem") {
      if (!args.feedItemId) {
        throw new Error("feedItemId is required when parentType is feedItem");
      }
      const feedItem = await ctx.db.get(args.feedItemId);
      if (!feedItem) throw new Error("Feed item not found");
      if (feedItem.deleted)
        throw new Error("Cannot comment on deleted content");
    }

    if (args.content.trim() === "") {
      throw new Error("Comment content cannot be empty");
    }

    if (args.parentCommentId) {
      const parentComment = await ctx.db.get(args.parentCommentId);
      if (!parentComment) throw new Error("Parent comment not found");
      if (parentComment.deleted)
        throw new Error("Cannot reply to a deleted comment");
    }

    const commentId = await ctx.db.insert("comments", {
      userId: args.userId,
      parentId: resolvedParentId,
      parentType: resolvedParentType,
      content: args.content,
      parentCommentId: args.parentCommentId,
      mediaUrls: args.mediaUrls,
      updatedAt: Date.now(),
      mentions: [],
      mentionedUserIds: [],
      hashtags: [],
    });

    const { mentions, mentionedUserIds, hashtags } =
      await processMentionsAndHashtags(ctx, args.content, args.userId);

    await ctx.db.patch(commentId, { mentions, mentionedUserIds, hashtags });

    if (resolvedParentType === "feedItem" && args.feedItemId) {
      await updateTrendingMetrics(ctx, args.feedItemId);
    }
    return commentId;
  },
});

export const updateComment = mutation({
  args: {
    commentId: v.id("comments"),
    userId: v.string(),
    content: v.string(),
    asAdmin: v.optional(v.boolean()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.deleted) throw new Error("Cannot edit a deleted comment");

    const isOwner = comment.userId === args.userId;
    if (!isOwner && !args.asAdmin) {
      throw new Error("User does not have permission to edit this comment");
    }

    if (args.content.trim() === "") {
      throw new Error("Comment content cannot be empty");
    }

    const { mentions, mentionedUserIds, hashtags } =
      await processMentionsAndHashtags(ctx, args.content, args.userId);

    await ctx.db.patch(args.commentId, {
      content: args.content.trim(),
      updatedAt: Date.now(),
      mentions,
      mentionedUserIds,
      hashtags,
    });

    return true;
  },
});

export const deleteComment = mutation({
  args: {
    commentId: v.id("comments"),
    userId: v.string(),
    asAdmin: v.optional(v.boolean()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) return true;

    const isOwner = comment.userId === args.userId;
    if (!isOwner && !args.asAdmin) {
      throw new Error("User does not have permission to delete this comment");
    }

    await ctx.db.patch(args.commentId, {
      deleted: true,
      deletedAt: Date.now(),
    });

    // Best-effort: update trending for feed items.
    if (comment.parentType === "feedItem") {
      await updateTrendingMetrics(ctx, comment.parentId as any);
    }

    return true;
  },
});

export const followTopic = mutation({
  args: { userId: v.string(), topicId: v.id("hashtags") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const topic = await ctx.db.get(args.topicId);
    if (!topic) throw new Error("Topic not found");

    const existingFollow = await ctx.db
      .query("topicFollows")
      .withIndex("by_user_and_topic", (q) =>
        q.eq("userId", args.userId).eq("topicId", args.topicId),
      )
      .first();
    if (existingFollow) return true;

    await ctx.db.insert("topicFollows", {
      userId: args.userId,
      topicId: args.topicId,
      followedAt: Date.now(),
    });

    const currentFollowerCount = topic.followerCount ?? 0;
    await ctx.db.patch(args.topicId, {
      followerCount: currentFollowerCount + 1,
      isTopic: true,
    });

    await generateRecommendations(ctx, args.userId);
    return true;
  },
});

export const unfollowTopic = mutation({
  args: { userId: v.string(), topicId: v.id("hashtags") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existingFollow = await ctx.db
      .query("topicFollows")
      .withIndex("by_user_and_topic", (q) =>
        q.eq("userId", args.userId).eq("topicId", args.topicId),
      )
      .first();
    if (!existingFollow) return false;

    await ctx.db.delete(existingFollow._id);

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

export const createOrUpdateTopic = mutation({
  args: {
    tag: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    coverImage: v.optional(v.string()),
  },
  returns: v.id("hashtags"),
  handler: async (ctx, args) => {
    const normalizedTag = args.tag.startsWith("#")
      ? args.tag.slice(1).toLowerCase()
      : args.tag.toLowerCase();

    const existingTopic = await ctx.db
      .query("hashtags")
      .withIndex("by_tag", (q) => q.eq("tag", normalizedTag))
      .first();

    if (existingTopic) {
      await ctx.db.patch(existingTopic._id, {
        description: args.description,
        category: args.category,
        coverImage: args.coverImage,
        isTopic: true,
      });
      return existingTopic._id;
    }

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
  },
});

export const markRecommendationAsSeen = mutation({
  args: { userId: v.string(), contentId: v.id("feedItems") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await markRecommendationSeen(ctx, args.userId, args.contentId);
    return true;
  },
});

export const markRecommendationAsInteracted = mutation({
  args: {
    userId: v.string(),
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

export const generateUserRecommendations = mutation({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await generateRecommendations(ctx, args.userId, args.limit);
    return true;
  },
});

export const updatePostTrendingMetrics = mutation({
  args: { contentId: v.id("feedItems") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await updateTrendingMetrics(ctx, args.contentId);
    return true;
  },
});
