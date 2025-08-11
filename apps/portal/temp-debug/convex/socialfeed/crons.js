import { cronJobs } from "convex/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction, internalMutation } from "../_generated/server";
import { generateRecommendations } from "./lib/recommendationEngine";
import { updateTrendingMetrics } from "./lib/trendingAlgorithm";
/**
 * Internal action to update trending metrics for recent content
 * and generate recommendations for active users
 */
export const updateTrendingAndRecommendations = internalAction({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        // Process trending content
        await ctx.runMutation(internal.socialfeed.crons.updateTrendingContent, {});
        // Generate recommendations for active users
        await ctx.runMutation(internal.socialfeed.crons.generateRecommendationsForActiveUsers, {});
        return null;
    },
});
/**
 * Update trending metrics for recent content
 */
export const updateTrendingContent = internalMutation({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        // Get recent content (last 7 days)
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentContent = await ctx.db
            .query("feedItems")
            .filter((q) => q.gt(q.field("_creationTime"), weekAgo))
            .take(100);
        // Update trending metrics for each piece of content
        for (const content of recentContent) {
            await updateTrendingMetrics(ctx, content._id);
        }
        return null;
    },
});
/**
 * Generate recommendations for active users
 */
export const generateRecommendationsForActiveUsers = internalMutation({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        // Get active users (with recent activity)
        const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const recentReactions = await ctx.db
            .query("reactions")
            .filter((q) => q.gt(q.field("_creationTime"), monthAgo))
            .collect();
        // Get unique user IDs (keep as actual ID objects, not strings)
        const activeUserIds = new Set();
        recentReactions.forEach((r) => activeUserIds.add(r.userId));
        // Generate recommendations for each active user
        for (const userId of activeUserIds) {
            try {
                await generateRecommendations(ctx, userId);
            }
            catch (error) {
                console.error(`Error generating recommendations for user ${userId.toString()}:`, error);
            }
        }
        return null;
    },
});
// Define cron jobs
const crons = cronJobs();
// Run trend and recommendation updates every 6 hours
crons.interval("update-trending-and-recommendations", { hours: 6 }, internal.socialfeed.crons.updateTrendingAndRecommendations, {});
export default crons;
