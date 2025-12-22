import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";
import { hashtagResponseValidator } from "./hashtags/schema";
import { findSimilarUsers } from "./lib/recommendationEngine";

/**
 * NOTE: Convex component runtime currently does not support `.paginate()`.
 * We implement lightweight pagination using `.take()` with a cursor derived from
 * `_creationTime`. Cursor format: `${_creationTime}:${_id}`.
 */
const decodeCursorTime = (cursor: string | null): number | null => {
  if (!cursor) return null;
  const [rawTime] = cursor.split(":");
  const time = rawTime ? Number(rawTime) : NaN;
  return Number.isFinite(time) ? time : null;
};

const encodeCursor = (doc: { _creationTime: number; _id: unknown }): string =>
  `${doc._creationTime}:${String(doc._id)}`;

async function takePage<T extends { _creationTime: number; _id: unknown }>(
  queryBuilder: any,
  paginationOpts: { numItems: number; cursor: string | null },
  order: "asc" | "desc",
): Promise<{ page: T[]; continueCursor: string | null; isDone: boolean }> {
  const cursorTime = decodeCursorTime(paginationOpts.cursor);
  let q = queryBuilder;
  if (cursorTime !== null) {
    q = q.filter((qb: any) =>
      order === "desc"
        ? qb.lt(qb.field("_creationTime"), cursorTime)
        : qb.gt(qb.field("_creationTime"), cursorTime),
    );
  }

  const limit = Math.max(1, paginationOpts.numItems);
  const rows: T[] = await q.take(limit + 1);
  const page = rows.slice(0, limit);
  const isDone = rows.length <= limit;
  const continueCursor =
    isDone || page.length === 0 ? null : encodeCursor(page[page.length - 1]!);
  return { page, continueCursor, isDone };
}

interface EnrichedUser {
  _id: string;
  name: string;
  image?: string;
}

const buildPlaceholderUser = (userId: string): EnrichedUser => ({
  _id: userId,
  name: "Unknown User",
  image: undefined,
});

const commentReturnType = v.object({
  _id: v.id("comments"),
  _creationTime: v.number(),
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
  userId: v.string(),
  content: v.string(),
  parentCommentId: v.optional(v.id("comments")),
  mediaUrls: v.optional(v.array(v.string())),
  updatedAt: v.optional(v.number()),
  mentions: v.optional(v.array(v.string())),
  mentionedUserIds: v.optional(v.array(v.string())),
  hashtags: v.optional(v.array(v.string())),
  user: v.object({
    _id: v.string(),
    name: v.string(),
    image: v.optional(v.string()),
  }),
  repliesCount: v.number(),
});

async function enrichComments(ctx: QueryCtx, page: Doc<"comments">[]) {
  if (page.length === 0) return [];

  const commentsWithCounts = await Promise.all(
    page.map(async (comment) => {
      const repliesCount = await ctx.db
        .query("comments")
        .withIndex("by_parentCommentId", (q) =>
          q.eq("parentCommentId", comment._id),
        )
        .collect()
        .then((replies) => replies.length);

      return {
        ...comment,
        repliesCount,
        user: buildPlaceholderUser(comment.userId),
      };
    }),
  );

  return commentsWithCounts;
}

const feedItemReturnType = v.object({
  _id: v.id("feedItems"),
  _creationTime: v.number(),
  contentType: v.union(
    v.literal("post"),
    v.literal("share"),
    v.literal("comment"),
  ),
  creatorId: v.string(),
  content: v.string(),
  mediaUrls: v.optional(v.array(v.string())),
  visibility: v.union(
    v.literal("public"),
    v.literal("private"),
    v.literal("group"),
  ),
  originalContentId: v.optional(v.id("feedItems")),
  moduleType: v.optional(
    v.union(
      v.literal("blog"),
      v.literal("course"),
      v.literal("group"),
      v.literal("event"),
    ),
  ),
  moduleId: v.optional(v.string()),
  reactionsCount: v.number(),
  commentsCount: v.number(),
  creator: v.object({
    _id: v.string(),
    name: v.string(),
    image: v.optional(v.string()),
  }),
  hashtags: v.optional(v.array(v.string())),
  mentions: v.optional(v.array(v.string())),
  mentionedUserIds: v.optional(v.array(v.string())),
});

