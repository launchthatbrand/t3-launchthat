import { v } from "convex/values";

import { mutation } from "../_generated/server";

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
      isActive: true,
      sortOrder: 1,
      updatedAt: now,
    });
    planIds.push(freePlanId);

    const starterPlanId = await ctx.db.insert("plans", {
      name: "starter",
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
      isActive: true,
      sortOrder: 2,
      updatedAt: now,
    });
    planIds.push(starterPlanId);

    const businessPlanId = await ctx.db.insert("plans", {
      name: "business",
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
      isActive: true,
      sortOrder: 3,
      updatedAt: now,
    });
    planIds.push(businessPlanId);

    const agencyPlanId = await ctx.db.insert("plans", {
      name: "agency",
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
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.sortOrder !== undefined) updates.sortOrder = args.sortOrder;

    await ctx.db.patch(args.planId as any, updates);
    return null;
  },
});


