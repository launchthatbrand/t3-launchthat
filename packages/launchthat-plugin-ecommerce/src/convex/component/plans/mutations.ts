import { v } from "convex/values";

import { mutation } from "../_generated/server";

const planLimitsValidator = v.optional(
  v.object({
    discordAiDaily: v.optional(v.number()),
    supportBubbleAiDaily: v.optional(v.number()),
    crmMaxContacts: v.optional(v.number()),
  }),
);

export const seedPlans = mutation({
  args: {},
  returns: v.array(v.id("plans")),
  handler: async (ctx) => {
    const existingPlans = await ctx.db.query("plans").collect();
    if (existingPlans.length > 0) {
      throw new Error("Plans already exist. Use an update flow instead.");
    }

    const now = Date.now();
    const planIds: Array<any> = [];

    const freePlanId = await ctx.db.insert("plans", {
      name: "free",
      kind: "system",
      displayName: "Free",
      description: "Perfect for getting started with one organization",
      maxOrganizations: 1,
      priceMonthly: 0,
      features: [
        "1 Organization",
        "Unlimited courses",
        "Basic support",
        "Community access",
      ],
      limits: {
        // Defaults can be overridden by portal-root plan management.
        // We keep the existing Discord org daily budget default aligned with the previous hardcoded value.
        discordAiDaily: 200,
        supportBubbleAiDaily: 200,
        crmMaxContacts: 1000,
      },
      isActive: true,
      sortOrder: 1,
      updatedAt: now,
    });
    planIds.push(freePlanId);

    const starterPlanId = await ctx.db.insert("plans", {
      name: "starter",
      kind: "system",
      displayName: "Starter",
      description: "For creators ready to launch their first course business",
      maxOrganizations: 1,
      priceMonthly: 2900,
      priceYearly: 29000,
      features: [
        "1 Organization",
        "Unlimited courses",
        "Priority support",
        "Custom branding",
        "Advanced analytics",
        "Email marketing tools",
      ],
      limits: {
        discordAiDaily: 1000,
        supportBubbleAiDaily: 1000,
        crmMaxContacts: 10000,
      },
      isActive: true,
      sortOrder: 2,
      updatedAt: now,
    });
    planIds.push(starterPlanId);

    const businessPlanId = await ctx.db.insert("plans", {
      name: "business",
      kind: "system",
      displayName: "Business",
      description: "For growing course creators managing multiple brands",
      maxOrganizations: 3,
      priceMonthly: 9900,
      priceYearly: 99000,
      features: [
        "3 Organizations",
        "Unlimited courses",
        "Priority support",
        "Custom branding",
        "Advanced analytics",
        "Email marketing tools",
        "White-label options",
        "API access",
        "Custom domains",
      ],
      limits: {
        discordAiDaily: 5000,
        supportBubbleAiDaily: 5000,
        crmMaxContacts: 50000,
      },
      isActive: true,
      sortOrder: 3,
      updatedAt: now,
    });
    planIds.push(businessPlanId);

    const agencyPlanId = await ctx.db.insert("plans", {
      name: "agency",
      kind: "system",
      displayName: "Agency",
      description: "For agencies managing multiple client course businesses",
      maxOrganizations: -1,
      priceMonthly: 19900,
      priceYearly: 199000,
      features: [
        "Unlimited Organizations",
        "Unlimited courses",
        "Premium support",
        "Custom branding",
        "Advanced analytics",
        "Email marketing tools",
        "White-label options",
        "API access",
        "Custom domains",
        "Dedicated account manager",
        "Custom integrations",
      ],
      limits: {
        discordAiDaily: 20000,
        supportBubbleAiDaily: 20000,
        crmMaxContacts: 250000,
      },
      isActive: true,
      sortOrder: 4,
      updatedAt: now,
    });
    planIds.push(agencyPlanId);

    return planIds;
  },
});

export const updatePlan = mutation({
  args: {
    planId: v.string(),
    displayName: v.optional(v.string()),
    description: v.optional(v.string()),
    maxOrganizations: v.optional(v.number()),
    priceMonthly: v.optional(v.number()),
    priceYearly: v.optional(v.number()),
    features: v.optional(v.array(v.string())),
    limits: planLimitsValidator,
    isActive: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.displayName !== undefined) updates.displayName = args.displayName;
    if (args.description !== undefined) updates.description = args.description;
    if (args.maxOrganizations !== undefined)
      updates.maxOrganizations = args.maxOrganizations;
    if (args.priceMonthly !== undefined) updates.priceMonthly = args.priceMonthly;
    if (args.priceYearly !== undefined) updates.priceYearly = args.priceYearly;
    if (args.features !== undefined) updates.features = args.features;
    if (args.limits !== undefined) updates.limits = args.limits;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.sortOrder !== undefined) updates.sortOrder = args.sortOrder;

    await ctx.db.patch(args.planId as any, updates);
    return null;
  },
});

export const upsertProductPlan = mutation({
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
  returns: v.id("plans"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("plans")
      .withIndex("by_productPostId", (q) => q.eq("productPostId", args.productPostId))
      .unique();

    const now = Date.now();
    const updates: Record<string, unknown> = {
      kind: "product",
      productPostId: args.productPostId,
      name: `product:${args.productPostId}`,
      displayName: args.displayName ?? "Organization plan",
      description: args.description ?? "Product-backed organization plan",
      maxOrganizations: args.maxOrganizations ?? 1,
      priceMonthly: args.priceMonthly ?? 0,
      priceYearly: args.priceYearly,
      features: args.features,
      limits: args.limits ?? {},
      isActive: args.isActive,
      sortOrder: args.sortOrder ?? 100,
      updatedAt: now,
    };

    if (existing?._id) {
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    return await ctx.db.insert("plans", updates as any);
  },
});

export const deactivateProductPlan = mutation({
  args: {
    productPostId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("plans")
      .withIndex("by_productPostId", (q) => q.eq("productPostId", args.productPostId))
      .unique();
    if (!existing?._id) return null;
    await ctx.db.patch(existing._id, { isActive: false, updatedAt: Date.now() });
    return null;
  },
});