async function enrichFeedItems(ctx: QueryCtx, page: Doc<"feedItems">[]) {
  if (page.length === 0) return [];

  const itemsWithCounts = await Promise.all(
    page.map(async (item) => {
      const reactionsCount = await ctx.db
        .query("reactions")
        .withIndex("by_feed_item", (q) => q.eq("feedItemId", item._id))
        .collect()
        .then((reactions) => reactions.length);

      const commentsCount = await ctx.db
        .query("comments")
        .withIndex("by_parent", (q) =>
          q.eq("parentId", item._id).eq("parentType", "feedItem"),
        )
        .collect()
        .then((comments) => comments.length);

      return {
        ...item,
        reactionsCount,
        commentsCount,
        creator: buildPlaceholderUser(item.creatorId),
        hashtags: item.hashtags ?? [],
        mentions: item.mentions ?? [],
        mentionedUserIds: item.mentionedUserIds ?? [],
      };
    }),
  );

  return itemsWithCounts;
}

export const getUniversalFeed = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(feedItemReturnType),
    continueCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const baseQuery = ctx.db
      .query("feedItems")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .order("desc");

    const { page, continueCursor, isDone } = await takePage<Doc<"feedItems">>(
      baseQuery,
      args.paginationOpts,
      "desc",
    );

    const enrichedFeedItems = await enrichFeedItems(ctx, page);
    return { page: enrichedFeedItems, continueCursor, isDone };
  },
});

export const getPersonalizedFeed = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(feedItemReturnType),
    continueCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", args.userId).eq("followType", "user"),
      )
      .collect();

    const followedUserIds = subscriptions.map((sub) => sub.followId);

    const baseQuery = ctx.db
      .query("feedItems")
      .filter((q) => {
        if (followedUserIds.length === 0) {
          return q.eq(q.field("visibility"), "public");
        }
        return q.or(
          q.eq(q.field("visibility"), "public"),
          q.and(
            q.eq(q.field("visibility"), "private"),
            q.or(
              q.eq(q.field("creatorId"), args.userId),
              ...(followedUserIds.length > 0
                ? followedUserIds.map((id) => q.eq(q.field("creatorId"), id))
                : [q.eq(q.field("creatorId"), args.userId)]),
            ),
          ),
        );
      })
      .order("desc");

    const { page, continueCursor, isDone } = await takePage<Doc<"feedItems">>(
      baseQuery,
      args.paginationOpts,
      "desc",
    );

    const enrichedFeedItems = await enrichFeedItems(ctx, page);
    return { page: enrichedFeedItems, continueCursor, isDone };
  },
});

export const getGroupFeed = query({
  args: {
    groupId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(feedItemReturnType),
    continueCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const baseQuery = ctx.db
      .query("feedItems")
      .withIndex("by_module", (q) =>
        q.eq("moduleType", "group").eq("moduleId", args.groupId),
      )
      .order("desc");

    const { page, continueCursor, isDone } = await takePage<Doc<"feedItems">>(
      baseQuery,
      args.paginationOpts,
      "desc",
    );

    const enrichedFeedItems = await enrichFeedItems(ctx, page);
    return { page: enrichedFeedItems, continueCursor, isDone };
  },
});

export const getUserProfileFeed = query({
  args: {
    profileId: v.string(),
    viewerId: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(feedItemReturnType),
    continueCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const isSameUser = args.viewerId === args.profileId;

    let feedItemsQuery = ctx.db
      .query("feedItems")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.profileId));

    if (!isSameUser) {
      feedItemsQuery = feedItemsQuery.filter((q) =>
        q.eq(q.field("visibility"), "public"),
      );
    }

    const baseQuery = feedItemsQuery.order("desc");

    const { page, continueCursor, isDone } = await takePage<Doc<"feedItems">>(
      baseQuery,
      args.paginationOpts,
      "desc",
    );

    const enrichedFeedItems = await enrichFeedItems(ctx, page);
    return { page: enrichedFeedItems, continueCursor, isDone };
  },
});

