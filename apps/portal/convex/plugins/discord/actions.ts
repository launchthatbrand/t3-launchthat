"use node";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-return,
  @typescript-eslint/prefer-nullish-coalescing,
  turbo/no-undeclared-env-vars
*/
import crypto from "node:crypto";
import { v } from "convex/values";

import { api as apiAny, components } from "../../_generated/api";
import { action, internalAction } from "../../_generated/server";
import { verifyOrganizationAccessWithClerkContext } from "../../core/organizations/helpers";

const discordOrgConfigMutations = components.launchthat_discord.orgConfigs
  .mutations as any;
const discordOrgConfigInternalQueries = components.launchthat_discord.orgConfigs
  .internalQueries as any;
const discordOauthMutations = components.launchthat_discord.oauth
  .mutations as any;
const discordOauthMutationsAny = discordOauthMutations;
const discordOauthQueriesAny = components.launchthat_discord.oauth.queries as any;
const discordUserLinksMutationsAny = components.launchthat_discord.userLinks
  .mutations as any;
const discordGuildConnectionMutations = components.launchthat_discord
  .guildConnections.mutations as any;
const discordGuildSettingsMutations = components.launchthat_discord
  .guildSettings.mutations as any;
const discordSupportMutations = components.launchthat_discord.support
  .mutations as any;

const encryptSecret = (plaintext: string, keyMaterial: string): string => {
  const key = crypto.createHash("sha256").update(keyMaterial).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(plaintext, "utf8")),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload = {
    v: 1,
    alg: "aes-256-gcm",
    ivB64: iv.toString("base64"),
    tagB64: tag.toString("base64"),
    dataB64: ciphertext.toString("base64"),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64",
  );
  return `enc_v1:${encoded}`;
};

