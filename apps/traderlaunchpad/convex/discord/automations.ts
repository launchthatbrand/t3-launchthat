"use node";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-argument
*/

import { v } from "convex/values";

import { components } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { discordJson, discordMultipart } from "launchthat-plugin-discord/runtime/discordApi";
import { resolveDiscordCredentials } from "launchthat-plugin-discord/runtime/credentials";
import { buildSnapshotPreview } from "../platform/test/helpers";
import { env } from "../../src/env";

// Avoid typed imports in Convex Node actions (can trigger deep instantiation).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const apiUntyped: any = require("../_generated/api").api;

const discordAutomationsQueries = components.launchthat_discord.automations.queries as any;
const discordAutomationsMutations = components.launchthat_discord.automations.mutations as any;
const discordTemplatesQueries = components.launchthat_discord.templates.queries as any;
const discordOrgConfigInternalQueries =
  components.launchthat_discord.orgConfigs.internalQueries as any;

const applyTemplate = (template: string, values: Record<string, string | undefined>) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? "");

const parseTemplateJson = (templateJson: unknown): {
  hasSnapshot: boolean;
  lookbackDays: number;
  showSentimentBadge: boolean;
  themeMode: "dark" | "light" | "custom";
  bgColor?: string;
  gridOpacity?: number;
  gridColor?: string;
  candleSpacingPct?: number;
  candleUpColor?: string;
  candleDownColor?: string;
  tradeIndicatorShape?: "circle" | "triangle";
} => {
  if (typeof templateJson !== "string" || !templateJson.trim()) {
    return { hasSnapshot: false, lookbackDays: 3, showSentimentBadge: true, themeMode: "dark" };
  }
  try {
    const parsed = JSON.parse(templateJson) as any;
    const attachments = Array.isArray(parsed?.attachments) ? parsed.attachments : [];
    const snap = attachments.find((a: any) => a?.type === "snapshot_png") ?? null;
    if (!snap) return { hasSnapshot: false, lookbackDays: 3, showSentimentBadge: true, themeMode: "dark" };
    const lookbackDaysRaw = Number(snap?.params?.lookbackDays ?? 3);
    const lookbackDays = Math.max(1, Math.min(30, Math.floor(lookbackDaysRaw)));
    const showSentimentBadge =
      typeof snap?.params?.showSentimentBadge === "boolean"
        ? Boolean(snap.params.showSentimentBadge)
        : true;
    const themeModeRaw =
      typeof snap?.params?.themeMode === "string"
        ? String(snap.params.themeMode).trim().toLowerCase()
        : "";
    const themeMode =
      themeModeRaw === "light"
        ? "light"
        : themeModeRaw === "custom"
          ? "custom"
          : "dark";
    const bgColor =
      typeof snap?.params?.bgColor === "string" ? String(snap.params.bgColor) : undefined;
    const gridOpacityRaw = Number(snap?.params?.gridOpacity ?? NaN);
    const gridOpacity =
      Number.isFinite(gridOpacityRaw) ? Math.max(0, Math.min(0.25, gridOpacityRaw)) : undefined;
    const gridColor =
      typeof snap?.params?.gridColor === "string" ? String(snap.params.gridColor) : undefined;
    const candleSpacingRaw = Number(snap?.params?.candleSpacingPct ?? NaN);
    const candleSpacingPct =
      Number.isFinite(candleSpacingRaw)
        ? Math.max(0, Math.min(80, Math.round(candleSpacingRaw)))
        : undefined;
    const candleUpColor =
      typeof snap?.params?.candleUpColor === "string"
        ? String(snap.params.candleUpColor)
        : undefined;
    const candleDownColor =
      typeof snap?.params?.candleDownColor === "string"
        ? String(snap.params.candleDownColor)
        : undefined;
    const tradeIndicatorShapeRaw =
      typeof snap?.params?.tradeIndicatorShape === "string"
        ? String(snap.params.tradeIndicatorShape).trim().toLowerCase()
        : "";
    const tradeIndicatorShape =
      tradeIndicatorShapeRaw === "triangle" ? "triangle" : "circle";
    return {
      hasSnapshot: true,
      lookbackDays,
      showSentimentBadge,
      themeMode,
      bgColor,
      gridOpacity,
      gridColor,
      candleSpacingPct,
      candleUpColor,
      candleDownColor,
      tradeIndicatorShape,
    };
  } catch {
    return { hasSnapshot: false, lookbackDays: 3, showSentimentBadge: true, themeMode: "dark" };
  }
};

