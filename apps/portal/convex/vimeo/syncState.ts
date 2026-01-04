/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { v } from "convex/values";

import { components } from "../_generated/api";
import { internalMutation, internalQuery, query } from "../_generated/server";

const vAny = v as any;
const queryAny = query as any;
const internalQueryAny = internalQuery as any;
const internalMutationAny = internalMutation as any;
const componentsAny = components as any;

const syncStateValidator = vAny.object({
  _id: vAny.string(),
  connectionId: vAny.string(),
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
  totalVideos: vAny.optional(vAny.number()),
  estimatedTotalPages: vAny.optional(vAny.number()),
  workflowId: vAny.optional(vAny.string()),
  lastError: vAny.optional(vAny.string()),
  startedAt: vAny.optional(vAny.number()),
  finishedAt: vAny.optional(vAny.number()),
  webhookSecret: vAny.optional(vAny.string()),
  webhookId: vAny.optional(vAny.string()),
  webhookStatus: vAny.optional(
    vAny.union(
      vAny.literal("idle"),
      vAny.literal("active"),
      vAny.literal("error"),
      vAny.literal("disabled"),
    ),
  ),
  webhookLastEventAt: vAny.optional(vAny.number()),
  webhookLastError: vAny.optional(vAny.string()),
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
  totalVideos: row.totalVideos ?? undefined,
  estimatedTotalPages: row.estimatedTotalPages ?? undefined,
  workflowId: row.workflowId ?? undefined,
  lastError: row.lastError ?? undefined,
  startedAt: row.startedAt ?? undefined,
  finishedAt: row.finishedAt ?? undefined,
  webhookSecret: row.webhookSecret ?? undefined,
  webhookId: row.webhookId ?? undefined,
  webhookStatus: row.webhookStatus ?? undefined,
  webhookLastEventAt: row.webhookLastEventAt ?? undefined,
  webhookLastError: row.webhookLastError ?? undefined,
  updatedAt: row.updatedAt,
});

export const getSyncStateByConnection = internalQueryAny({
  args: { connectionId: vAny.string() },
  returns: vAny.union(vAny.null(), syncStateValidator),
  handler: async (ctx: any, args: any) => {
    const row = await ctx.runQuery(
      componentsAny.launchthat_vimeo.syncState.queries.getSyncStateByConnection,
      { connectionId: args.connectionId },
    );
    return row ? normalizeSyncStateRow(row) : null;
  },
});

export const updateSyncState = internalMutationAny({
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
  returns: vAny.string(),
  handler: async (ctx: any, args: any) => {
    const id = await ctx.runMutation(
      componentsAny.launchthat_vimeo.syncState.mutations.updateSyncState,
      args,
    );
    return String(id);
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

    const state = await ctx.runQuery(
      componentsAny.launchthat_vimeo.syncState.queries.getSyncStateByConnection,
      { connectionId: String(connection._id) },
    );
    return state ? normalizeSyncStateRow(state) : null;
  },
});
