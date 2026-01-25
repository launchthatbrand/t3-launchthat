import { v } from "convex/values";

import { components } from "../_generated/api";
import { action } from "../_generated/server";
import { resolveOrganizationId, resolveViewerUserId } from "../traderlaunchpad/lib/resolve";

import { exchangeDiscordCode, fetchDiscordUser } from "launchthat-plugin-discord/runtime/oauth";
import { resolveDiscordCredentials } from "launchthat-plugin-discord/runtime/credentials";

const discordOauthMutations = components.launchthat_discord.oauth.mutations as any;
const discordOauthHelperQueries =
  components.launchthat_discord.oauth.helpers.queries as any;
const discordGuildConnectionMutations =
  components.launchthat_discord.guildConnections.mutations as any;
const discordGuildConnectionQueries =
  components.launchthat_discord.guildConnections.queries as any;
const discordOrgConfigMutations =
  components.launchthat_discord.orgConfigs.mutations as any;
const discordOrgConfigQueries =
  components.launchthat_discord.orgConfigs.queries as any;
const discordOrgConfigInternalQueries =
  components.launchthat_discord.orgConfigs.internalQueries as any;
const discordOauthQueries = components.launchthat_discord.oauth.queries as any;
const discordUserLinksMutations =
  components.launchthat_discord.userLinks.mutations as any;
const discordUserStreamingMutations =
  components.launchthat_discord.userStreaming.mutations as any;

