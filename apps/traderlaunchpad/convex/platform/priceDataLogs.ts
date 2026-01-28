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

export const listRecentLogs = query({
  args: {
    limit: v.optional(v.number()),
    jobId: v.optional(v.id("platformPriceDataJobs")),
  },
  returns: v.array(
    v.object({
      _id: v.id("platformPriceDataJobLogs"),
      _creationTime: v.number(),
      jobId: v.id("platformPriceDataJobs"),
      ts: v.number(),
      level: v.union(v.literal("info"), v.literal("warn"), v.literal("error")),
      message: v.string(),
      data: v.optional(v.any()),
    }),
  ),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const limit = Math.max(1, Math.min(500, Number(args.limit ?? 200)));

    if (args.jobId !== undefined) {
      const rows = await ctx.db
        .query("platformPriceDataJobLogs")
        .withIndex("by_jobId_and_ts", (q) => q.eq("jobId", args.jobId!))
        .order("desc")
        .take(limit);
      return rows;
    }

    const rows = await ctx.db
      .query("platformPriceDataJobLogs")
      .withIndex("by_ts")
      .order("desc")
      .take(limit);
    return rows;
  },
});

