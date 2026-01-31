import { v } from "convex/values";
import type { FunctionReference } from "convex/server";

import { components } from "../_generated/api";
import { query } from "../_generated/server";
import { requirePlatformAdmin } from "../traderlaunchpad/lib/resolve";

type CoreTenantQueries = {
  listOrganizationsPublic: FunctionReference<
    "query",
    "internal",
    { includePlatform?: boolean; limit?: number; search?: string },
    unknown
  >;
};

type NotificationsQueries = {
  getEventsAnalyticsSummary: FunctionReference<
    "query",
    "public",
    { daysBack?: number; maxRows?: number },
    unknown
  >;
};

type TraderLaunchpadAnalyticsQueries = {
  getUserOnboardingFunnelCounts: FunctionReference<
    "query",
    "public",
    { maxScan?: number },
    unknown
  >;
  getOnboardingSignalsForUserIds: FunctionReference<
    "query",
    "public",
    { userIds: string[]; maxRows?: number },
    unknown
  >;
};

const coreTenantQueries = (() => {
  const c = components as unknown as {
    launchthat_core_tenant?: { queries?: unknown };
  };
  return (c.launchthat_core_tenant?.queries ?? {}) as CoreTenantQueries;
})();

const notificationsQueries = (() => {
  const c = components as unknown as {
    launchthat_notifications?: { queries?: unknown };
  };
  return (c.launchthat_notifications?.queries ?? {}) as NotificationsQueries;
})();

const traderLaunchpadAnalyticsQueries = (() => {
  const c = components as unknown as {
    launchthat_traderlaunchpad?: { analytics?: { queries?: unknown } };
  };
  return (c.launchthat_traderlaunchpad?.analytics?.queries ?? {}) as TraderLaunchpadAnalyticsQueries;
})();

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

const toWeekStartDateKeyUtc = (ms: number): string => {
  try {
    const d = new Date(ms);
    // 0=Sun ... 6=Sat. We want Monday as week start.
    const dow = d.getUTCDay();
    const daysSinceMon = (dow + 6) % 7;
    const startMs = ms - daysSinceMon * 24 * 60 * 60 * 1000;
    return toDateKeyUtc(startMs);
  } catch {
    return "";
  }
};

const bucketizeDurationMs = (ms: number): string => {
  const h = 60 * 60 * 1000;
  const d = 24 * h;
  if (!Number.isFinite(ms) || ms < 0) return "unknown";
  if (ms < 1 * h) return "<1h";
  if (ms < 6 * h) return "1-6h";
  if (ms < 24 * h) return "6-24h";
  if (ms < 3 * d) return "1-3d";
  if (ms < 7 * d) return "3-7d";
  if (ms < 14 * d) return "7-14d";
  return "14d+";
};

