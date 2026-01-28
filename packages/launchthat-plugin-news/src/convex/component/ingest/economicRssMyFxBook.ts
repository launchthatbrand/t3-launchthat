import { normalizeTitleKey, safeText } from "./lib";

export type EconomicImpact = "low" | "medium" | "high";

export type EconomicValues = {
  previous?: string;
  forecast?: string;
  actual?: string;
};

const stripHtml = (value: string): string => {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const extractCountrySlugFromUrl = (url: string): string | null => {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p.toLowerCase() === "forex-economic-calendar");
    if (idx >= 0 && typeof parts[idx + 1] === "string" && parts[idx + 1]!.trim()) {
      return parts[idx + 1]!.trim().toLowerCase();
    }
    // Some variants may omit the segment; best-effort: take the first non-empty slug.
    if (parts.length >= 2 && parts[0] && parts[1]) return String(parts[0]).toLowerCase();
    return null;
  } catch {
    return null;
  }
};

const COUNTRY_SLUG_TO_CCY: Record<string, { country: string; currency: string }> = {
  "united-states": { country: "United States", currency: "USD" },
  usa: { country: "United States", currency: "USD" },
  "euro-area": { country: "Euro Area", currency: "EUR" },
  "euro-zone": { country: "Euro Zone", currency: "EUR" },
  germany: { country: "Germany", currency: "EUR" },
  france: { country: "France", currency: "EUR" },
  italy: { country: "Italy", currency: "EUR" },
  spain: { country: "Spain", currency: "EUR" },
  greece: { country: "Greece", currency: "EUR" },
  slovenia: { country: "Slovenia", currency: "EUR" },
  cyprus: { country: "Cyprus", currency: "EUR" },
  ireland: { country: "Ireland", currency: "EUR" },
  "united-kingdom": { country: "United Kingdom", currency: "GBP" },
  uk: { country: "United Kingdom", currency: "GBP" },
  japan: { country: "Japan", currency: "JPY" },
  canada: { country: "Canada", currency: "CAD" },
  australia: { country: "Australia", currency: "AUD" },
  "new-zealand": { country: "New Zealand", currency: "NZD" },
  switzerland: { country: "Switzerland", currency: "CHF" },
  china: { country: "China", currency: "CNY" },
  "hong-kong": { country: "Hong Kong", currency: "HKD" },
  sweden: { country: "Sweden", currency: "SEK" },
  norway: { country: "Norway", currency: "NOK" },
  denmark: { country: "Denmark", currency: "DKK" },
  singapore: { country: "Singapore", currency: "SGD" },
  "sri-lanka": { country: "Sri Lanka", currency: "LKR" },
  mexico: { country: "Mexico", currency: "MXN" },
  malaysia: { country: "Malaysia", currency: "MYR" },
  uzbekistan: { country: "Uzbekistan", currency: "UZS" },
  zambia: { country: "Zambia", currency: "ZMW" },
  hungary: { country: "Hungary", currency: "HUF" },
  "south-africa": { country: "South Africa", currency: "ZAR" },
  india: { country: "India", currency: "INR" },
  brazil: { country: "Brazil", currency: "BRL" },
  turkey: { country: "Turkey", currency: "TRY" },
  "saudi-arabia": { country: "Saudi Arabia", currency: "SAR" },
  bahrain: { country: "Bahrain", currency: "BHD" },
  armenia: { country: "Armenia", currency: "AMD" },
  ghana: { country: "Ghana", currency: "GHS" },
  mozambique: { country: "Mozambique", currency: "MZN" },
  colombia: { country: "Colombia", currency: "COP" },
  russia: { country: "Russia", currency: "RUB" },
  "russian-federation": { country: "Russia", currency: "RUB" },
};

export const countrySlugToCurrency = (
  slug: string,
): { country?: string; currency?: string } => {
  const key = safeText(slug).toLowerCase();
  if (!key) return {};
  const mapped = COUNTRY_SLUG_TO_CCY[key];
  if (!mapped) return {};
  return { country: mapped.country, currency: mapped.currency };
};

export const extractImpactFromDescriptionHtml = (html: string): EconomicImpact | undefined => {
  const s = html.toLowerCase();
  if (s.includes("sprite-high-impact")) return "high";
  if (s.includes("sprite-medium-impact")) return "medium";
  if (s.includes("sprite-low-impact")) return "low";
  return undefined;
};

export const extractEconomicValuesFromDescriptionHtml = (html: string): EconomicValues => {
  // MyFxBook economic calendar embeds a table with header row then a data row:
  // [Time left, Impact, Previous, Consensus, Actual]
  const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const cells: string[] = [];
  for (const m of html.matchAll(tdRe)) {
    const raw = m[1] ?? "";
    const text = stripHtml(String(raw));
    cells.push(text);
  }
  // If we captured multiple rows, values may include header-like noise; take the last 5-ish cells.
  // Best-effort: find a window that looks like [prev, forecast, actual].
  if (cells.length >= 5) {
    const prev = cells[cells.length - 3] || "";
    const forecast = cells[cells.length - 2] || "";
    const actual = cells[cells.length - 1] || "";
    return {
      previous: prev || undefined,
      forecast: forecast || undefined,
      actual: actual || undefined,
    };
  }
  return {};
};

export const computeCanonicalKeyEconomicFromParts = (args: {
  title: string;
  startsAt: number;
  country?: string;
  currency?: string;
}): string => {
  const titleKey = normalizeTitleKey(args.title);
  const country = safeText(args.country).toUpperCase() || "UNK";
  const currency = safeText(args.currency).toUpperCase() || "UNK";
  return `econ:${country}:${currency}:${titleKey}:${Math.floor(args.startsAt)}`;
};

