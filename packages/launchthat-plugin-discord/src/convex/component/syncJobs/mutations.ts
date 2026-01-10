import { v } from "convex/values";
import { mutation } from "../server";

export const enqueueSyncJob = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    reason: v.union(
      v.literal("purchase"),
      v.literal("tagChange"),
      v.literal("manual"),
    ),
    payload: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("syncJobs", {
      organizationId: args.organizationId,
      userId: args.userId,
      reason: args.reason,
      payload: args.payload,
      status: "pending",
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    });
    return null;
  },
});

export const setJobStatus = mutation({
  args: {
    jobId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("done"),
      v.literal("failed"),
    ),
    attempts: v.optional(v.number()),
    lastError: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId as any);
    if (!job) return null;
    await ctx.db.patch(job._id, {
      status: args.status,
      attempts: typeof args.attempts === "number" ? args.attempts : (job as any).attempts,
      lastError: args.lastError,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const deleteJob = mutation({
  args: { jobId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId as any);
    if (!job) return null;
    await ctx.db.delete(job._id);
    return null;
  },
});


