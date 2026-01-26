import type { PNG } from "pngjs";
import type { Rgba } from "../types";

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
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

export const setPixel = (img: PNG, x: number, y: number, rgba: Rgba) => {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const idx = (img.width * y + x) << 2;
  img.data[idx] = rgba.r;
  img.data[idx + 1] = rgba.g;
  img.data[idx + 2] = rgba.b;
  img.data[idx + 3] = rgba.a;
};

export const fillRect = (img: PNG, x: number, y: number, w: number, h: number, rgba: Rgba) => {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(img.width, x + w);
  const y1 = Math.min(img.height, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) setPixel(img, xx, yy, rgba);
  }
};

export const drawLine = (img: PNG, x0: number, y0: number, x1: number, y1: number, rgba: Rgba) => {
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

export const drawDashedHLine = (args: {
  img: PNG;
  x0: number;
  x1: number;
  y: number;
  dashPx: number;
  gapPx: number;
  rgba: Rgba;
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

export const fillCircle = (img: PNG, cx: number, cy: number, r: number, rgba: Rgba) => {
  const rr = r * r;
  for (let y = -r; y <= r; y++) {
    const yy = cy + y;
    const xxSpan = Math.floor(Math.sqrt(Math.max(0, rr - y * y)));
    for (let x = -xxSpan; x <= xxSpan; x++) {
      setPixel(img, cx + x, yy, rgba);
    }
  }
};

