import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

const WEIGHTS = {
  reactions: 1,
  comments: 3,
  shares: 5,
  reactionVelocity: 2,
  commentVelocity: 4,
  shareVelocity: 6,
  recency: 1.5,
  hourlyEngagement: 3,
  dailyEngagement: 2,
  weeklyEngagement: 1,
  qualityScore: 1.2,
};

export function calculateTrendingScore(metrics: {
  reactions: number;
  comments: number;
  shares: number;
  creationTime: number;
  reactionVelocity?: number;
  commentVelocity?: number;
  shareVelocity?: number;
  hourlyEngagement?: number;
  dailyEngagement?: number;
  weeklyEngagement?: number;
  contentQualityScore?: number;
}): number {
  const now = Date.now();
  const ageHours = (now - metrics.creationTime) / HOUR_MS;

  let score =
    WEIGHTS.reactions * metrics.reactions +
    WEIGHTS.comments * metrics.comments +
    WEIGHTS.shares * metrics.shares;

  if (metrics.reactionVelocity)
    score += WEIGHTS.reactionVelocity * metrics.reactionVelocity;
  if (metrics.commentVelocity)
    score += WEIGHTS.commentVelocity * metrics.commentVelocity;
  if (metrics.shareVelocity)
    score += WEIGHTS.shareVelocity * metrics.shareVelocity;

  if (metrics.hourlyEngagement)
    score += WEIGHTS.hourlyEngagement * metrics.hourlyEngagement;
  if (metrics.dailyEngagement)
    score += WEIGHTS.dailyEngagement * metrics.dailyEngagement;
  if (metrics.weeklyEngagement)
    score += WEIGHTS.weeklyEngagement * metrics.weeklyEngagement;

  if (metrics.contentQualityScore)
    score += WEIGHTS.qualityScore * metrics.contentQualityScore;

  const recencyFactor = Math.max(0.1, 1 - Math.log10(ageHours + 1) / 10);
  score *= recencyFactor * WEIGHTS.recency;

  return score;
}

export function calculateVelocity(
  currentCount: number,
  previousCount: number,
  timeWindowMs: number,
): number {
  return (currentCount - previousCount) / (timeWindowMs / HOUR_MS);
}

const countReactions = async (ctx: MutationCtx, contentId: Id<"feedItems">) => {
  const rows = await ctx.db
    .query("reactions")
    .withIndex("by_feed_item", (q) => q.eq("feedItemId", contentId))
    .collect();
  return rows.length;
};

const countFeedItemComments = async (
  ctx: MutationCtx,
  contentId: Id<"feedItems">,
) => {
  const rows = await ctx.db
    .query("comments")
    .withIndex("by_parent", (q) =>
      q.eq("parentId", contentId).eq("parentType", "feedItem"),
    )
    .collect();
  return rows.length;
};

const countShares = async (ctx: MutationCtx, contentId: Id<"feedItems">) => {
  const rows = await ctx.db
    .query("feedItems")
    .withIndex("by_original_content", (q) =>
      q.eq("originalContentId", contentId),
    )
    .collect();
  return rows.length;
};

