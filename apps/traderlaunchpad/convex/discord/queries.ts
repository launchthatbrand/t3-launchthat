import { v } from "convex/values";

import { components } from "../_generated/api";
import { query } from "../_generated/server";
import { resolveOrganizationId } from "../traderlaunchpad/lib/resolve";

const discordRoutingQueries = components.launchthat_discord.routing
  .queries as any;
const discordTemplateQueries = components.launchthat_discord.templates
  .queries as any;
const discordOauthHelperQueries = components.launchthat_discord.oauth.helpers
  .queries as any;

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
  },
  returns: v.object({
    redirectUri: v.string(),
    isLocal: v.boolean(),
    returnToHost: v.string(),
  }),
  handler: async (ctx, args) => {
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
