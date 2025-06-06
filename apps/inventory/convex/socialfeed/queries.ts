import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { Doc, Id } from "../_generated/dataModel";
import { query, QueryCtx } from "../_generated/server";
import { findSimilarUsers } from "./lib/recommendationEngine";
import { hashtagResponseValidator } from "./schema/hashtagsSchema";

// Define a common user model based on observed properties
interface UserDoc {
  _id: Id<"users">;
  _creationTime: number;
  name?: string;
  tokenIdentifier?: string;
  email: string;
  role: "admin" | "user";
  // Add the image property that might be missing in some documents
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
        ? {
            _id: user._id,
            name: user.name ?? "Unknown User",
            // Handle missing image property safely
            image: undefined, // Don't use user.image as it might not exist
          }
        : null;
    }),
  );

  // Create a map of creator IDs to creator objects
  const creatorMap = new Map();
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
        .withIndex("by_feed_item", (q) => q.eq("feedItemId", item._id))
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
  returns: v.array(feedItemReturnType),
  handler: async (ctx, args) => {
    // Get feed items that are public
    const { page } = await ctx.db
      .query("feedItems")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .order("desc")
      .paginate(args.paginationOpts);

    return enrichFeedItems(ctx, page);
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
  returns: v.array(feedItemReturnType),
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
    const { page } = await ctx.db
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

    return enrichFeedItems(ctx, page);
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
  returns: v.array(feedItemReturnType),
  handler: async (ctx, args) => {
    // Get feed items that are for this group
    const { page } = await ctx.db
      .query("feedItems")
      .withIndex("by_module", (q) =>
        q.eq("moduleType", "group").eq("moduleId", args.groupId),
      )
      .order("desc")
      .paginate(args.paginationOpts);

    return enrichFeedItems(ctx, page);
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
  returns: v.array(feedItemReturnType),
  handler: async (ctx, args) => {
    // Validate that the profile exists
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return [];
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

    const { page } = await feedItemsQuery
      .order("desc")
      .paginate(args.paginationOpts);

    return enrichFeedItems(ctx, page);
  },
});

/**
 * Get a single feed item by ID with all associated data
 */
export const getFeedItem = query({
  args: {
    feedItemId: v.id("feedItems"),
    viewerId: v.optional(v.id("users")),
  },
  returns: v.union(feedItemReturnType, v.null()),
  handler: async (ctx, args) => {
    // Get the feed item
    const feedItem = await ctx.db.get(args.feedItemId);
    if (!feedItem) {
      return null;
    }

    // Check permissions
    const isCreator = args.viewerId === feedItem.creatorId;
    const isPublic = feedItem.visibility === "public";

    // If the item is private and viewer is not the creator, deny access
    if (feedItem.visibility === "private" && !isCreator) {
      return null;
    }

    // If the item is for a group, check if the viewer is a member
    if (
      feedItem.visibility === "group" &&
      feedItem.moduleType === "group" &&
      !isCreator &&
      args.viewerId &&
      feedItem.moduleId
    ) {
      // For group content, we need to verify group membership
      // This would typically be a more complex check against group membership
      // For now we'll do a simplified check
      const isMember = await ctx.db
        .query("subscriptions")
        .withIndex("by_user_follow", (q) =>
          q
            .eq("userId", args.viewerId)
            .eq("followType", "group")
            .eq("followId", feedItem.moduleId),
        )
        .first()
        .then((sub) => !!sub);

      if (!isMember) {
        return null;
      }
    }

    // Get creator info
    const creator = await ctx.db.get(feedItem.creatorId);

    // Get reaction count
    const reactionsCount = await ctx.db
      .query("reactions")
      .withIndex("by_feed_item", (q) => q.eq("feedItemId", args.feedItemId))
      .collect()
      .then((reactions) => reactions.length);

    // Get comment count
    const commentsCount = await ctx.db
      .query("comments")
      .withIndex("by_feed_item", (q) => q.eq("feedItemId", args.feedItemId))
      .collect()
      .then((comments) => comments.length);

    // If shared content, get original content
    let originalContent = null;
    if (feedItem.contentType === "share" && feedItem.originalContentId) {
      originalContent = await ctx.db.get(feedItem.originalContentId);
    }

    return {
      ...feedItem,
      reactionsCount,
      commentsCount,
      creator: {
        _id: creator?._id ?? feedItem.creatorId,
        name: creator?.name ?? "Unknown User",
        image: undefined, // Don't use creator?.image as it might not exist
      },
      // We could include the original content here as well if needed
    };
  },
});

