/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

export const listDueSyncRules = internalQuery({
  args: {
    nowMs: v.number(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(200, Number(args.limit ?? 50)));
    const nowMs = Number(args.nowMs);

    // Index supports enabled + nextRunAt, but we still need to filter on nowMs.
    const candidates: any[] = await ctx.db
      .query("platformPriceDataSyncRules")
      .withIndex("by_enabled_and_nextRunAt", (q) => q.eq("enabled", true))
      .order("asc")
      .take(500);

    return (Array.isArray(candidates) ? candidates : [])
      .filter((r) => Number(r?.nextRunAt ?? Infinity) <= nowMs)
      .slice(0, limit);
  },
});

export const listEnabledAccountPoliciesForSourceKey = internalQuery({
  args: {
    sourceKey: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const sourceKey = args.sourceKey.trim().toLowerCase();
    const limit = Math.max(1, Math.min(200, Number(args.limit ?? 50)));
    if (!sourceKey) return [];

    const rows: any[] = await ctx.db
      .query("platformPriceDataAccountPolicies")
      .withIndex("by_sourceKey_and_enabled", (q) =>
        q.eq("sourceKey", sourceKey).eq("enabledForPriceData", true),
      )
      .take(limit);
    return Array.isArray(rows) ? rows : [];
  },
});

export const getSchedulerState = internalQuery({
  args: {},
  returns: v.union(v.null(), v.any()),
  handler: async (ctx) => {
    const row = await ctx.db
      .query("platformPriceDataSyncSchedulerState")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .first();
    return row ?? null;
  },
});

