"use node";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access,
  turbo/no-undeclared-env-vars
*/
import crypto from "node:crypto";
import { v } from "convex/values";

import { components, internal } from "../../_generated/api";
import { internalAction } from "../../_generated/server";

const internalAny = internal as any;

const requireDiscordGlobalBotToken = (): string => {
  const botToken = process.env.DISCORD_GLOBAL_BOT_TOKEN;
  if (!botToken) throw new Error("Missing DISCORD_GLOBAL_BOT_TOKEN");
  return botToken;
};

const requireDiscordSecretsKey = (): string => {
  const keyMaterial = process.env.DISCORD_SECRETS_KEY;
  if (!keyMaterial) throw new Error("Missing DISCORD_SECRETS_KEY");
  return keyMaterial;
};

const decryptSecret = (ciphertext: string, keyMaterial: string): string => {
  if (!ciphertext.startsWith("enc_v1:"))
    throw new Error("Expected enc_v1 ciphertext");
  const raw = ciphertext.slice("enc_v1:".length);
  const decoded = Buffer.from(raw, "base64").toString("utf8");
  const parsed = JSON.parse(decoded) as {
    alg: string;
    ivB64: string;
    tagB64: string;
    dataB64: string;
  };
  if (parsed.alg !== "aes-256-gcm")
    throw new Error("Unsupported ciphertext alg");
  const key = crypto.createHash("sha256").update(keyMaterial).digest();
  const iv = Buffer.from(parsed.ivB64, "base64");
  const tag = Buffer.from(parsed.tagB64, "base64");
  const data = Buffer.from(parsed.dataB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString("utf8");
};

const resolveOrgBotToken = async (ctx: any, organizationId: string) => {
  const config = await ctx.runQuery(
    components.launchthat_discord.orgConfigs.internalQueries
      .getOrgConfigSecrets as any,
    { organizationId },
  );
  if (!config?.enabled)
    throw new Error("Discord is not enabled for this organization");
  if (config.botMode === "global") return requireDiscordGlobalBotToken();
  const keyMaterial = requireDiscordSecretsKey();
  const encrypted: string =
    typeof config.customBotTokenEncrypted === "string" &&
    config.customBotTokenEncrypted.trim()
      ? config.customBotTokenEncrypted.trim()
      : typeof config.botTokenEncrypted === "string" &&
          config.botTokenEncrypted.trim()
        ? config.botTokenEncrypted.trim()
        : "";
  if (!encrypted) throw new Error("Discord custom bot token not configured");
  return decryptSecret(encrypted, keyMaterial);
};

const discordJson = async (args: {
  botToken: string;
  method: "POST" | "PATCH";
  url: string;
  body: unknown;
}): Promise<{ ok: boolean; status: number; text: string; json: any }> => {
  const res = await fetch(args.url, {
    method: args.method,
    headers: {
      Authorization: `Bot ${args.botToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(args.body),
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, text, json };
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

const formatTradeMessage = (group: any) => {
  const symbol = String(group.symbol ?? "");
  const status = group.status === "closed" ? "Closed" : "Open";
  const dir = group.direction === "short" ? "Short" : "Long";
  const netQty = typeof group.netQty === "number" ? group.netQty : 0;
  const avg =
    typeof group.avgEntryPrice === "number" ? group.avgEntryPrice : null;
  const pnl = typeof group.realizedPnl === "number" ? group.realizedPnl : null;
  const fees = typeof group.fees === "number" ? group.fees : null;
  const openedAt = typeof group.openedAt === "number" ? group.openedAt : null;
  const closedAt = typeof group.closedAt === "number" ? group.closedAt : null;

  const lines = [
    `**${symbol}** — **${dir}** — **${status}**`,
    `Qty: \`${netQty}\`${avg !== null ? ` • Avg: \`${avg}\`` : ""}`,
    pnl !== null ? `Realized PnL: \`${pnl}\`` : null,
    fees !== null ? `Fees: \`${fees}\`` : null,
    openedAt ? `Opened: <t:${Math.floor(openedAt / 1000)}:f>` : null,
    closedAt ? `Closed: <t:${Math.floor(closedAt / 1000)}:f>` : null,
  ].filter(Boolean);

  return { content: lines.join("\n") };
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

    const settings = await ctx.runQuery(
      components.launchthat_discord.guildSettings.queries
        .getGuildSettings as any,
      { organizationId: String(args.organizationId), guildId },
    );
    const channelId =
      kind === "mentors"
        ? typeof settings?.mentorTradesChannelId === "string"
          ? settings.mentorTradesChannelId.trim()
          : ""
        : typeof settings?.memberTradesChannelId === "string"
          ? settings.memberTradesChannelId.trim()
          : "";
    if (!channelId) return { ok: true, mode: "skipped" as const };

    const botToken = await resolveOrgBotToken(ctx, String(args.organizationId));
    const payload = formatTradeMessage(group);

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
    const messageId =
      typeof res.json?.id === "string" ? String(res.json.id) : "";
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
