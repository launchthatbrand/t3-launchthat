import type { PNG } from "pngjs";
import { createRequire } from "node:module";

import type { Logger, Rgba, TextOp } from "../types";

const require = createRequire(import.meta.url);

let didLogCanvasLoad = false;
let didLogCanvasAlphaZero = false;

const rgbaToCss = (c: Rgba) => `rgba(${c.r},${c.g},${c.b},${Math.max(0, Math.min(1, c.a / 255))})`;

export const tryGetCanvas = (logger: Logger): any | null => {
  try {
    const mod = require("@napi-rs/canvas");
    if (!didLogCanvasLoad) {
      didLogCanvasLoad = true;
      logger.log("[launchthat-canvas] canvas_loaded", {
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
      logger.log("[launchthat-canvas] canvas_failed_to_load", {
        platform: process.platform,
        arch: process.arch,
        node: process.version,
        error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
      });
    }
    return null;
  }
};

/**
 * Draw `TextOp`s into a temporary canvas and alpha-blend into a PNG.
 * Returns true if canvas drawing succeeded; false triggers a fallback.
 */
export const drawTextLayerWithCanvas = (img: PNG, ops: TextOp[], opts?: { logger?: Logger }): boolean => {
  const logger: Logger = opts?.logger ?? console;

  try {
    const canvasApi: any = tryGetCanvas(logger);
    if (!canvasApi) return false;
    if (!Array.isArray(ops) || ops.length === 0) return true;

    const canvas = canvasApi.createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, img.width, img.height);
    ctx.textBaseline = "top";

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

      const size = Math.max(10, Math.min(96, Math.floor(op.font.sizePx)));
      const weight = Math.max(100, Math.min(900, Math.floor(op.font.weight ?? 400)));

      ctx.font = `${weight} ${size}px ${fontStack}`;
      ctx.fillStyle = rgbaToCss(op.rgba);

      if (op.shadow) {
        ctx.shadowColor = rgbaToCss(op.shadow.rgba);
        ctx.shadowBlur = Math.max(0, Math.min(60, op.shadow.blurPx));
        ctx.shadowOffsetX = Math.max(-40, Math.min(40, op.shadow.dx));
        ctx.shadowOffsetY = Math.max(-40, Math.min(40, op.shadow.dy));
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

      const align = op.align ?? "left";
      const x = align === "right" ? op.x - m.width : op.x;
      ctx.fillText(text, x, op.y);
    }

    const overlay = ctx.getImageData(0, 0, img.width, img.height).data;

    let alphaSum = 0;
    for (let i = 3; i < overlay.length; i += 4) alphaSum += overlay[i] ?? 0;
    if (alphaSum === 0) {
      if (!didLogCanvasAlphaZero) {
        didLogCanvasAlphaZero = true;
        const first = ops.find((o) => Boolean(o.text)) ?? null;
        logger.log("[launchthat-canvas] alpha_zero_fallback", {
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
                align: first.align ?? "left",
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
      const a = (overlay[i + 3] ?? 0) / 255;
      if (a <= 0) continue;
      const baseR = img.data[i] ?? 0;
      const baseG = img.data[i + 1] ?? 0;
      const baseB = img.data[i + 2] ?? 0;
      img.data[i] = Math.round((overlay[i] ?? 0) * a + baseR * (1 - a));
      img.data[i + 1] = Math.round((overlay[i + 1] ?? 0) * a + baseG * (1 - a));
      img.data[i + 2] = Math.round((overlay[i + 2] ?? 0) * a + baseB * (1 - a));
      img.data[i + 3] = 255;
    }

    return true;
  } catch (err) {
    logger.log("[launchthat-canvas] render_error_fallback", {
      error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
    });
    return false;
  }
};

