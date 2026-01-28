import { bucketMs, normalizeTitleKey, normalizeUrl } from "./lib";
import {
  computeCanonicalKeyEconomicFromParts,
  countrySlugToCurrency,
  extractCountrySlugFromUrl,
  extractEconomicValuesFromDescriptionHtml,
  extractImpactFromDescriptionHtml,
} from "./economicRssMyFxBook";
import { internalMutation, internalQuery } from "../server";

import { classifyByRules } from "./ruleTagging";
import { extractSymbolsDeterministic } from "./symbolExtract";
import { v } from "convex/values";

export const getSource = internalQuery({
  args: { sourceId: v.id("newsSources") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("newsSources"),
      sourceKey: v.string(),
      kind: v.string(),
      cadenceSeconds: v.number(),
      overlapSeconds: v.number(),
      nextRunAt: v.number(),
      config: v.any(),
      cursor: v.optional(v.any()),
    }),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.sourceId);
    if (!row) return null;
    return {
      _id: row._id,
      sourceKey: String(row.sourceKey ?? ""),
      kind: String(row.kind ?? ""),
      cadenceSeconds: Number(row.cadenceSeconds ?? 0),
      overlapSeconds: Number(row.overlapSeconds ?? 0),
      nextRunAt: Number(row.nextRunAt ?? 0),
      config: row.config,
      cursor: row.cursor,
    };
  },
});

export const startRun = internalMutation({
  args: { sourceId: v.id("newsSources"), sourceKey: v.string(), kind: v.string(), startedAt: v.number() },
  returns: v.id("newsIngestRuns"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("newsIngestRuns", {
      sourceId: args.sourceId,
      sourceKey: args.sourceKey,
      kind: args.kind,
      startedAt: args.startedAt,
    });
  },
});

export const finishRun = internalMutation({
  args: {
    runId: v.id("newsIngestRuns"),
    ok: v.boolean(),
    createdRaw: v.number(),
    createdEvents: v.number(),
    updatedEvents: v.number(),
    symbolLinksWritten: v.number(),
    dedupedEvents: v.number(),
    lastError: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, {
      endedAt: Date.now(),
      ok: args.ok,
      createdRaw: args.createdRaw,
      createdEvents: args.createdEvents,
      updatedEvents: args.updatedEvents,
      symbolLinksWritten: args.symbolLinksWritten,
      dedupedEvents: args.dedupedEvents,
      lastError: typeof args.lastError === "string" ? args.lastError : undefined,
    });
    return null;
  },
});

type RssNormalizedItem = {
  externalId?: string;
  url?: string;
  urlNormalized?: string;
  title?: string;
  summary?: string;
  publishedAt?: number;
  payload?: unknown;
  forcedSymbol?: string;
  payloadSymbols?: string[];
};

const computeCanonicalKeyHeadline = (args: {
  urlNormalized: string | null;
  title: string;
  publishedAt: number;
}): string => {
  if (args.urlNormalized) return `headline:url:${args.urlNormalized}`;
  const titleKey = normalizeTitleKey(args.title);
  const bucket = bucketMs(args.publishedAt, 5 * 60 * 1000);
  return `headline:title:${titleKey}:${bucket}`;
};

const computeCanonicalKeyEconomicRss = (args: {
  urlNormalized: string | null;
  title: string;
  startsAt: number;
}): string => {
  // Backward-compatible fallback for economic feeds when we cannot parse country/currency.
  if (args.urlNormalized) return `econrss:url:${args.urlNormalized}`;
  const titleKey = normalizeTitleKey(args.title);
  const bucket = bucketMs(args.startsAt, 5 * 60 * 1000);
  return `econrss:title:${titleKey}:${bucket}`;
};

