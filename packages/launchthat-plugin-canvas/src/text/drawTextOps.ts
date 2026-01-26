import type { PNG } from "pngjs";

import type { Logger, TextOp } from "../types";
import { drawText5x7 } from "./bitmapFont5x7";
import { drawTextLayerWithCanvas } from "./canvasText";

export const drawTextOpsToPng = (
  img: PNG,
  ops: TextOp[],
  opts?: {
    logger?: Logger;
    bitmapFallbackScale?: number;
  },
): {
  drewWithCanvas: boolean;
} => {
  const logger: Logger = opts?.logger ?? console;

  const drewWithCanvas = drawTextLayerWithCanvas(img, ops, { logger });
  if (drewWithCanvas) return { drewWithCanvas: true };

  // Last-resort bitmap fallback: render each op as 5x7.
  const scale = Math.max(1, Math.floor(opts?.bitmapFallbackScale ?? 2));
  for (const op of ops) {
    if (!op.text) continue;
    drawText5x7({
      img,
      text: op.text,
      x: Math.round(op.x),
      y: Math.round(op.y),
      scale,
      rgba: op.rgba,
      align: op.align,
    });
  }

  return { drewWithCanvas: false };
};

