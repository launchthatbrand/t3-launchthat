import { v } from "convex/values";
import { internalMutation, internalQuery } from "../server";
import { bucketMs, normalizeTitleKey, normalizeUrl } from "./lib";

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

export const applyRssItemsChunk = internalMutation({
  args: {
    sourceId: v.id("newsSources"),
    sourceKey: v.string(),
    nowMs: v.number(),
    supportedSymbols: v.array(v.string()),
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

    let createdRaw = 0;
    let createdEvents = 0;
    let updatedEvents = 0;
    let symbolLinksWritten = 0;
    let dedupedEvents = 0;

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

      const canonicalKey = computeCanonicalKeyHeadline({
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
        await ctx.db.patch(existingEvent._id, {
          title,
          summary:
            typeof item.summary === "string" && item.summary.trim()
              ? item.summary
              : existingEvent.summary,
          publishedAt,
          updatedAt: Date.now(),
        });
        updatedEvents += 1;
        dedupedEvents += 1;
        eventId = existingEvent._id;
      } else {
        eventId = await ctx.db.insert("newsEvents", {
          eventType: "headline",
          canonicalKey,
          title,
          summary: typeof item.summary === "string" ? item.summary : undefined,
          publishedAt,
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
      const symbolsFromPayload = Array.isArray(item.payloadSymbols) ? item.payloadSymbols : [];
      const toIndex = [
        ...(forced ? [forced] : []),
        ...symbolsFromPayload,
      ]
        .map((s) => String(s).trim().toUpperCase())
        .filter((s) => s && supported.has(s));

      for (const sym of toIndex) {
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
          at: publishedAt,
          matchKind: forced ? "forced" : "source",
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

