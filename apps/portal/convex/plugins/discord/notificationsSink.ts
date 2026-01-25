"use node";

import type { Id } from "@convex-config/_generated/dataModel";
import { components, internal } from "@convex-config/_generated/api";
import { v } from "convex/values";
import { resolveOrgBotToken } from "launchthat-plugin-discord/runtime/credentials";
import { discordJsonWithRetryAfter } from "launchthat-plugin-discord/runtime/discordApi";

import type { NotificationSink } from "../../core/notifications/delivery/registry";
import { internalAction } from "../../_generated/server";

const requireDiscordGlobalBotToken = (): string => {
  const botToken = process.env.DISCORD_GLOBAL_BOT_TOKEN;
  if (!botToken) {
    throw new Error("Missing DISCORD_GLOBAL_BOT_TOKEN");
  }
  return botToken;
};

const requireDiscordSecretsKey = (): string => {
  const keyMaterial = process.env.DISCORD_SECRETS_KEY;
  if (!keyMaterial) {
    throw new Error("Missing DISCORD_SECRETS_KEY");
  }
  return keyMaterial;
};

const resolveOrgBotTokenForOrg = async (ctx: any, organizationId: string) => {
  const config = (await ctx.runQuery(
    components.launchthat_discord.orgConfigs.internalQueries
      .getOrgConfigSecrets as any,
    { organizationId },
  )) as {
    enabled: boolean;
    botMode: "global" | "custom";
    customBotTokenEncrypted?: string;
    botTokenEncrypted?: string;
  } | null;
  if (!config?.enabled) {
    throw new Error("Discord is not enabled for this organization");
  }

  return await resolveOrgBotToken({
    botMode: config.botMode === "custom" ? "custom" : "global",
    globalBotToken: requireDiscordGlobalBotToken(),
    secretsKey: requireDiscordSecretsKey(),
    customBotTokenEncrypted: config.customBotTokenEncrypted,
    botTokenEncrypted: config.botTokenEncrypted,
  });
};

const buildOrgPublicOrigin = async (
  ctx: any,
  organizationId: Id<"organizations">,
) => {
  const fallback = process.env.CLIENT_ORIGIN ?? "http://localhost:3024";
  const orgInfo = await ctx.runQuery(
    internal.core.organizations.membershipsInternalQueries
      .getOrganizationHostInfo,
    { organizationId },
  );
  if (!orgInfo) return fallback;

  const customDomain =
    typeof orgInfo.customDomain === "string" &&
    orgInfo.customDomain.trim().length > 0
      ? orgInfo.customDomain.trim()
      : null;
  if (customDomain) {
    const protocol = customDomain.includes("localhost") ? "http" : "https";
    return `${protocol}://${customDomain}`;
  }

  const slug = typeof orgInfo.slug === "string" ? orgInfo.slug.trim() : "";
  const rootDomain =
    typeof process.env.NEXT_PUBLIC_ROOT_DOMAIN === "string"
      ? process.env.NEXT_PUBLIC_ROOT_DOMAIN.trim()
      : "";
  if (!slug || !rootDomain) return fallback;

  const isLocal = rootDomain.includes("localhost");
  const protocol = isLocal ? "http" : "https";
  const port = isLocal ? ":3024" : "";

  if (slug === "portal-root" && isLocal) {
    return `${protocol}://localhost${port}`;
  }

  return `${protocol}://${slug}.${rootDomain}${port}`;
};

const absolutizeUrl = (origin: string, url: string) => {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (!url.startsWith("/")) return `${origin}/${url}`;
  return `${origin}${url}`;
};

const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const postDiscordJson = async (
  ctx: any,
  args: {
    botToken: string;
    organizationId: string;
    guildId: string;
    kind: string;
    url: string;
    payload: any;
  },
) => {
  const res = await discordJsonWithRetryAfter({
    botToken: args.botToken,
    method: "POST",
    url: args.url,
    body: args.payload,
  });
  const retryAfterMs = res.retryAfterMs;
  const errorText = res.ok ? undefined : res.text || "request failed";
  await ctx.runMutation(
    components.launchthat_discord.support.mutations.logDiscordApiCall as any,
    {
      organizationId: args.organizationId,
      guildId: args.guildId,
      kind: args.kind,
      method: "POST",
      url: args.url,
      status: res.status,
      retryAfterMs,
      error: errorText,
    },
  );

  // Best-effort mirror into unified logs.
  try {
    const metadata = Object.fromEntries(
      Object.entries({
        method: "POST",
        url: args.url,
        status: res.status,
        retryAfterMs,
        error: errorText,
      }).filter(([, v]) => v !== undefined),
    );

    await ctx.runMutation(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      components.launchthat_logs.entries.mutations.insertLogEntry as any,
      {
        organizationId: args.organizationId,
        pluginKey: "discord",
        kind: "discord.api",
        level: res.ok ? "info" : "error",
        status: res.ok ? "complete" : "failed",
        message: `Discord API POST (${res.status}) ${args.kind}`,
        scopeKind: "discord",
        scopeId: `${args.guildId}:${args.kind}`,
        metadata: Object.keys(metadata).length ? metadata : undefined,
        createdAt: Date.now(),
      },
    );
  } catch (error) {
    console.error(
      "[discord.notificationsSink.postDiscordJson] log mirror failed:",
      error,
    );
  }
};

