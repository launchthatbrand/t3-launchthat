/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-call,
  turbo/no-undeclared-env-vars
*/
"use node";

import crypto from "node:crypto";
import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { api, components, internal } from "../../_generated/api";
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

const discordGuildConnectionsQuery = components.launchthat_discord
  .guildConnections.queries as any;
const discordGuildSettingsQuery = components.launchthat_discord.guildSettings
  .queries as any;
const discordSupportMutations = components.launchthat_discord.support
  .mutations as any;
const discordSupportQueries = components.launchthat_discord.support
  .queries as any;

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

// Generated component typings can lag behind when we add new components.
const componentsAny: any = components;

const buildOrgPublicOrigin = async (ctx: any, organizationId: string) => {
  const fallback = process.env.CLIENT_ORIGIN ?? "http://localhost:3024";
  const orgInfo = await ctx.runQuery(
    (internal as any).core.organizations.membershipsInternalQueries
      .getOrganizationHostInfo,
    { organizationId: organizationId as Id<"organizations"> },
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
  let rootDomain =
    typeof process.env.NEXT_PUBLIC_ROOT_DOMAIN === "string"
      ? process.env.NEXT_PUBLIC_ROOT_DOMAIN.trim()
      : "";
  // Convex env doesn’t automatically mirror Next.js env vars.
  // In local dev, default to `.localhost` if not set so we can build tenant URLs.
  if (!rootDomain && slug) {
    rootDomain = "localhost";
  }
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
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  try {
    return new URL(url, origin).toString();
  } catch {
    return url;
  }
};

export const processGatewayEvent = internalAction({
  args: {
    event: v.any(),
    receivedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const event = args.event as GatewayEvent;
    if (typeof event !== "object") return null;

    const guildId = String((event as any).guildId ?? "");
    if (!guildId) return null;

    const guildConn = await ctx.runQuery(
      discordGuildConnectionsQuery.getGuildConnectionByGuildId,
      { guildId },
    );
    const organizationId = String(guildConn?.organizationId ?? "");
    if (!organizationId) return null;

    const settings = await ctx.runQuery(
      discordGuildSettingsQuery.getGuildSettings,
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
    const escalationKeywords: string[] = Array.isArray(
      settings?.escalationKeywords,
    )
      ? settings.escalationKeywords
          .map((s: any) =>
            typeof s === "string" ? s.trim().toLowerCase() : "",
          )
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
      await ctx.runMutation(
        discordSupportMutations.upsertSupportThreadAndMessage,
        {
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
        },
      );
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

    await ctx.runMutation(
      discordSupportMutations.upsertSupportThreadAndMessage,
      {
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
      },
    );

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

    const disabledMessageEnabled = Boolean(
      settings?.supportAiDisabledMessageEnabled,
    );
    const disabledMessageTextRaw =
      typeof settings?.supportAiDisabledMessageText === "string"
        ? settings.supportAiDisabledMessageText.trim()
        : "";
    const disabledMessageText =
      disabledMessageTextRaw.length > 0
        ? disabledMessageTextRaw
        : "AI Support is currently disabled for this server.";

    // Only do Discord posting work if AI is enabled OR we want to post a disabled message.
    if (!supportAiEnabled && !disabledMessageEnabled) return null;

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
      const retryAfterMs = retryAfter
        ? Math.round(Number(retryAfter) * 1000)
        : undefined;
      const errorText = res.ok
        ? undefined
        : await res.text().catch(() => "request failed");
      await ctx.runMutation(discordSupportMutations.logDiscordApiCall, {
        organizationId,
        guildId,
        kind,
        method: "POST",
        url,
        status: res.status,
        retryAfterMs,
        error: errorText,
      });

      // Best-effort mirror into unified logs.
      try {
        const metadata = Object.fromEntries(
          Object.entries({
            method: "POST",
            url,
            status: res.status,
            retryAfterMs,
            error: errorText,
          }).filter(([, v]) => v !== undefined),
        );

        await ctx.runMutation(
          componentsAny.launchthat_logs.entries.mutations.insertLogEntry,
          {
            organizationId,
            pluginKey: "discord",
            kind: "discord.api",
            level: res.ok ? "info" : "error",
            status: res.ok ? "complete" : "failed",
            message: `Discord API POST (${res.status}) ${kind}`,
            scopeKind: "discord",
            scopeId: `${guildId}:${kind}`,
            metadata: Object.keys(metadata).length ? metadata : undefined,
            createdAt: Date.now(),
          },
        );
      } catch (error) {
        console.error("[discord.gateway.postJson] log mirror failed:", error);
      }
      return res;
    };

    // If AI is disabled, optionally post a short message so users aren’t confused.
    if (!supportAiEnabled) {
      const shouldNotify = await ctx.runMutation(
        internal.plugins.discord.gatewayRateLimits
          .shouldPostDiscordSupportDisabledNotice,
        { guildId, threadId },
      );

      if (shouldNotify) {
        await postJson(
          "support_ai_disabled",
          `https://discord.com/api/v10/channels/${encodeURIComponent(threadId)}/messages`,
          {
            content: disabledMessageText.slice(0, 1900),
            allowed_mentions: { parse: [] },
          },
        );
      }

      // Record as “processed” so StrictMode/dedup doesn’t double-handle the same message.
      const promptHash = crypto
        .createHash("sha256")
        .update(content, "utf8")
        .digest("hex");
      await ctx.runMutation(discordSupportMutations.recordSupportAiRun, {
        organizationId,
        guildId,
        threadId,
        triggerMessageId: messageId,
        promptHash,
        model: "system:disabled",
        confidence: 1,
        escalated: false,
        answer: disabledMessageText,
      });

      return null;
    }

    // Rate limit *before* calling the AI or posting anything.
    try {
      if (!authorId) return null;
      await ctx.runMutation(
        internal.plugins.discord.gatewayRateLimits
          .enforceDiscordSupportRateLimits,
        { organizationId, guildId, threadId, authorId },
      );
    } catch (err: any) {
      const data = err?.data;
      if (data && typeof data === "object" && data.kind === "RateLimited") {
        const retryAt =
          typeof data.retryAt === "number" ? data.retryAt : Date.now() + 30_000;
        const retryAfterMs = Math.max(0, retryAt - Date.now());

        const shouldNotify = await ctx.runMutation(
          internal.plugins.discord.gatewayRateLimits
            .shouldPostDiscordSupportRateLimitNotice,
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
    const created = await ctx.runMutation(
      api.plugins.support.mutations.createThread,
      {
        organizationId,
        clientSessionId: sessionId,
        mode: "agent",
      },
    );
    const supportThreadId = String((created as any)?.threadId ?? "");
    if (!supportThreadId) {
      throw new Error("Failed to create support thread");
    }

    const reply = await ctx.runAction(
      api.plugins.support.agent.generateAgentReply,
      {
        organizationId,
        threadId: supportThreadId,
        prompt: content,
        contactId: undefined,
        contactEmail: undefined,
        contactName: undefined,
        contextTags: ["discord:support"],
      },
    );

    const text = String(reply?.text ?? "").trim();
    if (!text) return null;

    const sources: { title?: string; url?: string }[] = Array.isArray(
      (reply as any)?.sources,
    )
      ? (reply as any).sources
      : [];
    const usedSourceIndexes: number[] = Array.isArray(
      (reply as any)?.usedSourceIndexes,
    )
      ? (reply as any).usedSourceIndexes
          .map((v: any) => (typeof v === "number" ? v : Number(v)))
          .filter((v: number) => Number.isInteger(v))
      : [];

    const confidence = inferConfidence(text);
    const keywordHit = escalationKeywords.some(
      (kw) => kw && content.toLowerCase().includes(kw),
    );
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

    const origin = await buildOrgPublicOrigin(ctx, organizationId);
    // Only render embeds for sources the model explicitly says it used.
    // This prevents low-signal prompts like "Hi" from showing random sources.
    const sourcesForEmbeds =
      usedSourceIndexes.length > 0
        ? usedSourceIndexes
            .map((i) => sources[i])
            .filter((s): s is { title?: string; url?: string } => Boolean(s))
        : [];
    const embeds = sourcesForEmbeds
      .filter(
        (s) =>
          typeof s.title === "string" &&
          s.title.length > 0 &&
          typeof s.url === "string" &&
          s.url.length > 0,
      )
      .slice(0, 5)
      .map((s) => ({
        title: String(s.title).slice(0, 256),
        url: absolutizeUrl(origin, String(s.url)),
      }));

    await postJson(
      "support_reply",
      `https://discord.com/api/v10/channels/${encodeURIComponent(threadId)}/messages`,
      {
        content: text.slice(0, 1900),
        embeds,
        allowed_mentions: { parse: [] },
      },
    );

    // Record AI run.
    const promptHash = crypto
      .createHash("sha256")
      .update(content, "utf8")
      .digest("hex");
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
