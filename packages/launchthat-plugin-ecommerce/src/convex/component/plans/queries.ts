import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";

const planLimitsValidator = v.optional(
  v.object({
    discordAiDaily: v.optional(v.number()),
    supportBubbleAiDaily: v.optional(v.number()),
    crmMaxContacts: v.optional(v.number()),
  }),
);

const planValidator = v.object({
  _id: v.id("plans"),
  _creationTime: v.number(),
  name: v.string(),
  kind: v.union(v.literal("system"), v.literal("product")),
  productPostId: v.optional(v.string()),
  displayName: v.string(),
  description: v.string(),
  maxOrganizations: v.number(),
  priceMonthly: v.number(),
  priceYearly: v.optional(v.number()),
  features: v.optional(v.array(v.string())),
  limits: planLimitsValidator,
  isActive: v.boolean(),
  sortOrder: v.number(),
  updatedAt: v.number(),
});

export const getPlans = query({
  args: {
    isActive: v.optional(v.boolean()),
  },
  returns: v.array(planValidator),
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
  returns: v.union(v.null(), planValidator),
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId as Id<"plans">);
    if (!plan) return null;
    return plan;
  },
});

export const getPlanByName = query({
  args: {
    name: v.string(),
  },
  returns: v.union(v.null(), planValidator),
  handler: async (ctx, args) => {
    const plan = await ctx.db
      .query("plans")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();
    return plan ?? null;
  },
});

export const listAssignableOrgPlans = query({
  args: {},
  returns: v.array(planValidator),
  handler: async (ctx) => {
    const [freePlan, productPlans] = await Promise.all([
      ctx.db
        .query("plans")
        .withIndex("by_name", (q) => q.eq("name", "free"))
        .unique(),
      ctx.db
        .query("plans")
        .withIndex("by_kind", (q) => q.eq("kind", "product"))
        .collect(),
    ]);

    const activeProductPlans = productPlans.filter((p) => p.isActive);
    const result = [
      ...(freePlan ? [freePlan] : []),
      ...activeProductPlans,
    ].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    return result;
  },
});

export const getPlanByProductPostId = query({
  args: {
    productPostId: v.string(),
  },
  returns: v.union(v.null(), planValidator),
  handler: async (ctx, args) => {
    const plan = await ctx.db
      .query("plans")
      .withIndex("by_productPostId", (q) =>
        q.eq("productPostId", args.productPostId),
      )
      .unique();
    return plan ?? null;
  },
});
