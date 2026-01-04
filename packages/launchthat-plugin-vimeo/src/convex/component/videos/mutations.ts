/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { mutation } from "../_generated/server";

const vAny = v as any;
const mutationAny = mutation as any;

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
    connectionId: vAny.string(),
    createdAt: vAny.number(),
    updatedAt: vAny.number(),
  },
  returns: vAny.id("vimeoVideos"),
  handler: async (ctx: any, args: any) => {
    return await ctx.db.insert("vimeoVideos", {
      connectionId: args.connectionId,
      videoId: args.videoId,
      title: args.title,
      description: args.description ?? undefined,
      embedUrl: args.embedUrl,
      thumbnailUrl: args.thumbnailUrl ?? undefined,
      publishedAt: args.publishedAt,
      status: "active",
      deletedAt: undefined,
      lastSyncedAt: args.updatedAt,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });
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
    await ctx.db.patch(id, {
      ...data,
      status: "active",
      deletedAt: undefined,
      lastSyncedAt: args.updatedAt,
    });
    return id;
  },
});

export const upsertVideosPage = mutationAny({
  args: {
    connectionId: vAny.string(),
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
          status: "active",
          deletedAt: undefined,
          lastSyncedAt: args.now,
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
          status: "active",
          deletedAt: undefined,
          lastSyncedAt: args.now,
          createdAt: args.now,
          updatedAt: args.now,
        });
        inserted += 1;
      }
    }

    return { inserted, updated };
  },
});

export const upsertVideo = mutationAny({
  args: {
    connectionId: vAny.string(),
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
    id: vAny.id("vimeoVideos"),
    inserted: vAny.boolean(),
  }),
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query("vimeoVideos")
      .withIndex("by_connection_and_videoId", (q: any) =>
        q
          .eq("connectionId", args.connectionId)
          .eq("videoId", args.video.videoId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.video.title,
        description: args.video.description ?? undefined,
        embedUrl: args.video.embedUrl,
        thumbnailUrl: args.video.thumbnailUrl ?? undefined,
        publishedAt: args.video.publishedAt,
        status: "active",
        deletedAt: undefined,
        lastSyncedAt: args.now,
        updatedAt: args.now,
      });
      return { id: existing._id, inserted: false };
    }

    const id = await ctx.db.insert("vimeoVideos", {
      connectionId: args.connectionId,
      videoId: args.video.videoId,
      title: args.video.title,
      description: args.video.description ?? undefined,
      embedUrl: args.video.embedUrl,
      thumbnailUrl: args.video.thumbnailUrl ?? undefined,
      publishedAt: args.video.publishedAt,
      status: "active",
      deletedAt: undefined,
      lastSyncedAt: args.now,
      createdAt: args.now,
      updatedAt: args.now,
    });
    return { id, inserted: true };
  },
});

export const markVideoDeleted = mutationAny({
  args: {
    connectionId: vAny.string(),
    videoId: vAny.string(),
    deletedAt: vAny.number(),
  },
  returns: vAny.boolean(),
  handler: async (ctx: any, args: any) => {
    const existing = await ctx.db
      .query("vimeoVideos")
      .withIndex("by_connection_and_videoId", (q: any) =>
        q.eq("connectionId", args.connectionId).eq("videoId", args.videoId),
      )
      .unique();

    if (!existing) return false;

    await ctx.db.patch(existing._id, {
      status: "deleted",
      deletedAt: args.deletedAt,
      lastSyncedAt: args.deletedAt,
      updatedAt: args.deletedAt,
    });
    return true;
  },
});



