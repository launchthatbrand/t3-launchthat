"use node";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-require-imports,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access
*/

import { discordJson, discordMultipart } from "launchthat-plugin-discord/runtime/discordApi";

import { PNG } from "pngjs";
import { action } from "../_generated/server";
import { env } from "../../src/env";
import { resolveOrgBotToken } from "launchthat-plugin-discord/runtime/credentials";
import { v } from "convex/values";

// Avoid typed imports here (can cause TS deep instantiation errors).
const components: any = require("../_generated/api").components;
const api: any = require("../_generated/api").api;
const internal: any = require("../_generated/api").internal;

const requirePlatformAdmin = async (ctx: any) => {
  await ctx.runQuery(internal.platform.testsAuth.assertPlatformAdmin, {});
};

const normalizeSymbol = (s: string): string => s.trim().toUpperCase();

const resolveOrgBotTokenForOrg = async (ctx: any, organizationId: string): Promise<string> => {
  const orgSecrets = (await ctx.runQuery(
    components.launchthat_discord.orgConfigs.internalQueries.getOrgConfigSecrets,
    { organizationId },
  )) as
    | {
      enabled: boolean;
      botMode: "global" | "custom";
      customBotTokenEncrypted?: string;
      botTokenEncrypted?: string;
    }
    | null;

  if (!orgSecrets?.enabled) {
    throw new Error("Discord is not enabled for this organization");
  }

  return await resolveOrgBotToken({
    botMode: orgSecrets.botMode === "custom" ? "custom" : "global",
    globalBotToken: env.DISCORD_GLOBAL_BOT_TOKEN ?? "",
    secretsKey: env.DISCORD_SECRETS_KEY ?? "",
    customBotTokenEncrypted: orgSecrets.customBotTokenEncrypted,
    botTokenEncrypted: orgSecrets.botTokenEncrypted,
  });
};

interface Bar {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

const flattenBars = (chunks: any[], fromMs: number, toMs: number): Bar[] => {
  const map = new Map<number, Bar>();
  const list = Array.isArray(chunks) ? chunks : [];
  for (const c of list) {
    const bars = Array.isArray(c?.bars) ? c.bars : [];
    for (const b of bars) {
      const t = Number(b?.t);
      const o = Number(b?.o);
      const h = Number(b?.h);
      const l = Number(b?.l);
      const close = Number(b?.c);
      const vol = Number(b?.v);
      if (!Number.isFinite(t) || t < fromMs || t > toMs) continue;
      if (![o, h, l, close, vol].every((n) => Number.isFinite(n))) continue;
      map.set(t, { t, o, h, l, c: close, v: vol });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.t - b.t);
};

const movingAverage = (bars: Bar[], period: number): { t: number; value: number }[] => {
  const p = Math.max(2, Math.min(200, Number(period)));
  const out: { t: number; value: number }[] = [];
  let sum = 0;
  const q: number[] = [];
  for (const b of bars) {
    const c = b.c;
    q.push(c);
    sum += c;
    if (q.length > p) sum -= q.shift() ?? 0;
    if (q.length === p) out.push({ t: b.t, value: sum / p });
  }
  return out;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) {
    const r1 = h.charAt(0) || "0";
    const g1 = h.charAt(1) || "0";
    const b1 = h.charAt(2) || "0";
    const r = parseInt(r1 + r1, 16);
    const g = parseInt(g1 + g1, 16);
    const b = parseInt(b1 + b1, 16);
    return { r, g, b };
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r, g, b };
};

const setPixel = (
  img: PNG,
  x: number,
  y: number,
  rgba: { r: number; g: number; b: number; a: number },
) => {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const idx = (img.width * y + x) << 2;
  img.data[idx] = rgba.r;
  img.data[idx + 1] = rgba.g;
  img.data[idx + 2] = rgba.b;
  img.data[idx + 3] = rgba.a;
};

const fillRect = (
  img: PNG,
  x: number,
  y: number,
  w: number,
  h: number,
  rgba: { r: number; g: number; b: number; a: number },
) => {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(img.width, x + w);
  const y1 = Math.min(img.height, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) setPixel(img, xx, yy, rgba);
  }
};