export async function updateTrendingMetrics(
  ctx: MutationCtx,
  contentId: Id<"feedItems">,
): Promise<void> {
  const existingTrending = await ctx.db
    .query("trendingContent")
    .withIndex("by_content", (q) => q.eq("contentId", contentId))
    .first();

  const content = await ctx.db.get(contentId);
  if (!content) return;

  const now = Date.now();

  const reactions = await countReactions(ctx, contentId);
  const comments = await countFeedItemComments(ctx, contentId);
  const shares = await countShares(ctx, contentId);

  const hourAgo = now - HOUR_MS;
  const dayAgo = now - DAY_MS;
  const weekAgo = now - WEEK_MS;

  const hourlyReactions = (
    await ctx.db
      .query("reactions")
      .withIndex("by_feed_item", (q) => q.eq("feedItemId", contentId))
      .filter((q) => q.gt(q.field("_creationTime"), hourAgo))
      .collect()
  ).length;

  const hourlyComments = (
    await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) =>
        q.eq("parentId", contentId).eq("parentType", "feedItem"),
      )
      .filter((q) => q.gt(q.field("_creationTime"), hourAgo))
      .collect()
  ).length;

  const hourlyShares = (
    await ctx.db
      .query("feedItems")
      .withIndex("by_original_content", (q) =>
        q.eq("originalContentId", contentId),
      )
      .filter((q) => q.gt(q.field("_creationTime"), hourAgo))
      .collect()
  ).length;

  const hourlyEngagement =
    hourlyReactions + hourlyComments * 3 + hourlyShares * 5;

  const dailyReactions = (
    await ctx.db
      .query("reactions")
      .withIndex("by_feed_item", (q) => q.eq("feedItemId", contentId))
      .filter((q) => q.gt(q.field("_creationTime"), dayAgo))
      .collect()
  ).length;

  const dailyComments = (
    await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) =>
        q.eq("parentId", contentId).eq("parentType", "feedItem"),
      )
      .filter((q) => q.gt(q.field("_creationTime"), dayAgo))
      .collect()
  ).length;

  const dailyShares = (
    await ctx.db
      .query("feedItems")
      .withIndex("by_original_content", (q) =>
        q.eq("originalContentId", contentId),
      )
      .filter((q) => q.gt(q.field("_creationTime"), dayAgo))
      .collect()
  ).length;

  const dailyEngagement = dailyReactions + dailyComments * 3 + dailyShares * 5;

  const weeklyReactions = (
    await ctx.db
      .query("reactions")
      .withIndex("by_feed_item", (q) => q.eq("feedItemId", contentId))
      .filter((q) => q.gt(q.field("_creationTime"), weekAgo))
      .collect()
  ).length;

  const weeklyComments = (
    await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) =>
        q.eq("parentId", contentId).eq("parentType", "feedItem"),
      )
      .filter((q) => q.gt(q.field("_creationTime"), weekAgo))
      .collect()
  ).length;

  const weeklyShares = (
    await ctx.db
      .query("feedItems")
      .withIndex("by_original_content", (q) =>
        q.eq("originalContentId", contentId),
      )
      .filter((q) => q.gt(q.field("_creationTime"), weekAgo))
      .collect()
  ).length;

  const weeklyEngagement =
    weeklyReactions + weeklyComments * 3 + weeklyShares * 5;

  const prevReactions = existingTrending?.reactions ?? 0;
  const prevComments = existingTrending?.comments ?? 0;
  const prevShares = existingTrending?.shares ?? 0;

  const reactionVelocity = calculateVelocity(reactions, prevReactions, HOUR_MS);
  const commentVelocity = calculateVelocity(comments, prevComments, HOUR_MS);
  const shareVelocity = calculateVelocity(shares, prevShares, HOUR_MS);

  const trendingScore = calculateTrendingScore({
    reactions,
    comments,
    shares,
    creationTime: content._creationTime,
    reactionVelocity,
    commentVelocity,
    shareVelocity,
    hourlyEngagement,
    dailyEngagement,
    weeklyEngagement,
    contentQualityScore: existingTrending?.contentQualityScore,
  });

  const topics = content.hashtags ?? [];

  const payload: Omit<Doc<"trendingContent">, "_id" | "_creationTime"> = {
    contentId,
    trendingScore,
    reactions,
    comments,
    shares,
    reactionVelocity,
    commentVelocity,
    shareVelocity,
    hourlyEngagement,
    dailyEngagement,
    weeklyEngagement,
    lastUpdated: now,
    contentQualityScore: existingTrending?.contentQualityScore,
    relevanceScore: existingTrending?.relevanceScore,
    topics,
    views: existingTrending?.views,
  };

  if (existingTrending) {
    await ctx.db.patch(existingTrending._id, payload);
  } else {
    await ctx.db.insert("trendingContent", payload);
  }
}
