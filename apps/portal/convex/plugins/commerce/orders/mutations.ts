/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { mutation } from "../../../_generated/server";

interface CommercePostsMutations {
  createPost: unknown;
  updatePost: unknown;
  deletePost: unknown;
  setPostMeta: unknown;
}

const commercePostsMutations = (
  components as unknown as {
    launchthat_ecommerce: { posts: { mutations: CommercePostsMutations } };
  }
).launchthat_ecommerce.posts.mutations;

const ORDER_META_KEYS = {
  // Legacy keys (kept for backwards compat / existing order list parsing)
  payload: "order:payload",
  subtotal: "order:subtotal",
  shipping: "order:shipping",
  tax: "order:tax",
  total: "order:total",
  email: "order:email",
  userId: "order:userId",

  // Admin meta box keys (preferred going forward)
  itemsJson: "order.itemsJson",
  itemsSubtotal: "order.itemsSubtotal",
  orderTotal: "order.orderTotal",
  currency: "order.currency",
  couponCode: "order.couponCode",

  billingName: "billing.name",
  billingEmail: "billing.email",
  billingPhone: "billing.phone",
  billingAddress1: "billing.address1",
  billingAddress2: "billing.address2",
  billingCity: "billing.city",
  billingState: "billing.state",
  billingPostcode: "billing.postcode",
  billingCountry: "billing.country",

  shippingName: "shipping.name",
  shippingPhone: "shipping.phone",
  shippingAddress1: "shipping.address1",
  shippingAddress2: "shipping.address2",
  shippingCity: "shipping.city",
  shippingState: "shipping.state",
  shippingPostcode: "shipping.postcode",
  shippingCountry: "shipping.country",

  paymentMethodId: "order.paymentMethodId",
  paymentStatus: "order.paymentStatus",
  gateway: "order.gateway",
  gatewayTransactionId: "order.gatewayTransactionId",
  paymentResponseJson: "order.paymentResponseJson",
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

    // Preferred checkout + admin meta shape
    itemsJson: v.optional(v.string()),
    itemsSubtotal: v.optional(v.number()),
    orderTotal: v.optional(v.number()),
    currency: v.optional(v.string()),
    couponCode: v.optional(v.string()),

    billing: v.optional(
      v.object({
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        address1: v.optional(v.string()),
        address2: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        postcode: v.optional(v.string()),
        country: v.optional(v.string()),
      }),
    ),
    shippingAddress: v.optional(
      v.object({
        name: v.optional(v.string()),
        phone: v.optional(v.string()),
        address1: v.optional(v.string()),
        address2: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        postcode: v.optional(v.string()),
        country: v.optional(v.string()),
      }),
    ),

    paymentMethodId: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
    gateway: v.optional(v.string()),
    gatewayTransactionId: v.optional(v.string()),
    paymentResponseJson: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const postId = (await ctx.runMutation(
      commercePostsMutations.createPost as any,
      {
        organizationId: args.organizationId,
        postTypeSlug: "orders",
        title: args.title ?? "Order",
        slug: args.slug ?? `order-${now}`,
        content: "",
        excerpt: "",
        status: "published",
        createdAt: now,
      },
    )) as string;

    const meta: { key: string; value: string | number | boolean | null }[] = [];
    if (args.payload)
      meta.push({ key: ORDER_META_KEYS.payload, value: args.payload });
    if (typeof args.subtotal === "number")
      meta.push({ key: ORDER_META_KEYS.subtotal, value: args.subtotal });
    if (typeof args.shipping === "number")
      meta.push({ key: ORDER_META_KEYS.shipping, value: args.shipping });
    if (typeof args.tax === "number")
      meta.push({ key: ORDER_META_KEYS.tax, value: args.tax });
    if (typeof args.total === "number")
      meta.push({ key: ORDER_META_KEYS.total, value: args.total });
    if (args.email)
      meta.push({ key: ORDER_META_KEYS.email, value: args.email });
    if (args.userId)
      meta.push({ key: ORDER_META_KEYS.userId, value: args.userId });

    // New standardized keys (admin meta boxes)
    if (args.itemsJson)
      meta.push({ key: ORDER_META_KEYS.itemsJson, value: args.itemsJson });
    if (typeof args.itemsSubtotal === "number")
      meta.push({
        key: ORDER_META_KEYS.itemsSubtotal,
        value: args.itemsSubtotal,
      });
    if (typeof args.orderTotal === "number")
      meta.push({ key: ORDER_META_KEYS.orderTotal, value: args.orderTotal });
    if (args.currency)
      meta.push({ key: ORDER_META_KEYS.currency, value: args.currency });
    if (args.couponCode)
      meta.push({ key: ORDER_META_KEYS.couponCode, value: args.couponCode });

    if (args.billing?.name)
      meta.push({ key: ORDER_META_KEYS.billingName, value: args.billing.name });
    if (args.billing?.email)
      meta.push({
        key: ORDER_META_KEYS.billingEmail,
        value: args.billing.email,
      });
    if (args.billing?.phone)
      meta.push({
        key: ORDER_META_KEYS.billingPhone,
        value: args.billing.phone,
      });
    if (args.billing?.address1)
      meta.push({
        key: ORDER_META_KEYS.billingAddress1,
        value: args.billing.address1,
      });
    if (args.billing?.address2)
      meta.push({
        key: ORDER_META_KEYS.billingAddress2,
        value: args.billing.address2,
      });
    if (args.billing?.city)
      meta.push({ key: ORDER_META_KEYS.billingCity, value: args.billing.city });
    if (args.billing?.state)
      meta.push({
        key: ORDER_META_KEYS.billingState,
        value: args.billing.state,
      });
    if (args.billing?.postcode)
      meta.push({
        key: ORDER_META_KEYS.billingPostcode,
        value: args.billing.postcode,
      });
    if (args.billing?.country)
      meta.push({
        key: ORDER_META_KEYS.billingCountry,
        value: args.billing.country,
      });

    if (args.shippingAddress?.name)
      meta.push({
        key: ORDER_META_KEYS.shippingName,
        value: args.shippingAddress.name,
      });
    if (args.shippingAddress?.phone)
      meta.push({
        key: ORDER_META_KEYS.shippingPhone,
        value: args.shippingAddress.phone,
      });
    if (args.shippingAddress?.address1)
      meta.push({
        key: ORDER_META_KEYS.shippingAddress1,
        value: args.shippingAddress.address1,
      });
    if (args.shippingAddress?.address2)
      meta.push({
        key: ORDER_META_KEYS.shippingAddress2,
        value: args.shippingAddress.address2,
      });
    if (args.shippingAddress?.city)
      meta.push({
        key: ORDER_META_KEYS.shippingCity,
        value: args.shippingAddress.city,
      });
    if (args.shippingAddress?.state)
      meta.push({
        key: ORDER_META_KEYS.shippingState,
        value: args.shippingAddress.state,
      });
    if (args.shippingAddress?.postcode)
      meta.push({
        key: ORDER_META_KEYS.shippingPostcode,
        value: args.shippingAddress.postcode,
      });
    if (args.shippingAddress?.country)
      meta.push({
        key: ORDER_META_KEYS.shippingCountry,
        value: args.shippingAddress.country,
      });

    if (args.paymentMethodId)
      meta.push({
        key: ORDER_META_KEYS.paymentMethodId,
        value: args.paymentMethodId,
      });
    if (args.paymentStatus)
      meta.push({
        key: ORDER_META_KEYS.paymentStatus,
        value: args.paymentStatus,
      });
    if (args.gateway)
      meta.push({ key: ORDER_META_KEYS.gateway, value: args.gateway });
    if (args.gatewayTransactionId)
      meta.push({
        key: ORDER_META_KEYS.gatewayTransactionId,
        value: args.gatewayTransactionId,
      });
    if (args.paymentResponseJson)
      meta.push({
        key: ORDER_META_KEYS.paymentResponseJson,
        value: args.paymentResponseJson,
      });

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

    // Preferred checkout + admin meta shape
    itemsJson: v.optional(v.string()),
    itemsSubtotal: v.optional(v.number()),
    orderTotal: v.optional(v.number()),
    currency: v.optional(v.string()),
    couponCode: v.optional(v.string()),

    billing: v.optional(
      v.object({
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        address1: v.optional(v.string()),
        address2: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        postcode: v.optional(v.string()),
        country: v.optional(v.string()),
      }),
    ),
    shippingAddress: v.optional(
      v.object({
        name: v.optional(v.string()),
        phone: v.optional(v.string()),
        address1: v.optional(v.string()),
        address2: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        postcode: v.optional(v.string()),
        country: v.optional(v.string()),
      }),
    ),

    paymentMethodId: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
    gateway: v.optional(v.string()),
    gatewayTransactionId: v.optional(v.string()),
    paymentResponseJson: v.optional(v.string()),
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

    const meta: { key: string; value: string | number | boolean | null }[] = [];
    if (args.payload !== undefined)
      meta.push({ key: ORDER_META_KEYS.payload, value: args.payload ?? null });
    if (args.subtotal !== undefined)
      meta.push({
        key: ORDER_META_KEYS.subtotal,
        value: args.subtotal ?? null,
      });
    if (args.shipping !== undefined)
      meta.push({
        key: ORDER_META_KEYS.shipping,
        value: args.shipping ?? null,
      });
    if (args.tax !== undefined)
      meta.push({ key: ORDER_META_KEYS.tax, value: args.tax ?? null });
    if (args.total !== undefined)
      meta.push({ key: ORDER_META_KEYS.total, value: args.total ?? null });
    if (args.email !== undefined)
      meta.push({ key: ORDER_META_KEYS.email, value: args.email ?? null });
    if (args.userId !== undefined)
      meta.push({ key: ORDER_META_KEYS.userId, value: args.userId ?? null });

    // New standardized keys (admin meta boxes)
    if (args.itemsJson !== undefined)
      meta.push({
        key: ORDER_META_KEYS.itemsJson,
        value: args.itemsJson ?? null,
      });
    if (args.itemsSubtotal !== undefined)
      meta.push({
        key: ORDER_META_KEYS.itemsSubtotal,
        value: args.itemsSubtotal ?? null,
      });
    if (args.orderTotal !== undefined)
      meta.push({
        key: ORDER_META_KEYS.orderTotal,
        value: args.orderTotal ?? null,
      });
    if (args.currency !== undefined)
      meta.push({
        key: ORDER_META_KEYS.currency,
        value: args.currency ?? null,
      });
    if (args.couponCode !== undefined)
      meta.push({
        key: ORDER_META_KEYS.couponCode,
        value: args.couponCode ?? null,
      });

    if (args.billing !== undefined) {
      const b = args.billing ?? {};
      if (b.name !== undefined)
        meta.push({ key: ORDER_META_KEYS.billingName, value: b.name ?? null });
      if (b.email !== undefined)
        meta.push({
          key: ORDER_META_KEYS.billingEmail,
          value: b.email ?? null,
        });
      if (b.phone !== undefined)
        meta.push({
          key: ORDER_META_KEYS.billingPhone,
          value: b.phone ?? null,
        });
      if (b.address1 !== undefined)
        meta.push({
          key: ORDER_META_KEYS.billingAddress1,
          value: b.address1 ?? null,
        });
      if (b.address2 !== undefined)
        meta.push({
          key: ORDER_META_KEYS.billingAddress2,
          value: b.address2 ?? null,
        });
      if (b.city !== undefined)
        meta.push({ key: ORDER_META_KEYS.billingCity, value: b.city ?? null });
      if (b.state !== undefined)
        meta.push({
          key: ORDER_META_KEYS.billingState,
          value: b.state ?? null,
        });
      if (b.postcode !== undefined)
        meta.push({
          key: ORDER_META_KEYS.billingPostcode,
          value: b.postcode ?? null,
        });
      if (b.country !== undefined)
        meta.push({
          key: ORDER_META_KEYS.billingCountry,
          value: b.country ?? null,
        });
    }

    if (args.shippingAddress !== undefined) {
      const s = args.shippingAddress ?? {};
      if (s.name !== undefined)
        meta.push({ key: ORDER_META_KEYS.shippingName, value: s.name ?? null });
      if (s.phone !== undefined)
        meta.push({
          key: ORDER_META_KEYS.shippingPhone,
          value: s.phone ?? null,
        });
      if (s.address1 !== undefined)
        meta.push({
          key: ORDER_META_KEYS.shippingAddress1,
          value: s.address1 ?? null,
        });
      if (s.address2 !== undefined)
        meta.push({
          key: ORDER_META_KEYS.shippingAddress2,
          value: s.address2 ?? null,
        });
      if (s.city !== undefined)
        meta.push({ key: ORDER_META_KEYS.shippingCity, value: s.city ?? null });
      if (s.state !== undefined)
        meta.push({
          key: ORDER_META_KEYS.shippingState,
          value: s.state ?? null,
        });
      if (s.postcode !== undefined)
        meta.push({
          key: ORDER_META_KEYS.shippingPostcode,
          value: s.postcode ?? null,
        });
      if (s.country !== undefined)
        meta.push({
          key: ORDER_META_KEYS.shippingCountry,
          value: s.country ?? null,
        });
    }

    if (args.paymentMethodId !== undefined)
      meta.push({
        key: ORDER_META_KEYS.paymentMethodId,
        value: args.paymentMethodId ?? null,
      });
    if (args.paymentStatus !== undefined)
      meta.push({
        key: ORDER_META_KEYS.paymentStatus,
        value: args.paymentStatus ?? null,
      });
    if (args.gateway !== undefined)
      meta.push({ key: ORDER_META_KEYS.gateway, value: args.gateway ?? null });
    if (args.gatewayTransactionId !== undefined)
      meta.push({
        key: ORDER_META_KEYS.gatewayTransactionId,
        value: args.gatewayTransactionId ?? null,
      });
    if (args.paymentResponseJson !== undefined)
      meta.push({
        key: ORDER_META_KEYS.paymentResponseJson,
        value: args.paymentResponseJson ?? null,
      });

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