const decryptSecret = (ciphertext: string, keyMaterial: string): string => {
  if (!ciphertext.startsWith("enc_v1:")) {
    throw new Error("Expected enc_v1 ciphertext");
  }
  const raw = ciphertext.slice("enc_v1:".length);
  const decoded = Buffer.from(raw, "base64").toString("utf8");
  const parsed = JSON.parse(decoded) as {
    v: number;
    alg: string;
    ivB64: string;
    tagB64: string;
    dataB64: string;
  };
  if (parsed.alg !== "aes-256-gcm") {
    throw new Error("Unsupported ciphertext alg");
  }
  const key = crypto.createHash("sha256").update(keyMaterial).digest();
  const iv = Buffer.from(parsed.ivB64, "base64");
  const tag = Buffer.from(parsed.tagB64, "base64");
  const data = Buffer.from(parsed.dataB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString("utf8");
};

const requireDiscordSecretsKey = (): string => {
  const keyMaterial = process.env.DISCORD_SECRETS_KEY;
  if (!keyMaterial) {
    throw new Error(
      "Missing DISCORD_SECRETS_KEY env (required for Discord plugin custom secrets)",
    );
  }
  return keyMaterial;
};

const requireDiscordGlobalEnv = (): {
  clientId: string;
  clientSecret: string;
  botToken: string;
} => {
  const clientId = process.env.DISCORD_GLOBAL_CLIENT_ID;
  const clientSecret = process.env.DISCORD_GLOBAL_CLIENT_SECRET;
  const botToken = process.env.DISCORD_GLOBAL_BOT_TOKEN;
  if (!clientId || !clientSecret || !botToken) {
    throw new Error(
      "Missing DISCORD_GLOBAL_* env vars (client id/secret + bot token required for global bot mode)",
    );
  }
  return { clientId, clientSecret, botToken };
};

const resolveOrgDiscordCredentials = async (
  ctx: any,
  organizationId: string,
): Promise<{
  botMode: "global" | "custom";
  clientId: string;
  clientSecret: string;
  botToken: string;
}> => {
  const config = await ctx.runQuery(
    discordOrgConfigInternalQueries.getOrgConfigSecrets,
    {
      organizationId,
    },
  );
  if (!config) {
    throw new Error("Discord is not configured for this organization");
  }

  const botMode =
    config.botMode === "global" ? ("global" as const) : ("custom" as const);

  if (botMode === "global") {
    const global = requireDiscordGlobalEnv();
    return { botMode, ...global };
  }

  const keyMaterial = requireDiscordSecretsKey();
  const clientId: string =
    (typeof config.customClientId === "string" &&
      config.customClientId.trim()) ||
    (typeof config.clientId === "string" && config.clientId.trim()) ||
    "";
  const clientSecretEncrypted: string =
    (typeof config.customClientSecretEncrypted === "string" &&
      config.customClientSecretEncrypted) ||
    (typeof config.clientSecretEncrypted === "string" &&
      config.clientSecretEncrypted) ||
    "";
  const botTokenEncrypted: string =
    (typeof config.customBotTokenEncrypted === "string" &&
      config.customBotTokenEncrypted) ||
    (typeof config.botTokenEncrypted === "string" &&
      config.botTokenEncrypted) ||
    "";

  if (!clientId || !clientSecretEncrypted || !botTokenEncrypted) {
    throw new Error(
      "Discord custom bot credentials are incomplete for this organization",
    );
  }

  return {
    botMode,
    clientId,
    clientSecret: decryptSecret(clientSecretEncrypted, keyMaterial),
    botToken: decryptSecret(botTokenEncrypted, keyMaterial),
  };
};

const requireOrgAdminRef = (apiAny as any).plugins.discord.permissions
  .requireOrgAdmin as any;

const requireOrgAdmin = async (ctx: any, organizationId: string) => {
  await (ctx.runQuery as any)(requireOrgAdminRef, { organizationId });
};

export const startBotInstall = action({
  args: {
    organizationId: v.string(),
    returnTo: v.string(),
  },
  returns: v.object({
    url: v.string(),
    state: v.string(),
  }),
  handler: async (ctx, args) => {
    await requireOrgAdmin(ctx, args.organizationId);
    const { clientId } = await resolveOrgDiscordCredentials(
      ctx,
      args.organizationId,
    );
    const state = crypto.randomUUID();

    const computeAuthRedirectUri = (returnTo: string): string => {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "";
      const rootHost = rootDomain
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .split("/")[0]
        ?.split(":")[0];

      let returnToUrl: URL;
      try {
        returnToUrl = new URL(returnTo);
      } catch {
        throw new Error("Invalid returnTo URL");
      }

      const hostname = returnToUrl.hostname.toLowerCase();
      const port = returnToUrl.port;
      const isLocal =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.endsWith(".localhost") ||
        hostname.endsWith(".127.0.0.1");

      const authHostname = isLocal
        ? `auth.${hostname === "127.0.0.1" || hostname.endsWith(".127.0.0.1") ? "127.0.0.1" : "localhost"}`
        : rootHost
          ? `auth.${rootHost}`
          : "auth.launchthat.app";

      const proto = isLocal ? "http" : "https";
      const origin = `${proto}://${authHostname}${isLocal && port ? `:${port}` : ""}`;
      return `${origin}/auth/discord/install/callback`;
    };

    const redirectUri = computeAuthRedirectUri(args.returnTo);

    // Store state for validation on callback. For bot install we don't need PKCE,
    // but our table requires a codeVerifier string.
    await ctx.runMutation(discordOauthMutationsAny.createOauthState, {
      organizationId: args.organizationId,
      kind: "org_install",
      userId: undefined,
      state,
      codeVerifier: "bot_install_no_pkce",
      returnTo: args.returnTo,
    });

    // NOTE: Discord's bot install flow returns `guild_id` and `permissions` on redirect.
    // Some installations also include `code`; we don't rely on it.
    const scope = encodeURIComponent("bot applications.commands");
    // Permissions bitfield (https://discord.com/developers/docs/topics/permissions):
    // - MANAGE_CHANNELS (16)
    // - VIEW_CHANNEL (1024)
    // - SEND_MESSAGES (2048)
    // - READ_MESSAGE_HISTORY (65536)
    // - MANAGE_THREADS (17179869184)
    // - SEND_MESSAGES_IN_THREADS (274877906944)
    // - MANAGE_ROLES (268435456)
    const permissions = "292326280208";
    const url =
      `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scope}` +
      `&permissions=${permissions}` +
      `&state=${encodeURIComponent(state)}`;

    return { url, state };
  },
});

export const startUserLink = action({
  args: {
    organizationId: v.string(),
    returnTo: v.string(),
  },
  returns: v.object({
    url: v.string(),
    state: v.string(),
  }),
  handler: async (ctx, args) => {
    // Ensure caller is authenticated + is a member of this org.
    await ctx.runQuery((apiAny as any).plugins.discord.permissions.requireOrgMember, {
      organizationId: args.organizationId,
    });

    // Fetch the Convex user so we can store user._id (string) in the Discord component.
    const me = (await ctx.runQuery((apiAny as any).core.users.queries.getMe, {})) as any;
    if (!me?._id) {
      throw new Error("User not found");
    }

    const { clientId } = await resolveOrgDiscordCredentials(ctx, args.organizationId);
    const state = crypto.randomUUID();

    const computeAuthRedirectUri = (returnTo: string): string => {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "";
      const rootHost = rootDomain
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .split("/")[0]
        ?.split(":")[0];

      let returnToUrl: URL;
      try {
        returnToUrl = new URL(returnTo);
      } catch {
        throw new Error("Invalid returnTo URL");
      }

      const hostname = returnToUrl.hostname.toLowerCase();
      const port = returnToUrl.port;
      const isLocal =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.endsWith(".localhost") ||
        hostname.endsWith(".127.0.0.1");

      const authHostname = isLocal
        ? `auth.${hostname === "127.0.0.1" || hostname.endsWith(".127.0.0.1") ? "127.0.0.1" : "localhost"}`
        : rootHost
          ? `auth.${rootHost}`
          : "auth.launchthat.app";

      const proto = isLocal ? "http" : "https";
      const origin = `${proto}://${authHostname}${isLocal && port ? `:${port}` : ""}`;
      return `${origin}/auth/discord/link/callback`;
    };

    const redirectUri = computeAuthRedirectUri(args.returnTo);

    await ctx.runMutation(discordOauthMutationsAny.createOauthState, {
      organizationId: args.organizationId,
      kind: "user_link",
      userId: String(me._id),
      state,
      codeVerifier: "user_link_no_pkce",
      returnTo: args.returnTo,
    });

    const scope = encodeURIComponent("identify");
    const url =
      `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
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
  returns: v.null(),
  handler: async (ctx, args) => {
    const consumed = await ctx.runMutation(discordOauthMutationsAny.consumeOauthState, {
      state: args.state,
    });
    if (!consumed || consumed.kind !== "user_link") {
      throw new Error("Invalid or expired Discord link state");
    }

    const organizationId = String(consumed.organizationId);
    const userId = typeof consumed.userId === "string" ? consumed.userId : "";
    if (!userId) {
      throw new Error("Missing userId for Discord link");
    }

    const returnTo = String(consumed.returnTo ?? "");
    const redirectUri = (() => {
      try {
        const returnToUrl = new URL(returnTo);
        const hostname = returnToUrl.hostname.toLowerCase();
        const port = returnToUrl.port;
        const isLocal =
          hostname === "localhost" ||
          hostname === "127.0.0.1" ||
          hostname.endsWith(".localhost") ||
          hostname.endsWith(".127.0.0.1");

        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "";
        const rootHost = rootDomain
          .trim()
          .toLowerCase()
          .replace(/^https?:\/\//, "")
          .split("/")[0]
          ?.split(":")[0];

        const authHostname = isLocal
          ? `auth.${hostname === "127.0.0.1" || hostname.endsWith(".127.0.0.1") ? "127.0.0.1" : "localhost"}`
          : rootHost
            ? `auth.${rootHost}`
            : "auth.launchthat.app";

        const proto = isLocal ? "http" : "https";
        const origin = `${proto}://${authHostname}${isLocal && port ? `:${port}` : ""}`;
        return `${origin}/auth/discord/link/callback`;
      } catch {
        throw new Error("Invalid returnTo URL");
      }
    })();

    const { clientId, clientSecret } = await resolveOrgDiscordCredentials(ctx, organizationId);

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code: args.code,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!tokenRes.ok) {
      const text = await tokenRes.text().catch(() => "token_exchange_failed");
      throw new Error(`Discord token exchange failed: ${tokenRes.status} ${text}`.slice(0, 400));
    }
    const tokenJson: any = await tokenRes.json();
    const accessToken = typeof tokenJson?.access_token === "string" ? tokenJson.access_token : "";
    if (!accessToken) {
      throw new Error("Discord token exchange returned no access token");
    }

    const meRes = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!meRes.ok) {
      const text = await meRes.text().catch(() => "me_failed");
      throw new Error(`Discord /users/@me failed: ${meRes.status} ${text}`.slice(0, 400));
    }
    const meJson: any = await meRes.json();
    const discordUserId = typeof meJson?.id === "string" ? meJson.id : "";
    if (!discordUserId) {
      throw new Error("Discord user id missing from /users/@me");
    }

    // Persist link in the component table.
    await ctx.runMutation(discordUserLinksMutationsAny.linkUser, {
      organizationId,
      userId,
      discordUserId,
    });

    return null;
  },
});

