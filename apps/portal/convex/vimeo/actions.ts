"use node";

import { ActionCache } from "@convex-dev/action-cache";
import { v } from "convex/values";

import { internal } from "../_generated/api";
import { action, internalAction } from "../_generated/server";
import { env } from "../../../portal/src/env";

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
    // Load connection to get access token
    const connection = await ctx.runQuery(
      internal.integrations.connections.get,
      {
        id: args.connectionId,
      },
    );

    if (!connection) {
      throw new Error("Connection not found");
    }

    // credentials expected to be JSON with accessToken or client credentials (simplified)
    let credentials: { accessToken?: string };
    try {
      credentials = JSON.parse(connection.credentials);
    } catch {
      throw new Error("Invalid credentials JSON for connection");
    }

    if (!credentials.accessToken) {
      throw new Error("Access token missing in credentials");
    }

    const accessToken = credentials.accessToken;

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
    const vimeoApp = await ctx.runQuery(
      internal.integrations.connections.queries.getVimeoApp,
      {},
    );

    if (!vimeoApp) return;

    const connections = await ctx.db
      .query("connections")
      .withIndex("by_app", (q) => q.eq("appId", vimeoApp._id))
      .collect();

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

    // Parse credentials
    let creds: { accessToken?: string; access_token?: string } = {};
    if (connection.credentials) {
      creds =
        typeof connection.credentials === "string"
          ? JSON.parse(connection.credentials)
          : (connection.credentials as typeof creds);
    }
    const token = creds.accessToken ?? creds.access_token;
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
    // 1. Find the Vimeo app
    const vimeoApp = await ctx.runQuery(
      internal.integrations.connections.queries.getVimeoApp,
      {},
    );
    if (!vimeoApp) throw new Error("Vimeo app not found");

    // 2. Find the connection for this user/org
    const connection = await ctx.runQuery(
      internal["integrations/connections"].queries.getConnectionByAppAndOwner,
      { appId: vimeoApp._id, ownerId: args.ownerId },
    );
    console.log("connection", connection);
    if (!connection)
      throw new Error("No Vimeo connection found for this user/org");

    // 3. Extract accessToken from credentials
    let credentials: { accessToken?: string; access_token?: string } = {};
    try {
      credentials = JSON.parse(connection.credentials);
    } catch {
      throw new Error("Invalid credentials JSON for connection");
    }
    const accessToken = credentials.accessToken || credentials.access_token;
    if (!accessToken) throw new Error("Access token missing in credentials");

    // 4. Fetch videos from Vimeo API
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
    console.log("fetchVimeoVideos data", data);
    return data;
  },
});

// Public action to get cached Vimeo videos
export const getCachedVimeoVideos = action({
  args: {
    ownerId: v.union(v.id("users"), v.string()),
  },
  handler: async (ctx, args) => {
    return await cache.fetch(ctx, args);
  },
});

// ActionCache instance for 5 minute caching
// const cache = new ActionCache(components.actionCache, {
//   action: internal.vimeo.actions.fetchVimeoVideos,
//   name: "vimeoVideos",
//   ttl: 1000 * 60 * 1, // 5 minutes
// });
