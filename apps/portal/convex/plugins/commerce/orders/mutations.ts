/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { mutation } from "../../../_generated/server";

type CommercePostsMutations = {
  createPost: unknown;
  updatePost: unknown;
  deletePost: unknown;
  setPostMeta: unknown;
};

const commercePostsMutations = (
  components as unknown as {
    launchthat_ecommerce: { posts: { mutations: CommercePostsMutations } };
  }
).launchthat_ecommerce.posts.mutations;

const ORDER_META_KEYS = {
  payload: "order:payload",
  subtotal: "order:subtotal",
  shipping: "order:shipping",
  tax: "order:tax",
  total: "order:total",
  email: "order:email",
  userId: "order:userId",
} as const;

export const createOrder = mutation({
  args: {
    organizationId: v.optional(v.string()),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    payload: v.optional(v.string()),
    subtotal: v.optional(v.number()),
    shipping: v.optional(v.number()),
    tax: v.optional(v.number()),
    total: v.optional(v.number()),
    email: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const postId = (await ctx.runMutation(commercePostsMutations.createPost as any, {
      organizationId: args.organizationId,
      postTypeSlug: "orders",
      title: args.title ?? "Order",
      slug: args.slug ?? `order-${now}`,
      content: "",
      excerpt: "",
      status: "published",
      createdAt: now,
    })) as string;

    const meta: Array<{ key: string; value: string | number | boolean | null }> =
      [];
    if (args.payload) meta.push({ key: ORDER_META_KEYS.payload, value: args.payload });
    if (typeof args.subtotal === "number")
      meta.push({ key: ORDER_META_KEYS.subtotal, value: args.subtotal });
    if (typeof args.shipping === "number")
      meta.push({ key: ORDER_META_KEYS.shipping, value: args.shipping });
    if (typeof args.tax === "number")
      meta.push({ key: ORDER_META_KEYS.tax, value: args.tax });
    if (typeof args.total === "number")
      meta.push({ key: ORDER_META_KEYS.total, value: args.total });
    if (args.email) meta.push({ key: ORDER_META_KEYS.email, value: args.email });
    if (args.userId) meta.push({ key: ORDER_META_KEYS.userId, value: args.userId });

    for (const entry of meta) {
      await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
        postId,
        key: entry.key,
        value: entry.value,
      });
    }

    return { success: true, orderId: postId };
  },
});

export const updateOrder = mutation({
  args: {
    id: v.string(),
    organizationId: v.optional(v.string()),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    payload: v.optional(v.string()),
    subtotal: v.optional(v.number()),
    shipping: v.optional(v.number()),
    tax: v.optional(v.number()),
    total: v.optional(v.number()),
    email: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await ctx.runMutation(commercePostsMutations.updatePost as any, {
      id: args.id,
      organizationId: args.organizationId,
      patch: {
        ...(args.title ? { title: args.title } : {}),
        ...(args.slug ? { slug: args.slug } : {}),
        updatedAt: Date.now(),
      },
    });

    const meta: Array<{ key: string; value: string | number | boolean | null }> =
      [];
    if (args.payload !== undefined)
      meta.push({ key: ORDER_META_KEYS.payload, value: args.payload ?? null });
    if (args.subtotal !== undefined)
      meta.push({ key: ORDER_META_KEYS.subtotal, value: args.subtotal ?? null });
    if (args.shipping !== undefined)
      meta.push({ key: ORDER_META_KEYS.shipping, value: args.shipping ?? null });
    if (args.tax !== undefined)
      meta.push({ key: ORDER_META_KEYS.tax, value: args.tax ?? null });
    if (args.total !== undefined)
      meta.push({ key: ORDER_META_KEYS.total, value: args.total ?? null });
    if (args.email !== undefined)
      meta.push({ key: ORDER_META_KEYS.email, value: args.email ?? null });
    if (args.userId !== undefined)
      meta.push({ key: ORDER_META_KEYS.userId, value: args.userId ?? null });

    for (const entry of meta) {
      await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
        postId: args.id,
        key: entry.key,
        value: entry.value,
      });
    }

    return { success: true };
  },
});

export const deleteOrder = mutation({
  args: {
    orderId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await ctx.runMutation(commercePostsMutations.deletePost as any, {
      id: args.orderId,
    });
    return { success: true };
  },
});


