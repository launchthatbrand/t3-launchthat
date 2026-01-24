"use node";

import crypto from "node:crypto";
import { v } from "convex/values";

import { components } from "../_generated/api";
import { action } from "../_generated/server";
import { resolveOrganizationId, resolveViewerUserId } from "../traderlaunchpad/lib/resolve";

const discordOauthMutations = components.launchthat_discord.oauth.mutations as any;
const discordOauthHelperQueries =
  components.launchthat_discord.oauth.helpers.queries as any;
const discordGuildConnectionMutations =
  components.launchthat_discord.guildConnections.mutations as any;

export const completeBotInstall = action({
  args: {
    state: v.string(),
    guildId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await resolveViewerUserId(ctx);
    const guildId = args.guildId.trim();
    if (!guildId) throw new Error("Missing guildId");

    const consumed = await ctx.runMutation(discordOauthMutations.consumeOauthState, {
      state: args.state,
    });
    if (!consumed || consumed.kind !== "org_install") {
      throw new Error("Invalid or expired Discord install state");
    }

    const organizationId =
      typeof consumed.organizationId === "string" ? consumed.organizationId : "";
    if (!organizationId) throw new Error("Missing organizationId in install state");

    // Best-effort guild name fetch (only works if global bot token exists).
    let guildName: string | undefined;
    const botToken = process.env.DISCORD_GLOBAL_BOT_TOKEN ?? "";
    if (botToken) {
      try {
        const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
          headers: { Authorization: `Bot ${botToken}` },
        });
        if (res.ok) {
          const json = (await res.json()) as { name?: unknown };
          guildName = typeof json?.name === "string" ? json.name : undefined;
        }
      } catch {
        // ignore
      }
    }

    await ctx.runMutation(discordGuildConnectionMutations.upsertGuildConnection, {
      organizationId,
      guildId,
      guildName,
      botModeAtConnect: "global",
      connectedAt: Date.now(),
    });

    return null;
  },
});

export const startBotInstall = action({
  args: {
    organizationId: v.optional(v.string()),
    returnTo: v.string(),
  },
  returns: v.object({
    url: v.string(),
    state: v.string(),
  }),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    await resolveViewerUserId(ctx);

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "";
    const redirect = await ctx.runQuery(
      discordOauthHelperQueries.computeAuthRedirectUri,
      {
        returnTo: args.returnTo,
        rootDomain,
        fallbackAuthHost: "auth.launchthat.app",
        callbackPath: "/auth/discord/install/callback",
      },
    );

    const state = crypto.randomUUID();
    await ctx.runMutation(discordOauthMutations.createOauthState, {
      organizationId,
      kind: "org_install",
      userId: undefined,
      state,
      codeVerifier: "bot_install_no_pkce",
      returnTo: args.returnTo,
    });

    const clientId =
      process.env.DISCORD_GLOBAL_CLIENT_ID ??
      process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ??
      "";
    if (!clientId) {
      throw new Error("Missing DISCORD_GLOBAL_CLIENT_ID");
    }

    const scope = encodeURIComponent("bot applications.commands");
    const permissions = "292326280208";
    const url =
      `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirect.redirectUri)}` +
      `&scope=${scope}` +
      `&permissions=${permissions}` +
      `&state=${encodeURIComponent(state)}`;

    return { url, state };
  },
});

export const disconnectGuild = action({
  args: { organizationId: v.optional(v.string()), guildId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    await resolveViewerUserId(ctx);
    await ctx.runMutation(discordGuildConnectionMutations.deleteGuildConnection, {
      organizationId,
      guildId: args.guildId,
    });
    return null;
  },
});

export const startUserLink = action({
  args: {
    organizationId: v.optional(v.string()),
    returnTo: v.string(),
  },
  returns: v.object({
    url: v.string(),
    state: v.string(),
  }),
  handler: async (ctx, args) => {
    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "";
    const redirect = await ctx.runQuery(
      discordOauthHelperQueries.computeAuthRedirectUri,
      {
        returnTo: args.returnTo,
        rootDomain,
        fallbackAuthHost: "auth.launchthat.app",
        callbackPath: "/auth/discord/link/callback",
      },
    );

    const state = crypto.randomUUID();
    await ctx.runMutation(discordOauthMutations.createOauthState, {
      organizationId,
      kind: "user_link",
      userId,
      state,
      codeVerifier: "user_link_no_pkce",
      returnTo: args.returnTo,
    });

    const clientId =
      process.env.DISCORD_GLOBAL_CLIENT_ID ??
      process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ??
      "";
    if (!clientId) {
      throw new Error("Missing DISCORD_GLOBAL_CLIENT_ID");
    }

    const scope = encodeURIComponent("identify");
    const url =
      `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirect.redirectUri)}` +
      `&scope=${scope}` +
      `&state=${encodeURIComponent(state)}` +
      `&prompt=consent`;

    return { url, state };
  },
});
