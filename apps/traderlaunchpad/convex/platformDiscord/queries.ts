/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access,
  turbo/no-undeclared-env-vars,
  no-restricted-properties
*/
import { resolveViewerUserId } from "../traderlaunchpad/lib/resolve";

import { components } from "../_generated/api";
import { query } from "../_generated/server";
import { v } from "convex/values";

const platformRoutingQueries = components.launchthat_discord.platformRouting
  .queries as any;
const platformTemplateQueries = components.launchthat_discord.platformTemplates
  .queries as any;
const platformConfigQueries = components.launchthat_discord.platformConfigs
  .queries as any;
const platformGuildConnectionsQueries = components.launchthat_discord
  .platformGuildConnections.queries as any;
const platformGuildSettingsQueries = components.launchthat_discord
  .platformGuildSettings.queries as any;
const platformTemplatesQueries = components.launchthat_discord.platformTemplates
  .queries as any;
const platformUserLinksQueries = components.launchthat_discord.platformUserLinks
  .queries as any;
const platformUserStreamingQueries =
  components.launchthat_discord.platformUserStreaming.queries as any;
const platformAutomationsQueries = components.launchthat_discord.platformAutomations
  .queries as any;
const platformEventsQueries = components.launchthat_discord.platformEvents.queries as any;

const pricedataSources = (components as any).launchthat_pricedata?.sources?.queries as
  | any
  | undefined;
const pricedataInstruments = (components as any).launchthat_pricedata?.instruments
  ?.queries as any | undefined;

const isLocalDev = (): boolean => {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "";
  if (!root.trim()) return true;
  if (root.includes("localhost") || root.includes("127.0.0.1")) return true;
  return process.env.NODE_ENV === "development";
};

const ensureViewerOrDev = async (ctx: any): Promise<string | null> => {
  try {
    return await resolveViewerUserId(ctx);
  } catch (err) {
    if (isLocalDev()) {
      console.log("[platformDiscord] bypass auth for local dev");
      return null;
    }
    throw err;
  }
};

export const getOrgConfig = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    await ensureViewerOrDev(ctx);
    return await ctx.runQuery(platformConfigQueries.getPlatformConfig, {});
  },
});

export const listGuildConnectionsForOrg = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    await ensureViewerOrDev(ctx);
    return await ctx.runQuery(
      platformGuildConnectionsQueries.listGuildConnections,
      {},
    );
  },
});

export const getGuildSettings = query({
  args: { guildId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    await ensureViewerOrDev(ctx);
    return await ctx.runQuery(platformGuildSettingsQueries.getGuildSettings, {
      guildId: args.guildId,
    });
  },
});

export const getTemplate = query({
  args: {
    guildId: v.optional(v.string()),
    kind: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await ensureViewerOrDev(ctx);
    return await ctx.runQuery(platformTemplatesQueries.getTemplate, {
      guildId: args.guildId,
      kind: args.kind,
    });
  },
});

export const listTemplates = query({
  args: {
    guildId: v.optional(v.string()),
    kind: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await ensureViewerOrDev(ctx);
    return await ctx.runQuery(platformTemplatesQueries.listTemplates, {
      guildId: args.guildId,
      kind: args.kind,
    });
  },
});

export const getTemplateById = query({
  args: {
    templateId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await ensureViewerOrDev(ctx);
    return await ctx.runQuery(platformTemplatesQueries.getTemplateById, {
      templateId: args.templateId,
    });
  },
});

export const getMyDiscordLink = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = (await ensureViewerOrDev(ctx)) ?? "local_dev";
    return await ctx.runQuery(platformUserLinksQueries.getUserLink, {
      userId,
    });
  },
});

export const getMyDiscordUserLink = query({
  args: {},
  returns: v.object({
    linkedDiscordUserId: v.union(v.string(), v.null()),
    linkedAt: v.union(v.number(), v.null()),
    inviteUrl: v.union(v.string(), v.null()),
    guildId: v.union(v.string(), v.null()),
    profile: v.union(
      v.object({
        username: v.union(v.string(), v.null()),
        discriminator: v.union(v.string(), v.null()),
        globalName: v.union(v.string(), v.null()),
        avatar: v.union(v.string(), v.null()),
      }),
      v.null(),
    ),
    streamingEnabled: v.union(v.boolean(), v.null()),
    streamingUpdatedAt: v.union(v.number(), v.null()),
  }),
  handler: async (ctx) => {
    const userId = (await ensureViewerOrDev(ctx)) ?? "local_dev";
    const link = await ctx.runQuery(platformUserLinksQueries.getUserLink, {
      userId,
    });
    const linkedDiscordUserId =
      typeof link?.discordUserId === "string" && link.discordUserId.trim()
        ? link.discordUserId.trim()
        : null;
    const linkedAt = typeof link?.linkedAt === "number" ? link.linkedAt : null;

    const guildConnections = await ctx.runQuery(
      platformGuildConnectionsQueries.listGuildConnections,
      {},
    );
    const guilds = Array.isArray(guildConnections) ? guildConnections : [];
    const primaryGuild = guilds
      .slice()
      .sort((a: any, b: any) => Number(b?.connectedAt ?? 0) - Number(a?.connectedAt ?? 0))[0];
    const guildId =
      typeof primaryGuild?.guildId === "string" && primaryGuild.guildId.trim()
        ? primaryGuild.guildId.trim()
        : null;
    const guildSettings =
      guildId
        ? await ctx.runQuery(platformGuildSettingsQueries.getGuildSettings, {
            guildId,
          })
        : null;
    const inviteUrl =
      typeof guildSettings?.inviteUrl === "string" && guildSettings.inviteUrl.trim()
        ? guildSettings.inviteUrl.trim()
        : null;

    const profile = link
      ? {
          username:
            typeof link.discordUsername === "string" ? link.discordUsername : null,
          discriminator:
            typeof link.discordDiscriminator === "string"
              ? link.discordDiscriminator
              : null,
          globalName:
            typeof link.discordGlobalName === "string" ? link.discordGlobalName : null,
          avatar:
            typeof link.discordAvatar === "string" ? link.discordAvatar : null,
        }
      : null;

    const prefs = await ctx.runQuery(platformUserStreamingQueries.getUserStreamingPrefs, {
      userId,
    });
    const streamingEnabled =
      typeof prefs?.enabled === "boolean" ? prefs.enabled : null;
    const streamingUpdatedAt =
      typeof prefs?.updatedAt === "number" && Number.isFinite(prefs.updatedAt)
        ? prefs.updatedAt
        : null;

    return {
      linkedDiscordUserId,
      linkedAt,
      inviteUrl,
      guildId,
      profile,
      streamingEnabled,
      streamingUpdatedAt,
    };
  },
});

