import { query } from "../server";
import { v } from "convex/values";

export const listEventsForSymbol = query({
  args: {
    symbol: v.string(),
    fromMs: v.optional(v.number()),
    toMs: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      eventId: v.id("newsEvents"),
      symbol: v.string(),
      at: v.number(),
      eventType: v.string(),
      title: v.string(),
      summary: v.optional(v.string()),
      publishedAt: v.optional(v.number()),
      startsAt: v.optional(v.number()),
      impact: v.optional(v.string()),
      country: v.optional(v.string()),
      currency: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const symbol = args.symbol.trim().toUpperCase();
    if (!symbol) return [];
    const limit = Math.max(1, Math.min(500, Number(args.limit ?? 50)));
    const fromMs =
      typeof args.fromMs === "number" && Number.isFinite(args.fromMs) ? args.fromMs : 0;
    const toMs =
      typeof args.toMs === "number" && Number.isFinite(args.toMs) ? args.toMs : Date.now() + 365 * 24 * 60 * 60 * 1000;

    const links = await ctx.db
      .query("newsEventSymbols")
      .withIndex("by_symbol_at", (q) => q.eq("symbol", symbol).gte("at", fromMs).lte("at", toMs))
      .order("asc")
      .take(limit);
    const out = [];
    for (const link of links) {
      const e = await ctx.db.get(link.eventId);
      if (!e) continue;
      out.push({
        eventId: link.eventId,
        symbol: link.symbol,
        at: link.at,
        eventType: String(e.eventType),
        title: String(e.title),
        summary: typeof e.summary === "string" ? e.summary : undefined,
        publishedAt: typeof e.publishedAt === "number" ? e.publishedAt : undefined,
        startsAt: typeof e.startsAt === "number" ? e.startsAt : undefined,
        impact: typeof e.impact === "string" ? e.impact : undefined,
        country: typeof e.country === "string" ? e.country : undefined,
        currency: typeof e.currency === "string" ? e.currency : undefined,
      });
    }
    return out;
  },
});

export const listEventsGlobal = query({
  args: {
    fromMs: v.optional(v.number()),
    toMs: v.optional(v.number()),
    limit: v.optional(v.number()),
    eventType: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("newsEvents"),
      eventType: v.string(),
      title: v.string(),
      summary: v.optional(v.string()),
      publishedAt: v.optional(v.number()),
      startsAt: v.optional(v.number()),
      impact: v.optional(v.string()),
      country: v.optional(v.string()),
      currency: v.optional(v.string()),
      meta: v.optional(v.any()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(500, Number(args.limit ?? 100)));
    const fromMs =
      typeof args.fromMs === "number" && Number.isFinite(args.fromMs) ? args.fromMs : 0;
    const toMs =
      typeof args.toMs === "number" && Number.isFinite(args.toMs) ? args.toMs : Date.now() + 365 * 24 * 60 * 60 * 1000;
    const type = typeof args.eventType === "string" ? args.eventType.trim() : "";

    // Simple approach: scan recent by time indexes depending on type.
    // For MVP we fetch by type-specific index and filter.
    const rows =
      type === "economic"
        ? await ctx.db
          .query("newsEvents")
          .withIndex("by_eventType_startsAt", (q) =>
            q.eq("eventType", "economic").gte("startsAt", fromMs).lte("startsAt", toMs),
          )
          .order("asc")
          .take(limit)
        : await ctx.db
          .query("newsEvents")
          .withIndex("by_eventType_publishedAt", (q) =>
            q.eq("eventType", type === "headline" ? "headline" : "headline").gte("publishedAt", fromMs).lte("publishedAt", toMs),
          )
          .order("desc")
          .take(limit);

    const list = Array.isArray(rows) ? rows : [];
    return list
      .filter((r) => (type ? String(r.eventType) === type : true))
      .map((r) => ({
        _id: r._id,
        eventType: String(r.eventType),
        title: String(r.title),
        summary: typeof r.summary === "string" ? r.summary : undefined,
        publishedAt: typeof r.publishedAt === "number" ? r.publishedAt : undefined,
        startsAt: typeof r.startsAt === "number" ? r.startsAt : undefined,
        impact: typeof r.impact === "string" ? r.impact : undefined,
        country: typeof r.country === "string" ? r.country : undefined,
        currency: typeof r.currency === "string" ? r.currency : undefined,
        meta: (r as any).meta,
        createdAt: Number(r.createdAt),
        updatedAt: Number(r.updatedAt),
      }));
  },
});

export const listSymbolsForEvent = query({
  args: { eventId: v.id("newsEvents") },
  returns: v.array(v.object({ symbol: v.string() })),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("newsEventSymbols")
      .withIndex("by_eventId", (q) => (q as any).eq("eventId", args.eventId))
      .take(2000);
    const list = Array.isArray(rows) ? rows : [];
    return list.map((r) => ({ symbol: String((r as any).symbol ?? "").trim().toUpperCase() })).filter((r) => r.symbol);
  },
});

export const getEventById = query({
  args: { eventId: v.id("newsEvents") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("newsEvents"),
      eventType: v.string(),
      canonicalKey: v.string(),
      title: v.string(),
      summary: v.optional(v.string()),
      publishedAt: v.optional(v.number()),
      startsAt: v.optional(v.number()),
      impact: v.optional(v.string()),
      country: v.optional(v.string()),
      currency: v.optional(v.string()),
      meta: v.optional(v.any()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.eventId);
    if (!row) return null;
    return {
      _id: row._id,
      eventType: String((row as any).eventType ?? ""),
      canonicalKey: String((row as any).canonicalKey ?? ""),
      title: String((row as any).title ?? ""),
      summary: typeof (row as any).summary === "string" ? (row as any).summary : undefined,
      publishedAt: typeof (row as any).publishedAt === "number" ? (row as any).publishedAt : undefined,
      startsAt: typeof (row as any).startsAt === "number" ? (row as any).startsAt : undefined,
      impact: typeof (row as any).impact === "string" ? (row as any).impact : undefined,
      country: typeof (row as any).country === "string" ? (row as any).country : undefined,
      currency: typeof (row as any).currency === "string" ? (row as any).currency : undefined,
      meta: (row as any).meta,
      createdAt: Number((row as any).createdAt ?? 0),
      updatedAt: Number((row as any).updatedAt ?? 0),
    };
  },
});

export const listSourcesForEvent = query({
  args: { eventId: v.id("newsEvents"), limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      sourceKey: v.string(),
      url: v.optional(v.string()),
      externalId: v.optional(v.string()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(500, Number(args.limit ?? 50)));
    const rows = await ctx.db
      .query("newsEventSources")
      .withIndex("by_eventId", (q) => (q as any).eq("eventId", args.eventId))
      .take(limit);
    const list = Array.isArray(rows) ? rows : [];
    return list.map((r) => ({
      sourceKey: String((r as any).sourceKey ?? ""),
      url: typeof (r as any).url === "string" ? (r as any).url : undefined,
      externalId: typeof (r as any).externalId === "string" ? (r as any).externalId : undefined,
      createdAt: Number((r as any).createdAt ?? 0),
    }));
  },
});

