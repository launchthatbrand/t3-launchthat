import { v } from "convex/values";

import { mutation } from "../../_generated/server";
import { components } from "../../_generated/api";

/**
 * Seed initial plans data
 * Run this once to set up the basic plan structure
 */
export const seedPlans = mutation({
  args: {},
  // Plans are ecommerce-owned (component ids don't validate as v.id("plans") in the portal schema).
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const ids = (await ctx.runMutation(
      components.launchthat_ecommerce.plans.mutations.seedPlans as any,
      {},
    )) as any[];
    return ids.map((id) => String(id));
  },
});

/**
 * Assign the free plan to a user (typically used during user registration)
 */
export const assignFreePlanToUser = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const freePlan = (await ctx.runQuery(
      components.launchthat_ecommerce.plans.queries.getPlanByName as any,
      { name: "free" },
    )) as { _id: string } | null;

    if (!freePlan) {
      throw new Error("Free plan not found. Run seedPlans first.");
    }

    // Update user with free plan
    await ctx.db.patch(args.userId, {
      planId: String(freePlan._id),
      subscriptionStatus: "active",
    });

    return null;
  },
});

/**
 * Create a default organization for a new user on the free plan
 */
export const createDefaultOrganization = mutation({
  args: {
    userId: v.id("users"),
    userName: v.string(),
  },
  returns: v.id("organizations"),
  handler: async (ctx, args) => {
    // Get user to check their plan
    const user = await ctx.db.get(args.userId);
    if (!user?.planId) {
      throw new Error("User must have a plan assigned first");
    }

    // Generate a default organization name and slug
    const orgName = `${args.userName}'s Organization`;
    const baseSlug = args.userName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    let slug = baseSlug;
    let counter = 1;

    // Check for uniqueness
    while (true) {
      const existing = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();

      if (!existing) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create organization
    const organizationId = await ctx.db.insert("organizations", {
      name: orgName,
      slug,
      description: `Default organization for ${args.userName}`,
      ownerId: args.userId,
      planId: user.planId,
      isPublic: false,
      allowSelfRegistration: false,
      subscriptionStatus: "active",
      updatedAt: Date.now(),
    });

    // Add user as owner
    await ctx.db.insert("userOrganizations", {
      userId: args.userId,
      organizationId,
      role: "owner",
      isActive: true,
      joinedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return organizationId;
  },
});

/**
 * Update plan pricing and features (for admin use)
 */
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
    await ctx.runMutation(
      components.launchthat_ecommerce.plans.mutations.updatePlan as any,
      args,
    );
    return null;
  },
});