const safeJsonParse = (raw: unknown): unknown => {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const computeConsensusLabel = (clusters: any[]): "BUY" | "SELL" | "MIXED" => {
  let longCount = 0;
  let shortCount = 0;
  for (const c of Array.isArray(clusters) ? clusters : []) {
    const direction = c?.direction === "short" || c?.direction === "mixed" ? c.direction : "long";
    const n = typeof c?.count === "number" && c.count > 0 ? c.count : 1;
    if (direction === "short") shortCount += n;
    else longCount += n;
  }
  if (longCount === shortCount) return "MIXED";
  return longCount > shortCount ? "BUY" : "SELL";
};

const isCryptoSymbol = (symbolRaw: string): boolean => {
  const symbol = symbolRaw.trim().toUpperCase();
  if (!symbol) return false;
  const majors = [
    "BTC",
    "ETH",
    "SOL",
    "BNB",
    "XRP",
    "ADA",
    "DOGE",
    "LTC",
    "LINK",
    "AVAX",
    "MATIC",
    "UNI",
    "DOT",
    "ATOM",
    "SHIB",
  ];
  return majors.some((p) => symbol.startsWith(p));
};

const isMarketOpenUtc = (symbol: string, nowMs: number): boolean => {
  // Crypto is always open; forex/most others closed on weekends.
  if (isCryptoSymbol(symbol)) return true;
  const d = new Date(nowMs);
  const day = d.getUTCDay(); // 0=Sun .. 6=Sat
  if (day === 0 || day === 6) return false;
  return true;
};

const buildContextForProvider = async (ctx: any, args: {
  organizationId: string;
  providerKey: string;
  paramsJson?: string | null;
  now: number;
}): Promise<{ values: Record<string, string | undefined>; includeSnapshot: boolean; snapshotSymbol: string }> => {
  const providerKey = String(args.providerKey).trim();
  const paramsRaw = safeJsonParse(args.paramsJson);
  const params =
    typeof paramsRaw === "object" && paramsRaw !== null ? (paramsRaw as any) : {};

  if (providerKey === "traderlaunchpad.hourlyTradeSummary") {
    const symbol = typeof params?.symbol === "string" ? params.symbol.trim().toUpperCase() : "BTCUSD";
    const includeSnapshot = Boolean(params?.includeSnapshot);

    const res = await ctx.runQuery(apiUntyped.traderlaunchpad.queries.getOrgOpenPositionsForSymbol, {
      organizationId: args.organizationId,
      symbol,
      maxUsers: 500,
    });

    const clusters = Array.isArray(res?.clusters) ? res.clusters : [];
    const openPositions = typeof res?.openPositions === "number" ? res.openPositions : 0;
    const usersAllowed = typeof res?.usersAllowed === "number" ? res.usersAllowed : 0;
    const sentiment = computeConsensusLabel(clusters);

    const values: Record<string, string | undefined> = {
      symbol,
      openPositions: String(openPositions),
      usersAllowed: String(usersAllowed),
      sentiment,
      now: `<t:${Math.floor(args.now / 1000)}:f>`,
    };
    return { values, includeSnapshot, snapshotSymbol: symbol };
  }

  return { values: { now: `<t:${Math.floor(args.now / 1000)}:f>` }, includeSnapshot: false, snapshotSymbol: "BTCUSD" };
};

const computeNextRunAt = (args: {
  now: number;
  trigger: { type: "schedule" | "event"; config: any };
}): number | null => {
  if (args.trigger.type !== "schedule") return null;
  const cfg = args.trigger.config ?? {};
  const kind = typeof cfg.kind === "string" ? cfg.kind : "interval";
  if (kind !== "interval") return null;
  const everyMinutesRaw = typeof cfg.everyMinutes === "number" ? cfg.everyMinutes : 60;
  const everyMinutes = Math.max(1, Math.min(7 * 24 * 60, Math.floor(everyMinutesRaw)));
  const stepMs = everyMinutes * 60_000;
  const next = Math.floor((args.now + stepMs) / stepMs) * stepMs;
  return Number.isFinite(next) ? next : null;
};

const resolveBotTokenForOrg = async (ctx: any, organizationId: string): Promise<string> => {
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

  if (!orgSecrets?.enabled) throw new Error("Discord is not enabled for this organization");

  const secretsKey = String(env.DISCORD_SECRETS_KEY ?? "").trim();
  const globalClientId = String(env.DISCORD_GLOBAL_CLIENT_ID ?? "").trim();
  const globalClientSecret = "";
  const globalBotToken = String(env.DISCORD_GLOBAL_BOT_TOKEN ?? "").trim();

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
  return botToken;
};

export const runDueDiscordAutomations = internalAction({
  args: {
    organizationId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    ok: v.boolean(),
    processed: v.number(),
    sent: v.number(),
    failed: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = Math.max(1, Math.min(200, Math.floor(args.limit ?? 50)));

    const due = (await ctx.runQuery(discordAutomationsQueries.listDueAutomations, {
      organizationId:
        typeof args.organizationId === "string" && args.organizationId.trim()
          ? args.organizationId.trim()
          : undefined,
      now,
      limit,
    })) as any[];

    let processed = 0;
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of Array.isArray(due) ? due : []) {
      processed += 1;
      try {
        const automationId = String(row?.id ?? "");
        const organizationId = String(row?.organizationId ?? "").trim();
        const guildId = String(row?.guildId ?? "").trim();
        const trigger = row?.trigger ?? {};
        const action = row?.action ?? {};
        const conditions = row?.conditions ?? {};
        if (!automationId || !organizationId || !guildId) continue;

        const botToken = await resolveBotTokenForOrg(ctx, organizationId);

        const cfg = action?.config ?? {};
        const channelId = String(cfg.channelId ?? "").trim();
        const templateId = String(cfg.templateId ?? "").trim();
        const providerKey = String(cfg.contextProviderKey ?? "").trim();
        const providerParams = typeof cfg.contextProviderParams === "string" ? cfg.contextProviderParams : null;
        if (!channelId || !templateId) continue;

        const templateRow = await ctx.runQuery(discordTemplatesQueries.getTemplateById, {
          organizationId,
          templateId: templateId as any,
        });
        const template = typeof templateRow?.template === "string" ? templateRow.template : "";
        const templateJson =
          typeof (templateRow as any)?.templateJson === "string"
            ? String((templateRow as any).templateJson)
            : "";
        const snapshotSettings = parseTemplateJson(templateJson);
        const { values, includeSnapshot, snapshotSymbol } = providerKey
          ? await buildContextForProvider(ctx, {
              organizationId,
              providerKey,
              paramsJson: providerParams,
              now,
            })
          : { values: { now: `<t:${Math.floor(now / 1000)}:f>` }, includeSnapshot: false, snapshotSymbol: "BTCUSD" };

        const content = applyTemplate(template, values);

        // Conditions (schedule-focused for now)
        if (conditions?.marketOpen) {
          const symbolForMarket =
            typeof values.symbol === "string" && values.symbol.trim()
              ? values.symbol.trim().toUpperCase()
              : snapshotSymbol;
          if (!isMarketOpenUtc(symbolForMarket, now)) {
            const nextRunAt = computeNextRunAt({ now, trigger }) ?? undefined;
            await ctx.runMutation(discordAutomationsMutations.markAutomationRun, {
              organizationId,
              automationId: automationId as any,
              lastRunAt: now,
              nextRunAt,
            });
            continue;
          }
        }

        const actionSnapshotSymbol =
          typeof cfg.snapshotSymbol === "string" && cfg.snapshotSymbol.trim()
            ? cfg.snapshotSymbol.trim().toUpperCase()
            : typeof values.symbol === "string" && values.symbol.trim()
              ? values.symbol.trim().toUpperCase()
              : snapshotSymbol;

        if (snapshotSettings.hasSnapshot) {
          const preview = await buildSnapshotPreview(ctx, {
            organizationId,
            symbol: actionSnapshotSymbol,
            lookbackDays: snapshotSettings.lookbackDays,
            showSentimentBadge: snapshotSettings.showSentimentBadge,
            themeMode: snapshotSettings.themeMode,
            bgColor: snapshotSettings.bgColor,
            gridOpacity: snapshotSettings.gridOpacity,
            gridColor: snapshotSettings.gridColor,
            candleSpacingPct: snapshotSettings.candleSpacingPct,
            candleUpColor: snapshotSettings.candleUpColor,
            candleDownColor: snapshotSettings.candleDownColor,
            tradeIndicatorShape: snapshotSettings.tradeIndicatorShape,
            maxUsers: 200,
          });
          const base64 = typeof (preview as any)?.base64 === "string" ? (preview as any).base64 : "";
          const pngBytes = base64 ? new Uint8Array(Buffer.from(base64, "base64")) : null;
          if (!pngBytes) {
            throw new Error("Snapshot generation failed (missing base64).");
          }

          const payloadJson = {
            content: "",
            embeds: [
              {
                title: `Hourly summary: ${actionSnapshotSymbol}`,
                description: content,
                image: { url: "attachment://snapshot.png" },
              },
            ],
          };

          const res = await discordMultipart({
            botToken,
            method: "POST",
            url: `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`,
            payloadJson,
            file: { name: "snapshot.png", bytes: pngBytes, contentType: "image/png" },
          });
          if (!res.ok) {
            throw new Error(`Discord multipart send failed (${res.status}): ${res.text.slice(0, 200)}`);
          }
        } else if (includeSnapshot) {
          // Backward-compatible behavior: legacy providers can still opt into snapshot.
          const preview = await buildSnapshotPreview(ctx, {
            organizationId,
            symbol: snapshotSymbol,
            lookbackDays: 3,
            maxUsers: 200,
          });
          const base64 = typeof (preview as any)?.base64 === "string" ? (preview as any).base64 : "";
          const pngBytes = base64 ? new Uint8Array(Buffer.from(base64, "base64")) : null;
          if (!pngBytes) {
            throw new Error("Snapshot generation failed (missing base64).");
          }

          const payloadJson = {
            content: "",
            embeds: [
              {
                title: `Hourly summary: ${values.symbol ?? snapshotSymbol}`,
                description: content,
                image: { url: "attachment://snapshot.png" },
              },
            ],
          };

          const res = await discordMultipart({
            botToken,
            method: "POST",
            url: `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`,
            payloadJson,
            file: { name: "snapshot.png", bytes: pngBytes, contentType: "image/png" },
          });
          if (!res.ok) {
            throw new Error(`Discord multipart send failed (${res.status}): ${res.text.slice(0, 200)}`);
          }
        } else {
          const res = await discordJson({
            botToken,
            method: "POST",
            url: `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`,
            body: { content },
          });
          if (!res.ok) {
            throw new Error(`Discord send failed (${res.status}): ${res.text.slice(0, 200)}`);
          }
        }

        const nextRunAt = computeNextRunAt({ now, trigger }) ?? undefined;
        await ctx.runMutation(discordAutomationsMutations.markAutomationRun, {
          organizationId,
          automationId: automationId as any,
          lastRunAt: now,
          nextRunAt,
        });

        sent += 1;
      } catch (err) {
        failed += 1;
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }

    return { ok: true, processed, sent, failed, errors };
  },
});

