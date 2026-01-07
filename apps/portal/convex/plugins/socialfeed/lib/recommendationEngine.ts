import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";

/**
 * Generate content recommendations for a user
 */
export async function generateRecommendations(
  ctx: MutationCtx,
  userId: Id<"users">,
  limit = 10,
): Promise<void> {
  // Get user's followed topics
  const followedTopics = await ctx.db
    .query("topicFollows")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const followedTopicIds = followedTopics.map((topic) => topic.topicId);

  // Get user's followed users
  const followedUsers = await ctx.db
    .query("subscriptions")
    .withIndex("by_user_and_type", (q) =>
      q.eq("userId", userId).eq("followType", "user"),
    )
    .collect();

  const followedUserIds = followedUsers.map(
    (sub) => sub.followId,
  ) as Id<"users">[];

  // Get user's recent engagement (reactions, comments, etc.)
  const userReactions = await ctx.db
    .query("reactions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .take(50);

  const engagedContentIds = userReactions.map(
    (reaction) => reaction.feedItemId,
  );

  // Get hashtags from content the user has engaged with
  const engagedContent = await Promise.all(
    engagedContentIds.map(async (id) => ctx.db.get(id)),
  );

  // Extract hashtags from engaged content
  const engagedHashtags: string[] = [];
  engagedContent.forEach((content) => {
    if (content?.hashtags) {
      engagedHashtags.push(...content.hashtags);
    }
  });

  // Find popular hashtags that match user's engaged hashtags
  const popularTags = await ctx.db
    .query("hashtags")
    .withIndex("by_usageCount", (q) => true)
    .order("desc")
    .take(20);

  const relatedHashtags = popularTags
    .filter((tag) => engagedHashtags.includes(tag.tag))
    .map((tag) => tag.tag);

  // Get trending content as a baseline
  const trendingContent = await ctx.db
    .query("trendingContent")
    .withIndex("by_trending_score", (q) => true)
    .order("desc")
    .take(20);

  const trendingContentIds = trendingContent.map((tc) => tc.contentId);

  // Get content from followed topics
  const topicContent: Doc<"feedItems">[] = [];

  if (followedTopicIds.length > 0) {
    // Get hashtag tags from IDs
    const topics = await Promise.all(
      followedTopicIds.map(async (id) => ctx.db.get(id)),
    );

    const topicTags = topics
      .filter((topic) => topic !== null)
      .map((topic) => topic!.tag);

    // For each topic tag, find content with that hashtag
    for (const tag of topicTags) {
      const content = await ctx.db
        .query("feedItems")
        .withIndex("by_hashtag", (q) => q.eq("hashtags", tag))
        .order("desc")
        .take(5);

      topicContent.push(...content);
    }
  }

  // Get content from followed users
  const userContent: Doc<"feedItems">[] = [];

  if (followedUserIds.length > 0) {
    for (const followedId of followedUserIds) {
      const content = await ctx.db
        .query("feedItems")
        .withIndex("by_creator", (q) => q.eq("creatorId", followedId))
        .order("desc")
        .take(3);

      userContent.push(...content);
    }
  }

  // Combine all potential content sources
  const allCandidateContent = [
    ...topicContent,
    ...userContent,
    ...(await Promise.all(
      trendingContentIds.map(async (id) => ctx.db.get(id)),
    )),
  ].filter(Boolean) as Doc<"feedItems">[];

  // Remove duplicates by ID
  const uniqueContentMap = new Map<
    string,
    {
      content: Doc<"feedItems">;
      score: number;
      reason:
        | "topic"
        | "similarUser"
        | "engagement"
        | "trending"
        | "newContent";
      context?: string;
    }
  >();

  // Score and deduplicate content
  for (const content of allCandidateContent) {
    if (!content || content.creatorId === userId) continue;

    // Skip content user has already seen or interacted with
    const hasInteracted = engagedContentIds.includes(content._id);
    if (hasInteracted) continue;

    // Check if user has already received this recommendation
    const existingRecommendation = await ctx.db
      .query("contentRecommendations")
      .withIndex("by_user_and_content", (q) =>
        q.eq("userId", userId).eq("contentId", content._id),
      )
      .first();

    if (existingRecommendation) continue;

    // Calculate a relevance score and determine reason
    let score = 1.0;
    let reason:
      | "topic"
      | "similarUser"
      | "engagement"
      | "trending"
      | "newContent" = "newContent";
    let context = undefined;

    // Check if from followed topic
    if (content.hashtags && content.hashtags.length > 0) {
      const matchingTags = content.hashtags.filter((tag) =>
        relatedHashtags.includes(tag),
      );
      if (matchingTags.length > 0) {
        score += matchingTags.length * 0.5;
        reason = "topic";
        context = matchingTags[0];
      }
    }

    // Check if from followed user
    if (followedUserIds.includes(content.creatorId)) {
      score += 2.0;
      reason = "similarUser";
      context = content.creatorId;
    }

    // Check if trending
    const trendingScore =
      trendingContent.find((tc) => tc.contentId === content._id)
        ?.trendingScore ?? 0;
    if (trendingScore > 0) {
      score += trendingScore / 100; // Normalize trending score

      if (reason === "newContent") {
        reason = "trending";
      }
    }

    // Add recency boost
    const ageHours = (Date.now() - content._creationTime) / (60 * 60 * 1000);
    const recencyBoost = Math.max(0.1, 1 - Math.log10(ageHours + 1) / 10);
    score *= recencyBoost;

    // Only keep the highest scored duplicate
    const key = content._id.toString();
    if (
      !uniqueContentMap.has(key) ||
      uniqueContentMap.get(key)!.score < score
    ) {
      uniqueContentMap.set(key, { content, score, reason, context });
    }
  }

  // Convert map to array and sort by score
  const scoredContent = Array.from(uniqueContentMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Store recommendations in the database
  const now = Date.now();

  for (const { content, score, reason, context } of scoredContent) {
    await ctx.db.insert("contentRecommendations", {
      userId,
      contentId: content._id,
      relevanceScore: score,
      reasonType: reason,
      reasonContext: context ? String(context) : undefined,
      generatedAt: now,
      seen: false,
      interacted: false,
    });
  }
}

/**
 * Find similar users based on engagement patterns
 */
export async function findSimilarUsers(
  ctx: QueryCtx,
  userId: Id<"users">,
  limit = 5,
): Promise<Id<"users">[]> {
  // Get user's engagement
  const userReactions = await ctx.db
    .query("reactions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const userEngagedContent = new Set(
    userReactions.map((r) => r.feedItemId.toString()),
  );

  // Get all users who have engaged with similar content
  const potentialSimilarUsers = new Map<
    string,
    { userId: Id<"users">; count: number }
  >();

  // For each content the user engaged with, find other users who engaged with it
  for (const contentId of userEngagedContent) {
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_feed_item", (q) =>
        q.eq("feedItemId", contentId as Id<"feedItems">),
      )
      .filter((q) => q.neq(q.field("userId"), userId))
      .collect();

    // Count how many reactions each user has in common
    for (const reaction of reactions) {
      const similarUserId = reaction.userId.toString();

      if (!potentialSimilarUsers.has(similarUserId)) {
        potentialSimilarUsers.set(similarUserId, {
          userId: reaction.userId,
          count: 1,
        });
      } else {
        const current = potentialSimilarUsers.get(similarUserId)!;
        potentialSimilarUsers.set(similarUserId, {
          ...current,
          count: current.count + 1,
        });
      }
    }
  }

  // Sort by count and return the top users
  return Array.from(potentialSimilarUsers.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((entry) => entry.userId);
}

/**
 * Mark a recommendation as seen
 */
export async function markRecommendationSeen(
  ctx: MutationCtx,
  userId: Id<"users">,
  contentId: Id<"feedItems">,
): Promise<void> {
  const recommendation = await ctx.db
    .query("contentRecommendations")
    .withIndex("by_user_and_content", (q) =>
      q.eq("userId", userId).eq("contentId", contentId),
    )
    .first();

  if (recommendation) {
    await ctx.db.patch(recommendation._id, {
      seen: true,
    });
  }
}

/**
 * Mark a recommendation as interacted with
 */
export async function markRecommendationInteracted(
  ctx: MutationCtx,
  userId: Id<"users">,
  contentId: Id<"feedItems">,
  reaction?: "like" | "dislike" | "neutral",
): Promise<void> {
  const recommendation = await ctx.db
    .query("contentRecommendations")
    .withIndex("by_user_and_content", (q) =>
      q.eq("userId", userId).eq("contentId", contentId),
    )
    .first();

  if (recommendation) {
    const update: {
      interacted: boolean;
      userReaction?: "like" | "dislike" | "neutral";
    } = {
      interacted: true,
    };

    if (reaction) {
      update.userReaction = reaction;
    }

    await ctx.db.patch(recommendation._id, update);
  }
}
