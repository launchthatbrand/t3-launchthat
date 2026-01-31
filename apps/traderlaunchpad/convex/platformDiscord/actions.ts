"use node";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-argument,
  @typescript-eslint/no-unnecessary-condition,
  @typescript-eslint/no-unnecessary-type-assertion,
  turbo/no-undeclared-env-vars,
  no-restricted-properties
*/

import { addGuildMember, fetchDiscordProfile } from "launchthat-plugin-discord/runtime";

import { action } from "../_generated/server";
import { components } from "../_generated/api";
import { discordJson } from "launchthat-plugin-discord/runtime/discordApi";
import { exchangeDiscordCode } from "launchthat-plugin-discord/runtime/oauth";
import { resolveDiscordCredentials } from "launchthat-plugin-discord/runtime/credentials";
import { resolveViewerUserId } from "../traderlaunchpad/lib/resolve";
import { v } from "convex/values";

const discordOauthMutations = components.launchthat_discord.oauth.mutations as any;
const discordOauthQueries = components.launchthat_discord.oauth.queries as any;
const discordOauthHelperQueries =
  components.launchthat_discord.oauth.helpers.queries as any;
const guildConnectionMutations =
  components.launchthat_discord.guildConnections.mutations as any;
const guildConnectionQueries =
  components.launchthat_discord.guildConnections.queries as any;
const configMutations = components.launchthat_discord.orgConfigs.mutations as any;
const configInternalQueries =
  components.launchthat_discord.orgConfigs.internalQueries as any;
const userLinksMutations =
  components.launchthat_discord.userLinks.mutations as any;
const userStreamingMutations =
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


const getPlatformCredentials = async (ctx: any) => {
  const platformSecrets = (await ctx.runQuery(
    configInternalQueries.getOrgConfigSecrets,
    { scope: "platform" },
  )) as
    | {
      enabled: boolean;
      botMode: "global" | "custom";
      customClientId?: string;
      customClientSecretEncrypted?: string;
      customBotTokenEncrypted?: string;
    }
    | null;

  const secretsKey = process.env.DISCORD_SECRETS_KEY ?? "";
  const globalClientId =
    (process.env.DISCORD_GLOBAL_CLIENT_ID ??
      process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ??
      "").trim();
  const globalClientSecret = (process.env.DISCORD_GLOBAL_CLIENT_SECRET ?? "").trim();
  const globalBotToken = (process.env.DISCORD_GLOBAL_BOT_TOKEN ?? "").trim();

  const creds = await resolveDiscordCredentials({
    botMode: platformSecrets?.botMode === "custom" ? "custom" : "global",
    secretsKey,
    globalClientId,
    globalClientSecret,
    globalBotToken,
    customClientId: platformSecrets?.customClientId,
    customClientSecretEncrypted: platformSecrets?.customClientSecretEncrypted,
    customBotTokenEncrypted: platformSecrets?.customBotTokenEncrypted,
  });

  return { creds, enabled: platformSecrets?.enabled ?? false };
};

