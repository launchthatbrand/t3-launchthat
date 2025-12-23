/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use node";

import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import { components, internal } from "../_generated/api";
import { action, internalAction } from "../_generated/server";

const vAny = v as any;

// Convex function reference types can get extremely deep in larger apps.
// Casting here keeps TS snappy and avoids "Type instantiation is excessively deep" errors.
const internalAny = internal as any;
const componentsAny = components as any;
const actionAny = action as any;
const internalActionAny = internalAction as any;

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

const vimeoUpsertVideoValidator = vAny.object({
  videoId: vAny.string(),
  title: vAny.string(),
  description: vAny.optional(vAny.string()),
  embedUrl: vAny.string(),
  thumbnailUrl: vAny.optional(vAny.string()),
  publishedAt: vAny.number(),
});

interface VimeoTextTrack {
  uri: string;
  active?: boolean;
  language?: string;
  name?: string;
  link?: string;
  type?: string;
  release_time?: string;
}

const resolveVimeoAccessToken = async (
  ctx: ActionCtx,
  ownerId: Id<"organizations"> | string,
) => {
  const connection = await ctx.runQuery(
    internalAny.integrations.connections.queries
      .getConnectionByNodeTypeAndOwner,
    { nodeType: "vimeo", ownerId },
  );

  if (!connection) {
    throw new Error(
      "No connected Vimeo account found. Connect Vimeo in Media Settings first.",
    );
  }

  const decrypted = await ctx.runAction(
    internalAny.integrations.connections.cryptoActions.getDecryptedSecrets,
    {
      connectionId: connection._id,
    },
  );

  const accessToken =
    decrypted?.credentials?.accessToken ??
    decrypted?.credentials?.access_token ??
    decrypted?.credentials?.token;

  if (!accessToken) {
    throw new Error("Access token missing in Vimeo credentials.");
  }

  return { accessToken };
};

const pickPreferredTextTrack = (tracks: VimeoTextTrack[]) => {
  if (!tracks.length) {
    return null;
  }
  const normalizedTracks = tracks.filter(
    (track) => !!track.link || !!track.uri,
  );
  if (!normalizedTracks.length) {
    return null;
  }
  const captionLike = normalizedTracks.filter((track) => {
    const type = (track.type ?? "").toLowerCase();
    return type === "captions" || type === "subtitles" || type === "subtitle";
  });
  const ordered = captionLike.length ? captionLike : normalizedTracks;
  const english = ordered.find((track) =>
    (track.language ?? "").toLowerCase().startsWith("en"),
  );
  return english ?? ordered[0];
};

const normalizeTrackDownloadUrl = (track: VimeoTextTrack) => {
  if (track.link) {
    return track.link;
  }
  if (track.uri) {
    return track.uri.startsWith("http")
      ? track.uri
      : `https://api.vimeo.com${track.uri}`;
  }
  return null;
};

const convertWebVttToPlainText = (raw: string) => {
  const lines = raw.split(/\r?\n/);
  const filtered: string[] = [];
  let buffer = "";
  const flush = () => {
    if (buffer.trim().length > 0) {
      filtered.push(buffer.trim());
    }
    buffer = "";
  };
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flush();
      continue;
    }
    if (trimmed.startsWith("WEBVTT")) {
      continue;
    }
    if (/^\d+$/.test(trimmed)) {
      continue;
    }
    if (trimmed.includes("-->")) {
      flush();
      continue;
    }
    buffer = buffer.length > 0 ? `${buffer} ${trimmed}` : trimmed;
  }
  flush();
  return filtered.join("\n");
};

