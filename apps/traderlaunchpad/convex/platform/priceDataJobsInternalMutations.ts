/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

export const getJobById = internalQuery({
  args: { jobId: v.id("platformPriceDataJobs") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

export const setComputedWindow = internalMutation({
  args: {
    jobId: v.id("platformPriceDataJobs"),
    computedFromTs: v.optional(v.number()),
    computedToTs: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      computedFromTs: args.computedFromTs,
      computedToTs: args.computedToTs,
    });
    return null;
  },
});

export const updateJobProgress = internalMutation({
  args: {
    jobId: v.id("platformPriceDataJobs"),
    progress: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, { progress: args.progress });
    return null;
  },
});

export const markJobError = internalMutation({
  args: { jobId: v.id("platformPriceDataJobs"), error: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "error",
      error: args.error,
      finishedAt: Date.now(),
    });
    return null;
  },
});

export const markJobDone = internalMutation({
  args: { jobId: v.id("platformPriceDataJobs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "done",
      error: undefined,
      finishedAt: Date.now(),
    });
    return null;
  },
});

