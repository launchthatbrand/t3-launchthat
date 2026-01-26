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
import {
  drawDashedHLine,
  drawLine,
  drawText5x7,
  drawTextLayerWithCanvas,
  fillCircle,
  fillTriangle,
  fillRect,
  hexToRgb,
  ensureCanvasFonts,
  tryGetCanvas,
} from "launchthat-plugin-canvas";
import type { TextOp } from "launchthat-plugin-canvas";
import { env } from "../../../src/env";
import { resolveOrgBotToken } from "launchthat-plugin-discord/runtime/credentials";

// Avoid typed imports here (can cause TS deep instantiation errors).
const components: any = require("../../_generated/api").components;
const api: any = require("../../_generated/api").api;
const internal: any = require("../../_generated/api").internal;

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_SNAPSHOT_LOOKBACK_DAYS = 3;
const isFiniteNumber = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

export const requirePlatformAdmin = async (ctx: any) => {
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

/**
 * Platform test helper: resolve a bot token even if the org hasn't explicitly enabled Discord yet.
 * This is safe because `/platform/tests` is platform-admin only.
 */
export const resolveOrgBotTokenForOrgPlatformTest = async (
  ctx: any,
  organizationId: string,
): Promise<string> => {
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

  if (!orgSecrets) {
    throw new Error("Discord org config secrets not found.");
  }

  // Allow “disabled” org configs for platform tests as long as we can resolve a token.
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
// Rendering primitives + text fallback helpers are provided by `launchthat-plugin-canvas`.

const formatPriceLabel = (n: number): string => {
  // TradingView-ish labels (no commas)
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
};

const formatDayLabel = (tMs: number, fromMs: number, toMs: number): string => {
  const d = new Date(tMs);
  const day = d.getUTCDate();
  const month = d.getUTCMonth() + 1;
  const startMonth = new Date(fromMs).getUTCMonth() + 1;
  const endMonth = new Date(toMs).getUTCMonth() + 1;
  return startMonth === endMonth ? String(day) : `${month}/${day}`;
};
// Canvas font loading and AA text rendering come from `launchthat-plugin-canvas`.

const computeConsensus = (clusters: {
  direction: "long" | "short" | "mixed";
  count: number;
  totalAbsQty: number;
}[]): { label: "BUY" | "SELL" | "MIXED"; direction: "long" | "short" | "mixed" } => {
  let longCount = 0;
  let shortCount = 0;
  for (const c of clusters) {
    const n = isFiniteNumber(c.count) && c.count > 0 ? c.count : 1;
    if (c.direction === "short") shortCount += n;
    else longCount += n;
  }
  if (longCount === shortCount) return { label: "MIXED", direction: "mixed" };
  if (longCount > shortCount) return { label: "BUY", direction: "long" };
  return { label: "SELL", direction: "short" };
};

const renderSnapshotPng = (args: {
  symbol: string;
  timeframeLabel: string;
  consensus: "BUY" | "SELL" | "MIXED";
  showSentimentBadge?: boolean;
  themeMode?: "dark" | "light" | "custom";
  bgColor?: string;
  gridOpacity?: number;
  gridColor?: string;
  candleSpacingPct?: number;
  candleUpColor?: string;
  candleDownColor?: string;
  tradeIndicatorShape?: "circle" | "triangle";
  bars: Bar[];
  clusters: {
    count: number;
    direction: "long" | "short" | "mixed";
    avgEntryPrice: number;
    avgOpenedAt: number;
    totalAbsQty: number;
  }[];
  now: number;
  fromMs: number;
  toMs: number;
}): Uint8Array => {
  // Render at higher pixel density for sharper output.
  // Keep the same "design size" proportions and scale UI constants accordingly.
  const baseW = 1200;
  const baseH = 630;
  const scale = 2; // bump to 2x resolution
  const width = baseW * scale;
  const height = baseH * scale;
  const s = (n: number) => Math.round(n * scale);
  const img = new PNG({ width, height });
  const textOps: TextOp[] = [];

  // Theme mode + background color
  const themeMode = args.themeMode ?? "dark";
  const bgRaw = typeof args.bgColor === "string" ? args.bgColor.trim() : "";
  const bgParsed = /^#([0-9a-fA-F]{6})$/.exec(bgRaw);
  const bgHex = bgParsed ? `#${bgParsed[1].toUpperCase()}` : null;
  const bgRgb = bgHex ? hexToRgb(bgHex) : null;
  const gridColorRaw = typeof args.gridColor === "string" ? args.gridColor.trim() : "";
  const gridColorParsed = /^#([0-9a-fA-F]{6})$/.exec(gridColorRaw);
  const gridColorHex = gridColorParsed
    ? `#${gridColorParsed[1].toUpperCase()}`
    : null;
  const gridRgbOverride = gridColorHex ? hexToRgb(gridColorHex) : null;
  const gridOpacity =
    typeof args.gridOpacity === "number" && Number.isFinite(args.gridOpacity)
      ? Math.max(0, Math.min(0.25, args.gridOpacity))
      : null;

  const candleSpacingPct =
    typeof args.candleSpacingPct === "number" && Number.isFinite(args.candleSpacingPct)
      ? Math.max(0, Math.min(80, Math.round(args.candleSpacingPct)))
      : 15;
  const candleUpRaw = typeof args.candleUpColor === "string" ? args.candleUpColor.trim() : "";
  const candleDownRaw =
    typeof args.candleDownColor === "string" ? args.candleDownColor.trim() : "";
  const candleUpParsed = /^#([0-9a-fA-F]{6})$/.exec(candleUpRaw);
  const candleDownParsed = /^#([0-9a-fA-F]{6})$/.exec(candleDownRaw);
  const candleUpRgb = candleUpParsed
    ? hexToRgb(`#${candleUpParsed[1].toUpperCase()}`)
    : null;
  const candleDownRgb = candleDownParsed
    ? hexToRgb(`#${candleDownParsed[1].toUpperCase()}`)
    : null;
  const tradeIndicatorShape = args.tradeIndicatorShape ?? "circle";

  const isDarkBg = (() => {
    const rgb =
      bgRgb ??
      (themeMode === "light" ? hexToRgb("#FFFFFF") : hexToRgb("#000000"));
    // Relative luminance (sRGB)
    const toLin = (c: number) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const l = 0.2126 * toLin(rgb.r) + 0.7152 * toLin(rgb.g) + 0.0722 * toLin(rgb.b);
    return l < 0.5;
  })();
  const themeCfg: {
    bg: { r: number; g: number; b: number };
    header: { r: number; g: number; b: number; a: number };
    divider: { r: number; g: number; b: number; a: number };
    grid: { r: number; g: number; b: number; a: number };
    axisText: { r: number; g: number; b: number; a: number };
    axisMuted: { r: number; g: number; b: number; a: number };
    badgeBg: { r: number; g: number; b: number; a: number };
    badgeBorder: { r: number; g: number; b: number; a: number };
    badgePrefix: { r: number; g: number; b: number; a: number };
    titleText: { r: number; g: number; b: number; a: number };
    shadowA: number;
  } =
    themeMode === "light"
      ? {
          bg: hexToRgb("#FFFFFF"),
          header: { r: 255, g: 255, b: 255, a: 230 },
          divider: { r: 2, g: 6, b: 23, a: 26 },
          grid: { r: 2, g: 6, b: 23, a: Math.round(255 * 0.08) },
          axisText: { r: 2, g: 6, b: 23, a: Math.round(255 * 0.82) },
          axisMuted: { r: 2, g: 6, b: 23, a: Math.round(255 * 0.55) },
          badgeBg: { r: 255, g: 255, b: 255, a: 235 },
          badgeBorder: { r: 2, g: 6, b: 23, a: 34 },
          badgePrefix: { r: 15, g: 23, b: 42, a: 255 },
          titleText: { r: 2, g: 6, b: 23, a: 255 },
          shadowA: 60,
        }
      : {
          // Dark base palette (bg is overridden below for custom colors)
          bg: hexToRgb("#000000"),
          header: { r: 0, g: 0, b: 0, a: 170 },
          divider: { r: 255, g: 255, b: 255, a: 24 },
          grid: { r: 255, g: 255, b: 255, a: Math.round(255 * 0.075) },
          axisText: { r: 255, g: 255, b: 255, a: Math.round(255 * 0.86) },
          axisMuted: { r: 255, g: 255, b: 255, a: Math.round(255 * 0.68) },
          badgeBg: { r: 9, g: 9, b: 11, a: 235 },
          badgeBorder: { r: 255, g: 255, b: 255, a: 36 },
          badgePrefix: { r: 226, g: 232, b: 240, a: 255 },
          titleText: { r: 255, g: 255, b: 255, a: 255 },
          shadowA: 170,
        };

  const bg = bgRgb ?? themeCfg.bg;
  const baseGrid =
    gridRgbOverride ??
    (themeMode === "custom"
      ? {
          r: isDarkBg ? 255 : 2,
          g: isDarkBg ? 255 : 6,
          b: isDarkBg ? 255 : 23,
        }
      : { r: themeCfg.grid.r, g: themeCfg.grid.g, b: themeCfg.grid.b });
  const baseGridOpacity =
    gridOpacity ??
    (themeMode === "custom" ? (isDarkBg ? 0.075 : 0.08) : themeCfg.grid.a / 255);
  const grid = { ...baseGrid, a: Math.round(255 * baseGridOpacity) };
  const axisText = themeMode === "custom"
    ? { r: isDarkBg ? 255 : 2, g: isDarkBg ? 255 : 6, b: isDarkBg ? 255 : 23, a: Math.round(255 * (isDarkBg ? 0.86 : 0.82)) }
    : themeCfg.axisText;
  const up = candleUpRgb ?? hexToRgb("#22C55E");
  const down = candleDownRgb ?? hexToRgb("#EF4444");
  const ma = hexToRgb("#60A5FA");
  const mixed = hexToRgb("#A78BFA");

  // Background
  fillRect(img, 0, 0, width, height, { ...bg, a: 255 });

  // Header overlay (TradingView-ish)
  const headerH = s(56);
  fillRect(img, 0, 0, width, headerH, themeCfg.header);
  drawLine(img, 0, headerH, width, headerH, themeCfg.divider);

  // Layout
  const padL = s(40);
  const padR = s(120);
  const padT = s(60);
  const padB = s(80);
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

  // Always scale the x-axis to the requested window (even if bar data is sparse),
  // so overlays (clusters) land where expected.
  const lastBar = bars.length > 0 ? bars[bars.length - 1] : null;
  const xMinT = Number(args.fromMs);
  const xMaxT = Number(args.toMs);

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

  const queueText = (op: Omit<TextOp, "align"> & { align?: "left" | "right" }) => {
    const text = String(op.text);
    if (!text) return;
    textOps.push({ ...op, text, align: op.align ?? "left" });
  };

  // Header text: SYMBOL + timeframe + consensus
  const symbolText = String(args.symbol).trim().toUpperCase();
  const tfText = String(args.timeframeLabel).trim(); // keep case (e.g. "15m")
  const consensusText = String(args.consensus).trim().toUpperCase();
  const consensusColor =
    consensusText === "BUY"
      ? { ...up, a: 255 }
      : consensusText === "SELL"
        ? { ...down, a: 255 }
        : { ...mixed, a: 255 };

  queueText({
    text: symbolText,
    x: s(28),
    y: s(12),
    rgba: themeCfg.titleText,
    font: { sizePx: s(28), weight: 800 },
    shadow:
      !isDarkBg
        ? { dx: 0, dy: s(1), blurPx: s(4), rgba: { r: 2, g: 6, b: 23, a: themeCfg.shadowA } }
        : { dx: 0, dy: s(2), blurPx: s(6), rgba: { r: 0, g: 0, b: 0, a: themeCfg.shadowA } },
    align: "left",
  });

  if (tfText) {
    queueText({
      text: tfText,
      x: s(28) + symbolText.length * s(18) + s(18),
      y: s(18),
      rgba: axisText,
      font: { sizePx: s(16), weight: 600 },
      shadow: { dx: 0, dy: s(2), blurPx: s(4), rgba: { r: 0, g: 0, b: 0, a: 140 } },
      align: "left",
    });
  }

  // Shadcn-ish badge bubble: "Market sentiment : SELL"
  if (args.showSentimentBadge ?? true) {
    const badgeFontSize = s(16);
    const badgePadX = s(14);
    const badgePadY = s(8);
    const badgeTextPrefix = "Market sentiment : ";
    const badgeTextValue = consensusText;
    const estCharW = Math.max(1, Math.round(badgeFontSize * 0.58));
    const badgeTextW = (badgeTextPrefix.length + badgeTextValue.length) * estCharW;
    const badgeW = badgeTextW + badgePadX * 2;
    const badgeH = badgeFontSize + badgePadY * 2;
    const badgeR = Math.floor(badgeH / 2);
    const badgeX = width - s(28) - badgeW;
    const badgeY = Math.round(headerH / 2 - badgeH / 2);

    // Border + fill (rounded "pill")
    const border = themeCfg.badgeBorder;
    const bg = themeCfg.badgeBg;
    // Outer pill
    fillRect(img, badgeX + badgeR, badgeY, badgeW - badgeR * 2, badgeH, border);
    fillCircle(img, badgeX + badgeR, badgeY + badgeR, badgeR, border);
    fillCircle(img, badgeX + badgeW - badgeR, badgeY + badgeR, badgeR, border);
    // Inner pill (inset)
    const inset = Math.max(1, Math.floor(scale));
    const innerX = badgeX + inset;
    const innerY = badgeY + inset;
    const innerW = badgeW - inset * 2;
    const innerH = badgeH - inset * 2;
    const innerR = Math.max(1, Math.floor(innerH / 2));
    fillRect(img, innerX + innerR, innerY, innerW - innerR * 2, innerH, bg);
    fillCircle(img, innerX + innerR, innerY + innerR, innerR, bg);
    fillCircle(img, innerX + innerW - innerR, innerY + innerR, innerR, bg);

    const textY = innerY + Math.round((innerH - badgeFontSize) / 2);
    const textX = innerX + badgePadX;

    // Prefix in neutral text, value in consensus color.
    queueText({
      text: badgeTextPrefix,
      x: textX,
      y: textY,
      rgba: themeCfg.badgePrefix,
      font: { sizePx: badgeFontSize, weight: 700 },
      shadow: { dx: 0, dy: s(1), blurPx: s(3), rgba: { r: 0, g: 0, b: 0, a: 150 } },
      align: "left",
    });
    queueText({
      text: badgeTextValue,
      x: textX + badgeTextPrefix.length * estCharW,
      y: textY,
      rgba: consensusColor,
      font: { sizePx: badgeFontSize, weight: 900 },
      shadow: { dx: 0, dy: s(1), blurPx: s(3), rgba: { r: 0, g: 0, b: 0, a: 150 } },
      align: "left",
    });
  }

  // Axes labels (aligned to current grid lines)
  for (let i = 0; i <= gridRows; i++) {
    const y = chartY + (chartH * i) / gridRows;
    const price = hi - ((hi - lo) * i) / gridRows;
    queueText({
      text: formatPriceLabel(price),
      x: chartX + chartW + padR - s(14),
      y: Math.round(y - s(8)),
      rgba: axisText,
      font: { sizePx: s(12), weight: 600 },
      align: "right",
    });
  }

  let lastLabel = "";
  for (let i = 0; i <= gridCols; i++) {
    const t = xMinT + ((xMaxT - xMinT) * i) / gridCols;
    const label = formatDayLabel(t, xMinT, xMaxT);
    if (label === lastLabel) continue;
    lastLabel = label;
    const x = chartX + (chartW * i) / gridCols;
    queueText({
      text: label,
      x: Math.round(x - s(10)),
      y: chartY + chartH + s(18),
      rgba: axisText,
      font: { sizePx: s(12), weight: 600 },
      align: "left",
    });
  }

  // Current price guide (red dashed line, ~50% opacity)
  const currentPrice = bars.length > 0 ? (bars[bars.length - 1]?.c ?? NaN) : NaN;
  if (Number.isFinite(currentPrice)) {
    const y = Math.round(yForPrice(currentPrice));
    const red = { r: 239, g: 68, b: 68, a: 128 };
    drawDashedHLine({
      img,
      x0: Math.round(chartX),
      x1: Math.round(chartX + chartW),
      y,
      dashPx: s(10),
      gapPx: s(6),
      rgba: red,
    });
  }

  // Candles
  const candleSlotW = Math.max(2, Math.floor(chartW / Math.max(10, bars.length)));
  const spacing = Math.max(0, Math.min(0.8, candleSpacingPct / 100));
  const candleBodyW = Math.max(1, Math.floor(candleSlotW * (1 - spacing)));
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
    const w = candleBodyW;
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
  const maxQty = Math.max(
    1,
    ...clusters.map((c) =>
      isFiniteNumber(c.totalAbsQty) && c.totalAbsQty > 0 ? c.totalAbsQty : 1,
    ),
  );
  const maxCount = Math.max(
    1,
    ...clusters.map((c) => (isFiniteNumber(c.count) && c.count > 0 ? c.count : 1)),
  );
  const fallbackT = isFiniteNumber(lastBar?.t) ? lastBar.t : args.toMs;
  const fallbackPrice = isFiniteNumber(lastBar?.c) ? lastBar.c : (lo + hi) / 2;
  for (const c of clusters) {
    const t = isFiniteNumber(c.avgOpenedAt) ? c.avgOpenedAt : fallbackT;
    const price = isFiniteNumber(c.avgEntryPrice) ? c.avgEntryPrice : fallbackPrice;
    const qty = isFiniteNumber(c.totalAbsQty) && c.totalAbsQty > 0 ? c.totalAbsQty : 1;
    const count = isFiniteNumber(c.count) && c.count > 0 ? c.count : 1;
    const cx = Math.round(xForT(t));
    let cy = Math.round(yForPrice(price));
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) continue;
    // Size primarily by cluster count (multiple users/positions), with qty as a secondary signal.
    const countPct = Math.max(0, Math.min(1, count / maxCount));
    const qtyPct = Math.max(0, Math.min(1, qty / maxQty));
    const sizePct = 0.7 * countPct + 0.3 * qtyPct;
    const r = Math.max(7, Math.min(20, Math.round(7 + 13 * sizePct)));
    const col =
      c.direction === "mixed" ? mixed : c.direction === "short" ? down : up;

    // Visual convention:
    // - long/buy dots below bars (lower on chart)
    // - short/sell dots above bars (higher on chart)
    // Mixed stays centered at entry.
    const offset = r + 6;
    if (c.direction === "short") cy -= offset;
    if (c.direction === "long") cy += offset;
    // clamp into chart area
    cy = Math.max(chartY + r + 2, Math.min(chartY + chartH - r - 2, cy));

    // Outline (improves visibility over candles)
    if (tradeIndicatorShape === "triangle") {
      const tipToCandle = c.direction === "short" ? 1 : c.direction === "long" ? -1 : 0;
      const tipY = cy + tipToCandle * (r + 1);
      const baseY = cy - tipToCandle * (r + 1);
      const halfW = Math.max(2, Math.round(r * 1.15));

      // Outline triangle
      fillTriangle(
        img,
        { x: cx, y: tipY },
        { x: cx - halfW, y: baseY },
        { x: cx + halfW, y: baseY },
        { r: 0, g: 0, b: 0, a: 200 },
      );
      // Inner triangle (slight inset)
      fillTriangle(
        img,
        { x: cx, y: tipY },
        { x: cx - Math.max(1, halfW - 2), y: baseY - tipToCandle * 2 },
        { x: cx + Math.max(1, halfW - 2), y: baseY - tipToCandle * 2 },
        { ...col, a: 220 },
      );
    } else {
      fillCircle(img, cx, cy, r + 2, { r: 0, g: 0, b: 0, a: 200 });
      fillCircle(img, cx, cy, r, { ...col, a: 220 });
    }
  }

  const drewWithCanvas = drawTextLayerWithCanvas(img, textOps);
  if (!drewWithCanvas) {
    // Fallback: bitmap text (blocky, but better than nothing)
    for (const op of textOps) {
      const scale = op.font.sizePx >= s(24) ? 3 * s(1) : op.font.sizePx >= s(14) ? 2 * s(1) : 2 * s(1);
      const txt = String(op.text).toUpperCase();
      if (op.shadow) {
        drawText5x7({
          img,
          text: txt,
          x: op.x + op.shadow.dx,
          y: op.y + op.shadow.dy,
          scale,
          rgba: op.shadow.rgba,
          align: op.align,
        });
      }
      drawText5x7({
        img,
        text: txt,
        x: op.x,
        y: op.y,
        scale,
        rgba: op.rgba,
        align: op.align,
      });
    }
  }

  return PNG.sync.write(img);
};

export const buildSnapshotPreview = async (ctx: any, args: any) => {
  const symbol = normalizeSymbol(String(args?.symbol ?? ""));
  const requestedOrgId = coerceString(args?.organizationId);
  const maxUsersRaw = Number(args?.maxUsers ?? 100);
  const maxUsers = Math.max(1, Math.min(500, Math.floor(maxUsersRaw)));
  const lookbackDaysRaw = Number(args?.lookbackDays ?? DEFAULT_SNAPSHOT_LOOKBACK_DAYS);
  const lookbackDays = Math.max(1, Math.min(30, Math.floor(lookbackDaysRaw)));
  const showSentimentBadge =
    typeof args?.showSentimentBadge === "boolean" ? args.showSentimentBadge : true;
  const themeModeRaw =
    typeof args?.themeMode === "string" ? String(args.themeMode).trim().toLowerCase() : "";
  const themeMode =
    themeModeRaw === "light" ? "light" : themeModeRaw === "custom" ? "custom" : "dark";
  const bgColor = typeof args?.bgColor === "string" ? String(args.bgColor) : undefined;
  const gridOpacityRaw = Number(args?.gridOpacity ?? NaN);
  const gridOpacity =
    Number.isFinite(gridOpacityRaw) ? Math.max(0, Math.min(0.25, gridOpacityRaw)) : undefined;
  const gridColor = typeof args?.gridColor === "string" ? String(args.gridColor) : undefined;
  const candleSpacingRaw = Number(args?.candleSpacingPct ?? NaN);
  const candleSpacingPct =
    Number.isFinite(candleSpacingRaw)
      ? Math.max(0, Math.min(80, Math.round(candleSpacingRaw)))
      : undefined;
  const candleUpColor =
    typeof args?.candleUpColor === "string" ? String(args.candleUpColor) : undefined;
  const candleDownColor =
    typeof args?.candleDownColor === "string" ? String(args.candleDownColor) : undefined;
  const tradeIndicatorShapeRaw =
    typeof args?.tradeIndicatorShape === "string"
      ? String(args.tradeIndicatorShape).trim().toLowerCase()
      : "";
  const tradeIndicatorShape =
    tradeIndicatorShapeRaw === "triangle" ? "triangle" : "circle";

  if (!symbol) {
    return {
      kind: "logs",
      logs: ["Missing symbol."],
    };
  }

  // Warm up canvas fonts (Convex runtime may have zero system fonts).
  // This can fetch/register a font once; do it before rendering.
  const canvasApi: any = tryGetCanvas(console);
  if (canvasApi) {
    await ensureCanvasFonts(canvasApi);
  }

  const now = Date.now();

  // Optional: mock preview mode for template previews/test-sends.
  // Generates deterministic bars + clusters (no pricedata fetch).
  if (args?.useMockData === true) {
    const stepMs = 15 * 60 * 1000;
    const toMsAligned = Math.floor(now / stepMs) * stepMs;
    const usedToMs = toMsAligned;
    const usedFromMs = Math.max(0, usedToMs - lookbackDays * DAY_MS);
    const fromMs30 = Math.max(0, usedToMs - 30 * DAY_MS);

    const mulberry32 = (seed: number) => {
      let t = seed >>> 0;
      return () => {
        t += 0x6d2b79f5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
      };
    };
    const seed =
      Math.abs(
        Array.from(symbol).reduce((acc, ch) => acc + ch.charCodeAt(0) * 31, 0) +
          Math.floor(now / DAY_MS),
      ) | 0;
    const rnd = mulberry32(seed);

    type MockBar = Bar;
    const barsAll: MockBar[] = [];
    const startT = Math.floor(fromMs30 / stepMs) * stepMs;
    const endT = usedToMs;

    // More realistic-ish price action:
    // - random walk with volatility "clustering"
    // - trend regimes that shift every few days
    // - occasional impulse candles
    let price = 90000 + (rnd() - 0.5) * 500;
    let vol = 90; // typical 15m volatility in dollars
    let volTarget = 110;
    let drift = 0;

    const barsPerDay = Math.round(DAY_MS / stepMs);
    const regimeBars = barsPerDay * 3; // change regime every ~3 days
    let i = 0;
    for (let t = startT; t <= endT; t += stepMs) {
      if (i % regimeBars === 0) {
        // Drift in dollars per candle (small)
        drift = (rnd() - 0.5) * 22;
        volTarget = 70 + rnd() * 170;
      }

      // Mean-reverting volatility with a bit of noise
      vol = vol * 0.985 + volTarget * 0.015 + (rnd() - 0.5) * 4;
      vol = Math.max(25, Math.min(280, vol));

      const open = price;
      const noise = (rnd() - 0.5) * vol * 0.55;
      let close = open + drift + noise;

      // Rare impulse candle
      if (rnd() < 0.003) {
        close += (rnd() - 0.5) * vol * 10;
      }

      // Wicks: keep most candles modest, with occasional longer "sweep" wicks.
      // This avoids the constant spiky look.
      const wickFrac = 0.12 + rnd() * 0.28; // 12%..40% of vol
      let wickBase = Math.max(10, vol * wickFrac);
      const sweep = rnd() < 0.02; // ~2% of candles have a longer wick
      if (sweep) wickBase *= 2.8;
      wickBase = Math.min(wickBase, 240);

      const high = Math.max(open, close) + rnd() * wickBase;
      const low = Math.min(open, close) - rnd() * wickBase;

      price = close;

      if (t >= fromMs30 && t <= usedToMs) {
        barsAll.push({
          t,
          o: open,
          h: high,
          l: low,
          c: close,
          v: Math.round(50 + rnd() * 950),
        });
      }
      i++;
    }

    // Slice to the requested lookback window for drawing,
    // but keep axis window anchored to today.
    const bars = barsAll.filter((b) => b.t >= usedFromMs && b.t <= usedToMs);

    // Mock clusters: one buy near daily low and one sell near daily high.
    const byDay: Record<
      string,
      { hi: number; lo: number; tHi: number; tLo: number } | undefined
    > = {};
    for (const b of bars) {
      const d = new Date(b.t);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      const row = byDay[key];
      if (!row) {
        byDay[key] = { hi: b.h, lo: b.l, tHi: b.t, tLo: b.t };
        continue;
      }
      if (b.h > row.hi) {
        row.hi = b.h;
        row.tHi = b.t;
      }
      if (b.l < row.lo) {
        row.lo = b.l;
        row.tLo = b.t;
      }
    }
    const clusters: {
      count: number;
      direction: "long" | "short" | "mixed";
      avgEntryPrice: number;
      avgOpenedAt: number;
      totalAbsQty: number;
    }[] = [];
    for (const key of Object.keys(byDay)) {
      const row = byDay[key];
      if (!row) continue;
      // Buy cluster at low
      clusters.push({
        direction: "long",
        count: 1 + Math.floor(rnd() * 5),
        totalAbsQty: 0.4 + rnd() * 2.2,
        avgEntryPrice: row.lo + rnd() * 60,
        avgOpenedAt: row.tLo,
      });
      // Sell cluster at high
      clusters.push({
        direction: "short",
        count: 1 + Math.floor(rnd() * 5),
        totalAbsQty: 0.4 + rnd() * 2.2,
        avgEntryPrice: row.hi - rnd() * 60,
        avgOpenedAt: row.tHi,
      });
    }

    const consensus = computeConsensus(
      clusters.map((c) => ({
        direction: c.direction,
        count: c.count,
        totalAbsQty: c.totalAbsQty,
      })),
    );
    const timeframeLabel = "M15";

    const pngBytes = renderSnapshotPng({
      symbol,
      timeframeLabel,
      consensus: consensus.label,
      showSentimentBadge,
      themeMode,
      bgColor,
      gridOpacity,
      gridColor,
      candleSpacingPct,
      candleUpColor,
      candleDownColor,
      tradeIndicatorShape,
      bars,
      clusters,
      now,
      fromMs: usedFromMs,
      toMs: usedToMs,
    });
    const base64 = Buffer.from(pngBytes).toString("base64");

    return {
      kind: "image",
      contentType: "image/png",
      filename: `${symbol}-snapshot.png`,
      base64,
      meta: {
        symbol,
        sourceKey: "mock",
        tradableInstrumentId: "mock",
        bars: bars.length,
        usersAllowed: 0,
        openPositions: clusters.length,
        usersScanned: 0,
        organizationId: requestedOrgId,
        dataLagMs: null,
        fromMs: usedFromMs,
        toMs: usedToMs,
      },
    };
  }

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
  const fromMs = now - lookbackDays * DAY_MS;
  // pricedata chunks are indexed by `chunkStartMs >= fromMs`. If chunks overlap the window
  // but start before `fromMs` (common for day-aligned chunks), we'd miss them.
  // Pad the query window back a bit to reliably include the overlapping chunk(s).
  const queryFromMs = Math.max(0, fromMs - 2 * DAY_MS);
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
    usedFromMs = Math.max(0, usedToMs - lookbackDays * DAY_MS);
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

  const clustersPreview = Array.isArray(clusters)
    ? clusters.slice(0, 3).map((c: any) => ({
        direction:
          c?.direction === "short" || c?.direction === "mixed" ? c.direction : "long",
        count: Number(c?.count ?? 0),
        avgEntryPrice: Number(c?.avgEntryPrice ?? NaN),
        avgOpenedAt: Number(c?.avgOpenedAt ?? NaN),
        totalAbsQty: Number(c?.totalAbsQty ?? NaN),
      }))
    : [];

  const consensus = computeConsensus(
    (Array.isArray(clusters) ? clusters : []).map((c: any) => ({
      direction: c?.direction === "short" || c?.direction === "mixed" ? c.direction : "long",
      count: Number(c?.count ?? 1),
      totalAbsQty: Number(c?.totalAbsQty ?? 0),
    })),
  );

  // Currently fixed resolution in this preview: 15m bars.
  const timeframeLabel = "M15";

  const pngBytes = renderSnapshotPng({
    symbol,
    timeframeLabel,
    consensus: consensus.label,
    showSentimentBadge,
    themeMode,
    bgColor,
    gridOpacity,
    gridColor,
    candleSpacingPct,
    candleUpColor,
    candleDownColor,
    tradeIndicatorShape,
    bars,
    clusters,
    now,
    fromMs: usedFromMs,
    toMs: usedToMs,
  });
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
      lookbackDays,
      usedFromMs,
      usedToMs,
      xMinT: usedFromMs,
      xMaxT: usedToMs,
      latestBarT,
      dataLagMs,
      clustersPreview,
      consensus: consensus.label,
      timeframeLabel,
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

export const runSendSnapshotToDiscord = async (ctx: any, args: any) => {
  const guildId = coerceString(args?.guildId);
  const channelId = coerceString(args?.channelId);
  const symbol = normalizeSymbol(String(args?.symbol ?? ""));
  const maxUsersRaw = Number(args?.maxUsers ?? 100);
  const maxUsers = Math.max(1, Math.min(500, Math.floor(maxUsersRaw)));
  const lookbackDaysRaw = Number(args?.lookbackDays ?? DEFAULT_SNAPSHOT_LOOKBACK_DAYS);
  const lookbackDays = Math.max(1, Math.min(30, Math.floor(lookbackDaysRaw)));

  if (!guildId || !channelId || !symbol) {
    return { kind: "logs", logs: ["Missing guildId, channelId, or symbol."] };
  }

  // Resolve which org owns this guild connection so we can resolve bot credentials.
  const guildConn = await ctx.runQuery(
    components.launchthat_discord.guildConnections.queries.getGuildConnectionByGuildId,
    { guildId },
  );
  const organizationId =
    guildConn && typeof guildConn.organizationId === "string"
      ? String(guildConn.organizationId).trim()
      : "";
  const guildName =
    guildConn && typeof guildConn.guildName === "string"
      ? String(guildConn.guildName).trim()
      : "";
  if (!organizationId) {
    return {
      kind: "logs",
      logs: ["Guild is not connected (no organizationId found for guildId)."],
      data: { guildId },
    };
  }

  // IMPORTANT: use the same snapshot aggregation as PNG preview (do NOT scope to org).
  const preview = await buildSnapshotPreview(ctx, { symbol, maxUsers, lookbackDays });
  if (preview.kind !== "image") {
    return {
      kind: "logs",
      logs: ["Snapshot preview failed (no image output)."],
      data: preview,
    };
  }

  let botToken = "";
  try {
    botToken = await resolveOrgBotTokenForOrgPlatformTest(ctx, organizationId);
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

  const method = "POST";
  const url = `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`;

  const res = await discordMultipart({
    botToken,
    method,
    url,
    payloadJson,
    file: { name: "snapshot.png", bytes, contentType: "image/png" },
  });

  if (!res.ok) {
    const err = `Discord ${method} failed: ${res.status} ${res.text}`.slice(0, 800);
    return { kind: "logs", logs: [err], data: { organizationId, guildId, guildName, channelId } };
  }

  const messageId = coerceDiscordMessageId(res.json);
  if (!messageId) {
    return {
      kind: "logs",
      logs: ["Discord request succeeded but response did not include message id."],
      data: res.json,
    };
  }

  return {
    kind: "logs",
    logs: [
      `✅ Snapshot sent`,
      `Org: ${organizationId}`,
      `Guild: ${guildName ? `${guildName} (${guildId})` : guildId}`,
      `Channel: ${channelId}`,
      `Message: ${messageId}`,
      `Method: ${method}`,
    ],
    data: { organizationId, guildId, channelId, messageId, meta },
  };
};

export const previewSendEmail = (args: any) => {
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

export const runSendEmail = async (ctx: any, args: any) => {
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

export const previewDiscordBroadcast = async (ctx: any, args: any) => {
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

export const runDiscordBroadcast = async (ctx: any, args: any) => {
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

export const fetchDiscordGuildChannelsForPlatformTestsImpl = async (ctx: any, args: { guildId: string }) => {
  await requirePlatformAdmin(ctx);
  const guildId = coerceString(args.guildId);
  if (!guildId) {
    return { ok: false, guildId: "", channels: [], error: "Missing guildId." };
  }

  const guildConn = await ctx.runQuery(
    components.launchthat_discord.guildConnections.queries.getGuildConnectionByGuildId,
    { guildId },
  );
  const organizationId =
    guildConn && typeof guildConn.organizationId === "string"
      ? String(guildConn.organizationId).trim()
      : "";
  const guildName =
    guildConn && typeof guildConn.guildName === "string"
      ? String(guildConn.guildName).trim()
      : "";

  if (!organizationId) {
    return {
      ok: false,
      guildId,
      channels: [],
      error: "Guild is not connected (no organizationId found).",
    };
  }

  let botToken = "";
  try {
    botToken = await resolveOrgBotTokenForOrgPlatformTest(ctx, organizationId);
  } catch (e) {
    return {
      ok: false,
      guildId,
      organizationId,
      guildName: guildName || undefined,
      channels: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }

  const url = `https://discord.com/api/v10/guilds/${encodeURIComponent(guildId)}/channels`;
  const httpRes = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bot ${botToken}` },
  });
  if (!httpRes.ok) {
    const text = await httpRes.text().catch(() => "");
    return {
      ok: false,
      guildId,
      organizationId,
      guildName: guildName || undefined,
      channels: [],
      error: `Discord API failed: ${httpRes.status} ${text.slice(0, 400)}`,
    };
  }

  const json: any = await httpRes.json().catch(() => null);
  const list = Array.isArray(json) ? json : [];
  // Keep it simple for the test UI: text + announcement channels only.
  const allowedTypes = new Set<number>([0, 5]);
  const channels = list
    .map((c) => ({
      id: typeof c?.id === "string" ? String(c.id) : "",
      name: typeof c?.name === "string" ? String(c.name) : "",
      type: typeof c?.type === "number" ? Number(c.type) : -1,
    }))
    .filter((c) => c.id && c.name && allowedTypes.has(c.type))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    ok: true,
    guildId,
    organizationId,
    guildName: guildName || undefined,
    channels,
  };
};

