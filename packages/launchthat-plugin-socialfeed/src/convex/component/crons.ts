import { cronJobs } from "convex/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalAction, internalMutation } from "./_generated/server";
import { generateRecommendations } from "./lib/recommendationEngine";
import { updateTrendingMetrics } from "./lib/trendingAlgorithm";

export const updateTrendingAndRecommendations = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.runMutation(internal.crons.updateTrendingContent, {});
    await ctx.runMutation(
      internal.crons.generateRecommendationsForActiveUsers,
      {},
    );
    return null;
  },
});

export const updateTrendingContent = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const recentContent = await ctx.db
      .query("feedItems")
      .filter((q) => q.gt(q.field("_creationTime"), weekAgo))
      .take(100);

    for (const content of recentContent) {
      await updateTrendingMetrics(ctx, content._id);
    }

    return null;
  },
});

export const generateRecommendationsForActiveUsers = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const recentReactions = await ctx.db
      .query("reactions")
      .filter((q) => q.gt(q.field("_creationTime"), monthAgo))
      .collect();

    const activeUserIds = new Set<string>();
    recentReactions.forEach((r) => activeUserIds.add(r.userId));

    for (const userId of activeUserIds) {
      try {
        await generateRecommendations(ctx, userId);
      } catch (error) {
        console.error(
          `Error generating recommendations for user ${userId}:`,
          error,
        );
      }
    }

    return null;
  },
});

const crons = cronJobs();

crons.interval(
  "update-trending-and-recommendations",
  { hours: 6 },
  internal.crons.updateTrendingAndRecommendations,
  {},
);

export default crons;


