"use node";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access,
  turbo/no-undeclared-env-vars
*/
import { v } from "convex/values";
import { resolveOrgBotToken } from "launchthat-plugin-discord/runtime/credentials";
import { discordJson } from "launchthat-plugin-discord/runtime/discordApi";

import { components, internal } from "../../_generated/api";
import { internalAction } from "../../_generated/server";

const internalAny = internal as any;
const discordComponent = components.launchthat_discord as any;
const discordRoutingQueries = discordComponent.routing.queries;
const discordTemplateQueries = discordComponent.templates.queries;

const resolveOrgBotTokenForOrg = async (ctx: any, organizationId: string) => {
  const config = await ctx.runQuery(
    components.launchthat_discord.orgConfigs.internalQueries
      .getOrgConfigSecrets as any,
    { organizationId },
  );
  if (!config?.enabled) {
    throw new Error("Discord is not enabled for this organization");
  }

  return await resolveOrgBotToken({
    botMode: config.botMode === "custom" ? "custom" : "global",
    globalBotToken: process.env.DISCORD_GLOBAL_BOT_TOKEN,
    secretsKey: process.env.DISCORD_SECRETS_KEY,
    customBotTokenEncrypted: config.customBotTokenEncrypted,
    botTokenEncrypted: config.botTokenEncrypted,
  });
};

const logDiscordUpsert = async (
  ctx: any,
  entry: {
    organizationId: string;
    guildId: string;
    mode: "posted" | "edited";
    channelId: string;
    messageId: string;
    status: number;
    error?: string;
  },
) => {
  try {
    await ctx.runMutation(
      components.launchthat_logs.entries.mutations.insertLogEntry as any,
      {
        organizationId: entry.organizationId,
        pluginKey: "traderlaunchpad",
        kind: "traderlaunchpad.discord",
        level: entry.error ? "error" : "info",
        status: entry.error ? "failed" : "complete",
        message: `Trade Discord ${entry.mode} (${entry.status})`,
        scopeKind: "discord",
        scopeId: `${entry.guildId}:${entry.channelId}:${entry.messageId}`,
        metadata: {
          guildId: entry.guildId,
          channelId: entry.channelId,
          messageId: entry.messageId,
          mode: entry.mode,
          status: entry.status,
          error: entry.error,
        },
        createdAt: Date.now(),
      },
    );
  } catch {
    // ignore
  }
};

