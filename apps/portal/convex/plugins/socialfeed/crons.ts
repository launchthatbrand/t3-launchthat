import { cronJobs } from "convex/server";
import { v } from "convex/values";

import { components } from "../../_generated/api";
import { internalAction, internalMutation } from "../../_generated/server";

/**
 * Internal action to update trending metrics for recent content
 * and generate recommendations for active users
 */
export const updateTrendingAndRecommendations = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const socialfeedCrons = components.launchthat_socialfeed.crons;
    await ctx.runMutation(socialfeedCrons.updateTrendingContent, {});
    await ctx.runMutation(
      socialfeedCrons.generateRecommendationsForActiveUsers,
      {},
    );

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
    const socialfeedCrons = components.launchthat_socialfeed.crons;
    await ctx.runMutation(socialfeedCrons.updateTrendingContent, {});
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
    const socialfeedCrons = components.launchthat_socialfeed.crons;
    await ctx.runMutation(
      socialfeedCrons.generateRecommendationsForActiveUsers,
      {},
    );
    return null;
  },
});

// Define cron jobs
const crons = cronJobs();

// NOTE: The portal app does not currently wire a root-level `convex/crons.ts`,
// so this file's default export is not scheduled. The socialfeed component
// defines its own cron schedule (within the component), so we intentionally
// leave this portal cron list empty.

export default crons;
