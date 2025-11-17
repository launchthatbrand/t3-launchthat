import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { query } from "../_generated/server";
import { hashtagResponseValidator } from "./hashtags/schema";
import { findSimilarUsers } from "./lib/recommendationEngine";

// Define a common user model based on observed properties for internal use
interface EnrichedUser {
  _id: Id<"users">;
  name: string;
  image?: string;
}

// Define a common comment return type to avoid duplication
const commentReturnType = v.object({
  _id: v.id("comments"),
  _creationTime: v.number(),
  parentId: v.union(
    v.id("feedItems"),
    v.id("courses"),
    v.id("lessons"),
    v.id("topics"),
    v.id("quizzes"),
    v.id("posts"),
    v.id("downloads"),
    v.id("helpdeskArticles"),
  ),
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
  userId: v.id("users"),
  content: v.string(),
  parentCommentId: v.optional(v.id("comments")),
  mediaUrls: v.optional(v.array(v.string())),
  updatedAt: v.optional(v.number()),
  user: v.object({
    _id: v.id("users"),
    name: v.string(),
    image: v.optional(v.string()),
  }),
  repliesCount: v.number(),
});

// Helper function to enrich comments with user data and replies count
async function enrichComments(ctx: QueryCtx, page: Doc<"comments">[]) {
  // Early return if no items
  if (page.length === 0) {
    return [];
  }

  // Collect all user IDs
  const userIds = [...new Set(page.map((comment) => comment.userId))];

  // Get all users in one batch
  const users = await Promise.all(
    userIds.map(async (id) => {
      const user = await ctx.db.get(id);
      return user
        ? ({
            _id: user._id,
            name: user.name ?? "Unknown User",
            image: user.image ?? undefined,
          } as EnrichedUser)
        : null;
    }),
  );

  // Create a map of user IDs to user objects
  const userMap = new Map<Id<"users">, EnrichedUser>();
  users.forEach((user) => {
    if (user) {
      userMap.set(user._id, user);
    }
  });

  // Count replies for each comment
  const commentsWithCounts = await Promise.all(
    page.map(async (comment: Doc<"comments">) => {
      // Count replies
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
        user: userMap.get(comment.userId) ?? {
          _id: comment.userId,
          name: "Unknown User",
          image: undefined,
        },
      };
    }),
  );

  return commentsWithCounts;
}

// Define a common feed item return type to avoid duplication
const feedItemReturnType = v.object({
  _id: v.id("feedItems"),
  _creationTime: v.number(),
  contentType: v.union(
    v.literal("post"),
    v.literal("share"),
    v.literal("comment"),
  ),
  creatorId: v.id("users"),
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
    _id: v.id("users"),
    name: v.string(),
    image: v.optional(v.string()),
  }),
  hashtags: v.optional(v.array(v.string())),
  mentions: v.optional(v.array(v.string())),
  mentionedUserIds: v.optional(v.array(v.id("users"))),
});

// Helper function to enrich feed items with creator, reaction counts, etc.
async function enrichFeedItems(ctx: QueryCtx, page: Doc<"feedItems">[]) {
  // Early return if no items
  if (page.length === 0) {
    return [];
  }

  // Collect all creator IDs
  const creatorIds = [...new Set(page.map((item) => item.creatorId))];

  // Get all creators in one batch
  const creators = await Promise.all(
    creatorIds.map(async (id) => {
      const user = await ctx.db.get(id);
      return user
        ? ({
            _id: user._id,
            name: user.name ?? "Unknown User",
            image: user.image ?? undefined,
          } as EnrichedUser)
        : null;
    }),
  );

  // Create a map of creator IDs to creator objects
  const creatorMap = new Map<Id<"users">, EnrichedUser>();
  creators.forEach((creator) => {
    if (creator) {
      creatorMap.set(creator._id, creator);
    }
  });

  // Count reactions and comments for each item
  const itemsWithCounts = await Promise.all(
    page.map(async (item: Doc<"feedItems">) => {
      // Count reactions
      const reactionsCount = await ctx.db
        .query("reactions")
        .withIndex("by_feed_item", (q) => q.eq("feedItemId", item._id))
        .collect()
        .then((reactions) => reactions.length);

      // Count comments
      const commentsCount = await ctx.db
        .query("comments")
        .withIndex("by_parent", (q) =>
          q.eq("parentId", item._id).eq("parentType", "feedItem"),
        )
        .collect()
        .then((comments) => comments.length);

      // Get creator or use default if not found
      const creator = creatorMap.get(item.creatorId) ?? {
        _id: item.creatorId,
        name: "Unknown User",
        image: undefined,
      };

      return {
        ...item,
        reactionsCount,
        commentsCount,
        creator,
        // Ensure these are always arrays, even if empty, to match the validator
        hashtags: item.hashtags ?? [],
        mentions: item.mentions ?? [],
        mentionedUserIds: item.mentionedUserIds ?? [],
      };
    }),
  );

  return itemsWithCounts;
}

