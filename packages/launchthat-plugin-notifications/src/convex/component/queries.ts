import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { query } from "./server";

const decodeCreatedAtCursor = (cursor: string | null): number | null => {
  if (!cursor) return null;
  const n = Number(cursor);
  return Number.isFinite(n) ? n : null;
};

const encodeCreatedAtCursor = (createdAt: number): string => String(createdAt);

export const paginateByUserIdAndOrgId = query({
  args: {
    userId: v.string(),
    orgId: v.string(),
    filters: v.optional(
      v.object({
        eventKey: v.optional(v.string()),
        tabKey: v.optional(v.string()),
      }),
    ),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const cursorCreatedAt = decodeCreatedAtCursor(args.paginationOpts.cursor);

    // Fetch a bit extra so we can compute isDone without `.paginate()`.
    const limit = Math.max(1, args.paginationOpts.numItems);
    const take = limit + 1;

    const q = ctx.db
      .query("notifications")
      .withIndex("by_user_org_createdAt", (q: any) => {
        const base = q.eq("userId", args.userId).eq("orgId", args.orgId);
        return cursorCreatedAt !== null ? base.lt("createdAt", cursorCreatedAt) : base;
      })
      .order("desc");

    const rows = await q.take(take);
    const hasMore = rows.length > limit;
    const slice = rows.slice(0, limit);

    const eventKey =
      typeof args.filters?.eventKey === "string" ? args.filters.eventKey.trim() : undefined;
    const tabKey = typeof args.filters?.tabKey === "string" ? args.filters.tabKey : undefined;

    const page = slice.filter((n: any) => {
      if (eventKey && n.eventKey !== eventKey) return false;
      if (tabKey && n.tabKey !== tabKey) return false;
      return true;
    });

    const last = slice[slice.length - 1] as any;
    const continueCursor =
      hasMore && typeof last?.createdAt === "number"
        ? encodeCreatedAtCursor(last.createdAt)
        : null;

    return { page, isDone: !hasMore, continueCursor };
  },
});

export const paginateByUserIdAcrossOrgs = query({
  args: {
    userId: v.string(),
    filters: v.optional(
      v.object({
        eventKey: v.optional(v.string()),
        tabKey: v.optional(v.string()),
      }),
    ),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const cursorCreatedAt = decodeCreatedAtCursor(args.paginationOpts.cursor);
    const limit = Math.max(1, args.paginationOpts.numItems);

    const eventKey =
      typeof args.filters?.eventKey === "string"
        ? args.filters.eventKey.trim()
        : undefined;
    const tabKey = typeof args.filters?.tabKey === "string" ? args.filters.tabKey : undefined;

    // Because we might filter out items, fetch in chunks until we fill `limit` or exhaust.
    const page: any[] = [];
    let nextCursorCreatedAt: number | null = cursorCreatedAt;
    let isDone = false;

    for (let i = 0; i < 10; i++) {
      const q = ctx.db
        .query("notifications")
        .withIndex("by_user_createdAt", (q: any) => {
          const base = q.eq("userId", args.userId);
          return nextCursorCreatedAt !== null ? base.lt("createdAt", nextCursorCreatedAt) : base;
        })
        .order("desc");

      const chunk = await q.take(limit * 3 + 1);
      if (chunk.length === 0) {
        isDone = true;
        break;
      }

      for (const n of chunk) {
        if (eventKey && n.eventKey !== eventKey) continue;
        if (tabKey && n.tabKey !== tabKey) continue;
        page.push(n);
        if (page.length >= limit) break;
      }

      const last = chunk[chunk.length - 1] as any;
      nextCursorCreatedAt = typeof last?.createdAt === "number" ? last.createdAt : null;

      if (page.length >= limit) {
        isDone = false;
        break;
      }

      if (chunk.length <= limit * 3) {
        isDone = true;
        break;
      }
    }

    const trimmed = page.slice(0, limit);
    const lastIncluded = trimmed[trimmed.length - 1] as any;
    const continueCursor =
      !isDone && typeof lastIncluded?.createdAt === "number"
        ? encodeCreatedAtCursor(lastIncluded.createdAt)
        : null;

    return { page: trimmed, isDone, continueCursor };
  },
});

/**
 * Read delivery toggles for a given user/org + eventKey.
 * Used by app-level test harnesses to implement "respectPreferences" mode.
 *
 * Note: user email is app-owned (root table), so this only returns toggle booleans.
 */
