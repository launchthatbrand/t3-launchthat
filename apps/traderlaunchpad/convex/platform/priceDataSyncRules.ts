/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { mutation, query } from "../_generated/server";
import { requirePlatformAdmin } from "../traderlaunchpad/lib/resolve";

const clampCadenceSeconds = (raw: number): number => {
  if (!Number.isFinite(raw)) return 60;
  // Keep within reasonable bounds for now.
  return Math.max(10, Math.min(60 * 60, Math.floor(raw)));
};

const clampOverlapSeconds = (raw: number): number => {
  if (!Number.isFinite(raw)) return 60;
  return Math.max(0, Math.min(10 * 60, Math.floor(raw)));
};

export const listSyncRules = query({
  args: {
    limit: v.optional(v.number()),
    sourceKey: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("platformPriceDataSyncRules"),
      _creationTime: v.number(),
      sourceKey: v.string(),
      tradableInstrumentId: v.string(),
      symbol: v.string(),
      resolution: v.union(v.literal("1m")),
      cadenceSeconds: v.number(),
      overlapSeconds: v.number(),
      enabled: v.boolean(),
      nextRunAt: v.number(),
      lastRunAt: v.optional(v.number()),
      lastOkAt: v.optional(v.number()),
      lastError: v.optional(v.string()),
      lastSeenMaxTsMs: v.optional(v.number()),
      lastAccountRowIdUsed: v.optional(v.string()),
      infoRouteId: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const limit = Math.max(1, Math.min(500, Number(args.limit ?? 200)));
    const sourceKey = typeof args.sourceKey === "string" ? args.sourceKey.trim().toLowerCase() : "";

    const rows: any[] = await ctx.db
      .query("platformPriceDataSyncRules")
      .withIndex("by_nextRunAt")
      .order("asc")
      .take(limit);
    const filtered = sourceKey ? rows.filter((r) => String(r?.sourceKey ?? "") === sourceKey) : rows;
    const sliced = (Array.isArray(filtered) ? filtered : []).slice(0, limit);
    return sliced;
  },
});

export const createSyncRule = mutation({
  args: {
    sourceKey: v.string(),
    tradableInstrumentId: v.string(),
    symbol: v.string(),
    cadenceSeconds: v.optional(v.number()),
    overlapSeconds: v.optional(v.number()),
    enabled: v.optional(v.boolean()),
  },
  returns: v.object({ ruleId: v.id("platformPriceDataSyncRules") }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const sourceKey = args.sourceKey.trim().toLowerCase();
    const tradableInstrumentId = args.tradableInstrumentId.trim();
    const symbol = args.symbol.trim().toUpperCase();
    if (!sourceKey) throw new Error("Missing sourceKey");
    if (!tradableInstrumentId) throw new Error("Missing tradableInstrumentId");
    if (!symbol) throw new Error("Missing symbol");

    const now = Date.now();
    const cadenceSeconds = clampCadenceSeconds(Number(args.cadenceSeconds ?? 60));
    const overlapSeconds = clampOverlapSeconds(Number(args.overlapSeconds ?? 60));
    const enabled = args.enabled !== false;

    // Best-effort de-dupe: if a rule already exists, return it.
    const existing = await ctx.db
      .query("platformPriceDataSyncRules")
      .withIndex("by_source_and_instrument", (ix) =>
        ix.eq("sourceKey", sourceKey).eq("tradableInstrumentId", tradableInstrumentId),
      )
      .first();
    if (existing) return { ruleId: existing._id };

    const ruleId = await ctx.db.insert("platformPriceDataSyncRules", {
      sourceKey,
      tradableInstrumentId,
      symbol,
      resolution: "1m",
      cadenceSeconds,
      overlapSeconds,
      enabled,
      nextRunAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return { ruleId };
  },
});

export const updateSyncRule = mutation({
  args: {
    ruleId: v.id("platformPriceDataSyncRules"),
    cadenceSeconds: v.optional(v.number()),
    overlapSeconds: v.optional(v.number()),
    enabled: v.optional(v.boolean()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const row: any = await ctx.db.get(args.ruleId);
    if (!row) throw new Error("Rule not found");

    const patch: any = { updatedAt: Date.now() };
    if (args.cadenceSeconds !== undefined) patch.cadenceSeconds = clampCadenceSeconds(Number(args.cadenceSeconds));
    if (args.overlapSeconds !== undefined) patch.overlapSeconds = clampOverlapSeconds(Number(args.overlapSeconds));
    if (args.enabled !== undefined) patch.enabled = Boolean(args.enabled);

    await ctx.db.patch(args.ruleId, patch);
    return { ok: true };
  },
});

export const setRuleEnabled = mutation({
  args: {
    ruleId: v.id("platformPriceDataSyncRules"),
    enabled: v.boolean(),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    await ctx.db.patch(args.ruleId, { enabled: Boolean(args.enabled), updatedAt: Date.now() });
    return { ok: true };
  },
});

export const deleteSyncRule = mutation({
  args: { ruleId: v.id("platformPriceDataSyncRules") },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    await ctx.db.delete(args.ruleId);
    return { ok: true };
  },
});

