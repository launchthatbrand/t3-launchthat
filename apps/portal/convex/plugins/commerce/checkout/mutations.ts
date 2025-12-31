/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { api, components } from "../../../_generated/api";
import { mutation } from "../../../_generated/server";

interface CommercePostsMutations {
  createPost: unknown;
  setPostMeta: unknown;
  updatePost: unknown;
}

interface CommerceCartQueries {
  getCart: unknown;
}

interface CommerceCartMutations {
  clearCart: unknown;
}

const commercePostsMutations = (
  components as unknown as {
    launchthat_ecommerce: { posts: { mutations: CommercePostsMutations } };
  }
).launchthat_ecommerce.posts.mutations;

const commerceCartQueries = (
  components as unknown as {
    launchthat_ecommerce: { cart: { queries: CommerceCartQueries } };
  }
).launchthat_ecommerce.cart.queries;

const commerceCartMutations = (
  components as unknown as {
    launchthat_ecommerce: { cart: { mutations: CommerceCartMutations } };
  }
).launchthat_ecommerce.cart.mutations;

interface LineItem {
  productId: string;
  title: string;
  unitPrice: number;
  quantity: number;
}

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";
const asNumber = (value: unknown): number =>
  typeof value === "number" ? value : 0;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const computeSubtotal = (items: LineItem[]): number =>
  items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

const ORDER_META_KEYS = {
  // Admin meta box keys
  itemsJson: "order.itemsJson",
  itemsSubtotal: "order.itemsSubtotal",
  orderTotal: "order.orderTotal",
  currency: "order.currency",
  couponCode: "order.couponCode",
  orderStatus: "order.status",
  customerEmail: "order.customerEmail",
  paymentMethodId: "order.paymentMethodId",
  paymentStatus: "order.paymentStatus",
  gateway: "order.gateway",
  gatewayTransactionId: "order.gatewayTransactionId",
  paymentResponseJson: "order.paymentResponseJson",

  // Billing / shipping
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

  // Legacy keys used by existing order list queries
  legacyPayload: "order:payload",
  legacySubtotal: "order:subtotal",
  legacyTotal: "order:total",
  legacyEmail: "order:email",
  legacyUserId: "order:userId",
} as const;

