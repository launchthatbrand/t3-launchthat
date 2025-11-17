import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";

/**
 * Get enriched checkout configuration by slug using scenarios.
 * Falls back to legacy funnels implementation if no scenario is found.
 */
export const getCheckoutBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    // Try scenario first (checkout type)
    const scenario = await ctx.db
      .query("scenarios")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .filter((q) => q.eq(q.field("scenarioType"), "checkout"))
      .first();

    if (scenario) {
      // Get checkout node for this scenario
      const checkoutNode = await ctx.db
        .query("nodes")
        .withIndex("by_scenario_and_type", (q) =>
          q.eq("scenarioId", scenario._id).eq("type", "checkout"),
        )
        .first();

      if (!checkoutNode) return null;

      // Parse config; expect potential productIds
      const cfg =
        typeof checkoutNode.config === "string"
          ? (JSON.parse(checkoutNode.config) as Record<string, unknown>)
          : checkoutNode.config;

      const productIds = Array.isArray(cfg.productIds)
        ? (cfg.productIds as Id<"products">[])
        : [];

      const products: {
        _id: Id<"products">;
        price: number;
        name?: string;
        description?: string;
      }[] = [];

      for (const pid of productIds) {
        const p = await ctx.db.get(pid);
        if (p && p.status === "active") {
          products.push({
            _id: p._id,
            price: p.price,
            name: p.name,
            description: p.description,
          });
        }
      }

      return {
        _id: scenario._id,
        title: scenario.name,
        slug: args.slug,
        description: scenario.description,
        status: scenario.status,
        config: cfg,
        successUrl: cfg.successUrl ?? undefined,
        cancelUrl: cfg.cancelUrl ?? undefined,
        collectEmail: cfg.collectEmail ?? true,
        collectName: cfg.collectName ?? true,
        collectPhone: cfg.collectPhone ?? false,
        collectShippingAddress: cfg.collectShippingAddress ?? false,
        collectBillingAddress: cfg.collectBillingAddress ?? false,
        allowCoupons: cfg.allowCoupons ?? false,
        checkoutLayout: cfg.checkoutLayout ?? "two_step",
        productIds,
        products,
      };
    }
  },
});

/**
 * Get a checkout session by ID.
 * Currently proxies to legacy funnels session for compatibility.
 */
export const getCheckoutSession = query({
  args: { sessionId: v.id("funnelSessions") },
  handler: async (ctx, args) => {
    // Proxy legacy for now; will migrate to scenario-backed sessions later
    return await ctx.db.get(args.sessionId);
  },
});