const drawLine = (
  img: PNG,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  rgba: { r: number; g: number; b: number; a: number },
) => {
  // Bresenham
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  while (true) {
    setPixel(img, x, y, rgba);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
};

const fillCircle = (
  img: PNG,
  cx: number,
  cy: number,
  r: number,
  rgba: { r: number; g: number; b: number; a: number },
) => {
  const rr = r * r;
  for (let y = -r; y <= r; y++) {
    const yy = cy + y;
    const xxSpan = Math.floor(Math.sqrt(Math.max(0, rr - y * y)));
    for (let x = -xxSpan; x <= xxSpan; x++) {
      setPixel(img, cx + x, yy, rgba);
    }
  }
};

const renderSnapshotPng = (args: {
  symbol: string;
  bars: Bar[];
  clusters: {
    count: number;
    direction: "long" | "short" | "mixed";
    avgEntryPrice: number;
    avgOpenedAt: number;
    totalAbsQty: number;
  }[];
  now: number;
}): Uint8Array => {
  const width = 1200;
  const height = 630;
  const img = new PNG({ width, height });

  // Theme
  const bg = hexToRgb("#0B1020");
  const grid = { r: 255, g: 255, b: 255, a: Math.round(255 * 0.06) };
  const up = hexToRgb("#22C55E");
  const down = hexToRgb("#EF4444");
  const ma = hexToRgb("#60A5FA");
  const mixed = hexToRgb("#A78BFA");

  // Background
  fillRect(img, 0, 0, width, height, { ...bg, a: 255 });

  // Layout
  const padL = 70;
  const padR = 40;
  const padT = 60;
  const padB = 50;
  const chartX = padL;
  const chartY = padT;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  // Grid
  const gridRows = 5;
  const gridCols = 6;
  for (let i = 0; i <= gridRows; i++) {
    const y = chartY + (chartH * i) / gridRows;
    drawLine(
      img,
      Math.round(chartX),
      Math.round(y),
      Math.round(chartX + chartW),
      Math.round(y),
      grid,
    );
  }
  for (let i = 0; i <= gridCols; i++) {
    const x = chartX + (chartW * i) / gridCols;
    drawLine(
      img,
      Math.round(x),
      Math.round(chartY),
      Math.round(x),
      Math.round(chartY + chartH),
      grid,
    );
  }

  const bars = args.bars;
  const clusters = args.clusters;

  const firstBar = bars.length > 0 ? bars[0] : null;
  const lastBar = bars.length > 0 ? bars[bars.length - 1] : null;
  const xMinT = Number(
    typeof firstBar?.t === "number" ? firstBar.t : args.now - 24 * 60 * 60 * 1000,
  );
  const xMaxT = Number(typeof lastBar?.t === "number" ? lastBar.t : args.now);

  // Price bounds from candles + entry prices.
  let lo = Number.POSITIVE_INFINITY;
  let hi = Number.NEGATIVE_INFINITY;
  for (const b of bars) {
    lo = Math.min(lo, b.l);
    hi = Math.max(hi, b.h);
  }
  for (const c of clusters) {
    lo = Math.min(lo, c.avgEntryPrice);
    hi = Math.max(hi, c.avgEntryPrice);
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo === hi) {
    lo = 0;
    hi = 1;
  }
  const pad = (hi - lo) * 0.06;
  lo -= pad;
  hi += pad;

  const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

  const xForT = (t: number) => {
    const pRaw = (t - xMinT) / Math.max(1, xMaxT - xMinT);
    const p = clamp01(pRaw);
    return chartX + p * chartW;
  };
  const yForPrice = (p: number) => {
    const pctRaw = (p - lo) / Math.max(1e-9, hi - lo);
    const pct = clamp01(pctRaw);
    return chartY + (1 - pct) * chartH;
  };

  // Candles
  const candleW = Math.max(2, Math.floor(chartW / Math.max(10, bars.length)));
  for (const b of bars) {
    const x = Math.round(xForT(b.t));
    const yO = Math.round(yForPrice(b.o));
    const yC = Math.round(yForPrice(b.c));
    const yH = Math.round(yForPrice(b.h));
    const yL = Math.round(yForPrice(b.l));
    const isUp = b.c >= b.o;
    const col = isUp ? up : down;
    const rgba = { ...col, a: 255 };

    // wick
    drawLine(img, x, yH, x, yL, { ...col, a: 190 });

    // body
    const top = Math.min(yO, yC);
    const bot = Math.max(yO, yC);
    const w = candleW;
    const h = Math.max(1, bot - top);
    fillRect(img, Math.round(x - w / 2), top, w, h, rgba);
  }

  // Moving average line
  const maPoints = movingAverage(bars, 14);
  for (let i = 1; i < maPoints.length; i++) {
    const p0 = maPoints[i - 1] as { t: number; value: number } | undefined;
    const p1 = maPoints[i] as { t: number; value: number } | undefined;
    if (!p0 || !p1) continue;
    drawLine(
      img,
      Math.round(xForT(p0.t)),
      Math.round(yForPrice(p0.value)),
      Math.round(xForT(p1.t)),
      Math.round(yForPrice(p1.value)),
      { ...ma, a: 220 },
    );
  }

  // Clusters overlay
  const maxQty = Math.max(1, ...clusters.map((c) => c.totalAbsQty));
  for (const c of clusters) {
    const cx = Math.round(xForT(c.avgOpenedAt));
    const cy = Math.round(yForPrice(c.avgEntryPrice));
    const r = Math.max(5, Math.min(16, Math.round(5 + 11 * (c.totalAbsQty / maxQty))));
    const col =
      c.direction === "mixed" ? mixed : c.direction === "short" ? down : up;
    fillCircle(img, cx, cy, r, { ...col, a: 220 });
  }

  return PNG.sync.write(img);
};

const buildSnapshotPreview = async (ctx: any, args: any) => {
  const symbol = normalizeSymbol(String(args?.symbol ?? ""));
  const requestedOrgId = coerceString(args?.organizationId);
  const maxUsersRaw = Number(args?.maxUsers ?? 100);
  const maxUsers = Math.max(1, Math.min(500, Math.floor(maxUsersRaw)));

  if (!symbol) {
    return {
      kind: "logs",
      logs: ["Missing symbol."],
    };
  }

  const now = Date.now();

  const source = await ctx.runQuery(
    components.launchthat_pricedata.sources.queries.getDefaultSource,
    {},
  );
  const sourceKey = typeof source?.sourceKey === "string" ? String(source.sourceKey) : "";
  if (!sourceKey) {
    return { kind: "logs", logs: ["No pricedata default source configured."] };
  }

  const instrument = await ctx.runQuery(
    components.launchthat_pricedata.instruments.queries.getInstrumentBySymbol,
    { sourceKey, symbol },
  );
  const tradableInstrumentId =
    typeof instrument?.tradableInstrumentId === "string"
      ? String(instrument.tradableInstrumentId)
      : "";
  if (!tradableInstrumentId) {
    return {
      kind: "logs",
      logs: [`No pricedata instrument found for ${symbol} (sourceKey=${sourceKey}).`],
    };
  }

  const toMs = now;
  const fromMs = now - 24 * 60 * 60 * 1000;
  // pricedata chunks are indexed by `chunkStartMs >= fromMs`. If chunks overlap the window
  // but start before `fromMs` (common for day-aligned chunks), we'd miss them.
  // Pad the query window back a bit to reliably include the overlapping chunk(s).
  const queryFromMs = Math.max(0, fromMs - 48 * 60 * 60 * 1000);
  const chunks = await ctx.runQuery(
    components.launchthat_pricedata.bars.queries.getBarChunks,
    {
      sourceKey,
      tradableInstrumentId,
      resolution: "15m",
      fromMs: queryFromMs,
      toMs,
    },
  );
  const chunkList = Array.isArray(chunks) ? chunks : [];
  let bars = flattenBars(chunkList, fromMs, toMs);

  // If the cache is stale (latest bar older than our desired window), anchor the preview window
  // to the latest available bar so the PNG is still useful for style/layout iteration.
  let latestBarT = 0;
  for (const c of chunkList) {
    const cObj = c && typeof c === "object" ? (c as Record<string, unknown>) : null;
    const b = Array.isArray(cObj?.bars) ? (cObj.bars as unknown[]) : [];
    const last = b.length > 0 ? b[b.length - 1] : null;
    const lastObj =
      last && typeof last === "object" ? (last as Record<string, unknown>) : null;
    const t = Number(lastObj?.t ?? 0);
    if (Number.isFinite(t) && t > latestBarT) latestBarT = t;
  }
  const dataLagMs = latestBarT > 0 ? now - latestBarT : null;
  let usedFromMs = fromMs;
  let usedToMs = toMs;
  if (bars.length === 0 && latestBarT > 0 && latestBarT < fromMs) {
    usedToMs = latestBarT;
    usedFromMs = Math.max(0, usedToMs - 24 * 60 * 60 * 1000);
    bars = flattenBars(chunkList, usedFromMs, usedToMs);
  }

  // Load clusters via the app-level org aggregation (membership ∩ permissions ∩ user-owned groups).
  // If `organizationId` is provided, use it directly (for Discord + deterministic debugging).
  // Otherwise, try all public orgs and pick the "best" candidate for meta visibility.
  const orgIds = requestedOrgId
    ? [requestedOrgId]
    : ((await ctx.runQuery(components.launchthat_core_tenant.queries.listOrganizationsPublic, {
        includePlatform: false,
        limit: 500,
      })) as any[] | null)
        ?.map((o: any) => coerceString(o?._id))
        .filter(Boolean) ?? [];

  let usedOrgId = "";
  let usersAllowed = 0;
  let openPositions = 0;
  let clusters: any[] = [];
  let usersScanned: number | null = null;

  // "Best" means: prefer any positions; otherwise prefer most allowed users (helps debugging perms).
  let best: {
    organizationId: string;
    usersAllowed: number;
    openPositions: number;
    clusters: any[];
    usersScanned: number;
  } | null = null;

  for (const organizationId of orgIds) {
    const res = await ctx.runQuery(api.traderlaunchpad.queries.getOrgOpenPositionsForSymbol, {
      organizationId,
      symbol,
      maxUsers,
    });

    const c = Array.isArray(res?.clusters) ? res.clusters : [];
    const n = typeof res?.openPositions === "number" ? res.openPositions : 0;
    const allowed = typeof res?.usersAllowed === "number" ? res.usersAllowed : 0;
    const scanned = typeof res?.usersScanned === "number" ? res.usersScanned : 0;

    const candidate = {
      organizationId,
      usersAllowed: allowed,
      openPositions: n,
      clusters: c,
      usersScanned: scanned,
    };

    if (!best) {
      best = candidate;
    } else if (candidate.openPositions > best.openPositions) {
      best = candidate;
    } else if (best.openPositions === 0 && candidate.usersAllowed > best.usersAllowed) {
      best = candidate;
    }
  }

  if (best) {
    usedOrgId = best.organizationId;
    usersAllowed = best.usersAllowed;
    usersScanned = best.usersScanned;
    openPositions = best.openPositions;
    clusters = best.clusters;
  }

  const pngBytes = renderSnapshotPng({ symbol, bars, clusters, now });
  // Convex arrays cap at 8192 items; return PNG as base64 string instead.
  const base64 = Buffer.from(pngBytes).toString("base64");

  return {
    kind: "image",
    contentType: "image/png",
    filename: `${symbol}-snapshot.png`,
    base64,
    meta: {
      symbol,
      sourceKey,
      tradableInstrumentId,
      bars: bars.length,
      openPositions,
      clusters: clusters.length,
      sampleMaxUsers: maxUsers,
      orgsScanned: orgIds.length,
      orgUsed: usedOrgId,
      usersAllowed,
      usersScanned,
      chunksFound: chunkList.length,
      queryFromMs,
      fromMs,
      toMs,
      usedFromMs,
      usedToMs,
      latestBarT,
      dataLagMs,
    },
  };
};

const coerceString = (v1: unknown): string =>
  typeof v1 === "string" ? v1.trim() : "";

const coerceDiscordMessageId = (json: unknown): string => {
  if (!json || typeof json !== "object") return "";
  const id = (json as any).id;
  return typeof id === "string" ? id.trim() : "";
};

const runSendSnapshotToDiscord = async (ctx: any, args: any) => {
  const organizationId = coerceString(args?.organizationId);
  const guildId = coerceString(args?.guildId);
  const symbol = normalizeSymbol(String(args?.symbol ?? ""));
  if (!organizationId || !guildId || !symbol) {
    return { kind: "logs", logs: ["Missing organizationId, guildId, or symbol."] };
  }

  const preview = await buildSnapshotPreview(ctx, { organizationId, guildId, symbol });
  if (preview.kind !== "image") {
    return {
      kind: "logs",
      logs: ["Snapshot preview failed (no image output)."],
      data: preview,
    };
  }

  const resolvedChannelIds = (await ctx.runQuery(
    components.launchthat_discord.routing.queries.resolveChannelsForEvent,
    { organizationId, guildId, kind: "trade_feed", actorRole: "owner", symbol },
  )) as string[] | null;
  const channelId = Array.isArray(resolvedChannelIds)
    ? (resolvedChannelIds
      .map((c) => (typeof c === "string" ? c.trim() : ""))
      .find(Boolean) ?? "")
    : "";
  if (!channelId) {
    return {
      kind: "logs",
      logs: ["No channel matched routing rules for this org+guild+symbol."],
    };
  }

  const existing = await ctx.runQuery(
    components.launchthat_traderlaunchpad.tradeIdeas.queries.getDiscordSymbolSnapshotFeed,
    { organizationId, symbol },
  );

  let botToken = "";
  try {
    botToken = await resolveOrgBotTokenForOrg(ctx, organizationId);
  } catch (e) {
    return {
      kind: "logs",
      logs: [
        `Failed to resolve bot token for org: ${e instanceof Error ? e.message : String(e)}`,
      ],
    };
  }

  const messageContent = `📈 ${symbol} community snapshot`;
  const meta = (preview as any).meta;
  const embedDescription = (() => {
    const m = meta && typeof meta === "object" ? meta : {};
    const openPositions = Number(m?.openPositions ?? 0);
    const clusters = Number(m?.clusters ?? 0);
    return `Open positions: ${openPositions} • Clusters: ${clusters}`;
  })();

  const payloadJson = {
    content: messageContent,
    embeds: [
      {
        title: `${symbol} Community Snapshot`,
        description: embedDescription,
        image: { url: "attachment://snapshot.png" },
      },
    ],
  };

  const b64 = typeof (preview as any).base64 === "string" ? (preview as any).base64 : "";
  const bytes = b64
    ? new Uint8Array(Buffer.from(String(b64), "base64"))
    : new Uint8Array();
  if (bytes.length === 0) {
    return { kind: "logs", logs: ["Snapshot preview returned empty base64."] };
  }

  const existingRec =
    existing && typeof existing === "object" ? (existing as Record<string, unknown>) : null;
  const existingChannelId = coerceString(existingRec?.channelId);
  const existingMessageId = coerceString(existingRec?.messageId);
  const canPatch = existingChannelId.trim() === channelId && existingMessageId.trim();

  const method: "POST" | "PATCH" = canPatch ? "PATCH" : "POST";
  const url = canPatch
    ? `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(existingMessageId)}`
    : `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`;

  const res = await discordMultipart({
    botToken,
    method,
    url,
    payloadJson,
    file: { name: "snapshot.png", bytes, contentType: "image/png" },
  });

  const now = Date.now();
  if (!res.ok) {
    const err = `Discord ${method} failed: ${res.status} ${res.text}`.slice(0, 800);
    // Best-effort persist error (if we have an existing feed we can patch, otherwise still store).
    await ctx.runMutation(
      components.launchthat_traderlaunchpad.tradeIdeas.mutations.upsertDiscordSymbolSnapshotFeed,
      {
        organizationId,
        symbol,
        guildId,
        channelId,
        messageId: canPatch ? existingMessageId : "unknown",
        lastError: err,
        lastEditedAt: canPatch ? now : undefined,
        lastPostedAt: canPatch ? undefined : now,
      },
    );

    return { kind: "logs", logs: [err], data: { channelId, guildId } };
  }

  const messageId = canPatch ? existingMessageId : coerceDiscordMessageId(res.json);
  if (!messageId) {
    return {
      kind: "logs",
      logs: ["Discord request succeeded but response did not include message id."],
      data: res.json,
    };
  }

  await ctx.runMutation(
    components.launchthat_traderlaunchpad.tradeIdeas.mutations.upsertDiscordSymbolSnapshotFeed,
    {
      organizationId,
      symbol,
      guildId,
      channelId,
      messageId,
      lastError: undefined,
      lastEditedAt: canPatch ? now : undefined,
      lastPostedAt: canPatch ? undefined : now,
    },
  );

  return {
    kind: "logs",
    logs: [
      `✅ Snapshot sent`,
      `Org: ${organizationId}`,
      `Guild: ${guildId}`,
      `Channel: ${channelId}`,
      `Message: ${messageId}`,
      `Method: ${method}`,
    ],
    data: { guildId, channelId, messageId },
  };
};

const previewSendEmail = (args: any) => {
  const toEmail = coerceString(args?.toEmail).toLowerCase();
  const subject = coerceString(args?.subject);
  const body = typeof args?.body === "string" ? args.body : String(args?.body ?? "");
  if (!toEmail || !subject || !body) {
    return { kind: "logs", logs: ["Missing toEmail, subject, or body."] };
  }

  return {
    kind: "logs",
    logs: [
      "This test will enqueue an email via the email plugin and send it using Resend.",
      `Org: ${env.TRADERLAUNCHPAD_DEFAULT_ORG_ID}`,
      `To: ${toEmail}`,
      `Subject: ${subject}`,
      `Body chars: ${body.length}`,
    ],
    data: { toEmail, subject },
  };
};

const runSendEmail = async (ctx: any, args: any) => {
  const toEmail = coerceString(args?.toEmail).toLowerCase();
  const subject = coerceString(args?.subject);
  const body = typeof args?.body === "string" ? args.body : String(args?.body ?? "");
  if (!toEmail || !subject || !body) {
    return { kind: "logs", logs: ["Missing toEmail, subject, or body."] };
  }

  const textBody = body;
  const htmlBody = `<div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; font-size: 14px; line-height: 1.5; color: #0f172a;"><p style="margin:0 0 12px;">${body
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\n", "<br/>")}</p><p style="margin:0;color:#64748b;font-size:12px;">Sent from Platform Tests Console</p></div>`;

  const outboxId = await ctx.runMutation(
    components.launchthat_email.mutations.enqueueEmail,
    {
      orgId: env.TRADERLAUNCHPAD_DEFAULT_ORG_ID,
      to: toEmail,
      subject,
      htmlBody,
      textBody,
      templateKey: "platform_tests",
    },
  );

  return {
    kind: "logs",
    logs: ["✅ Email queued", `To: ${toEmail}`, `Subject: ${subject}`],
    data: { outboxId },
  };
};

const previewDiscordBroadcast = async (ctx: any, args: any) => {
  const organizationId = coerceString(args?.organizationId);
  const message = typeof args?.message === "string" ? args.message : String(args?.message ?? "");
  if (!organizationId || !message.trim()) {
    return { kind: "logs", logs: ["Missing organizationId or message."] };
  }

  const guildConnections = (await ctx.runQuery(
    components.launchthat_discord.guildConnections.queries.listGuildConnectionsForOrg,
    { organizationId },
  )) as any[] | null;
  const guilds = Array.isArray(guildConnections) ? guildConnections : [];
  const guildIds = guilds
    .map((g) => coerceString(g?.guildId))
    .filter(Boolean);

  const targets: { guildId: string; channels: string[] }[] = [];
  for (const guildId of guildIds) {
    const routingRules = (await ctx.runQuery(
      components.launchthat_discord.routing.queries.listRoutingRules,
      { organizationId, guildId, kind: "trade_feed" },
    )) as any[] | null;
    const rules = Array.isArray(routingRules) ? routingRules : [];
    const channelIds = Array.from(
      new Set(
        rules
          .filter((r) => r?.enabled === true)
          .map((r) => coerceString(r?.channelId))
          .filter(Boolean),
      ),
    );
    targets.push({ guildId, channels: channelIds });
  }

  const totalChannels = targets.reduce((sum, t) => sum + t.channels.length, 0);

  return {
    kind: "logs",
    logs: [
      "This test will POST a Discord message to every unique channel referenced by enabled routing rules (trade_feed).",
      `Org: ${organizationId}`,
      `Guilds: ${targets.length}`,
      `Channels: ${totalChannels}`,
      `Message chars: ${message.trim().length}`,
      "",
      ...targets.flatMap((t) => [
        `Guild ${t.guildId}`,
        ...t.channels.map((c) => `  - ${c}`),
      ]),
    ],
    data: { organizationId, guilds: targets.length, channels: totalChannels },
  };
};

const runDiscordBroadcast = async (ctx: any, args: any) => {
  const organizationId = coerceString(args?.organizationId);
  const message = typeof args?.message === "string" ? args.message : String(args?.message ?? "");
  const content = message.trim();
  if (!organizationId || !content) {
    return { kind: "logs", logs: ["Missing organizationId or message."] };
  }

  const guildConnections = (await ctx.runQuery(
    components.launchthat_discord.guildConnections.queries.listGuildConnectionsForOrg,
    { organizationId },
  )) as any[] | null;
  const guilds = Array.isArray(guildConnections) ? guildConnections : [];

  let botToken = "";
  try {
    botToken = await resolveOrgBotTokenForOrg(ctx, organizationId);
  } catch (e) {
    return {
      kind: "logs",
      logs: [
        `Failed to resolve bot token for org: ${e instanceof Error ? e.message : String(e)}`,
      ],
    };
  }

  const maxTotalSends = 25;
  let sends = 0;
  const logs: string[] = [];

  for (const g of guilds) {
    const guildId = coerceString(g?.guildId);
    if (!guildId) continue;

    const routingRules = (await ctx.runQuery(
      components.launchthat_discord.routing.queries.listRoutingRules,
      { organizationId, guildId, kind: "trade_feed" },
    )) as any[] | null;
    const rules = Array.isArray(routingRules) ? routingRules : [];
    const channelIds = Array.from(
      new Set(
        rules
          .filter((r) => r?.enabled === true)
          .map((r) => coerceString(r?.channelId))
          .filter(Boolean),
      ),
    );

    if (channelIds.length === 0) {
      logs.push(`Guild ${guildId}: no enabled trade_feed routing channels found`);
      continue;
    }

    for (const channelId of channelIds) {
      if (sends >= maxTotalSends) {
        logs.push(`Reached max sends (${maxTotalSends}); stopping.`);
        return { kind: "logs", logs, data: { sends } };
      }

      const url = `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`;
      const res = await discordJson({
        botToken,
        method: "POST",
        url,
        body: { content },
      });

      sends += 1;
      if (!res.ok) {
        logs.push(`❌ ${guildId} / ${channelId}: ${res.status} ${res.text.slice(0, 200)}`);
      } else {
        const messageId = coerceDiscordMessageId(res.json);
        logs.push(`✅ ${guildId} / ${channelId}: message ${messageId || "(unknown id)"}`);
      }
    }
  }

  return { kind: "logs", logs, data: { sends } };
};

export const previewTest = action({
  args: {
    testId: v.string(),
    params: v.any(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    if (args.testId === "png.snapshot.preview") {
      return await buildSnapshotPreview(ctx, args.params);
    }
    if (args.testId === "png.snapshot.send_discord") {
      return await buildSnapshotPreview(ctx, args.params);
    }
    if (args.testId === "email.send") {
      return previewSendEmail(args.params);
    }
    if (args.testId === "discord.broadcast") {
      return await previewDiscordBroadcast(ctx, args.params);
    }

    return { kind: "logs", logs: [`previewTest not implemented for ${args.testId}`] };
  },
});

export const runTest = action({
  args: {
    testId: v.string(),
    params: v.any(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    if (args.testId === "png.snapshot.preview") {
      // "Run" does not have side-effects for this test; mirror preview.
      return await buildSnapshotPreview(ctx, args.params);
    }
    if (args.testId === "png.snapshot.send_discord") {
      return await runSendSnapshotToDiscord(ctx, args.params);
    }
    if (args.testId === "email.send") {
      return await runSendEmail(ctx, args.params);
    }
    if (args.testId === "discord.broadcast") {
      return await runDiscordBroadcast(ctx, args.params);
    }

    return { kind: "logs", logs: [`runTest not implemented for ${args.testId}`] };
  },
});

