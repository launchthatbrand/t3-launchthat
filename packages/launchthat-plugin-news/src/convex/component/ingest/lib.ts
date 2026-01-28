const normalizeWhitespace = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

export const normalizeSymbol = (value: string): string =>
  value.trim().toUpperCase();

export const normalizeUrl = (value: string): string => {
  try {
    const u = new URL(value);
    // Strip common tracking params.
    const toDelete = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "gclid",
      "fbclid",
    ];
    for (const k of toDelete) u.searchParams.delete(k);
    u.hash = "";
    return u.toString();
  } catch {
    return value.trim();
  }
};

export const normalizeTitleKey = (value: string): string =>
  normalizeWhitespace(value).toLowerCase();

export const safeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export const parseDateMs = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.floor(value);
  if (typeof value !== "string") return null;
  const d = new Date(value);
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : null;
};

export const bucketMs = (ms: number, bucketSizeMs: number): number => {
  const b = Math.max(1, Math.floor(bucketSizeMs));
  return Math.floor(ms / b) * b;
};