export const getDeliveryTogglesForUserEvent = query({
  args: {
    userId: v.string(),
    orgId: v.string(),
    eventKey: v.string(),
  },
  returns: v.object({
    userInAppOverride: v.union(v.boolean(), v.null()),
    userEmailOverride: v.union(v.boolean(), v.null()),
    orgInAppDefault: v.union(v.boolean(), v.null()),
    orgEmailDefault: v.union(v.boolean(), v.null()),
  }),
  handler: async (ctx, args) => {
    const eventKey = args.eventKey.trim();

    const orgDefaults = await ctx.db
      .query("notificationOrgDefaults")
      .withIndex("by_org", (q: any) => q.eq("orgId", args.orgId))
      .first();

    const userPrefs = await ctx.db
      .query("notificationUserEventPrefs")
      .withIndex("by_user_org", (q: any) =>
        q.eq("userId", args.userId).eq("orgId", args.orgId),
      )
      .first();

    const userInAppOverride =
      typeof userPrefs?.inAppEnabled?.[eventKey] === "boolean"
        ? Boolean(userPrefs.inAppEnabled?.[eventKey])
        : null;
    const userEmailOverride =
      typeof userPrefs?.emailEnabled?.[eventKey] === "boolean"
        ? Boolean(userPrefs.emailEnabled?.[eventKey])
        : null;

    const orgInAppDefault =
      typeof orgDefaults?.inAppDefaults?.[eventKey] === "boolean"
        ? Boolean(orgDefaults.inAppDefaults?.[eventKey])
        : null;
    const orgEmailDefault =
      typeof orgDefaults?.emailDefaults?.[eventKey] === "boolean"
        ? Boolean(orgDefaults.emailDefaults?.[eventKey])
        : null;

    return {
      userInAppOverride,
      userEmailOverride,
      orgInAppDefault,
      orgEmailDefault,
    };
  },
});

/**
 * Unread count across all orgs for a user.
 * Useful for header badge indicators (TraderLaunchpad-style inbox).
 */
export const getUnreadCountByUserIdAcrossOrgs = query({
  args: { userId: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q: any) => q.eq("userId", args.userId).eq("read", false))
      .collect();
    return unread.length;
  },
});

/**
 * Unread count for a user within a specific org.
 * Useful for portal-style org-scoped inbox.
 */
export const getUnreadCountByUserIdAndOrgId = query({
  args: { userId: v.string(), orgId: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_org_read", (q: any) =>
        q.eq("userId", args.userId).eq("orgId", args.orgId).eq("read", false),
      )
      .collect();
    return unread.length;
  },
});

/**
 * Platform-style analytics summary for notification interactions.
 *
 * This is intentionally "best effort" and can be refined as volume grows.
 * For now it aggregates counts over a recent window, grouped by:
 * - eventKey
 * - channel
 * - eventType
 */
