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
import * as fs from "node:fs";
import * as path from "node:path";

// Avoid typed imports here (can cause TS deep instantiation errors).
const components: any = require("../_generated/api").components;
const api: any = require("../_generated/api").api;
const internal: any = require("../_generated/api").internal;

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_SNAPSHOT_LOOKBACK_DAYS = 3;
const isFiniteNumber = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

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

/**
 * Platform test helper: resolve a bot token even if the org hasn't explicitly enabled Discord yet.
 * This is safe because `/platform/tests` is platform-admin only.
 */
const resolveOrgBotTokenForOrgPlatformTest = async (
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

const drawDashedHLine = (args: {
  img: PNG;
  x0: number;
  x1: number;
  y: number;
  dashPx: number;
  gapPx: number;
  rgba: { r: number; g: number; b: number; a: number };
}) => {
  const { img, x0, x1, y, rgba } = args;
  const dashPx = Math.max(1, Math.floor(args.dashPx));
  const gapPx = Math.max(0, Math.floor(args.gapPx));
  const left = Math.min(x0, x1);
  const right = Math.max(x0, x1);
  let x = left;
  while (x <= right) {
    const segEnd = Math.min(right, x + dashPx);
    drawLine(img, x, y, segEnd, y, rgba);
    x = segEnd + gapPx;
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

// Minimal bitmap font (5x7) for axis labels (digits + a few symbols).
// This keeps the PNG generator dependency-free (no canvas).
const FONT_5x7: Record<string, string[]> = {
  // Letters (uppercase)
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],

  "0": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["01110", "10001", "00001", "00110", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00110", "00110"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "/": ["00001", "00010", "00100", "01000", "10000", "00000", "00000"],
  ":": ["00000", "00110", "00110", "00000", "00110", "00110", "00000"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};
const BLANK_GLYPH = ["00000", "00000", "00000", "00000", "00000", "00000", "00000"];

const drawChar5x7 = (
  img: PNG,
  ch: string,
  x: number,
  y: number,
  scale: number,
  rgba: { r: number; g: number; b: number; a: number },
) => {
  const glyph = FONT_5x7[ch] ?? BLANK_GLYPH;
  const s = Math.max(1, Math.floor(scale));
  for (let row = 0; row < glyph.length; row++) {
    const line = glyph[row] ?? "";
    for (let col = 0; col < line.length; col++) {
      if (line.charAt(col) !== "1") continue;
      fillRect(img, x + col * s, y + row * s, s, s, rgba);
    }
  }
};

// Bitmap text function retained only as a last-resort fallback when canvas is unavailable.
// (Normally we use @napi-rs/canvas for anti-aliased text.)
const drawText5x7 = (args: {
  img: PNG;
  text: string;
  x: number;
  y: number;
  scale: number;
  rgba: { r: number; g: number; b: number; a: number };
  align?: "left" | "right";
}) => {
  const { img, text, y, scale, rgba } = args;
  const s = Math.max(1, Math.floor(scale));
  const charW = 5 * s;
  const gap = 1 * s;
  const width = text.length > 0 ? text.length * charW + (text.length - 1) * gap : 0;
  const xStart = args.align === "right" ? Math.round(args.x - width) : Math.round(args.x);
  let x = xStart;
  for (const ch of text) {
    drawChar5x7(img, ch, x, Math.round(y), s, rgba);
    x += charW + gap;
  }
};

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

// Better text rendering (anti-aliased) via @napi-rs/canvas.
// NOTE: `@napi-rs/canvas` must be listed in `convex.json` under `node.externalPackages`
// so Convex doesn't try to bundle its native `.node` binary.
let didLogCanvasLoad = false;
let didLogCanvasAlphaZero = false;
let ensureCanvasFontsPromise: Promise<boolean> | null = null;
let snapshotFontBytes: Buffer | null = null;

const parseFamilies = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
  if (raw && typeof raw === "object" && Buffer.isBuffer(raw)) {
    try {
      const asJson = JSON.parse(raw.toString("utf8")) as unknown;
      return Array.isArray(asJson) ? asJson.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  }
  if (raw && typeof raw === "object" && raw instanceof Uint8Array) {
    try {
      const asJson = JSON.parse(Buffer.from(raw).toString("utf8")) as unknown;
      return Array.isArray(asJson) ? asJson.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
};

const downloadSnapshotFont = async (): Promise<Buffer | null> => {
  if (snapshotFontBytes) return snapshotFontBytes;
  const urls: string[] = [
    // Roboto Regular (hinted TTF)
    // NOTE: github.com/google/fonts doesn't expose Roboto TTFs directly anymore; use roboto-2 repo.
    "https://raw.githubusercontent.com/googlefonts/roboto-2/main/src/hinted/Roboto-Regular.ttf",
    // Alternate mirror
    "https://raw.githubusercontent.com/openmaptiles/fonts/master/roboto/Roboto-Regular.ttf",
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.log("[snapshot_png][canvas] font_download_failed", { url, status: res.status });
        continue;
      }
      const ab = await res.arrayBuffer();
      // Safety: don't download giant files.
      if (ab.byteLength <= 0 || ab.byteLength > 2_500_000) {
        console.log("[snapshot_png][canvas] font_download_bad_size", { url, bytes: ab.byteLength });
        continue;
      }
      snapshotFontBytes = Buffer.from(ab);
      console.log("[snapshot_png][canvas] font_download_ok", { url, bytes: snapshotFontBytes.byteLength });
      return snapshotFontBytes;
    } catch (err) {
      console.log("[snapshot_png][canvas] font_download_error", {
        url,
        error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
      });
    }
  }

  return null;
};

const ensureCanvasFonts = async (canvasApi: any): Promise<boolean> => {
  if (ensureCanvasFontsPromise) return await ensureCanvasFontsPromise;

  ensureCanvasFontsPromise = (async () => {
    const gf: any = canvasApi?.GlobalFonts;
    if (!gf) {
      console.log("[snapshot_png][canvas] no_GlobalFonts");
      return false;
    }

    const safeGetFamilies = (): string[] => {
      try {
        const f = gf.getFamilies?.();
        return parseFamilies(f);
      } catch {
        return [];
      }
    };

    const before = safeGetFamilies();

    try {
      gf.loadSystemFonts?.();
    } catch (err) {
      console.log("[snapshot_png][canvas] loadSystemFonts_error", {
        error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
      });
    }

    let families = safeGetFamilies();

    // If Convex runtime has fonts on disk but no fontconfig discovery,
    // try registering common Linux font paths manually.
    if (families.length === 0) {
      const candidates: string[] = [
        // Debian/Ubuntu common
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
        // Noto locations (varies)
        "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
        "/usr/share/fonts/noto/NotoSans-Regular.ttf",
      ];

      for (const p of candidates) {
        try {
          if (!fs.existsSync(p)) continue;
          gf.registerFromPath?.(p, "SnapshotFont");
          break;
        } catch (err) {
          console.log("[snapshot_png][canvas] registerFromPath_error", {
            path: p,
            error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
          });
        }
      }

      families = safeGetFamilies();
    }

    // Convex containers often have zero fonts. If still empty, download a font and register it.
    // Prefer registerFromPath to avoid GlobalFonts.register(Buffer) lifecycle pitfalls.
    let didRegisterDownloaded = false;
    if (families.length === 0) {
      try {
        const bytes = await downloadSnapshotFont();
        if (bytes) {
          const tmpPath = path.join("/tmp", "snapshot-font.ttf");
          try {
            fs.writeFileSync(tmpPath, bytes);
            gf.registerFromPath?.(tmpPath, "SnapshotFont");
            didRegisterDownloaded = true;
          } catch (err) {
            console.log("[snapshot_png][canvas] write_or_register_tmp_error", {
              tmpPath,
              error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
            });
            // As a backup, try the Buffer API if available.
            try {
              gf.register?.(bytes);
              didRegisterDownloaded = true;
            } catch (err2) {
              console.log("[snapshot_png][canvas] register_buffer_error", {
                error: err2 instanceof Error ? { name: err2.name, message: err2.message } : String(err2),
              });
            }
          }
        }
      } catch (err) {
        console.log("[snapshot_png][canvas] font_download_or_register_error", {
          error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
        });
      }

      families = safeGetFamilies();
    }

    // Sanity check text measurement.
    let measureWidth = -1;
    try {
      const c = canvasApi.createCanvas(10, 10);
      const ctx = c.getContext("2d");
      ctx.font = "700 14px SnapshotFont, sans-serif";
      measureWidth = Number(ctx.measureText("BTCUSD").width) || 0;
    } catch (err) {
      console.log("[snapshot_png][canvas] measureText_error", {
        error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
      });
    }

    console.log("[snapshot_png][canvas] fonts_status", {
      familiesBefore: before.slice(0, 10),
      familiesAfter: families.slice(0, 10),
      familyCount: families.length,
      measureWidth,
      didRegisterDownloaded,
    });

    return families.length > 0 && measureWidth > 0;
  })();

  const ok = await ensureCanvasFontsPromise;
  // Allow retry if we still couldn't load/register a font.
  if (!ok) ensureCanvasFontsPromise = null;
  return ok;
};

const tryGetCanvas = (): any => {
  try {
    const mod = require("@napi-rs/canvas");
    if (!didLogCanvasLoad) {
      didLogCanvasLoad = true;
      console.log("[snapshot_png][canvas] loaded", {
        platform: process.platform,
        arch: process.arch,
        node: process.version,
        hasCreateCanvas: typeof mod?.createCanvas === "function",
        hasGlobalFonts: typeof mod?.GlobalFonts === "object",
      });
    }
    return mod;
  } catch (err) {
    if (!didLogCanvasLoad) {
      didLogCanvasLoad = true;
      console.log("[snapshot_png][canvas] failed_to_load", {
        platform: process.platform,
        arch: process.arch,
        node: process.version,
        error: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : String(err),
      });
    }
    return null;
  }
};

interface TextOp {
  text: string;
  x: number;
  y: number;
  align: "left" | "right";
  rgba: { r: number; g: number; b: number; a: number };
  font: { sizePx: number; weight: number };
  shadow?: { dx: number; dy: number; rgba: { r: number; g: number; b: number; a: number }; blurPx: number };
}

const rgbaToCss = (c: { r: number; g: number; b: number; a: number }) =>
  `rgba(${c.r},${c.g},${c.b},${Math.max(0, Math.min(1, c.a / 255))})`;

const drawTextLayerWithCanvas = (img: PNG, ops: TextOp[]) => {
  try {
    const canvasApi: any = tryGetCanvas();
    if (!canvasApi) return false;
    if (!Array.isArray(ops) || ops.length === 0) return true;

    const canvas = canvasApi.createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, img.width, img.height);
    ctx.textBaseline = "top";

    // Use common system fonts available on Linux; fall back to generic sans.
    const fontStack =
      'SnapshotFont, DejaVu Sans, Arial, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, sans-serif';

    let firstMetrics:
      | {
          text: string;
          font: string;
          measuredWidth: number;
          x: number;
          y: number;
        }
      | null = null;

    for (const op of ops) {
      const text = op.text;
      if (!text) continue;

      const size = Math.max(10, Math.min(64, Math.floor(op.font.sizePx)));
      const weight = Math.max(100, Math.min(900, Math.floor(op.font.weight)));
      // @napi-rs/canvas is stricter than browsers about font parsing and available fonts.
      // If we measure 0 width, retry with generic sans-serif to force a fallback.
      ctx.font = `${weight} ${size}px ${fontStack}`;
      ctx.fillStyle = rgbaToCss(op.rgba);

      if (op.shadow) {
        ctx.shadowColor = rgbaToCss(op.shadow.rgba);
        ctx.shadowBlur = Math.max(0, Math.min(40, op.shadow.blurPx));
        ctx.shadowOffsetX = Math.max(-20, Math.min(20, op.shadow.dx));
        ctx.shadowOffsetY = Math.max(-20, Math.min(20, op.shadow.dy));
      } else {
        ctx.shadowColor = "rgba(0,0,0,0)";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      let m = ctx.measureText(text);
      if (!Number.isFinite(m.width) || m.width <= 0) {
        ctx.font = `${weight} ${size}px sans-serif`;
        m = ctx.measureText(text);
      }

      if (!firstMetrics) {
        firstMetrics = {
          text,
          font: String(ctx.font ?? ""),
          measuredWidth: Number(m.width) || 0,
          x: op.x,
          y: op.y,
        };
      }
      const x = op.align === "right" ? op.x - m.width : op.x;
      ctx.fillText(text, x, op.y);
    }

    const overlay = ctx.getImageData(0, 0, img.width, img.height).data;

    // If no alpha was drawn at all, treat as failure and fall back.
    let alphaSum = 0;
    for (let i = 3; i < overlay.length; i += 4) alphaSum += overlay[i] ?? 0;
    if (alphaSum === 0) {
      if (!didLogCanvasAlphaZero) {
        didLogCanvasAlphaZero = true;
        const first = ops.find((o) => Boolean(o.text)) ?? null;
        console.log("[snapshot_png][canvas] alpha_zero_fallback", {
          opsCount: ops.length,
          firstMetrics,
          globalFontsFamilies:
            canvasApi?.GlobalFonts?.getFamilies && typeof canvasApi.GlobalFonts.getFamilies === "function"
              ? canvasApi.GlobalFonts.getFamilies()
              : null,
          firstOp: first
            ? {
                text: first.text,
                x: first.x,
                y: first.y,
                align: first.align,
                rgba: first.rgba,
                font: first.font,
                shadow: first.shadow ?? null,
              }
            : null,
        });
      }
      return false;
    }

    for (let i = 0; i < overlay.length; i += 4) {
      const a = overlay[i + 3] / 255;
      if (a <= 0) continue;
      img.data[i] = Math.round(overlay[i] * a + img.data[i] * (1 - a));
      img.data[i + 1] = Math.round(overlay[i + 1] * a + img.data[i + 1] * (1 - a));
      img.data[i + 2] = Math.round(overlay[i + 2] * a + img.data[i + 2] * (1 - a));
      img.data[i + 3] = 255;
    }

    return true;
  } catch (err) {
    console.log("[snapshot_png][canvas] render_error_fallback", {
      error: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : String(err),
    });
    return false;
  }
};

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

  // Theme
  const bg = hexToRgb("#0B1020");
  const grid = { r: 255, g: 255, b: 255, a: Math.round(255 * 0.06) };
  const axisText = { r: 255, g: 255, b: 255, a: Math.round(255 * 0.78) };
  const up = hexToRgb("#22C55E");
  const down = hexToRgb("#EF4444");
  const ma = hexToRgb("#60A5FA");
  const mixed = hexToRgb("#A78BFA");

  // Background
  fillRect(img, 0, 0, width, height, { ...bg, a: 255 });

  // Header overlay (TradingView-ish)
  const headerH = s(56);
  fillRect(img, 0, 0, width, headerH, { r: 0, g: 0, b: 0, a: 120 });
  drawLine(img, 0, headerH, width, headerH, { r: 255, g: 255, b: 255, a: 28 });

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
    rgba: { r: 255, g: 255, b: 255, a: 255 },
    font: { sizePx: s(28), weight: 800 },
    shadow: { dx: 0, dy: s(2), blurPx: s(6), rgba: { r: 0, g: 0, b: 0, a: 170 } },
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

  queueText({
    text: consensusText,
    x: width - s(28),
    y: s(12),
    rgba: consensusColor,
    font: { sizePx: s(26), weight: 900 },
    shadow: { dx: 0, dy: s(2), blurPx: s(6), rgba: { r: 0, g: 0, b: 0, a: 170 } },
    align: "right",
  });

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
  const currentPrice = bars.length > 0 ? bars[bars.length - 1]!.c : NaN;
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
    fillCircle(img, cx, cy, r + 2, { r: 0, g: 0, b: 0, a: 200 });
    fillCircle(img, cx, cy, r, { ...col, a: 220 });
  }

  const drewWithCanvas = drawTextLayerWithCanvas(img, textOps);
  if (!drewWithCanvas) {
    // Fallback: bitmap text (blocky, but better than nothing)
    for (const op of textOps) {
    const scale =
      op.font.sizePx >= s(24) ? 3 * s(1) : op.font.sizePx >= s(14) ? 2 * s(1) : 2 * s(1);
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

const buildSnapshotPreview = async (ctx: any, args: any) => {
  const symbol = normalizeSymbol(String(args?.symbol ?? ""));
  const requestedOrgId = coerceString(args?.organizationId);
  const maxUsersRaw = Number(args?.maxUsers ?? 100);
  const maxUsers = Math.max(1, Math.min(500, Math.floor(maxUsersRaw)));
  const lookbackDaysRaw = Number(args?.lookbackDays ?? DEFAULT_SNAPSHOT_LOOKBACK_DAYS);
  const lookbackDays = Math.max(1, Math.min(30, Math.floor(lookbackDaysRaw)));

  if (!symbol) {
    return {
      kind: "logs",
      logs: ["Missing symbol."],
    };
  }

  // Warm up canvas fonts (Convex runtime may have zero system fonts).
  // This can fetch/register a font once; do it before rendering.
  const canvasApi: any = tryGetCanvas();
  if (canvasApi) {
    await ensureCanvasFonts(canvasApi);
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

const runSendSnapshotToDiscord = async (ctx: any, args: any) => {
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

export const fetchDiscordGuildChannelsForPlatformTests = action({
  args: {
    guildId: v.string(),
  },
  returns: v.object({
    ok: v.boolean(),
    guildId: v.string(),
    organizationId: v.optional(v.string()),
    guildName: v.optional(v.string()),
    channels: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        type: v.number(),
      }),
    ),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
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
  },
});

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

