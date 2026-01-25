/* eslint-disable */
import {
  resolveOrganizationId,
  resolveViewerUserId,
} from "../traderlaunchpad/lib/resolve";

import { components } from "../_generated/api";
import { query } from "../_generated/server";
import { v } from "convex/values";

const discordRoutingQueries = components.launchthat_discord.routing
  .queries as any;
const discordTemplateQueries = components.launchthat_discord.templates
  .queries as any;
const discordOauthHelperQueries = components.launchthat_discord.oauth.helpers
  .queries as any;
const discordOrgConfigQueries = components.launchthat_discord.orgConfigs
  .queries as any;
const discordGuildConnectionsQueries = components.launchthat_discord
  .guildConnections.queries as any;
const discordGuildSettingsQueries = components.launchthat_discord.guildSettings
  .queries as any;
const discordTemplatesQueries = components.launchthat_discord.templates
  .queries as any;
const discordUserLinksQueries = components.launchthat_discord.userLinks
  .queries as any;
const discordUserStreamingQueries = components.launchthat_discord.userStreaming
  .queries as any;

export const peekOauthState = query({
  args: { state: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(
      components.launchthat_discord.oauth.queries.peekOauthState as any,
      { state: args.state },
    );
  },
});

export const getMyDiscordStreamingOrgs = query({
  args: { organizationIds: v.array(v.string()) },
  returns: v.array(
    v.object({
      organizationId: v.string(),
      discordEnabled: v.boolean(),
      hasGuild: v.boolean(),
      guildId: v.union(v.string(), v.null()),
      guildName: v.union(v.string(), v.null()),
      inviteUrl: v.union(v.string(), v.null()),
      linkedDiscordUserId: v.union(v.string(), v.null()),
      linkedAt: v.union(v.number(), v.null()),
      streamingEnabled: v.boolean(),
      streamingUpdatedAt: v.union(v.number(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await resolveViewerUserId(ctx);
    const orgIds = Array.isArray(args.organizationIds)
      ? args.organizationIds.map((id) => String(id)).filter(Boolean)
      : [];

    const result: {
      organizationId: string;
      discordEnabled: boolean;
      hasGuild: boolean;
      guildId: string | null;
      guildName: string | null;
      inviteUrl: string | null;
      linkedDiscordUserId: string | null;
      linkedAt: number | null;
      streamingEnabled: boolean;
      streamingUpdatedAt: number | null;
    }[] = [];

    for (const organizationId of orgIds) {
      const orgConfig = await ctx.runQuery(discordOrgConfigQueries.getOrgConfig, {
        organizationId,
      });

      const guildConnections = await ctx.runQuery(
        discordGuildConnectionsQueries.listGuildConnectionsForOrg,
        { organizationId },
      );
      const guilds = Array.isArray(guildConnections) ? guildConnections : [];
      const primaryGuild = guilds
        .slice()
        .sort((a: any, b: any) => Number(b?.connectedAt ?? 0) - Number(a?.connectedAt ?? 0))[0];
      const guildId =
        typeof primaryGuild?.guildId === "string" && primaryGuild.guildId.trim()
          ? primaryGuild.guildId.trim()
          : null;
      const guildName =
        typeof primaryGuild?.guildName === "string" && primaryGuild.guildName.trim()
          ? primaryGuild.guildName.trim()
          : null;

      // Treat “guild connected” as enabled even if org config isn’t set yet.
      const discordEnabled = Boolean(orgConfig?.enabled) || Boolean(guildId);

      const guildSettings =
        guildId && discordEnabled
          ? await ctx.runQuery(discordGuildSettingsQueries.getGuildSettings, {
            organizationId,
            guildId,
          })
          : null;
      const inviteUrl =
        typeof guildSettings?.inviteUrl === "string" && guildSettings.inviteUrl.trim()
          ? guildSettings.inviteUrl.trim()
          : null;

      const link = await ctx.runQuery(discordUserLinksQueries.getUserLink, {
        organizationId,
        userId,
      });
      const linkedDiscordUserId =
        typeof link?.discordUserId === "string" && link.discordUserId.trim()
          ? link.discordUserId.trim()
          : null;
      const linkedAt = typeof link?.linkedAt === "number" ? link.linkedAt : null;

      const prefs = await ctx.runQuery(discordUserStreamingQueries.getUserStreamingPrefs, {
        organizationId,
        userId,
      });
      const streamingEnabled = Boolean(prefs?.enabled);
      const streamingUpdatedAt =
        typeof prefs?.updatedAt === "number" && Number.isFinite(prefs.updatedAt)
          ? prefs.updatedAt
          : null;

      result.push({
        organizationId,
        discordEnabled,
        hasGuild: Boolean(guildId),
        guildId,
        guildName,
        inviteUrl,
        linkedDiscordUserId,
        linkedAt,
        streamingEnabled,
        streamingUpdatedAt,
      });
    }

    return result;
  },
});

export const resolveTradeFeedChannel = query({
  args: {
    guildId: v.string(),
    channelKind: v.union(v.literal("mentors"), v.literal("members")),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    return await ctx.runQuery(discordRoutingQueries.resolveTradeFeedChannel, {
      organizationId,
      guildId: args.guildId,
      channelKind: args.channelKind,
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
    const organizationId = resolveOrganizationId();
    return await ctx.runQuery(discordTemplateQueries.renderTradeIdeaMessage, {
      organizationId,
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

export const computeDiscordAuthRedirect = query({
  args: {
    returnTo: v.string(),
    callbackPath: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.object({
    redirectUri: v.string(),
    isLocal: v.boolean(),
    returnToHost: v.string(),
  }),
  handler: async (ctx, args) => {
    // Ensure `organizationId` is at least resolved/validated for caller context.
    // (Some callers pass it explicitly from platform org pages.)
    if (!args.organizationId) resolveOrganizationId();

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "";
    return await ctx.runQuery(
      discordOauthHelperQueries.computeAuthRedirectUri,
      {
        returnTo: args.returnTo,
        rootDomain,
        fallbackAuthHost: "auth.launchthat.app",
        callbackPath: args.callbackPath,
      },
    );
  },
});

export const getOrgConfig = query({
  args: { organizationId: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    await resolveViewerUserId(ctx);
    return await ctx.runQuery(discordOrgConfigQueries.getOrgConfig, {
      organizationId,
    });
  },
});

export const listGuildConnectionsForOrg = query({
  args: { organizationId: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    await resolveViewerUserId(ctx);
    return await ctx.runQuery(
      discordGuildConnectionsQueries.listGuildConnectionsForOrg,
      { organizationId },
    );
  },
});

export const getGuildSettings = query({
  args: { guildId: v.string(), organizationId: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    await resolveViewerUserId(ctx);
    return await ctx.runQuery(discordGuildSettingsQueries.getGuildSettings, {
      organizationId,
      guildId: args.guildId,
    });
  },
});

export const getTemplate = query({
  args: {
    guildId: v.optional(v.string()),
    kind: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    await resolveViewerUserId(ctx);
    return await ctx.runQuery(discordTemplatesQueries.getTemplate, {
      organizationId,
      guildId: args.guildId,
      kind: args.kind,
    });
  },
});

export const listTemplates = query({
  args: {
    guildId: v.optional(v.string()),
    kind: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    await resolveViewerUserId(ctx);
    return await ctx.runQuery(discordTemplatesQueries.listTemplates, {
      organizationId,
      guildId: args.guildId,
      kind: args.kind,
    });
  },
});

export const getTemplateById = query({
  args: {
    templateId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    await resolveViewerUserId(ctx);
    return await ctx.runQuery(discordTemplatesQueries.getTemplateById, {
      organizationId,
      templateId: args.templateId,
    });
  },
});

export const getMyDiscordLink = query({
  args: { organizationId: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);
    return await ctx.runQuery(discordUserLinksQueries.getUserLink, {
      organizationId,
      userId,
    });
  },
});