export const completeBotInstall = action({
  args: {
    state: v.string(),
    guildId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const consumed = await ctx.runMutation(
      discordOauthMutationsAny.consumeOauthState,
      {
        state: args.state,
      },
    );
    if (!consumed || consumed.kind !== "org_install") {
      throw new Error("Invalid or expired Discord install state");
    }

    const organizationId = String(consumed.organizationId);
    await ctx.runQuery(
      (apiAny as any).plugins.discord.permissions.requireOrgAdmin,
      {
        organizationId,
      },
    );
    const { botMode, botToken } = await resolveOrgDiscordCredentials(
      ctx,
      organizationId,
    );
    const guildId = args.guildId.trim();
    if (!guildId) {
      throw new Error("Missing guildId");
    }

    // Best-effort fetch guild name for display.
    let guildName: string | undefined;
    try {
      const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
        headers: { Authorization: `Bot ${botToken}` },
      });
      if (res.ok) {
        const json = await res.json();
        guildName = typeof json?.name === "string" ? json.name : undefined;
      }
    } catch {
      // ignore
    }

    await ctx.runMutation(
      discordGuildConnectionMutations.upsertGuildConnection,
      {
        organizationId,
        guildId,
        guildName,
        botModeAtConnect: botMode,
        connectedAt: Date.now(),
      },
    );

    return null;
  },
});

