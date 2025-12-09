import { v } from "convex/values";

import { query } from "../../_generated/server";

const couponShape = v.object({
  _id: v.id("coupons"),
  _creationTime: v.number(),
  code: v.string(),
  description: v.optional(v.string()),
  discountType: v.union(v.literal("percentage"), v.literal("fixed_amount")),
  discountValue: v.number(),
  minimumSpend: v.optional(v.number()),
  maximumSpend: v.optional(v.number()),
  usageLimit: v.optional(v.number()),
  usageLimitPerUser: v.optional(v.number()),
  timesUsed: v.number(),
  startDate: v.optional(v.number()),
  endDate: v.optional(v.number()),
  isEnabled: v.boolean(),
  applicableProductIds: v.optional(v.array(v.id("products"))),
  applicableCategoryIds: v.optional(v.array(v.id("productCategories"))),
  excludeProductIds: v.optional(v.array(v.id("products"))),
  excludeCategoryIds: v.optional(v.array(v.id("productCategories"))),
  isStackable: v.optional(v.boolean()),
  isAutomatic: v.optional(v.boolean()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const listCoupons = query({
  args: {
    includeDisabled: v.optional(v.boolean()),
    search: v.optional(v.string()),
  },
  returns: v.array(couponShape),
  handler: async (ctx, args) => {
    const includeDisabled = args.includeDisabled ?? false;
    const searchTerm = (args.search ?? "").trim().toLowerCase();

    let cursor = ctx.db.query("coupons").order("desc");

    if (!includeDisabled) {
      cursor = cursor.filter((q) => q.eq(q.field("isEnabled"), true));
    }

    const coupons = await cursor.collect();

    if (!searchTerm) {
      return coupons;
    }

    return coupons.filter((coupon) =>
      coupon.code.toLowerCase().includes(searchTerm),
    );
  },
});

export const getCouponById = query({
  args: { id: v.id("coupons") },
  returns: v.union(couponShape, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getCouponByCode = query({
  args: { code: v.string() },
  returns: v.union(couponShape, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", args.code.toLowerCase()))
      .unique();
  },
});
