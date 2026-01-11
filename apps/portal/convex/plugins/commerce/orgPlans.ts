/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../_generated/api";
import { mutation, query } from "../../_generated/server";

const ecommercePlansQueries = components.launchthat_ecommerce.plans.queries as any;
const ecommercePlansMutations = components.launchthat_ecommerce.plans.mutations as any;

const planLimitsValidator = v.optional(
  v.object({
    discordAiDaily: v.optional(v.number()),
    supportBubbleAiDaily: v.optional(v.number()),
    crmMaxContacts: v.optional(v.number()),
  }),
);

async function requirePortalAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (!user || user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}

export const listAssignableOrgPlans = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.runQuery(ecommercePlansQueries.listAssignableOrgPlans, {});
  },
});

export const getOrgPlanForProduct = query({
  args: { productPostId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(ecommercePlansQueries.getPlanByProductPostId, args);
  },
});

export const upsertOrgPlanForProduct = mutation({
  args: {
    productPostId: v.string(),
    isActive: v.boolean(),
    displayName: v.optional(v.string()),
    description: v.optional(v.string()),
    maxOrganizations: v.optional(v.number()),
    priceMonthly: v.optional(v.number()),
    priceYearly: v.optional(v.number()),
    features: v.optional(v.array(v.string())),
    limits: planLimitsValidator,
    sortOrder: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requirePortalAdmin(ctx);
    return await ctx.runMutation(ecommercePlansMutations.upsertProductPlan, args);
  },
});

export const deactivateOrgPlanForProduct = mutation({
  args: { productPostId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePortalAdmin(ctx);
    await ctx.runMutation(ecommercePlansMutations.deactivateProductPlan, args);
    return null;
  },
});