export const syncVimeoVideos = internalActionAny({
  args: {
    connectionId: vAny.id("connections"),
  },
  returns: vAny.object({
    syncedCount: vAny.number(),
    pagesFetched: vAny.number(),
    startedAt: vAny.number(),
    finishedAt: vAny.number(),
  }),
  handler: async (ctx: any, args: any) => {
    const connection = await ctx.runQuery(
      internalAny.integrations.connections.queries.get,
      {
        id: args.connectionId,
      },
    );

    if (!connection) {
      throw new Error("Connection not found");
    }

    const decrypted = await ctx.runAction(
      internalAny.integrations.connections.cryptoActions.getDecryptedSecrets,
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

    const startedAt = Date.now();
    const now = startedAt;

    const perPage = 100;
    const maxPages = 250; // safety guard (25k videos)
    let page = 1;
    let pagesFetched = 0;
    let syncedCount = 0;

    while (page <= maxPages) {
      const url = new URL("https://api.vimeo.com/me/videos");
      url.search = new URLSearchParams({
        fields: "uri,name,description,link,created_time,pictures.sizes",
        page: String(page),
        per_page: String(perPage),
      }).toString();

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `bearer ${accessToken}`,
          Accept: "application/vnd.vimeo.*+json;version=3.4",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Failed to fetch Vimeo videos (page=${page}): ${response.status} ${text}`,
        );
      }

      const data = (await response.json()) as { data?: VimeoApiVideo[] };
      const videos: VimeoApiVideo[] = data.data ?? [];

      pagesFetched += 1;
      if (videos.length === 0) {
        break;
      }

      for (const video of videos) {
        const videoId = video.uri.replace("/videos/", "");
        const thumbnailUrl =
          video.pictures?.sizes?.[video.pictures.sizes.length - 1]?.link ??
          video.pictures?.sizes?.[0]?.link;

        const existing = await ctx.runQuery(
          internalAny.vimeo.queries.getVideoByExternalId,
          {
            connectionId: args.connectionId,
            videoId,
          },
        );

        if (existing) {
          await ctx.runMutation(internalAny.vimeo.mutations.updateVideo, {
            id: existing._id,
            title: video.name,
            description: video.description ?? undefined,
            embedUrl: video.link,
            thumbnailUrl: thumbnailUrl ?? undefined,
            publishedAt: new Date(video.created_time).getTime(),
            updatedAt: now,
          });
        } else {
          await ctx.runMutation(internalAny.vimeo.mutations.createVideo, {
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

        syncedCount += 1;
      }

      // Small throttle to be polite to the Vimeo API.
      await new Promise((resolve) => setTimeout(resolve, 150));
      page += 1;
    }

    const finishedAt = Date.now();
    return { syncedCount, pagesFetched, startedAt, finishedAt };
  },
});

export const fetchVimeoVideosPage = internalActionAny({
  args: {
    connectionId: vAny.id("connections"),
    page: vAny.number(),
    perPage: vAny.number(),
  },
  returns: vAny.object({
    videos: vAny.array(vimeoUpsertVideoValidator),
    page: vAny.number(),
    perPage: vAny.number(),
  }),
  handler: async (ctx: any, args: any) => {
    const connection = await ctx.runQuery(
      internalAny.integrations.connections.queries.get,
      { id: args.connectionId },
    );

    if (!connection) {
      throw new Error("Connection not found");
    }

    const decrypted = await ctx.runAction(
      internalAny.integrations.connections.cryptoActions.getDecryptedSecrets,
      { connectionId: args.connectionId },
    );

    const accessToken =
      decrypted?.credentials?.accessToken ??
      decrypted?.credentials?.access_token ??
      decrypted?.credentials?.token;

    if (!accessToken) {
      throw new Error("Access token missing in credentials");
    }

    const url = new URL("https://api.vimeo.com/me/videos");
    url.search = new URLSearchParams({
      fields: "uri,name,description,link,created_time,pictures.sizes",
      page: String(args.page),
      per_page: String(args.perPage),
    }).toString();

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `bearer ${accessToken}`,
        Accept: "application/vnd.vimeo.*+json;version=3.4",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Failed to fetch Vimeo videos (page=${args.page}): ${response.status} ${text}`,
      );
    }

    const data = (await response.json()) as { data?: VimeoApiVideo[] };
    const videos = (data.data ?? []).map((video) => {
      const videoId = video.uri.replace("/videos/", "");
      const thumbnailUrl =
        video.pictures?.sizes?.[video.pictures.sizes.length - 1]?.link ??
        video.pictures?.sizes?.[0]?.link ??
        undefined;

      return {
        videoId,
        title: video.name,
        description: video.description ?? undefined,
        embedUrl: video.link,
        thumbnailUrl,
        publishedAt: new Date(video.created_time).getTime(),
      };
    });

    return { videos, page: args.page, perPage: args.perPage };
  },
});

// Internal action to iterate over all Vimeo connections and sync
export const syncAllConnections = internalActionAny({
  args: {},
  returns: vAny.null(),
  handler: async (ctx: any) => {
    const connections = await ctx.runQuery(
      internalAny.integrations.connections.queries.list,
      { nodeType: "vimeo" },
    );

    for (const conn of connections) {
      await ctx.runAction(internalAny.vimeo.actions.syncVimeoVideos, {
        connectionId: conn._id,
      });
    }
    return null;
  },
});

export const refreshVimeoLibrary = actionAny({
  args: {
    ownerId: vAny.union(
      vAny.id("organizations"),
      vAny.id("users"),
      vAny.string(),
    ),
  },
  returns: vAny.object({
    syncedCount: vAny.number(),
    pagesFetched: vAny.number(),
    startedAt: vAny.number(),
    finishedAt: vAny.number(),
  }),
  handler: async (
    ctx: ActionCtx,
    args: { ownerId: Id<"organizations"> | Id<"users"> | string },
  ) => {
    const connection = await ctx.runQuery(
      internalAny.integrations.connections.queries
        .getConnectionByNodeTypeAndOwner,
      { nodeType: "vimeo", ownerId: args.ownerId },
    );

    if (!connection) {
      throw new Error("No Vimeo connection found for this owner.");
    }

    const result = await ctx.runAction(
      internalAny.vimeo.actions.syncVimeoVideos,
      {
        connectionId: connection._id,
      },
    );

    return result;
  },
});

