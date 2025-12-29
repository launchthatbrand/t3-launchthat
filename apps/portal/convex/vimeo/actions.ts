/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use node";

import { randomBytes } from "node:crypto";
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

const resolveVimeoAccessTokenByConnectionId = async (
  ctx: ActionCtx,
  connectionId: Id<"connections">,
) => {
  const connection = await ctx.runQuery(
    internalAny.integrations.connections.queries.get,
    { id: connectionId },
  );

  if (!connection) {
    throw new Error("Connection not found");
  }

  const decrypted = await ctx.runAction(
    internalAny.integrations.connections.cryptoActions.getDecryptedSecrets,
    { connectionId },
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

const resolveConvexHttpUrl = () => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const url =
    process.env.NEXT_PUBLIC_CONVEX_HTTP_URL ??
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    process.env.CONVEX_HTTP_URL ??
    "";
  if (!url) {
    throw new Error(
      "Missing Convex HTTP URL. Set NEXT_PUBLIC_CONVEX_HTTP_URL (preferred) or CONVEX_HTTP_URL in Convex env.",
    );
  }
  return url.replace(/\/+$/, "");
};

const normalizeVimeoApiUrl = (uriOrUrl: string) => {
  if (uriOrUrl.startsWith("http")) return uriOrUrl;
  if (uriOrUrl.startsWith("/")) return `https://api.vimeo.com${uriOrUrl}`;
  return `https://api.vimeo.com/${uriOrUrl}`;
};

const pickFirstOkWebhookEndpoint = async (
  accessToken: string,
  payload: Record<string, unknown>,
) => {
  const candidates = [
    "https://api.vimeo.com/me/webhooks",
    "https://api.vimeo.com/users/me/webhooks",
  ];

  let lastError: string | null = null;
  for (const endpoint of candidates) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `bearer ${accessToken}`,
        Accept: "application/vnd.vimeo.*+json;version=3.4",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const json = (await response.json()) as any;
      return { endpoint, json };
    }

    const text = await response.text().catch(() => "");
    lastError = `${response.status} ${text}`.trim();
  }

  throw new Error(lastError ?? "Failed to create Vimeo webhook subscription");
};

export const ensureWebhookSubscription = internalActionAny({
  args: {
    connectionId: vAny.id("connections"),
  },
  returns: vAny.null(),
  handler: async (ctx: any, args: any) => {
    const state = await ctx.runQuery(
      internalAny.vimeo.syncState.getSyncStateByConnection,
      { connectionId: args.connectionId },
    );

    if (state?.webhookStatus === "active" && state.webhookId) {
      return null;
    }

    const { accessToken } = await resolveVimeoAccessTokenByConnectionId(
      ctx,
      args.connectionId,
    );

    const webhookSecret =
      state?.webhookSecret ?? randomBytes(24).toString("hex");

    const callbackUrl = new URL(`${resolveConvexHttpUrl()}/api/vimeo/webhook`);
    callbackUrl.searchParams.set("connectionId", String(args.connectionId));
    callbackUrl.searchParams.set("secret", webhookSecret);

    try {
      // NOTE: Vimeo webhook API details vary by account/features. We try the common endpoints,
      // and store a helpful error on failure so the UI can prompt for manual setup if needed.
      const { json } = await pickFirstOkWebhookEndpoint(accessToken, {
        url: callbackUrl.toString(),
        // Best-effort event list; receiver also handles unknown events safely.
        events: ["video.added", "video.deleted", "video.updated"],
      });

      const webhookId = (json?.uri ?? json?.id ?? json?.webhook_id) as
        | string
        | undefined;
      const normalizedWebhookId = webhookId ? String(webhookId) : undefined;

      await ctx.runMutation(internalAny.vimeo.syncState.updateSyncState, {
        connectionId: args.connectionId,
        webhookSecret,
        webhookId: normalizedWebhookId ?? null,
        webhookStatus: "active",
        webhookLastError: null,
      });
    } catch (error: unknown) {
      await ctx.runMutation(internalAny.vimeo.syncState.updateSyncState, {
        connectionId: args.connectionId,
        webhookSecret,
        webhookStatus: "error",
        webhookLastError:
          error instanceof Error ? error.message : "Failed to create webhook",
      });
    }

    return null;
  },
});