export const disconnectGuild = action({
  args: {
    organizationId: v.string(),
    guildId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runQuery(
      (apiAny as any).plugins.discord.permissions.requireOrgAdmin,
      {
        organizationId: args.organizationId,
      },
    );
    await ctx.runMutation(
      discordGuildConnectionMutations.deleteGuildConnection,
      {
        organizationId: args.organizationId,
        guildId: args.guildId,
      },
    );
    return null;
  },
});

export const listRolesForGuild = action({
  args: { organizationId: v.string(), guildId: v.string() },
  returns: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      managed: v.optional(v.boolean()),
    }),
  ),
  handler: async (ctx, args) => {
    await ctx.runQuery(
      (apiAny as any).plugins.discord.permissions.requireOrgAdmin,
      {
        organizationId: args.organizationId,
      },
    );
    const { botToken } = await resolveOrgDiscordCredentials(
      ctx,
      args.organizationId,
    );
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${args.guildId}/roles`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord roles fetch failed (${res.status}): ${text}`);
    }
    const json = await res.json();
    const roles = Array.isArray(json) ? json : [];
    return roles
      .map((role) => ({
        id: typeof role?.id === "string" ? role.id : "",
        name: typeof role?.name === "string" ? role.name : "",
        managed: typeof role?.managed === "boolean" ? role.managed : undefined,
      }))
      .filter((role) => role.id && role.name);
  },
});

export const listGuildChannels = action({
  args: { organizationId: v.string(), guildId: v.string() },
  returns: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      type: v.number(),
      parentId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    await ctx.runQuery(
      (apiAny as any).plugins.discord.permissions.requireOrgAdmin,
      {
        organizationId: args.organizationId,
      },
    );
    const { botToken } = await resolveOrgDiscordCredentials(
      ctx,
      args.organizationId,
    );
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${args.guildId}/channels`,
      {
        headers: { Authorization: `Bot ${botToken}` },
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord channels fetch failed (${res.status}): ${text}`);
    }
    const json = await res.json();
    const channels = Array.isArray(json) ? json : [];
    return channels
      .map((ch) => ({
        id: typeof ch?.id === "string" ? ch.id : "",
        name: typeof ch?.name === "string" ? ch.name : "",
        type: typeof ch?.type === "number" ? ch.type : -1,
        parentId: typeof ch?.parent_id === "string" ? ch.parent_id : undefined,
      }))
      .filter((ch) => ch.id && ch.name);
  },
});

