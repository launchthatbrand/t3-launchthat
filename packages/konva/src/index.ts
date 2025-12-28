export { default as Konva } from "konva";
export {
  Group,
  Image as KonvaImage,
  Layer,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva";

export type PageSize = { width: number; height: number };

type PdfJsModule = typeof import("pdfjs-dist");

export const loadPdfJs = async (): Promise<PdfJsModule> => {
  const mod = (await import("pdfjs-dist")) as PdfJsModule;
  // Configure worker (Next bundler-friendly).
  try {
    const candidates = [
      "pdfjs-dist/build/pdf.worker.min.mjs",
      "pdfjs-dist/build/pdf.worker.min.js",
      "pdfjs-dist/build/pdf.worker.js",
    ];
    for (const candidate of candidates) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (mod as any).GlobalWorkerOptions.workerSrc = new URL(
          candidate,
          import.meta.url,
        ).toString();
        break;
      } catch {
        // Try next candidate.
      }
    }
  } catch {
    // If worker config fails, pdf.js may still work in some environments.
  }
  return mod;
};

export const toPdfJsUrl = (
  rawUrl: string,
  opts?: { proxyPath?: string },
): string => {
  const proxyPath = opts?.proxyPath ?? "/api/pdf-proxy";
  try {
    const u = new URL(rawUrl);
    // Proxy cross-origin URLs through the app origin to avoid CORS/range issues in pdf.js.
    if (typeof window !== "undefined" && u.origin !== window.location.origin) {
      return `${proxyPath}?url=${encodeURIComponent(u.toString())}`;
    }
    return u.toString();
  } catch {
    return rawUrl;
  }
};

export const computePageOffsets = (
  pageSizes: PageSize[],
  gapPx: number,
  scale: number,
): { offsetsBase: number[]; totalHeightBase: number; gapBase: number } => {
  const safeScale = scale > 0 ? scale : 1;
  const gapBase = gapPx / safeScale;
  const offsets: number[] = [];
  let y = 0;
  for (let i = 0; i < pageSizes.length; i++) {
    offsets[i] = y;
    y += (pageSizes[i]?.height ?? 0) + gapBase;
  }
  if (y > 0) y -= gapBase;
  return { offsetsBase: offsets, totalHeightBase: Math.max(1, y), gapBase };
};

export const createImageCache = () => {
  const cache = new Map<string, HTMLImageElement | null>();
  return {
    get: (dataUrl: string, onLoad?: () => void): HTMLImageElement | null => {
      const existing = cache.get(dataUrl);
      if (existing) return existing;
      if (existing === null) return null;
      const img = new window.Image();
      img.src = dataUrl;
      img.onload = () => {
        cache.set(dataUrl, img);
        onLoad?.();
      };
      cache.set(dataUrl, null);
      return null;
    },
  };
};


