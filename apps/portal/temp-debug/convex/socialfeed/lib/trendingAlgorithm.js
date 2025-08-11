// Constants for score calculation
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
// Weights for different metrics in trending score calculation
const WEIGHTS = {
    reactions: 1,
    comments: 3,
    shares: 5,
    reactionVelocity: 2,
    commentVelocity: 4,
    shareVelocity: 6,
    recency: 1.5, // Factor for how recent the content is
    hourlyEngagement: 3,
    dailyEngagement: 2,
    weeklyEngagement: 1,
    qualityScore: 1.2,
};
/**
 * Calculate trending score based on engagement metrics
 */
export function calculateTrendingScore(metrics) {
    const now = Date.now();
    const ageHours = (now - metrics.creationTime) / HOUR_MS;
    // Base score from raw engagement
    let score = WEIGHTS.reactions * metrics.reactions +
        WEIGHTS.comments * metrics.comments +
        WEIGHTS.shares * metrics.shares;
    // Add velocity metrics if available
    if (metrics.reactionVelocity) {
        score += WEIGHTS.reactionVelocity * metrics.reactionVelocity;
    }
    if (metrics.commentVelocity) {
        score += WEIGHTS.commentVelocity * metrics.commentVelocity;
    }
    if (metrics.shareVelocity) {
        score += WEIGHTS.shareVelocity * metrics.shareVelocity;
    }
    // Add time window metrics if available
    if (metrics.hourlyEngagement) {
        score += WEIGHTS.hourlyEngagement * metrics.hourlyEngagement;
    }
    if (metrics.dailyEngagement) {
        score += WEIGHTS.dailyEngagement * metrics.dailyEngagement;
    }
    if (metrics.weeklyEngagement) {
        score += WEIGHTS.weeklyEngagement * metrics.weeklyEngagement;
    }
    // Add quality score if available
    if (metrics.contentQualityScore) {
        score += WEIGHTS.qualityScore * metrics.contentQualityScore;
    }
    // Apply recency factor - newer content gets a boost
    // We use a logarithmic decay to ensure older content can still trend if engagement is high
    const recencyFactor = Math.max(0.1, 1 - Math.log10(ageHours + 1) / 10);
    score *= recencyFactor * WEIGHTS.recency;
    return score;
}
/**
 * Calculate engagement velocity (change over time)
 */
export function calculateVelocity(currentCount, previousCount, timeWindowMs) {
    // Simple rate of change calculation
    return (currentCount - previousCount) / (timeWindowMs / HOUR_MS);
}
/**
 * Update trending metrics for a specific piece of content
 */
