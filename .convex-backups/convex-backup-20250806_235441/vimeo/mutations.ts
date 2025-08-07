import { v } from "convex/values";

import { internal } from "../_generated/api";
import { mutation } from "../_generated/server";

export const createVideo = mutation({
  args: {
    videoId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    embedUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),
    publishedAt: v.number(),
    connectionId: v.id("connections"),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  returns: v.id("vimeoVideos"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("vimeoVideos", args);
  },
});

export const updateVideo = mutation({
  args: {
    id: v.id("vimeoVideos"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    embedUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    updatedAt: v.number(),
  },
  returns: v.id("vimeoVideos"),
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
    return id;
  },
});

// Mutation to trigger a background sync via scheduler
export const triggerSync = mutation({
  args: {
    connectionId: v.id("connections"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internal.vimeo.actions.syncVimeoVideos, {
      connectionId: args.connectionId,
    });
    return null;
  },
});
