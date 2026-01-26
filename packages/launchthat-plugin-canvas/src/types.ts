export type Logger = {
  log: (...args: unknown[]) => void;
};

export type Rgba = { r: number; g: number; b: number; a: number };

export type TextAlign = "left" | "right";

export type TextStyle = {
  sizePx: number;
  weight?: number;
  family?: string;
};

export type TextShadow = {
  dx: number;
  dy: number;
  blurPx: number;
  rgba: Rgba;
};

export type TextOp = {
  text: string;
  x: number;
  y: number;
  align?: TextAlign;
  rgba: Rgba;
  font: TextStyle;
  shadow?: TextShadow;
};