export const listGuildMembers = action({
  args: {
    organizationId: v.string(),
    guildId: v.string(),
    limit: v.optional(v.number()),
    after: v.optional(v.string()),
  },
  returns: v.object({
    members: v.array(
      v.object({
        userId: v.string(),
        username: v.string(),
        displayName: v.optional(v.string()),
        nick: v.optional(v.string()),
        joinedAt: v.optional(v.string()),
        pending: v.optional(v.boolean()),
        roleIds: v.array(v.string()),
      }),
    ),
    nextAfter: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    await ctx.runQuery((apiAny as any).plugins.discord.permissions.requireOrgAdmin, {
      organizationId: args.organizationId,
    });
    const { botToken } = await resolveOrgDiscordCredentials(ctx, args.organizationId);

    const limit = Math.max(1, Math.min(1000, args.limit ?? 100));
    const url = new URL(`https://discord.com/api/v10/guilds/${args.guildId}/members`);
    url.searchParams.set("limit", String(limit));
    if (typeof args.after === "string" && args.after.trim()) {
      url.searchParams.set("after", args.after.trim());
    }

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord members fetch failed (${res.status}): ${text}`);
    }
    const json = await res.json();
    const arr = Array.isArray(json) ? json : [];

    const members = arr
      .map((m: any) => {
        const user = m?.user ?? {};
        const userId = typeof user?.id === "string" ? user.id : "";
        const username = typeof user?.username === "string" ? user.username : "";
        const globalName =
          typeof user?.global_name === "string" ? user.global_name : undefined;
        const nick = typeof m?.nick === "string" ? m.nick : undefined;
        const joinedAt = typeof m?.joined_at === "string" ? m.joined_at : undefined;
        const pending = typeof m?.pending === "boolean" ? m.pending : undefined;
        const roleIds = Array.isArray(m?.roles)
          ? (m.roles as unknown[]).filter((r) => typeof r === "string") as string[]
          : [];
        const displayName = nick ?? globalName ?? undefined;

        return {
          userId,
          username,
          displayName,
          nick,
          joinedAt,
          pending,
          roleIds,
        };
      })
      .filter((m: any) => m.userId && m.username);

    const nextAfter =
      members.length > 0 ? String(members[members.length - 1].userId) : undefined;

    return { members, nextAfter };
  },
});

export const approveGuildMember = action({
  args: {
    organizationId: v.string(),
    guildId: v.string(),
    userId: v.string(),
    roleId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runQuery((apiAny as any).plugins.discord.permissions.requireOrgAdmin, {
      organizationId: args.organizationId,
    });
    const { botToken } = await resolveOrgDiscordCredentials(ctx, args.organizationId);

    const roleId = args.roleId.trim();
    if (!roleId) throw new Error("Missing approved role id");

    const res = await fetch(
      `https://discord.com/api/v10/guilds/${args.guildId}/members/${args.userId}/roles/${roleId}`,
      {
        method: "PUT",
        headers: { Authorization: `Bot ${botToken}` },
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord approve member failed (${res.status}): ${text}`);
    }
    return null;
  },
});

export const createForumChannel = action({
  args: {
    organizationId: v.string(),
    guildId: v.string(),
    name: v.string(),
    parentId: v.optional(v.string()),
  },
  returns: v.object({
    id: v.string(),
    name: v.string(),
    type: v.number(),
    parentId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    await ctx.runQuery(
      (apiAny as any).plugins.discord.permissions.requireOrgAdmin,
      { organizationId: args.organizationId },
    );
    const { botToken } = await resolveOrgDiscordCredentials(
      ctx,
      args.organizationId,
    );

    const name = args.name.trim();
    if (!name) {
      throw new Error("Forum channel name is required");
    }

    // Discord channel type 15 = GUILD_FORUM
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${args.guildId}/channels`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          type: 15,
          ...(typeof args.parentId === "string" && args.parentId.trim()
            ? { parent_id: args.parentId.trim() }
            : {}),
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Discord create forum channel failed (${res.status}): ${text}`,
      );
    }

    const json = await res.json();
    return {
      id: typeof json?.id === "string" ? json.id : "",
      name: typeof json?.name === "string" ? json.name : name,
      type: typeof json?.type === "number" ? json.type : 15,
      parentId:
        typeof json?.parent_id === "string" ? json.parent_id : undefined,
    };
  },
});

export const createPrivateSupportThread = internalAction({
  args: {
    organizationId: v.string(),
    guildId: v.string(),
    intakeChannelId: v.string(),
    requesterDiscordUserId: v.string(),
    staffRoleId: v.optional(v.string()),
    publicThreadId: v.optional(v.string()),
    supportThreadId: v.string(),
  },
  returns: v.object({
    threadId: v.string(),
  }),
  handler: async (ctx, args) => {
    const { botToken } = await resolveOrgDiscordCredentials(
      ctx,
      args.organizationId,
    );

    const intakeChannelId = args.intakeChannelId.trim();
    if (!intakeChannelId) {
      throw new Error("Missing intakeChannelId");
    }

    const requesterId = args.requesterDiscordUserId.trim();
    if (!requesterId) {
      throw new Error("Missing requesterDiscordUserId");
    }

    // Prefer server nickname -> global username -> fallback to user id.
    let requesterName = requesterId;
    try {
      const memberRes = await fetch(
        `https://discord.com/api/v10/guilds/${encodeURIComponent(args.guildId)}/members/${encodeURIComponent(requesterId)}`,
        { headers: { Authorization: `Bot ${botToken}` } },
      );
      if (memberRes.ok) {
        const json: any = await memberRes.json();
        const nick = typeof json?.nick === "string" ? json.nick.trim() : "";
        const username =
          typeof json?.user?.username === "string" ? json.user.username.trim() : "";
        requesterName = nick || username || requesterName;
      }
    } catch {
      // ignore
    }

    const safeName = requesterName
      .replace(/\s+/g, " ")
      .replace(/[^\p{L}\p{N}\-_ .]/gu, "")
      .trim()
      .slice(0, 60);
    const shortTicketId = args.supportThreadId.slice(-6);
    const baseName = `${shortTicketId} - ${safeName || requesterId}`.slice(
      0,
      100,
    );

    // Discord private thread type = 12 (GUILD_PRIVATE_THREAD)
    const createRes = await fetch(
      `https://discord.com/api/v10/channels/${encodeURIComponent(intakeChannelId)}/threads`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: baseName,
          type: 12,
          auto_archive_duration: 1440,
          invitable: true,
        }),
      },
    );

    if (!createRes.ok) {
      const text = await createRes.text();
      throw new Error(
        `Discord create private thread failed (${createRes.status}): ${text}`,
      );
    }

    const createJson = await createRes.json();
    const threadId = typeof createJson?.id === "string" ? createJson.id : "";
    if (!threadId) {
      throw new Error("Discord create private thread returned no id");
    }

    // Invite the requester into the private thread.
    const addRes = await fetch(
      `https://discord.com/api/v10/channels/${encodeURIComponent(threadId)}/thread-members/${encodeURIComponent(requesterId)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      },
    );
    if (!addRes.ok) {
      const text = await addRes.text();
      throw new Error(
        `Discord add member to private thread failed (${addRes.status}): ${text}`,
      );
    }

    // Best-effort initial message + staff ping.
    try {
      const staffRoleId =
        typeof args.staffRoleId === "string" && args.staffRoleId.trim()
          ? args.staffRoleId.trim()
          : null;
      const introLines: string[] = [];
      introLines.push(
        `Hi <@${requesterId}> — I created this private thread so you can share sensitive details safely.`,
      );
      introLines.push(
        "Please describe the issue and include any order ID / email you used at checkout (if relevant).",
      );
      if (staffRoleId) {
        introLines.push(`Notifying staff: <@&${staffRoleId}>`);
      }

      await fetch(
        `https://discord.com/api/v10/channels/${encodeURIComponent(threadId)}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bot ${botToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: introLines.join("\n").slice(0, 1900),
            allowed_mentions: staffRoleId
              ? { roles: [staffRoleId], users: [requesterId] }
              : { users: [requesterId] },
          }),
        },
      );
    } catch {
      // ignore
    }

    // Mirror minimal audit to discordApiLogs (best-effort).
    try {
      await ctx.runMutation(discordSupportMutations.logDiscordApiCall, {
        organizationId: args.organizationId,
        guildId: args.guildId,
        kind: "support_private_thread_created",
        method: "POST",
        url: `https://discord.com/api/v10/channels/${intakeChannelId}/threads`,
        status: 200,
      });
    } catch {
      // ignore
    }

    return { threadId };
  },
});

