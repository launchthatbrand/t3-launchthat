import { internalAction, internalMutation } from "../_generated/server";

import { cronJobs } from "convex/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

/**
 * Run periodic sync operations between Convex and Monday.com
 */
export const syncMondayData = internalAction({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    try {
      // Get active integration
      let integrationConfig;
      try {
        integrationConfig = await ctx.runQuery(
          internal.monday.queries.getIntegrationConfig,
          {},
        );
      } catch (error) {
        // No active integration
        return {
          success: false,
          message: "No active Monday.com integration configured",
        };
      }

      if (!integrationConfig || !integrationConfig.isEnabled) {
        return {
          success: false,
          message: "Monday.com integration is not configured or disabled",
        };
      }

      // Check if auto-sync is enabled
      if (
        !integrationConfig.autoSyncIntervalMinutes ||
        integrationConfig.autoSyncIntervalMinutes <= 0
      ) {
        return {
          success: false,
          message: "Auto-sync is not enabled for Monday.com integration",
        };
      }

      // Run the syncAll action
      const result = await ctx.runAction(internal.monday.actions.syncAll, {});

      // Update last sync timestamp on integration config
      await ctx.runMutation(
        internal.monday.mutations.updateIntegrationLastSync,
        {
          configId: integrationConfig._id,
          lastSyncTimestamp: Date.now(),
        },
      );

      return result;
    } catch (error) {
      console.error("Error in syncMondayData:", error);
      return {
        success: false,
        message: `Error syncing data: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

// Helper function to update integration last sync timestamp
export const updateIntegrationLastSync = internalMutation({
  args: {
    configId: v.id("mondayIntegration"),
    lastSyncTimestamp: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.configId, {
      lastSyncTimestamp: args.lastSyncTimestamp,
    });
    return true;
  },
});

// Define the cron jobs
const crons = cronJobs();

// Run the sync operation every hour
crons.interval(
  "monday-sync",
  { hours: 1 },
  internal.monday.crons.syncMondayData,
  {},
);

// Sync boards from Monday.com to Convex every hour
crons.interval(
  "sync-from-monday",
  { hours: 1 },
  internal.monday.actions.syncAll,
  { direction: "pull" },
);

// Sync orders from Convex to Monday.com every 15 minutes
crons.interval(
  "sync-orders-to-monday",
  { minutes: 15 },
  internal.monday.actions.syncOrders,
  { limit: 50 },
);

export default crons;
