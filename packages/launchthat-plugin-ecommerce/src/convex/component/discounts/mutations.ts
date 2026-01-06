import { v } from "convex/values";

import { mutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

const normalizeCouponCode = (value: string): string =>
  value.trim().toUpperCase().replace(/\s+/g, "");

export const createDiscountCode = mutation({
  args: {
    organizationId: v.optional(v.string()),
    code: v.string(),
    kind: v.union(v.literal("percent"), v.literal("fixed")),
    amount: v.number(),
    active: v.optional(v.boolean()),
  },
  returns: v.id("discountCodes"),
  handler: async (ctx, args) => {
    const orgId = typeof args.organizationId === "string" ? args.organizationId : null;
    const code = normalizeCouponCode(args.code);
    if (!code) {
      throw new Error("Coupon code is required");
    }

    if (args.kind === "percent" && (args.amount < 0 || args.amount > 100)) {
      throw new Error("Percent amount must be between 0 and 100");
    }
    if (args.kind === "fixed" && args.amount < 0) {
      throw new Error("Fixed discount amount must be >= 0");
    }

    const existing = await ctx.db
      .query("discountCodes")
      .withIndex("by_org_and_code", (q) =>
        q.eq("organizationId", orgId).eq("code", code),
      )
      .unique();
    if (existing) {
      throw new Error("Coupon code already exists");
    }

    const now = Date.now();
    return await ctx.db.insert("discountCodes", {
      organizationId: orgId,
      code,
      kind: args.kind,
      amount: args.amount,
      active: args.active ?? true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateDiscountCode = mutation({
  args: {
    id: v.id("discountCodes"),
    code: v.optional(v.string()),
    kind: v.optional(v.union(v.literal("percent"), v.literal("fixed"))),
    amount: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Coupon not found");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.code !== undefined) {
      const nextCode = normalizeCouponCode(args.code);
      if (!nextCode) throw new Error("Coupon code is required");

      const orgId = (existing as any).organizationId ?? null;
      const dup = await ctx.db
        .query("discountCodes")
        .withIndex("by_org_and_code", (q) =>
          q.eq("organizationId", orgId).eq("code", nextCode),
        )
        .unique();
      if (dup && (dup._id as Id<"discountCodes">) !== args.id) {
        throw new Error("Coupon code already exists");
      }

      patch.code = nextCode;
    }

    const nextKind = args.kind ?? (existing as any).kind;
    const nextAmount = args.amount ?? (existing as any).amount;

    if (typeof nextKind === "string" && typeof nextAmount === "number") {
      if (nextKind === "percent" && (nextAmount < 0 || nextAmount > 100)) {
        throw new Error("Percent amount must be between 0 and 100");
      }
      if (nextKind === "fixed" && nextAmount < 0) {
        throw new Error("Fixed discount amount must be >= 0");
      }
    }

    if (args.kind !== undefined) patch.kind = args.kind;
    if (args.amount !== undefined) patch.amount = args.amount;
    if (args.active !== undefined) patch.active = args.active;

    await ctx.db.patch(args.id, patch);
    return null;
  },
});

export const deleteDiscountCode = mutation({
  args: { id: v.id("discountCodes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

export const validateDiscountCode = mutation({
  args: {
    organizationId: v.optional(v.string()),
    code: v.string(),
    subtotal: v.number(),
  },
  returns: v.object({
    ok: v.boolean(),
    reason: v.optional(v.string()),
    appliedCode: v.optional(v.string()),
    kind: v.optional(v.union(v.literal("percent"), v.literal("fixed"))),
    amount: v.optional(v.number()),
    discountAmount: v.number(),
  }),
  handler: async (ctx, args) => {
    const subtotal = Math.max(0, args.subtotal);
    const code = normalizeCouponCode(args.code);
    if (!code) {
      return { ok: false, reason: "Enter a coupon code.", discountAmount: 0 };
    }
    if (subtotal <= 0) {
      return { ok: false, reason: "Your cart is empty.", discountAmount: 0 };
    }

    const orgId = typeof args.organizationId === "string" ? args.organizationId : null;
    const match =
      (await ctx.db
        .query("discountCodes")
        .withIndex("by_org_and_code", (q) => q.eq("organizationId", orgId).eq("code", code))
        .unique()) ??
      (orgId !== null
        ? await ctx.db
            .query("discountCodes")
            .withIndex("by_org_and_code", (q) =>
              q.eq("organizationId", null).eq("code", code),
            )
            .unique()
        : null);

    if (!match) {
      return { ok: false, reason: "Coupon not found.", discountAmount: 0 };
    }
    if ((match as any).active !== true) {
      return { ok: false, reason: "This coupon is not active.", discountAmount: 0 };
    }

    const kind = (match as any).kind as "percent" | "fixed";
    const amount = typeof (match as any).amount === "number" ? (match as any).amount : 0;

    let discountAmount = 0;
    if (kind === "percent") {
      discountAmount = (subtotal * Math.max(0, Math.min(100, amount))) / 100;
    } else {
      discountAmount = Math.max(0, amount);
    }
    discountAmount = Math.min(subtotal, discountAmount);

    return {
      ok: true,
      appliedCode: code,
      kind,
      amount,
      discountAmount,
    };
  },
});