export const upsertGuildSettings = action({
  args: {
    organizationId: v.string(),
    guildId: v.string(),
    approvedMemberRoleId: v.optional(v.string()),
    supportAiEnabled: v.boolean(),
    supportForumChannelId: v.optional(v.string()),
    supportPrivateIntakeChannelId: v.optional(v.string()),
    supportStaffRoleId: v.optional(v.string()),
    escalationKeywords: v.optional(v.array(v.string())),
    escalationConfidenceThreshold: v.optional(v.number()),
    threadReplyCooldownMs: v.optional(v.number()),
    supportAiDisabledMessageEnabled: v.optional(v.boolean()),
    supportAiDisabledMessageText: v.optional(v.string()),
    courseUpdatesChannelId: v.optional(v.string()),
    announcementChannelId: v.optional(v.string()),
    announcementEventKeys: v.optional(v.array(v.string())),
    mentorTradesChannelId: v.optional(v.string()),
    memberTradesChannelId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runQuery(
      (apiAny as any).plugins.discord.permissions.requireOrgAdmin,
      {
        organizationId: args.organizationId,
      },
    );
    await ctx.runMutation(discordGuildSettingsMutations.upsertGuildSettings, {
      organizationId: args.organizationId,
      guildId: args.guildId,
      approvedMemberRoleId: args.approvedMemberRoleId,
      supportAiEnabled: args.supportAiEnabled,
      supportForumChannelId: args.supportForumChannelId,
      supportPrivateIntakeChannelId: args.supportPrivateIntakeChannelId,
      supportStaffRoleId: args.supportStaffRoleId,
      escalationKeywords: args.escalationKeywords,
      escalationConfidenceThreshold: args.escalationConfidenceThreshold,
      threadReplyCooldownMs: args.threadReplyCooldownMs,
      supportAiDisabledMessageEnabled: args.supportAiDisabledMessageEnabled,
      supportAiDisabledMessageText: args.supportAiDisabledMessageText,
      courseUpdatesChannelId: args.courseUpdatesChannelId,
      announcementChannelId: args.announcementChannelId,
      announcementEventKeys: args.announcementEventKeys,
      mentorTradesChannelId: args.mentorTradesChannelId,
      memberTradesChannelId: args.memberTradesChannelId,
    });
    return null;
  },
});

