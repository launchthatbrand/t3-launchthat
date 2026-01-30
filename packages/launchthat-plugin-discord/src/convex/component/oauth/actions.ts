import { exchangeDiscordCode, fetchDiscordUser } from "../../../runtime/oauth";

import { action } from "../server";
import { resolveDiscordCredentials } from "../../../runtime/credentials";
import { v } from "convex/values";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access
*/
// Avoid typed `api` imports here; they can cause TS circularity in component packages.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const api: any = require("../_generated/api").api;

const randomState = (): string => {
  // Convex V8 runtime exposes WebCrypto.
  // Prefer crypto.randomUUID when available.
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
  throw new Error(`Discord membership check failed: ${res.status} ${text}`.slice(0, 400));
};

export const startUserLink = action({
  args: {
    organizationId: v.optional(v.string()),
    userId: v.string(),
    returnTo: v.string(),
    callbackPath: v.string(),
  },
  returns: v.object({ url: v.string(), state: v.string() }),
  handler: async (ctx, args) => {
    const redirect = await ctx.runQuery(api.oauth.helpers.queries.computeAuthRedirectUri, {
      returnTo: args.returnTo,
      rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "",
      fallbackAuthHost: "auth.launchthat.app",
      callbackPath: args.callbackPath,
    });

    const state = randomState();
    await ctx.runMutation(api.oauth.mutations.createOauthState, {
      organizationId: args.organizationId,
      kind: "user_link",
      userId: args.userId,
      state,
      codeVerifier: "user_link_no_pkce",
      returnTo: args.returnTo,
      callbackPath: args.callbackPath,
    });

    const clientId =
      process.env.DISCORD_GLOBAL_CLIENT_ID ??
      process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ??
      "";
    if (!clientId) throw new Error("Missing DISCORD_GLOBAL_CLIENT_ID");

    const scope = encodeURIComponent(
      args.organizationId ? "identify" : "identify guilds.join",
    );
    const url =
      `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent((redirect as any).redirectUri)}` +
      `&scope=${scope}` +
      `&state=${encodeURIComponent(state)}` +
      `&prompt=consent`;

    return { url, state };
  },
});

export const completeUserLink = action({
  args: {
    state: v.string(),
    code: v.string(),
  },
  returns: v.object({
    organizationId: v.optional(v.string()),
    userId: v.string(),
    discordUserId: v.string(),
    guildId: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const consumed = await ctx.runMutation(api.oauth.mutations.consumeOauthState, {
      state: args.state,
    });
    if (!consumed || consumed.kind !== "user_link") {
      throw new Error("Invalid or expired Discord link state");
    }
    const organizationId =
      typeof consumed.organizationId === "string" && consumed.organizationId.trim()
        ? String(consumed.organizationId)
        : "";
    const userId = typeof consumed.userId === "string" ? consumed.userId : "";
    if (!userId) throw new Error("Missing userId for user_link");

    // Determine redirectUri for token exchange (must match the one used during auth).
    const callbackPath =
      typeof (consumed as any).callbackPath === "string" && (consumed as any).callbackPath.trim()
        ? String((consumed as any).callbackPath)
        : "/auth/discord/link/callback";
    const redirect = await ctx.runQuery(api.oauth.helpers.queries.computeAuthRedirectUri, {
      returnTo: String(consumed.returnTo ?? ""),
      rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "",
      fallbackAuthHost: "auth.launchthat.app",
      callbackPath,
    });

    const secrets = organizationId
      ? await ctx.runQuery(api.orgConfigs.internalQueries.getOrgConfigSecrets, {
        organizationId,
      })
      : null;
    if (organizationId && !secrets) throw new Error("Discord org config missing");

    const creds = await resolveDiscordCredentials({
      botMode: secrets?.botMode === "custom" ? "custom" : "global",
      globalClientId: process.env.DISCORD_GLOBAL_CLIENT_ID,
      globalClientSecret: process.env.DISCORD_GLOBAL_CLIENT_SECRET,
      globalBotToken: process.env.DISCORD_GLOBAL_BOT_TOKEN,
      secretsKey: process.env.DISCORD_SECRETS_KEY,
      customClientId: secrets?.customClientId,
      clientId: secrets?.clientId,
      customClientSecretEncrypted: secrets?.customClientSecretEncrypted,
      clientSecretEncrypted: secrets?.clientSecretEncrypted,
      customBotTokenEncrypted: secrets?.customBotTokenEncrypted,
      botTokenEncrypted: secrets?.botTokenEncrypted,
    });

    const token = await exchangeDiscordCode({
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      code: args.code,
      redirectUri: String((redirect as any).redirectUri ?? ""),
    });
    const discordUserId = await fetchDiscordUser(token.accessToken);

    let guildId: string | null = null;
    if (organizationId) {
      const guildsUnknown = await ctx.runQuery(
        api.guildConnections.queries.listGuildConnectionsForOrg,
        { organizationId },
      );
      const guilds = Array.isArray(guildsUnknown) ? guildsUnknown : [];
      const primaryGuild = guilds
        .slice()
        .sort((a: any, b: any) => Number(b?.connectedAt ?? 0) - Number(a?.connectedAt ?? 0))[0];
      guildId =
        typeof (primaryGuild as any)?.guildId === "string" ? primaryGuild.guildId : null;
      if (!guildId) {
        throw new Error("No Discord guild connected for this organization");
      }

      const isMember = await verifyGuildMembership({
        botToken: creds.botToken,
        guildId,
        discordUserId,
      });
      if (!isMember) {
        throw new Error("You must join the organization Discord server before connecting streaming.");
      }
    } else {
      const envGuildId =
        (process.env.TDRLP_DISCORD_GUILD_ID ??
          process.env.DISCORD_GLOBAL_GUILD_ID ??
          "").trim();
      guildId = envGuildId || null;
    }

    await ctx.runMutation(api.userLinks.mutations.linkUser, {
      organizationId: organizationId || undefined,
      userId,
      discordUserId,
    });
    if (organizationId) {
      await ctx.runMutation(api.userStreaming.mutations.setUserStreamingEnabled, {
        organizationId,
        userId,
        enabled: true,
      });
    }

    return { organizationId: organizationId || undefined, userId, discordUserId, guildId };
  },
});

