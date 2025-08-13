import { v } from "convex/values";

import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { query } from "../../_generated/server";

/**
 * Helper: fetch the funnelCheckout step for a funnel
 */
async function getFunnelCheckoutStep(
  ctx: QueryCtx | MutationCtx,
  funnelId: Id<"funnels">,
): Promise<Doc<"funnelSteps"> | null> {
  const steps = await ctx.db
    .query("funnelSteps")
    .withIndex("by_funnelId", (q) => q.eq("funnelId", funnelId))
    .collect();
  const checkoutStep = steps
    .filter((s) => s.type === "funnelCheckout")
    .sort((a, b) => a.position - b.position)[0];
  return checkoutStep ?? null;
}

/**
 * Internal function to get an enriched funnel (checkout config + products) by slug
 * Supports both funnel slug and funnelStep slug.
 */
export async function getFunnelCheckoutBySlugInternal(
  ctx: QueryCtx | MutationCtx,
  slug: string,
) {
  // First, try funnel slug
  let funnel = await ctx.db
    .query("funnels")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .first();

  let checkoutStep: Doc<"funnelSteps"> | null = null;

  if (funnel) {
    checkoutStep = await getFunnelCheckoutStep(ctx, funnel._id);
  } else {
    // Fallback: try step slug → resolve its parent funnel
    const step = await ctx.db
      .query("funnelSteps")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (!step) return null;
    funnel = await ctx.db.get(step.funnelId);
    if (!funnel) return null;
    checkoutStep =
      step.type === "funnelCheckout"
        ? step
        : await getFunnelCheckoutStep(ctx, step.funnelId);
  }

  if (!checkoutStep) return null;

  const productIds: Id<"products">[] = checkoutStep.config?.productIds ?? [];
  const products: {
    _id: Id<"products">;
    price: number;
    name?: string;
    description?: string;
  }[] = [];
  for (const productId of productIds) {
    const product = await ctx.db.get(productId);
    if (product && product.status === "active") {
      products.push({
        _id: product._id,
        price: product.price,
        name: product.name,
        description: product.description,
      });
    }
  }

  return {
    _id: funnel._id,
    title: funnel.title,
    slug: slug,
    description: funnel.description,
    status: funnel.status,
    config: checkoutStep.config,
    successUrl: checkoutStep.config?.successUrl ?? funnel.successUrl,
    cancelUrl: checkoutStep.config?.cancelUrl ?? funnel.cancelUrl,
    collectEmail: checkoutStep.config?.collectEmail ?? true,
    collectName: checkoutStep.config?.collectName ?? true,
    collectPhone: checkoutStep.config?.collectPhone ?? false,
    collectShippingAddress:
      checkoutStep.config?.collectShippingAddress ?? false,
    collectBillingAddress: checkoutStep.config?.collectBillingAddress ?? false,
    allowCoupons: checkoutStep.config?.allowCoupons ?? false,
    // New: checkout layout flag
    checkoutLayout: checkoutStep.config?.checkoutLayout ?? "two_step",
    productIds,
    products,
  } as const;
}

/**
 * Get enriched funnel by slug for checkout page
 */
export const getFunnelCheckoutBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await getFunnelCheckoutBySlugInternal(ctx, args.slug);
  },
});

/**
 * Get a funnel session by ID
 */
export const getFunnelSession = query({
  args: { sessionId: v.id("funnelSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    if (session.expiresAt && session.expiresAt < Date.now()) return null;
    const funnel = await ctx.db.get(session.funnelId);
    return { ...session, funnel } as const;
  },
});

/**
 * Admin: list all funnels enriched with checkout step config summary
 */
export const getAllFunnels = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let funnels: Doc<"funnels">[] = [];
    if (args.status) {
      funnels = await ctx.db
        .query("funnels")
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        .withIndex("by_status", (qi) => qi.eq("status", args.status!))
        .collect();
    } else {
      funnels = await ctx.db.query("funnels").collect();
    }

    const result: {
      _id: Id<"funnels">;
      title: string;
      slug: string;
      status: string;
      productIds: Id<"products">[];
      collectEmail?: boolean;
      collectName?: boolean;
      collectPhone?: boolean;
      collectShippingAddress?: boolean;
    }[] = [];

    for (const f of funnels) {
      const co = await getFunnelCheckoutStep(ctx, f._id);
      const stepProductIds: Id<"products">[] = co?.config?.productIds ?? [];
      result.push({
        _id: f._id,
        title: f.title,
        slug: f.slug,
        status: f.status,
        productIds: stepProductIds,
        collectEmail: co?.config?.collectEmail ?? true,
        collectName: co?.config?.collectName ?? true,
        collectPhone: co?.config?.collectPhone ?? false,
        collectShippingAddress: co?.config?.collectShippingAddress ?? false,
      });
    }

    return result;
  },
});

/**
 * List steps for a funnel (ordered)
 */
export const getFunnelSteps = query({
  args: { funnelId: v.id("funnels") },
  handler: async (ctx, args) => {
    const steps = await ctx.db
      .query("funnelSteps")
      .withIndex("by_funnelId_and_position", (q) =>
        q.eq("funnelId", args.funnelId),
      )
      .collect();
    return steps.sort((a, b) => a.position - b.position);
  },
});

export const getFunnelStepById = query({
  args: { stepId: v.id("funnelSteps") },
  handler: async (ctx, args) => {
    const step = await ctx.db.get(args.stepId);
    return step ?? null;
  },
});

export const getFunnelEdges = query({
  args: { funnelId: v.id("funnels") },
  handler: async (ctx, args) => {
    const edges = await ctx.db
      .query("funnelEdges")
      .withIndex("by_funnelId", (q) => q.eq("funnelId", args.funnelId))
      .collect();
    return edges
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((e) => ({
        _id: e._id as Id<"funnelEdges">,
        source: e.source as Id<"funnelSteps">,
        target: e.target as Id<"funnelSteps">,
        label: e.label,
        order: e.order ?? 0,
        branch: e.branch,
      }));
  },
});
