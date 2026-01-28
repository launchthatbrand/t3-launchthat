import { v } from "convex/values";
import { action } from "../server";
import { parseRssXml } from "./rss";
import { bucketMs, normalizeSymbol, normalizeTitleKey, normalizeUrl, safeText } from "./lib";
import { internal } from "../_generated/api";

type IngestResult = {
  ok: boolean;
  sourceId: string;
  sourceKey: string;
  kind: string;
  createdRaw: number;
  createdEvents: number;
  updatedEvents: number;
  symbolLinksWritten: number;
  dedupedEvents: number;
  createdEventIds: string[];
  error?: string;
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

const computeCanonicalKeyEconomic = (args: {
  title: string;
  country: string;
  currency: string;
  startsAt: number;
}): string => {
  const titleKey = normalizeTitleKey(args.title);
  const country = args.country.trim().toUpperCase();
  const currency = args.currency.trim().toUpperCase();
  return `econ:${country}:${currency}:${titleKey}:${args.startsAt}`;
};

export const ingestSource = action({
  args: {
    sourceId: v.id("newsSources"),
    nowMs: v.number(),
    supportedSymbols: v.array(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    sourceId: v.string(),
    sourceKey: v.string(),
    kind: v.string(),
    createdRaw: v.number(),
    createdEvents: v.number(),
    updatedEvents: v.number(),
    symbolLinksWritten: v.number(),
    dedupedEvents: v.number(),
    createdEventIds: v.array(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<IngestResult> => {
    const nowMs = Math.max(0, Math.floor(args.nowMs));
    const supported = new Set(
      (Array.isArray(args.supportedSymbols) ? args.supportedSymbols : [])
        .map((s) => normalizeSymbol(s))
        .filter(Boolean),
    );

    const source = await ctx.runQuery(internal.ingest.internal.getSource, {
      sourceId: args.sourceId,
    });
    if (!source) {
      return {
        ok: false,
        sourceId: String(args.sourceId),
        sourceKey: "",
        kind: "",
        createdRaw: 0,
        createdEvents: 0,
        updatedEvents: 0,
        symbolLinksWritten: 0,
        dedupedEvents: 0,
        createdEventIds: [],
        error: "Source not found",
      };
    }

    const runId = await ctx.runMutation(internal.ingest.internal.startRun, {
      sourceId: source._id,
      sourceKey: String(source.sourceKey),
      kind: String(source.kind),
      startedAt: nowMs,
    });

    let createdRaw = 0;
    let createdEvents = 0;
    let updatedEvents = 0;
    let symbolLinksWritten = 0;
    let dedupedEvents = 0;
    const createdEventIds: string[] = [];

    const fail = async (error: string): Promise<IngestResult> => {
      await ctx.runMutation(internal.ingest.internal.finishRun, {
        runId,
        ok: false,
        createdRaw,
        createdEvents,
        updatedEvents,
        symbolLinksWritten,
        dedupedEvents,
        lastError: error,
      });
      return {
        ok: false,
        sourceId: String(source._id),
        sourceKey: String(source.sourceKey),
        kind: String(source.kind),
        createdRaw,
        createdEvents,
        updatedEvents,
        symbolLinksWritten,
        dedupedEvents,
        createdEventIds,
        error,
      };
    };

    try {
      const kind = String(source.kind);
      const cfg = (source.config ?? {}) as any;

      if (kind === "rss") {
        const url = safeText(cfg.url);
        if (!url) return await fail("Missing RSS url");
        const res = await fetch(url, {
          headers: {
            ...(typeof source.cursor?.etag === "string" ? { "If-None-Match": source.cursor.etag } : {}),
            ...(typeof source.cursor?.lastModified === "string"
              ? { "If-Modified-Since": source.cursor.lastModified }
              : {}),
          },
        });
        if (res.status === 304) {
          const cadenceMs = Math.max(30_000, Number(source.cadenceSeconds) * 1000);
          await ctx.runMutation(internal.ingest.internal.applyRssItemsChunk, {
            sourceId: source._id,
            sourceKey: String(source.sourceKey),
            nowMs,
            supportedSymbols: Array.from(supported),
            items: [],
            cursorPatch: source.cursor ?? undefined,
            nextRunAt: nowMs + cadenceMs,
          });
          await ctx.runMutation(internal.ingest.internal.finishRun, {
            runId,
            ok: true,
            createdRaw: 0,
            createdEvents: 0,
            updatedEvents: 0,
            symbolLinksWritten: 0,
            dedupedEvents: 0,
          });
          return {
            ok: true,
            sourceId: String(source._id),
            sourceKey: String(source.sourceKey),
            kind,
            createdRaw: 0,
            createdEvents: 0,
            updatedEvents: 0,
            symbolLinksWritten: 0,
            dedupedEvents: 0,
            createdEventIds: [],
          };
        }
        if (!res.ok) {
          return await fail(`RSS fetch failed (${res.status})`);
        }
        const xml = await res.text();
        const items = parseRssXml(xml);

        // Update cursor headers.
        const etag = res.headers.get("etag") ?? undefined;
        const lastModified = res.headers.get("last-modified") ?? undefined;

        const forced = safeText(cfg.forcedSymbol);
        const itemsForDb = items.map((item) => ({
          externalId: item.externalId ?? undefined,
          url: item.url ?? undefined,
          urlNormalized: item.urlNormalized ?? undefined,
          title: item.title ?? undefined,
          summary: item.summary ?? undefined,
          publishedAt: typeof item.publishedAt === "number" ? item.publishedAt : undefined,
          payload: item.payload as any,
          forcedSymbol: forced || undefined,
          payloadSymbols: Array.isArray((item.payload as any)?.symbols)
            ? ((item.payload as any).symbols as string[])
            : undefined,
        }));

        const cadenceMs = Math.max(30_000, Number(source.cadenceSeconds) * 1000);
        const cursorPatch = {
          ...(source.cursor ?? {}),
          lastSuccessAt: nowMs,
          ...(etag ? { etag } : {}),
          ...(lastModified ? { lastModified } : {}),
        };

        // Write in chunks to avoid payload limits.
        const chunkSize = 100;
        for (let i = 0; i < itemsForDb.length; i += chunkSize) {
          const chunk = itemsForDb.slice(i, i + chunkSize);
          const stats = await ctx.runMutation(internal.ingest.internal.applyRssItemsChunk, {
            sourceId: source._id,
            sourceKey: String(source.sourceKey),
            nowMs,
            supportedSymbols: Array.from(supported),
            items: chunk,
            cursorPatch,
            nextRunAt: nowMs + cadenceMs,
          });
          createdRaw += stats.createdRaw;
          createdEvents += stats.createdEvents;
          updatedEvents += stats.updatedEvents;
          symbolLinksWritten += stats.symbolLinksWritten;
          dedupedEvents += stats.dedupedEvents;
        }

        await ctx.runMutation(internal.ingest.internal.finishRun, {
          runId,
          ok: true,
          createdRaw,
          createdEvents,
          updatedEvents,
          symbolLinksWritten,
          dedupedEvents,
        });

        return {
          ok: true,
          sourceId: String(source._id),
          sourceKey: String(source.sourceKey),
          kind,
          createdRaw,
          createdEvents,
          updatedEvents,
          symbolLinksWritten,
          dedupedEvents,
          createdEventIds,
        };
      }

      if (kind === "economic_calendar_api") {
        return await fail(
          "economic_calendar_api ingestion is temporarily disabled until its DB mutation path is implemented (rss works now).",
        );
      }

      return await fail(`Unsupported source kind: ${kind}`);
    } catch (e) {
      return await fail(e instanceof Error ? e.message : String(e));
    }
  },
});

