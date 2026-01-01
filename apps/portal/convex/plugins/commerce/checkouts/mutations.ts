/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { api } from "../../../_generated/api";
import { components } from "../../../_generated/api";
import { mutation } from "../../../_generated/server";

const commerceCheckoutsMutations = components.launchthat_ecommerce.checkouts
  .mutations as any;
const commercePostsMutations = components.launchthat_ecommerce.posts
  .mutations as any;

const GENERAL_CHECKOUT_OPTION_KEY = "plugin.ecommerce.generalCheckoutPostId";

export const ensureDefaultCheckout = mutation({
  args: {
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      commerceCheckoutsMutations.ensureDefaultCheckout,
      args,
    );
  },
});

export const ensureGeneralCheckout = mutation({
  args: {
    organizationId: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const orgId = args.organizationId ?? null;
    const stored = (await ctx.runQuery(api.core.options.get, {
      metaKey: GENERAL_CHECKOUT_OPTION_KEY,
      type: "site",
      orgId,
    })) as { metaValue?: unknown } | null;

    const existingId =
      stored && typeof stored.metaValue === "string" ? stored.metaValue : null;

    if (existingId) {
      const existing = await ctx.runQuery(
        (components.launchthat_ecommerce.posts.queries as any).getPostById,
        {
          id: existingId,
          organizationId: args.organizationId,
        },
      );
      if (existing && existing.postTypeSlug === "checkout") {
        return String(existingId);
      }
    }

    const createdId = (await ctx.runMutation(
      commerceCheckoutsMutations.ensureDefaultCheckout,
      args,
    )) as string;

    await ctx.runMutation(api.core.options.set, {
      metaKey: GENERAL_CHECKOUT_OPTION_KEY,
      metaValue: createdId,
      type: "site",
      orgId,
    });

    return String(createdId);
  },
});

export const setGeneralCheckout = mutation({
  args: {
    organizationId: v.optional(v.string()),
    checkoutPostId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const orgId = args.organizationId ?? null;

    // Verify checkout exists for this org (if provided).
    const post = await ctx.runQuery(
      (components.launchthat_ecommerce.posts.queries as any).getPostById,
      {
        id: args.checkoutPostId,
        organizationId: args.organizationId,
      },
    );
    if (!post || post.postTypeSlug !== "checkout") {
      throw new Error("Checkout not found");
    }

    await ctx.runMutation(api.core.options.set, {
      metaKey: GENERAL_CHECKOUT_OPTION_KEY,
      metaValue: args.checkoutPostId,
      type: "site",
      orgId,
    });

    // Enforce: general checkout must not have predefined products.
    await ctx.runMutation(commercePostsMutations.updatePost, {
      id: args.checkoutPostId,
      organizationId: args.organizationId,
      meta: {
        "checkout.predefinedProductsJson": "[]",
      },
    });

    return { success: true };
  },
});