export const listFolders = actionAny({
  args: { connectionId: vAny.id("connections") },
  returns: vAny.array(vAny.object({ id: vAny.string(), name: vAny.string() })),
  handler: async (
    ctx: ActionCtx,
    args: { connectionId: Id<"connections"> },
  ) => {
    // Fetch connection
    const connection = await ctx.runQuery(
      internalAny.integrations.connections.queries.get,
      { id: args.connectionId },
    );

    if (!connection) throw new Error("Connection not found");

    const decrypted = await ctx.runAction(
      internalAny.integrations.connections.cryptoActions.getDecryptedSecrets,
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
      data?: { uri: string; name: string }[];
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
export const fetchVimeoVideos = internalActionAny({
  args: {
    ownerId: vAny.union(vAny.id("users"), vAny.string()),
  },
  returns: vAny.any(),
  handler: async (ctx: any, args: any) => {
    const connection = await ctx.runQuery(
      internalAny.integrations.connections.queries
        .getConnectionByNodeTypeAndOwner,
      { nodeType: "vimeo", ownerId: args.ownerId },
    );

    if (!connection) {
      throw new Error("No Vimeo connection found for this user/org");
    }

    const decrypted = await ctx.runAction(
      internalAny.integrations.connections.cryptoActions.getDecryptedSecrets,
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

export const getCachedVimeoVideos = actionAny({
  args: {
    ownerId: vAny.union(vAny.id("users"), vAny.string()),
  },
  returns: vAny.any(),
  handler: async (ctx: any, args: any) => {
    const cached = await ctx.runQuery(componentsAny.actionCache.lib.get, {
      name: VIMEO_CACHE_NAME,
      args,
      ttl: VIMEO_CACHE_TTL,
    });

    if (cached && cached.kind === "hit") {
      return cached.value;
    }

    const freshValue = await ctx.runAction(
      internalAny.vimeo.actions.fetchVimeoVideos,
      args,
    );

    await ctx.runMutation(componentsAny.actionCache.lib.put, {
      name: VIMEO_CACHE_NAME,
      args,
      ttl: VIMEO_CACHE_TTL,
      value: freshValue,
      expiredEntry: cached ? cached.expiredEntry : undefined,
    });

    return freshValue;
  },
});

export const fetchTranscript = actionAny({
  args: {
    ownerId: vAny.union(vAny.id("organizations"), vAny.string()),
    videoId: vAny.string(),
  },
  returns: vAny.object({
    transcript: vAny.string(),
    rawVtt: vAny.string(),
    track: vAny.object({
      id: vAny.string(),
      label: vAny.optional(vAny.string()),
      language: vAny.optional(vAny.string()),
      type: vAny.optional(vAny.string()),
    }),
  }),
  handler: async (
    ctx: ActionCtx,
    args: { ownerId: Id<"organizations"> | string; videoId: string },
  ) => {
    const { accessToken } = await resolveVimeoAccessToken(ctx, args.ownerId);

    const textTracksResponse = await fetch(
      `https://api.vimeo.com/videos/${encodeURIComponent(args.videoId)}/texttracks?per_page=100`,
      {
        headers: {
          Authorization: `bearer ${accessToken}`,
          Accept: "application/vnd.vimeo.*+json;version=3.4",
        },
      },
    );

    if (!textTracksResponse.ok) {
      const message = await textTracksResponse.text();
      throw new Error(
        `Failed to load Vimeo text tracks (${textTracksResponse.status}): ${message}`,
      );
    }

    const textTrackJson = (await textTracksResponse.json()) as {
      data?: VimeoTextTrack[];
    };

    const track = pickPreferredTextTrack(textTrackJson.data ?? []);
    if (!track) {
      throw new Error(
        "This Vimeo video does not expose any caption/subtitle tracks.",
      );
    }

    const downloadUrl = normalizeTrackDownloadUrl(track);
    if (!downloadUrl) {
      throw new Error("Unable to determine a download URL for the text track.");
    }

    const transcriptResponse = await fetch(downloadUrl, {
      headers: downloadUrl.startsWith("https://api.vimeo.com")
        ? {
            Authorization: `bearer ${accessToken}`,
            Accept: "text/vtt, text/plain;q=0.9",
          }
        : undefined,
    });

    if (!transcriptResponse.ok) {
      const message = await transcriptResponse.text();
      throw new Error(
        `Failed to download transcript (${transcriptResponse.status}): ${message}`,
      );
    }

    const rawTranscript = await transcriptResponse.text();
    const plainText = convertWebVttToPlainText(rawTranscript);

    const trackLabel =
      track.name ??
      (track.language ? track.language.toUpperCase() : undefined) ??
      track.type ??
      "Text Track";

    const trackId = track.uri.split("/").filter(Boolean).pop() ?? args.videoId;

    return {
      transcript: plainText.length > 0 ? plainText : rawTranscript,
      rawVtt: rawTranscript,
      track: {
        id: trackId,
        label: trackLabel,
        language: track.language ?? undefined,
        type: track.type ?? undefined,
      },
    };
  },
});