export const getEventsAnalyticsSummary = query({
  args: {
    daysBack: v.optional(v.number()),
    maxRows: v.optional(v.number()),
  },
  returns: v.object({
    fromCreatedAt: v.number(),
    timeSeriesDaily: v.array(
      v.object({
        date: v.string(), // YYYY-MM-DD (UTC)
        sent: v.number(),
        interactions: v.number(),
        ctrPct: v.number(),
      }),
    ),
    interactionsByChannelDaily: v.array(
      v.object({
        date: v.string(), // YYYY-MM-DD (UTC)
        push: v.number(),
        inApp: v.number(),
        email: v.number(),
        other: v.number(),
      }),
    ),
    sent: v.object({
      notifications: v.number(),
      byEventKey: v.array(v.object({ eventKey: v.string(), count: v.number() })),
    }),
    interactions: v.object({
      events: v.number(),
      uniqueNotifications: v.number(),
      uniqueUsers: v.number(),
      byEventKey: v.array(v.object({ eventKey: v.string(), count: v.number() })),
      byChannelAndType: v.array(
        v.object({
          channel: v.string(),
          eventType: v.string(),
          count: v.number(),
        }),
      ),
    }),
    eventKeyMetrics: v.array(
      v.object({
        eventKey: v.string(),
        sent: v.number(),
        interactions: v.number(),
        ctrPct: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const daysBackRaw = typeof args.daysBack === "number" ? args.daysBack : 30;
    const daysBack = Math.max(1, Math.min(180, Math.floor(daysBackRaw)));
    const fromCreatedAt = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    const maxRowsRaw = typeof args.maxRows === "number" ? args.maxRows : 25000;
    const maxRows = Math.max(100, Math.min(250000, Math.floor(maxRowsRaw)));

    const byEventKeyCount = new Map<string, number>();
    const byChannelTypeCount = new Map<string, number>();
    const interactionsByDay = new Map<string, number>();
    const interactionsByDayChannel = new Map<
      string,
      { push: number; inApp: number; email: number; other: number }
    >();
    const notificationIds = new Set<string>();
    const userIds = new Set<string>();

    let events = 0;

    const toDateKeyUtc = (ms: number): string => {
      try {
        const d = new Date(ms);
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, "0");
        const day = String(d.getUTCDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      } catch {
        return "";
      }
    };

    // Use the createdAt index to efficiently scan the recent window.
    const q = ctx.db
      .query("notificationEvents")
      .withIndex("by_createdAt", (q: any) => q.gte("createdAt", fromCreatedAt))
      .order("desc");

    for await (const row of q) {
      events += 1;
      if (events > maxRows) break;

      const eventKey = typeof (row as any).eventKey === "string" ? (row as any).eventKey : "";
      const channel = typeof (row as any).channel === "string" ? (row as any).channel : "";
      const eventType =
        typeof (row as any).eventType === "string" ? (row as any).eventType : "";

      const notificationId =
        typeof (row as any).notificationId === "string" ? (row as any).notificationId : "";
      const userId = typeof (row as any).userId === "string" ? (row as any).userId : "";
      const createdAt = typeof (row as any).createdAt === "number" ? (row as any).createdAt : 0;

      if (eventKey) byEventKeyCount.set(eventKey, (byEventKeyCount.get(eventKey) ?? 0) + 1);
      if (channel || eventType) {
        const key = `${channel}::${eventType}`;
        byChannelTypeCount.set(key, (byChannelTypeCount.get(key) ?? 0) + 1);
      }
      if (notificationId) notificationIds.add(notificationId);
      if (userId) userIds.add(userId);

      // Daily buckets (UTC)
      if (createdAt > 0) {
        const dateKey = toDateKeyUtc(createdAt);
        if (dateKey) interactionsByDay.set(dateKey, (interactionsByDay.get(dateKey) ?? 0) + 1);

        const bucket =
          channel === "push"
            ? "push"
            : channel === "inApp"
              ? "inApp"
              : channel === "email"
                ? "email"
                : "other";
        const existing = interactionsByDayChannel.get(dateKey) ?? {
          push: 0,
          inApp: 0,
          email: 0,
          other: 0,
        };
        existing[bucket] += 1;
        interactionsByDayChannel.set(dateKey, existing);
      }
    }

    const byEventKey = Array.from(byEventKeyCount.entries())
      .map(([eventKey, count]) => ({ eventKey, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    const byChannelAndType = Array.from(byChannelTypeCount.entries())
      .map(([key, count]) => {
        const [channel, eventType] = key.split("::");
        return { channel: channel ?? "", eventType: eventType ?? "", count };
      })
      .sort((a, b) => b.count - a.count);

    // "Sent" = notifications created (canonical delivery). This is distinct from interactions.
    const sentByEventKeyCount = new Map<string, number>();
    const sentByDay = new Map<string, number>();
    let notifications = 0;

    const nq = ctx.db
      .query("notifications")
      .withIndex("by_createdAt", (q: any) => q.gte("createdAt", fromCreatedAt))
      .order("desc");

    for await (const row of nq) {
      notifications += 1;
      if (notifications > maxRows) break;
      const eventKey = typeof (row as any).eventKey === "string" ? (row as any).eventKey : "";
      const createdAt = typeof (row as any).createdAt === "number" ? (row as any).createdAt : 0;
      if (eventKey) {
        sentByEventKeyCount.set(eventKey, (sentByEventKeyCount.get(eventKey) ?? 0) + 1);
      }
      if (createdAt > 0) {
        const dateKey = toDateKeyUtc(createdAt);
        if (dateKey) sentByDay.set(dateKey, (sentByDay.get(dateKey) ?? 0) + 1);
      }
    }

    const sentByEventKey = Array.from(sentByEventKeyCount.entries())
      .map(([eventKey, count]) => ({ eventKey, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    const eventKeyMetrics = (() => {
      const keys = new Set<string>([
        ...Array.from(sentByEventKeyCount.keys()),
        ...Array.from(byEventKeyCount.keys()),
      ]);
      const rows = Array.from(keys)
        .map((eventKey) => {
          const sent = sentByEventKeyCount.get(eventKey) ?? 0;
          const interactions = byEventKeyCount.get(eventKey) ?? 0;
          const ctrPct = sent > 0 ? (interactions / sent) * 100 : 0;
          return { eventKey, sent, interactions, ctrPct };
        })
        .sort((a, b) => b.sent - a.sent)
        .slice(0, 50);
      return rows;
    })();

    const timeSeriesDaily = (() => {
      const out: Array<{ date: string; sent: number; interactions: number; ctrPct: number }> = [];
      for (let i = daysBack - 1; i >= 0; i--) {
        const dayMs = Date.now() - i * 24 * 60 * 60 * 1000;
        const date = toDateKeyUtc(dayMs);
        const sent = sentByDay.get(date) ?? 0;
        const interactions = interactionsByDay.get(date) ?? 0;
        const ctrPct = sent > 0 ? (interactions / sent) * 100 : 0;
        out.push({ date, sent, interactions, ctrPct });
      }
      return out;
    })();

    const interactionsByChannelDaily = (() => {
      const out: Array<{
        date: string;
        push: number;
        inApp: number;
        email: number;
        other: number;
      }> = [];
      for (let i = daysBack - 1; i >= 0; i--) {
        const dayMs = Date.now() - i * 24 * 60 * 60 * 1000;
        const date = toDateKeyUtc(dayMs);
        const row = interactionsByDayChannel.get(date) ?? {
          push: 0,
          inApp: 0,
          email: 0,
          other: 0,
        };
        out.push({ date, ...row });
      }
      return out;
    })();

    return {
      fromCreatedAt,
      timeSeriesDaily,
      interactionsByChannelDaily,
      sent: {
        notifications,
        byEventKey: sentByEventKey,
      },
      interactions: {
        events,
        uniqueNotifications: notificationIds.size,
        uniqueUsers: userIds.size,
        byEventKey,
        byChannelAndType,
      },
      eventKeyMetrics,
    };
  },
});

