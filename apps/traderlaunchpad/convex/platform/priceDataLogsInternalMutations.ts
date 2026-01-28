/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const appendLog = internalMutation({
  args: {
    jobId: v.id("platformPriceDataJobs"),
    level: v.union(v.literal("info"), v.literal("warn"), v.literal("error")),
    message: v.string(),
    data: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("platformPriceDataJobLogs", {
      jobId: args.jobId,
      ts: Date.now(),
      level: args.level,
      message: args.message,
      data: args.data,
    });
    return null;
  },
});

