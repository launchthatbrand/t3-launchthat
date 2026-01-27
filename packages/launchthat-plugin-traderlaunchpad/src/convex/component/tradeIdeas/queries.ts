import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { query } from "../server";

type CursorPayload = {
  openedAt: number;
};

type TradeIdeaGroupView = {
  _id: any;
  _creationTime: number;
  userId: string;
  connectionId: any;
  accountId: string;
  positionId?: string;
  instrumentId?: string;
  symbol: string;
  status: "open" | "closed";
  direction: "long" | "short";
  openedAt: number;
  closedAt?: number;
  netQty: number;
  avgEntryPrice?: number;
  realizedPnl?: number;
  fees?: number;
  lastExecutionAt?: number;
  lastProcessedExecutionId?: string;
  thesis?: string;
  tags?: string[];
  discordChannelKind?: "mentors" | "members";
  discordChannelId?: string;
  discordMessageId?: string;
  discordLastSyncedAt?: number;
  tradeIdeaId?: any;
  ideaAssignedAt?: number;
  createdAt: number;
  updatedAt: number;
};

const toTradeIdeaGroupView = (r: any): TradeIdeaGroupView => ({
  _id: r._id,
  _creationTime: Number(r?._creationTime ?? 0),
  userId: String(r?.userId ?? ""),
  connectionId: r.connectionId,
  accountId: String(r?.accountId ?? ""),
  positionId: typeof r?.positionId === "string" ? r.positionId : undefined,
  instrumentId: typeof r?.instrumentId === "string" ? r.instrumentId : undefined,
  symbol: String(r?.symbol ?? ""),
  status: r?.status === "closed" ? "closed" : "open",
  direction: r?.direction === "short" ? "short" : "long",
  openedAt: Number(r?.openedAt ?? 0),
  closedAt: typeof r?.closedAt === "number" ? r.closedAt : undefined,
  netQty: typeof r?.netQty === "number" ? r.netQty : 0,
  avgEntryPrice: typeof r?.avgEntryPrice === "number" ? r.avgEntryPrice : undefined,
  realizedPnl: typeof r?.realizedPnl === "number" ? r.realizedPnl : undefined,
  fees: typeof r?.fees === "number" ? r.fees : undefined,
  lastExecutionAt: typeof r?.lastExecutionAt === "number" ? r.lastExecutionAt : undefined,
  lastProcessedExecutionId:
    typeof r?.lastProcessedExecutionId === "string" ? r.lastProcessedExecutionId : undefined,
  thesis: typeof r?.thesis === "string" ? r.thesis : undefined,
  tags: Array.isArray(r?.tags) ? r.tags : undefined,
  discordChannelKind:
    r?.discordChannelKind === "mentors" ? "mentors" : r?.discordChannelKind === "members" ? "members" : undefined,
  discordChannelId: typeof r?.discordChannelId === "string" ? r.discordChannelId : undefined,
  discordMessageId: typeof r?.discordMessageId === "string" ? r.discordMessageId : undefined,
  discordLastSyncedAt:
    typeof r?.discordLastSyncedAt === "number" ? r.discordLastSyncedAt : undefined,
  tradeIdeaId: r.tradeIdeaId,
  ideaAssignedAt: typeof r?.ideaAssignedAt === "number" ? r.ideaAssignedAt : undefined,
  createdAt: Number(r?.createdAt ?? 0),
  updatedAt: Number(r?.updatedAt ?? 0),
});

type TradeIdeaEventView = {
  _id: any;
  _creationTime: number;
  userId: string;
  connectionId: any;
  tradeIdeaGroupId: any;
  externalExecutionId: string;
  externalOrderId?: string;
  externalPositionId?: string;
  executedAt: number;
  createdAt: number;
};

const toTradeIdeaEventView = (r: any): TradeIdeaEventView => ({
  _id: r._id,
  _creationTime: Number(r?._creationTime ?? 0),
  userId: String(r?.userId ?? ""),
  connectionId: r.connectionId,
  tradeIdeaGroupId: r.tradeIdeaGroupId,
  externalExecutionId: String(r?.externalExecutionId ?? ""),
  externalOrderId: typeof r?.externalOrderId === "string" ? r.externalOrderId : undefined,
  externalPositionId: typeof r?.externalPositionId === "string" ? r.externalPositionId : undefined,
  executedAt: Number(r?.executedAt ?? 0),
  createdAt: Number(r?.createdAt ?? 0),
});

