import { v } from "convex/values";
import { mutation } from "../_generated/server";
/**
 * Seed initial plans data
 * Run this once to set up the basic plan structure
 */
export const seedPlans = mutation({
    args: {},
    returns: v.array(v.id("plans")),
    handler: async (ctx, args) => {
        // Check if plans already exist
        const existingPlans = await ctx.db.query("plans").collect();
        if (existingPlans.length > 0) {
            throw new Error("Plans already exist. Use updatePlans to modify existing plans.");
        }
        const now = Date.now();
        const planIds = [];
        // Free Plan
        const freePlanId = await ctx.db.insert("plans", {
            name: "free",
            displayName: "Free",
            description: "Perfect for getting started with one organization",
            maxOrganizations: 1,
            priceMonthly: 0, // Free
            features: [
                "1 Organization",
                "Unlimited courses",
                "Basic support",
                "Community access",
            ],
            isActive: true,
            sortOrder: 1,
            createdAt: now,
            updatedAt: now,
        });
        planIds.push(freePlanId);
        // Starter Plan
        const starterPlanId = await ctx.db.insert("plans", {
            name: "starter",
            displayName: "Starter",
            description: "For creators ready to launch their first course business",
            maxOrganizations: 1,
            priceMonthly: 2900, // $29/month
            priceYearly: 29000, // $290/year (save $58)
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
            createdAt: now,
            updatedAt: now,
        });
        planIds.push(starterPlanId);
        // Business Plan
        const businessPlanId = await ctx.db.insert("plans", {
            name: "business",
            displayName: "Business",
            description: "For growing course creators managing multiple brands",
            maxOrganizations: 3,
            priceMonthly: 9900, // $99/month
            priceYearly: 99000, // $990/year (save $198)
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
            createdAt: now,
            updatedAt: now,
        });
        planIds.push(businessPlanId);
        // Agency Plan
        const agencyPlanId = await ctx.db.insert("plans", {
            name: "agency",
            displayName: "Agency",
            description: "For agencies managing multiple client course businesses",
            maxOrganizations: -1, // Unlimited
            priceMonthly: 19900, // $199/month
            priceYearly: 199000, // $1990/year (save $398)
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
            createdAt: now,
            updatedAt: now,
        });
        planIds.push(agencyPlanId);
        return planIds;
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
        // Get the free plan
        const freePlan = await ctx.db
            .query("plans")
            .withIndex("by_name", (q) => q.eq("name", "free"))
            .unique();
        if (!freePlan) {
            throw new Error("Free plan not found. Run seedPlans first.");
        }
        // Update user with free plan
        await ctx.db.patch(args.userId, {
            planId: freePlan._id,
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
        let baseSlug = args.userName
            .toLowerCase()
            .replace(/[^a-z0-9\-]/g, "-")
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
        const now = Date.now();
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
            createdAt: now,
            updatedAt: now,
        });
        // Add user as owner
        await ctx.db.insert("userOrganizations", {
            userId: args.userId,
            organizationId,
            role: "owner",
            isActive: true,
            joinedAt: now,
            createdAt: now,
            updatedAt: now,
        });
        return organizationId;
    },
});
/**
 * Update plan pricing and features (for admin use)
 */
export const updatePlan = mutation({
    args: {
        planId: v.id("plans"),
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
        const updates = {
            updatedAt: Date.now(),
        };
        // Add fields that are being updated
        if (args.displayName !== undefined)
            updates.displayName = args.displayName;
        if (args.description !== undefined)
            updates.description = args.description;
        if (args.maxOrganizations !== undefined)
            updates.maxOrganizations = args.maxOrganizations;
        if (args.priceMonthly !== undefined)
            updates.priceMonthly = args.priceMonthly;
        if (args.priceYearly !== undefined)
            updates.priceYearly = args.priceYearly;
        if (args.features !== undefined)
            updates.features = args.features;
        if (args.isActive !== undefined)
            updates.isActive = args.isActive;
        if (args.sortOrder !== undefined)
            updates.sortOrder = args.sortOrder;
        await ctx.db.patch(args.planId, updates);
        return null;
    },
});
