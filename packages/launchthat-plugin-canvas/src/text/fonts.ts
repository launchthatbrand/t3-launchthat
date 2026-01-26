import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import type { Logger } from "../types";

let ensureCanvasFontsPromise: Promise<boolean> | null = null;
let downloadedFontBytes: Buffer | null = null;

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

const downloadFallbackFont = async (logger: Logger): Promise<Buffer | null> => {
  if (downloadedFontBytes) return downloadedFontBytes;

  const urls: string[] = [
    // Roboto Regular (hinted TTF)
    "https://raw.githubusercontent.com/googlefonts/roboto-2/main/src/hinted/Roboto-Regular.ttf",
    "https://raw.githubusercontent.com/openmaptiles/fonts/master/roboto/Roboto-Regular.ttf",
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        logger.log("[launchthat-canvas] font_download_failed", { url, status: res.status });
        continue;
      }
      const ab = await res.arrayBuffer();
      if (ab.byteLength <= 0 || ab.byteLength > 2_500_000) {
        logger.log("[launchthat-canvas] font_download_bad_size", { url, bytes: ab.byteLength });
        continue;
      }
      downloadedFontBytes = Buffer.from(ab);
      logger.log("[launchthat-canvas] font_download_ok", { url, bytes: downloadedFontBytes.byteLength });
      return downloadedFontBytes;
    } catch (err) {
      logger.log("[launchthat-canvas] font_download_error", {
        url,
        error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
      });
    }
  }

  return null;
};

const getBundledRobotoPath = (): string => {
  // NOTE: This package is ESM (`type: module`), so resolve relative to import.meta.url.
  const here = path.dirname(fileURLToPath(import.meta.url));
  // here = <pkg>/src/text → bundled asset lives at <pkg>/assets/fonts
  return path.resolve(here, "../../../assets/fonts/Roboto-Regular.ttf");
};

export const ensureCanvasFonts = async (canvasApi: any, opts?: { logger?: Logger }): Promise<boolean> => {
  const logger: Logger = opts?.logger ?? console;

  if (ensureCanvasFontsPromise) return await ensureCanvasFontsPromise;

  ensureCanvasFontsPromise = (async () => {
    const gf: any = canvasApi?.GlobalFonts;
    if (!gf) {
      logger.log("[launchthat-canvas] no_GlobalFonts");
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

    // Prefer bundled font first (no-network).
    try {
      const bundledPath = getBundledRobotoPath();
      if (fs.existsSync(bundledPath)) {
        gf.registerFromPath?.(bundledPath, "SnapshotFont");
      }
    } catch (err) {
      logger.log("[launchthat-canvas] bundled_font_register_error", {
        error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
      });
    }

    try {
      gf.loadSystemFonts?.();
    } catch (err) {
      logger.log("[launchthat-canvas] loadSystemFonts_error", {
        error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
      });
    }

    let families = safeGetFamilies();

    // If runtime has fonts on disk but no fontconfig discovery, try common Linux paths.
    if (families.length === 0) {
      const candidates: string[] = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
        "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
        "/usr/share/fonts/noto/NotoSans-Regular.ttf",
      ];

      for (const p of candidates) {
        try {
          if (!fs.existsSync(p)) continue;
          gf.registerFromPath?.(p, "SnapshotFont");
          break;
        } catch (err) {
          logger.log("[launchthat-canvas] registerFromPath_error", {
            path: p,
            error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
          });
        }
      }

      families = safeGetFamilies();
    }

    // If still empty, download a font and register it.
    let didRegisterDownloaded = false;
    if (families.length === 0) {
      try {
        const bytes = await downloadFallbackFont(logger);
        if (bytes) {
          const tmpPath = path.join("/tmp", "launchthat-snapshot-font.ttf");
          try {
            fs.writeFileSync(tmpPath, bytes);
            gf.registerFromPath?.(tmpPath, "SnapshotFont");
            didRegisterDownloaded = true;
          } catch (err) {
            logger.log("[launchthat-canvas] write_or_register_tmp_error", {
              tmpPath,
              error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
            });
            // As a backup, try the Buffer API if available.
            try {
              gf.register?.(bytes);
              didRegisterDownloaded = true;
            } catch (err2) {
              logger.log("[launchthat-canvas] register_buffer_error", {
                error: err2 instanceof Error ? { name: err2.name, message: err2.message } : String(err2),
              });
            }
          }
        }
      } catch (err) {
        logger.log("[launchthat-canvas] font_download_or_register_error", {
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
      logger.log("[launchthat-canvas] measureText_error", {
        error: err instanceof Error ? { name: err.name, message: err.message } : String(err),
      });
    }

    logger.log("[launchthat-canvas] fonts_status", {
      familiesBefore: before.slice(0, 10),
      familiesAfter: families.slice(0, 10),
      familyCount: families.length,
      measureWidth,
      didRegisterDownloaded,
    });

    return families.length > 0 && measureWidth > 0;
  })();

  const ok = await ensureCanvasFontsPromise;
  if (!ok) ensureCanvasFontsPromise = null;
  return ok;
};