export const createRole = action({
  args: {
    organizationId: v.string(),
    guildId: v.string(),
    name: v.string(),
    color: v.optional(v.number()),
    hoist: v.optional(v.boolean()),
    mentionable: v.optional(v.boolean()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await ctx.runQuery(
      (apiAny as any).plugins.discord.permissions.requireOrgAdmin,
      {
        organizationId: args.organizationId,
      },
    );
    const { botToken } = await resolveOrgDiscordCredentials(
      ctx,
      args.organizationId,
    );
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${args.guildId}/roles`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: args.name,
          color: args.color,
          hoist: args.hoist,
          mentionable: args.mentionable,
        }),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord create role failed (${res.status}): ${text}`);
    }
    return await res.json();
  },
});

export const updateRole = action({
  args: {
    organizationId: v.string(),
    guildId: v.string(),
    roleId: v.string(),
    name: v.optional(v.string()),
    color: v.optional(v.number()),
    hoist: v.optional(v.boolean()),
    mentionable: v.optional(v.boolean()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await ctx.runQuery(
      (apiAny as any).plugins.discord.permissions.requireOrgAdmin,
      {
        organizationId: args.organizationId,
      },
    );
    const { botToken } = await resolveOrgDiscordCredentials(
      ctx,
      args.organizationId,
    );
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${args.guildId}/roles/${args.roleId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(typeof args.name === "string" ? { name: args.name } : {}),
          ...(typeof args.color === "number" ? { color: args.color } : {}),
          ...(typeof args.hoist === "boolean" ? { hoist: args.hoist } : {}),
          ...(typeof args.mentionable === "boolean"
            ? { mentionable: args.mentionable }
            : {}),
        }),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord update role failed (${res.status}): ${text}`);
    }
    return await res.json();
  },
});

export const deleteRole = action({
  args: {
    organizationId: v.string(),
    guildId: v.string(),
    roleId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runQuery(
      (apiAny as any).plugins.discord.permissions.requireOrgAdmin,
      {
        organizationId: args.organizationId,
      },
    );
    const { botToken } = await resolveOrgDiscordCredentials(
      ctx,
      args.organizationId,
    );
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${args.guildId}/roles/${args.roleId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord delete role failed (${res.status}): ${text}`);
    }
    return null;
  },
});