export const getFeedItem = query({
  args: { feedItemId: v.id("feedItems") },
  returns: v.union(v.null(), feedItemReturnType),
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.feedItemId);
    if (!item) return null;
    const [enrichedItem] = await enrichFeedItems(ctx, [item]);
    return enrichedItem ?? null;
  },
});

export const getHashtagFeed = query({
  args: {
    tag: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    hashtag: v.union(v.null(), hashtagResponseValidator),
    feedItems: v.object({
      page: v.array(feedItemReturnType),
      continueCursor: v.union(v.string(), v.null()),
      isDone: v.boolean(),
    }),
  }),
  handler: async (ctx, args) => {
    const tag = args.tag.toLowerCase();
    const hashtagDoc = await ctx.db
      .query("hashtags")
      .withIndex("by_tag", (q) => q.eq("tag", tag))
      .first();

    if (!hashtagDoc) {
      return {
        hashtag: null,
        feedItems: { page: [], continueCursor: null, isDone: true },
      };
    }

    const baseQuery = ctx.db
      .query("feedItems")
      .withIndex("by_hashtag", (q) => q.eq("hashtags", [tag]))
      .order("desc");

    const { page, continueCursor, isDone } = await takePage<Doc<"feedItems">>(
      baseQuery,
      args.paginationOpts,
      "desc",
    );

    const enrichedFeedItems = await enrichFeedItems(ctx, page);
    return {
      hashtag: hashtagDoc,
      feedItems: { page: enrichedFeedItems, continueCursor, isDone },
    };
  },
});

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
  returns: v.object({
    page: v.array(commentReturnType),
    continueCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const queryBuilder = ctx.db
      .query("comments")
      .withIndex("by_parent", (q) =>
        q.eq("parentId", args.parentId).eq("parentType", args.parentType),
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("parentCommentId"), undefined),
          q.neq(q.field("deleted"), true),
        ),
      );

    const orderedQuery =
      args.sortOrder === "oldest"
        ? queryBuilder.order("asc")
        : queryBuilder.order("desc");

    const { page, continueCursor, isDone } = await takePage<Doc<"comments">>(
      orderedQuery,
      args.paginationOpts,
      args.sortOrder === "oldest" ? "asc" : "desc",
    );

    const enrichedComments = await enrichComments(ctx, page);
    return { page: enrichedComments, continueCursor, isDone };
  },
});

export const getReplies = query({
  args: {
    parentCommentId: v.id("comments"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(commentReturnType),
    continueCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const queryBuilder = ctx.db
      .query("comments")
      .withIndex("by_parentCommentId", (q) =>
        q.eq("parentCommentId", args.parentCommentId),
      );

    const orderedQuery = queryBuilder
      .filter((q) => q.neq(q.field("deleted"), true))
      .order("asc");

    const { page, continueCursor, isDone } = await takePage<Doc<"comments">>(
      orderedQuery,
      args.paginationOpts,
      "asc",
    );

    const enrichedComments = await enrichComments(ctx, page);
    return { page: enrichedComments, continueCursor, isDone };
  },
});

export const getAllCommentsForParent = query({
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
  returns: v.array(
    v.object({
      _id: v.id("comments"),
      _creationTime: v.number(),
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
      userId: v.string(),
      content: v.string(),
      parentCommentId: v.optional(v.id("comments")),
      mediaUrls: v.optional(v.array(v.string())),
      updatedAt: v.optional(v.number()),
      mentions: v.optional(v.array(v.string())),
      mentionedUserIds: v.optional(v.array(v.string())),
      hashtags: v.optional(v.array(v.string())),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) =>
        q.eq("parentId", args.parentId).eq("parentType", args.parentType),
      )
      .filter((q) => q.neq(q.field("deleted"), true))
      .order("asc")
      .collect();
  },
});

export const searchUsersForMentions = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.string(),
      name: v.string(),
      image: v.optional(v.string()),
    }),
  ),
  handler: async (_ctx, args) => {
    if (args.query.length < 2) return [];
    // Component is self-contained and does not own users. Resolution is external.
    return [];
  },
});