/**
 * Get the universal feed (all public posts)
 */
export const getUniversalFeed = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.object({
    page: v.array(feedItemReturnType),
    continueCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Get feed items that are public
    const { page, continueCursor, isDone } = await ctx.db
      .query("feedItems")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .order("desc")
      .paginate(args.paginationOpts);

    const enrichedFeedItems = await enrichFeedItems(ctx, page);

    return { page: enrichedFeedItems, continueCursor, isDone };
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
  returns: v.object({
    page: v.array(feedItemReturnType),
    continueCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Get all users this user follows
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", args.userId).eq("followType", "user"),
      )
      .collect();

    // Extract followed user IDs
    const followedUserIds = subscriptions.map((sub) => sub.followId);

    // Get feed items from followed users and public items
    const { page, continueCursor, isDone } = await ctx.db
      .query("feedItems")
      .filter((q) => {
        // Include public posts
        if (followedUserIds.length === 0) {
          return q.eq(q.field("visibility"), "public");
        }

        // Include public posts and private posts from followed users
        return q.or(
          q.eq(q.field("visibility"), "public"),
          q.and(
            q.eq(q.field("visibility"), "private"),
            q.or(
              q.eq(q.field("creatorId"), args.userId),
              // Use OR conditions for each followed user ID
              ...(followedUserIds.length > 0
                ? followedUserIds.map((id) =>
                    q.eq(q.field("creatorId"), id as unknown as Id<"users">),
                  )
                : [q.eq(q.field("creatorId"), args.userId)]), // Fallback if no followed users
            ),
          ),
        );
      })
      .order("desc")
      .paginate(args.paginationOpts);

    const enrichedFeedItems = await enrichFeedItems(ctx, page);

    return { page: enrichedFeedItems, continueCursor, isDone };
  },
});

/**
 * Get feed items for a specific group
 */
export const getGroupFeed = query({
  args: {
    groupId: v.id("groups"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(feedItemReturnType),
    continueCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Get feed items that are for this group
    const { page, continueCursor, isDone } = await ctx.db
      .query("feedItems")
      .withIndex("by_module", (q) =>
        q.eq("moduleType", "group").eq("moduleId", args.groupId),
      )
      .order("desc")
      .paginate(args.paginationOpts);

    const enrichedFeedItems = await enrichFeedItems(ctx, page);

    return { page: enrichedFeedItems, continueCursor, isDone };
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
  returns: v.object({
    page: v.array(feedItemReturnType),
    continueCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Validate that the profile exists
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return { page: [], continueCursor: null, isDone: true };
    }

    // Check if the viewer and profile are the same user
    const isSameUser = args.viewerId === args.profileId;

    // Build query based on permissions
    let feedItemsQuery = ctx.db
      .query("feedItems")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.profileId));

    // Filter by visibility permissions
    if (!isSameUser) {
      // If not viewing own profile, only show public posts
      feedItemsQuery = feedItemsQuery.filter((q) =>
        q.eq(q.field("visibility"), "public"),
      );
    }

    const { page, continueCursor, isDone } = await feedItemsQuery
      .order("desc") // Ensure order is applied before paginate
      .paginate(args.paginationOpts);

    const enrichedFeedItems = await enrichFeedItems(ctx, page);

    return { page: enrichedFeedItems, continueCursor, isDone };
  },
});

/**
 * Get a single feed item by ID
 */
export const getFeedItem = query({
  args: { feedItemId: v.id("feedItems") },
  returns: v.union(v.null(), feedItemReturnType),
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.feedItemId);
    if (!item) {
      return null;
    }

    const [enrichedItem] = await enrichFeedItems(ctx, [item]);
    return enrichedItem;
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

    const { page, continueCursor, isDone } = await ctx.db
      .query("feedItems")
      .withIndex("by_hashtag", (q) => q.eq("hashtags", [tag]))
      .order("desc")
      .paginate(args.paginationOpts);

    const enrichedFeedItems = await enrichFeedItems(ctx, page);

    return {
      hashtag: hashtagDoc,
      feedItems: { page: enrichedFeedItems, continueCursor, isDone },
    };
  },
});

/**
 * Get comments for a specific feed item or parent content
 */