export const placeOrder = mutation({
  args: {
    organizationId: v.optional(v.string()),
    userId: v.optional(v.string()),
    guestSessionId: v.optional(v.string()),

    email: v.string(),
    billing: v.object({
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
    shipping: v.object({
      name: v.optional(v.string()),
      phone: v.optional(v.string()),
      address1: v.optional(v.string()),
      address2: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      postcode: v.optional(v.string()),
      country: v.optional(v.string()),
    }),

    paymentMethodId: v.string(),
    paymentData: v.optional(v.any()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    if (!args.userId && !args.guestSessionId) {
      throw new Error("Missing cart identity");
    }

    const ecommerceSettings: any = await ctx.runQuery(api.core.options.get as any, {
      metaKey: "plugin.ecommerce.settings",
      type: "site",
      orgId: args.organizationId ?? null,
    });
    const settingsValue = asRecord(ecommerceSettings?.metaValue);
    const currencyRaw = settingsValue.defaultCurrency;
    const currency = asString(currencyRaw).trim() || "USD";

    // Validate payment token early so we don't create "orphan" orders.
    if (args.paymentMethodId === "authorizenet") {
      const paymentData = asRecord(args.paymentData);
      const opaqueData = asRecord(paymentData.opaqueData);
      if (
        typeof opaqueData.dataDescriptor !== "string" ||
        typeof opaqueData.dataValue !== "string"
      ) {
        throw new Error("Missing Authorize.Net payment token (opaqueData).");
      }
    }

    const cart = await ctx.runQuery(commerceCartQueries.getCart as any, {
      userId: args.userId,
      guestSessionId: args.guestSessionId,
    });
    const cartItems: any[] = Array.isArray(cart?.items) ? cart.items : [];

    if (cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    const lineItems: LineItem[] = cartItems
      .map((row) => {
        const productId = asString(row?.productPostId);
        const title = asString(row?.product?.title) || "Product";
        const unitPrice = asNumber(row?.unitPrice);
        const quantity = Math.max(1, Math.floor(asNumber(row?.quantity)));
        if (!productId) return null;
        return { productId, title, unitPrice, quantity } satisfies LineItem;
      })
      .filter(Boolean) as LineItem[];

    const subtotal = computeSubtotal(lineItems);
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      throw new Error("Invalid order total");
    }

    const now = Date.now();
    const orderId = (await ctx.runMutation(
      commercePostsMutations.createPost as any,
      {
        organizationId: args.organizationId,
        postTypeSlug: "orders",
        title: `Order ${now}`,
        slug: `order-${now}`,
        content: "",
        excerpt: "",
        status: "published",
        createdAt: now,
      },
    )) as string;

    const metaEntries: { key: string; value: string | number | boolean | null }[] =
      [];

    const itemsJson = JSON.stringify(lineItems);
    metaEntries.push({ key: ORDER_META_KEYS.itemsJson, value: itemsJson });
    metaEntries.push({ key: ORDER_META_KEYS.itemsSubtotal, value: subtotal });
    metaEntries.push({ key: ORDER_META_KEYS.orderTotal, value: subtotal });
    metaEntries.push({ key: ORDER_META_KEYS.currency, value: currency });
    metaEntries.push({ key: ORDER_META_KEYS.paymentMethodId, value: args.paymentMethodId });
    metaEntries.push({ key: ORDER_META_KEYS.paymentStatus, value: "pending" });
    metaEntries.push({ key: ORDER_META_KEYS.orderStatus, value: "pending" });
    metaEntries.push({ key: ORDER_META_KEYS.customerEmail, value: args.email.trim() });

    // Billing / shipping (full capture; store nulls only if explicitly empty)
    if (args.billing.name) metaEntries.push({ key: ORDER_META_KEYS.billingName, value: args.billing.name });
    metaEntries.push({ key: ORDER_META_KEYS.billingEmail, value: (args.billing.email ?? args.email).trim() });
    if (args.billing.phone) metaEntries.push({ key: ORDER_META_KEYS.billingPhone, value: args.billing.phone });
    if (args.billing.address1) metaEntries.push({ key: ORDER_META_KEYS.billingAddress1, value: args.billing.address1 });
    if (args.billing.address2) metaEntries.push({ key: ORDER_META_KEYS.billingAddress2, value: args.billing.address2 });
    if (args.billing.city) metaEntries.push({ key: ORDER_META_KEYS.billingCity, value: args.billing.city });
    if (args.billing.state) metaEntries.push({ key: ORDER_META_KEYS.billingState, value: args.billing.state });
    if (args.billing.postcode) metaEntries.push({ key: ORDER_META_KEYS.billingPostcode, value: args.billing.postcode });
    if (args.billing.country) metaEntries.push({ key: ORDER_META_KEYS.billingCountry, value: args.billing.country });

    if (args.shipping.name) metaEntries.push({ key: ORDER_META_KEYS.shippingName, value: args.shipping.name });
    if (args.shipping.phone) metaEntries.push({ key: ORDER_META_KEYS.shippingPhone, value: args.shipping.phone });
    if (args.shipping.address1) metaEntries.push({ key: ORDER_META_KEYS.shippingAddress1, value: args.shipping.address1 });
    if (args.shipping.address2) metaEntries.push({ key: ORDER_META_KEYS.shippingAddress2, value: args.shipping.address2 });
    if (args.shipping.city) metaEntries.push({ key: ORDER_META_KEYS.shippingCity, value: args.shipping.city });
    if (args.shipping.state) metaEntries.push({ key: ORDER_META_KEYS.shippingState, value: args.shipping.state });
    if (args.shipping.postcode) metaEntries.push({ key: ORDER_META_KEYS.shippingPostcode, value: args.shipping.postcode });
    if (args.shipping.country) metaEntries.push({ key: ORDER_META_KEYS.shippingCountry, value: args.shipping.country });

    // Legacy payload for existing order list query display
    metaEntries.push({
      key: ORDER_META_KEYS.legacyEmail,
      value: args.email.trim(),
    });
    if (args.userId) metaEntries.push({ key: ORDER_META_KEYS.legacyUserId, value: args.userId });
    metaEntries.push({ key: ORDER_META_KEYS.legacySubtotal, value: subtotal });
    metaEntries.push({ key: ORDER_META_KEYS.legacyTotal, value: subtotal });
    metaEntries.push({
      key: ORDER_META_KEYS.legacyPayload,
      value: JSON.stringify({
        customerInfo: { email: args.email.trim(), billing: args.billing, shipping: args.shipping },
        items: lineItems,
        currency,
        totals: { subtotal, total: subtotal },
      }),
    });

    // Persist initial meta
    for (const entry of metaEntries) {
      await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
        postId: orderId,
        key: entry.key,
        value: entry.value,
      });
    }

    // Process payment
    if (args.paymentMethodId === "authorizenet") {
      const paymentData = asRecord(args.paymentData);
      const opaqueData = asRecord(paymentData.opaqueData);

      const chargeResult = await ctx.runAction(
        api.plugins.commerce.payments.authorizenet.actions.chargeWithOpaqueData,
        {
          organizationId: args.organizationId,
          amount: subtotal,
          currency,
          opaqueData,
          billing: {
            name: args.billing.name ?? undefined,
            postcode: args.billing.postcode ?? undefined,
          },
          orderId,
        },
      );

      const success = Boolean((chargeResult as any)?.success);
      const paymentStatus = success ? "paid" : "failed";
      const orderStatus = success ? "processing" : "failed";
      const gatewayTransactionId = success
        ? asString((chargeResult as any)?.transactionId)
        : "";

      await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
        postId: orderId,
        key: ORDER_META_KEYS.gateway,
        value: "authorizenet",
      });
      await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
        postId: orderId,
        key: ORDER_META_KEYS.paymentStatus,
        value: paymentStatus,
      });
      await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
        postId: orderId,
        key: ORDER_META_KEYS.orderStatus,
        value: orderStatus,
      });
      if (gatewayTransactionId) {
        await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
          postId: orderId,
          key: ORDER_META_KEYS.gatewayTransactionId,
          value: gatewayTransactionId,
        });
      }
      await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
        postId: orderId,
        key: ORDER_META_KEYS.paymentResponseJson,
        value: JSON.stringify(chargeResult),
      });

      if (!success) {
        const msg = asString((chargeResult as any)?.errorMessage) || "Payment failed";
        throw new Error(msg);
      }

      // Clear cart on success
      await ctx.runMutation(commerceCartMutations.clearCart as any, {
        userId: args.userId,
        guestSessionId: args.guestSessionId,
      });

      return { success: true, orderId };
    }

    throw new Error(`Unsupported payment method: ${args.paymentMethodId}`);
  },
});


