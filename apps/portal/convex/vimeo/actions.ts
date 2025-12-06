/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
"use node";

import { action, internalAction } from "../_generated/server";
import { components, internal } from "../_generated/api";

import { v } from "convex/values";

interface VimeoApiVideo {
  uri: string; // e.g. "/videos/123456"
  name: string;
  description?: string;
  link: string; // embed link
  created_time: string; // ISO date
  pictures?: {
    sizes?: { width: number; link: string }[];
  };
}

export const syncVimeoVideos = internalAction({
  args: {
    connectionId: v.id("connections"),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internal.integrations.connections.queries.get,
      {
        id: args.connectionId,
      },
    );

    if (!connection) {
      throw new Error("Connection not found");
    }

    const decrypted = await ctx.runAction(
      internal.integrations.connections.cryptoActions.getDecryptedSecrets,
      {
        connectionId: args.connectionId,
      },
    );

    const accessToken =
      decrypted?.credentials?.accessToken ??
      decrypted?.credentials?.access_token ??
      decrypted?.credentials?.token;

    if (!accessToken) {
      throw new Error("Access token missing in credentials");
    }

    // Fetch videos from Vimeo
    const response = await fetch(
      "https://api.vimeo.com/me/videos?fields=uri,name,description,link,created_time,pictures.sizes&page=1&per_page=100",
      {
        headers: {
          Authorization: `bearer ${accessToken}`,
          Accept: "application/vnd.vimeo.*+json;version=3.4",
        },
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Failed to fetch Vimeo videos: ${response.status} ${text}`,
      );
    }

    const data = (await response.json()) as { data: VimeoApiVideo[] };

    const now = Date.now();

    for (const video of data.data) {
      const videoId = video.uri.replace("/videos/", "");

      // Build thumbnail URL (choose first size)
      const thumbnailUrl = video.pictures?.sizes?.[0]?.link;

      // Upsert video in Convex
      // First, try to find existing entry by videoId
      const existing = await ctx.runQuery(
        internal.vimeo.queries.getVideoByExternalId,
        {
          videoId,
        },
      );

      if (existing) {
        await ctx.runMutation(internal.vimeo.mutations.updateVideo, {
          id: existing._id,
          title: video.name,
          description: video.description ?? undefined,
          embedUrl: video.link,
          thumbnailUrl: thumbnailUrl ?? undefined,
          publishedAt: new Date(video.created_time).getTime(),
          updatedAt: now,
        });
      } else {
        await ctx.runMutation(internal.vimeo.mutations.createVideo, {
          videoId,
          title: video.name,
          description: video.description ?? undefined,
          embedUrl: video.link,
          thumbnailUrl: thumbnailUrl ?? undefined,
          publishedAt: new Date(video.created_time).getTime(),
          connectionId: args.connectionId,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  },
});

// Internal action to iterate over all Vimeo connections and sync
export const syncAllConnections = internalAction({
  args: {},
  handler: async (ctx) => {
    const connections = await ctx.runQuery(
      internal.integrations.connections.queries.list,
      { nodeType: "vimeo" },
    );

    for (const conn of connections) {
      await ctx.runAction(internal.vimeo.actions.syncVimeoVideos, {
        connectionId: conn._id,
      });
    }
  },
});

export const listFolders = action({
  args: { connectionId: v.id("connections") },
  returns: v.array(v.object({ id: v.string(), name: v.string() })),
  handler: async (ctx, args) => {
    // Fetch connection
    const connection = await ctx.runQuery(
      internal.integrations.connections.queries.get,
      { id: args.connectionId },
    );

    if (!connection) throw new Error("Connection not found");

    const decrypted = await ctx.runAction(
      internal.integrations.connections.cryptoActions.getDecryptedSecrets,
      { connectionId: args.connectionId },
    );
    const token =
      decrypted?.credentials?.accessToken ??
      decrypted?.credentials?.access_token ??
      decrypted?.credentials?.token;
    if (!token) throw new Error("Missing Vimeo access token");

    const res = await fetch("https://api.vimeo.com/me/projects?per_page=100", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.vimeo.*+json;version=3.4",
      },
    });

    if (!res.ok) throw new Error(`Vimeo API error ${res.status}`);
    const json = (await res.json()) as {
      data?: Array<{ uri: string; name: string }>;
    };

    const folders =
      json.data?.map((d) => ({
        id: d.uri.split("/").pop() ?? d.uri,
        name: d.name,
      })) ?? [];
    return folders;
  },
});

// Internal action: fetches from Vimeo API
export const fetchVimeoVideos = internalAction({
  args: {
    ownerId: v.union(v.id("users"), v.string()),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(
      internal.integrations.connections.queries.getConnectionByNodeTypeAndOwner,
      { nodeType: "vimeo", ownerId: args.ownerId },
    );

    if (!connection) {
      throw new Error("No Vimeo connection found for this user/org");
    }

    const decrypted = await ctx.runAction(
      internal.integrations.connections.cryptoActions.getDecryptedSecrets,
      { connectionId: connection._id },
    );

    const accessToken =
      decrypted?.credentials?.accessToken ??
      decrypted?.credentials?.access_token ??
      decrypted?.credentials?.token;

    if (!accessToken) {
      throw new Error("Access token missing in credentials");
    }

    const response = await fetch(
      "https://api.vimeo.com/me/videos?fields=id,uri,name,folder,description,link,created_time,pictures.sizes&page=1&per_page=100",
      {
        headers: {
          Authorization: `bearer ${accessToken}`,
          Accept: "application/vnd.vimeo.*+json;version=3.4",
        },
      },
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Failed to fetch Vimeo videos: ${response.status} ${text}`,
      );
    }
    const data = await response.json();
    return data;
  },
});

const VIMEO_CACHE_NAME = "vimeo-fetch-v1";
const VIMEO_CACHE_TTL = 1000 * 60 * 5;

export const getCachedVimeoVideos = action({
  args: {
    ownerId: v.union(v.id("users"), v.string()),
  },
  handler: async (ctx, args) => {
    const cached = await ctx.runQuery(components.actionCache.lib.get, {
      name: VIMEO_CACHE_NAME,
      args,
      ttl: VIMEO_CACHE_TTL,
    });

    if (cached?.kind === "hit") {
      return cached.value;
    }

    const freshValue = await ctx.runAction(
      internal.vimeo.actions.fetchVimeoVideos,
      args,
    );

    await ctx.runMutation(components.actionCache.lib.put, {
      name: VIMEO_CACHE_NAME,
      args,
      ttl: VIMEO_CACHE_TTL,
      value: freshValue,
      expiredEntry: cached?.expiredEntry,
    });

    return freshValue;
  },
});
