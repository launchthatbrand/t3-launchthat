/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use node";

import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import type { ActionCtx } from "../../_generated/server";
import { components, internal } from "../../_generated/api";
import { action, internalAction } from "../../_generated/server";

const vAny = v as any;

// Convex function reference types can get extremely deep in larger apps.
// Casting here keeps TS snappy and avoids "Type instantiation is excessively deep" errors.
const internalAny = internal as any;
const componentsAny = components as any;
const actionAny = action as any;
const internalActionAny = internalAction as any;

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

const vimeoUpsertVideoValidator = vAny.object({
  videoId: vAny.string(),
  title: vAny.string(),
  description: vAny.optional(vAny.string()),
  embedUrl: vAny.string(),
  thumbnailUrl: vAny.optional(vAny.string()),
  publishedAt: vAny.number(),
});

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

export const ensureWebhookSubscription = internalActionAny({
  args: {
    connectionId: vAny.id("connections"),
  },
  returns: vAny.null(),
  handler: async (ctx: any, args: any) => {
    const { accessToken } = await resolveVimeoAccessTokenByConnectionId(
      ctx,
      args.connectionId,
    );
    const callbackBaseUrl = resolveConvexHttpUrl();
    await ctx.runAction(
      componentsAny.launchthat_vimeo.internalActions
        .ensureWebhookSubscriptionWithToken,
      { connectionId: String(args.connectionId), accessToken, callbackBaseUrl },
    );
    return null;
  },
});

export const removeWebhookSubscription = internalActionAny({
  args: {
    connectionId: vAny.id("connections"),
  },
  returns: vAny.null(),
  handler: async (ctx: any, args: any) => {
    const { accessToken } = await resolveVimeoAccessTokenByConnectionId(
      ctx,
      args.connectionId,
    );
    await ctx.runAction(
      componentsAny.launchthat_vimeo.internalActions
        .removeWebhookSubscriptionWithToken,
      { connectionId: String(args.connectionId), accessToken },
    );
    return null;
  },
});

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
    return await ctx.runAction(
      componentsAny.launchthat_vimeo.internalActions.syncVimeoVideosWithToken,
      { connectionId: String(args.connectionId), accessToken },
    );
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
    return await ctx.runAction(
      componentsAny.launchthat_vimeo.internalActions
        .fetchVimeoVideosPageWithToken,
      {
        accessToken,
        page: args.page,
        perPage: args.perPage,
      },
    );
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
    return await ctx.runAction(
      componentsAny.launchthat_vimeo.internalActions
        .fetchVimeoVideoByIdWithToken,
      {
        accessToken,
        videoId: args.videoId,
      },
    );
  },
});

export const processWebhookRequest = internalActionAny({
  args: {
    connectionId: vAny.id("connections"),
    secret: vAny.string(),
    headerEvent: vAny.optional(vAny.string()),
    payload: vAny.any(),
    receivedAt: vAny.number(),
  },
  returns: vAny.null(),
  handler: async (ctx: any, args: any) => {
    const decrypted = await ctx.runAction(
      internalAny.integrations.connections.cryptoActions.getDecryptedSecrets,
      { connectionId: args.connectionId },
    );

    const accessToken =
      decrypted?.credentials?.accessToken ??
      decrypted?.credentials?.access_token ??
      decrypted?.credentials?.token;

    if (!accessToken) {
      throw new Error("Access token missing in Vimeo credentials.");
    }

    await ctx.runAction(
      componentsAny.launchthat_vimeo.internalActions
        .handleWebhookRequestWithToken,
      {
        connectionId: String(args.connectionId),
        secret: String(args.secret),
        accessToken,
        headerEvent: args.headerEvent ?? undefined,
        payload: args.payload,
        receivedAt: Number(args.receivedAt) || Date.now(),
      },
    );
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
        await ctx.runAction(
          internalAny.plugins.vimeo.actions.ensureWebhookSubscription,
          {
            connectionId: conn._id,
          },
        );
      } catch {
        // ignore
      }

      try {
        await ctx.runMutation(
          internalAny.plugins.vimeo.mutations.startVimeoSyncForConnection,
          {
            connectionId: conn._id,
            maxPages: maxPagesPerConnection,
          },
        );
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
      await ctx.runAction(internalAny.plugins.vimeo.actions.syncVimeoVideos, {
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
      internalAny.plugins.vimeo.actions.syncVimeoVideos,
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
      internalAny.plugins.vimeo.actions.fetchVimeoVideosPage,
      {
        connectionId: args.connectionId,
        page: 1,
        perPage: 100,
      },
    );

    const now = Date.now();
    const upsertResult = await ctx.runMutation(
      internalAny.plugins.vimeo.mutations.upsertVideosPage,
      {
        connectionId: args.connectionId,
        videos: pageResult.videos,
        now,
      },
    );

    await ctx.runMutation(internalAny.plugins.vimeo.syncState.updateSyncState, {
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
    const decrypted = await ctx.runAction(
      internalAny.integrations.connections.cryptoActions.getDecryptedSecrets,
      { connectionId: args.connectionId },
    );
    const token =
      decrypted?.credentials?.accessToken ??
      decrypted?.credentials?.access_token ??
      decrypted?.credentials?.token;
    if (!token) throw new Error("Missing Vimeo access token");

    return await ctx.runAction(
      componentsAny.launchthat_vimeo.internalActions.listFoldersWithToken,
      { accessToken: token },
    );
  },
});

// Internal action: fetches from Vimeo API
export const fetchVimeoVideos = internalActionAny({
  args: {
    ownerId: vAny.union(vAny.id("users"), vAny.string()),
  },
  returns: vAny.any(),
  handler: async (ctx: any, args: any) => {
    const { accessToken } = await resolveVimeoAccessToken(ctx, args.ownerId);
    return await ctx.runAction(
      componentsAny.launchthat_vimeo.internalActions
        .fetchVimeoVideosRawWithToken,
      { accessToken },
    );
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
      internalAny.plugins.vimeo.actions.fetchVimeoVideos,
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
    return await ctx.runAction(
      componentsAny.launchthat_vimeo.internalActions.fetchTranscriptWithToken,
      { accessToken, videoId: args.videoId },
    );
  },
});