export const listSymbolOptions = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    await ensureViewerOrDev(ctx);
    if (!pricedataSources || !pricedataInstruments) return [];

    const source = await ctx.runQuery(pricedataSources.getDefaultSource, {});
    const sourceKey =
      typeof source?.sourceKey === "string" ? String(source.sourceKey) : "";
    if (!sourceKey) return [];

    const limit = Math.max(1, Math.min(1000, Number(args.limit ?? 500)));
    const rows = await ctx.runQuery(pricedataInstruments.listInstrumentsForSource, {
      sourceKey,
      limit,
    });
    const symbols = Array.isArray(rows)
      ? rows
          .map((r: any) => String(r?.symbol ?? "").trim().toUpperCase())
          .filter(Boolean)
      : [];
    return Array.from(new Set(symbols));
  },
});

export const getRoutingRuleSet = query({
  args: {
    guildId: v.string(),
    kind: v.union(v.literal("trade_feed")),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await ensureViewerOrDev(ctx);
    return await ctx.runQuery(platformRoutingQueries.getRoutingRuleSet, {
      guildId: args.guildId,
      kind: args.kind,
    });
  },
});

export const listRoutingRules = query({
  args: {
    guildId: v.string(),
    kind: v.union(v.literal("trade_feed")),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await ensureViewerOrDev(ctx);
    return await ctx.runQuery(platformRoutingQueries.listRoutingRules, {
      guildId: args.guildId,
      kind: args.kind,
    });
  },
});

export const resolveChannelsForEvent = query({
  args: {
    guildId: v.string(),
    kind: v.union(v.literal("trade_feed")),
    actorRole: v.string(),
    symbol: v.string(),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    await ensureViewerOrDev(ctx);
    const result = await ctx.runQuery(platformRoutingQueries.resolveChannelsForEvent, {
      guildId: args.guildId,
      kind: args.kind,
      actorRole: args.actorRole,
      symbol: args.symbol,
    });
    return Array.isArray(result) ? result.map((s: any) => String(s)) : [];
  },
});

export const listAutomations = query({
  args: {
    guildId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await ensureViewerOrDev(ctx);
    return await ctx.runQuery(platformAutomationsQueries.listAutomations, {
      guildId: args.guildId,
    });
  },
});

export const listDueAutomations = query({
  args: {
    now: v.number(),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await ensureViewerOrDev(ctx);
    return await ctx.runQuery(platformAutomationsQueries.listDueAutomations, {
      now: args.now,
      limit: args.limit,
    });
  },
});

export const listRecentEvents = query({
  args: {
    guildId: v.optional(v.string()),
    eventKey: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await resolveViewerUserId(ctx);
    return await ctx.runQuery(platformEventsQueries.listRecentEvents, {
      guildId: args.guildId,
      eventKey: args.eventKey,
      limit: args.limit,
    });
  },
});

export const renderTradeIdeaMessage = query({
  args: {
    guildId: v.optional(v.string()),
    templateId: v.optional(v.string()),
    symbol: v.string(),
    status: v.union(v.literal("open"), v.literal("closed")),
    direction: v.union(v.literal("long"), v.literal("short")),
    netQty: v.number(),
    avgEntryPrice: v.optional(v.number()),
    realizedPnl: v.optional(v.number()),
    fees: v.optional(v.number()),
    openedAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
  },
  returns: v.object({ content: v.string() }),
  handler: async (ctx, args) => {
    await resolveViewerUserId(ctx);
    return await ctx.runQuery(platformTemplateQueries.renderTradeIdeaMessage, {
      guildId: args.guildId,
      templateId: args.templateId,
      symbol: args.symbol,
      status: args.status,
      direction: args.direction,
      netQty: args.netQty,
      avgEntryPrice: args.avgEntryPrice,
      realizedPnl: args.realizedPnl,
      fees: args.fees,
      openedAt: args.openedAt,
      closedAt: args.closedAt,
    });
  },
});