/**
 * Get comments for a specific feed item
 */
export const getComments = query({
  args: {
    feedItemId: v.id("feedItems"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.array(
    v.object({
      _id: v.id("comments"),
      _creationTime: v.number(),
      feedItemId: v.id("feedItems"),
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
    }),
  ),
  handler: async (ctx, args) => {
    // Get comments for this feed item
    const { page } = await ctx.db
      .query("comments")
      .withIndex("by_feed_item", (q) => q.eq("feedItemId", args.feedItemId))
      .filter((q) => q.eq(q.field("parentCommentId"), undefined)) // Only top-level comments
      .order("asc") // Oldest first
      .paginate(args.paginationOpts);

    if (page.length === 0) {
      return [];
    }

    // Get all user IDs
    const userIds = [...new Set(page.map((comment) => comment.userId))];

    // Get all users in one batch
    const users = await Promise.all(
      userIds.map(async (id) => {
        const user = await ctx.db.get(id);
        return user
          ? {
              _id: user._id,
              name: user.name ?? "Unknown User",
              image: undefined, // Don't use user.image as it might not exist
            }
          : null;
      }),
    );

    // Create a map of user IDs to user objects
    const userMap = new Map();
    users.forEach((user) => {
      if (user) {
        userMap.set(user._id, user);
      }
    });

    // Count replies for each comment
    const commentsWithCounts = await Promise.all(
      page.map(async (comment) => {
        // Count replies
        const repliesCount = await ctx.db
          .query("comments")
          .withIndex("by_parent", (q) => q.eq("parentCommentId", comment._id))
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
  },
});

/**
 * Get replies for a specific comment
 */
export const getCommentReplies = query({
  args: {
    feedItemId: v.id("feedItems"),
    parentCommentId: v.id("comments"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.array(
    v.object({
      _id: v.id("comments"),
      _creationTime: v.number(),
      feedItemId: v.id("feedItems"),
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
    }),
  ),
  handler: async (ctx, args) => {
    // Get replies for this comment
    const { page } = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) =>
        q.eq("parentCommentId", args.parentCommentId),
      )
      .filter((q) => q.eq(q.field("feedItemId"), args.feedItemId))
      .order("asc") // Oldest first
      .paginate(args.paginationOpts);

    if (page.length === 0) {
      return [];
    }

    // Get all user IDs
    const userIds = [...new Set(page.map((comment) => comment.userId))];

    // Get all users in one batch
    const users = await Promise.all(
      userIds.map(async (id) => {
        const user = await ctx.db.get(id);
        return user
          ? {
              _id: user._id,
              name: user.name ?? "Unknown User",
              // The image might not exist in the type but could be available in the data
              image: undefined,
            }
          : null;
      }),
    );

    // Create a map of user IDs to user objects
    const userMap = new Map();
    users.forEach((user) => {
      if (user) {
        userMap.set(user._id, user);
      }
    });

    // Count replies for each comment (nested replies)
    const commentsWithCounts = await Promise.all(
      page.map(async (comment) => {
        // Count replies
        const repliesCount = await ctx.db
          .query("comments")
          .withIndex("by_parent", (q) => q.eq("parentCommentId", comment._id))
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
  },
});

/**
 * Get saved items for a user
 */
export const getSavedItems = query({
  args: {
    userId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.array(
    v.object({
      _id: v.id("savedItems"),
      _creationTime: v.number(),
      userId: v.id("users"),
      feedItemId: v.id("feedItems"),
      collectionName: v.optional(v.string()),
      notes: v.optional(v.string()),
      feedItem: feedItemReturnType,
    }),
  ),
  handler: async (ctx, args) => {
    // Validate user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get saved items
    const { page } = await ctx.db
      .query("savedItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .paginate(args.paginationOpts);

    if (page.length === 0) {
      return [];
    }

    // Fetch all feed items at once
    const feedItemIds = page.map((savedItem) => savedItem.feedItemId);
    const feedItems = await Promise.all(
      feedItemIds.map(async (id) => {
        const item = await ctx.db.get(id);
        return item;
      }),
    );

    // Create a map of feed item IDs to feed items
    const feedItemMap = new Map();
    feedItems.forEach((item) => {
      if (item) {
        feedItemMap.set(item._id, item);
      }
    });

    // Enrich the feed items
    const enrichedFeedItems = await enrichFeedItems(
      ctx,
      feedItems.filter((item): item is Doc<"feedItems"> => !!item),
    );

    // Create a map of enriched feed items
    const enrichedFeedItemMap = new Map();
    enrichedFeedItems.forEach((item) => {
      enrichedFeedItemMap.set(item._id, item);
    });

    // Combine saved items with their feed items
    return page.map((savedItem) => {
      const enrichedFeedItem = enrichedFeedItemMap.get(savedItem.feedItemId);
      if (!enrichedFeedItem) {
        throw new Error(`Feed item not found: ${savedItem.feedItemId}`);
      }

      return {
        ...savedItem,
        feedItem: enrichedFeedItem,
      };
    });
  },
});

/**
 * Get entities that a user is following
 */
export const getFollowing = query({
  args: {
    userId: v.id("users"),
    followType: v.optional(
      v.union(
        v.literal("user"),
        v.literal("topic"),
        v.literal("group"),
        v.literal("hashtag"),
      ),
    ),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.array(
    v.object({
      _id: v.id("subscriptions"),
      _creationTime: v.number(),
      userId: v.id("users"),
      followType: v.union(
        v.literal("user"),
        v.literal("topic"),
        v.literal("group"),
        v.literal("hashtag"),
      ),
      followId: v.string(),
      notificationsEnabled: v.optional(v.boolean()),
      entityDetails: v.optional(
        v.object({
          name: v.optional(v.string()),
          image: v.optional(v.string()),
          description: v.optional(v.string()),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    // Validate user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Build the query based on whether a follow type is specified
    const { page } = args.followType
      ? await ctx.db
          .query("subscriptions")
          .withIndex("by_user_and_type", (q) =>
            q.eq("userId", args.userId).eq("followType", args.followType),
          )
          .order("desc")
          .paginate(args.paginationOpts)
      : await ctx.db
          .query("subscriptions")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .order("desc")
          .paginate(args.paginationOpts);

    if (page.length === 0) {
      return [];
    }

    // Enhance subscriptions with entity details when possible
    return await Promise.all(
      page.map(async (subscription) => {
        // Define the type for entityDetails
        type EntityDetails = {
          name?: string;
          image?: string;
          description?: string;
        };

        // Initialize with basic subscription data
        let entityDetails: EntityDetails | undefined = undefined;

        // Add entity details based on follow type
        if (subscription.followType === "user") {
          try {
            // For users, get their name and profile image
            const followedUser = await ctx.db.get(
              subscription.followId as Id<"users">,
            );
            if (followedUser) {
              entityDetails = {
                name: followedUser.name ?? "Unknown User",
                image: undefined, // Don't use followedUser.image as it might not exist
                description: undefined,
              };
            }
          } catch (error) {
            // Handle case where followId might not be a valid user ID
            console.error("Error fetching user details:", error);
          }
        } else if (subscription.followType === "group") {
          try {
            // For groups, get group details
            const group = await ctx.db.get(
              subscription.followId as Id<"groups">,
            );
            if (group) {
              entityDetails = {
                name: (group.name as string) ?? "Unknown Group",
                image: (group.avatar as string) ?? undefined,
                description: (group.description as string) ?? undefined,
              };
            }
          } catch (error) {
            // Handle case where followId might not be a valid group ID
            console.error("Error fetching group details:", error);
          }
        } else if (subscription.followType === "topic") {
          // For topics, we might just have the name
          entityDetails = {
            name: subscription.followId, // Use the ID as the name for topics
            image: undefined,
            description: undefined,
          };
        }

        return {
          ...subscription,
          entityDetails,
        };
      }),
    );
  },
});

/**
 * Get trending hashtags
 */
export const getTrendingHashtags = query({
  args: {
    limit: v.optional(v.number()),
    timeframe: v.optional(v.string()),
  },
  returns: v.array(hashtagResponseValidator),
  handler: async (ctx, args) => {
    const { limit = 10, timeframe } = args;

    // Calculate the minimum timestamp based on timeframe
    let minTimestamp = 0;
    if (timeframe) {
      const now = Date.now();
      switch (timeframe) {
        case "day":
          minTimestamp = now - 24 * 60 * 60 * 1000;
          break;
        case "week":
          minTimestamp = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case "month":
          minTimestamp = now - 30 * 24 * 60 * 60 * 1000;
          break;
        default:
          // No minimum timestamp if timeframe is not recognized
          break;
      }
    }

    // Query hashtags, ordered by usage count
    const hashtags = await ctx.db
      .query("hashtags")
      .filter((q) =>
        minTimestamp > 0 ? q.gte(q.field("lastUsed"), minTimestamp) : q,
      )
      .order("desc")
      .take(limit);

    return hashtags;
  },
});

/**
 * Search for hashtags by prefix
 */
export const searchHashtags = query({
  args: {
    prefix: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(hashtagResponseValidator),
  handler: async (ctx, args) => {
    const { prefix, limit = 5 } = args;

    // Search for hashtags that start with the given prefix
    // Note: In a real application, you might want to use a more sophisticated search
    // mechanism, possibly with a dedicated search index
    const hashtags = await ctx.db
      .query("hashtags")
      .filter((q) =>
        q.and(
          q.gte(q.field("tag"), prefix),
          q.lt(q.field("tag"), prefix + "\uffff"),
        ),
      )
      .order("desc")
      .take(limit);

    return hashtags;
  },
});

/**
 * Get posts by hashtag
 */
export const getPostsByHashtag = query({
  args: {
    hashtag: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { hashtag, paginationOpts } = args;
    const { numItems, cursor } = paginationOpts;

    // Query feed items that have this hashtag
    const feedItems = await ctx.db
      .query("feedItems")
      .withIndex("by_hashtag", (q) => q.eq("hashtags", hashtag))
      .filter(
        (q) =>
          q.eq(q.field("deleted"), false) ||
          q.eq(q.field("deleted"), undefined),
      )
      .order("desc")
      .paginate({ numItems, cursor });

    // For each feed item, fetch the creator info
    const itemsWithCreators = await Promise.all(
      feedItems.page.map(async (item) => {
        const creator = await ctx.db.get(item.creatorId);
        return {
          ...item,
          creator: creator
            ? {
                _id: creator._id,
                name: creator.name || "Unknown User",
                image: creator.image,
              }
            : {
                _id: item.creatorId,
                name: "Unknown User",
                image: undefined,
              },
        };
      }),
    );

    return {
      ...feedItems,
      page: itemsWithCreators,
    };
  },
});

/**
 * Get user suggestions for mentions
 */
export const getUserSuggestions = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { query, limit = 5 } = args;

    // If query is empty, return empty array
    if (!query.trim()) {
      return [];
    }

    // Search for users by name
    // Using a simple substring search
    const users = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(
          q.gte(q.field("name"), query) &&
            q.lt(q.field("name"), query + "\uffff"),
          q.gte(q.field("username"), query) &&
            q.lt(q.field("username"), query + "\uffff"),
        ),
      )
      .take(limit);

    // Return only the necessary fields for the suggestions
    return users.map((user) => ({
      _id: user._id,
      name: user.name || "Unknown User",
      username:
        user.username || user.name?.toLowerCase().replace(/\s+/g, "") || "",
      image: user.image,
    }));
  },
});

/**
 * Get trending content
 */
export const getTrendingContent = query({
  args: {
    paginationOpts: paginationOptsValidator,
    topicId: v.optional(v.id("hashtags")),
  },
  returns: v.array(feedItemReturnType),
  handler: async (ctx, args) => {
    // Get trending content sorted by trending score
    let trendingContentQuery = ctx.db
      .query("trendingContent")
      .withIndex("by_trending_score")
      .order("desc");

    // Filter by topic if provided
    if (args.topicId) {
      // Get the hashtag to filter by
      const topic = await ctx.db.get(args.topicId);
      if (!topic) {
        return [];
      }

      // Filter trending content with this hashtag
      trendingContentQuery = trendingContentQuery.filter((q) =>
        q.eq(q.field("topics").includes(topic.tag), true),
      );
    }

    // Paginate the results
    const { page } = await trendingContentQuery.paginate(args.paginationOpts);

    // Get the content items
    const contentIds = page.map((item) => item.contentId);
    const feedItems = await Promise.all(
      contentIds.map(async (id) => await ctx.db.get(id)),
    );

    // Filter out null items and enrich with creator/counts
    const validItems = feedItems.filter(
      (item) => item !== null,
    ) as Doc<"feedItems">[];
    return enrichFeedItems(ctx, validItems);
  },
});

/**
 * Get recommended content for a user
 */
export const getRecommendedContent = query({
  args: {
    userId: v.id("users"),
    paginationOpts: paginationOptsValidator,
    includeReasons: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      ...feedItemReturnType.properties,
      recommendationReason: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    // Get user's recommendations, sorted by relevance
    const { page } = await ctx.db
      .query("contentRecommendations")
      .withIndex("by_relevance", (q) => q.eq("userId", args.userId))
      .order("desc")
      .paginate(args.paginationOpts);

    // Early return if no recommendations
    if (page.length === 0) {
      return [];
    }

    // Get the content items
    const contentIds = page.map((item) => item.contentId);
    const feedItems = await Promise.all(
      contentIds.map(async (id) => await ctx.db.get(id)),
    );

    // Enrich the feed items
    const enrichedItems = await enrichFeedItems(
      ctx,
      feedItems.filter((item) => item !== null) as Doc<"feedItems">[],
    );

    // Add recommendation reasons if requested
    if (args.includeReasons) {
      return enrichedItems.map((item) => {
        const recommendation = page.find((rec) => rec.contentId === item._id);

        let reasonText = "";
        if (recommendation) {
          switch (recommendation.reasonType) {
            case "topic":
              reasonText = `Based on your interest in #${recommendation.reasonContext}`;
              break;
            case "similarUser":
              reasonText = "Based on content similar users engaged with";
              break;
            case "engagement":
              reasonText = "Based on your recent activity";
              break;
            case "trending":
              reasonText = "Popular content you might like";
              break;
            case "newContent":
              reasonText = "New content you might be interested in";
              break;
          }
        }

        return {
          ...item,
          recommendationReason: reasonText,
        };
      });
    }

    return enrichedItems;
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
          q.contains(q.lower(q.field("tag")), searchLower),
          q.contains(q.lower(q.field("description") ?? ""), searchLower),
        ),
      );
    }

    // Get topics sorted by follower count (popularity)
    const { page } = await topicsQuery
      .order("desc", (q) => q.field("followerCount") ?? 0)
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
      .order("desc", (q) => q.field("followedAt"))
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
    return topics.filter((topic) => topic !== null) as Doc<"hashtags">[];
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
      if (content && content.hashtags) {
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
      const engagedTopics = await ctx.db
        .query("hashtags")
        .withIndex("by_isTopic", (q) => q.eq("isTopic", true))
        .filter((q) =>
          q.and(
            q.not(followedTopicIds.has(q.field("_id").toString())),
            engagedHashtags.has(q.field("tag")),
          ),
        )
        .take(limit);

      suggestions.push(...engagedTopics);
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

      suggestions.push(
        ...(similarUserTopics.filter((t) => t !== null) as Doc<"hashtags">[]),
      );
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
