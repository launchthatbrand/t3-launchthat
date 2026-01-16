import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { query } from "../server";

type CursorPayload = {
  openedAt: number;
};

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
    organizationId: v.string(),
    userId: v.string(),
    status: v.union(v.literal("open"), v.literal("closed")),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("tradeIdeaGroups"),
        _creationTime: v.number(),
        organizationId: v.string(),
        userId: v.string(),
        connectionId: v.id("tradelockerConnections"),
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
      .withIndex("by_org_user_status_openedAt", (q: any) => {
        let r = q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("status", args.status);
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

    const lastOpenedAt = Number((page[page.length - 1] as any).openedAt ?? 0);
    const nextCursor = encodeCursor({ openedAt: lastOpenedAt });

    // Determine if there are more items (best-effort).
    const probe = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_org_user_status_openedAt", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("status", args.status)
          .lt("openedAt", lastOpenedAt),
      )
      .order("desc")
      .take(1);

    const hasMore = probe.length > 0;
    return {
      page,
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
      organizationId: v.string(),
      userId: v.string(),
      connectionId: v.id("tradelockerConnections"),
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
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.tradeIdeaGroupId);
    if (!doc) return null;
    return doc;
  },
});

export const listEventsForGroup = query({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    tradeIdeaGroupId: v.id("tradeIdeaGroups"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("tradeIdeaEvents"),
      _creationTime: v.number(),
      organizationId: v.string(),
      userId: v.string(),
      connectionId: v.id("tradelockerConnections"),
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
      .withIndex("by_org_user_tradeIdeaGroupId", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("tradeIdeaGroupId", args.tradeIdeaGroupId),
      )
      .order("desc")
      .take(limit);
    return rows;
  },
});
