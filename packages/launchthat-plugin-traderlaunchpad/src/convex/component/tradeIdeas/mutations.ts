import { v } from "convex/values";

import { mutation } from "../server";

export const upsertTradeIdeaGroup = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("tradelockerConnections"),
    accountId: v.string(),
    positionId: v.string(),
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
  },
  returns: v.id("tradeIdeaGroups"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_org_user_accountId_positionId", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("accountId", args.accountId)
          .eq("positionId", args.positionId),
      )
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        connectionId: args.connectionId,
        accountId: args.accountId,
        positionId: args.positionId,
        instrumentId: args.instrumentId,
        status: args.status,
        direction: args.direction,
        openedAt: args.openedAt,
        closedAt: args.closedAt,
        netQty: args.netQty,
        avgEntryPrice: args.avgEntryPrice,
        realizedPnl: args.realizedPnl,
        fees: args.fees,
        lastExecutionAt: args.lastExecutionAt,
        lastProcessedExecutionId: args.lastProcessedExecutionId,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("tradeIdeaGroups", {
      organizationId: args.organizationId,
      userId: args.userId,
      connectionId: args.connectionId,
      accountId: args.accountId,
      positionId: args.positionId,
      instrumentId: args.instrumentId,
      symbol: args.symbol,
      status: args.status,
      direction: args.direction,
      openedAt: args.openedAt,
      closedAt: args.closedAt,
      netQty: args.netQty,
      avgEntryPrice: args.avgEntryPrice,
      realizedPnl: args.realizedPnl,
      fees: args.fees,
      lastExecutionAt: args.lastExecutionAt,
      lastProcessedExecutionId: args.lastProcessedExecutionId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

const signedQty = (e: any): number => {
  const qty = typeof e.qty === "number" ? Math.abs(e.qty) : 0;
  const side = e.side as "buy" | "sell" | undefined;
  if (!qty) return 0;
  if (side === "sell") return -qty;
  return qty;
};

const notional = (e: any): number => {
  const qty = typeof e.qty === "number" ? Math.abs(e.qty) : 0;
  const price = typeof e.price === "number" ? e.price : 0;
  if (!qty || !price) return 0;
  return qty * price;
};

/**
 * Phase 1 grouping: for a given instrumentId, construct TradeIdeas as “episodes”:
 * start when netQty crosses 0 -> nonzero, end when netQty returns to 0.
 * Uses a synthetic positionId so we can reuse existing indexing + event linking.
 */
export const rebuildTradeIdeasForInstrument = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("tradelockerConnections"),
    accountId: v.string(),
    instrumentId: v.string(),
  },
  returns: v.object({
    tradeIdeaGroupIds: v.array(v.id("tradeIdeaGroups")),
    episodesBuilt: v.number(),
    eventsLinked: v.number(),
  }),
  handler: async (ctx, args) => {
    const instrumentId = args.instrumentId.trim();
    if (!instrumentId) {
      return { tradeIdeaGroupIds: [], episodesBuilt: 0, eventsLinked: 0 };
    }

    const executions = await ctx.db
      .query("tradeExecutions")
      .withIndex("by_org_user_instrumentId_executedAt", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("instrumentId", instrumentId),
      )
      .order("asc")
      .collect();

    if (executions.length === 0) {
      return { tradeIdeaGroupIds: [], episodesBuilt: 0, eventsLinked: 0 };
    }

    const sorted = executions.sort((a, b) => {
      const t = (a.executedAt ?? 0) - (b.executedAt ?? 0);
      if (t !== 0) return t;
      return String(a.externalExecutionId ?? "").localeCompare(
        String(b.externalExecutionId ?? ""),
      );
    });

    type Episode = {
      startExternalExecutionId: string;
      openedAt: number;
      direction: "long" | "short";
      symbol: string;
      executions: any[];
      netQty: number;
    };

    const episodes: Episode[] = [];
    let current: Episode | null = null;
    let runningQty = 0;

    for (const e of sorted) {
      const qtyDelta = signedQty(e);
      if (!qtyDelta) continue;

      const nextQty = runningQty + qtyDelta;
      const symbol =
        typeof e.symbol === "string" && e.symbol.trim()
          ? e.symbol.trim()
          : "UNKNOWN";

      if (runningQty === 0 && nextQty !== 0) {
        const startId = String(e.externalExecutionId ?? "");
        const openedAt =
          typeof e.executedAt === "number" ? e.executedAt : Date.now();
        const direction: "long" | "short" = nextQty < 0 ? "short" : "long";
        current = {
          startExternalExecutionId: startId || `${instrumentId}:${openedAt}`,
          openedAt,
          direction,
          symbol,
          executions: [e],
          netQty: nextQty,
        };
        episodes.push(current);
      } else if (current) {
        current.executions.push(e);
        current.netQty = nextQty;
      }

      runningQty = nextQty;

      if (current && runningQty === 0) {
        current = null;
      }
    }

    const touched: Array<import("../_generated/dataModel").Id<"tradeIdeaGroups">> =
      [];
    let eventsLinked = 0;

    for (const ep of episodes) {
      const positionId = `inst:${instrumentId}:start:${ep.startExternalExecutionId}`;
      const now = Date.now();
      const last = ep.executions[ep.executions.length - 1]!;

      const lastExecutionAt =
        typeof last.executedAt === "number" ? last.executedAt : undefined;
      const lastProcessedExecutionId =
        typeof last.externalExecutionId === "string"
          ? last.externalExecutionId
          : undefined;

      const netQty = ep.netQty;
      const status: "open" | "closed" = netQty === 0 ? "closed" : "open";
      const closedAt =
        status === "closed" ? (lastExecutionAt ?? Date.now()) : undefined;

      // Avg entry approximation same as legacy: direction-based entry side weighted.
      let entryNotional = 0;
      let entryQty = 0;
      for (const e of ep.executions) {
        const side = e.side as "buy" | "sell" | undefined;
        const qty = typeof e.qty === "number" ? Math.abs(e.qty) : 0;
        const price = typeof e.price === "number" ? e.price : 0;
        if (!qty || !price) continue;
        if (ep.direction === "long" && side === "buy") {
          entryNotional += qty * price;
          entryQty += qty;
        }
        if (ep.direction === "short" && side === "sell") {
          entryNotional += qty * price;
          entryQty += qty;
        }
      }
      const avgEntryPrice = entryQty > 0 ? entryNotional / entryQty : undefined;

      const fees = ep.executions.reduce(
        (acc, e) => acc + (typeof e.fees === "number" ? e.fees : 0),
        0,
      );

      // Realized PnL approximation for closed episodes: -sum(signedQty * price) - fees
      // (cashflow sign convention).
      const cashflow = ep.executions.reduce((acc, e) => {
        const q = signedQty(e);
        const p = typeof e.price === "number" ? e.price : 0;
        return acc + q * p;
      }, 0);
      const realizedPnl =
        status === "closed" ? -cashflow - fees : undefined;

      const groupId = await ctx.db
        .query("tradeIdeaGroups")
        .withIndex("by_org_user_accountId_positionId", (q: any) =>
          q
            .eq("organizationId", args.organizationId)
            .eq("userId", args.userId)
            .eq("accountId", args.accountId)
            .eq("positionId", positionId),
        )
        .unique()
        .then(async (existing) => {
          if (existing) {
            await ctx.db.patch(existing._id, {
              connectionId: args.connectionId,
              accountId: args.accountId,
              positionId,
              instrumentId,
              symbol: ep.symbol,
              status,
              direction: ep.direction,
              openedAt: ep.openedAt,
              closedAt,
              netQty,
              avgEntryPrice,
              realizedPnl: realizedPnl ?? existing.realizedPnl ?? 0,
              fees,
              lastExecutionAt,
              lastProcessedExecutionId,
              updatedAt: now,
            });
            return existing._id;
          }
          return await ctx.db.insert("tradeIdeaGroups", {
            organizationId: args.organizationId,
            userId: args.userId,
            connectionId: args.connectionId,
            accountId: args.accountId,
            positionId,
            instrumentId,
            symbol: ep.symbol,
            status,
            direction: ep.direction,
            openedAt: ep.openedAt,
            closedAt,
            netQty,
            avgEntryPrice,
            realizedPnl: realizedPnl ?? 0,
            fees,
            lastExecutionAt,
            lastProcessedExecutionId,
            createdAt: now,
            updatedAt: now,
          });
        });

      touched.push(groupId);

      for (const e of ep.executions) {
        const existingEvent = await ctx.db
          .query("tradeIdeaEvents")
          .withIndex("by_org_user_externalExecutionId", (q: any) =>
            q
              .eq("organizationId", args.organizationId)
              .eq("userId", args.userId)
              .eq("externalExecutionId", e.externalExecutionId),
          )
          .first();

        const externalOrderId = e.externalOrderId;
        const externalPositionId = e.externalPositionId;
        const executedAt =
          typeof e.executedAt === "number" ? e.executedAt : Date.now();

        if (existingEvent) {
          if (existingEvent.tradeIdeaGroupId !== groupId) {
            await ctx.db.patch(existingEvent._id, {
              tradeIdeaGroupId: groupId,
              externalOrderId,
              externalPositionId,
              executedAt,
            });
          }
          eventsLinked++;
          continue;
        }

        await ctx.db.insert("tradeIdeaEvents", {
          organizationId: args.organizationId,
          userId: args.userId,
          connectionId: args.connectionId,
          tradeIdeaGroupId: groupId,
          externalExecutionId: e.externalExecutionId,
          externalOrderId,
          externalPositionId,
          executedAt,
          createdAt: Date.now(),
        });
        eventsLinked++;
      }
    }

    return { tradeIdeaGroupIds: touched, episodesBuilt: episodes.length, eventsLinked };
  },
});

