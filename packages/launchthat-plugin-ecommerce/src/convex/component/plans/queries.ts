import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";

export const getPlans = query({
  args: {
    isActive: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("plans"),
      _creationTime: v.number(),
      name: v.union(
        v.literal("free"),
        v.literal("starter"),
        v.literal("business"),
        v.literal("agency"),
      ),
      displayName: v.string(),
      description: v.string(),
      maxOrganizations: v.number(),
      priceMonthly: v.number(),
      priceYearly: v.optional(v.number()),
      features: v.optional(v.array(v.string())),
      isActive: v.boolean(),
      sortOrder: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const isActive = args.isActive ?? true;
    const rows = await ctx.db
      .query("plans")
      .withIndex("by_active", (q) => q.eq("isActive", isActive))
      .collect();
    return rows.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  },
});

export const getPlanById = query({
  args: {
    planId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("plans"),
      _creationTime: v.number(),
      name: v.union(
        v.literal("free"),
        v.literal("starter"),
        v.literal("business"),
        v.literal("agency"),
      ),
      displayName: v.string(),
      description: v.string(),
      maxOrganizations: v.number(),
      priceMonthly: v.number(),
      priceYearly: v.optional(v.number()),
      features: v.optional(v.array(v.string())),
      isActive: v.boolean(),
      sortOrder: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId as Id<"plans">);
    if (!plan) return null;
    return plan;
  },
});

export const getPlanByName = query({
  args: {
    name: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("business"),
      v.literal("agency"),
    ),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("plans"),
      _creationTime: v.number(),
      name: v.union(
        v.literal("free"),
        v.literal("starter"),
        v.literal("business"),
        v.literal("agency"),
      ),
      displayName: v.string(),
      description: v.string(),
      maxOrganizations: v.number(),
      priceMonthly: v.number(),
      priceYearly: v.optional(v.number()),
      features: v.optional(v.array(v.string())),
      isActive: v.boolean(),
      sortOrder: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const plan = await ctx.db
      .query("plans")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();
    return plan ?? null;
  },
});
