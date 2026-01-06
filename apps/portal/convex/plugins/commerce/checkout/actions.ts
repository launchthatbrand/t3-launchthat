/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { api, components, internal } from "../../../_generated/api";
import { action } from "../../../_generated/server";
import {
  normalizeOrganizationId,
  PORTAL_TENANT_SLUG,
} from "../../../constants";

// Avoid TS "type instantiation is excessively deep" from the generated `api` types
// when used with ctx.runQuery/runMutation/runAction in large orchestration functions.
const apiAny = api as any;

interface CommercePostsMutations {
  createPost: unknown;
  setPostMeta: unknown;
  updatePost: unknown;
}

interface CommercePostsQueries {
  findFirstPostIdByMetaKeyValue: unknown;
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

const commercePostsQueries = (
  components as unknown as {
    launchthat_ecommerce: { posts: { queries: CommercePostsQueries } };
  }
).launchthat_ecommerce.posts.queries;

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
  itemsJson: "order.itemsJson",
  itemsSubtotal: "order.itemsSubtotal",
  orderTotal: "order.orderTotal",
  currency: "order.currency",
  couponCode: "order.couponCode",
  discountAmount: "order.discountAmount",
  orderStatus: "order.status",
  customerEmail: "order.customerEmail",
  paymentMethodId: "order.paymentMethodId",
  paymentStatus: "order.paymentStatus",
  gateway: "order.gateway",
  gatewayTransactionId: "order.gatewayTransactionId",
  paymentResponseJson: "order.paymentResponseJson",
  idempotencyKey: "order.idempotencyKey",
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
  legacyPayload: "order:payload",
  legacySubtotal: "order:subtotal",
  legacyTotal: "order:total",
  legacyEmail: "order:email",
  legacyUserId: "order:userId",
  userId: "order.userId",
} as const;

const CRM_PLUGIN_ENABLED_KEY = "plugin_crm_enabled";
const CRM_PRODUCT_TAG_IDS_META_KEY = "crm.marketingTagIdsJson";
const CRM_PRODUCT_TAG_SLUGS_META_KEY = "crm.tagSlugsJson";
const PRODUCT_REQUIRE_ACCOUNT_META_KEY = "product.requireAccount";

const parseJsonStringArray = (value: unknown): string[] => {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
};

const parseBoolean = (value: unknown): boolean =>
  value === true || value === "true" || value === 1 || value === "1";

const readMetaValue = (entries: unknown, key: string): unknown => {
  if (!Array.isArray(entries)) return undefined;
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    if (e.key === key) return e.value;
  }
  return undefined;
};

const isCrmEnabledForOrg = async (
  ctx: Parameters<(typeof action)["handler"]>[0],
  args: { organizationId?: string | undefined },
): Promise<boolean> => {
  const orgRaw = args.organizationId;
  const orgIdForOptions =
    typeof orgRaw === "string" && orgRaw.length > 0
      ? normalizeOrganizationId(orgRaw as any)
      : null;
  const option = await ctx.runQuery(apiAny.core.options.get, {
    metaKey: CRM_PLUGIN_ENABLED_KEY,
    type: "site",
    orgId: orgIdForOptions,
  });
  return Boolean((option as any)?.metaValue);
};

