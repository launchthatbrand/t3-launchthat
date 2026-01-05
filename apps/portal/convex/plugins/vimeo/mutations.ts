/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { v } from "convex/values";

import { internal } from "../../_generated/api";
import { components } from "../../_generated/api";
import { mutation } from "../../_generated/server";
import { workflow } from "../../workflow";

const vAny = v as any;
const mutationAny = mutation as any;
const internalAny = internal as any;
const componentsAny = components as any;
const workflowAny = workflow as any;

interface VimeoUpsertVideo {
  videoId: string;
  title: string;
  description?: string;
  embedUrl: string;
  thumbnailUrl?: string;
  publishedAt: number;
}

export const createVideo = mutationAny({
  args: {
    videoId: vAny.string(),
    title: vAny.string(),
    description: vAny.optional(vAny.string()),
    embedUrl: vAny.string(),
    thumbnailUrl: vAny.optional(vAny.string()),
    publishedAt: vAny.number(),
    connectionId: vAny.id("connections"),
    createdAt: vAny.number(),
    updatedAt: vAny.number(),
  },
  returns: vAny.string(),
  handler: async (ctx: any, args: any) => {
    const id = await ctx.runMutation(
      componentsAny.launchthat_vimeo.videos.mutations.createVideo,
      { ...args, connectionId: String(args.connectionId) },
    );
    return String(id);
  },
});

export const updateVideo = mutationAny({
  args: {
    id: vAny.string(),
    title: vAny.optional(vAny.string()),
    description: vAny.optional(vAny.string()),
    embedUrl: vAny.optional(vAny.string()),
    thumbnailUrl: vAny.optional(vAny.string()),
    publishedAt: vAny.optional(vAny.number()),
    updatedAt: vAny.number(),
  },
  returns: vAny.string(),
  handler: async (ctx: any, args: any) => {
    const id = await ctx.runMutation(
      componentsAny.launchthat_vimeo.videos.mutations.updateVideo,
      args,
    );
    return String(id);
  },
});

export const upsertVideosPage = mutationAny({
  args: {
    connectionId: vAny.id("connections"),
    videos: vAny.array(
      vAny.object({
        videoId: vAny.string(),
        title: vAny.string(),
        description: vAny.optional(vAny.string()),
        embedUrl: vAny.string(),
        thumbnailUrl: vAny.optional(vAny.string()),
        publishedAt: vAny.number(),
      }),
    ),
    now: vAny.number(),
  },
  returns: vAny.object({
    inserted: vAny.number(),
    updated: vAny.number(),
  }),
  handler: async (ctx: any, args: any) => {
    return await ctx.runMutation(
      componentsAny.launchthat_vimeo.videos.mutations.upsertVideosPage,
      { ...args, connectionId: String(args.connectionId) },
    );
  },
});

export const upsertVideo = mutationAny({
  args: {
    connectionId: vAny.id("connections"),
    video: vAny.object({
      videoId: vAny.string(),
      title: vAny.string(),
      description: vAny.optional(vAny.string()),
      embedUrl: vAny.string(),
      thumbnailUrl: vAny.optional(vAny.string()),
      publishedAt: vAny.number(),
    }),
    now: vAny.number(),
  },
  returns: vAny.object({
    id: vAny.string(),
    inserted: vAny.boolean(),
  }),
  handler: async (ctx: any, args: any) => {
    const result = await ctx.runMutation(
      componentsAny.launchthat_vimeo.videos.mutations.upsertVideo,
      { ...args, connectionId: String(args.connectionId) },
    );
    return { ...result, id: String(result.id) };
  },
});

export const markVideoDeleted = mutationAny({
  args: {
    connectionId: vAny.id("connections"),
    videoId: vAny.string(),
    deletedAt: vAny.number(),
  },
  returns: vAny.boolean(),
  handler: async (ctx: any, args: any) => {
    return await ctx.runMutation(
      componentsAny.launchthat_vimeo.videos.mutations.markVideoDeleted,
      { ...args, connectionId: String(args.connectionId) },
    );
  },
});