export const listGuildChannels = action({
  args: {
    guildId: v.string(),
  },
  returns: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      type: v.number(),
      parentId: v.union(v.string(), v.null()),
      position: v.union(v.number(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    await ensureViewerOrDev(ctx);
    const guildId = String(args.guildId ?? "").trim();
    if (!guildId) return [];

    const { creds, enabled } = await getPlatformCredentials(ctx);
    if (!enabled) throw new Error("Discord is not enabled for the platform");

    const botToken = String((creds as any)?.botToken ?? "").trim();
    if (!botToken) throw new Error("Missing Discord bot token");

    const res = await fetch(
      `https://discord.com/api/v10/guilds/${encodeURIComponent(guildId)}/channels`,
      {
        headers: { Authorization: `Bot ${botToken}` },
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Discord list channels failed (${res.status}): ${text.slice(0, 200)}`,
      );
    }
    const channels = (await res.json().catch(() => [])) as unknown[];
    return channels
      .map((c: any) => ({
        id: String(c?.id ?? ""),
        name: String(c?.name ?? ""),
        type: typeof c?.type === "number" ? c.type : 0,
        parentId: typeof c?.parent_id === "string" ? c.parent_id : null,
        position: typeof c?.position === "number" ? c.position : null,
      }))
      .filter((c: any) => c.id && c.name);
  },
});

export const sendTestDiscordMessage = action({
  args: {
    guildId: v.string(),
    channelId: v.string(),
    content: v.string(),
  },
  returns: v.object({
    ok: v.boolean(),
    channelId: v.string(),
    messageId: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    await ensureViewerOrDev(ctx);
    const guildId = String(args.guildId ?? "").trim();
    const channelId = String(args.channelId ?? "").trim();
    const content = String(args.content ?? "").trim();
    if (!guildId) throw new Error("Missing guildId");
    if (!channelId) throw new Error("Missing channelId");
    if (!content) throw new Error("Missing content");

    const { creds, enabled } = await getPlatformCredentials(ctx);
    if (!enabled) {
      throw new Error("Discord is not enabled for the platform");
    }

    const botToken = String((creds as any)?.botToken ?? "").trim();
    if (!botToken) throw new Error("Missing Discord bot token");

    const res = await fetch(
      `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ content }),
      },
    );

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      throw new Error(
        `Discord send message failed (${res.status}): ${text || "request failed"}`.slice(
          0,
          400,
        ),
      );
    }

    let messageId: string | null = null;
    try {
      const json = JSON.parse(text) as { id?: unknown };
      messageId = typeof json?.id === "string" ? json.id : null;
    } catch {
      // ignore
    }

    return { ok: true, channelId, messageId };
  },
});

const buildTemplatePreview = async (ctx: any, args: {
  templateId?: string;
  template?: string;
  templateJson?: string;
  values: Record<string, string>;
}): Promise<{ content: string; imageBase64?: string; contentType?: string; filename?: string }> => {
  const templateId = String(args.templateId ?? "").trim();
  let template = typeof args.template === "string" ? args.template : "";

  if (!template && templateId) {
    const row = await ctx.runQuery(
      components.launchthat_discord.templates.queries.getTemplateById as any,
      { scope: "platform", organizationId: undefined, templateId },
    );
    template = typeof (row as any)?.template === "string" ? String((row as any).template) : "";
  }

  if (!template) throw new Error("Missing template/templateId");
  const values = args.values ?? {};
  const content = template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? "");
  return { content };
};