export const getRecommendedContent = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(feedItemReturnType),
    continueCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const recommendations = await findSimilarUsers(ctx, args.userId);

    const baseQuery = ctx.db
      .query("feedItems")
      .filter((q) =>
        q.or(
          ...recommendations.map((id) => q.eq(q.field("creatorId"), id)),
          q.eq(q.field("visibility"), "public"),
        ),
      )
      .order("desc");

    const { page, continueCursor, isDone } = await takePage<Doc<"feedItems">>(
      baseQuery,
      args.paginationOpts,
      "desc",
    );

    const enrichedFeedItems = await enrichFeedItems(ctx, page);
    return { page: enrichedFeedItems, continueCursor, isDone };
  },
});

export const getTopics = query({
  args: {
    paginationOpts: paginationOptsValidator,
    query: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  returns: v.array(hashtagResponseValidator),
  handler: async (ctx, args) => {
    let topicsQuery = ctx.db
      .query("hashtags")
      .withIndex("by_isTopic", (q) => q.eq("isTopic", true));

    if (args.category) {
      topicsQuery = ctx.db
        .query("hashtags")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .filter((q) => q.eq(q.field("isTopic"), true));
    }

    if (args.query) {
      const searchLower = args.query.toLowerCase();
      topicsQuery = topicsQuery.filter((q) =>
        q.or(
          q.eq(q.field("tag"), searchLower),
          q.eq(q.field("description"), searchLower),
        ),
      );
    }

    const orderedQuery = topicsQuery.order("desc");
    const page = await orderedQuery.take(args.paginationOpts.numItems);
    return page;
  },
});

export const getUserFollowedTopics = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.array(hashtagResponseValidator),
  handler: async (ctx, args) => {
    const orderedQuery = ctx.db
      .query("topicFollows")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    const page = await orderedQuery.take(args.paginationOpts.numItems);

    if (page.length === 0) return [];

    const topicIds = page.map((follow) => follow.topicId);
    const topics = await Promise.all(
      topicIds.map(async (id) => await ctx.db.get(id)),
    );
    return topics.filter(
      (topic): topic is NonNullable<typeof topic> => topic !== null,
    );
  },
});