export const placeOrder = action({
  args: {
    organizationId: v.optional(v.string()),
    userId: v.optional(v.string()),
    guestSessionId: v.optional(v.string()),
    funnelStepId: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),

    email: v.string(),
    billing: v.object({
      // Checkout client uses `null` for missing fields, so validators must accept nulls.
      name: v.optional(v.union(v.string(), v.null())),
      email: v.optional(v.union(v.string(), v.null())),
      phone: v.optional(v.union(v.string(), v.null())),
      address1: v.optional(v.union(v.string(), v.null())),
      address2: v.optional(v.union(v.string(), v.null())),
      city: v.optional(v.union(v.string(), v.null())),
      state: v.optional(v.union(v.string(), v.null())),
      postcode: v.optional(v.union(v.string(), v.null())),
      country: v.optional(v.union(v.string(), v.null())),
    }),
    shipping: v.object({
      name: v.optional(v.union(v.string(), v.null())),
      phone: v.optional(v.union(v.string(), v.null())),
      address1: v.optional(v.union(v.string(), v.null())),
      address2: v.optional(v.union(v.string(), v.null())),
      city: v.optional(v.union(v.string(), v.null())),
      state: v.optional(v.union(v.string(), v.null())),
      postcode: v.optional(v.union(v.string(), v.null())),
      country: v.optional(v.union(v.string(), v.null())),
    }),

    paymentMethodId: v.string(),
    paymentData: v.optional(v.any()),
    couponCode: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    orderId: v.string(),
    redirectUrl: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    if (!args.userId && !args.guestSessionId) {
      throw new Error("Missing cart identity");
    }

    const orgRaw = args.organizationId;
    const orgIdForOptions =
      typeof orgRaw === "string" && orgRaw.length > 0
        ? normalizeOrganizationId(orgRaw as any)
        : null;
    const ecommerceSettings: any = await ctx.runQuery(apiAny.core.options.get, {
      metaKey: "plugin.ecommerce.settings",
      type: "site",
      orgId: orgIdForOptions,
    });
    const settingsValue = asRecord(ecommerceSettings?.metaValue);
    const currencyRaw = settingsValue.defaultCurrency;
    const currency = asString(currencyRaw).trim() || "USD";

    const idempotencyKey = asString(args.idempotencyKey).trim();
    if (idempotencyKey) {
      const existingOrderId = (await ctx.runQuery(
        commercePostsQueries.findFirstPostIdByMetaKeyValue as any,
        {
          key: ORDER_META_KEYS.idempotencyKey,
          value: idempotencyKey,
          organizationId: args.organizationId,
          postTypeSlug: "orders",
        },
      )) as string | null;

      if (existingOrderId) {
        return {
          success: true,
          orderId: existingOrderId,
        };
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

    const uniqueProductIds = Array.from(
      new Set(lineItems.map((li) => li.productId).filter(Boolean)),
    );

    const productMetaCache: Record<string, unknown> = {};
    const getProductMeta = async (productId: string): Promise<unknown> => {
      if (productId in productMetaCache) return productMetaCache[productId];
      const meta = await ctx.runQuery(apiAny.plugins.commerce.queries.getPostMeta, {
        postId: productId,
        organizationId: args.organizationId,
      });
      productMetaCache[productId] = meta;
      return meta;
    };

    // Enforce account-required products: do not allow guest-only checkout.
    let cartRequiresAccount = false;
    for (const productId of uniqueProductIds) {
      const meta = await getProductMeta(productId);
      const rawRequire = readMetaValue(meta, PRODUCT_REQUIRE_ACCOUNT_META_KEY);
      if (parseBoolean(rawRequire)) {
        cartRequiresAccount = true;
        break;
      }
    }
    if (cartRequiresAccount && !asString(args.userId).trim()) {
      throw new Error("Account required to purchase this product.");
    }

    const subtotal = computeSubtotal(lineItems);
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      throw new Error("Invalid order total");
    }

    const couponRaw = asString(args.couponCode).trim();
    let couponCode: string | null = null;
    let discountAmount = 0;
    let total = subtotal;
    if (couponRaw) {
      const couponResult = await ctx.runMutation(
        apiAny.plugins.commerce.discounts.mutations.validateDiscountCode,
        {
          organizationId: args.organizationId,
          code: couponRaw,
          subtotal,
        },
      );

      if (!couponResult || couponResult.ok !== true) {
        throw new Error(
          typeof couponResult?.reason === "string"
            ? couponResult.reason
            : "Invalid coupon code.",
        );
      }

      couponCode =
        typeof couponResult.appliedCode === "string"
          ? couponResult.appliedCode
          : couponRaw;
      discountAmount =
        typeof couponResult.discountAmount === "number"
          ? couponResult.discountAmount
          : 0;
      total = Math.max(0, subtotal - discountAmount);
    }

    // Validate payment token before creating the order to avoid orphan orders.
    // Skip validation entirely for free orders (total <= 0) and for explicit "free" method.
    if (args.paymentMethodId === "authorizenet" && total > 0) {
      const paymentData = asRecord(args.paymentData);
      const opaqueData = asRecord(paymentData.opaqueData);
      if (
        typeof opaqueData.dataDescriptor !== "string" ||
        typeof opaqueData.dataValue !== "string"
      ) {
        throw new Error("Missing Authorize.Net payment token (opaqueData).");
      }
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
        status: "unpaid",
        createdAt: now,
      },
    )) as string;

    const metaEntries: {
      key: string;
      value: string | number | boolean | null;
    }[] = [];
    metaEntries.push({
      key: ORDER_META_KEYS.itemsJson,
      value: JSON.stringify(lineItems),
    });
    metaEntries.push({ key: ORDER_META_KEYS.itemsSubtotal, value: subtotal });
    metaEntries.push({ key: ORDER_META_KEYS.orderTotal, value: total });
    metaEntries.push({ key: ORDER_META_KEYS.currency, value: currency });
    if (couponCode) {
      metaEntries.push({ key: ORDER_META_KEYS.couponCode, value: couponCode });
      metaEntries.push({
        key: ORDER_META_KEYS.discountAmount,
        value: discountAmount,
      });
    }
    if (idempotencyKey) {
      metaEntries.push({
        key: ORDER_META_KEYS.idempotencyKey,
        value: idempotencyKey,
      });
    }
    metaEntries.push({
      key: ORDER_META_KEYS.paymentMethodId,
      value: args.paymentMethodId,
    });
    const isFreeOrder = total <= 0 || args.paymentMethodId === "free";
    metaEntries.push({
      key: ORDER_META_KEYS.paymentStatus,
      value: isFreeOrder ? "paid" : "pending",
    });
    metaEntries.push({
      key: ORDER_META_KEYS.orderStatus,
      value: isFreeOrder ? "processing" : "pending",
    });
    metaEntries.push({
      key: ORDER_META_KEYS.customerEmail,
      value: args.email.trim(),
    });

    if (args.billing.name)
      metaEntries.push({
        key: ORDER_META_KEYS.billingName,
        value: args.billing.name,
      });
    metaEntries.push({
      key: ORDER_META_KEYS.billingEmail,
      value: (args.billing.email ?? args.email).trim(),
    });
    if (args.billing.phone)
      metaEntries.push({
        key: ORDER_META_KEYS.billingPhone,
        value: args.billing.phone,
      });
    if (args.billing.address1)
      metaEntries.push({
        key: ORDER_META_KEYS.billingAddress1,
        value: args.billing.address1,
      });
    if (args.billing.address2)
      metaEntries.push({
        key: ORDER_META_KEYS.billingAddress2,
        value: args.billing.address2,
      });
    if (args.billing.city)
      metaEntries.push({
        key: ORDER_META_KEYS.billingCity,
        value: args.billing.city,
      });
    if (args.billing.state)
      metaEntries.push({
        key: ORDER_META_KEYS.billingState,
        value: args.billing.state,
      });
    if (args.billing.postcode)
      metaEntries.push({
        key: ORDER_META_KEYS.billingPostcode,
        value: args.billing.postcode,
      });
    if (args.billing.country)
      metaEntries.push({
        key: ORDER_META_KEYS.billingCountry,
        value: args.billing.country,
      });

    if (args.shipping.name)
      metaEntries.push({
        key: ORDER_META_KEYS.shippingName,
        value: args.shipping.name,
      });
    if (args.shipping.phone)
      metaEntries.push({
        key: ORDER_META_KEYS.shippingPhone,
        value: args.shipping.phone,
      });
    if (args.shipping.address1)
      metaEntries.push({
        key: ORDER_META_KEYS.shippingAddress1,
        value: args.shipping.address1,
      });
    if (args.shipping.address2)
      metaEntries.push({
        key: ORDER_META_KEYS.shippingAddress2,
        value: args.shipping.address2,
      });
    if (args.shipping.city)
      metaEntries.push({
        key: ORDER_META_KEYS.shippingCity,
        value: args.shipping.city,
      });
    if (args.shipping.state)
      metaEntries.push({
        key: ORDER_META_KEYS.shippingState,
        value: args.shipping.state,
      });
    if (args.shipping.postcode)
      metaEntries.push({
        key: ORDER_META_KEYS.shippingPostcode,
        value: args.shipping.postcode,
      });
    if (args.shipping.country)
      metaEntries.push({
        key: ORDER_META_KEYS.shippingCountry,
        value: args.shipping.country,
      });

    // Legacy payload for existing order list query display
    metaEntries.push({
      key: ORDER_META_KEYS.legacyEmail,
      value: args.email.trim(),
    });
    if (args.userId) {
      metaEntries.push({
        key: ORDER_META_KEYS.legacyUserId,
        value: args.userId,
      });
      metaEntries.push({
        key: ORDER_META_KEYS.userId,
        value: args.userId,
      });
    }
    metaEntries.push({ key: ORDER_META_KEYS.legacySubtotal, value: subtotal });
    metaEntries.push({ key: ORDER_META_KEYS.legacyTotal, value: total });
    metaEntries.push({
      key: ORDER_META_KEYS.legacyPayload,
      value: JSON.stringify({
        customerInfo: {
          email: args.email.trim(),
          billing: args.billing,
          shipping: args.shipping,
        },
        items: lineItems,
        currency,
        totals: { subtotal, total },
      }),
    });

    for (const entry of metaEntries) {
      await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
        postId: orderId,
        key: entry.key,
        value: entry.value,
      });
    }

    if (args.paymentMethodId === "authorizenet") {
      // If a coupon discounts the cart to $0, treat as a "free" order (no gateway call).
      let success = true;
      let paymentStatus = "paid";
      let orderStatus = "processing";
      let gatewayTransactionId = "";
      let gatewayAuthCode = "";
      let gatewayResponseCode = "";
      let gatewayErrorCode = "";
      let gatewayErrorMessage = "";

      if (total > 0) {
        const paymentData = asRecord(args.paymentData);
        const opaqueData = asRecord(paymentData.opaqueData);
        const opaqueDataPayload = {
          dataDescriptor: asString(opaqueData.dataDescriptor),
          dataValue: asString(opaqueData.dataValue),
        };

        const chargeResult = await ctx.runAction(
          api.plugins.commerce.payments.authorizenet.actions
            .chargeWithOpaqueData as any,
          {
            organizationId: args.organizationId,
            amount: total,
            currency,
            opaqueData: opaqueDataPayload,
            billing: {
              name: args.billing.name ?? undefined,
              postcode: args.billing.postcode ?? undefined,
            },
            orderId,
          },
        );

        const charge = asRecord(chargeResult);
        success = Boolean(charge.success);
        paymentStatus = success ? "paid" : "failed";
        orderStatus = success ? "processing" : "failed";
        gatewayTransactionId = success ? asString(charge.transactionId) : "";
        gatewayAuthCode = success ? asString(charge.authCode) : "";
        gatewayResponseCode = success ? asString(charge.responseCode) : "";
        gatewayErrorCode = success ? "" : asString(charge.errorCode);
        gatewayErrorMessage = success ? "" : asString(charge.errorMessage);
      }

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

      // Store a minimal gateway result payload only (no raw gateway response).
      const chargeToStore = {
        success,
        transactionId: gatewayTransactionId || undefined,
        authCode: gatewayAuthCode || undefined,
        responseCode: gatewayResponseCode || undefined,
        errorCode: gatewayErrorCode || undefined,
        errorMessage: gatewayErrorMessage || undefined,
      };
      await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
        postId: orderId,
        key: ORDER_META_KEYS.paymentResponseJson,
        value: JSON.stringify(chargeToStore),
      });

      if (!success) {
        await ctx.runMutation(commercePostsMutations.updatePost as any, {
          id: orderId,
          organizationId: args.organizationId,
          status: "failed",
        });
        // Do not leak raw gateway decline messages to the client.
        throw new Error(
          "Payment failed. Please try again or use a different payment method.",
        );
      }

      // Align post status with payment result (admin lists / filters).
      await ctx.runMutation(commercePostsMutations.updatePost as any, {
        id: orderId,
        organizationId: args.organizationId,
        status: "paid",
      });
    } else if (args.paymentMethodId === "free" || total <= 0) {
      await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
        postId: orderId,
        key: ORDER_META_KEYS.gateway,
        value: "free",
      });
      await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
        postId: orderId,
        key: ORDER_META_KEYS.paymentStatus,
        value: "paid",
      });
      await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
        postId: orderId,
        key: ORDER_META_KEYS.orderStatus,
        value: "processing",
      });
      await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
        postId: orderId,
        key: ORDER_META_KEYS.paymentResponseJson,
        value: JSON.stringify({ success: true, reason: "free_order" }),
      });
      await ctx.runMutation(commercePostsMutations.updatePost as any, {
        id: orderId,
        organizationId: args.organizationId,
        status: "paid",
      });
    } else {
      throw new Error(`Unsupported payment method: ${args.paymentMethodId}`);
    }

    // CRM sync (optional): ensure contact exists and assign any product tags.
    if (await isCrmEnabledForOrg(ctx, { organizationId: args.organizationId })) {
      const crmOrganizationId = (args.organizationId ?? PORTAL_TENANT_SLUG) as any;
      const contact = await ctx.runMutation(
        internal.core.crm.identity.resolvers.resolveOrCreateContactForActor,
        {
          organizationId: crmOrganizationId,
          userId: args.userId as any,
          email: args.email,
          name: args.billing.name ?? args.shipping.name ?? undefined ?? undefined,
          source: "commerce.checkout",
        },
      );

      const contactId = contact?.contactId;
      if (contactId) {
        const tagIds: string[] = [];
        const tagSlugs: string[] = [];

        for (const productId of uniqueProductIds) {
          const meta = await getProductMeta(productId);
          const rawIds = readMetaValue(meta, CRM_PRODUCT_TAG_IDS_META_KEY);
          tagIds.push(...parseJsonStringArray(rawIds));

          const rawSlugs = readMetaValue(meta, CRM_PRODUCT_TAG_SLUGS_META_KEY);
          tagSlugs.push(...parseJsonStringArray(rawSlugs));
        }

        const normalizedIds = Array.from(
          new Set(tagIds.map((s) => s.trim()).filter(Boolean)),
        );

        // Prefer IDs (new) and fall back to slugs (legacy).
        if (normalizedIds.length > 0) {
          for (const marketingTagId of normalizedIds) {
            await ctx.runMutation(
              internal.core.crm.marketingTags.index
                .assignMarketingTagToContactInternal,
              {
                organizationId: crmOrganizationId,
                contactId,
                marketingTagId: marketingTagId as any,
                source: "commerce.product_purchase",
              },
            );
          }
        } else {
          const normalizedSlugs = Array.from(
            new Set(
              tagSlugs.map((s) => s.trim().toLowerCase()).filter(Boolean),
            ),
          );
          for (const slug of normalizedSlugs) {
            const marketingTagId: string = await ctx.runMutation(
              internal.core.crm.marketingTags.index
                .ensureCrmMarketingTagBySlugInternal,
              { organizationId: crmOrganizationId, slug },
            );
            await ctx.runMutation(
              internal.core.crm.marketingTags.index
                .assignMarketingTagToContactInternal,
              {
                organizationId: crmOrganizationId,
                contactId,
                marketingTagId: marketingTagId as any,
                source: "commerce.product_purchase",
              },
            );
          }
        }
      }
    }

    await ctx.runMutation(commerceCartMutations.clearCart as any, {
      userId: args.userId,
      guestSessionId: args.guestSessionId,
    });

    let redirectUrl: string | undefined = undefined;

    if (typeof args.funnelStepId === "string" && args.funnelStepId.trim()) {
      const step: any = await ctx.runQuery(
        apiAny.plugins.commerce.funnelSteps.queries.getFunnelStepById,
        {
          stepId: args.funnelStepId,
          organizationId: args.organizationId,
        },
      );

      const funnelId = asString(step?.funnelId);
      const funnelSlug = asString(step?.funnelSlug);
      const isDefaultFunnel = Boolean(step?.isDefaultFunnel);
      const currentOrder = asNumber(step?.order);

      if (funnelId && funnelSlug) {
        const steps: any[] = await ctx.runQuery(
          apiAny.plugins.commerce.funnelSteps.queries.getFunnelStepsForFunnel,
          {
            funnelId,
            organizationId: args.organizationId,
          },
        );

        const sorted = Array.isArray(steps)
          ? steps
              .map((s) => ({
                slug: asString(s?.slug),
                order: asNumber(s?.order),
              }))
              .filter((s) => Boolean(s.slug))
              .sort((a, b) => a.order - b.order)
          : [];

        const next = sorted.find((s) => s.order > currentOrder);
        if (next?.slug) {
          const base = isDefaultFunnel
            ? `/checkout/${next.slug}`
            : `/f/${encodeURIComponent(funnelSlug)}/${encodeURIComponent(next.slug)}`;
          redirectUrl = `${base}?orderId=${encodeURIComponent(orderId)}`;
        }
      }
    }

    return { success: true, orderId, redirectUrl };
  },
});
