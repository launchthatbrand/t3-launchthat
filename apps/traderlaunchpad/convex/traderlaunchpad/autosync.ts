/* eslint-disable no-restricted-properties */
/* eslint-disable turbo/no-undeclared-env-vars */
"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";

import { env } from "../../src/env";
import { internal } from "../_generated/api";

// IMPORTANT: Avoid importing the typed Convex `components` here — it can trigger TS
// "type instantiation is excessively deep". Pull via require() to keep it `any`.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const componentsUntyped: any = require("../_generated/api").components;

type DueConnectionRow = {
  _id: unknown;
  organizationId?: unknown;
  userId?: unknown;
  lastSyncAt?: unknown;
};

const toStringSafe = (v: unknown): string => (typeof v === "string" ? v : "");
const toNumberSafe = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;

type SyncSettings = {
  freeIntervalMs: number;
  standardIntervalMs: number;
  proIntervalMs: number;
};

const clampIntervalMs = (value: number): number =>
  Math.max(10_000, Math.min(10 * 60_000, Math.floor(value)));

const resolveIntervalMsForTier = (tier: string, settings: SyncSettings): number => {
  if (tier === "pro") return clampIntervalMs(settings.proIntervalMs);
  if (tier === "standard") return clampIntervalMs(settings.standardIntervalMs);
  return clampIntervalMs(settings.freeIntervalMs);
};

