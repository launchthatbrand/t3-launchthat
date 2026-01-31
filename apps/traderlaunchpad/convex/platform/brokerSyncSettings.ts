/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-argument,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-return
*/

import { internalQuery, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requirePlatformAdmin } from "../traderlaunchpad/lib/resolve";

const SETTINGS_KEY = "main";
const MIN_INTERVAL_MS = 60_000;
const MAX_INTERVAL_MS = 10 * 60_000;

const clampIntervalMs = (value: number): number =>
  Math.max(MIN_INTERVAL_MS, Math.min(MAX_INTERVAL_MS, Math.floor(value)));

const defaultSettings = () => ({
  freeIntervalMs: 5 * 60_000,
  standardIntervalMs: 2 * 60_000,
  proIntervalMs: 60_000,
  updatedAt: 0,
});

export const getBrokerSyncSettings = query({
  args: {},
  returns: v.object({
    freeIntervalMs: v.number(),
    standardIntervalMs: v.number(),
    proIntervalMs: v.number(),
    updatedAt: v.number(),
  }),
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);
    const row = await ctx.db
      .query("platformBrokerSyncSettings")
      .withIndex("by_key", (q) => (q as any).eq("key", SETTINGS_KEY))
      .first();
    if (!row) return defaultSettings();
    return {
      freeIntervalMs: clampIntervalMs(Number((row as any).freeIntervalMs ?? 0)),
      standardIntervalMs: clampIntervalMs(Number((row as any).standardIntervalMs ?? 0)),
      proIntervalMs: clampIntervalMs(Number((row as any).proIntervalMs ?? 0)),
      updatedAt: Number((row as any).updatedAt ?? 0),
    };
  },
});

export const upsertBrokerSyncSettings = mutation({
  args: {
    freeIntervalMs: v.number(),
    standardIntervalMs: v.number(),
    proIntervalMs: v.number(),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const now = Date.now();
    const payload = {
      key: SETTINGS_KEY,
      freeIntervalMs: clampIntervalMs(args.freeIntervalMs),
      standardIntervalMs: clampIntervalMs(args.standardIntervalMs),
      proIntervalMs: clampIntervalMs(args.proIntervalMs),
      updatedAt: now,
    };
    const existing = await ctx.db
      .query("platformBrokerSyncSettings")
      .withIndex("by_key", (q) => (q as any).eq("key", SETTINGS_KEY))
      .first();
    if (existing) {
      await ctx.db.patch((existing as any)._id, payload);
      return { ok: true };
    }
    await ctx.db.insert("platformBrokerSyncSettings", {
      ...payload,
      createdAt: now,
    });
    return { ok: true };
  },
});

export const getBrokerSyncSettingsInternal = internalQuery({
  args: {},
  returns: v.object({
    freeIntervalMs: v.number(),
    standardIntervalMs: v.number(),
    proIntervalMs: v.number(),
    updatedAt: v.number(),
  }),
  handler: async (ctx) => {
    const row = await ctx.db
      .query("platformBrokerSyncSettings")
      .withIndex("by_key", (q) => (q as any).eq("key", SETTINGS_KEY))
      .first();
    if (!row) return defaultSettings();
    return {
      freeIntervalMs: clampIntervalMs(Number((row as any).freeIntervalMs ?? 0)),
      standardIntervalMs: clampIntervalMs(Number((row as any).standardIntervalMs ?? 0)),
      proIntervalMs: clampIntervalMs(Number((row as any).proIntervalMs ?? 0)),
      updatedAt: Number((row as any).updatedAt ?? 0),
    };
  },
});
