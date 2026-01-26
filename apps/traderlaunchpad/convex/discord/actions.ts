"use node";

import { exchangeDiscordCode, fetchDiscordUser } from "launchthat-plugin-discord/runtime/oauth";
import { discordJson, discordMultipart } from "launchthat-plugin-discord/runtime/discordApi";
import { resolveOrganizationId, resolveViewerUserId } from "../traderlaunchpad/lib/resolve";

import { action } from "../_generated/server";
import { components } from "../_generated/api";
import { resolveDiscordCredentials } from "launchthat-plugin-discord/runtime/credentials";
import { v } from "convex/values";
import { buildSnapshotPreview } from "../platform/test/helpers";

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

export const listGuildChannels = action({
  args: {
    organizationId: v.optional(v.string()),
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
    await resolveViewerUserId(ctx);

    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    const guildId = String(args.guildId ?? "").trim();
    if (!guildId) return [];

    const orgSecrets = (await ctx.runQuery(
      discordOrgConfigInternalQueries.getOrgConfigSecrets,
      { organizationId },
    )) as
      | {
          enabled: boolean;
          botMode: "global" | "custom";
          customClientId?: string;
          customClientSecretEncrypted?: string;
          customBotTokenEncrypted?: string;
          clientId?: string;
          clientSecretEncrypted?: string;
          botTokenEncrypted?: string;
        }
      | null;

    if (!orgSecrets?.enabled) {
      throw new Error("Discord is not enabled for this organization");
    }

    const secretsKey = process.env.DISCORD_SECRETS_KEY ?? "";
    const globalClientId =
      (process.env.DISCORD_GLOBAL_CLIENT_ID ??
        process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ??
        "").trim();
    const globalClientSecret = (process.env.DISCORD_GLOBAL_CLIENT_SECRET ?? "").trim();
    const globalBotToken = (process.env.DISCORD_GLOBAL_BOT_TOKEN ?? "").trim();

    const creds = await resolveDiscordCredentials({
      botMode: orgSecrets.botMode === "custom" ? "custom" : "global",
      secretsKey,
      globalClientId,
      globalClientSecret,
      globalBotToken,
      customClientId: orgSecrets.customClientId,
      customClientSecretEncrypted: orgSecrets.customClientSecretEncrypted,
      customBotTokenEncrypted: orgSecrets.customBotTokenEncrypted,
      clientId: orgSecrets.clientId,
      clientSecretEncrypted: orgSecrets.clientSecretEncrypted,
      botTokenEncrypted: orgSecrets.botTokenEncrypted,
    });

    const botToken = String((creds as any)?.botToken ?? "").trim();
    if (!botToken) throw new Error("Missing Discord bot token");

    const res = await fetch(
      `https://discord.com/api/v10/guilds/${encodeURIComponent(guildId)}/channels`,
      { headers: { Authorization: `Bot ${botToken}` } },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Discord list channels failed (${res.status}): ${text || "request failed"}`.slice(
          0,
          400,
        ),
      );
    }

    const json = (await res.json()) as unknown;
    const channels = Array.isArray(json) ? (json as any[]) : [];

    return channels
      .map((c) => ({
        id: String(c?.id ?? ""),
        name: String(c?.name ?? ""),
        type: typeof c?.type === "number" ? c.type : -1,
        parentId: typeof c?.parent_id === "string" ? c.parent_id : null,
        position: typeof c?.position === "number" ? c.position : null,
      }))
      .filter((c) => c.id && c.name);
  },
});

export const sendTestDiscordMessage = action({
  args: {
    organizationId: v.optional(v.string()),
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
    await resolveViewerUserId(ctx);

    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    const guildId = String(args.guildId ?? "").trim();
    const channelId = String(args.channelId ?? "").trim();
    const content = String(args.content ?? "").trim();
    if (!guildId) throw new Error("Missing guildId");
    if (!channelId) throw new Error("Missing channelId");
    if (!content) throw new Error("Missing content");

    const orgSecrets = (await ctx.runQuery(
      discordOrgConfigInternalQueries.getOrgConfigSecrets,
      { organizationId },
    )) as
      | {
          enabled: boolean;
          botMode: "global" | "custom";
          customClientId?: string;
          customClientSecretEncrypted?: string;
          customBotTokenEncrypted?: string;
          clientId?: string;
          clientSecretEncrypted?: string;
          botTokenEncrypted?: string;
        }
      | null;

    if (!orgSecrets?.enabled) {
      throw new Error("Discord is not enabled for this organization");
    }

    const secretsKey = process.env.DISCORD_SECRETS_KEY ?? "";
    const globalClientId =
      (process.env.DISCORD_GLOBAL_CLIENT_ID ??
        process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ??
        "").trim();
    const globalClientSecret = (process.env.DISCORD_GLOBAL_CLIENT_SECRET ?? "").trim();
    const globalBotToken = (process.env.DISCORD_GLOBAL_BOT_TOKEN ?? "").trim();

    const creds = await resolveDiscordCredentials({
      botMode: orgSecrets.botMode === "custom" ? "custom" : "global",
      secretsKey,
      globalClientId,
      globalClientSecret,
      globalBotToken,
      customClientId: orgSecrets.customClientId,
      customClientSecretEncrypted: orgSecrets.customClientSecretEncrypted,
      customBotTokenEncrypted: orgSecrets.customBotTokenEncrypted,
      clientId: orgSecrets.clientId,
      clientSecretEncrypted: orgSecrets.clientSecretEncrypted,
      botTokenEncrypted: orgSecrets.botTokenEncrypted,
    });

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

const buildTemplatePreview = async (
  ctx: any,
  args: {
    organizationId?: string;
    templateId?: string;
    template?: string;
    templateJson?: string;
    values: Record<string, string>;
    snapshotSymbol?: string;
  },
): Promise<{
  content: string;
  imageBase64?: string;
  contentType?: string;
  filename?: string;
}> => {
  const organizationId =
    typeof args.organizationId === "string" && args.organizationId.trim()
      ? args.organizationId.trim()
      : resolveOrganizationId();
  const templateId = String(args.templateId ?? "").trim();

  let template = typeof args.template === "string" ? args.template : "";
  let templateJson = typeof args.templateJson === "string" ? args.templateJson : "";

  if (!template && templateId) {
    const row = await ctx.runQuery(
      components.launchthat_discord.templates.queries.getTemplateById as any,
      { organizationId, templateId },
    );
    template = typeof (row as any)?.template === "string" ? String((row as any).template) : "";
    templateJson =
      typeof (row as any)?.templateJson === "string" ? String((row as any).templateJson) : "";
  }

  if (!template) throw new Error("Missing template/templateId");
  const values = args.values ?? {};
  const content = template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? "");

  // Parse templateJson snapshot config (if present).
  let snapshotCfg: any = null;
  try {
    const parsed = templateJson ? JSON.parse(templateJson) : null;
    const attachments = Array.isArray(parsed?.attachments) ? parsed.attachments : [];
    snapshotCfg = attachments.find((a: any) => a?.type === "snapshot_png") ?? null;
  } catch {
    snapshotCfg = null;
  }

  if (!snapshotCfg) return { content };

  const symbol =
    typeof args.snapshotSymbol === "string" && args.snapshotSymbol.trim()
      ? args.snapshotSymbol.trim().toUpperCase()
      : typeof values.symbol === "string" && values.symbol.trim()
        ? values.symbol.trim().toUpperCase()
        : "BTCUSD";

  const lookbackDaysRaw = Number(snapshotCfg?.params?.lookbackDays ?? 3);
  const lookbackDays = Math.max(1, Math.min(30, Math.floor(lookbackDaysRaw)));
  const showSentimentBadge =
    typeof snapshotCfg?.params?.showSentimentBadge === "boolean"
      ? snapshotCfg.params.showSentimentBadge
      : true;
  const themeModeRaw =
    typeof snapshotCfg?.params?.themeMode === "string"
      ? String(snapshotCfg.params.themeMode).trim().toLowerCase()
      : "";
  const themeMode =
    themeModeRaw === "light"
      ? "light"
      : themeModeRaw === "custom"
        ? "custom"
        : "dark";
  const bgColorRaw =
    typeof snapshotCfg?.params?.bgColor === "string"
      ? String(snapshotCfg.params.bgColor).trim()
      : "";
  const gridOpacityRaw = Number(snapshotCfg?.params?.gridOpacity ?? NaN);
  const gridOpacity =
    Number.isFinite(gridOpacityRaw) ? Math.max(0, Math.min(0.25, gridOpacityRaw)) : undefined;
  const gridColorRaw =
    typeof snapshotCfg?.params?.gridColor === "string"
      ? String(snapshotCfg.params.gridColor).trim()
      : "";
  const candleSpacingRaw = Number(snapshotCfg?.params?.candleSpacingPct ?? NaN);
  const candleSpacingPct =
    Number.isFinite(candleSpacingRaw)
      ? Math.max(0, Math.min(80, Math.round(candleSpacingRaw)))
      : undefined;
  const candleUpColorRaw =
    typeof snapshotCfg?.params?.candleUpColor === "string"
      ? String(snapshotCfg.params.candleUpColor).trim()
      : "";
  const candleDownColorRaw =
    typeof snapshotCfg?.params?.candleDownColor === "string"
      ? String(snapshotCfg.params.candleDownColor).trim()
      : "";
  const tradeIndicatorShapeRaw =
    typeof snapshotCfg?.params?.tradeIndicatorShape === "string"
      ? String(snapshotCfg.params.tradeIndicatorShape).trim().toLowerCase()
      : "";
  const tradeIndicatorShape = tradeIndicatorShapeRaw === "triangle" ? "triangle" : "circle";

  const preview = await buildSnapshotPreview(ctx, {
    organizationId,
    symbol,
    lookbackDays,
    showSentimentBadge,
    themeMode,
    bgColor: bgColorRaw || undefined,
    gridOpacity,
    gridColor: gridColorRaw || undefined,
    candleSpacingPct,
    candleUpColor: candleUpColorRaw || undefined,
    candleDownColor: candleDownColorRaw || undefined,
    tradeIndicatorShape,
    maxUsers: 200,
    useMockData: true,
  });

  const base64 =
    typeof (preview as any)?.base64 === "string" ? (preview as any).base64 : undefined;
  const contentType =
    typeof (preview as any)?.contentType === "string"
      ? (preview as any).contentType
      : "image/png";
  const filename =
    typeof (preview as any)?.filename === "string"
      ? (preview as any).filename
      : `${symbol}-snapshot.png`;

  return { content, imageBase64: base64, contentType, filename };
};

export const previewTemplate = action({
  args: {
    organizationId: v.optional(v.string()),
    templateId: v.optional(v.string()),
    template: v.optional(v.string()),
    templateJson: v.optional(v.string()),
    values: v.record(v.string(), v.string()),
    snapshotSymbol: v.optional(v.string()),
  },
  returns: v.object({
    content: v.string(),
    imageBase64: v.optional(v.string()),
    contentType: v.optional(v.string()),
    filename: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    await resolveViewerUserId(ctx);
    return await buildTemplatePreview(ctx, {
      organizationId: args.organizationId,
      templateId: args.templateId,
      template: args.template,
      templateJson: args.templateJson,
      values: args.values,
      snapshotSymbol: args.snapshotSymbol,
    });
  },
});

export const sendTemplateTest = action({
  args: {
    organizationId: v.optional(v.string()),
    guildId: v.string(),
    channelId: v.string(),
    templateId: v.optional(v.string()),
    template: v.optional(v.string()),
    templateJson: v.optional(v.string()),
    values: v.record(v.string(), v.string()),
    snapshotSymbol: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    channelId: v.string(),
    messageId: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    await resolveViewerUserId(ctx);

    const organizationId =
      typeof args.organizationId === "string" && args.organizationId.trim()
        ? args.organizationId.trim()
        : resolveOrganizationId();
    const guildId = String(args.guildId ?? "").trim();
    const channelId = String(args.channelId ?? "").trim();
    const templateId = String(args.templateId ?? "").trim();
    if (!guildId) throw new Error("Missing guildId");
    if (!channelId) throw new Error("Missing channelId");
    if (!templateId && typeof args.template !== "string") throw new Error("Missing templateId");

    const preview = await buildTemplatePreview(ctx, {
      organizationId,
      templateId: templateId || undefined,
      template: typeof args.template === "string" ? args.template : undefined,
      templateJson: typeof args.templateJson === "string" ? args.templateJson : undefined,
      values: args.values,
      snapshotSymbol: args.snapshotSymbol,
    });

    const content = typeof (preview as any)?.content === "string" ? (preview as any).content : "";
    const imageBase64 = typeof (preview as any)?.imageBase64 === "string" ? (preview as any).imageBase64 : "";

    const orgSecrets = (await ctx.runQuery(
      (components as any).launchthat_discord.orgConfigs.internalQueries.getOrgConfigSecrets,
      { organizationId },
    )) as any;
    if (!orgSecrets?.enabled) throw new Error("Discord is not enabled for this organization");

    const secretsKey = process.env.DISCORD_SECRETS_KEY ?? "";
    const globalClientId =
      (process.env.DISCORD_GLOBAL_CLIENT_ID ??
        process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ??
        "").trim();
    const globalClientSecret = (process.env.DISCORD_GLOBAL_CLIENT_SECRET ?? "").trim();
    const globalBotToken = (process.env.DISCORD_GLOBAL_BOT_TOKEN ?? "").trim();

    const creds = await resolveDiscordCredentials({
      botMode: orgSecrets.botMode === "custom" ? "custom" : "global",
      secretsKey,
      globalClientId,
      globalClientSecret,
      globalBotToken,
      customClientId: orgSecrets.customClientId,
      customClientSecretEncrypted: orgSecrets.customClientSecretEncrypted,
      customBotTokenEncrypted: orgSecrets.customBotTokenEncrypted,
      clientId: orgSecrets.clientId,
      clientSecretEncrypted: orgSecrets.clientSecretEncrypted,
      botTokenEncrypted: orgSecrets.botTokenEncrypted,
    });
    const botToken = String((creds as any)?.botToken ?? "").trim();
    if (!botToken) throw new Error("Missing Discord bot token");

    const res = imageBase64
      ? await discordMultipart({
          botToken,
          method: "POST",
          url: `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`,
          payloadJson: {
            content: "",
            embeds: [{ description: content, image: { url: "attachment://snapshot.png" } }],
          },
          file: {
            name: "snapshot.png",
            bytes: new Uint8Array(Buffer.from(imageBase64, "base64")),
            contentType: "image/png",
          },
        })
      : await discordJson({
          botToken,
          method: "POST",
          url: `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`,
          body: { content },
        });

    if (!res.ok) {
      throw new Error(`Discord send failed (${res.status}): ${res.text.slice(0, 200)}`);
    }
    const messageId = typeof (res.json as any)?.id === "string" ? String((res.json as any).id) : null;
    return { ok: true, channelId, messageId };
  },
});

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