export async function updateTrendingMetrics(ctx, contentId) {
    // Get existing trending record or create new one
    const existingTrending = await ctx.db
        .query("trendingContent")
        .withIndex("by_content", (q) => q.eq("contentId", contentId))
        .first();
    // Get the content
    const content = await ctx.db.get(contentId);
    if (!content)
        return;
    const now = Date.now();
    // Count current engagement metrics
    const reactions = await ctx.db
        .query("reactions")
        .withIndex("by_feed_item", (q) => q.eq("feedItemId", contentId))
        .collect()
        .then((reactions) => reactions.length);
    const comments = await ctx.db
        .query("comments")
        .withIndex("by_feed_item", (q) => q.eq("feedItemId", contentId))
        .collect()
        .then((comments) => comments.length);
    const shares = await ctx.db
        .query("feedItems")
        .withIndex("by_original_content", (q) => q.eq("originalContentId", contentId))
        .collect()
        .then((shares) => shares.length);
    // Calculate time windows
    const hourAgo = now - HOUR_MS;
    const dayAgo = now - DAY_MS;
    const weekAgo = now - WEEK_MS;
    // Calculate hourly engagement
    const hourlyReactions = await ctx.db
        .query("reactions")
        .withIndex("by_feed_item", (q) => q.eq("feedItemId", contentId))
        .filter((q) => q.gt(q.field("_creationTime"), hourAgo))
        .collect()
        .then((reactions) => reactions.length);
    const hourlyComments = await ctx.db
        .query("comments")
        .withIndex("by_feed_item", (q) => q.eq("feedItemId", contentId))
        .filter((q) => q.gt(q.field("_creationTime"), hourAgo))
        .collect()
        .then((comments) => comments.length);
    const hourlyShares = await ctx.db
        .query("feedItems")
        .withIndex("by_original_content", (q) => q.eq("originalContentId", contentId))
        .filter((q) => q.gt(q.field("_creationTime"), hourAgo))
        .collect()
        .then((shares) => shares.length);
    const hourlyEngagement = hourlyReactions + hourlyComments * 3 + hourlyShares * 5;
    // Calculate daily engagement
    const dailyReactions = await ctx.db
        .query("reactions")
        .withIndex("by_feed_item", (q) => q.eq("feedItemId", contentId))
        .filter((q) => q.gt(q.field("_creationTime"), dayAgo))
        .collect()
        .then((reactions) => reactions.length);
    const dailyComments = await ctx.db
        .query("comments")
        .withIndex("by_feed_item", (q) => q.eq("feedItemId", contentId))
        .filter((q) => q.gt(q.field("_creationTime"), dayAgo))
        .collect()
        .then((comments) => comments.length);
    const dailyShares = await ctx.db
        .query("feedItems")
        .withIndex("by_original_content", (q) => q.eq("originalContentId", contentId))
        .filter((q) => q.gt(q.field("_creationTime"), dayAgo))
        .collect()
        .then((shares) => shares.length);
    const dailyEngagement = dailyReactions + dailyComments * 3 + dailyShares * 5;
    // Calculate weekly engagement (this could be optimized by using the daily engagement)
    const weeklyReactions = await ctx.db
        .query("reactions")
        .withIndex("by_feed_item", (q) => q.eq("feedItemId", contentId))
        .filter((q) => q.gt(q.field("_creationTime"), weekAgo))
        .collect()
        .then((reactions) => reactions.length);
    const weeklyComments = await ctx.db
        .query("comments")
        .withIndex("by_feed_item", (q) => q.eq("feedItemId", contentId))
        .filter((q) => q.gt(q.field("_creationTime"), weekAgo))
        .collect()
        .then((comments) => comments.length);
    const weeklyShares = await ctx.db
        .query("feedItems")
        .withIndex("by_original_content", (q) => q.eq("originalContentId", contentId))
        .filter((q) => q.gt(q.field("_creationTime"), weekAgo))
        .collect()
        .then((shares) => shares.length);
    const weeklyEngagement = weeklyReactions + weeklyComments * 3 + weeklyShares * 5;
    // Calculate velocities if we have existing data
    let reactionVelocity = 0;
    let commentVelocity = 0;
    let shareVelocity = 0;
    if (existingTrending) {
        const timeWindowMs = now - existingTrending.lastUpdated;
        if (timeWindowMs > 0) {
            reactionVelocity = calculateVelocity(reactions, existingTrending.reactions, timeWindowMs);
            commentVelocity = calculateVelocity(comments, existingTrending.comments, timeWindowMs);
            shareVelocity = calculateVelocity(shares, existingTrending.shares, timeWindowMs);
        }
    }
    // Calculate trending score
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
    });
    // Extract hashtags for topics
    const topics = content.hashtags || [];
    // Update or create trending record
    if (existingTrending) {
        await ctx.db.patch(existingTrending._id, {
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
            topics,
        });
    }
    else {
        await ctx.db.insert("trendingContent", {
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
            topics,
        });
    }
}
/**
 * Simple content quality score based on content length, media, etc.
 */
export function calculateContentQuality(content) {
    let score = 1.0;
    // Longer content might be more substantial
    const contentLength = content.content.length;
    if (contentLength > 500)
        score += 0.3;
    if (contentLength > 1000)
        score += 0.2;
    // Media content tends to be more engaging
    if (content.mediaUrls && content.mediaUrls.length > 0) {
        score += 0.5;
        if (content.mediaUrls.length > 1)
            score += 0.2;
    }
    // Original posts vs shares (original content might be more valuable)
    if (content.contentType === "post")
        score += 0.2;
    // Hashtags indicate better categorized content
    if (content.hashtags && content.hashtags.length > 0) {
        score += 0.1 * Math.min(content.hashtags.length, 5);
    }
    return score;
}