export const removeWebhookSubscription = internalActionAny({
  args: {
    connectionId: vAny.id("connections"),
  },
  returns: vAny.null(),
  handler: async (ctx: any, args: any) => {
    const state = await ctx.runQuery(
      internalAny.vimeo.syncState.getSyncStateByConnection,
      { connectionId: args.connectionId },
    );

    const webhookId = state?.webhookId;
    if (!webhookId) {
      await ctx.runMutation(internalAny.vimeo.syncState.updateSyncState, {
        connectionId: args.connectionId,
        webhookStatus: "disabled",
        webhookLastError: null,
      });
      return null;
    }

    const { accessToken } = await resolveVimeoAccessTokenByConnectionId(
      ctx,
      args.connectionId,
    );

    try {
      const response = await fetch(normalizeVimeoApiUrl(webhookId), {
        method: "DELETE",
        headers: {
          Authorization: `bearer ${accessToken}`,
          Accept: "application/vnd.vimeo.*+json;version=3.4",
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`${response.status} ${text}`.trim());
      }

      await ctx.runMutation(internalAny.vimeo.syncState.updateSyncState, {
        connectionId: args.connectionId,
        webhookId: null,
        webhookStatus: "disabled",
        webhookLastError: null,
      });
    } catch (error: unknown) {
      await ctx.runMutation(internalAny.vimeo.syncState.updateSyncState, {
        connectionId: args.connectionId,
        webhookStatus: "error",
        webhookLastError:
          error instanceof Error ? error.message : "Failed to remove webhook",
      });
    }

    return null;
  },
});

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
    total: vAny.optional(vAny.number()),
    hasMore: vAny.boolean(),
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
      const rawText = await response.text();
      let parsed: any = null;
      try {
        parsed = rawText ? (JSON.parse(rawText) as any) : null;
      } catch {
        parsed = null;
      }

      // Vimeo returns a 400 with error_code=2286 when the page is out of range.
      // Treat it as end-of-pagination (equivalent to an empty page).
      if (response.status === 400 && parsed?.error_code === 2286) {
        return {
          videos: [],
          page: args.page,
          perPage: args.perPage,
          total: typeof parsed?.total === "number" ? parsed.total : undefined,
          hasMore: false,
        };
      }

      throw new Error(
        `Failed to fetch Vimeo videos (page=${args.page}): ${response.status} ${rawText}`,
      );
    }

    const data = (await response.json()) as any;
    const videos = ((data?.data ?? []) as VimeoApiVideo[]).map((video) => {
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

    const total = typeof data?.total === "number" ? data.total : undefined;
    const hasMore = Boolean(data?.paging?.next);

    return { videos, page: args.page, perPage: args.perPage, total, hasMore };
  },
});

export const fetchVimeoVideoById = internalActionAny({
  args: {
    connectionId: vAny.id("connections"),
    videoId: vAny.string(),
  },
  returns: vimeoUpsertVideoValidator,
  handler: async (ctx: any, args: any) => {
    const { accessToken } = await resolveVimeoAccessTokenByConnectionId(
      ctx,
      args.connectionId,
    );

    const url = new URL(`https://api.vimeo.com/videos/${args.videoId}`);
    url.search = new URLSearchParams({
      fields: "uri,name,description,link,created_time,pictures.sizes",
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
        `Failed to fetch Vimeo video (${args.videoId}): ${response.status} ${text}`,
      );
    }

    const video = (await response.json()) as VimeoApiVideo;
    const thumbnailUrl =
      video.pictures?.sizes?.[video.pictures.sizes.length - 1]?.link ??
      video.pictures?.sizes?.[0]?.link ??
      undefined;

    return {
      videoId: String(args.videoId),
      title: video.name,
      description: video.description ?? undefined,
      embedUrl: video.link,
      thumbnailUrl,
      publishedAt: new Date(video.created_time).getTime(),
    };
  },
});

