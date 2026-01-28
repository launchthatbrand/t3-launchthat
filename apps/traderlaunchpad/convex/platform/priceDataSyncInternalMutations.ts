/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/

import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const upsertSchedulerState = internalMutation({
  args: {
    lastTickAt: v.optional(v.number()),
    lastTickOkAt: v.optional(v.number()),
    lastTickError: v.optional(v.string()),
    processedRulesLastTick: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("platformPriceDataSyncSchedulerState")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .first();

    const patch = {
      ...(args.lastTickAt !== undefined ? { lastTickAt: args.lastTickAt } : {}),
      ...(args.lastTickOkAt !== undefined ? { lastTickOkAt: args.lastTickOkAt } : {}),
      ...(args.lastTickError !== undefined ? { lastTickError: args.lastTickError } : {}),
      ...(args.processedRulesLastTick !== undefined
        ? { processedRulesLastTick: args.processedRulesLastTick }
        : {}),
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return null;
    }

    await ctx.db.insert("platformPriceDataSyncSchedulerState", {
      key: "main",
      lastTickAt: args.lastTickAt,
      lastTickOkAt: args.lastTickOkAt,
      lastTickError: args.lastTickError,
      processedRulesLastTick: args.processedRulesLastTick,
      updatedAt: now,
      createdAt: now,
    });
    return null;
  },
});

export const markRuleAttempt = internalMutation({
  args: {
    ruleId: v.id("platformPriceDataSyncRules"),
    nowMs: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ruleId, { lastRunAt: args.nowMs, updatedAt: args.nowMs });
    return null;
  },
});

export const markRuleSuccess = internalMutation({
  args: {
    ruleId: v.id("platformPriceDataSyncRules"),
    nowMs: v.number(),
    nextRunAt: v.number(),
    lastSeenMaxTsMs: v.optional(v.number()),
    lastAccountRowIdUsed: v.optional(v.string()),
    infoRouteId: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ruleId, {
      lastOkAt: args.nowMs,
      nextRunAt: args.nextRunAt,
      lastError: undefined,
      lastSeenMaxTsMs: args.lastSeenMaxTsMs,
      lastAccountRowIdUsed: args.lastAccountRowIdUsed,
      infoRouteId: args.infoRouteId,
      updatedAt: args.nowMs,
    });
    return null;
  },
});

export const markRuleError = internalMutation({
  args: {
    ruleId: v.id("platformPriceDataSyncRules"),
    nowMs: v.number(),
    nextRunAt: v.number(),
    error: v.string(),
    lastAccountRowIdUsed: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ruleId, {
      nextRunAt: args.nextRunAt,
      lastError: args.error,
      lastAccountRowIdUsed: args.lastAccountRowIdUsed,
      updatedAt: args.nowMs,
    });
    return null;
  },
});

export const touchPolicyUsed = internalMutation({
  args: {
    policyId: v.id("platformPriceDataAccountPolicies"),
    nowMs: v.number(),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.policyId, {
      lastUsedAt: args.nowMs,
      ...(args.error ? { lastError: args.error } : {}),
      updatedAt: args.nowMs,
    });
    return null;
  },
});

