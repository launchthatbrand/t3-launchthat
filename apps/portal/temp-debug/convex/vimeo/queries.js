import { v } from "convex/values";
import { query } from "../_generated/server";
export const listVideos = query({
    args: {
        connectionId: v.optional(v.id("connections")),
    },
    returns: v.array(v.object({
        _id: v.id("vimeoVideos"),
        videoId: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        embedUrl: v.string(),
        thumbnailUrl: v.optional(v.string()),
        publishedAt: v.number(),
    })),
    handler: async (ctx, args) => {
        if (args.connectionId) {
            const connectionId = args.connectionId;
            return await ctx.db
                .query("vimeoVideos")
                .withIndex("by_connection", (q) => q.eq("connectionId", connectionId))
                .collect();
        }
        return await ctx.db.query("vimeoVideos").collect();
    },
});
export const getVideoByExternalId = query({
    args: { videoId: v.string() },
    returns: v.union(v.null(), v.object({
        _id: v.id("vimeoVideos"),
        videoId: v.string(),
        title: v.string(),
        embedUrl: v.string(),
        thumbnailUrl: v.optional(v.string()),
        publishedAt: v.number(),
        connectionId: v.id("connections"),
    })),
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("vimeoVideos")
            .withIndex("by_videoId", (q) => q.eq("videoId", args.videoId))
            .unique();
        return existing ?? null;
    },
});
