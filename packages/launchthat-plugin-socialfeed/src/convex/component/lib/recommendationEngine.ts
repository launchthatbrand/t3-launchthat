import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Generate content recommendations for a user.
 *
 * NOTE: user identifiers are stored as strings (portal user id / subject).
 */
export async function generateRecommendations(
  ctx: MutationCtx,
  userId: string,
  limit: number = 10,
): Promise<void> {
  const followedTopics = await ctx.db
    .query("topicFollows")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const followedTopicIds = followedTopics.map((topic) => topic.topicId);

  const followedUsers = await ctx.db
    .query("subscriptions")
    .withIndex("by_user_and_type", (q) =>
      q.eq("userId", userId).eq("followType", "user"),
    )
    .collect();

  const followedUserIds = followedUsers.map((sub) => sub.followId);

  const userReactions = await ctx.db
    .query("reactions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .take(50);

  const engagedContentIds = userReactions.map(
    (reaction) => reaction.feedItemId,
  );

  const engagedContent = await Promise.all(
    engagedContentIds.map(async (id) => ctx.db.get(id)),
  );

  const engagedHashtags: string[] = [];
  engagedContent.forEach((content) => {
    if (content && content.hashtags) {
      engagedHashtags.push(...content.hashtags);
    }
  });

  const popularTags = await ctx.db
    .query("hashtags")
    .withIndex("by_usageCount", (q) => q)
    .order("desc")
    .take(20);

  const relatedHashtags = popularTags
    .filter((tag) => engagedHashtags.includes(tag.tag))
    .map((tag) => tag.tag);

  const trendingContent = await ctx.db
    .query("trendingContent")
    .withIndex("by_trending_score", (q) => q)
    .order("desc")
    .take(20);

  const trendingContentIds = trendingContent.map((tc) => tc.contentId);

  let topicContent: Doc<"feedItems">[] = [];
  if (followedTopicIds.length > 0) {
    const topics = await Promise.all(
      followedTopicIds.map(async (id) => ctx.db.get(id)),
    );
    const topicTags = topics
      .filter((topic) => topic !== null)
      .map((topic) => topic!.tag);

    for (const tag of topicTags) {
      const content = await ctx.db
        .query("feedItems")
        .withIndex("by_hashtag", (q) => q.eq("hashtags", [tag]))
        .order("desc")
        .take(5);
      topicContent.push(...content);
    }
  }

  let userContent: Doc<"feedItems">[] = [];
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

  const allCandidateContent = [
    ...topicContent,
    ...userContent,
    ...(await Promise.all(
      trendingContentIds.map(async (id) => ctx.db.get(id)),
    )),
  ].filter(Boolean) as Doc<"feedItems">[];

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

  for (const content of allCandidateContent) {
    if (!content || content.creatorId === userId) continue;

    const hasInteracted = engagedContentIds.includes(content._id);
    if (hasInteracted) continue;

    const existingRecommendation = await ctx.db
      .query("contentRecommendations")
      .withIndex("by_user_and_content", (q) =>
        q.eq("userId", userId).eq("contentId", content._id),
      )
      .first();
    if (existingRecommendation) continue;

    let score = 1.0;
    let reason:
      | "topic"
      | "similarUser"
      | "engagement"
      | "trending"
      | "newContent" = "newContent";
    let context: string | undefined = undefined;

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

    if (followedUserIds.includes(content.creatorId)) {
      score += 2.0;
      reason = "similarUser";
      context = content.creatorId;
    }

    const trendingScore =
      trendingContent.find((tc) => tc.contentId === content._id)
        ?.trendingScore ?? 0;
    if (trendingScore > 0) {
      score += trendingScore / 100;
      if (reason === "newContent") {
        reason = "trending";
      }
    }

    const ageHours = (Date.now() - content._creationTime) / (60 * 60 * 1000);
    const recencyBoost = Math.max(0.1, 1 - Math.log10(ageHours + 1) / 10);
    score *= recencyBoost;

    const key = content._id.toString();
    if (
      !uniqueContentMap.has(key) ||
      uniqueContentMap.get(key)!.score < score
    ) {
      uniqueContentMap.set(key, { content, score, reason, context });
    }
  }

  const scoredContent = Array.from(uniqueContentMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

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
 * Find similar users based on engagement patterns.
 *
 * NOTE: This uses only socialfeed component data (reactions/subscriptions).
 */
export async function findSimilarUsers(
  ctx: QueryCtx,
  userId: string,
  limit: number = 10,
): Promise<string[]> {
  const userReactions = await ctx.db
    .query("reactions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .take(50);

  const engagedContentIds = new Set(
    userReactions.map((reaction) => reaction.feedItemId.toString()),
  );

  if (engagedContentIds.size === 0) {
    return [];
  }

  const allReactions = await ctx.db.query("reactions").collect();

  const similarityScores = new Map<string, number>();
  for (const reaction of allReactions) {
    if (reaction.userId === userId) continue;
    if (!engagedContentIds.has(reaction.feedItemId.toString())) continue;
    similarityScores.set(
      reaction.userId,
      (similarityScores.get(reaction.userId) ?? 0) + 1,
    );
  }

  const followedUsers = await ctx.db
    .query("subscriptions")
    .withIndex("by_user_and_type", (q) =>
      q.eq("userId", userId).eq("followType", "user"),
    )
    .collect();
  const followedUserIds = new Set(followedUsers.map((s) => s.followId));

  return [...similarityScores.entries()]
    .filter(([otherUserId]) => !followedUserIds.has(otherUserId))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([otherUserId]) => otherUserId);
}

export async function markRecommendationSeen(
  ctx: MutationCtx,
  userId: string,
  contentId: Doc<"feedItems">["_id"],
) {
  const rec = await ctx.db
    .query("contentRecommendations")
    .withIndex("by_user_and_content", (q) =>
      q.eq("userId", userId).eq("contentId", contentId),
    )
    .first();
  if (!rec) return;
  await ctx.db.patch(rec._id, { seen: true });
}

export async function markRecommendationInteracted(
  ctx: MutationCtx,
  userId: string,
  contentId: Doc<"feedItems">["_id"],
  reaction?: "like" | "dislike" | "neutral",
) {
  const rec = await ctx.db
    .query("contentRecommendations")
    .withIndex("by_user_and_content", (q) =>
      q.eq("userId", userId).eq("contentId", contentId),
    )
    .first();
  if (!rec) return;
  await ctx.db.patch(rec._id, { interacted: true, userReaction: reaction });
}