export const applyRssItemsChunk = internalMutation({
  args: {
    sourceId: v.id("newsSources"),
    sourceKey: v.string(),
    nowMs: v.number(),
    supportedSymbols: v.array(v.string()),
    assetAliasMap: v.optional(v.record(v.string(), v.string())),
    disabledAliases: v.optional(v.array(v.string())),
    eventTypeHint: v.optional(v.string()),
    items: v.array(
      v.object({
        externalId: v.optional(v.string()),
        url: v.optional(v.string()),
        urlNormalized: v.optional(v.string()),
        title: v.optional(v.string()),
        summary: v.optional(v.string()),
        publishedAt: v.optional(v.number()),
        payload: v.optional(v.any()),
        forcedSymbol: v.optional(v.string()),
        payloadSymbols: v.optional(v.array(v.string())),
      }),
    ),
    // cursor updates
    cursorPatch: v.optional(v.any()),
    nextRunAt: v.number(),
  },
  returns: v.object({
    createdRaw: v.number(),
    createdEvents: v.number(),
    updatedEvents: v.number(),
    symbolLinksWritten: v.number(),
    dedupedEvents: v.number(),
  }),
  handler: async (ctx, args) => {
    const supported = new Set(
      (Array.isArray(args.supportedSymbols) ? args.supportedSymbols : [])
        .map((s) => String(s).trim().toUpperCase())
        .filter(Boolean),
    );
    const assetAliasMap: Record<string, string> =
      args.assetAliasMap && typeof args.assetAliasMap === "object"
        ? (args.assetAliasMap as Record<string, string>)
        : {};
    const disabledAliases = new Set(
      (Array.isArray(args.disabledAliases) ? args.disabledAliases : [])
        .map((s) => String(s).trim().toUpperCase())
        .filter(Boolean),
    );

    let createdRaw = 0;
    let createdEvents = 0;
    let updatedEvents = 0;
    let symbolLinksWritten = 0;
    let dedupedEvents = 0;

    const hint =
      String(args.eventTypeHint ?? "")
        .trim()
        .toLowerCase() === "economic"
        ? ("economic" as const)
        : ("headline" as const);

    const list: RssNormalizedItem[] = Array.isArray(args.items) ? (args.items as any) : [];
    for (const item of list) {
      const externalId = typeof item.externalId === "string" ? item.externalId : undefined;
      const url = typeof item.url === "string" ? item.url : undefined;
      const urlNormalizedRaw =
        typeof item.urlNormalized === "string" ? item.urlNormalized : undefined;
      const urlNormalized = urlNormalizedRaw ? normalizeUrl(urlNormalizedRaw) : undefined;

      if (!externalId && !urlNormalized) continue;

      const existingRaw = urlNormalized
        ? await ctx.db
          .query("newsRawItems")
          .withIndex("by_sourceId_urlNormalized", (q) =>
            (q as any).eq("sourceId", args.sourceId).eq("urlNormalized", urlNormalized),
          )
          .first()
        : null;
      if (existingRaw) continue;

      await ctx.db.insert("newsRawItems", {
        sourceId: args.sourceId,
        sourceKey: args.sourceKey,
        kind: "rss",
        externalId,
        url,
        urlNormalized,
        title: typeof item.title === "string" ? item.title : undefined,
        summary: typeof item.summary === "string" ? item.summary : undefined,
        publishedAt:
          typeof item.publishedAt === "number" && Number.isFinite(item.publishedAt)
            ? item.publishedAt
            : undefined,
        payload: item.payload ?? null,
        ingestedAt: Date.now(),
      });
      createdRaw += 1;

      const title = typeof item.title === "string" && item.title.trim() ? item.title : "Untitled";
      const publishedAt =
        typeof item.publishedAt === "number" && Number.isFinite(item.publishedAt)
          ? item.publishedAt
          : args.nowMs;
      const startsAt = hint === "economic" ? publishedAt : undefined;

      const econCountryCurrency =
        hint === "economic" && url
          ? countrySlugToCurrency(extractCountrySlugFromUrl(url) ?? "")
          : {};
      const econImpact =
        hint === "economic" && typeof item.summary === "string"
          ? extractImpactFromDescriptionHtml(item.summary)
          : undefined;
      const econValues =
        hint === "economic" && typeof item.summary === "string"
          ? extractEconomicValuesFromDescriptionHtml(item.summary)
          : {};

      const canonicalKey =
        hint === "economic"
          ? computeCanonicalKeyEconomicFromParts({
            title,
            startsAt: publishedAt,
            country: econCountryCurrency.country,
            currency: econCountryCurrency.currency,
          })
          : computeCanonicalKeyHeadline({
            urlNormalized: urlNormalized ?? null,
            title,
            publishedAt,
          });

      const existingEvent = await ctx.db
        .query("newsEvents")
        .withIndex("by_canonicalKey", (q) => (q as any).eq("canonicalKey", canonicalKey))
        .first();

      let eventId;
      if (existingEvent) {
        const existingMeta = (existingEvent as any).meta;
        const existingClassification = existingMeta?.classification;
        const shouldClassify =
          !existingClassification || existingClassification?.version !== "v1" || existingClassification?.method !== "rules";
        const classification = shouldClassify ? classifyByRules({ title, summary: typeof item.summary === "string" ? item.summary : undefined }) : null;

        const shouldWriteEconomic =
          hint === "economic" &&
          (typeof (existingEvent as any).currency !== "string" ||
            typeof (existingEvent as any).country !== "string" ||
            typeof (existingEvent as any).impact !== "string" ||
            !(existingMeta as any)?.economic);

        await ctx.db.patch(existingEvent._id, {
          eventType: hint,
          title,
          summary:
            typeof item.summary === "string" && item.summary.trim()
              ? item.summary
              : existingEvent.summary,
          publishedAt: hint === "economic" ? undefined : publishedAt,
          startsAt: hint === "economic" ? startsAt : undefined,
          country: shouldWriteEconomic ? econCountryCurrency.country : (existingEvent as any).country,
          currency: shouldWriteEconomic ? econCountryCurrency.currency : (existingEvent as any).currency,
          impact: shouldWriteEconomic ? econImpact : (existingEvent as any).impact,
          updatedAt: Date.now(),
          meta: classification
            ? {
              ...(typeof existingMeta === "object" && existingMeta ? existingMeta : {}),
              classification,
              ...(hint === "economic"
                ? {
                  economic: {
                    ...(typeof (existingMeta as any)?.economic === "object" && (existingMeta as any)?.economic
                      ? (existingMeta as any).economic
                      : {}),
                    ...(econValues ?? {}),
                    source: "myfxbook",
                  },
                }
                : {}),
            }
            : existingMeta,
        });
        updatedEvents += 1;
        dedupedEvents += 1;
        eventId = existingEvent._id;
      } else {
        const classification = classifyByRules({
          title,
          summary: typeof item.summary === "string" ? item.summary : undefined,
        });
        const baseMeta =
          hint === "economic"
            ? {
              classification,
              economic: {
                ...(econValues ?? {}),
                source: "myfxbook",
              },
            }
            : { classification };

        eventId = await ctx.db.insert("newsEvents", {
          eventType: hint,
          canonicalKey,
          title,
          summary: typeof item.summary === "string" ? item.summary : undefined,
          publishedAt: hint === "economic" ? undefined : publishedAt,
          startsAt: hint === "economic" ? startsAt : undefined,
          country: hint === "economic" ? econCountryCurrency.country : undefined,
          currency: hint === "economic" ? econCountryCurrency.currency : undefined,
          impact: hint === "economic" ? econImpact : undefined,
          meta: baseMeta,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        createdEvents += 1;
      }

      await ctx.db.insert("newsEventSources", {
        eventId,
        sourceId: args.sourceId,
        sourceKey: args.sourceKey,
        url,
        externalId,
        createdAt: Date.now(),
      });

      const forced = typeof item.forcedSymbol === "string" ? item.forcedSymbol.trim() : "";
      // Deterministic symbol linking.
      // 1) forcedSymbol override (if provided)
      // 2) explicit extraction from title/summary (exact/pair/alias)
      const extracted = extractSymbolsDeterministic({
        title,
        summary: typeof item.summary === "string" ? item.summary : undefined,
        supportedSymbols: supported,
        assetAliasMap,
        disabledAliases,
        maxLinks: 5,
      });
      const toIndex = [
        ...(forced ? [{ symbol: forced.toUpperCase(), matchKind: "forced", matchText: forced }] : []),
        ...extracted,
      ];

      for (const row of toIndex.slice(0, 5)) {
        const sym = String((row as any).symbol ?? "").trim().toUpperCase();
        if (!sym || !supported.has(sym)) continue;
        const existingLink = await ctx.db
          .query("newsEventSymbols")
          .withIndex("by_eventId_symbol", (q) =>
            (q as any).eq("eventId", eventId).eq("symbol", sym),
          )
          .first();
        if (existingLink) continue;
        await ctx.db.insert("newsEventSymbols", {
          eventId,
          symbol: sym,
          at: hint === "economic" && typeof startsAt === "number" ? startsAt : publishedAt,
          matchKind:
            typeof (row as any).matchKind === "string"
              ? String((row as any).matchKind)
              : forced
                ? "forced"
                : "unknown",
        });
        symbolLinksWritten += 1;
      }
    }

    // Update source cursor/nextRunAt.
    await ctx.db.patch(args.sourceId, {
      cursor: args.cursorPatch ?? undefined,
      nextRunAt: args.nextRunAt,
      updatedAt: Date.now(),
    });

    return { createdRaw, createdEvents, updatedEvents, symbolLinksWritten, dedupedEvents };
  },
});

export const listEventIdsForSourceSince = internalQuery({
  args: {
    sourceId: v.id("newsSources"),
    sinceMs: v.number(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.id("newsEvents")),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(2000, Number(args.limit ?? 500)));
    const rows = await ctx.db
      .query("newsEventSources")
      .withIndex("by_sourceId_createdAt", (q) =>
        (q as any).eq("sourceId", args.sourceId).gte("createdAt", args.sinceMs),
      )
      .order("desc")
      .take(limit);
    const list = Array.isArray(rows) ? rows : [];
    const set = new Set<string>();
    const out: any[] = [];
    for (const r of list) {
      const id = (r as any).eventId;
      const key = String(id);
      if (!key || set.has(key)) continue;
      set.add(key);
      out.push(id);
    }
    return out;
  },
});

export const reprocessEventDeterministic = internalMutation({
  args: {
    eventId: v.id("newsEvents"),
    supportedSymbols: v.array(v.string()),
    assetAliasMap: v.optional(v.record(v.string(), v.string())),
    disabledAliases: v.optional(v.array(v.string())),
  },
  returns: v.object({
    symbolLinksAdded: v.number(),
    wroteClassification: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const e = await ctx.db.get(args.eventId);
    if (!e) return { symbolLinksAdded: 0, wroteClassification: false };

    const supported = new Set(
      (Array.isArray(args.supportedSymbols) ? args.supportedSymbols : [])
        .map((s) => String(s).trim().toUpperCase())
        .filter(Boolean),
    );
    const assetAliasMap: Record<string, string> =
      args.assetAliasMap && typeof args.assetAliasMap === "object"
        ? (args.assetAliasMap as Record<string, string>)
        : {};
    const disabledAliases = new Set(
      (Array.isArray(args.disabledAliases) ? args.disabledAliases : [])
        .map((s) => String(s).trim().toUpperCase())
        .filter(Boolean),
    );

    const title = String((e as any).title ?? "");
    const summary = typeof (e as any).summary === "string" ? (e as any).summary : undefined;
    const eventType = String((e as any).eventType ?? "");

    const sourceRow =
      eventType === "economic"
        ? await ctx.db
          .query("newsEventSources")
          .withIndex("by_eventId", (q) => (q as any).eq("eventId", args.eventId))
          .first()
        : null;
    const sourceUrl = sourceRow && typeof (sourceRow as any).url === "string" ? (sourceRow as any).url : "";
    const econCountryCurrency =
      eventType === "economic" && sourceUrl
        ? countrySlugToCurrency(extractCountrySlugFromUrl(sourceUrl) ?? "")
        : {};
    const econImpact =
      eventType === "economic" && typeof summary === "string"
        ? extractImpactFromDescriptionHtml(summary)
        : undefined;
    const econValues =
      eventType === "economic" && typeof summary === "string"
        ? extractEconomicValuesFromDescriptionHtml(summary)
        : {};

    // Always recompute rule classification v1 (overwrite).
    const classification = classifyByRules({ title, summary });
    const prevMeta = (e as any).meta;
    await ctx.db.patch(args.eventId, {
      meta: {
        ...(typeof prevMeta === "object" && prevMeta ? prevMeta : {}),
        classification,
        ...(eventType === "economic"
          ? {
            economic: {
              ...(typeof prevMeta === "object" && prevMeta ? (prevMeta as any).economic : {}),
              ...(econValues ?? {}),
              source: "myfxbook",
            },
          }
          : {}),
      },
      ...(eventType === "economic"
        ? {
          country: econCountryCurrency.country,
          currency: econCountryCurrency.currency,
          impact: econImpact,
        }
        : {}),
      updatedAt: Date.now(),
    });

    const extracted = extractSymbolsDeterministic({
      title,
      summary,
      supportedSymbols: supported,
      assetAliasMap,
      disabledAliases,
      maxLinks: 5,
    });

    const at =
      typeof (e as any).publishedAt === "number"
        ? (e as any).publishedAt
        : typeof (e as any).startsAt === "number"
          ? (e as any).startsAt
          : Date.now();

    let symbolLinksAdded = 0;
    for (const row of extracted) {
      const sym = String(row.symbol).trim().toUpperCase();
      if (!sym || !supported.has(sym)) continue;
      const existingLink = await ctx.db
        .query("newsEventSymbols")
        .withIndex("by_eventId_symbol", (q) =>
          (q as any).eq("eventId", args.eventId).eq("symbol", sym),
        )
        .first();
      if (existingLink) continue;
      await ctx.db.insert("newsEventSymbols", {
        eventId: args.eventId,
        symbol: sym,
        at,
        matchKind: row.matchKind,
      });
      symbolLinksAdded += 1;
    }

    return { symbolLinksAdded, wroteClassification: true };
  },
});

