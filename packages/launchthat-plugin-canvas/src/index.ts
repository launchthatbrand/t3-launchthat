/**
 * launchthat-plugin-canvas
 *
 * Node-only helpers for generating PNGs with optional anti-aliased text via
 * `@napi-rs/canvas`. Intended to be used from Convex Node actions ("use node").
 */

export type { Logger, Rgba, TextAlign, TextOp, TextShadow, TextStyle } from "./types";

export { drawDashedHLine, drawLine, fillCircle, fillRect, hexToRgb, setPixel } from "./png/primitives";

export { drawText5x7 } from "./text/bitmapFont5x7";
export { drawTextOpsToPng } from "./text/drawTextOps";
export { drawTextLayerWithCanvas, tryGetCanvas } from "./text/canvasText";
export { ensureCanvasFonts } from "./text/fonts";