export const runDueTradeLockerAutosync = internalAction({
  args: {
    // Allow tuning from tests or manual invocations.
    maxActive: v.optional(v.number()),
    maxWarm: v.optional(v.number()),
    activeWindowMs: v.optional(v.number()),
    intervalMs: v.optional(v.number()),
    leaseMs: v.optional(v.number()),
  },
  returns: v.object({
    ok: v.boolean(),
    checked: v.number(),
    claimed: v.number(),
    succeeded: v.number(),
    failed: v.number(),
    intervalMs: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();

    const settings = (await ctx.runQuery(
      internal.platform.brokerSyncSettings.getBrokerSyncSettingsInternal,
      {},
    )) as SyncSettings;
    const minIntervalMs = clampIntervalMs(
      Math.min(settings.freeIntervalMs, settings.standardIntervalMs, settings.proIntervalMs),
    );
    const intervalMs =
      typeof args.intervalMs === "number" && Number.isFinite(args.intervalMs)
        ? clampIntervalMs(args.intervalMs)
        : minIntervalMs;

    // "Active" tier prioritizes currently-active accounts (recent broker activity / open trades).
    const activeWindowMsRaw =
      typeof args.activeWindowMs === "number" && Number.isFinite(args.activeWindowMs)
        ? Math.floor(args.activeWindowMs)
        : 30 * 60_000;
    const activeWindowMs = Math.max(10_000, Math.min(24 * 60 * 60_000, activeWindowMsRaw));

    const maxActiveRaw =
      typeof args.maxActive === "number" && Number.isFinite(args.maxActive)
        ? Math.floor(args.maxActive)
        : 25;
    const maxWarmRaw =
      typeof args.maxWarm === "number" && Number.isFinite(args.maxWarm)
        ? Math.floor(args.maxWarm)
        : 25;
    const maxActive = Math.max(0, Math.min(200, maxActiveRaw));
    const maxWarm = Math.max(0, Math.min(200, maxWarmRaw));

    // Lease should cover typical sync duration + some buffer.
    const leaseMsRaw =
      typeof args.leaseMs === "number" && Number.isFinite(args.leaseMs)
        ? Math.floor(args.leaseMs)
        : 5 * 60_000;
    const leaseMs = Math.max(30_000, Math.min(30 * 60_000, leaseMsRaw));

    const connectionsInternal = componentsUntyped.launchthat_traderlaunchpad.connections.internalQueries;
    const connectionsMutations = componentsUntyped.launchthat_traderlaunchpad.connections.mutations;
    const syncActions = componentsUntyped.launchthat_traderlaunchpad.sync;

    const leaseOwner = `cron:tradelocker:${now}:${Math.random().toString(16).slice(2)}`;

    const activeRaw: unknown = maxActive
      ? await ctx.runQuery(connectionsInternal.listConnectionsDueForPoll, {
          tier: "active",
          now,
          dueIntervalMs: intervalMs,
          activeWindowMs,
          limit: maxActive,
        })
      : [];
    const warmRaw: unknown = maxWarm
      ? await ctx.runQuery(connectionsInternal.listConnectionsDueForPoll, {
          tier: "warm",
          now,
          dueIntervalMs: intervalMs,
          limit: maxWarm,
        })
      : [];

    const active = Array.isArray(activeRaw) ? (activeRaw as DueConnectionRow[]) : [];
    const warm = Array.isArray(warmRaw) ? (warmRaw as DueConnectionRow[]) : [];

    // Combine, de-dupe, prioritize most overdue (lowest lastSyncAt).
    const seen = new Set<string>();
    const combined: Array<{ id: string; orgId: string; userId: string; lastSyncAt: number }> = [];
    for (const row of [...active, ...warm]) {
      const id = toStringSafe((row as any)?._id);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      combined.push({
        id,
        orgId: toStringSafe((row as any)?.organizationId),
        userId: toStringSafe((row as any)?.userId),
        lastSyncAt: toNumberSafe((row as any)?.lastSyncAt),
      });
    }
    combined.sort((a, b) => a.lastSyncAt - b.lastSyncAt);

    const uniqueUserIds = Array.from(new Set(combined.map((c) => c.userId).filter(Boolean)));
    const entitlements = (await ctx.runQuery(
      internal.accessPolicy.listEntitlementsByUserIds,
      { userIds: uniqueUserIds },
    )) as Array<{ userId: string; tier: string }>;
    const tierByUserId = new Map(entitlements.map((row) => [row.userId, row.tier]));

    const dueCombined = combined.filter((c) => {
      const tier = tierByUserId.get(c.userId) ?? "free";
      const intervalForUser = resolveIntervalMsForTier(tier, settings);
      const dueBefore = now - intervalForUser;
      return c.lastSyncAt <= dueBefore;
    });

    const toClaim = dueCombined.map((c) => c.id);
    const checked = toClaim.length;
    if (toClaim.length === 0) {
      return { ok: true, checked: 0, claimed: 0, succeeded: 0, failed: 0, intervalMs };
    }

    const claimedUnknown: unknown = await ctx.runMutation(connectionsMutations.claimSyncLeases, {
      connectionIds: toClaim,
      now,
      leaseMs,
      leaseOwner,
    });
    const claimedIds = Array.isArray(claimedUnknown) ? (claimedUnknown as unknown[]) : [];
    const claimedSet = new Set(claimedIds.map((id) => toStringSafe(id)));

    let succeeded = 0;
    let failed = 0;

    for (const c of dueCombined) {
      if (!claimedSet.has(c.id)) continue;
      if (!c.orgId || !c.userId) {
        failed += 1;
        continue;
      }

      try {
        await ctx.runAction(syncActions.syncTradeLockerConnection, {
          organizationId: c.orgId,
          userId: c.userId,
          limit: 500,
          secretsKey: env.TRADELOCKER_SECRETS_KEY,
          tokenStorage: env.TRADELOCKER_TOKEN_STORAGE,
        });
        succeeded += 1;
      } catch (err) {
        failed += 1;
        const msg = err instanceof Error ? err.message : String(err);
        // Record error + clear lease so future runs can retry.
        try {
          await ctx.runMutation(connectionsMutations.updateConnectionSyncState, {
            connectionId: c.id,
            status: "error",
            lastError: msg.slice(0, 500),
            syncLeaseUntil: 0,
            syncLeaseOwner: "",
          });
        } catch {
          // ignore
        }
        continue;
      }

      // Always clear lease after successful sync.
      try {
        await ctx.runMutation(connectionsMutations.updateConnectionSyncState, {
          connectionId: c.id,
          syncLeaseUntil: 0,
          syncLeaseOwner: "",
        });
      } catch {
        // ignore
      }
    }

    return {
      ok: true,
      checked,
      claimed: claimedSet.size,
      succeeded,
      failed,
      intervalMs,
    };
  },
});

