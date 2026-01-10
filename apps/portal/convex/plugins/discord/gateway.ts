"use node";

import crypto from "node:crypto";
import { v } from "convex/values";
import { components, api, internal } from "../../_generated/api";
import { internalAction } from "../../_generated/server";

type GatewayEvent =
  | {
      type: "thread_create";
      guildId: string;
      forumChannelId?: string | null;
      threadId: string;
      threadName?: string | null;
      createdByDiscordUserId?: string | null;
      createdAt: number;
    }
  | {
      type: "message_create";
      guildId: string;
      threadId: string;
      forumChannelId?: string | null;
      messageId: string;
      authorId: string;
      authorIsBot: boolean;
      content: string;
      createdAt: number;
    };

const discordGuildConnectionsQuery = components.launchthat_discord.guildConnections
  .queries as any;
const discordGuildSettingsQuery = components.launchthat_discord.guildSettings
  .queries as any;
const discordSupportMutations = components.launchthat_discord.support.mutations as any;
const discordSupportQueries = components.launchthat_discord.support.queries as any;

const inferConfidence = (answer: string): number => {
  const text = answer.toLowerCase();
  const weakSignals = [
    "i'm not sure",
    "i am not sure",
    "i don't know",
    "i do not know",
    "can't help",
    "cannot help",
    "not configured",
    "please contact an administrator",
  ];
  return weakSignals.some((s) => text.includes(s)) ? 0.4 : 0.85;
};