export const upsertOrgConfig = action({
  args: {
    organizationId: v.string(),
    enabled: v.boolean(),
    clientId: v.string(),
    clientSecret: v.string(),
    botToken: v.string(),
    guildId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const keyMaterial = requireDiscordSecretsKey();

    await ctx.runMutation(discordOrgConfigMutations.upsertOrgConfig, {
      organizationId: args.organizationId,
      enabled: args.enabled,
      clientId: args.clientId,
      clientSecretEncrypted: encryptSecret(args.clientSecret, keyMaterial),
      botTokenEncrypted: encryptSecret(args.botToken, keyMaterial),
      guildId: args.guildId,
    });
    return null;
  },
});

export const upsertOrgConfigV2 = action({
  args: {
    organizationId: v.string(),
    enabled: v.boolean(),
    botMode: v.union(v.literal("global"), v.literal("custom")),
    customClientId: v.optional(v.string()),
    customClientSecret: v.optional(v.string()),
    customBotToken: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runQuery(
      (apiAny as any).plugins.discord.permissions.requireOrgAdmin,
      {
        organizationId: args.organizationId,
      },
    );

    if (args.botMode === "global") {
      await ctx.runMutation(discordOrgConfigMutations.upsertOrgConfigV2, {
        organizationId: args.organizationId,
        enabled: args.enabled,
        botMode: "global",
        customClientId: undefined,
        customClientSecretEncrypted: undefined,
        customBotTokenEncrypted: undefined,
      });
      return null;
    }

    const clientIdRaw = (args.customClientId ?? "").trim();
    const clientSecretRaw = (args.customClientSecret ?? "").trim();
    const botTokenRaw = (args.customBotToken ?? "").trim();

    // Allow partial updates (e.g. keep existing encrypted secrets if inputs are blank).
    const existing = await ctx.runQuery(
      discordOrgConfigInternalQueries.getOrgConfigSecrets,
      {
        organizationId: args.organizationId,
      },
    );

    const clientId =
      clientIdRaw ||
      (typeof existing?.customClientId === "string"
        ? existing.customClientId
        : "") ||
      (typeof existing?.clientId === "string" ? existing.clientId : "");

    let customClientSecretEncrypted: string | undefined;
    let customBotTokenEncrypted: string | undefined;

    if (clientSecretRaw) {
      const keyMaterial = requireDiscordSecretsKey();
      customClientSecretEncrypted = encryptSecret(clientSecretRaw, keyMaterial);
    } else if (typeof existing?.customClientSecretEncrypted === "string") {
      customClientSecretEncrypted = existing.customClientSecretEncrypted;
    } else if (typeof existing?.clientSecretEncrypted === "string") {
      customClientSecretEncrypted = existing.clientSecretEncrypted;
    }

    if (botTokenRaw) {
      const keyMaterial = requireDiscordSecretsKey();
      customBotTokenEncrypted = encryptSecret(botTokenRaw, keyMaterial);
    } else if (typeof existing?.customBotTokenEncrypted === "string") {
      customBotTokenEncrypted = existing.customBotTokenEncrypted;
    } else if (typeof existing?.botTokenEncrypted === "string") {
      customBotTokenEncrypted = existing.botTokenEncrypted;
    }

    if (!clientId || !customClientSecretEncrypted || !customBotTokenEncrypted) {
      throw new Error(
        "Custom bot mode requires clientId, clientSecret, and botToken (or existing saved secrets)",
      );
    }

    await ctx.runMutation(discordOrgConfigMutations.upsertOrgConfigV2, {
      organizationId: args.organizationId,
      enabled: args.enabled,
      botMode: "custom",
      customClientId: clientId,
      customClientSecretEncrypted,
      customBotTokenEncrypted,
    });
    return null;
  },
});

export const fetchGuildRoles = action({
  args: { botToken: v.string(), guildId: v.string() },
  returns: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      managed: v.optional(v.boolean()),
    }),
  ),
  handler: async (_ctx, args) => {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${args.guildId}/roles`,
      {
        headers: {
          Authorization: `Bot ${args.botToken}`,
        },
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord roles fetch failed (${res.status}): ${text}`);
    }
    const json = await res.json();
    const roles = Array.isArray(json) ? json : [];
    return roles
      .map((role) => ({
        id: typeof role?.id === "string" ? role.id : "",
        name: typeof role?.name === "string" ? role.name : "",
        managed: typeof role?.managed === "boolean" ? role.managed : undefined,
      }))
      .filter((role) => role.id && role.name);
  },
});