export const upsertTradeIdeaDiscordMessage = internalAction({
  args: {
    organizationId: v.id("organizations"),
    tradeIdeaGroupId: v.id("tradeIdeaGroups"),
  },
  returns: v.object({
    ok: v.boolean(),
    mode: v.union(
      v.literal("posted"),
      v.literal("edited"),
      v.literal("skipped"),
    ),
    channelId: v.optional(v.string()),
    messageId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const group = await ctx.runQuery(
      components.launchthat_traderlaunchpad.tradeIdeas.queries.getById as any,
      { tradeIdeaGroupId: args.tradeIdeaGroupId },
    );
    if (!group) return { ok: true, mode: "skipped" as const };

    // Per-user public journal toggle: if user is private, do NOT stream to Discord.
    // Default behavior (no profile row) is public.
    const profile = await ctx.runQuery(
      components.launchthat_traderlaunchpad.journal.queries
        .getProfileForUser as any,
      {
        organizationId: String(args.organizationId),
        userId: String(group.userId),
      },
    );
    if (profile && profile.isPublic === false) {
      return { ok: true, mode: "skipped" as const };
    }

    // Route by role.
    const role = await ctx.runQuery(
      internalAny.plugins.traderlaunchpad.roleQueries.getUserOrgRole,
      {
        organizationId: args.organizationId,
        userId: group.userId,
      },
    );
    const kind: "mentors" | "members" =
      role === "owner" || role === "admin" || role === "editor"
        ? "mentors"
        : "members";

    const guildConnections = (await ctx.runQuery(
      components.launchthat_discord.guildConnections.queries
        .listGuildConnectionsForOrg as any,
      { organizationId: String(args.organizationId) },
    )) as { guildId: string }[] | null;
    const guildId =
      Array.isArray(guildConnections) && guildConnections.length > 0
        ? String(guildConnections[0]?.guildId ?? "")
        : "";
    if (!guildId) return { ok: true, mode: "skipped" as const };

    const actorRole = typeof role === "string" ? role : String(role ?? "");
    const channelIds = (await ctx.runQuery(
      discordRoutingQueries.resolveChannelsForEvent,
      {
        organizationId: String(args.organizationId),
        guildId,
        kind: "trade_feed",
        actorRole,
        symbol: String(group.symbol ?? ""),
      },
    )) as string[] | null;
    const resolved = Array.isArray(channelIds)
      ? channelIds.map((c) => (typeof c === "string" ? c.trim() : "")).filter(Boolean)
      : [];
    const channelId = resolved[0] ?? "";
    const extraChannelIds = resolved.slice(1);
    if (!channelId) return { ok: true, mode: "skipped" as const };

    const guildSettings = await ctx.runQuery(
      discordComponent.guildSettings.queries.getGuildSettings as any,
      {
        organizationId: String(args.organizationId),
        guildId,
      },
    );
    const templateId =
      kind === "mentors"
        ? guildSettings?.mentorTradesTemplateId
        : guildSettings?.memberTradesTemplateId;

    const botToken = await resolveOrgBotTokenForOrg(
      ctx,
      String(args.organizationId),
    );
    const payload = await ctx.runQuery(
      discordTemplateQueries.renderTradeIdeaMessage,
      {
        organizationId: String(args.organizationId),
        guildId,
        templateId: templateId ?? undefined,
        symbol: String(group.symbol ?? ""),
        status: group.status === "closed" ? "closed" : "open",
        direction: group.direction === "short" ? "short" : "long",
        netQty: typeof group.netQty === "number" ? group.netQty : 0,
        avgEntryPrice:
          typeof group.avgEntryPrice === "number"
            ? group.avgEntryPrice
            : undefined,
        realizedPnl:
          typeof group.realizedPnl === "number" ? group.realizedPnl : undefined,
        fees: typeof group.fees === "number" ? group.fees : undefined,
        openedAt:
          typeof group.openedAt === "number" ? group.openedAt : undefined,
        closedAt:
          typeof group.closedAt === "number" ? group.closedAt : undefined,
      },
    );

    const existingChannelId =
      typeof group.discordChannelId === "string" ? group.discordChannelId : "";
    const existingMessageId =
      typeof group.discordMessageId === "string" ? group.discordMessageId : "";

    if (
      existingChannelId &&
      existingMessageId &&
      existingChannelId === channelId
    ) {
      const res = await discordJson({
        botToken,
        method: "PATCH",
        url: `https://discord.com/api/v10/channels/${channelId}/messages/${existingMessageId}`,
        body: payload,
      });
      if (!res.ok) {
        await logDiscordUpsert(ctx, {
          organizationId: String(args.organizationId),
          guildId,
          mode: "edited",
          channelId,
          messageId: existingMessageId,
          status: res.status,
          error: res.text,
        });
        throw new Error(
          `Discord PATCH message failed (${res.status}): ${res.text}`,
        );
      }

      await ctx.runMutation(
        components.launchthat_traderlaunchpad.tradeIdeas.mutations
          .markDiscordSynced as any,
        { tradeIdeaGroupId: args.tradeIdeaGroupId },
      );

      await logDiscordUpsert(ctx, {
        organizationId: String(args.organizationId),
        guildId,
        mode: "edited",
        channelId,
        messageId: existingMessageId,
        status: res.status,
      });

      return {
        ok: true,
        mode: "edited" as const,
        channelId,
        messageId: existingMessageId,
      };
    }

    const res = await discordJson({
      botToken,
      method: "POST",
      url: `https://discord.com/api/v10/channels/${channelId}/messages`,
      body: payload,
    });
    if (!res.ok) {
      await logDiscordUpsert(ctx, {
        organizationId: String(args.organizationId),
        guildId,
        mode: "posted",
        channelId,
        messageId: "unknown",
        status: res.status,
        error: res.text,
      });
      throw new Error(
        `Discord POST message failed (${res.status}): ${res.text}`,
      );
    }

    // Best-effort multi-cast: post to any extra channels but do not track edits there.
    for (const extraChannelId of extraChannelIds) {
      try {
        await discordJson({
          botToken,
          method: "POST",
          url: `https://discord.com/api/v10/channels/${extraChannelId}/messages`,
          body: payload,
        });
      } catch {
        // ignore
      }
    }
    const responseJson = res.json as { id?: string } | null;
    const messageId =
      typeof responseJson?.id === "string" ? String(responseJson.id) : "";
    if (!messageId) {
      throw new Error("Discord POST succeeded but response missing message id");
    }

    await ctx.runMutation(
      components.launchthat_traderlaunchpad.tradeIdeas.mutations
        .setDiscordMessageLink as any,
      {
        tradeIdeaGroupId: args.tradeIdeaGroupId,
        discordChannelKind: kind,
        discordChannelId: channelId,
        discordMessageId: messageId,
      },
    );

    await logDiscordUpsert(ctx, {
      organizationId: String(args.organizationId),
      guildId,
      mode: "posted",
      channelId,
      messageId,
      status: res.status,
    });

    return { ok: true, mode: "posted" as const, channelId, messageId };
  },
});
