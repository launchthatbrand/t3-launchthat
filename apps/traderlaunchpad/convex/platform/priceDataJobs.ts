/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access
*/

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { mutation, query } from "../_generated/server";
import { workflow } from "../workflow";
import { requirePlatformAdmin } from "../traderlaunchpad/lib/resolve";

const workflowAny = workflow as any;
const internalAny = internal as any;

export const listJobs = query({
  args: {
    limit: v.optional(v.number()),
    sourceKey: v.optional(v.string()),
    tradableInstrumentId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("platformPriceDataJobs"),
      _creationTime: v.number(),
      status: v.union(
        v.literal("queued"),
        v.literal("running"),
        v.literal("done"),
        v.literal("error"),
      ),
      sourceKey: v.string(),
      tradableInstrumentId: v.string(),
      symbol: v.string(),
      resolution: v.union(v.literal("1m")),
      requestedLookbackDays: v.number(),
      overlapDays: v.number(),
      computedFromTs: v.optional(v.number()),
      computedToTs: v.optional(v.number()),
      workflowId: v.optional(v.string()),
      createdAt: v.number(),
      startedAt: v.optional(v.number()),
      finishedAt: v.optional(v.number()),
      progress: v.optional(v.any()),
      error: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const limit = Math.max(1, Math.min(200, Number(args.limit ?? 50)));
    const sourceKey = typeof args.sourceKey === "string" ? args.sourceKey.trim() : "";
    const tradableInstrumentId =
      typeof args.tradableInstrumentId === "string" ? args.tradableInstrumentId.trim() : "";

    let q = ctx.db.query("platformPriceDataJobs").withIndex("by_createdAt");
    if (sourceKey && tradableInstrumentId) {
      q = ctx.db
        .query("platformPriceDataJobs")
        .withIndex("by_source_and_instrument", (ix) =>
          ix.eq("sourceKey", sourceKey).eq("tradableInstrumentId", tradableInstrumentId),
        );
    }

    const rows = await q.order("desc").take(limit);
    return (Array.isArray(rows) ? rows : []).map((r: any) => ({
      _id: r._id,
      _creationTime: r._creationTime,
      status: r.status,
      sourceKey: r.sourceKey,
      tradableInstrumentId: r.tradableInstrumentId,
      symbol: r.symbol,
      resolution: r.resolution,
      requestedLookbackDays: r.requestedLookbackDays,
      overlapDays: r.overlapDays,
      computedFromTs: r.computedFromTs,
      computedToTs: r.computedToTs,
      workflowId: r.workflowId,
      createdAt: r.createdAt,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
      progress: r.progress,
      error: r.error,
    }));
  },
});

export const startBackfillJob1m = mutation({
  args: {
    sourceKey: v.string(),
    tradableInstrumentId: v.string(),
    symbol: v.string(),
    requestedLookbackDays: v.union(
      v.literal(1),
      v.literal(3),
      v.literal(7),
      v.literal(14),
      v.literal(30),
      v.literal(60),
      v.literal(90),
    ),
    overlapDays: v.optional(v.number()),
  },
  returns: v.object({
    jobId: v.id("platformPriceDataJobs"),
    workflowId: v.string(),
  }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const sourceKey = args.sourceKey.trim().toLowerCase();
    const tradableInstrumentId = args.tradableInstrumentId.trim();
    const symbol = args.symbol.trim().toUpperCase();
    if (!sourceKey) throw new Error("Missing sourceKey");
    if (!tradableInstrumentId) throw new Error("Missing tradableInstrumentId");
    if (!symbol) throw new Error("Missing symbol");

    const overlapDays = Number.isFinite(args.overlapDays ?? NaN)
      ? Math.max(0, Math.min(7, Math.floor(args.overlapDays ?? 1)))
      : 1;

    const now = Date.now();
    const jobId = await ctx.db.insert("platformPriceDataJobs", {
      status: "queued",
      sourceKey,
      tradableInstrumentId,
      symbol,
      resolution: "1m",
      requestedLookbackDays: args.requestedLookbackDays,
      overlapDays,
      createdAt: now,
    });

    const workflowId = await workflowAny.start(
      ctx,
      internalAny.platform.priceDataWorkflow.backfillPriceData1mWorkflow,
      { jobId },
    );

    await ctx.db.patch(jobId, {
      status: "running",
      workflowId,
      startedAt: now,
      error: undefined,
    });

    return { jobId, workflowId };
  },
});

