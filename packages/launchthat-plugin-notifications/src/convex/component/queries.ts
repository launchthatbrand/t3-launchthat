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