export const getComments = query({
  args: {
    // Update arguments to be polymorphic
    parentId: v.union(
      v.id("feedItems"),
      v.id("courses"),
      v.id("lessons"),
      v.id("topics"),
      v.id("quizzes"),
      v.id("posts"),
      v.id("downloads"),
      v.id("helpdeskArticles"),
    ),
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
    paginationOpts: paginationOptsValidator,
    sortOrder: v.optional(v.union(v.literal("newest"), v.literal("oldest"))),
  },
  returns: v.object({
    page: v.array(commentReturnType),
    continueCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Build base query
    const queryBuilder = ctx.db
      .query("comments")
      .withIndex("by_parent", (q) =>
        q.eq("parentId", args.parentId).eq("parentType", args.parentType),
      )
      .filter((q) => q.eq(q.field("parentCommentId"), undefined)); // Only top-level comments

    // Apply sorting
    const orderedQuery =
      args.sortOrder === "oldest"
        ? queryBuilder.order("asc")
        : queryBuilder.order("desc");

    // Paginate and enrich results
    const { page, continueCursor, isDone } = await orderedQuery.paginate(
      args.paginationOpts,
    );

    const enrichedComments = await enrichComments(ctx, page);

    return { page: enrichedComments, continueCursor, isDone };
  },
});

/**
 * Get replies for a specific comment
 */
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
    // Build base query
    const queryBuilder = ctx.db
      .query("comments")
      .withIndex("by_parentCommentId", (q) =>
        q.eq("parentCommentId", args.parentCommentId),
      );

    // Apply sorting
    const orderedQuery = queryBuilder.order("asc"); // Replies are always oldest first

    const { page, continueCursor, isDone } = await orderedQuery.paginate(
      args.paginationOpts,
    );

    const enrichedComments = await enrichComments(ctx, page);

    return { page: enrichedComments, continueCursor, isDone };
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
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      image: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    if (args.query.length < 2) return [];
    const users = await ctx.db
      .query("users")
      .withSearchIndex("search_name_username", (q) =>
        q.search("name", args.query),
      )
      .take(args.limit ?? 10);

    return users.map((user) => ({
      _id: user._id,
      name: user.name ?? "Unknown User",
      image: user.image,
    }));
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
  returns: v.object({
    page: v.array(feedItemReturnType),
    continueCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const recommendations = await findSimilarUsers(ctx, args.userId);

    const { page, continueCursor, isDone } = await ctx.db
      .query("feedItems")
      .filter((q) =>
        q.or(
          // Include posts from similar users
          ...recommendations.map((id) => q.eq(q.field("creatorId"), id)),
          // Include popular public posts
          q.eq(q.field("visibility"), "public"),
        ),
      )
      .order("desc")
      .paginate(args.paginationOpts);

    const enrichedFeedItems = await enrichFeedItems(ctx, page);

    return { page: enrichedFeedItems, continueCursor, isDone };
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
  returns: v.array(hashtagResponseValidator),
  handler: async (ctx, args) => {
    // Base query for topics
    let topicsQuery = ctx.db
      .query("hashtags")
      .withIndex("by_isTopic", (q) => q.eq("isTopic", true));

    // Filter by category if provided
    if (args.category) {
      topicsQuery = ctx.db
        .query("hashtags")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .filter((q) => q.eq(q.field("isTopic"), true));
    }

    // Filter by search query if provided
    if (args.query) {
      const searchLower = args.query.toLowerCase();
      topicsQuery = topicsQuery.filter((q) =>
        q.or(
          q.eq(q.field("tag"), searchLower),
          q.eq(q.field("description"), searchLower),
        ),
      );
    }

    // Get topics sorted by follower count (popularity)
    const { page } = await topicsQuery
      .order("desc")
      .paginate(args.paginationOpts);

    return page;
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
  returns: v.array(hashtagResponseValidator),
  handler: async (ctx, args) => {
    // Get the topic follows for this user
    const { page } = await ctx.db
      .query("topicFollows")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .paginate(args.paginationOpts);

    // Early return if no follows
    if (page.length === 0) {
      return [];
    }

    // Get the actual topic/hashtag objects
    const topicIds = page.map((follow) => follow.topicId);
    const topics = await Promise.all(
      topicIds.map(async (id) => await ctx.db.get(id)),
    );

    // Filter out null items
    return topics.filter((topic) => topic !== null);
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
  returns: v.array(hashtagResponseValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Get the user's current topic follows
    const userFollows = await ctx.db
      .query("topicFollows")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const followedTopicIds = new Set(
      userFollows.map((f) => f.topicId.toString()),
    );

    // Get user's engagement
    const userReactions = await ctx.db
      .query("reactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get content the user has engaged with
    const contentIds = userReactions.map((r) => r.feedItemId);
    const engagedContent = await Promise.all(
      contentIds.map(async (id) => await ctx.db.get(id)),
    );

    // Extract hashtags from engaged content
    const engagedHashtags = new Set<string>();
    engagedContent.forEach((content) => {
      if (content?.hashtags) {
        content.hashtags.forEach((tag) => engagedHashtags.add(tag));
      }
    });

    // Find similar users for additional topic suggestions
    const similarUserIds = await findSimilarUsers(ctx, args.userId, 5);

    // Get topics followed by similar users
    const similarUserFollows = await Promise.all(
      similarUserIds.map(async (id) =>
        ctx.db
          .query("topicFollows")
          .withIndex("by_user", (q) => q.eq("userId", id))
          .collect(),
      ),
    );

    // Flatten and get unique topic IDs
    const similarUserTopicIds = new Set<string>();
    similarUserFollows.forEach((follows) => {
      follows.forEach((follow) => {
        similarUserTopicIds.add(follow.topicId.toString());
      });
    });

    // Get popular topics as fallback
    const popularTopics = await ctx.db
      .query("hashtags")
      .withIndex("by_followerCount")
      .order("desc")
      .filter((q) => q.eq(q.field("isTopic"), true))
      .take(20);

    // Combine and prioritize topics
    const suggestions: Doc<"hashtags">[] = [];

    // First, add topics from content the user engaged with
    if (engagedHashtags.size > 0) {
      const engagedTopicDocs = await Promise.all(
        Array.from(engagedHashtags).map(async (tag) =>
          ctx.db
            .query("hashtags")
            .withIndex("by_tag", (q) => q.eq("tag", tag))
            .first(),
        ),
      );

      const engagedTopicFiltered = engagedTopicDocs
        .filter((t): t is NonNullable<typeof t> => !!t)
        .filter((t) => t.isTopic === true)
        .filter((t) => !followedTopicIds.has(t._id.toString()))
        .slice(0, limit);

      suggestions.push(...engagedTopicFiltered);
    }

    // Next, add topics followed by similar users
    if (similarUserTopicIds.size > 0 && suggestions.length < limit) {
      const remainingCount = limit - suggestions.length;
      const similarUserTopics = await Promise.all(
        Array.from(similarUserTopicIds)
          .filter((id) => !followedTopicIds.has(id))
          .slice(0, remainingCount)
          .map(async (id) => await ctx.db.get(id as unknown as Id<"hashtags">)),
      );

      const similarUserTopicsFiltered = similarUserTopics.filter(
        (t): t is NonNullable<typeof t> => t !== null,
      );
      suggestions.push(...similarUserTopicsFiltered);
    }

    // Finally, add popular topics if we still need more
    if (suggestions.length < limit) {
      const remainingCount = limit - suggestions.length;
      const suggestionIds = new Set(suggestions.map((s) => s._id.toString()));

      const additionalPopularTopics = popularTopics
        .filter(
          (topic) =>
            !followedTopicIds.has(topic._id.toString()) &&
            !suggestionIds.has(topic._id.toString()),
        )
        .slice(0, remainingCount);

      suggestions.push(...additionalPopularTopics);
    }

    return suggestions;
  },
});

/**
 * Get a single topic by ID
 */
export const getTopic = query({
  args: {
    topicId: v.id("hashtags"),
  },
  returns: v.union(hashtagResponseValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.topicId);
  },
});

/**
 * Check if a user follows a topic
 */
export const checkTopicFollow = query({
  args: {
    userId: v.id("users"),
    topicId: v.id("hashtags"),
  },
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

/**
 * Get recommended hashtags for the current user
 */
export const getRecommendedHashtags = query({
  args: {
    userId: v.id("users"),
    limit: v.number(),
  },
  returns: v.array(hashtagResponseValidator),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }

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
            ? followedUserIds.map((id) =>
                q.eq(q.field("creatorId"), id as unknown as Id<"users">),
              )
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

    // Fetch full hashtag documents for the recommended names
    const recommendedHashtagDocs = await Promise.all(
      recommendedHashtagNames.map(async (tagName) => {
        const hashtagDoc = await ctx.db
          .query("hashtags")
          .withIndex("by_tag", (q) => q.eq("tag", tagName))
          .first();
        return hashtagDoc;
      }),
    );

    // Filter out nulls and apply final limit
    const finalRecommendedHashtags = recommendedHashtagDocs
      .filter((doc): doc is NonNullable<typeof doc> => doc !== null)
      .slice(0, args.limit);

    return finalRecommendedHashtags;
  },
});