export const processGatewayEvent = internalAction({
  args: {
    event: v.any(),
    receivedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const event = args.event as GatewayEvent;
    if (!event || typeof event !== "object") return null;

    if (event.type !== "thread_create" && event.type !== "message_create") {
      return null;
    }

    const guildId = String((event as any).guildId ?? "");
    if (!guildId) return null;

    const guildConn = await ctx.runQuery(
      (discordGuildConnectionsQuery as any).getGuildConnectionByGuildId,
      { guildId },
    );
    const organizationId = String(guildConn?.organizationId ?? "");
    if (!organizationId) return null;

    const settings = await ctx.runQuery(
      (discordGuildSettingsQuery as any).getGuildSettings,
      { organizationId, guildId },
    );

    const supportAiEnabled = Boolean(settings?.supportAiEnabled);
    const forumChannelId =
      typeof settings?.supportForumChannelId === "string"
        ? settings.supportForumChannelId
        : null;
    const staffRoleId =
      typeof settings?.supportStaffRoleId === "string"
        ? settings.supportStaffRoleId
        : null;
    const escalationKeywords: string[] = Array.isArray(settings?.escalationKeywords)
      ? settings.escalationKeywords
          .map((s: any) => (typeof s === "string" ? s.trim().toLowerCase() : ""))
          .filter((s: string) => s.length > 0)
          .slice(0, 50)
      : [];
    const confidenceThreshold: number =
      typeof settings?.escalationConfidenceThreshold === "number"
        ? settings.escalationConfidenceThreshold
        : 0.65;

    // Always upsert thread/message for observability, but only respond if AI is enabled and channel matches.
    if (event.type === "thread_create") {
      const threadId = String((event as any).threadId ?? "");
      if (!threadId) return null;
      await ctx.runMutation(discordSupportMutations.upsertSupportThreadAndMessage, {
        organizationId,
        guildId,
        threadId,
        forumChannelId: (event as any).forumChannelId
          ? String((event as any).forumChannelId)
          : undefined,
        threadName:
          typeof (event as any).threadName === "string"
            ? (event as any).threadName
            : undefined,
        createdByDiscordUserId:
          typeof (event as any).createdByDiscordUserId === "string"
            ? (event as any).createdByDiscordUserId
            : undefined,
      });
      return null;
    }

    // message_create
    const threadId = String((event as any).threadId ?? "");
    const messageId = String((event as any).messageId ?? "");
    const content = String((event as any).content ?? "");
    const authorIsBot = Boolean((event as any).authorIsBot);
    const authorId = String((event as any).authorId ?? "");
    if (!threadId || !messageId) return null;

    // Idempotency: if we already responded to this trigger message, skip.
    const alreadyProcessed = await ctx.runQuery(
      discordSupportQueries.hasAiRunForTriggerMessage,
      { guildId, triggerMessageId: messageId },
    );
    if (alreadyProcessed) return null;

    await ctx.runMutation(discordSupportMutations.upsertSupportThreadAndMessage, {
      organizationId,
      guildId,
      threadId,
      messageId,
      authorDiscordUserId: String((event as any).authorId ?? ""),
      authorIsBot,
      content,
      messageCreatedAt: Number((event as any).createdAt ?? args.receivedAt),
      forumChannelId:
        typeof (event as any).forumChannelId === "string"
          ? String((event as any).forumChannelId)
          : undefined,
    });

    // Only respond to non-bot messages in configured support forum threads.
    if (!supportAiEnabled) return null;
    if (!forumChannelId) return null;
    if (authorIsBot) return null;

    // For forum support, the parent forum channel id should be the configured one.
    const incomingForum =
      typeof (event as any).forumChannelId === "string"
        ? String((event as any).forumChannelId)
        : null;
    if (incomingForum !== forumChannelId) {
      return null;
    }

    // Post response to Discord using the global bot token (BYOB support worker not enabled in this phase).
    // We define this early so we can also post a backoff notice when rate-limited.
    const botToken = process.env.DISCORD_GLOBAL_BOT_TOKEN;
    if (!botToken) {
      throw new Error("Missing DISCORD_GLOBAL_BOT_TOKEN env");
    }

    const postJson = async (kind: string, url: string, payload: any) => {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bot ${botToken}`,
        },
        body: JSON.stringify(payload),
      });
      const retryAfter = res.headers.get("retry-after");
      const retryAfterMs = retryAfter ? Math.round(Number(retryAfter) * 1000) : undefined;
      await ctx.runMutation(discordSupportMutations.logDiscordApiCall, {
        organizationId,
        guildId,
        kind,
        method: "POST",
        url,
        status: res.status,
        retryAfterMs,
        error: res.ok ? undefined : await res.text().catch(() => "request failed"),
      });
      return res;
    };

    // Rate limit *before* calling the AI or posting anything.
    try {
      if (!authorId) return null;
      await ctx.runMutation(
        internal.plugins.discord.gatewayRateLimits.enforceDiscordSupportRateLimits,
        { guildId, threadId, authorId },
      );
    } catch (err: any) {
      const data = err?.data;
      if (data && typeof data === "object" && data.kind === "RateLimited") {
        const retryAt =
          typeof data.retryAt === "number" ? data.retryAt : Date.now() + 30_000;
        const retryAfterMs = Math.max(0, retryAt - Date.now());

        const shouldNotify = await ctx.runMutation(
          internal.plugins.discord.gatewayRateLimits.shouldPostDiscordSupportRateLimitNotice,
          { guildId, threadId },
        );

        if (shouldNotify) {
          const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));
          await postJson(
            "support_rate_limited",
            `https://discord.com/api/v10/channels/${encodeURIComponent(threadId)}/messages`,
            {
              content: `Please slow down — try again in ${retryAfterSec}s.`,
              allowed_mentions: { parse: [] },
            },
          );
        }

        return null;
      }
      throw err;
    }

    // Generate reply via existing support agent.
    // IMPORTANT: Support message storage expects a real Convex Id<"threads">.
    // We create/reuse a support thread by using a stable clientSessionId derived from the Discord thread id.
    const sessionId = `discord:${guildId}:${threadId}`;
    const created = await ctx.runMutation(api.plugins.support.mutations.createThread, {
      organizationId,
      clientSessionId: sessionId,
      mode: "agent",
    });
    const supportThreadId = String((created as any)?.threadId ?? "");
    if (!supportThreadId) {
      throw new Error("Failed to create support thread");
    }

    const reply = await ctx.runAction(api.plugins.support.agent.generateAgentReply, {
      organizationId,
      threadId: supportThreadId,
      prompt: content,
      contactId: undefined,
      contactEmail: undefined,
      contactName: undefined,
      contextTags: ["discord:support"],
    });

    const text = String(reply?.text ?? "").trim();
    if (!text) return null;

    const confidence = inferConfidence(text);
    const keywordHit = escalationKeywords.some((kw) => kw && content.toLowerCase().includes(kw));
    const shouldEscalate = keywordHit || confidence < confidenceThreshold;

    if (shouldEscalate && staffRoleId) {
      await postJson(
        "support_escalate",
        `https://discord.com/api/v10/channels/${encodeURIComponent(threadId)}/messages`,
        {
          content: `<@&${staffRoleId}> Support request needs attention.`,
          allowed_mentions: { roles: [staffRoleId] },
        },
      );
    }

    await postJson(
      "support_reply",
      `https://discord.com/api/v10/channels/${encodeURIComponent(threadId)}/messages`,
      { content: text.slice(0, 1900) },
    );

    // Record AI run.
    const promptHash = crypto.createHash("sha256").update(content, "utf8").digest("hex");
    await ctx.runMutation(discordSupportMutations.recordSupportAiRun, {
      organizationId,
      guildId,
      threadId,
      triggerMessageId: messageId,
      promptHash,
      model: undefined,
      confidence,
      escalated: shouldEscalate,
      answer: text,
    });

    return null;
  },
});


