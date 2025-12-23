/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { v } from "convex/values";

import { internal } from "../_generated/api";
import { mutation } from "../_generated/server";
import { workflow } from "../workflow";

const vAny = v as any;
const mutationAny = mutation as any;
const internalAny = internal as any;
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
  returns: vAny.id("vimeoVideos"),
  handler: async (ctx: any, args: any) => {
    return await ctx.db.insert("vimeoVideos", args);
  },
});

export const updateVideo = mutationAny({
  args: {
    id: vAny.id("vimeoVideos"),
    title: vAny.optional(vAny.string()),
    description: vAny.optional(vAny.string()),
    embedUrl: vAny.optional(vAny.string()),
    thumbnailUrl: vAny.optional(vAny.string()),
    publishedAt: vAny.optional(vAny.number()),
    updatedAt: vAny.number(),
  },
  returns: vAny.id("vimeoVideos"),
  handler: async (ctx: any, args: any) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
    return id;
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
    let inserted = 0;
    let updated = 0;

    const videos: VimeoUpsertVideo[] = args.videos;

    for (const video of videos) {
      const existing = await ctx.db
        .query("vimeoVideos")
        .withIndex("by_connection_and_videoId", (q: any) =>
          q.eq("connectionId", args.connectionId).eq("videoId", video.videoId),
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          title: video.title,
          description: video.description ?? undefined,
          embedUrl: video.embedUrl,
          thumbnailUrl: video.thumbnailUrl ?? undefined,
          publishedAt: video.publishedAt,
          updatedAt: args.now,
        });
        updated += 1;
      } else {
        await ctx.db.insert("vimeoVideos", {
          connectionId: args.connectionId,
          videoId: video.videoId,
          title: video.title,
          description: video.description ?? undefined,
          embedUrl: video.embedUrl,
          thumbnailUrl: video.thumbnailUrl ?? undefined,
          publishedAt: video.publishedAt,
          createdAt: args.now,
          updatedAt: args.now,
        });
        inserted += 1;
      }
    }

    return { inserted, updated };
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

    const existingState = await ctx.db
      .query("vimeoSyncState")
      .withIndex("by_connectionId", (q: any) =>
        q.eq("connectionId", connection._id),
      )
      .unique();

    const shouldRestart =
      Boolean(args.restart) || (existingState?.status ?? "idle") === "done";

    if (existingState && shouldRestart) {
      await ctx.db.patch(existingState._id, {
        status: "idle",
        nextPage: 1,
        syncedCount: 0,
        pagesFetched: 0,
        workflowId: undefined,
        lastError: undefined,
        startedAt: undefined,
        finishedAt: undefined,
        updatedAt: Date.now(),
      });
    }

    const workflowId = await workflowAny.start(
      ctx,
      internalAny.vimeo.workflow.vimeoSyncWorkflow,
      { connectionId: connection._id },
    );

    await ctx.runMutation(internalAny.vimeo.syncState.updateSyncState, {
      connectionId: connection._id,
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

// Mutation to trigger a background sync via scheduler
export const triggerSync = mutationAny({
  args: {
    connectionId: vAny.id("connections"),
  },
  returns: vAny.null(),
  handler: async (ctx: any, args: any) => {
    await ctx.scheduler.runAfter(0, internalAny.vimeo.actions.syncVimeoVideos, {
      connectionId: args.connectionId,
    });
    return null;
  },
});