export const discordAnnouncementsSink: NotificationSink = {
  id: "discord.announcements",
  handle: async (ctx, payload) => {
    const guildConnections = (await ctx.runQuery(
      components.launchthat_discord.guildConnections.queries
        .listGuildConnectionsForOrg as any,
      { organizationId: String(payload.orgId) },
    )) as Array<{ guildId: string }> | null;

    const guildIds = Array.isArray(guildConnections)
      ? guildConnections
          .map((g) => (typeof g?.guildId === "string" ? g.guildId : ""))
          .filter(Boolean)
      : [];
    if (guildIds.length === 0) return;

    const botToken = await resolveOrgBotTokenForOrg(ctx, String(payload.orgId));

    const origin = await buildOrgPublicOrigin(ctx, payload.orgId as any);
    const actionUrl =
      payload.actionUrl && payload.actionUrl.trim().length > 0
        ? absolutizeUrl(origin, payload.actionUrl)
        : "";

    // Optional rich media (e.g. org logo for test notifications).
    // Keep this loose so payload versions can evolve without breaking older clients.
    const rawImageUrl = normalizeOptionalString((payload as any).imageUrl);
    const imageUrl = rawImageUrl ? absolutizeUrl(origin, rawImageUrl) : null;

    for (const guildId of guildIds) {
      const settings = (await ctx.runQuery(
        components.launchthat_discord.guildSettings.queries
          .getGuildSettings as any,
        { organizationId: String(payload.orgId), guildId },
      )) as {
        announcementChannelId?: string;
        announcementEventKeys?: string[];
        courseUpdatesChannelId?: string;
      } | null;

      if (!settings) continue;

      const channelId =
        (typeof settings.announcementChannelId === "string" &&
        settings.announcementChannelId.trim()
          ? settings.announcementChannelId.trim()
          : null) ??
        (typeof settings.courseUpdatesChannelId === "string" &&
        settings.courseUpdatesChannelId.trim()
          ? settings.courseUpdatesChannelId.trim()
          : null);
      if (!channelId) continue;

      const allowlist = Array.isArray(settings.announcementEventKeys)
        ? settings.announcementEventKeys.filter(
            (k) => typeof k === "string" && k,
          )
        : null;

      const enabled =
        allowlist && allowlist.length > 0
          ? allowlist.includes(payload.eventKey)
          : payload.eventKey === "lms.course.stepAdded";
      if (!enabled) continue;

      const contentLines: string[] = [];
      contentLines.push(`**${payload.title}**`);
      const description =
        payload.content && payload.content.trim() ? payload.content.trim() : "";
      if (description) contentLines.push(description);
      if (actionUrl) {
        contentLines.push(actionUrl);
      }
      const content = contentLines.join("\n").slice(0, 1900);

      const embeds = imageUrl
        ? [
            {
              title: payload.title.slice(0, 256),
              description: description ? description.slice(0, 4096) : undefined,
              url: actionUrl || undefined,
              image: { url: imageUrl },
            },
          ]
        : undefined;

      await postDiscordJson(ctx, {
        botToken,
        organizationId: String(payload.orgId),
        guildId,
        kind: "announcement",
        url: `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`,
        payload: {
          content,
          ...(embeds ? { embeds } : {}),
          allowed_mentions: { parse: [] },
        },
      });
    }
  },
};

export const sendAnnouncementsForEvent = internalAction({
  args: {
    payload: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await discordAnnouncementsSink.handle(ctx as any, args.payload as any);
    return null;
  },
});

export const sendManualAnnouncement = internalAction({
  args: {
    orgId: v.id("organizations"),
    title: v.string(),
    content: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
  },
  returns: v.object({
    postedGuildIds: v.array(v.string()),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const errors: string[] = [];
    const postedGuildIds: string[] = [];

    const guildConnections = (await ctx.runQuery(
      components.launchthat_discord.guildConnections.queries
        .listGuildConnectionsForOrg as any,
      { organizationId: String(args.orgId) },
    )) as Array<{ guildId: string }> | null;

    const guildIds = Array.isArray(guildConnections)
      ? guildConnections
          .map((g) => (typeof g?.guildId === "string" ? g.guildId : ""))
          .filter(Boolean)
      : [];
    if (guildIds.length === 0) {
      return { postedGuildIds, errors };
    }

    const botToken = await resolveOrgBotTokenForOrg(ctx, String(args.orgId));
    const origin = await buildOrgPublicOrigin(ctx, args.orgId as any);
    const actionUrl =
      typeof args.actionUrl === "string" && args.actionUrl.trim().length > 0
        ? absolutizeUrl(origin, args.actionUrl.trim())
        : "";

    for (const guildId of guildIds) {
      try {
        const settings = (await ctx.runQuery(
          components.launchthat_discord.guildSettings.queries
            .getGuildSettings as any,
          { organizationId: String(args.orgId), guildId },
        )) as {
          announcementChannelId?: string;
          courseUpdatesChannelId?: string;
        } | null;

        const channelId =
          (typeof settings?.announcementChannelId === "string" &&
          settings.announcementChannelId.trim()
            ? settings.announcementChannelId.trim()
            : null) ??
          (typeof settings?.courseUpdatesChannelId === "string" &&
          settings.courseUpdatesChannelId.trim()
            ? settings.courseUpdatesChannelId.trim()
            : null);
        if (!channelId) continue;

        const contentLines: string[] = [];
        contentLines.push(`**${args.title}**`);
        if (args.content && args.content.trim()) {
          contentLines.push(args.content.trim());
        }
        if (actionUrl) contentLines.push(actionUrl);

        const content = contentLines.join("\n").slice(0, 1900);
        await postDiscordJson(ctx, {
          botToken,
          organizationId: String(args.orgId),
          guildId,
          kind: "manualAnnouncement",
          url: `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`,
          payload: { content, allowed_mentions: { parse: [] } },
        });
        postedGuildIds.push(guildId);
      } catch (err) {
        errors.push(
          `guild=${guildId}: ${err instanceof Error ? err.message : "failed"}`,
        );
      }
    }

    return { postedGuildIds, errors };
  },
});
