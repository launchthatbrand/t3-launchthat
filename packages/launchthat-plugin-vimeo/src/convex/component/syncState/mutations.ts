/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { mutation } from "../_generated/server";

const vAny = v as any;
const mutationAny = mutation as any;

export const updateSyncState = mutationAny({
  args: {
    connectionId: vAny.string(),
    status: vAny.optional(
      vAny.union(
        vAny.literal("idle"),
        vAny.literal("running"),
        vAny.literal("error"),
        vAny.literal("done"),
      ),
    ),
    nextPage: vAny.optional(vAny.number()),
    perPage: vAny.optional(vAny.number()),
    syncedCountDelta: vAny.optional(vAny.number()),
    pagesFetchedDelta: vAny.optional(vAny.number()),
    setSyncedCount: vAny.optional(vAny.number()),
    setPagesFetched: vAny.optional(vAny.number()),
    totalVideos: vAny.optional(vAny.union(vAny.number(), vAny.null())),
    estimatedTotalPages: vAny.optional(vAny.union(vAny.number(), vAny.null())),
    workflowId: vAny.optional(vAny.union(vAny.string(), vAny.null())),
    lastError: vAny.optional(vAny.union(vAny.string(), vAny.null())),
    startedAt: vAny.optional(vAny.union(vAny.number(), vAny.null())),
    finishedAt: vAny.optional(vAny.union(vAny.number(), vAny.null())),
    webhookSecret: vAny.optional(vAny.union(vAny.string(), vAny.null())),
    webhookId: vAny.optional(vAny.union(vAny.string(), vAny.null())),
    webhookStatus: vAny.optional(
      vAny.union(
        vAny.literal("idle"),
        vAny.literal("active"),
        vAny.literal("error"),
        vAny.literal("disabled"),
        vAny.null(),
      ),
    ),
    webhookLastEventAt: vAny.optional(vAny.union(vAny.number(), vAny.null())),
    webhookLastError: vAny.optional(vAny.union(vAny.string(), vAny.null())),
  },
  returns: vAny.id("vimeoSyncState"),
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query("vimeoSyncState")
      .withIndex("by_connectionId", (q: any) =>
        q.eq("connectionId", args.connectionId),
      )
      .unique();

    const now = Date.now();
    const applyNullable = <T>(value: T | null | undefined) => value ?? undefined;

    if (existing) {
      const nextSyncedCount =
        args.setSyncedCount ?? existing.syncedCount + (args.syncedCountDelta ?? 0);
      const nextPagesFetched =
        args.setPagesFetched ??
        existing.pagesFetched + (args.pagesFetchedDelta ?? 0);

      await ctx.db.patch(existing._id, {
        status: args.status ?? existing.status,
        nextPage: args.nextPage ?? existing.nextPage,
        perPage: args.perPage ?? existing.perPage,
        syncedCount: nextSyncedCount,
        pagesFetched: nextPagesFetched,
        totalVideos:
          args.totalVideos !== undefined
            ? applyNullable(args.totalVideos)
            : existing.totalVideos,
        estimatedTotalPages:
          args.estimatedTotalPages !== undefined
            ? applyNullable(args.estimatedTotalPages)
            : existing.estimatedTotalPages,
        workflowId:
          args.workflowId !== undefined
            ? applyNullable(args.workflowId)
            : existing.workflowId,
        lastError:
          args.lastError !== undefined
            ? applyNullable(args.lastError)
            : existing.lastError,
        startedAt:
          args.startedAt !== undefined
            ? applyNullable(args.startedAt)
            : existing.startedAt,
        finishedAt:
          args.finishedAt !== undefined
            ? applyNullable(args.finishedAt)
            : existing.finishedAt,
        webhookSecret:
          args.webhookSecret !== undefined
            ? applyNullable(args.webhookSecret)
            : existing.webhookSecret,
        webhookId:
          args.webhookId !== undefined
            ? applyNullable(args.webhookId)
            : existing.webhookId,
        webhookStatus:
          args.webhookStatus !== undefined
            ? applyNullable(args.webhookStatus)
            : existing.webhookStatus,
        webhookLastEventAt:
          args.webhookLastEventAt !== undefined
            ? applyNullable(args.webhookLastEventAt)
            : existing.webhookLastEventAt,
        webhookLastError:
          args.webhookLastError !== undefined
            ? applyNullable(args.webhookLastError)
            : existing.webhookLastError,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("vimeoSyncState", {
      connectionId: args.connectionId,
      status: args.status ?? "idle",
      nextPage: args.nextPage ?? 1,
      perPage: args.perPage ?? 100,
      syncedCount: args.setSyncedCount ?? args.syncedCountDelta ?? 0,
      pagesFetched: args.setPagesFetched ?? args.pagesFetchedDelta ?? 0,
      totalVideos: applyNullable(args.totalVideos),
      estimatedTotalPages: applyNullable(args.estimatedTotalPages),
      workflowId: applyNullable(args.workflowId),
      lastError: applyNullable(args.lastError),
      startedAt: applyNullable(args.startedAt),
      finishedAt: applyNullable(args.finishedAt),
      webhookSecret: applyNullable(args.webhookSecret),
      webhookId: applyNullable(args.webhookId),
      webhookStatus: applyNullable(args.webhookStatus),
      webhookLastEventAt: applyNullable(args.webhookLastEventAt),
      webhookLastError: applyNullable(args.webhookLastError),
      updatedAt: now,
    });
  },
});