const base64EncodeUtf8 = (s: string): string => {
  const bytes = new TextEncoder().encode(s);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  // Convex runtime provides `btoa`/`atob` (no Node Buffer).
  return btoa(binary);
};

const base64DecodeUtf8 = (b64: string): string => {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
};

const encodeCursor = (c: CursorPayload): string => {
  const json = JSON.stringify(c);
  return base64EncodeUtf8(json);
};

const decodeCursor = (cursor: string | null): CursorPayload | null => {
  if (!cursor) return null;
  try {
    const json = base64DecodeUtf8(cursor);
    const parsed = JSON.parse(json) as Partial<CursorPayload>;
    if (typeof parsed.openedAt !== "number") return null;
    return { openedAt: parsed.openedAt };
  } catch {
    return null;
  }
};

export const listByStatus = query({
  args: {
    userId: v.string(),
    status: v.union(v.literal("open"), v.literal("closed")),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("tradeIdeaGroups"),
        _creationTime: v.number(),
        userId: v.string(),
        connectionId: v.id("brokerConnections"),
        accountId: v.string(),
        positionId: v.optional(v.string()),
        instrumentId: v.optional(v.string()),
        symbol: v.string(),
        status: v.union(v.literal("open"), v.literal("closed")),
        direction: v.union(v.literal("long"), v.literal("short")),
        openedAt: v.number(),
        closedAt: v.optional(v.number()),
        netQty: v.number(),
        avgEntryPrice: v.optional(v.number()),
        realizedPnl: v.optional(v.number()),
        fees: v.optional(v.number()),
        lastExecutionAt: v.optional(v.number()),
        lastProcessedExecutionId: v.optional(v.string()),
        thesis: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        discordChannelKind: v.optional(
          v.union(v.literal("mentors"), v.literal("members")),
        ),
        discordChannelId: v.optional(v.string()),
        discordMessageId: v.optional(v.string()),
        discordLastSyncedAt: v.optional(v.number()),
        tradeIdeaId: v.optional(v.id("tradeIdeas")),
        ideaAssignedAt: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    // NOTE: Convex `.paginate()` is only supported in the app (host), not in mounted components.
    // Implement a minimal cursor-based paginator that matches Convex's return shape.

    const numItems = Math.max(
      1,
      Math.min(100, Number(args.paginationOpts?.numItems ?? 20)),
    );
    const cursor = decodeCursor(
      typeof args.paginationOpts?.cursor === "string"
        ? args.paginationOpts.cursor
        : null,
    );

    const base = ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_user_status_openedAt", (q: any) => {
        let r = q.eq("userId", args.userId).eq("status", args.status);
        if (cursor) {
          r = r.lt("openedAt", cursor.openedAt);
        }
        return r;
      })
      .order("desc");

    const page = await base.take(numItems);

    if (page.length === 0) {
      return { page: [], isDone: true, continueCursor: null };
    }

    const pageOut = (Array.isArray(page) ? page : []).map(toTradeIdeaGroupView);
    const lastOpenedAt = Number((pageOut[pageOut.length - 1] as any)?.openedAt ?? 0);
    const nextCursor = encodeCursor({ openedAt: lastOpenedAt });

    // Determine if there are more items (best-effort).
    const probe = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_user_status_openedAt", (q: any) =>
        q.eq("userId", args.userId).eq("status", args.status).lt("openedAt", lastOpenedAt),
      )
      .order("desc")
      .take(1);

    const hasMore = probe.length > 0;
    return {
      page: pageOut,
      isDone: !hasMore,
      continueCursor: hasMore ? nextCursor : null,
    };
  },
});

