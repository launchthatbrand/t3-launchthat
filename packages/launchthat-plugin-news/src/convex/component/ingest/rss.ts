import { XMLParser } from "fast-xml-parser";
import { normalizeUrl, parseDateMs, safeText } from "./lib";

type RssItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  guid?: string | { "#text"?: string };
};

export type ParsedRssItem = {
  externalId: string | null;
  url: string | null;
  urlNormalized: string | null;
  title: string | null;
  summary: string | null;
  publishedAt: number | null;
  payload: unknown;
};

const toStringGuid = (guid: unknown): string => {
  if (typeof guid === "string") return guid.trim();
  if (guid && typeof guid === "object") {
    const obj = guid as { "#text"?: unknown };
    return typeof obj["#text"] === "string" ? obj["#text"].trim() : "";
  }
  return "";
};

export const parseRssXml = (xml: string): ParsedRssItem[] => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    // Many feeds include HTML in descriptions; keep it as text.
    removeNSPrefix: true,
  });
  const doc = parser.parse(xml) as any;
  const channel = doc?.rss?.channel ?? doc?.feed ?? null;
  const rawItems = channel?.item ?? channel?.entry ?? [];
  const arr: any[] = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  const out: ParsedRssItem[] = [];
  for (const row of arr) {
    const r = row as RssItem;
    const title = safeText((r as any)?.title);
    const link =
      typeof (r as any)?.link === "string"
        ? (r as any).link
        : typeof (r as any)?.link?.["@_href"] === "string"
          ? String((r as any).link["@_href"])
          : "";
    const guid = toStringGuid((r as any)?.guid);
    const pubDate = parseDateMs((r as any)?.pubDate ?? (r as any)?.published);
    const description = safeText((r as any)?.description ?? (r as any)?.summary);

    const url = link.trim() || null;
    const urlNormalized = url ? normalizeUrl(url) : null;
    const externalId = guid || urlNormalized || null;

    out.push({
      externalId,
      url,
      urlNormalized,
      title: title || null,
      summary: description || null,
      publishedAt: pubDate,
      payload: row,
    });
  }

  return out;
};

