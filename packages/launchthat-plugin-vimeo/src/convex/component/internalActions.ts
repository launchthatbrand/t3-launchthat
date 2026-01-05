import { v } from "convex/values";

import { api } from "./_generated/api";
import { internalAction } from "./_generated/server";

type VimeoApiVideo = {
  uri: string; // e.g. "/videos/123456"
  name: string;
  description?: string;
  link: string; // embed link
  created_time: string; // ISO date
  pictures?: {
    sizes?: { width: number; link: string }[];
  };
};

const vimeoUpsertVideoValidator = v.object({
  videoId: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  embedUrl: v.string(),
  thumbnailUrl: v.optional(v.string()),
  publishedAt: v.number(),
});

type VimeoTextTrack = {
  uri: string;
  active?: boolean;
  language?: string;
  name?: string;
  link?: string;
  type?: string;
  release_time?: string;
};

const randomHex = (bytes: number) => {
  const cryptoAny = (globalThis as any).crypto as
    | { getRandomValues: (a: Uint8Array) => Uint8Array }
    | undefined;
  if (!cryptoAny?.getRandomValues) {
    // Extremely unlikely in Convex runtime; fallback to Math.random to avoid hard crash.
    const alphabet = "0123456789abcdef";
    let out = "";
    for (let i = 0; i < bytes * 2; i += 1) {
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
  }
  const data = cryptoAny.getRandomValues(new Uint8Array(bytes));
  return Array.from(data)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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

const pickPreferredTextTrack = (tracks: VimeoTextTrack[]) => {
  const normalized = tracks.filter((t) => Boolean(t?.uri));
  if (normalized.length === 0) return null;

  const isLikelyEnglish = (t: VimeoTextTrack) =>
    (t.language ?? "").toLowerCase().startsWith("en");

  const active = normalized.filter((t) => Boolean(t.active));
  if (active.length > 0) {
    return active.find(isLikelyEnglish) ?? active[0]!;
  }

  return normalized.find(isLikelyEnglish) ?? normalized[0]!;
};

const normalizeTrackDownloadUrl = (track: VimeoTextTrack) => {
  const link = track.link ?? "";
  if (!link) return null;
  return normalizeVimeoApiUrl(link);
};

const convertWebVttToPlainText = (vtt: string) => {
  const lines = vtt.split(/\r?\n/);
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

export const fetchVimeoVideosPageWithToken = internalAction({
  args: {
    accessToken: v.string(),
    page: v.number(),
    perPage: v.number(),
  },
  returns: v.object({
    videos: v.array(vimeoUpsertVideoValidator),
    page: v.number(),
    perPage: v.number(),
    total: v.optional(v.number()),
    hasMore: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    const url = new URL("https://api.vimeo.com/me/videos");
    url.search = new URLSearchParams({
      fields: "uri,name,description,link,created_time,pictures.sizes",
      page: String(args.page),
      per_page: String(args.perPage),
    }).toString();

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `bearer ${args.accessToken}`,
        Accept: "application/vnd.vimeo.*+json;version=3.4",
      },
    });

    if (!response.ok) {
      const rawText = await response.text();
      let parsed: unknown = null;
      try {
        parsed = rawText ? (JSON.parse(rawText) as unknown) : null;
      } catch {
        parsed = null;
      }

      // Vimeo returns a 400 with error_code=2286 when the page is out of range.
      // Treat it as end-of-pagination (equivalent to an empty page).
      const parsedAny = parsed as any;
      if (response.status === 400 && parsedAny?.error_code === 2286) {
        return {
          videos: [],
          page: args.page,
          perPage: args.perPage,
          total:
            typeof parsedAny?.total === "number" ? parsedAny.total : undefined,
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

export const fetchVimeoVideoByIdWithToken = internalAction({
  args: {
    accessToken: v.string(),
    videoId: v.string(),
  },
  returns: vimeoUpsertVideoValidator,
  handler: async (_ctx, args) => {
    const url = new URL(`https://api.vimeo.com/videos/${args.videoId}`);
    url.search = new URLSearchParams({
      fields: "uri,name,description,link,created_time,pictures.sizes",
    }).toString();

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `bearer ${args.accessToken}`,
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

export const listFoldersWithToken = internalAction({
  args: {
    accessToken: v.string(),
  },
  returns: v.array(v.object({ id: v.string(), name: v.string() })),
  handler: async (_ctx, args) => {
    const res = await fetch("https://api.vimeo.com/me/projects?per_page=100", {
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        Accept: "application/vnd.vimeo.*+json;version=3.4",
      },
    });

    if (!res.ok) throw new Error(`Vimeo API error ${res.status}`);
    const json = (await res.json()) as {
      data?: { uri: string; name: string }[];
    };

    return (
      json.data?.map((d) => ({
        id: d.uri.split("/").pop() ?? d.uri,
        name: d.name,
      })) ?? []
    );
  },
});

export const fetchVimeoVideosRawWithToken = internalAction({
  args: {
    accessToken: v.string(),
  },
  returns: v.any(),
  handler: async (_ctx, args) => {
    const response = await fetch(
      "https://api.vimeo.com/me/videos?fields=id,uri,name,folder,description,link,created_time,pictures.sizes&page=1&per_page=100",
      {
        headers: {
          Authorization: `bearer ${args.accessToken}`,
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
    return await response.json();
  },
});

export const fetchTranscriptWithToken = internalAction({
  args: {
    accessToken: v.string(),
    videoId: v.string(),
  },
  returns: v.object({
    transcript: v.string(),
    rawVtt: v.string(),
    track: v.object({
      id: v.string(),
      label: v.optional(v.string()),
      language: v.optional(v.string()),
      type: v.optional(v.string()),
    }),
  }),
  handler: async (_ctx, args) => {
    const textTracksResponse = await fetch(
      `https://api.vimeo.com/videos/${encodeURIComponent(args.videoId)}/texttracks?per_page=100`,
      {
        headers: {
          Authorization: `bearer ${args.accessToken}`,
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
            Authorization: `bearer ${args.accessToken}`,
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

export const ensureWebhookSubscriptionWithToken = internalAction({
  args: {
    connectionId: v.string(),
    accessToken: v.string(),
    callbackBaseUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const apiAny = api as any;
    const state = await ctx.runQuery(
      apiAny.syncState.queries.getSyncStateByConnection,
      {
        connectionId: args.connectionId,
      },
    );

    if (state?.webhookStatus === "active" && state.webhookId) {
      return null;
    }

    const webhookSecret = state?.webhookSecret ?? randomHex(24);

    const base = String(args.callbackBaseUrl).replace(/\/+$/, "");
    const callbackUrl = new URL(`${base}/api/vimeo/webhook`);
    callbackUrl.searchParams.set("connectionId", String(args.connectionId));
    callbackUrl.searchParams.set("secret", webhookSecret);

    try {
      const { json } = await pickFirstOkWebhookEndpoint(args.accessToken, {
        url: callbackUrl.toString(),
        events: ["video.added", "video.deleted", "video.updated"],
      });

      const webhookId = (json?.uri ?? json?.id ?? json?.webhook_id) as
        | string
        | undefined;
      const normalizedWebhookId = webhookId ? String(webhookId) : undefined;

      await ctx.runMutation(apiAny.syncState.mutations.updateSyncState, {
        connectionId: args.connectionId,
        webhookSecret,
        webhookId: normalizedWebhookId ?? null,
        webhookStatus: "active",
        webhookLastError: null,
      });
    } catch (error: unknown) {
      await ctx.runMutation(apiAny.syncState.mutations.updateSyncState, {
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

export const removeWebhookSubscriptionWithToken = internalAction({
  args: {
    connectionId: v.string(),
    accessToken: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const apiAny = api as any;
    const state = await ctx.runQuery(
      apiAny.syncState.queries.getSyncStateByConnection,
      {
        connectionId: args.connectionId,
      },
    );

    const webhookId = state?.webhookId;
    if (!webhookId) {
      await ctx.runMutation(apiAny.syncState.mutations.updateSyncState, {
        connectionId: args.connectionId,
        webhookStatus: "disabled",
        webhookLastError: null,
      });
      return null;
    }

    try {
      const response = await fetch(normalizeVimeoApiUrl(webhookId), {
        method: "DELETE",
        headers: {
          Authorization: `bearer ${args.accessToken}`,
          Accept: "application/vnd.vimeo.*+json;version=3.4",
        },
      });

      // Vimeo can return 404 if it's already removed; treat as success.
      if (!response.ok && response.status !== 404) {
        const text = await response.text().catch(() => "");
        throw new Error(`${response.status} ${text}`.trim());
      }

      await ctx.runMutation(apiAny.syncState.mutations.updateSyncState, {
        connectionId: args.connectionId,
        webhookId: null,
        webhookStatus: "disabled",
        webhookLastError: null,
      });
    } catch (error: unknown) {
      await ctx.runMutation(apiAny.syncState.mutations.updateSyncState, {
        connectionId: args.connectionId,
        webhookStatus: "error",
        webhookLastError:
          error instanceof Error ? error.message : "Failed to remove webhook",
      });
    }

    return null;
  },
});

const pickNumericSegment = (value: string | undefined) => {
  if (!value) return null;
  const segments = value.split(/[/?#]/).filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    if (/^\d+$/.test(segments[i] ?? "")) return segments[i] ?? null;
  }
  return null;
};

const extractVideoIdFromPayload = (obj: any): string | null => {
  if (!obj || typeof obj !== "object") return null;
  const candidates: Array<string | undefined> = [
    obj.uri,
    obj.videoUri,
    obj.resourceUri,
    obj.link,
    obj.video?.uri,
    obj.video?.link,
    obj.resource?.uri,
    obj.data?.uri,
    obj.data?.video?.uri,
    obj.entity?.uri,
  ];
  for (const candidate of candidates) {
    const numeric = pickNumericSegment(candidate);
    if (numeric) return numeric;
  }
  return null;
};

export const handleWebhookRequestWithToken = internalAction({
  args: {
    connectionId: v.string(),
    secret: v.string(),
    accessToken: v.string(),
    headerEvent: v.optional(v.string()),
    payload: v.any(),
    receivedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const apiAny = api as any;

    const state = await ctx.runQuery(
      apiAny.syncState.queries.getSyncStateByConnection,
      {
        connectionId: args.connectionId,
      },
    );

    if (!state?.webhookSecret || state.webhookSecret !== args.secret) {
      await ctx.runMutation(apiAny.syncState.mutations.updateSyncState, {
        connectionId: args.connectionId,
        webhookStatus: "error",
        webhookLastError: "Unauthorized webhook secret",
      });
      return null;
    }

    const bodyEvent =
      args.payload && typeof args.payload === "object"
        ? ((args.payload as any).event ??
          (args.payload as any).type ??
          (args.payload as any).event_type ??
          (args.payload as any).name)
        : undefined;
    const eventType = String(args.headerEvent ?? bodyEvent ?? "unknown");
    const now = Number(args.receivedAt) || Date.now();

    const videoId = extractVideoIdFromPayload(args.payload as any);

    // Always record webhook receipt, even if videoId parsing fails.
    await ctx.runMutation(apiAny.syncState.mutations.updateSyncState, {
      connectionId: args.connectionId,
      webhookLastEventAt: now,
      webhookStatus: "active",
      webhookLastError: null,
    });

    if (!videoId) {
      return null;
    }

    const normalizedEvent = eventType.toLowerCase();
    const isDelete =
      normalizedEvent.includes("delete") ||
      normalizedEvent.includes("removed") ||
      normalizedEvent.includes("unavailable");

    try {
      if (isDelete) {
        await ctx.runMutation(apiAny.videos.mutations.markVideoDeleted, {
          connectionId: args.connectionId,
          videoId,
          deletedAt: now,
        });
      } else {
        const video = await ctx.runAction(
          apiAny.internalActions.fetchVimeoVideoByIdWithToken,
          {
            accessToken: args.accessToken,
            videoId,
          },
        );

        await ctx.runMutation(apiAny.videos.mutations.upsertVideo, {
          connectionId: args.connectionId,
          video,
          now,
        });
      }

      await ctx.runMutation(apiAny.syncState.mutations.updateSyncState, {
        connectionId: args.connectionId,
        webhookStatus: "active",
        webhookLastError: null,
      });
    } catch (error: unknown) {
      await ctx.runMutation(apiAny.syncState.mutations.updateSyncState, {
        connectionId: args.connectionId,
        webhookStatus: "error",
        webhookLastError:
          error instanceof Error ? error.message : "Webhook handling failed",
      });
    }

    return null;
  },
});

export const syncVimeoVideosWithToken = internalAction({
  args: {
    connectionId: v.string(),
    accessToken: v.string(),
  },
  returns: v.object({
    syncedCount: v.number(),
    pagesFetched: v.number(),
    startedAt: v.number(),
    finishedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const apiAny = api as any;

    const startedAt = Date.now();
    const now = startedAt;

    const perPage = 100;
    const maxPages = 250; // safety guard (25k videos)
    let page = 1;
    let pagesFetched = 0;
    let syncedCount = 0;

    while (page <= maxPages) {
      const pageResult = await ctx.runAction(
        apiAny.internalActions.fetchVimeoVideosPageWithToken,
        {
          accessToken: args.accessToken,
          page,
          perPage,
        },
      );

      pagesFetched += 1;
      if (!pageResult?.videos?.length) {
        break;
      }

      await ctx.runMutation(apiAny.videos.mutations.upsertVideosPage, {
        connectionId: args.connectionId,
        videos: pageResult.videos,
        now,
      });

      syncedCount += pageResult.videos.length;

      // Small throttle to be polite to the Vimeo API.
      await new Promise((resolve) => setTimeout(resolve, 150));
      page += 1;
    }

    const finishedAt = Date.now();
    return { syncedCount, pagesFetched, startedAt, finishedAt };
  },
});