export const startVimeoSync = mutationAny({
  args: {
    organizationId: vAny.id("organizations"),
    restart: vAny.optional(vAny.boolean()),
  },
  returns: vAny.object({
    connectionId: vAny.id("connections"),
    workflowId: vAny.string(),
  }),
  handler: async (ctx: any, args: any) => {
    const connection = await ctx.db
      .query("connections")
      .withIndex("by_node_type_and_owner", (q: any) =>
        q.eq("nodeType", "vimeo").eq("ownerId", args.organizationId),
      )
      .unique();

    if (!connection) {
      throw new Error(
        "No connected Vimeo account found. Connect Vimeo in Media Settings first.",
      );
    }

    const existingState = await ctx.runQuery(
      componentsAny.launchthat_vimeo.syncState.queries.getSyncStateByConnection,
      { connectionId: String(connection._id) },
    );

    const shouldRestart =
      Boolean(args.restart) || (existingState?.status ?? "idle") === "done";

    if (existingState && shouldRestart) {
      await ctx.runMutation(componentsAny.launchthat_vimeo.syncState.mutations.updateSyncState, {
        connectionId: String(connection._id),
        status: "idle",
        nextPage: 1,
        setSyncedCount: 0,
        setPagesFetched: 0,
        workflowId: null,
        lastError: null,
        startedAt: null,
        finishedAt: null,
      });
    }

    const workflowId = await workflowAny.start(
      ctx,
      internalAny.plugins.vimeo.workflow.vimeoSyncWorkflow,
      { connectionId: connection._id },
    );

    await ctx.runMutation(internalAny.plugins.vimeo.syncState.updateSyncState, {
      connectionId: String(connection._id),
      status: "running",
      workflowId,
      startedAt: existingState?.startedAt ?? Date.now(),
      finishedAt: null,
      lastError: null,
      nextPage: existingState?.nextPage ?? 1,
    });

    return { connectionId: connection._id, workflowId };
  },
});

// Internal/backstop-oriented starter that works directly from a connectionId.
export const startVimeoSyncForConnection = mutationAny({
  args: {
    connectionId: vAny.id("connections"),
    restart: vAny.optional(vAny.boolean()),
    maxPages: vAny.optional(vAny.number()),
  },
  returns: vAny.object({
    connectionId: vAny.id("connections"),
    workflowId: vAny.string(),
  }),
  handler: async (ctx: any, args: any) => {
    const existingState = await ctx.runQuery(
      componentsAny.launchthat_vimeo.syncState.queries.getSyncStateByConnection,
      { connectionId: String(args.connectionId) },
    );

    const shouldRestart =
      Boolean(args.restart) || (existingState?.status ?? "idle") === "done";

    if (existingState && shouldRestart) {
      await ctx.runMutation(componentsAny.launchthat_vimeo.syncState.mutations.updateSyncState, {
        connectionId: String(args.connectionId),
        status: "idle",
        nextPage: 1,
        setSyncedCount: 0,
        setPagesFetched: 0,
        workflowId: null,
        lastError: null,
        startedAt: null,
        finishedAt: null,
      });
    }

    const workflowId = await workflowAny.start(
      ctx,
      internalAny.plugins.vimeo.workflow.vimeoSyncWorkflow,
      { connectionId: args.connectionId, maxPages: args.maxPages },
    );

    await ctx.runMutation(internalAny.plugins.vimeo.syncState.updateSyncState, {
      connectionId: String(args.connectionId),
      status: "running",
      workflowId,
      startedAt: existingState?.startedAt ?? Date.now(),
      finishedAt: null,
      lastError: null,
      nextPage: existingState?.nextPage ?? 1,
    });

    return { connectionId: args.connectionId, workflowId };
  },
});

// Mutation to trigger a background sync via scheduler
export const triggerSync = mutationAny({
  args: {
    connectionId: vAny.id("connections"),
  },
  returns: vAny.null(),
  handler: async (ctx: any, args: any) => {
    await ctx.scheduler.runAfter(0, internalAny.plugins.vimeo.actions.syncVimeoVideos, {
      connectionId: args.connectionId,
    });
    return null;
  },
});