export const getById = query({
  args: {
    tradeIdeaGroupId: v.id("tradeIdeaGroups"),
  },
  returns: v.union(
    v.object({
      _id: v.id("tradeIdeaGroups"),
      _creationTime: v.number(),
      userId: v.string(),
      connectionId: v.id("brokerConnections"),
      accountId: v.string(),
      positionId: v.optional(v.string()),
      instrumentId: v.optional(v.string()),
      symbol: v.string(),
      status: v.union(v.literal("open"), v.literal("closed")),
      direction: v.union(v.literal("long"), v.literal("short")),
      openedAt: v.number(),
      closedAt: v.optional(v.number()),
      netQty: v.number(),
      avgEntryPrice: v.optional(v.number()),
      realizedPnl: v.optional(v.number()),
      fees: v.optional(v.number()),
      lastExecutionAt: v.optional(v.number()),
      lastProcessedExecutionId: v.optional(v.string()),
      thesis: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      discordChannelKind: v.optional(
        v.union(v.literal("mentors"), v.literal("members")),
      ),
      discordChannelId: v.optional(v.string()),
      discordMessageId: v.optional(v.string()),
      discordLastSyncedAt: v.optional(v.number()),
      tradeIdeaId: v.optional(v.id("tradeIdeas")),
      ideaAssignedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.tradeIdeaGroupId);
    if (!doc) return null;
    return toTradeIdeaGroupView(doc);
  },
});

export const listLatestForSymbol = query({
  args: {
    userId: v.string(),
    symbol: v.string(),
    status: v.optional(v.union(v.literal("open"), v.literal("closed"))),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("tradeIdeaGroups"),
      _creationTime: v.number(),
      userId: v.string(),
      connectionId: v.id("brokerConnections"),
      accountId: v.string(),
      positionId: v.optional(v.string()),
      instrumentId: v.optional(v.string()),
      symbol: v.string(),
      status: v.union(v.literal("open"), v.literal("closed")),
      direction: v.union(v.literal("long"), v.literal("short")),
      openedAt: v.number(),
      closedAt: v.optional(v.number()),
      netQty: v.number(),
      avgEntryPrice: v.optional(v.number()),
      realizedPnl: v.optional(v.number()),
      fees: v.optional(v.number()),
      lastExecutionAt: v.optional(v.number()),
      lastProcessedExecutionId: v.optional(v.string()),
      thesis: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      discordChannelKind: v.optional(v.union(v.literal("mentors"), v.literal("members"))),
      discordChannelId: v.optional(v.string()),
      discordMessageId: v.optional(v.string()),
      discordLastSyncedAt: v.optional(v.number()),
      tradeIdeaId: v.optional(v.id("tradeIdeas")),
      ideaAssignedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(Number(args.limit ?? 50), 200));
    const symbol = String(args.symbol ?? "").trim().toUpperCase();
    if (!symbol) return [];

    const status = args.status ?? "open";
    const rows = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_user_symbol_status_openedAt", (q: any) =>
        q.eq("userId", args.userId).eq("symbol", symbol).eq("status", status),
      )
      .order("desc")
      .take(limit);

    return (Array.isArray(rows) ? rows : []).map(toTradeIdeaGroupView);
  },
});

export const getDiscordSymbolSnapshotFeed = query({
  args: {
    organizationId: v.string(),
    symbol: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("discordSymbolSnapshotFeeds"),
      _creationTime: v.number(),
      organizationId: v.string(),
      symbol: v.string(),
      guildId: v.string(),
      channelId: v.string(),
      messageId: v.string(),
      lastPostedAt: v.optional(v.number()),
      lastEditedAt: v.optional(v.number()),
      lastError: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const organizationId = args.organizationId.trim();
    const symbol = args.symbol.trim().toUpperCase();
    if (!organizationId || !symbol) return null;

    const doc = await ctx.db
      .query("discordSymbolSnapshotFeeds")
      .withIndex("by_org_symbol", (q: any) =>
        q.eq("organizationId", organizationId).eq("symbol", symbol),
      )
      .unique();
    return doc ?? null;
  },
});

export const listEventsForGroup = query({
  args: {
    userId: v.string(),
    tradeIdeaGroupId: v.id("tradeIdeaGroups"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("tradeIdeaEvents"),
      _creationTime: v.number(),
      userId: v.string(),
      connectionId: v.id("brokerConnections"),
      tradeIdeaGroupId: v.id("tradeIdeaGroups"),
      externalExecutionId: v.string(),
      externalOrderId: v.optional(v.string()),
      externalPositionId: v.optional(v.string()),
      executedAt: v.number(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(500, args.limit ?? 200));
    const rows = await ctx.db
      .query("tradeIdeaEvents")
      .withIndex("by_user_tradeIdeaGroupId", (q: any) =>
        q.eq("userId", args.userId).eq("tradeIdeaGroupId", args.tradeIdeaGroupId),
      )
      .order("desc")
      .take(limit);
    return (Array.isArray(rows) ? rows : []).map(toTradeIdeaEventView);
  },
});
