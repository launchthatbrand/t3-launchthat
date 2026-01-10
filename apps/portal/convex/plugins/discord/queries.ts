// @ts-nocheck
import { v } from "convex/values";

import { api, components } from "../../_generated/api";
import { query } from "../../_generated/server";

const discordOrgConfigQuery = components.launchthat_discord.orgConfigs
  .queries as any;
const discordGuildConnectionsQuery = components.launchthat_discord.guildConnections
  .queries as any;
const discordGuildSettingsQuery = components.launchthat_discord.guildSettings
  .queries as any;
const discordOauthQueries = components.launchthat_discord.oauth.queries as any;

export const getOrgConfig = query({
  args: { organizationId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(discordOrgConfigQuery.getOrgConfig, args);
  },
});

export const listGuildConnectionsForOrg = query({
  args: { organizationId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(
      discordGuildConnectionsQuery.listGuildConnectionsForOrg,
      args,
    );
  },
});

export const getGuildSettings = query({
  args: { organizationId: v.string(), guildId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    await ctx.runQuery(api.plugins.discord.permissions.requireOrgAdmin, {
      organizationId: args.organizationId,
    });
    return await ctx.runQuery(discordGuildSettingsQuery.getGuildSettings, args);
  },
});

export const peekOauthState = query({
  args: { state: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(discordOauthQueries.peekOauthState, args);
  },
});


