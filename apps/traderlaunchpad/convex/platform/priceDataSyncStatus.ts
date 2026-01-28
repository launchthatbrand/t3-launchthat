/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { query } from "../_generated/server";

const requirePlatformAdmin = async (ctx: any) => {
  await ctx.runQuery(internal.platform.testsAuth.assertPlatformAdmin, {});
};

export const getSchedulerState = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("platformPriceDataSyncSchedulerState"),
      _creationTime: v.number(),
      key: v.string(),
      lastTickAt: v.optional(v.number()),
      lastTickOkAt: v.optional(v.number()),
      lastTickError: v.optional(v.string()),
      processedRulesLastTick: v.optional(v.number()),
      updatedAt: v.number(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);
    const row: any = await ctx.db
      .query("platformPriceDataSyncSchedulerState")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .first();
    return row ?? null;
  },
});