export const getTopicSuggestions = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(hashtagResponseValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const userFollows = await ctx.db
      .query("topicFollows")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const followedTopicIds = new Set(
      userFollows.map((f) => f.topicId.toString()),
    );

    const userReactions = await ctx.db
      .query("reactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const contentIds = userReactions.map((r) => r.feedItemId);
    const engagedContent = await Promise.all(
      contentIds.map(async (id) => await ctx.db.get(id)),
    );

    const engagedHashtags = new Set<string>();
    engagedContent.forEach((content) => {
      if (content?.hashtags)
        content.hashtags.forEach((tag) => engagedHashtags.add(tag));
    });

    const similarUserIds = await findSimilarUsers(ctx, args.userId, 5);

    const similarUserFollows = await Promise.all(
      similarUserIds.map(async (id) =>
        ctx.db
          .query("topicFollows")
          .withIndex("by_user", (q) => q.eq("userId", id))
          .collect(),
      ),
    );

    const similarUserTopicIds = new Set<string>();
    similarUserFollows.forEach((follows) => {
      follows.forEach((follow) =>
        similarUserTopicIds.add(follow.topicId.toString()),
      );
    });

    const popularTopics = await ctx.db
      .query("hashtags")
      .withIndex("by_followerCount", (q) => q)
      .order("desc")
      .filter((q) => q.eq(q.field("isTopic"), true))
      .take(20);

    const suggestions: Doc<"hashtags">[] = [];

    if (engagedHashtags.size > 0) {
      const engagedTopicDocs = await Promise.all(
        Array.from(engagedHashtags).map(async (tag) =>
          ctx.db
            .query("hashtags")
            .withIndex("by_tag", (q) => q.eq("tag", tag))
            .first(),
        ),
      );

      suggestions.push(
        ...engagedTopicDocs
          .filter((t): t is NonNullable<typeof t> => !!t)
          .filter((t) => t.isTopic === true)
          .filter((t) => !followedTopicIds.has(t._id.toString()))
          .slice(0, limit),
      );
    }

    if (similarUserTopicIds.size > 0 && suggestions.length < limit) {
      const remainingCount = limit - suggestions.length;
      const similarUserTopics = await Promise.all(
        Array.from(similarUserTopicIds)
          .filter((id) => !followedTopicIds.has(id))
          .slice(0, remainingCount)
          .map(
            async (id) =>
              await ctx.db.get(id as unknown as Doc<"hashtags">["_id"]),
          ),
      );
      suggestions.push(
        ...similarUserTopics.filter(
          (t): t is NonNullable<typeof t> => t !== null,
        ),
      );
    }

    if (suggestions.length < limit) {
      const remainingCount = limit - suggestions.length;
      const suggestionIds = new Set(suggestions.map((s) => s._id.toString()));

      suggestions.push(
        ...popularTopics
          .filter(
            (topic) =>
              !followedTopicIds.has(topic._id.toString()) &&
              !suggestionIds.has(topic._id.toString()),
          )
          .slice(0, remainingCount),
      );
    }

    return suggestions;
  },
});

export const getTopic = query({
  args: { topicId: v.id("hashtags") },
  returns: v.union(hashtagResponseValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.topicId);
  },
});

export const checkTopicFollow = query({
  args: { userId: v.string(), topicId: v.id("hashtags") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const follow = await ctx.db
      .query("topicFollows")
      .withIndex("by_user_and_topic", (q) =>
        q.eq("userId", args.userId).eq("topicId", args.topicId),
      )
      .first();
    return follow !== null;
  },
});

export const getRecommendedHashtags = query({
  args: { userId: v.string(), limit: v.number() },
  returns: v.array(hashtagResponseValidator),
  handler: async (ctx, args) => {
    const followedUsers = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", args.userId).eq("followType", "user"),
      )
      .collect();

    const followedUserIds = followedUsers.map((f) => f.followId);

    const relevantFeedItems = await ctx.db
      .query("feedItems")
      .filter((q) =>
        q.or(
          q.eq(q.field("creatorId"), args.userId),
          ...(followedUserIds.length > 0
            ? followedUserIds.map((id) => q.eq(q.field("creatorId"), id))
            : []),
        ),
      )
      .collect();

    const allHashtags = relevantFeedItems.flatMap(
      (item) => item.hashtags ?? [],
    );

    const hashtagCounts = new Map<string, number>();
    for (const hashtag of allHashtags) {
      hashtagCounts.set(hashtag, (hashtagCounts.get(hashtag) ?? 0) + 1);
    }

    const sortedHashtags = [...hashtagCounts.entries()].sort(
      (a, b) => b[1] - a[1],
    );
    const recommendedHashtagNames = sortedHashtags
      .slice(0, args.limit * 2)
      .map(([hashtag]) => hashtag);

    const recommendedHashtagDocs = await Promise.all(
      recommendedHashtagNames.map(async (tagName) =>
        ctx.db
          .query("hashtags")
          .withIndex("by_tag", (q) => q.eq("tag", tagName))
          .first(),
      ),
    );

    return recommendedHashtagDocs
      .filter((doc): doc is NonNullable<typeof doc> => doc !== null)
      .slice(0, args.limit);
  },
});
