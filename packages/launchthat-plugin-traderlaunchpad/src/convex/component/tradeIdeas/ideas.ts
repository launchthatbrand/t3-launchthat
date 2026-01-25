import { v } from "convex/values";

import { mutation, query } from "../server";
import { isEnabledForType } from "../permissions";

const defaultGroupingWindowMs = 6 * 60 * 60 * 1000; // 6h

const normalizeSymbol = (value: string) => value.trim().toUpperCase();

const toVisibility = (v: unknown): "private" | "link" | "public" => {
  if (v === "public") return "public";
  if (v === "link") return "link";
  return "private";
};

const toIdeaStatus = (v: unknown): "active" | "closed" => (v === "closed" ? "closed" : "active");

const toBias = (v: unknown): "long" | "short" | "neutral" => {
  if (v === "short") return "short";
  if (v === "neutral") return "neutral";
  return "long";
};

const toDirection = (v: unknown): "long" | "short" => (v === "short" ? "short" : "long");

const toGroupStatus = (v: unknown): "open" | "closed" => (v === "closed" ? "closed" : "open");

const randomToken = (): string => {
  // Convex runtime: no Node crypto; use Math.random + time.
  const a = Math.random().toString(36).slice(2);
  const b = Math.random().toString(36).slice(2);
  return `${Date.now().toString(36)}_${a}${b}`.slice(0, 40);
};

const getGlobalPermissions = async (
  ctx: any,
  userId: string,
): Promise<{
  globalEnabled: boolean;
  tradeIdeasEnabled: boolean;
  openPositionsEnabled: boolean;
  ordersEnabled: boolean;
}> => {
  const row = await ctx.db
    .query("permissions")
    .withIndex("by_user_scope", (q: any) =>
      q.eq("userId", userId).eq("scopeType", "global").eq("scopeId", null),
    )
    .unique();

  return {
    globalEnabled: typeof row?.globalEnabled === "boolean" ? row.globalEnabled : false,
    tradeIdeasEnabled: typeof row?.tradeIdeasEnabled === "boolean" ? row.tradeIdeasEnabled : false,
    openPositionsEnabled:
      typeof row?.openPositionsEnabled === "boolean" ? row.openPositionsEnabled : false,
    ordersEnabled: typeof row?.ordersEnabled === "boolean" ? row.ordersEnabled : false,
  };
};

export const getMyTradeIdeaSettings = query({
  args: { organizationId: v.string(), userId: v.string() },
  returns: v.object({
    groupingWindowMs: v.number(),
    splitOnDirectionFlip: v.boolean(),
    defaultTimeframe: v.string(),
  }),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("tradeIdeaSettings")
      .withIndex("by_org_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();
    return {
      groupingWindowMs:
        typeof row?.groupingWindowMs === "number" && row.groupingWindowMs > 0
          ? row.groupingWindowMs
          : defaultGroupingWindowMs,
      splitOnDirectionFlip:
        typeof row?.splitOnDirectionFlip === "boolean" ? row.splitOnDirectionFlip : true,
      defaultTimeframe:
        typeof row?.defaultTimeframe === "string" && row.defaultTimeframe.trim()
          ? row.defaultTimeframe.trim()
          : "custom",
    };
  },
});

export const upsertMyTradeIdeaSettings = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    groupingWindowMs: v.number(),
    splitOnDirectionFlip: v.boolean(),
    defaultTimeframe: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const groupingWindowMs = Math.max(5 * 60 * 1000, Math.min(args.groupingWindowMs, 14 * 24 * 60 * 60 * 1000)); // 5m..14d
    const existing = await ctx.db
      .query("tradeIdeaSettings")
      .withIndex("by_org_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        groupingWindowMs,
        splitOnDirectionFlip: args.splitOnDirectionFlip,
        defaultTimeframe: args.defaultTimeframe,
        updatedAt: now,
      });
      return null;
    }
    await ctx.db.insert("tradeIdeaSettings", {
      organizationId: args.organizationId,
      userId: args.userId,
      groupingWindowMs,
      splitOnDirectionFlip: args.splitOnDirectionFlip,
      defaultTimeframe: args.defaultTimeframe,
      updatedAt: now,
    });
    return null;
  },
});

