/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { v } from "convex/values";

import { internalMutation, internalQuery, query } from "../_generated/server";

const vAny = v as any;
const queryAny = query as any;
const internalQueryAny = internalQuery as any;
const internalMutationAny = internalMutation as any;

const syncStateValidator = vAny.object({
  _id: vAny.id("vimeoSyncState"),
  connectionId: vAny.id("connections"),
  status: vAny.union(
    vAny.literal("idle"),
    vAny.literal("running"),
    vAny.literal("error"),
    vAny.literal("done"),
  ),
  nextPage: vAny.number(),
  perPage: vAny.number(),
  syncedCount: vAny.number(),
  pagesFetched: vAny.number(),
  workflowId: vAny.optional(vAny.string()),
  lastError: vAny.optional(vAny.string()),
  startedAt: vAny.optional(vAny.number()),
  finishedAt: vAny.optional(vAny.number()),
  updatedAt: vAny.number(),
});

const normalizeSyncStateRow = (row: any) => ({
  _id: row._id,
  connectionId: row.connectionId,
  status: row.status,
  nextPage: row.nextPage,
  perPage: row.perPage,
  syncedCount: row.syncedCount,
  pagesFetched: row.pagesFetched,
  workflowId: row.workflowId ?? undefined,
  lastError: row.lastError ?? undefined,
  startedAt: row.startedAt ?? undefined,
  finishedAt: row.finishedAt ?? undefined,
  updatedAt: row.updatedAt,
});

export const getSyncStateByConnection = internalQueryAny({
  args: { connectionId: vAny.id("connections") },
  returns: vAny.union(vAny.null(), syncStateValidator),
  handler: async (ctx: any, args: any) => {
    const row = await ctx.db
      .query("vimeoSyncState")
      .withIndex("by_connectionId", (q: any) =>
        q.eq("connectionId", args.connectionId),
      )
      .unique();
    return row ? normalizeSyncStateRow(row) : null;
  },
});

export const updateSyncState = internalMutationAny({
  args: {
    connectionId: vAny.id("connections"),
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
    workflowId: vAny.optional(vAny.union(vAny.string(), vAny.null())),
    lastError: vAny.optional(vAny.union(vAny.string(), vAny.null())),
    startedAt: vAny.optional(vAny.union(vAny.number(), vAny.null())),
    finishedAt: vAny.optional(vAny.union(vAny.number(), vAny.null())),
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
    const applyNullable = <T>(value: T | null | undefined) =>
      value ?? undefined;

    if (existing) {
      const nextSyncedCount =
        args.setSyncedCount ??
        existing.syncedCount + (args.syncedCountDelta ?? 0);
      const nextPagesFetched =
        args.setPagesFetched ??
        existing.pagesFetched + (args.pagesFetchedDelta ?? 0);

      await ctx.db.patch(existing._id, {
        status: args.status ?? existing.status,
        nextPage: args.nextPage ?? existing.nextPage,
        perPage: args.perPage ?? existing.perPage,
        syncedCount: nextSyncedCount,
        pagesFetched: nextPagesFetched,
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
      workflowId: applyNullable(args.workflowId),
      lastError: applyNullable(args.lastError),
      startedAt: applyNullable(args.startedAt),
      finishedAt: applyNullable(args.finishedAt),
      updatedAt: now,
    });
  },
});

export const getVimeoSyncStatus = queryAny({
  args: { organizationId: vAny.id("organizations") },
  returns: vAny.union(vAny.null(), syncStateValidator),
  handler: async (ctx: any, args: any) => {
    const connection = await ctx.db
      .query("connections")
      .withIndex("by_node_type_and_owner", (q: any) =>
        q.eq("nodeType", "vimeo").eq("ownerId", args.organizationId),
      )
      .unique();
    if (!connection) return null;

    const state = await ctx.db
      .query("vimeoSyncState")
      .withIndex("by_connectionId", (q: any) =>
        q.eq("connectionId", connection._id),
      )
      .unique();

    return state ? normalizeSyncStateRow(state) : null;
  },
});
