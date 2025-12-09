import { ConvexError, v } from "convex/values";

import { mutation } from "../../_generated/server";

const couponBaseArgs = {
  description: v.optional(v.string()),
  discountType: v.union(v.literal("percentage"), v.literal("fixed_amount")),
  discountValue: v.number(),
  minimumSpend: v.optional(v.number()),
  maximumSpend: v.optional(v.number()),
  usageLimit: v.optional(v.number()),
  usageLimitPerUser: v.optional(v.number()),
  startDate: v.optional(v.number()),
  endDate: v.optional(v.number()),
  isEnabled: v.optional(v.boolean()),
  applicableProductIds: v.optional(v.array(v.id("products"))),
  applicableCategoryIds: v.optional(v.array(v.id("productCategories"))),
  excludeProductIds: v.optional(v.array(v.id("products"))),
  excludeCategoryIds: v.optional(v.array(v.id("productCategories"))),
  isStackable: v.optional(v.boolean()),
  isAutomatic: v.optional(v.boolean()),
};

export const createCoupon = mutation({
  args: {
    code: v.string(),
    ...couponBaseArgs,
  },
  handler: async (ctx, args) => {
    const normalizedCode = args.code.trim().toLowerCase();
    if (!normalizedCode) {
      throw new ConvexError({ message: "Coupon code is required" });
    }

    const existing = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", normalizedCode))
      .unique();

    if (existing) {
      throw new ConvexError({ message: "Coupon code already exists" });
    }

    const now = Date.now();
    return await ctx.db.insert("coupons", {
      code: normalizedCode,
      description: args.description ?? undefined,
      discountType: args.discountType,
      discountValue: args.discountValue,
      minimumSpend: args.minimumSpend,
      maximumSpend: args.maximumSpend,
      usageLimit: args.usageLimit,
      usageLimitPerUser: args.usageLimitPerUser,
      timesUsed: 0,
      startDate: args.startDate,
      endDate: args.endDate,
      isEnabled: args.isEnabled ?? true,
      applicableProductIds: args.applicableProductIds,
      applicableCategoryIds: args.applicableCategoryIds,
      excludeProductIds: args.excludeProductIds,
      excludeCategoryIds: args.excludeCategoryIds,
      isStackable: args.isStackable ?? false,
      isAutomatic: args.isAutomatic ?? false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateCoupon = mutation({
  args: {
    couponId: v.id("coupons"),
    code: v.optional(v.string()),
    ...couponBaseArgs,
  },
  handler: async (ctx, args) => {
    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) {
      throw new ConvexError({ message: "Coupon not found" });
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.code !== undefined) {
      const normalized = args.code.trim().toLowerCase();
      if (!normalized) {
        throw new ConvexError({ message: "Coupon code cannot be empty" });
      }
      if (normalized !== coupon.code) {
        const existing = await ctx.db
          .query("coupons")
          .withIndex("by_code", (q) => q.eq("code", normalized))
          .unique();
        if (existing) {
          throw new ConvexError({ message: "Coupon code already exists" });
        }
      }
      updates.code = normalized;
    }

    if (args.description !== undefined) updates.description = args.description;
    if (args.discountType !== undefined)
      updates.discountType = args.discountType;
    if (args.discountValue !== undefined)
      updates.discountValue = args.discountValue;
    if (args.minimumSpend !== undefined)
      updates.minimumSpend = args.minimumSpend;
    if (args.maximumSpend !== undefined)
      updates.maximumSpend = args.maximumSpend;
    if (args.usageLimit !== undefined) updates.usageLimit = args.usageLimit;
    if (args.usageLimitPerUser !== undefined)
      updates.usageLimitPerUser = args.usageLimitPerUser;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.endDate !== undefined) updates.endDate = args.endDate;
    if (args.isEnabled !== undefined) updates.isEnabled = args.isEnabled;
    if (args.applicableProductIds !== undefined)
      updates.applicableProductIds = args.applicableProductIds;
    if (args.applicableCategoryIds !== undefined)
      updates.applicableCategoryIds = args.applicableCategoryIds;
    if (args.excludeProductIds !== undefined)
      updates.excludeProductIds = args.excludeProductIds;
    if (args.excludeCategoryIds !== undefined)
      updates.excludeCategoryIds = args.excludeCategoryIds;
    if (args.isStackable !== undefined) updates.isStackable = args.isStackable;
    if (args.isAutomatic !== undefined) updates.isAutomatic = args.isAutomatic;

    await ctx.db.patch(args.couponId, updates);
    return args.couponId;
  },
});

export const incrementCouponUsage = mutation({
  args: { couponId: v.id("coupons") },
  handler: async (ctx, args) => {
    const coupon = await ctx.db.get(args.couponId);
    if (!coupon) {
      throw new ConvexError({ message: "Coupon not found" });
    }

    const usageLimit = coupon.usageLimit ?? Infinity;
    if (coupon.timesUsed >= usageLimit) {
      throw new ConvexError({ message: "Coupon usage limit reached" });
    }

    await ctx.db.patch(args.couponId, {
      timesUsed: coupon.timesUsed + 1,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const deleteCoupon = mutation({
  args: { couponId: v.id("coupons") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.couponId);
    return { success: true };
  },
});