export const previewTemplate = action({
  args: {
    templateId: v.optional(v.string()),
    template: v.optional(v.string()),
    templateJson: v.optional(v.string()),
    values: v.record(v.string(), v.string()),
  },
  returns: v.object({
    content: v.string(),
    imageBase64: v.optional(v.string()),
    contentType: v.optional(v.string()),
    filename: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    await ensureViewerOrDev(ctx);
    return await buildTemplatePreview(ctx, {
      templateId: args.templateId,
      template: args.template,
      templateJson: args.templateJson,
      values: args.values,
    });
  },
});

export const sendTemplateTest = action({
  args: {
    guildId: v.string(),
    channelId: v.string(),
    templateId: v.optional(v.string()),
    template: v.optional(v.string()),
    templateJson: v.optional(v.string()),
    values: v.record(v.string(), v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    channelId: v.string(),
    messageId: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    await ensureViewerOrDev(ctx);
    const guildId = String(args.guildId ?? "").trim();
    const channelId = String(args.channelId ?? "").trim();
    const templateId = String(args.templateId ?? "").trim();
    if (!guildId) throw new Error("Missing guildId");
    if (!channelId) throw new Error("Missing channelId");
    if (!templateId && typeof args.template !== "string") throw new Error("Missing templateId");

    const preview = await buildTemplatePreview(ctx, {
      templateId: templateId || undefined,
      template: typeof args.template === "string" ? args.template : undefined,
      templateJson: typeof args.templateJson === "string" ? args.templateJson : undefined,
      values: args.values,
    });

    const content = typeof (preview as any)?.content === "string" ? (preview as any).content : "";

    const { creds, enabled } = await getPlatformCredentials(ctx);
    if (!enabled) throw new Error("Discord is not enabled for the platform");

    const botToken = String((creds as any)?.botToken ?? "").trim();
    if (!botToken) throw new Error("Missing Discord bot token");

    const res = await discordJson({
      botToken,
      method: "POST",
      url: `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`,
      body: { content },
    });

    if (!res.ok) {
      throw new Error(`Discord send failed (${res.status}): ${res.text.slice(0, 200)}`);
    }
    const messageId =
      typeof (res.json as any)?.id === "string" ? String((res.json as any).id) : null;
    return { ok: true, channelId, messageId };
  },
});

export const runAutomationDryRun = action({
  args: {
    templateId: v.string(),
    contextProviderKey: v.optional(v.string()),
    contextProviderParams: v.optional(v.string()),
  },
  returns: v.object({
    content: v.string(),
    imageBase64: v.optional(v.string()),
    contentType: v.optional(v.string()),
    filename: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    await ensureViewerOrDev(ctx);
    const providerKey =
      typeof args.contextProviderKey === "string" ? args.contextProviderKey.trim() : "";
    const values: Record<string, string> =
      providerKey === "traderlaunchpad.hourlyTradeSummary"
        ? {
          symbol: "BTCUSD",
          openPositions: "0",
          usersAllowed: "0",
          sentiment: "MIXED",
          now: `<t:${Math.floor(Date.now() / 1000)}:f>`,
        }
        : { now: `<t:${Math.floor(Date.now() / 1000)}:f>` };

    return await buildTemplatePreview(ctx, {
      templateId: args.templateId,
      values,
    });
  },
});

export const completeBotInstall = action({
  args: {
    state: v.string(),
    guildId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ensureViewerOrDev(ctx);
    const guildId = args.guildId.trim();
    if (!guildId) throw new Error("Missing guildId");

    const consumed = await ctx.runMutation(discordOauthMutations.consumeOauthState, {
      state: args.state,
    });
    if (!consumed || consumed.kind !== "org_install" || consumed.scope !== "platform") {
      throw new Error("Invalid or expired Discord install state");
    }

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

    await ctx.runMutation(guildConnectionMutations.upsertGuildConnection, {
      scope: "platform",
      organizationId: undefined,
      guildId,
      guildName,
      botModeAtConnect: "global",
      connectedAt: Date.now(),
    });

    await ctx.runMutation(configMutations.upsertOrgConfigV2, {
      scope: "platform",
      organizationId: undefined,
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
    returnTo: v.string(),
  },
  returns: v.object({
    url: v.string(),
    state: v.string(),
  }),
  handler: async (ctx, args) => {
    await ensureViewerOrDev(ctx);

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "";
    const redirect = await ctx.runQuery(
      discordOauthHelperQueries.computeAuthRedirectUri,
      {
        returnTo: args.returnTo,
        rootDomain,
        fallbackAuthHost: "auth.traderlaunchpad.com",
        callbackPath: "/auth/discord/install/callback",
      },
    );

    const state = randomState();
    await ctx.runMutation(discordOauthMutations.createOauthState, {
      scope: "platform",
      organizationId: undefined,
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
  args: { guildId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ensureViewerOrDev(ctx);
    await ctx.runMutation(guildConnectionMutations.deleteGuildConnection, {
      scope: "platform",
      organizationId: undefined,
      guildId: args.guildId,
    });
    return null;
  },
});

export const startUserLink = action({
  args: {
    returnTo: v.string(),
  },
  returns: v.object({
    url: v.string(),
    state: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = (await ensureViewerOrDev(ctx)) ?? "local_dev";

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "";
    const redirect = await ctx.runQuery(discordOauthHelperQueries.computeAuthRedirectUri, {
      returnTo: args.returnTo,
      rootDomain,
      fallbackAuthHost: "auth.traderlaunchpad.com",
      callbackPath: "/auth/discord/link/callback",
    });

    const state = randomState();
    await ctx.runMutation(discordOauthMutations.createOauthState, {
      scope: "platform",
      organizationId: undefined,
      kind: "user_link",
      userId,
      state,
      codeVerifier: "user_link_no_pkce",
      returnTo: args.returnTo,
      callbackPath: "/auth/discord/link/callback",
    });

    const clientId =
      process.env.DISCORD_GLOBAL_CLIENT_ID ??
      process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ??
      "";
    if (!clientId) {
      throw new Error("Missing DISCORD_GLOBAL_CLIENT_ID");
    }

    const scope = encodeURIComponent("identify guilds.join");
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
    userId: v.string(),
    discordUserId: v.string(),
    guildId: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const viewerUserId = (await ensureViewerOrDev(ctx)) ?? "";
    const peek = await ctx.runQuery(discordOauthQueries.peekOauthState, { state: args.state });
    if (peek?.organizationId || peek?.scope !== "platform") {
      throw new Error("Invalid or expired Discord link state");
    }
    const consumed = await ctx.runMutation(discordOauthMutations.consumeOauthState, {
      state: args.state,
    });
    if (!consumed || consumed.kind !== "user_link" || consumed.scope !== "platform") {
      throw new Error("Invalid or expired Discord link state");
    }
    const userId = typeof consumed.userId === "string" ? consumed.userId : "";
    const effectiveUserId = userId ?? viewerUserId ?? "local_dev";
    if (!effectiveUserId) {
      throw new Error("Invalid or expired Discord link state");
    }
    if (viewerUserId && userId && userId !== viewerUserId) {
      throw new Error("Invalid or expired Discord link state");
    }

    const callbackPath =
      typeof consumed.callbackPath === "string" && consumed.callbackPath.trim()
        ? consumed.callbackPath.trim()
        : "/auth/discord/link/callback";

    const redirect = await ctx.runQuery(discordOauthHelperQueries.computeAuthRedirectUri, {
      returnTo: String(consumed.returnTo ?? ""),
      rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "",
      fallbackAuthHost: "auth.traderlaunchpad.com",
      callbackPath,
    });

    const { creds } = await getPlatformCredentials(ctx);
    const token = await exchangeDiscordCode({
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      code: args.code,
      redirectUri: String(redirect.redirectUri ?? ""),
    });
    const profile = await fetchDiscordProfile(token.accessToken);

    const guildConnections = await ctx.runQuery(
      guildConnectionQueries.listGuildConnectionsForOrg,
      { scope: "platform", organizationId: undefined },
    );
    const guilds = Array.isArray(guildConnections) ? guildConnections : [];
    const primaryGuild = guilds
      .slice()
      .sort((a: any, b: any) => Number(b?.connectedAt ?? 0) - Number(a?.connectedAt ?? 0))[0];
    const guildId =
      typeof primaryGuild?.guildId === "string" && primaryGuild.guildId.trim()
        ? primaryGuild.guildId.trim()
        : null;

    console.log("[platformDiscord.completeUserLink] guildId", guildId);

    if (guildId && creds.botToken) {
      const added = await addGuildMember({
        botToken: creds.botToken,
        guildId,
        discordUserId: profile.discordUserId,
        accessToken: token.accessToken,
      });
      console.log("[platformDiscord.completeUserLink] addGuildMember", {
        guildId,
        added,
        discordUserId: profile.discordUserId,
      });
    } else {
      console.log("[platformDiscord.completeUserLink] skip addGuildMember", {
        guildId,
        hasBotToken: Boolean(creds.botToken),
      });
    }

    await ctx.runMutation(userLinksMutations.linkUser, {
      scope: "platform",
      userId: effectiveUserId,
      discordUserId: profile.discordUserId,
      discordUsername: profile.username,
      discordDiscriminator: profile.discriminator,
      discordGlobalName: profile.globalName,
      discordAvatar: profile.avatar,
    });

    await ctx.runMutation(userStreamingMutations.setUserStreamingEnabled, {
      scope: "platform",
      userId: effectiveUserId,
      enabled: true,
    });

    return { userId: effectiveUserId, discordUserId: profile.discordUserId, guildId };
  },
});