const randomState = (): string => {
  const c: any = (globalThis as any).crypto;
  if (c?.randomUUID) return String(c.randomUUID());
  const bytes = new Uint8Array(16);
  c?.getRandomValues?.(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const verifyGuildMembership = async (args: {
  botToken: string;
  guildId: string;
  discordUserId: string;
}): Promise<boolean> => {
  const res = await fetch(
    `https://discord.com/api/v10/guilds/${encodeURIComponent(args.guildId)}/members/${encodeURIComponent(args.discordUserId)}`,
    {
      headers: { Authorization: `Bot ${args.botToken}` },
    },
  );
  if (res.status === 404) return false;
  if (res.ok) return true;
  const text = await res.text().catch(() => "");
  throw new Error(
    `Discord membership check failed: ${res.status} ${text}`.slice(0, 400),
  );
};

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

    // Ensure org-level config is considered "enabled" once a guild is connected.
    // This is important for user-facing pages like /admin/integrations/discord.
    await ctx.runMutation(discordOrgConfigMutations.upsertOrgConfigV2, {
      organizationId,
      enabled: true,
      botMode: "global",
      customClientId: undefined,
      customClientSecretEncrypted: undefined,
      customBotTokenEncrypted: undefined,
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

    const state = randomState();
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
    const redirect = await ctx.runQuery(discordOauthHelperQueries.computeAuthRedirectUri, {
      returnTo: args.returnTo,
      rootDomain,
      fallbackAuthHost: "auth.launchthat.app",
      callbackPath: "/auth/discord/link/callback",
    });

    const orgConfig = await ctx.runQuery(discordOrgConfigQueries.getOrgConfig, {
      organizationId,
    });

    const botMode =
      orgConfig?.botMode === "custom" ? ("custom" as const) : ("global" as const);

    const clientId =
      botMode === "custom"
        ? (typeof orgConfig?.customClientId === "string" && orgConfig.customClientId.trim()) ||
          (typeof orgConfig?.clientId === "string" && orgConfig.clientId.trim()) ||
          ""
        : (process.env.DISCORD_GLOBAL_CLIENT_ID ??
            process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ??
            "").trim();

    if (!clientId) {
      throw new Error(
        botMode === "custom"
          ? "Discord custom bot is missing clientId for this organization"
          : "Missing DISCORD_GLOBAL_CLIENT_ID",
      );
    }

    const state = randomState();
    await ctx.runMutation(discordOauthMutations.createOauthState, {
      organizationId,
      kind: "user_link",
      userId,
      state,
      codeVerifier: "user_link_no_pkce",
      returnTo: args.returnTo,
      callbackPath: "/auth/discord/link/callback",
    });

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

export const completeUserLink = action({
  args: { state: v.string(), code: v.string() },
  returns: v.object({
    organizationId: v.string(),
    userId: v.string(),
    discordUserId: v.string(),
    guildId: v.string(),
  }),
  handler: async (ctx, args) => {
    const viewerUserId = await resolveViewerUserId(ctx);
    const peek = await ctx.runQuery(discordOauthQueries.peekOauthState, { state: args.state });
    const stateUserId = typeof peek?.userId === "string" ? peek.userId : "";
    if (!peek || peek.kind !== "user_link" || !stateUserId || stateUserId !== viewerUserId) {
      throw new Error("Invalid or expired Discord link state");
    }

    const consumed = await ctx.runMutation(discordOauthMutations.consumeOauthState, {
      state: args.state,
    });
    if (!consumed || consumed.kind !== "user_link") {
      throw new Error("Invalid or expired Discord link state");
    }

    const organizationId = String(consumed.organizationId ?? "");
    const userId = typeof consumed.userId === "string" ? consumed.userId : "";
    if (!organizationId || !userId) {
      throw new Error("Missing organizationId/userId for user_link");
    }

    const callbackPath =
      typeof consumed.callbackPath === "string" && consumed.callbackPath.trim()
        ? consumed.callbackPath.trim()
        : "/auth/discord/link/callback";

    const redirect = await ctx.runQuery(discordOauthHelperQueries.computeAuthRedirectUri, {
      returnTo: String(consumed.returnTo ?? ""),
      rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "",
      fallbackAuthHost: "auth.launchthat.app",
      callbackPath,
    });

    const secrets = await ctx.runQuery(discordOrgConfigInternalQueries.getOrgConfigSecrets, {
      organizationId,
    });
    if (!secrets) throw new Error("Discord org config missing");

    const creds = await resolveDiscordCredentials({
      botMode: secrets.botMode === "custom" ? "custom" : "global",
      globalClientId: process.env.DISCORD_GLOBAL_CLIENT_ID,
      globalClientSecret: process.env.DISCORD_GLOBAL_CLIENT_SECRET,
      globalBotToken: process.env.DISCORD_GLOBAL_BOT_TOKEN,
      secretsKey: process.env.DISCORD_SECRETS_KEY,
      customClientId: secrets.customClientId,
      clientId: secrets.clientId,
      customClientSecretEncrypted: secrets.customClientSecretEncrypted,
      clientSecretEncrypted: secrets.clientSecretEncrypted,
      customBotTokenEncrypted: secrets.customBotTokenEncrypted,
      botTokenEncrypted: secrets.botTokenEncrypted,
    });

    const token = await exchangeDiscordCode({
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      code: args.code,
      redirectUri: String(redirect.redirectUri ?? ""),
    });
    const discordUserId = await fetchDiscordUser(token.accessToken);

    const guildConnectionsUnknown = await ctx.runQuery(
      discordGuildConnectionQueries.listGuildConnectionsForOrg,
      { organizationId },
    );
    const guilds = Array.isArray(guildConnectionsUnknown)
      ? guildConnectionsUnknown
      : [];
    const primaryGuild = guilds
      .slice()
      .sort((a: any, b: any) => Number(b?.connectedAt ?? 0) - Number(a?.connectedAt ?? 0))[0];
    const guildId =
      typeof primaryGuild?.guildId === "string" ? primaryGuild.guildId.trim() : "";
    if (!guildId) {
      throw new Error("No Discord guild connected for this organization");
    }

    const isMember = await verifyGuildMembership({
      botToken: creds.botToken,
      guildId,
      discordUserId,
    });
    if (!isMember) {
      throw new Error(
        "You must join the organization Discord server before connecting streaming.",
      );
    }

    await ctx.runMutation(discordUserLinksMutations.linkUser, {
      organizationId,
      userId,
      discordUserId,
    });
    await ctx.runMutation(discordUserStreamingMutations.setUserStreamingEnabled, {
      organizationId,
      userId,
      enabled: true,
    });

    return { organizationId, userId, discordUserId, guildId };
  },
});
