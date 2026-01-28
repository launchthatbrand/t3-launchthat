export type NewsSourceKind = "rss" | "economic_calendar_api";

export type NewsEventType = "headline" | "economic";

export type EconomicImpact = "low" | "medium" | "high";

export type NewsSourceConfigRss = {
  url: string;
  // Optional identifier used for provenance display.
  label?: string;
  // Optional: scope all items from this feed to a fixed symbol.
  // (Useful for symbol-specific RSS feeds.)
  forcedSymbol?: string;
};

export type NewsSourceConfigEconomicCalendarApi = {
  url: string;
  label?: string;
  // Expected JSON shape:
  // [{ title, country?, currency?, impact?, startsAtMs, symbols?: string[] }]
  // You can layer adapters later without schema changes.
};

export type NewsSourceConfig = NewsSourceConfigRss | NewsSourceConfigEconomicCalendarApi;

export type NewsSourceCursorState = {
  // Common incremental fetch controls.
  lastSuccessAt?: number;
  etag?: string;
  lastModified?: string;
  // For JSON APIs.
  sinceMs?: number;
};