export const getPlatformDashboardSummary = query({
  args: {
    daysBack: v.optional(v.number()),
  },
  returns: v.object({
    users: v.object({
      total: v.number(),
      isTruncated: v.boolean(),
    }),
    orgs: v.object({
      total: v.number(),
      isTruncated: v.boolean(),
    }),
    notifications: v.object({
      daysBack: v.number(),
      sent: v.number(),
      interactions: v.number(),
      uniqueUsers: v.number(),
      uniqueNotifications: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const daysBackRaw = typeof args.daysBack === "number" ? args.daysBack : 30;
    const daysBack = Math.max(1, Math.min(180, Math.floor(daysBackRaw)));

    // Users (app-owned table). Platform tooling is small-scale; scan with a cap.
    const usersCap = 5000;
    const users = await ctx.db.query("users").take(usersCap);
    const usersTotal = users.length;
    const usersIsTruncated = usersTotal >= usersCap;

    // Orgs live in core tenant component.
    const orgsCap = 2000;
    const orgsUnknown = await ctx.runQuery(coreTenantQueries.listOrganizationsPublic, {
      includePlatform: true,
      limit: orgsCap,
    });
    const orgs = Array.isArray(orgsUnknown) ? orgsUnknown : [];
    const orgsTotal = orgs.length;
    const orgsIsTruncated = orgsTotal >= orgsCap;

    // Notifications analytics from notifications component.
    const summaryUnknown = await ctx.runQuery(notificationsQueries.getEventsAnalyticsSummary, {
      daysBack,
      maxRows: 25000,
    });
    const summary =
      summaryUnknown && typeof summaryUnknown === "object"
        ? (summaryUnknown as {
            sent?: { notifications?: unknown };
            interactions?: {
              events?: unknown;
              uniqueUsers?: unknown;
              uniqueNotifications?: unknown;
            };
          })
        : null;

    const sent =
      summary && summary.sent && typeof summary.sent.notifications === "number"
        ? summary.sent.notifications
        : 0;
    const interactions =
      summary && summary.interactions && typeof summary.interactions.events === "number"
        ? summary.interactions.events
        : 0;
    const uniqueUsers =
      summary && summary.interactions && typeof summary.interactions.uniqueUsers === "number"
        ? summary.interactions.uniqueUsers
        : 0;
    const uniqueNotifications =
      summary && summary.interactions && typeof summary.interactions.uniqueNotifications === "number"
        ? summary.interactions.uniqueNotifications
        : 0;

    return {
      users: { total: usersTotal, isTruncated: usersIsTruncated },
      orgs: { total: orgsTotal, isTruncated: orgsIsTruncated },
      notifications: {
        daysBack,
        sent,
        interactions,
        uniqueUsers,
        uniqueNotifications,
      },
    };
  },
});

export const getPlatformUsersAnalyticsSummary = query({
  args: {
    maxScan: v.optional(v.number()),
  },
  returns: v.object({
    funnel: v.object({
      registered: v.object({ users: v.number(), isTruncated: v.boolean() }),
      connectedBroker: v.object({ users: v.number(), isTruncated: v.boolean() }),
      syncedAtLeastOneOrder: v.object({ users: v.number(), isTruncated: v.boolean() }),
    }),
  }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    // Registered users (app-owned table). Platform tooling is small-scale; scan with a cap.
    const usersCap = 10_000;
    const users = await ctx.db.query("users").take(usersCap);
    const registeredUsers = users.length;
    const registeredIsTruncated = registeredUsers >= usersCap;

    // Funnel counts derived from TraderLaunchpad component data (connections + tradeOrders).
    const maxScanRaw = typeof args.maxScan === "number" ? args.maxScan : 50_000;
    const maxScan = Math.max(1_000, Math.min(250_000, Math.floor(maxScanRaw)));

    const componentUnknown = await ctx.runQuery(
      traderLaunchpadAnalyticsQueries.getUserOnboardingFunnelCounts,
      { maxScan },
    );

    const component =
      componentUnknown && typeof componentUnknown === "object"
        ? (componentUnknown as {
            connected?: { users?: unknown; isTruncated?: unknown };
            synced?: { users?: unknown; isTruncated?: unknown };
          })
        : null;

    const connectedUsers =
      component?.connected && typeof component.connected.users === "number"
        ? component.connected.users
        : 0;
    const connectedIsTruncated =
      component?.connected && typeof component.connected.isTruncated === "boolean"
        ? component.connected.isTruncated
        : false;

    const syncedUsers =
      component?.synced && typeof component.synced.users === "number"
        ? component.synced.users
        : 0;
    const syncedIsTruncated =
      component?.synced && typeof component.synced.isTruncated === "boolean"
        ? component.synced.isTruncated
        : false;

    return {
      funnel: {
        registered: { users: registeredUsers, isTruncated: registeredIsTruncated },
        connectedBroker: { users: connectedUsers, isTruncated: connectedIsTruncated },
        syncedAtLeastOneOrder: { users: syncedUsers, isTruncated: syncedIsTruncated },
      },
    };
  },
});

export const getPlatformUsersAnalytics = query({
  args: {
    rangePreset: v.optional(
      v.union(
        v.literal("all"),
        v.literal("7d"),
        v.literal("30d"),
        v.literal("90d"),
        v.literal("custom"),
      ),
    ),
    fromMs: v.optional(v.number()),
    toMs: v.optional(v.number()),
    granularity: v.optional(v.union(v.literal("auto"), v.literal("day"), v.literal("month"))),
    usersCap: v.optional(v.number()),
    maxComponentRows: v.optional(v.number()),
  },
  returns: v.object({
    range: v.object({
      preset: v.string(),
      fromMs: v.number(),
      toMs: v.number(),
      chartFromMs: v.number(),
      granularity: v.union(v.literal("day"), v.literal("month")),
    }),
    users: v.object({
      scanned: v.number(),
      isTruncated: v.boolean(),
    }),
    funnel: v.object({
      registered: v.number(),
      connectedBroker: v.number(),
      syncedAtLeastOneOrder: v.number(),
    }),
    timeSeries: v.array(
      v.object({
        period: v.string(), // day: YYYY-MM-DD, month: YYYY-MM
        registered: v.number(),
        connectedBroker: v.number(),
        syncedAtLeastOneOrder: v.number(),
      }),
    ),
    timeToConnectBuckets: v.array(v.object({ bucket: v.string(), count: v.number() })),
    timeToSyncBuckets: v.array(v.object({ bucket: v.string(), count: v.number() })),
    cohortsWeekly: v.array(
      v.object({
        cohortWeek: v.string(), // week start YYYY-MM-DD (UTC)
        registered: v.number(),
        connectedWithin7d: v.number(),
        syncedWithin7d: v.number(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const now = Date.now();
    const toMsRaw = typeof args.toMs === "number" ? args.toMs : now;
    const toMs = Math.max(0, Math.min(toMsRaw, now));

    const preset =
      args.rangePreset === "7d" ||
      args.rangePreset === "30d" ||
      args.rangePreset === "90d" ||
      args.rangePreset === "custom"
        ? args.rangePreset
        : "all";

    const dayMs = 24 * 60 * 60 * 1000;
    const fromMs = (() => {
      if (preset === "7d") return toMs - 7 * dayMs;
      if (preset === "30d") return toMs - 30 * dayMs;
      if (preset === "90d") return toMs - 90 * dayMs;
      if (preset === "custom") {
        const raw = typeof args.fromMs === "number" ? args.fromMs : toMs - 30 * dayMs;
        return Math.max(0, Math.min(raw, toMs));
      }
      return 0; // all time
    })();

    // Chart start: for "all time", show last 12 months by default.
    const twelveMonthsMs = 365 * dayMs;
    const chartFromMs = preset === "all" ? Math.max(0, toMs - twelveMonthsMs) : fromMs;

    const granularityArg = args.granularity === "day" || args.granularity === "month" ? args.granularity : "auto";
    const rangeMs = Math.max(0, toMs - chartFromMs);
    const granularity =
      granularityArg === "day" || granularityArg === "month"
        ? granularityArg
        : rangeMs > 90 * dayMs
          ? "month"
          : "day";

    const usersCapRaw = typeof args.usersCap === "number" ? args.usersCap : 10_000;
    const usersCap = Math.max(1000, Math.min(50_000, Math.floor(usersCapRaw)));

    const maxComponentRowsRaw =
      typeof args.maxComponentRows === "number" ? args.maxComponentRows : 250_000;
    const maxComponentRows = Math.max(10_000, Math.min(500_000, Math.floor(maxComponentRowsRaw)));

    const users = await ctx.db.query("users").take(usersCap);
    const usersIsTruncated = users.length >= usersCap;

    // IMPORTANT: TraderLaunchpad component tables store `userId` as the auth subject
    // (Clerk user id like `user_...`), NOT the app-owned `users._id`.
    const userIds: string[] = users
      .map((u: any) => (typeof u.clerkId === "string" ? u.clerkId.trim() : ""))
      .filter(Boolean);

    const signalsUnknown = await ctx.runQuery(
      traderLaunchpadAnalyticsQueries.getOnboardingSignalsForUserIds,
      {
        userIds,
        maxRows: maxComponentRows,
      },
    );

    const signals =
      signalsUnknown && typeof signalsUnknown === "object"
        ? (signalsUnknown as {
            connectedAtByUserId?: Record<string, unknown>;
            syncedAtByUserId?: Record<string, unknown>;
          })
        : null;

    const connectedAtByUserId =
      signals?.connectedAtByUserId && typeof signals.connectedAtByUserId === "object"
        ? (signals.connectedAtByUserId as Record<string, unknown>)
        : {};
    const syncedAtByUserId =
      signals?.syncedAtByUserId && typeof signals.syncedAtByUserId === "object"
        ? (signals.syncedAtByUserId as Record<string, unknown>)
        : {};

    const toMonthKeyUtc = (ms: number): string => {
      try {
        const d = new Date(ms);
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, "0");
        return `${y}-${m}`;
      } catch {
        return "";
      }
    };

    const buckets = new Map<
      string,
      { period: string; registered: number; connectedBroker: number; syncedAtLeastOneOrder: number }
    >();

    const bump = (
      periodKey: string,
      field: "registered" | "connectedBroker" | "syncedAtLeastOneOrder",
    ) => {
      if (!periodKey) return;
      const existing = buckets.get(periodKey) ?? {
        period: periodKey,
        registered: 0,
        connectedBroker: 0,
        syncedAtLeastOneOrder: 0,
      };
      existing[field] += 1;
      buckets.set(periodKey, existing);
    };

    const timeToConnect = new Map<string, number>();
    const timeToSync = new Map<string, number>();
    const cohorts = new Map<
      string,
      { cohortWeek: string; registered: number; connectedWithin7d: number; syncedWithin7d: number }
    >();

    let connectedCount = 0;
    let syncedCount = 0;

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    for (const u of users as any[]) {
      const clerkUserId = typeof u.clerkId === "string" ? u.clerkId.trim() : "";
      const registeredAt =
        typeof u.createdAt === "number" && Number.isFinite(u.createdAt)
          ? u.createdAt
          : typeof u._creationTime === "number"
            ? u._creationTime
            : 0;

      const periodFor = (ms: number) =>
        granularity === "day" ? toDateKeyUtc(ms) : toMonthKeyUtc(ms);

      if (registeredAt > 0 && registeredAt >= chartFromMs && registeredAt <= toMs) {
        bump(periodFor(registeredAt), "registered");
      }

      const cohortKey = registeredAt > 0 ? toWeekStartDateKeyUtc(registeredAt) : "";
      if (cohortKey) {
        const c = cohorts.get(cohortKey) ?? {
          cohortWeek: cohortKey,
          registered: 0,
          connectedWithin7d: 0,
          syncedWithin7d: 0,
        };
        c.registered += 1;
        cohorts.set(cohortKey, c);
      }

      const connectedAtRaw = clerkUserId ? connectedAtByUserId[clerkUserId] : undefined;
      const connectedAt =
        typeof connectedAtRaw === "number" && Number.isFinite(connectedAtRaw) ? connectedAtRaw : null;
      if (connectedAt !== null) {
        connectedCount += 1;
        if (connectedAt >= chartFromMs && connectedAt <= toMs) bump(periodFor(connectedAt), "connectedBroker");
        if (registeredAt > 0) {
          const bucket = bucketizeDurationMs(connectedAt - registeredAt);
          timeToConnect.set(bucket, (timeToConnect.get(bucket) ?? 0) + 1);
        }
        if (cohortKey && registeredAt > 0) {
          const c = cohorts.get(cohortKey);
          if (c && connectedAt <= registeredAt + sevenDaysMs) c.connectedWithin7d += 1;
        }
      }

      const syncedAtRaw = clerkUserId ? syncedAtByUserId[clerkUserId] : undefined;
      const syncedAt =
        typeof syncedAtRaw === "number" && Number.isFinite(syncedAtRaw) ? syncedAtRaw : null;
      if (syncedAt !== null) {
        syncedCount += 1;
        if (syncedAt >= chartFromMs && syncedAt <= toMs) bump(periodFor(syncedAt), "syncedAtLeastOneOrder");
        const baseAt = connectedAt ?? registeredAt;
        if (typeof baseAt === "number" && baseAt > 0) {
          const bucket = bucketizeDurationMs(syncedAt - baseAt);
          timeToSync.set(bucket, (timeToSync.get(bucket) ?? 0) + 1);
        }
        if (cohortKey && registeredAt > 0) {
          const c = cohorts.get(cohortKey);
          if (c && syncedAt <= registeredAt + sevenDaysMs) c.syncedWithin7d += 1;
        }
      }
    }

    // Emit series for the full chart window (fill zeros).
    const timeSeries: Array<{
      period: string;
      registered: number;
      connectedBroker: number;
      syncedAtLeastOneOrder: number;
    }> = [];

    if (granularity === "day") {
      const days = Math.max(1, Math.min(400, Math.ceil((toMs - chartFromMs) / dayMs) + 1));
      for (let i = days - 1; i >= 0; i--) {
        const ms = toMs - i * dayMs;
        const key = toDateKeyUtc(ms);
        const row =
          buckets.get(key) ?? {
            period: key,
            registered: 0,
            connectedBroker: 0,
            syncedAtLeastOneOrder: 0,
          };
        timeSeries.push(row);
      }
    } else {
      const start = new Date(chartFromMs);
      const end = new Date(toMs);
      const startY = start.getUTCFullYear();
      const startM = start.getUTCMonth();
      const endY = end.getUTCFullYear();
      const endM = end.getUTCMonth();
      const months = Math.max(1, Math.min(36, (endY - startY) * 12 + (endM - startM) + 1));
      for (let i = 0; i < months; i++) {
        const y = startY + Math.floor((startM + i) / 12);
        const m = (startM + i) % 12;
        const key = `${y}-${String(m + 1).padStart(2, "0")}`;
        const row =
          buckets.get(key) ?? {
            period: key,
            registered: 0,
            connectedBroker: 0,
            syncedAtLeastOneOrder: 0,
          };
        timeSeries.push(row);
      }
    }

    const bucketOrder = ["<1h", "1-6h", "6-24h", "1-3d", "3-7d", "7-14d", "14d+", "unknown"];
    const timeToConnectBuckets = bucketOrder
      .filter((b) => timeToConnect.has(b))
      .map((bucket) => ({ bucket, count: timeToConnect.get(bucket) ?? 0 }));
    const timeToSyncBuckets = bucketOrder
      .filter((b) => timeToSync.has(b))
      .map((bucket) => ({ bucket, count: timeToSync.get(bucket) ?? 0 }));

    const cohortsWeekly = Array.from(cohorts.values())
      .sort((a, b) => a.cohortWeek.localeCompare(b.cohortWeek))
      .slice(-52);

    return {
      range: { preset, fromMs, toMs, chartFromMs, granularity },
      users: { scanned: users.length, isTruncated: usersIsTruncated },
      funnel: {
        registered: users.length,
        connectedBroker: connectedCount,
        syncedAtLeastOneOrder: syncedCount,
      },
      timeSeries,
      timeToConnectBuckets,
      timeToSyncBuckets,
      cohortsWeekly,
    };
  },
});

