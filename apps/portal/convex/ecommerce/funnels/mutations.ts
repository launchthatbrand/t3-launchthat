import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { mutation } from "../../_generated/server";
import {
  requireAdmin,
  requireAuthentication,
} from "../../lib/permissions/requirePermission";
import { getAuthenticatedUser } from "../../lib/permissions/userAuth";
import { getFunnelCheckoutBySlugInternal } from "./queries";

/**
 * Create a funnel session for a funnel slug
 */
export const createCustomCheckoutSession = mutation({
  args: {
    checkoutSlug: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Resolve funnel by slug, fallback to step slug
    let funnel = await ctx.db
      .query("funnels")
      .withIndex("by_slug", (q) => q.eq("slug", args.checkoutSlug))
      .first();

    if (!funnel) {
      const step = await ctx.db
        .query("funnelSteps")
        .withIndex("by_slug", (q) => q.eq("slug", args.checkoutSlug))
        .first();
      if (step) {
        funnel = await ctx.db.get(step.funnelId as Id<"funnels">);
      }
    }

    if (!funnel) {
      throw new Error(`Funnel "${args.checkoutSlug}" not found or inactive`);
    }

    const enriched = await getFunnelCheckoutBySlugInternal(
      ctx,
      args.checkoutSlug,
    );
    if (!enriched) throw new Error("Funnel not available");

    let userId: Id<"users"> | undefined;
    try {
      const authResult = await requireAuthentication(ctx);
      userId = (authResult as { userId?: Id<"users"> }).userId;
    } catch {
      userId = undefined;
    }

    const items = (enriched.products ?? []).map((p) => ({
      productId: p._id,
      quantity: 1,
      price: p.price,
    }));

    const sessionId = await ctx.db.insert("funnelSessions", {
      funnelId: funnel._id as Id<"funnels">,
      email: args.email,
      name: args.name,
      items,
      status: "active",
      currentStep: "information",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60, // 1 hour
      userId,
    });

    return {
      sessionId,
      funnel: enriched,
    } as const;
  },
});

/**
 * Update a funnel session with customer information
 */