export const handleWebhookEvent = internalActionAny({
  args: {
    connectionId: vAny.id("connections"),
    eventType: vAny.string(),
    videoId: vAny.string(),
    receivedAt: vAny.number(),
  },
  returns: vAny.null(),
  handler: async (ctx: any, args: any) => {
    const eventType = String(args.eventType ?? "unknown").toLowerCase();
    const now = Number(args.receivedAt) || Date.now();

    try {
      const isDelete =
        eventType.includes("delete") ||
        eventType.includes("removed") ||
        eventType.includes("unavailable");

      if (isDelete) {
        await ctx.runMutation(internalAny.vimeo.mutations.markVideoDeleted, {
          connectionId: args.connectionId,
          videoId: args.videoId,
          deletedAt: now,
        });
      } else {
        const video = await ctx.runAction(internalAny.vimeo.actions.fetchVimeoVideoById, {
          connectionId: args.connectionId,
          videoId: args.videoId,
        });

        await ctx.runMutation(internalAny.vimeo.mutations.upsertVideo, {
          connectionId: args.connectionId,
          video,
          now,
        });
      }

      await ctx.runMutation(internalAny.vimeo.syncState.updateSyncState, {
        connectionId: args.connectionId,
        webhookStatus: "active",
        webhookLastEventAt: now,
        webhookLastError: null,
      });
    } catch (error: unknown) {
      await ctx.runMutation(internalAny.vimeo.syncState.updateSyncState, {
        connectionId: args.connectionId,
        webhookStatus: "error",
        webhookLastError:
          error instanceof Error ? error.message : "Webhook handling failed",
      });
    }

    return null;
  },
});

export const runNightlyBackstopSync = internalActionAny({
  args: {},
  returns: vAny.null(),
  handler: async (ctx: any) => {
    const connections = await ctx.runQuery(
      internalAny.integrations.connections.queries.list,
      { nodeType: "vimeo" },
    );

    // Safety: only process a limited number of pages per connection per run.
    const maxPagesPerConnection = 3;

    for (const conn of connections) {
      // Best-effort: ensure webhooks exist so most updates are real-time.
      try {
        await ctx.runAction(internalAny.vimeo.actions.ensureWebhookSubscription, {
          connectionId: conn._id,
        });
      } catch {
        // ignore
      }

      try {
        await ctx.runMutation(internalAny.vimeo.mutations.startVimeoSyncForConnection, {
          connectionId: conn._id,
          maxPages: maxPagesPerConnection,
        });
      } catch (error) {
        console.error("Nightly backstop Vimeo sync failed", {
          connectionId: conn._id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return null;
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

export const syncNewestForConnection = actionAny({
  args: {
    connectionId: vAny.id("connections"),
  },
  returns: vAny.object({
    inserted: vAny.number(),
    updated: vAny.number(),
  }),
  handler: async (ctx: any, args: any) => {
    const pageResult = await ctx.runAction(
      internalAny.vimeo.actions.fetchVimeoVideosPage,
      {
        connectionId: args.connectionId,
        page: 1,
        perPage: 100,
      },
    );

    const now = Date.now();
    const upsertResult = await ctx.runMutation(
      internalAny.vimeo.mutations.upsertVideosPage,
      {
        connectionId: args.connectionId,
        videos: pageResult.videos,
        now,
      },
    );

    await ctx.runMutation(internalAny.vimeo.syncState.updateSyncState, {
      connectionId: args.connectionId,
      status: "idle",
      lastError: null,
      finishedAt: now,
    });

    return upsertResult;
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