export const rebuildTradeIdeaForPosition = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    connectionId: v.id("tradelockerConnections"),
    accountId: v.string(),
    positionId: v.string(),
    isOpen: v.boolean(),
  },
  returns: v.object({
    tradeIdeaGroupId: v.id("tradeIdeaGroups"),
    executionsLinked: v.number(),
  }),
  handler: async (ctx, args) => {
    const executions = await ctx.db
      .query("tradeExecutions")
      .withIndex("by_org_user_externalPositionId", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("externalPositionId", args.positionId),
      )
      .collect();

    const sorted = executions.sort((a, b) => {
      const t = (a.executedAt ?? 0) - (b.executedAt ?? 0);
      if (t !== 0) return t;
      return String(a.externalExecutionId ?? "").localeCompare(
        String(b.externalExecutionId ?? ""),
      );
    });

    if (sorted.length === 0) {
      // No executions means nothing to build yet; create an empty placeholder group is not useful.
      throw new Error("No executions found for positionId");
    }

    const first = sorted[0]!;
    const firstSide = first.side as "buy" | "sell" | undefined;
    const direction: "long" | "short" = firstSide === "sell" ? "short" : "long";
    const symbol = typeof first.symbol === "string" && first.symbol.trim()
      ? first.symbol.trim()
      : "UNKNOWN";
    const instrumentId =
      typeof first.instrumentId === "string" && first.instrumentId.trim()
        ? first.instrumentId.trim()
        : undefined;

    const signedQty = (e: any): number => {
      const qty = typeof e.qty === "number" ? e.qty : 0;
      const side = e.side as "buy" | "sell" | undefined;
      if (side === "sell") return -Math.abs(qty);
      return Math.abs(qty);
    };

    const netQty = sorted.reduce((acc, e) => acc + signedQty(e), 0);
    const fees = sorted.reduce(
      (acc, e) => acc + (typeof e.fees === "number" ? e.fees : 0),
      0,
    );

    const openedAt = typeof first.executedAt === "number" ? first.executedAt : Date.now();
    const last = sorted[sorted.length - 1]!;
    const lastExecutionAt =
      typeof last.executedAt === "number" ? last.executedAt : undefined;
    const lastProcessedExecutionId =
      typeof last.externalExecutionId === "string"
        ? last.externalExecutionId
        : undefined;

    // Very simple avg entry approximation for MVP:
    // - long: avg buy price weighted by buy qty
    // - short: avg sell price weighted by sell qty
    let entryNotional = 0;
    let entryQty = 0;
    for (const e of sorted) {
      const side = e.side as "buy" | "sell" | undefined;
      const qty = typeof e.qty === "number" ? Math.abs(e.qty) : 0;
      const price = typeof e.price === "number" ? e.price : 0;
      if (!qty || !price) continue;
      if (direction === "long" && side === "buy") {
        entryNotional += qty * price;
        entryQty += qty;
      }
      if (direction === "short" && side === "sell") {
        entryNotional += qty * price;
        entryQty += qty;
      }
    }
    const avgEntryPrice =
      entryQty > 0 ? entryNotional / entryQty : undefined;

    const status: "open" | "closed" = args.isOpen ? "open" : "closed";
    const closedAt =
      status === "closed" ? (lastExecutionAt ?? Date.now()) : undefined;

    // Realized PnL should accumulate from partial closes while position remains open.
    // We sum realized events for this broker positionId (account-scoped).
    const realizedRows = await ctx.db
      .query("tradeRealizationEvents")
      .withIndex("by_org_user_accountId_externalPositionId_closedAt", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("accountId", args.accountId)
          .eq("externalPositionId", args.positionId),
      )
      .order("asc")
      .take(2000);
    const realizedPnl = realizedRows.reduce((acc, r) => acc + (r.realizedPnl ?? 0), 0);

    // Avoid calling ctx.runMutation recursively; call local mutation handler logic directly.
    const groupId = await ctx.db
      .query("tradeIdeaGroups")
      .withIndex("by_org_user_accountId_positionId", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId)
          .eq("accountId", args.accountId)
          .eq("positionId", args.positionId),
      )
      .unique()
      .then(async (existing) => {
        const now = Date.now();
        if (existing) {
          await ctx.db.patch(existing._id, {
            connectionId: args.connectionId,
            instrumentId,
            symbol,
            status,
            direction,
            openedAt,
            closedAt,
            netQty,
            avgEntryPrice,
            realizedPnl,
            fees,
            lastExecutionAt,
            lastProcessedExecutionId,
            updatedAt: now,
          });
          return existing._id;
        }
        return await ctx.db.insert("tradeIdeaGroups", {
          organizationId: args.organizationId,
          userId: args.userId,
          connectionId: args.connectionId,
          accountId: args.accountId,
          positionId: args.positionId,
          instrumentId,
          symbol,
          status,
          direction,
          openedAt,
          closedAt,
          netQty,
          avgEntryPrice,
          realizedPnl,
          fees,
          lastExecutionAt,
          lastProcessedExecutionId,
          createdAt: now,
          updatedAt: now,
        });
      });

    let executionsLinked = 0;
    for (const e of sorted) {
      const existingEvent = await ctx.db
        .query("tradeIdeaEvents")
        .withIndex("by_org_user_externalExecutionId", (q: any) =>
          q
            .eq("organizationId", args.organizationId)
            .eq("userId", args.userId)
            .eq("externalExecutionId", e.externalExecutionId),
        )
        .first();

      if (existingEvent) {
        if (existingEvent.tradeIdeaGroupId !== groupId) {
          await ctx.db.patch(existingEvent._id, {
            tradeIdeaGroupId: groupId,
            externalOrderId: e.externalOrderId,
            externalPositionId: args.positionId,
            executedAt: e.executedAt,
          });
        }
        executionsLinked++;
        continue;
      }

      await ctx.db.insert("tradeIdeaEvents", {
        organizationId: args.organizationId,
        userId: args.userId,
        connectionId: args.connectionId,
        tradeIdeaGroupId: groupId,
        externalExecutionId: e.externalExecutionId,
        externalOrderId: e.externalOrderId,
        externalPositionId: args.positionId,
        executedAt: e.executedAt,
        createdAt: Date.now(),
      });
      executionsLinked++;
    }

    return { tradeIdeaGroupId: groupId, executionsLinked };
  },
});

export const setDiscordMessageLink = mutation({
  args: {
    tradeIdeaGroupId: v.id("tradeIdeaGroups"),
    discordChannelKind: v.union(v.literal("mentors"), v.literal("members")),
    discordChannelId: v.string(),
    discordMessageId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tradeIdeaGroupId, {
      discordChannelKind: args.discordChannelKind,
      discordChannelId: args.discordChannelId,
      discordMessageId: args.discordMessageId,
      discordLastSyncedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const markDiscordSynced = mutation({
  args: {
    tradeIdeaGroupId: v.id("tradeIdeaGroups"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tradeIdeaGroupId, {
      discordLastSyncedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});