export const updateCustomCheckoutSessionInfo = mutation({
  args: {
    sessionId: v.id("funnelSessions"),
    email: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    shippingAddress: v.optional(
      v.object({
        fullName: v.string(),
        addressLine1: v.string(),
        addressLine2: v.optional(v.string()),
        city: v.string(),
        stateOrProvince: v.string(),
        postalCode: v.string(),
        country: v.string(),
        phoneNumber: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Funnel session not found");
    }
    if (session.status !== "active") {
      throw new Error(`Funnel session is ${session.status}`);
    }

    const funnel = await ctx.db.get(session.funnelId);
    if (!funnel) {
      throw new Error("Funnel not found");
    }

    const updateData: Record<string, unknown> = {
      email: args.email,
      updatedAt: Date.now(),
      currentStep: "payment",
    };
    if (args.name) updateData.name = args.name;
    if (args.phone) updateData.phone = args.phone;
    if (args.shippingAddress) updateData.shippingAddress = args.shippingAddress;

    await ctx.db.patch(args.sessionId, updateData as any);

    return args.sessionId;
  },
});

/**
 * Complete a funnel session and create an order
 */
export const completeCustomCheckoutSession = mutation({
  args: {
    sessionId: v.id("funnelSessions"),
    paymentMethod: v.string(),
    paymentIntentId: v.optional(v.string()),
    billingAddress: v.optional(
      v.object({
        fullName: v.string(),
        addressLine1: v.string(),
        addressLine2: v.optional(v.string()),
        city: v.string(),
        stateOrProvince: v.string(),
        postalCode: v.string(),
        country: v.string(),
        phoneNumber: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Funnel session not found");
    }
    if (session.status !== "active") {
      throw new Error(`Funnel session is ${session.status}`);
    }

    const funnel = await ctx.db.get(session.funnelId);
    if (!funnel) {
      throw new Error("Funnel not found");
    }

    const items = (session as any).items as {
      price: number;
      quantity: number;
    }[];
    let subtotal = 0;
    for (const item of items ?? []) {
      subtotal += item.price * item.quantity;
    }

    const discountAmount = 0;
    const taxAmount = 0;
    const shippingAmount = 0;

    const totalAmount = subtotal - discountAmount + taxAmount + shippingAmount;

    const updateData: Record<string, unknown> = {
      paymentMethod: args.paymentMethod,
      subtotal,
      discountAmount,
      taxAmount,
      shippingAmount,
      totalAmount,
      currentStep: "completed",
      status: "completed",
      updatedAt: Date.now(),
    };

    if (args.paymentIntentId) updateData.paymentIntentId = args.paymentIntentId;
    if (args.billingAddress) updateData.billingAddress = args.billingAddress;

    await ctx.db.patch(args.sessionId, updateData as any);

    // Return a compatible shape for existing UIs expecting orderId
    return {
      sessionId: session._id,
      orderId: String(session._id),
    } as const;
  },
});

/**
 * Create a new funnel and seed default steps (Funnel Checkout and Order Confirmation)
 */
export const createFunnel = mutation({
  args: {
    contentTypeId: v.optional(v.id("contentTypes")),
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    collectEmail: v.boolean(),
    collectName: v.boolean(),
    collectPhone: v.optional(v.boolean()),
    collectShippingAddress: v.optional(v.boolean()),
    collectBillingAddress: v.optional(v.boolean()),
    allowCoupons: v.optional(v.boolean()),
    successUrl: v.optional(v.string()),
    cancelUrl: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const user = await getAuthenticatedUser(ctx);
    const userId = user._id;

    const existing = await ctx.db
      .query("funnels")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) {
      throw new Error(`A funnel with slug "${args.slug}" already exists`);
    }

    const funnelId = await ctx.db.insert("funnels", {
      title: args.title,
      slug: args.slug,
      description: args.description,
      status: args.status,
      successUrl: args.successUrl,
      cancelUrl: args.cancelUrl,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: userId,
    });

    // Seed default steps: Funnel Checkout (position 1) and Order Confirmation (position 2)
    await ctx.db.insert("funnelSteps", {
      funnelId,
      type: "funnelCheckout",
      position: 1,
      label: "Checkout",
      config: {
        collectEmail: args.collectEmail,
        collectName: args.collectName,
        collectPhone: args.collectPhone ?? false,
        collectShippingAddress: args.collectShippingAddress ?? false,
        collectBillingAddress: args.collectBillingAddress ?? false,
        allowCoupons: args.allowCoupons ?? false,
        successUrl: args.successUrl,
        cancelUrl: args.cancelUrl,
        checkoutLayout: "two_step",
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any);

    await ctx.db.insert("funnelSteps", {
      funnelId,
      type: "order_confirmation",
      position: 2,
      label: "Order Confirmation",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any);

    return funnelId;
  },
});

/**
 * Update a funnel (updates funnelCheckout step config when applicable)
 */
export const updateCustomCheckout = mutation({
  args: {
    id: v.id("funnels"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    productIds: v.optional(v.array(v.id("products"))),
    collectEmail: v.optional(v.boolean()),
    collectName: v.optional(v.boolean()),
    collectPhone: v.optional(v.boolean()),
    collectShippingAddress: v.optional(v.boolean()),
    collectBillingAddress: v.optional(v.boolean()),
    allowCoupons: v.optional(v.boolean()),
    successUrl: v.optional(v.string()),
    cancelUrl: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const funnel = await ctx.db.get(args.id);
    if (!funnel) {
      throw new Error("Funnel not found");
    }

    const updateFunnel: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title) updateFunnel.title = args.title;
    if (args.description !== undefined)
      updateFunnel.description = args.description;
    if (args.successUrl !== undefined)
      updateFunnel.successUrl = args.successUrl;
    if (args.cancelUrl !== undefined) updateFunnel.cancelUrl = args.cancelUrl;
    if (args.status) updateFunnel.status = args.status;

    if (Object.keys(updateFunnel).length > 0) {
      await ctx.db.patch(args.id, updateFunnel as any);
    }

    // Update funnelCheckout step config
    const steps = await ctx.db
      .query("funnelSteps")
      .withIndex("by_funnelId", (q) => q.eq("funnelId", args.id))
      .collect();
    const checkoutStep = steps.filter((s) => s.type === "funnelCheckout")[0];
    if (checkoutStep) {
      const cfgUpdate: Record<string, unknown> = { ...checkoutStep.config };
      if (args.productIds) cfgUpdate.productIds = args.productIds;
      if (args.collectEmail !== undefined)
        cfgUpdate.collectEmail = args.collectEmail;
      if (args.collectName !== undefined)
        cfgUpdate.collectName = args.collectName;
      if (args.collectPhone !== undefined)
        cfgUpdate.collectPhone = args.collectPhone;
      if (args.collectShippingAddress !== undefined)
        cfgUpdate.collectShippingAddress = args.collectShippingAddress;
      if (args.collectBillingAddress !== undefined)
        cfgUpdate.collectBillingAddress = args.collectBillingAddress;
      if (args.allowCoupons !== undefined)
        cfgUpdate.allowCoupons = args.allowCoupons;
      if (args.successUrl !== undefined) cfgUpdate.successUrl = args.successUrl;
      if (args.cancelUrl !== undefined) cfgUpdate.cancelUrl = args.cancelUrl;

      await ctx.db.patch(
        checkoutStep._id as any,
        {
          config: cfgUpdate as any,
          updatedAt: Date.now(),
        } as any,
      );
    }

    return args.id;
  },
});

/**
 * Delete a funnel and its steps
 */
export const deleteCustomCheckout = mutation({
  args: {
    id: v.id("funnels"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const funnel = await ctx.db.get(args.id);
    if (!funnel) {
      throw new Error("Funnel not found");
    }

    // delete steps
    const steps = await ctx.db
      .query("funnelSteps")
      .withIndex("by_funnelId", (q) => q.eq("funnelId", args.id))
      .collect();
    for (const step of steps) {
      await ctx.db.delete(step._id as any);
    }

    await ctx.db.delete(args.id);
    return true;
  },
});

export const addFunnelStep = mutation({
  args: {
    funnelId: v.id("funnels"),
    type: v.union(
      v.literal("landing"),
      v.literal("funnelCheckout"),
      v.literal("upsell"),
      v.literal("order_confirmation"),
    ),
    position: v.optional(v.number()),
    label: v.optional(v.string()),
    config: v.optional(
      v.object({
        productIds: v.optional(v.array(v.id("products"))),
        collectEmail: v.optional(v.boolean()),
        collectName: v.optional(v.boolean()),
        collectPhone: v.optional(v.boolean()),
        collectShippingAddress: v.optional(v.boolean()),
        collectBillingAddress: v.optional(v.boolean()),
        allowCoupons: v.optional(v.boolean()),
        successUrl: v.optional(v.string()),
        cancelUrl: v.optional(v.string()),
        checkoutLayout: v.optional(
          v.union(v.literal("one_step"), v.literal("two_step")),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const funnel = await ctx.db.get(args.funnelId);
    if (!funnel) throw new Error("Funnel not found");

    const existingSteps = await ctx.db
      .query("funnelSteps")
      .withIndex("by_funnelId", (q) => q.eq("funnelId", args.funnelId))
      .collect();

    const position =
      args.position ??
      (existingSteps.length > 0
        ? Math.max(...existingSteps.map((s: any) => s.position)) + 1
        : 1);

    const stepId = await ctx.db.insert("funnelSteps", {
      funnelId: args.funnelId,
      type: args.type,
      position,
      label: args.label,
      config: args.config,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any);

    return stepId;
  },
});

export const updateFunnelStep = mutation({
  args: {
    stepId: v.id("funnelSteps"),
    type: v.optional(
      v.union(
        v.literal("landing"),
        v.literal("funnelCheckout"),
        v.literal("upsell"),
        v.literal("order_confirmation"),
      ),
    ),
    position: v.optional(v.number()),
    label: v.optional(v.string()),
    slug: v.optional(v.string()),
    config: v.optional(
      v.object({
        productIds: v.optional(v.array(v.id("products"))),
        collectEmail: v.optional(v.boolean()),
        collectName: v.optional(v.boolean()),
        collectPhone: v.optional(v.boolean()),
        collectShippingAddress: v.optional(v.boolean()),
        collectBillingAddress: v.optional(v.boolean()),
        allowCoupons: v.optional(v.boolean()),
        successUrl: v.optional(v.string()),
        cancelUrl: v.optional(v.string()),
        checkoutLayout: v.optional(
          v.union(v.literal("one_step"), v.literal("two_step")),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const step = await ctx.db.get(args.stepId);
    if (!step) throw new Error("Step not found");

    const update: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.type !== undefined) update.type = args.type;
    if (args.position !== undefined) update.position = args.position;
    if (args.label !== undefined) update.label = args.label;
    if (args.slug !== undefined) update.slug = args.slug;
    if (args.config !== undefined) update.config = args.config as any;

    await ctx.db.patch(args.stepId, update as any);
    return args.stepId;
  },
});

export const deleteFunnelStep = mutation({
  args: { stepId: v.id("funnelSteps") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const step = await ctx.db.get(args.stepId);
    if (!step) throw new Error("Step not found");
    await ctx.db.delete(args.stepId);
    return true;
  },
});

export const setCheckoutSessionItems = mutation({
  args: {
    sessionId: v.id("funnelSessions"),
    productIds: v.array(v.id("products")),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Funnel session not found");
    if (session.status !== "active") {
      throw new Error(`Cannot update items; session is ${session.status}`);
    }

    const uniqueIds = Array.from(new Set(args.productIds));

    const items = [] as Array<{
      productId: Id<"products">;
      quantity: number;
      price: number;
    }>;
    for (const pid of uniqueIds) {
      const product = await ctx.db.get(pid);
      if (!product) continue;
      // Accept products that are not archived/hidden if status exists
      // @ts-ignore legacy status typing
      if (typeof product.status === "string" && product.status !== "active")
        continue;
      const price =
        typeof (product as any).price === "number" ? (product as any).price : 0;
      items.push({ productId: pid, quantity: 1, price });
    }

    await ctx.db.patch(args.sessionId, {
      items,
      updatedAt: Date.now(),
    } as any);

    return { success: true } as const;
  },
});

export const addFunnelEdge = mutation({
  args: {
    funnelId: v.id("funnels"),
    source: v.id("funnelSteps"),
    target: v.id("funnelSteps"),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const id = await ctx.db.insert("funnelEdges", {
      funnelId: args.funnelId,
      source: args.source,
      target: args.target,
      label: args.label,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const deleteFunnelEdge = mutation({
  args: { edgeId: v.id("funnelEdges") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.edgeId);
    return true;
  },
});

export const updateFunnelEdge = mutation({
  args: {
    edgeId: v.id("funnelEdges"),
    label: v.optional(v.string()),
    source: v.optional(v.id("funnelSteps")),
    target: v.optional(v.id("funnelSteps")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const update: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.label !== undefined) update.label = args.label;
    if (args.source !== undefined) update.source = args.source;
    if (args.target !== undefined) update.target = args.target;
    await ctx.db.patch(args.edgeId, update as any);
    return args.edgeId;
  },
});