export const listMyTradeIdeas = query({
  args: {
    // Deprecated: trade ideas are user-owned; keep for backwards compatibility.
    organizationId: v.optional(v.string()),
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      tradeIdeaId: v.id("tradeIdeas"),
      symbol: v.string(),
      instrumentId: v.optional(v.string()),
      bias: v.union(v.literal("long"), v.literal("short"), v.literal("neutral")),
      timeframe: v.string(),
      timeframeLabel: v.optional(v.string()),
      thesis: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      visibility: v.union(v.literal("private"), v.literal("link"), v.literal("public")),
      status: v.union(v.literal("active"), v.literal("closed")),
      openedAt: v.number(),
      lastActivityAt: v.number(),
      positionsCount: v.number(),
      realizedPnl: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(200, args.limit ?? 50));
    const perms = await ctx.db
      .query("permissions")
      .withIndex("by_user_scope", (q: any) =>
        q.eq("userId", args.userId).eq("scopeType", "global").eq("scopeId", null),
      )
      .unique();
    const effectivePublic = isEnabledForType(
      {
        globalEnabled: typeof perms?.globalEnabled === "boolean" ? perms.globalEnabled : false,
        tradeIdeasEnabled:
          typeof perms?.tradeIdeasEnabled === "boolean" ? perms.tradeIdeasEnabled : false,
        openPositionsEnabled:
          typeof perms?.openPositionsEnabled === "boolean" ? perms.openPositionsEnabled : false,
        ordersEnabled: typeof perms?.ordersEnabled === "boolean" ? perms.ordersEnabled : false,
      },
      "tradeIdeas",
    );

    const ideas = await ctx.db
      .query("tradeIdeas")
      .withIndex("by_user_updatedAt", (q: any) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    const out: Array<any> = [];
    for (const idea of ideas) {
      const groups = await ctx.db
        .query("tradeIdeaGroups")
        .withIndex("by_user_tradeIdeaId_openedAt", (q: any) =>
          q.eq("userId", args.userId).eq("tradeIdeaId", idea._id),
        )
        .order("desc")
        .take(500);

      let realizedPnl = 0;
      for (const g of groups) {
        realizedPnl += typeof g.realizedPnl === "number" ? g.realizedPnl : 0;
      }

      out.push({
        tradeIdeaId: idea._id,
        symbol: String(idea.symbol),
        instrumentId: typeof idea.instrumentId === "string" ? idea.instrumentId : undefined,
        bias: idea.bias,
        timeframe: String(idea.timeframe ?? "custom"),
        timeframeLabel: typeof idea.timeframeLabel === "string" ? idea.timeframeLabel : undefined,
        thesis: typeof idea.thesis === "string" ? idea.thesis : undefined,
        tags: Array.isArray(idea.tags) ? idea.tags : undefined,
        visibility: effectivePublic ? ("public" as const) : ("private" as const),
        status: idea.status,
        openedAt: Number(idea.openedAt ?? 0),
        lastActivityAt: Number(idea.lastActivityAt ?? 0),
        positionsCount: groups.length,
        realizedPnl,
        updatedAt: Number(idea.updatedAt ?? 0),
      });
    }

    return out;
  },
});

export const getMyTradeIdeaDetail = query({
  args: {
    // Deprecated: trade ideas are user-owned; keep for backwards compatibility.
    organizationId: v.optional(v.string()),
    userId: v.string(),
    tradeIdeaId: v.id("tradeIdeas"),
    positionsLimit: v.optional(v.number()),
  },
  returns: v.union(
    v.null(),
    v.object({
      tradeIdeaId: v.id("tradeIdeas"),
      symbol: v.string(),
      instrumentId: v.optional(v.string()),
      bias: v.union(v.literal("long"), v.literal("short"), v.literal("neutral")),
      timeframe: v.string(),
      timeframeLabel: v.optional(v.string()),
      thesis: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      visibility: v.union(v.literal("private"), v.literal("link"), v.literal("public")),
      status: v.union(v.literal("active"), v.literal("closed")),
      openedAt: v.number(),
      lastActivityAt: v.number(),
      positions: v.array(
        v.object({
          tradeIdeaGroupId: v.id("tradeIdeaGroups"),
          symbol: v.string(),
          instrumentId: v.optional(v.string()),
          direction: v.union(v.literal("long"), v.literal("short")),
          status: v.union(v.literal("open"), v.literal("closed")),
          openedAt: v.number(),
          closedAt: v.optional(v.number()),
          realizedPnl: v.optional(v.number()),
          fees: v.optional(v.number()),
          netQty: v.number(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const idea = await ctx.db.get(args.tradeIdeaId);
    if (!idea) return null;
    if (idea.userId !== args.userId) return null;

    const positionsLimit = Math.max(1, Math.min(500, args.positionsLimit ?? 200));
    const groups = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_user_tradeIdeaId_openedAt", (q: any) =>
        q.eq("userId", args.userId).eq("tradeIdeaId", args.tradeIdeaId),
      )
      .order("desc")
      .take(positionsLimit);

    const perms = await ctx.db
      .query("permissions")
      .withIndex("by_user_scope", (q: any) =>
        q.eq("userId", args.userId).eq("scopeType", "global").eq("scopeId", null),
      )
      .unique();
    const effectivePublic = isEnabledForType(
      {
        globalEnabled: typeof perms?.globalEnabled === "boolean" ? perms.globalEnabled : false,
        tradeIdeasEnabled:
          typeof perms?.tradeIdeasEnabled === "boolean" ? perms.tradeIdeasEnabled : false,
        openPositionsEnabled:
          typeof perms?.openPositionsEnabled === "boolean" ? perms.openPositionsEnabled : false,
        ordersEnabled: typeof perms?.ordersEnabled === "boolean" ? perms.ordersEnabled : false,
      },
      "tradeIdeas",
    );

    return {
      tradeIdeaId: idea._id,
      symbol: String(idea.symbol),
      instrumentId: typeof idea.instrumentId === "string" ? idea.instrumentId : undefined,
      bias: idea.bias,
      timeframe: String(idea.timeframe ?? "custom"),
      timeframeLabel: typeof idea.timeframeLabel === "string" ? idea.timeframeLabel : undefined,
      thesis: typeof idea.thesis === "string" ? idea.thesis : undefined,
      tags: Array.isArray(idea.tags) ? idea.tags : undefined,
      visibility: effectivePublic ? ("public" as const) : ("private" as const),
      status: idea.status,
      openedAt: Number(idea.openedAt ?? 0),
      lastActivityAt: Number(idea.lastActivityAt ?? 0),
      positions: groups.map((g) => ({
        tradeIdeaGroupId: g._id,
        symbol: String(g.symbol ?? ""),
        instrumentId: typeof g.instrumentId === "string" ? g.instrumentId : undefined,
        direction: g.direction,
        status: g.status,
        openedAt: Number(g.openedAt ?? 0),
        closedAt: typeof g.closedAt === "number" ? g.closedAt : undefined,
        realizedPnl: typeof g.realizedPnl === "number" ? g.realizedPnl : undefined,
        fees: typeof g.fees === "number" ? g.fees : undefined,
        netQty: Number(g.netQty ?? 0),
      })),
    };
  },
});

export const setTradeIdeaSharing = mutation({
  args: {
    // Deprecated: trade idea per-item sharing is replaced by `permissions`.
    organizationId: v.optional(v.string()),
    userId: v.string(),
    tradeIdeaId: v.id("tradeIdeas"),
    visibility: v.union(v.literal("private"), v.literal("link"), v.literal("public")),
    expiresAt: v.optional(v.number()),
  },
  returns: v.object({
    ok: v.boolean(),
    shareToken: v.optional(v.string()),
    visibility: v.union(v.literal("private"), v.literal("link"), v.literal("public")),
  }),
  handler: async (_ctx, _args) => {
    // Per-item sharing has been removed; visibility is governed by `permissions` instead.
    // Keep returning a stable shape for older call sites.
    return { ok: false, shareToken: undefined, visibility: "private" as const };
  },
});

export const getSharedTradeIdeaByToken = query({
  args: {
    shareToken: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      tradeIdeaId: v.id("tradeIdeas"),
      organizationId: v.string(),
      userId: v.string(),
      symbol: v.string(),
      instrumentId: v.optional(v.string()),
      bias: v.union(v.literal("long"), v.literal("short"), v.literal("neutral")),
      timeframe: v.string(),
      timeframeLabel: v.optional(v.string()),
      thesis: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      visibility: v.union(v.literal("private"), v.literal("link"), v.literal("public")),
      status: v.union(v.literal("active"), v.literal("closed")),
      openedAt: v.number(),
      lastActivityAt: v.number(),
      positions: v.array(
        v.object({
          tradeIdeaGroupId: v.id("tradeIdeaGroups"),
          symbol: v.string(),
          instrumentId: v.optional(v.string()),
          direction: v.union(v.literal("long"), v.literal("short")),
          status: v.union(v.literal("open"), v.literal("closed")),
          openedAt: v.number(),
          closedAt: v.optional(v.number()),
          realizedPnl: v.optional(v.number()),
          fees: v.optional(v.number()),
          netQty: v.number(),
        }),
      ),
    }),
  ),
  handler: async (_ctx, _args) => {
    // Per-item sharing has been removed; trade ideas are not retrievable by a share token anymore.
    return null;
  },
});

export const getPublicTradeIdeaById = query({
  args: {
    organizationId: v.string(),
    expectedUserId: v.string(), // Clerk user id of the profile being viewed
    tradeIdeaId: v.id("tradeIdeas"),
    code: v.optional(v.string()), // shareToken
  },
  returns: v.union(
    v.null(),
    v.object({
      tradeIdeaId: v.id("tradeIdeas"),
      organizationId: v.string(),
      userId: v.string(),
      symbol: v.string(),
      instrumentId: v.optional(v.string()),
      bias: v.union(v.literal("long"), v.literal("short"), v.literal("neutral")),
      timeframe: v.string(),
      timeframeLabel: v.optional(v.string()),
      thesis: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      visibility: v.union(v.literal("private"), v.literal("link"), v.literal("public")),
      status: v.union(v.literal("active"), v.literal("closed")),
      openedAt: v.number(),
      lastActivityAt: v.number(),
      shareToken: v.optional(v.string()),
      expiresAt: v.optional(v.number()),
      positions: v.array(
        v.object({
          tradeIdeaGroupId: v.id("tradeIdeaGroups"),
          symbol: v.string(),
          instrumentId: v.optional(v.string()),
          direction: v.union(v.literal("long"), v.literal("short")),
          status: v.union(v.literal("open"), v.literal("closed")),
          openedAt: v.number(),
          closedAt: v.optional(v.number()),
          realizedPnl: v.optional(v.number()),
          fees: v.optional(v.number()),
          netQty: v.number(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.tradeIdeaId);
    if (!doc) return null;
    if (doc.userId !== args.expectedUserId) return null;

    const visibility = toVisibility((doc as any).visibility);

    const now = Date.now();
    if (typeof doc.expiresAt === "number" && doc.expiresAt > 0 && doc.expiresAt < now) {
      return null;
    }

    const code = typeof args.code === "string" ? args.code.trim() : "";
    const token = typeof doc.shareToken === "string" ? doc.shareToken.trim() : "";

    const isPublic = visibility === "public";
    const isShareValid = Boolean(code) && Boolean(token) && code === token;

    // Only public is accessible without code. Link/private require a valid code.
    if (!isPublic && !isShareValid) return null;

    const groups = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_user_tradeIdeaId_openedAt", (q: any) =>
        q.eq("userId", args.expectedUserId).eq("tradeIdeaId", args.tradeIdeaId),
      )
      .order("desc")
      .take(500);

    return {
      tradeIdeaId: doc._id,
      organizationId: String(doc.organizationId),
      userId: String(doc.userId),
      symbol: String(doc.symbol ?? ""),
      instrumentId: typeof doc.instrumentId === "string" ? doc.instrumentId : undefined,
      bias: toBias((doc as any).bias),
      timeframe: String(doc.timeframe ?? "custom"),
      timeframeLabel: typeof doc.timeframeLabel === "string" ? doc.timeframeLabel : undefined,
      thesis: typeof doc.thesis === "string" ? doc.thesis : undefined,
      tags: Array.isArray(doc.tags) ? doc.tags : undefined,
      visibility,
      status: toIdeaStatus((doc as any).status),
      openedAt: Number(doc.openedAt ?? 0),
      lastActivityAt: Number(doc.lastActivityAt ?? 0),
      shareToken: token || undefined,
      expiresAt: typeof doc.expiresAt === "number" ? doc.expiresAt : undefined,
      positions: groups.map((g) => ({
        tradeIdeaGroupId: g._id,
        symbol: String(g.symbol ?? ""),
        instrumentId: typeof g.instrumentId === "string" ? g.instrumentId : undefined,
        direction: toDirection((g as any).direction),
        status: toGroupStatus((g as any).status),
        openedAt: Number(g.openedAt ?? 0),
        closedAt: typeof g.closedAt === "number" ? g.closedAt : undefined,
        realizedPnl: typeof g.realizedPnl === "number" ? g.realizedPnl : undefined,
        fees: typeof g.fees === "number" ? g.fees : undefined,
        netQty: Number(g.netQty ?? 0),
      })),
    };
  },
});

export const listPublicTradeIdeasForUser = query({
  args: {
    // Deprecated: trade ideas are user-owned; keep for backwards compatibility.
    organizationId: v.optional(v.string()),
    expectedUserId: v.string(), // Clerk user id of the profile being viewed
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      tradeIdeaId: v.id("tradeIdeas"),
      symbol: v.string(),
      bias: v.union(v.literal("long"), v.literal("short"), v.literal("neutral")),
      timeframe: v.string(),
      timeframeLabel: v.optional(v.string()),
      status: v.union(v.literal("active"), v.literal("closed")),
      openedAt: v.number(),
      lastActivityAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(200, args.limit ?? 50));
    const perms = await getGlobalPermissions(ctx, args.expectedUserId);
    const enabled = isEnabledForType(perms, "tradeIdeas");
    if (!enabled) return [];

    const ideas = await ctx.db
      .query("tradeIdeas")
      .withIndex("by_user_updatedAt", (q: any) => q.eq("userId", args.expectedUserId))
      .order("desc")
      .take(limit);

    return ideas.map((idea: any) => ({
      tradeIdeaId: idea._id,
      symbol: String(idea.symbol ?? ""),
      bias: toBias(idea.bias),
      timeframe: String(idea.timeframe ?? "custom"),
      timeframeLabel: typeof idea.timeframeLabel === "string" ? idea.timeframeLabel : undefined,
      status: toIdeaStatus(idea.status),
      openedAt: Number(idea.openedAt ?? 0),
      lastActivityAt: Number(idea.lastActivityAt ?? 0),
    }));
  },
});

export const createTradeIdea = mutation({
  args: {
    // Deprecated: trade ideas are user-owned; keep for backwards compatibility.
    organizationId: v.optional(v.string()),
    userId: v.string(),
    symbol: v.string(),
    instrumentId: v.optional(v.string()),
    bias: v.union(v.literal("long"), v.literal("short"), v.literal("neutral")),
    timeframe: v.optional(v.string()),
    timeframeLabel: v.optional(v.string()),
    thesis: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.object({ tradeIdeaId: v.id("tradeIdeas") }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const symbol = normalizeSymbol(args.symbol);
    if (!symbol) throw new Error("Missing symbol");

    const tradeIdeaId = await ctx.db.insert("tradeIdeas", {
      userId: args.userId,
      symbol,
      instrumentId: args.instrumentId,
      bias: args.bias,
      timeframe: typeof args.timeframe === "string" && args.timeframe.trim() ? args.timeframe.trim() : "custom",
      timeframeLabel: args.timeframeLabel,
      thesis: args.thesis,
      tags: args.tags,
      status: "active",
      openedAt: now,
      lastStartedAt: now,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });
    return { tradeIdeaId };
  },
});

export const backfillIdeasForUser = mutation({
  args: {
    // Deprecated: trade ideas are user-owned; keep for backwards compatibility.
    organizationId: v.optional(v.string()),
    userId: v.string(),
    scanCap: v.optional(v.number()),
    limitAssigned: v.optional(v.number()),
  },
  returns: v.object({
    scanned: v.number(),
    assigned: v.number(),
    createdIdeas: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const settings = await ctx.db
      .query("tradeIdeaSettings")
      .withIndex("by_org_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    const groupingWindowMs =
      typeof settings?.groupingWindowMs === "number" && settings.groupingWindowMs > 0
        ? settings.groupingWindowMs
        : defaultGroupingWindowMs;
    const splitOnDirectionFlip =
      typeof settings?.splitOnDirectionFlip === "boolean"
        ? settings.splitOnDirectionFlip
        : true;
    const defaultTimeframe =
      typeof settings?.defaultTimeframe === "string" && settings.defaultTimeframe.trim()
        ? settings.defaultTimeframe.trim()
        : "custom";

    const scanCap = Math.max(50, Math.min(5000, args.scanCap ?? 2000));
    const limitAssigned = Math.max(1, Math.min(5000, args.limitAssigned ?? 2000));

    // Pull recent open + closed groups and process oldest->newest for stable auto-gap grouping.
    const open = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_user_status_openedAt", (q: any) =>
        q.eq("userId", args.userId).eq("status", "open"),
      )
      .order("desc")
      .take(scanCap);
    const closed = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_user_status_openedAt", (q: any) =>
        q.eq("userId", args.userId).eq("status", "closed"),
      )
      .order("desc")
      .take(scanCap);

    const all = [...open, ...closed].sort((a: any, b: any) => (a.openedAt ?? 0) - (b.openedAt ?? 0));

    let assigned = 0;
    let createdIdeas = 0;

    for (const group of all) {
      if (assigned >= limitAssigned) break;
      const existingIdeaId =
        typeof (group as any).tradeIdeaId === "string" ? String((group as any).tradeIdeaId) : "";
      if (existingIdeaId) continue;

      const symbol = normalizeSymbol(String((group as any).symbol ?? ""));
      if (!symbol) continue;

      const instrumentId =
        typeof (group as any).instrumentId === "string" ? String((group as any).instrumentId) : undefined;
      const direction = (group as any).direction === "short" ? ("short" as const) : ("long" as const);
      const openedAtMs = typeof (group as any).openedAt === "number" ? Number((group as any).openedAt) : now;
      const lastActivityAtMs =
        typeof (group as any).closedAt === "number"
          ? Number((group as any).closedAt)
          : typeof (group as any).lastExecutionAt === "number"
            ? Number((group as any).lastExecutionAt)
            : openedAtMs;

      const candidates = await ctx.db
        .query("tradeIdeas")
        .withIndex("by_user_symbol_status_lastActivityAt", (q: any) =>
          q.eq("userId", args.userId).eq("symbol", symbol).eq("status", "active"),
        )
        .order("desc")
        .take(20);

      const match = candidates.find((idea: any) => {
        const ideaLastStarted =
          typeof idea?.lastStartedAt === "number"
            ? idea.lastStartedAt
            : typeof idea?.openedAt === "number"
              ? idea.openedAt
              : 0;
        const gap = openedAtMs - ideaLastStarted;
        if (gap > groupingWindowMs) return false;
        if (!splitOnDirectionFlip) return true;
        const bias = String(idea?.bias ?? "");
        return bias === direction;
      });

      const tradeIdeaId = match
        ? match._id
        : await ctx.db.insert("tradeIdeas", {
            userId: args.userId,
            symbol,
            instrumentId,
            bias: direction,
            timeframe: defaultTimeframe,
            status: "active",
            openedAt: openedAtMs,
            lastStartedAt: openedAtMs,
            lastActivityAt: lastActivityAtMs,
            createdAt: now,
            updatedAt: now,
          });

      if (!match) createdIdeas += 1;

      await ctx.db.patch(tradeIdeaId, {
        lastStartedAt: Math.max(
          Number((match as any)?.lastStartedAt ?? (match as any)?.openedAt ?? 0),
          openedAtMs,
        ),
        lastActivityAt: Math.max(
          Number((match as any)?.lastActivityAt ?? 0),
          lastActivityAtMs,
        ),
        updatedAt: now,
      });

      await ctx.db.patch(group._id, { tradeIdeaId, ideaAssignedAt: now, updatedAt: now });
      assigned += 1;
    }

    return { scanned: all.length, assigned, createdIdeas };
  },
});

/**
 * DEBUG: list most recent org/user pairs for trade ideas + groups.
 * Use via `convex run` to identify which org/user to inspect.
 */
export const debugListRecentTradeIdeaPairs = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      organizationId: v.string(),
      userId: v.string(),
      ideas: v.number(),
      groups: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(50, args.limit ?? 10));

    const recentIdeas = await ctx.db.query("tradeIdeas").order("desc").take(300);
    const recentGroups = await ctx.db
      .query("tradeIdeaGroups")
      .order("desc")
      .take(500);

    const outByKey: Record<string, { organizationId: string; userId: string; ideas: number; groups: number }> =
      {};

    for (const row of recentIdeas) {
      const org = String((row as any).organizationId ?? "");
      const user = String((row as any).userId ?? "");
      if (!org || !user) continue;
      const key = `${org}::${user}`;
      outByKey[key] ??= { organizationId: org, userId: user, ideas: 0, groups: 0 };
      outByKey[key]!.ideas += 1;
    }

    for (const row of recentGroups) {
      const org = String((row as any).organizationId ?? "");
      const user = String((row as any).userId ?? "");
      if (!org || !user) continue;
      const key = `${org}::${user}`;
      outByKey[key] ??= { organizationId: org, userId: user, ideas: 0, groups: 0 };
      outByKey[key]!.groups += 1;
    }

    return Object.values(outByKey)
      .sort((a, b) => (b.ideas + b.groups) - (a.ideas + a.groups))
      .slice(0, limit);
  },
});

/**
 * DEBUG: dump ideas/groups + explain why a group would/wouldn't match an existing idea.
 * This is specifically to diagnose fragmentation when multiple positions overlap in time.
 */
export const debugExplainTradeIdeaGroupingForUser = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    scanCap: v.optional(v.number()),
  },
  returns: v.object({
    settings: v.object({
      groupingWindowMs: v.number(),
      splitOnDirectionFlip: v.boolean(),
      defaultTimeframe: v.string(),
    }),
    ideas: v.array(
      v.object({
        tradeIdeaId: v.id("tradeIdeas"),
        symbol: v.string(),
        bias: v.union(v.literal("long"), v.literal("short"), v.literal("neutral")),
        status: v.union(v.literal("active"), v.literal("closed")),
        openedAt: v.number(),
        lastActivityAt: v.number(),
        updatedAt: v.number(),
      }),
    ),
    groups: v.array(
      v.object({
        tradeIdeaGroupId: v.id("tradeIdeaGroups"),
        positionId: v.string(),
        symbol: v.string(),
        instrumentId: v.optional(v.string()),
        direction: v.union(v.literal("long"), v.literal("short")),
        status: v.union(v.literal("open"), v.literal("closed")),
        openedAt: v.number(),
        lastExecutionAt: v.optional(v.number()),
        closedAt: v.optional(v.number()),
        tradeIdeaId: v.optional(v.id("tradeIdeas")),
      }),
    ),
    decisions: v.array(
      v.object({
        tradeIdeaGroupId: v.id("tradeIdeaGroups"),
        symbol: v.string(),
        direction: v.union(v.literal("long"), v.literal("short")),
        openedAt: v.number(),
        derivedLastActivityAt: v.number(),
        matchedIdeaId_byLastActivity: v.optional(v.id("tradeIdeas")),
        matchedIdeaId_byOpenedAt: v.optional(v.id("tradeIdeas")),
        note: v.string(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const settingsRow = await ctx.db
      .query("tradeIdeaSettings")
      .withIndex("by_org_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();

    const groupingWindowMs =
      typeof settingsRow?.groupingWindowMs === "number" && settingsRow.groupingWindowMs > 0
        ? settingsRow.groupingWindowMs
        : defaultGroupingWindowMs;
    const splitOnDirectionFlip =
      typeof settingsRow?.splitOnDirectionFlip === "boolean"
        ? settingsRow.splitOnDirectionFlip
        : true;
    const defaultTimeframe =
      typeof settingsRow?.defaultTimeframe === "string" && settingsRow.defaultTimeframe.trim()
        ? settingsRow.defaultTimeframe.trim()
        : "custom";

    const scanCap = Math.max(50, Math.min(5000, args.scanCap ?? 2000));

    const ideas = await ctx.db
      .query("tradeIdeas")
      .withIndex("by_user_updatedAt", (q: any) => q.eq("userId", args.userId))
      .order("desc")
      .take(500);

    const openGroups = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_user_status_openedAt", (q: any) =>
        q.eq("userId", args.userId).eq("status", "open"),
      )
      .order("desc")
      .take(scanCap);
    const closedGroups = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_user_status_openedAt", (q: any) =>
        q.eq("userId", args.userId).eq("status", "closed"),
      )
      .order("desc")
      .take(scanCap);

    const groupsSorted = [...openGroups, ...closedGroups].sort(
      (a: any, b: any) => (a.openedAt ?? 0) - (b.openedAt ?? 0),
    );

    const decisions: Array<any> = [];

    for (const group of groupsSorted) {
      const symbol = normalizeSymbol(String((group as any).symbol ?? ""));
      if (!symbol) continue;

      const direction = (group as any).direction === "short" ? ("short" as const) : ("long" as const);
      const openedAtMs = typeof (group as any).openedAt === "number" ? Number((group as any).openedAt) : now;
      const lastActivityAtMs =
        typeof (group as any).closedAt === "number"
          ? Number((group as any).closedAt)
          : typeof (group as any).lastExecutionAt === "number"
            ? Number((group as any).lastExecutionAt)
            : openedAtMs;

      const candidates = await ctx.db
        .query("tradeIdeas")
        .withIndex("by_user_symbol_status_lastActivityAt", (q: any) =>
          q.eq("userId", args.userId).eq("symbol", symbol).eq("status", "active"),
        )
        .order("desc")
        .take(20);

      const matchByLastActivity = candidates.find((idea: any) => {
        const ideaLast = typeof idea?.lastActivityAt === "number" ? idea.lastActivityAt : 0;
        const gap = openedAtMs - ideaLast;
        if (gap < 0) return false;
        if (gap > groupingWindowMs) return false;
        if (!splitOnDirectionFlip) return true;
        const bias = String(idea?.bias ?? "");
        return bias === direction;
      });

      const matchByOpenedAt = candidates.find((idea: any) => {
        const ideaOpened = typeof idea?.openedAt === "number" ? idea.openedAt : 0;
        const gap = openedAtMs - ideaOpened;
        if (gap < 0) return false;
        if (gap > groupingWindowMs) return false;
        if (!splitOnDirectionFlip) return true;
        const bias = String(idea?.bias ?? "");
        return bias === direction;
      });

      const noteParts: string[] = [];
      if (!candidates.length) noteParts.push("no candidates");
      if (candidates.length) noteParts.push(`candidates=${candidates.length}`);
      if (matchByLastActivity && !matchByOpenedAt) noteParts.push("match(lastActivity) only");
      if (!matchByLastActivity && matchByOpenedAt) noteParts.push("match(openedAt) only");
      if (!matchByLastActivity && !matchByOpenedAt) {
        // Try to flag the most common fragmentation reason: overlap -> negative gap vs lastActivity.
        const ideaLast = typeof candidates[0]?.lastActivityAt === "number" ? candidates[0].lastActivityAt : 0;
        const gap = openedAtMs - ideaLast;
        if (gap < 0) noteParts.push("likely overlap: openedAt < candidate.lastActivityAt");
      }

      decisions.push({
        tradeIdeaGroupId: group._id,
        symbol,
        direction,
        openedAt: openedAtMs,
        derivedLastActivityAt: lastActivityAtMs,
        matchedIdeaId_byLastActivity: matchByLastActivity?._id,
        matchedIdeaId_byOpenedAt: matchByOpenedAt?._id,
        note: noteParts.join("; "),
      });
    }

    return {
      settings: { groupingWindowMs, splitOnDirectionFlip, defaultTimeframe },
      ideas: ideas.map((idea: any) => ({
        tradeIdeaId: idea._id,
        symbol: String(idea.symbol),
        bias: toBias(idea.bias),
        status: toIdeaStatus(idea.status),
        openedAt: Number(idea.openedAt ?? 0),
        lastActivityAt: Number(idea.lastActivityAt ?? 0),
        updatedAt: Number(idea.updatedAt ?? 0),
      })),
      groups: groupsSorted.map((g: any) => ({
        tradeIdeaGroupId: g._id,
        positionId: String(g.positionId ?? ""),
        symbol: String(g.symbol ?? ""),
        instrumentId: typeof g.instrumentId === "string" ? g.instrumentId : undefined,
        direction: toDirection(g.direction),
        status: toGroupStatus(g.status),
        openedAt: Number(g.openedAt ?? 0),
        lastExecutionAt: typeof g.lastExecutionAt === "number" ? g.lastExecutionAt : undefined,
        closedAt: typeof g.closedAt === "number" ? g.closedAt : undefined,
        tradeIdeaId: typeof g.tradeIdeaId === "string" ? (g.tradeIdeaId as any) : undefined,
      })),
      decisions,
    };
  },
});

/**
 * Fix-up utility:
 * - Normalize each idea's symbol/instrumentId based on its linked groups (if drifted)
 * - Merge duplicate active ideas within the user's grouping window, grouped by (symbol,bias)
 *
 * Intended for admin/debug + migrations (call via app wrapper).
 */
export const reconcileIdeasForUser = mutation({
  args: {
    // Deprecated: trade ideas are user-owned; keep for backwards compatibility.
    organizationId: v.optional(v.string()),
    userId: v.string(),
    scanCap: v.optional(v.number()),
  },
  returns: v.object({
    ideasScanned: v.number(),
    ideasPatched: v.number(),
    groupsReassigned: v.number(),
    ideasDeleted: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const settings = await ctx.db
      .query("tradeIdeaSettings")
      .withIndex("by_org_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .unique();
    const groupingWindowMs =
      typeof settings?.groupingWindowMs === "number" && settings.groupingWindowMs > 0
        ? settings.groupingWindowMs
        : defaultGroupingWindowMs;

    const scanCap = Math.max(20, Math.min(1000, args.scanCap ?? 500));

    const ideas = await ctx.db
      .query("tradeIdeas")
      .withIndex("by_user_updatedAt", (q: any) => q.eq("userId", args.userId))
      .order("desc")
      .take(scanCap);

    let ideasPatched = 0;
    let groupsReassigned = 0;
    let ideasDeleted = 0;

    // 1) Patch idea.symbol/instrumentId if it disagrees with its groups (common after symbol backfills).
    for (const idea of ideas) {
      const groups = await ctx.db
        .query("tradeIdeaGroups")
        .withIndex("by_user_tradeIdeaId_openedAt", (q: any) =>
          q.eq("userId", args.userId).eq("tradeIdeaId", idea._id),
        )
        .order("desc")
        .take(50);

      const groupSymbolRaw =
        typeof (groups[0] as any)?.symbol === "string" ? String((groups[0] as any).symbol) : "";
      const groupSymbol = groupSymbolRaw.trim() ? normalizeSymbol(groupSymbolRaw) : "";
      const groupInstrumentId =
        typeof (groups[0] as any)?.instrumentId === "string"
          ? String((groups[0] as any).instrumentId).trim()
          : "";

      const ideaSymbol = typeof (idea as any).symbol === "string" ? normalizeSymbol(String((idea as any).symbol)) : "";
      const ideaInstrumentId =
        typeof (idea as any).instrumentId === "string" ? String((idea as any).instrumentId).trim() : "";

      const nextPatch: Record<string, any> = { updatedAt: now };
      let needsPatch = false;

      if (groupSymbol && groupSymbol !== ideaSymbol) {
        nextPatch.symbol = groupSymbol;
        needsPatch = true;
      }
      if (groupInstrumentId && groupInstrumentId !== ideaInstrumentId) {
        nextPatch.instrumentId = groupInstrumentId;
        needsPatch = true;
      }

      if (needsPatch) {
        await ctx.db.patch(idea._id, nextPatch);
        ideasPatched += 1;
      }
    }

    // Reload after potential symbol patches so merging uses corrected keys.
    const ideas2 = await ctx.db
      .query("tradeIdeas")
      .withIndex("by_user_updatedAt", (q: any) => q.eq("userId", args.userId))
      .order("desc")
      .take(scanCap);

    const active = ideas2.filter((i: any) => i.status === "active");

    // 2) Merge duplicate active ideas by (symbol,bias), using openedAt proximity.
    const buckets = new Map<string, any[]>();
    for (const idea of active) {
      const symbol = typeof idea.symbol === "string" ? normalizeSymbol(String(idea.symbol)) : "";
      const bias = String(idea.bias ?? "");
      if (!symbol) continue;
      const key = `${symbol}::${bias}`;
      const arr = buckets.get(key) ?? [];
      arr.push(idea);
      buckets.set(key, arr);
    }

    for (const [, bucket] of buckets) {
      const sorted = bucket.sort((a: any, b: any) => (a.openedAt ?? 0) - (b.openedAt ?? 0));
      if (sorted.length <= 1) continue;

      let keep = sorted[0]!;
      for (let i = 1; i < sorted.length; i++) {
        const candidate = sorted[i]!;
        const keepOpened = typeof keep.openedAt === "number" ? keep.openedAt : 0;
        const candOpened = typeof candidate.openedAt === "number" ? candidate.openedAt : 0;
        const openedGap = candOpened - keepOpened;

        // If the candidate opened within the grouping window of the keep idea, merge it.
        if (openedGap >= 0 && openedGap <= groupingWindowMs) {
          const candGroups = await ctx.db
            .query("tradeIdeaGroups")
            .withIndex("by_user_tradeIdeaId_openedAt", (q: any) =>
              q.eq("userId", args.userId).eq("tradeIdeaId", candidate._id),
            )
            .order("desc")
            .take(2000);

          for (const g of candGroups) {
            await ctx.db.patch(g._id, { tradeIdeaId: keep._id, updatedAt: now });
            groupsReassigned += 1;
          }

          const keepLast = typeof keep.lastActivityAt === "number" ? keep.lastActivityAt : keepOpened;
          const candLast = typeof candidate.lastActivityAt === "number" ? candidate.lastActivityAt : candOpened;
          await ctx.db.patch(keep._id, {
            openedAt: Math.min(keepOpened || candOpened, candOpened || keepOpened),
            lastActivityAt: Math.max(keepLast, candLast),
            updatedAt: now,
          });

          await ctx.db.delete(candidate._id);
          ideasDeleted += 1;
        } else {
          // Start a new cluster.
          keep = candidate;
        }
      }
    }

    return {
      ideasScanned: ideas.length,
      ideasPatched,
      groupsReassigned,
      ideasDeleted,
    };
  },
});

