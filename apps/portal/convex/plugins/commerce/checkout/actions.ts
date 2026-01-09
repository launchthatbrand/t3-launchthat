/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import type { Id } from "../../../_generated/dataModel";
import type { ActionCtx } from "../../../_generated/server";
import { components } from "../../../_generated/api";
import { action } from "../../../_generated/server";
import {
  normalizeOrganizationId,
  PORTAL_TENANT_ID,
  PORTAL_TENANT_SLUG,
} from "../../../constants";

// Avoid TS "type instantiation is excessively deep" from the generated `api` types
// in this large orchestration function by dynamically importing and erasing types.
let cachedApiAny: any = null;
let apiAny: any = null;
const getApiAny = async (): Promise<any> => {
  if (cachedApiAny) return cachedApiAny;
  const mod = (await import("../../../_generated/api")) as unknown as {
    api: unknown;
  };
  cachedApiAny = mod.api as any;
  return cachedApiAny;
};

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
  mergeGuestCartIntoUserCart: unknown;
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

interface CrmContactsQueries {
  getContactIdForUser: unknown;
}
interface CrmContactsMutations {
  createContact: unknown;
  updateContact: unknown;
}
interface CrmMarketingTagsQueries {
  listMarketingTags: unknown;
}
interface CrmMarketingTagsMutations {
  createMarketingTag: unknown;
  assignMarketingTagToUser: unknown;
}

const crmContactsQueries = (
  components as unknown as {
    launchthat_crm: { contacts: { queries: CrmContactsQueries } };
  }
).launchthat_crm.contacts.queries;
const crmContactsMutations = (
  components as unknown as {
    launchthat_crm: { contacts: { mutations: CrmContactsMutations } };
  }
).launchthat_crm.contacts.mutations;
const crmMarketingTagsQueries = (
  components as unknown as {
    launchthat_crm: { marketingTags: { queries: CrmMarketingTagsQueries } };
  }
).launchthat_crm.marketingTags.queries;
const crmMarketingTagsMutations = (
  components as unknown as {
    launchthat_crm: { marketingTags: { mutations: CrmMarketingTagsMutations } };
  }
).launchthat_crm.marketingTags.mutations;

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
  subscriptionId: "order.subscriptionId",
  couponCode: "order.couponCode",
  discountAmount: "order.discountAmount",
  orderStatus: "order.status",
  customerEmail: "order.customerEmail",
  secondaryEmailCandidate: "order.secondaryEmailCandidate",
  customerPhone: "order.customerPhone",
  requiresAccount: "order.requiresAccount",
  requiresAccessVerification: "order.requiresAccessVerification",
  checkoutToken: "order.checkoutToken",
  tenantSlug: "order.tenantSlug",
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

const PRODUCT_META_KEYS = {
  type: "product.type",
  subscriptionInterval: "product.subscription.interval",
  subscriptionAmountMonthlyCents: "product.subscription.amountMonthly",
  subscriptionSetupFeeCents: "product.subscription.setupFee",
  subscriptionTrialDays: "product.subscription.trialDays",
} as const;

const toIsoDateUtc = (d: Date): string => {
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

const addDaysUtc = (d: Date, days: number): Date => {
  const next = new Date(d.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const createCheckoutToken = (): string => {
  try {
    const cryptoObj = (globalThis as unknown as { crypto?: Crypto }).crypto;
    const id =
      typeof cryptoObj?.randomUUID === "function" ? cryptoObj.randomUUID() : "";
    if (typeof id === "string" && id.trim()) return id;
  } catch {
    // ignore
  }
  return `chk_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const CRM_PLUGIN_ENABLED_KEY = "plugin_crm_enabled";
const CRM_PRODUCT_TAG_IDS_META_KEY = "crm.marketingTagIdsJson";
const CRM_PRODUCT_TAG_SLUGS_META_KEY = "crm.tagSlugsJson";
const PRODUCT_REQUIRE_ACCOUNT_META_KEY = "product.requireAccount";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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
  ctx: ActionCtx,
  args: { organizationId?: string | undefined },
): Promise<boolean> => {
  const orgRaw = args.organizationId;
  const orgIdForOptions: Id<"organizations"> | null =
    typeof orgRaw === "string" && orgRaw.trim()
      ? orgRaw === PORTAL_TENANT_SLUG
        ? PORTAL_TENANT_ID
        : /^[a-z0-9]{32}$/i.test(orgRaw)
          ? (orgRaw as Id<"organizations">)
          : null
      : null;
  const option = await ctx.runQuery(apiAny.core.options.get, {
    metaKey: CRM_PLUGIN_ENABLED_KEY,
    type: "site",
    orgId: orgIdForOptions,
  });
  const metaValue =
    option && typeof option === "object"
      ? (option as Record<string, unknown>).metaValue
      : undefined;
  return Boolean(metaValue);
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
    checkoutToken: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    apiAny = await getApiAny();
    if (!args.userId && !args.guestSessionId) {
      throw new Error("Missing cart identity");
    }

    // If checkout created/logged-in a user mid-flow, the cart may still live under the
    // guestSessionId. The component cart `getCart` prioritizes `userId` if present, so
    // merge guest cart items into the user cart before reading it.
    const normalizedUserId = asString(args.userId).trim();
    const normalizedGuestSessionId = asString(args.guestSessionId).trim();
    if (normalizedUserId && normalizedGuestSessionId) {
      await ctx.runMutation(
        commerceCartMutations.mergeGuestCartIntoUserCart as any,
        {
          userId: normalizedUserId,
          guestSessionId: normalizedGuestSessionId,
        },
      );
    }

    const orgRaw = args.organizationId;
    const orgIdForOptions: Id<"organizations"> | null =
      typeof orgRaw === "string" && orgRaw.trim()
        ? orgRaw === PORTAL_TENANT_SLUG
          ? PORTAL_TENANT_ID
          : /^[a-z0-9]{32}$/i.test(orgRaw)
            ? (orgRaw as Id<"organizations">)
            : null
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
      userId: normalizedUserId || undefined,
      guestSessionId: normalizedUserId
        ? undefined
        : normalizedGuestSessionId || undefined,
    });
    const cartItems: any[] = Array.isArray(cart?.items) ? cart.items : [];
    if (cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    let lineItems: LineItem[] = cartItems
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
      const meta = await ctx.runQuery(
        apiAny.plugins.commerce.queries.getPostMeta,
        {
          postId: productId,
          organizationId: args.organizationId,
        },
      );
      productMetaCache[productId] = meta;
      return meta;
    };

    // Subscription product detection (Simple subscription):
    // If the cart contains a subscription product, we create an Authorize.Net ARB subscription
    // and then create an initial order linked to that subscription.
    let isSubscriptionCheckout = false;
    let subscriptionProductId: string | null = null;
    let subscriptionProductTitle = "Subscription";
    let subscriptionAmountMonthlyCents = 0;
    let subscriptionSetupFeeCents = 0;
    let subscriptionTrialDays = 0;
    let subscriptionArbStartDateIso = toIsoDateUtc(addDaysUtc(new Date(), 30));
    let subscriptionInitialChargeAmount = 0;

    for (const productId of uniqueProductIds) {
      const meta = await getProductMeta(productId);
      const productType = asString(
        readMetaValue(meta, PRODUCT_META_KEYS.type),
      ).trim();
      if (productType === "simple_subscription") {
        isSubscriptionCheckout = true;
        subscriptionProductId = productId;
        const matchingLineItem = lineItems.find(
          (li) => li.productId === productId,
        );
        subscriptionProductTitle = matchingLineItem?.title?.trim()
          ? matchingLineItem.title.trim()
          : "Subscription";

        const interval = asString(
          readMetaValue(meta, PRODUCT_META_KEYS.subscriptionInterval),
        ).trim();
        if (interval && interval !== "month") {
          throw new Error(
            "Unsupported subscription interval (only monthly is supported).",
          );
        }

        const amountCentsRaw = readMetaValue(
          meta,
          PRODUCT_META_KEYS.subscriptionAmountMonthlyCents,
        );
        const setupFeeCentsRaw = readMetaValue(
          meta,
          PRODUCT_META_KEYS.subscriptionSetupFeeCents,
        );
        const trialDaysRaw = readMetaValue(
          meta,
          PRODUCT_META_KEYS.subscriptionTrialDays,
        );

        subscriptionAmountMonthlyCents =
          typeof amountCentsRaw === "number" && Number.isFinite(amountCentsRaw)
            ? Math.max(0, Math.floor(amountCentsRaw))
            : 0;
        subscriptionSetupFeeCents =
          typeof setupFeeCentsRaw === "number" &&
          Number.isFinite(setupFeeCentsRaw)
            ? Math.max(0, Math.floor(setupFeeCentsRaw))
            : 0;
        subscriptionTrialDays =
          typeof trialDaysRaw === "number" && Number.isFinite(trialDaysRaw)
            ? Math.max(0, Math.floor(trialDaysRaw))
            : 0;

        // ARB start date: if trialDays is set, delay first recurring payment by that many days.
        // Otherwise, we charge the first month immediately and start ARB billing ~30 days later.
        if (subscriptionTrialDays > 0) {
          subscriptionArbStartDateIso = toIsoDateUtc(
            addDaysUtc(new Date(), subscriptionTrialDays),
          );
          subscriptionInitialChargeAmount = subscriptionSetupFeeCents / 100;
        } else {
          subscriptionArbStartDateIso = toIsoDateUtc(
            addDaysUtc(new Date(), 30),
          );
          subscriptionInitialChargeAmount =
            (subscriptionSetupFeeCents + subscriptionAmountMonthlyCents) / 100;
        }

        if (subscriptionAmountMonthlyCents <= 0) {
          throw new Error(
            "Subscription product is missing a valid monthly price. Set Subscription pricing in the product editor.",
          );
        }
      }
    }

    if (isSubscriptionCheckout) {
      if (!subscriptionProductId) {
        throw new Error("Subscription product not found.");
      }
      // Keep v1 strict: only allow a single subscription item in the cart.
      if (
        lineItems.length !== 1 ||
        lineItems[0]?.productId !== subscriptionProductId
      ) {
        throw new Error(
          "Subscription checkout currently supports only a single subscription product per order.",
        );
      }
      if ((lineItems[0]?.quantity ?? 1) !== 1) {
        throw new Error("Subscription quantity must be 1.");
      }
      // Normalize line items to reflect the initial charge amount.
      lineItems = [
        {
          productId: subscriptionProductId,
          title: subscriptionProductTitle,
          unitPrice: subscriptionInitialChargeAmount,
          quantity: 1,
        },
      ];
    }

    // Account-required products:
    // We allow guest checkout (Whop-like), but mark the resulting order as requiring
    // verification to access content. The post-auth "claim order" flow will attach
    // the order to the authenticated user and apply grants/tags/enrollments.
    let cartRequiresAccount = false;
    for (const productId of uniqueProductIds) {
      const meta = await getProductMeta(productId);
      const rawRequire = readMetaValue(meta, PRODUCT_REQUIRE_ACCOUNT_META_KEY);
      if (parseBoolean(rawRequire)) {
        cartRequiresAccount = true;
        break;
      }
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
        const reason =
          couponResult && typeof couponResult === "object"
            ? (couponResult as Record<string, unknown>).reason
            : undefined;
        throw new Error(
          typeof reason === "string" ? reason : "Invalid coupon code.",
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

    // Subscription checkout (Authorize.Net ARB):
    // Create the ARB subscription first. Then persist a local `subscription` record and
    // create the initial order linked to it.
    let subscriptionPostId: string | null = null;
    if (isSubscriptionCheckout) {
      if (args.paymentMethodId !== "authorizenet") {
        throw new Error(
          "Subscription checkout currently supports only Authorize.Net as the payment method.",
        );
      }
      const paymentData = asRecord(args.paymentData);
      const opaqueData = asRecord(paymentData.opaqueData);
      const opaqueDataPayload = {
        dataDescriptor: asString(opaqueData.dataDescriptor),
        dataValue: asString(opaqueData.dataValue),
      };
      if (!opaqueDataPayload.dataDescriptor || !opaqueDataPayload.dataValue) {
        throw new Error("Missing Authorize.Net payment token (opaqueData).");
      }

      const createSubResult = await ctx.runAction(
        apiAny.plugins.commerce.payments.authorizenet.actions
          .createCimAndArbSubscription,
        {
          organizationId: args.organizationId,
          opaqueData: opaqueDataPayload,
          customer: {
            email: args.email.trim(),
            name: args.billing.name ?? undefined,
            postcode: args.billing.postcode ?? undefined,
          },
          amountMonthly: subscriptionAmountMonthlyCents / 100,
          currency,
          startDate: subscriptionArbStartDateIso,
        },
      );

      const sub = asRecord(createSubResult);
      if (!sub.success) {
        const msg =
          asString(sub.errorMessage) || "Unable to create subscription";
        throw new Error(msg);
      }
      const authnetSubscriptionId = asString(sub.subscriptionId).trim();
      const authnetCustomerProfileId = asString(sub.customerProfileId).trim();
      const authnetCustomerPaymentProfileId = asString(
        sub.customerPaymentProfileId,
      ).trim();
      if (!authnetSubscriptionId) {
        throw new Error("Authorize.Net did not return a subscriptionId.");
      }

      // Create local subscription post (component-backed) now that we have the ARB id.
      const periodStartMs = Date.now();
      const periodEndMs =
        subscriptionTrialDays > 0
          ? Date.parse(`${subscriptionArbStartDateIso}T00:00:00.000Z`)
          : addDaysUtc(new Date(), 30).getTime();

      subscriptionPostId = (await ctx.runMutation(
        commercePostsMutations.createPost as any,
        {
          organizationId: args.organizationId,
          postTypeSlug: "subscription",
          title: `Subscription - ${args.email.trim()}`,
          slug: `sub-${authnetSubscriptionId}`,
          content: "",
          excerpt: "",
          status: "active",
          createdAt: now,
        },
      )) as string;

      const subMetaEntries: Array<{
        key: string;
        value: string | number | boolean | null;
      }> = [
        { key: "subscription.productId", value: subscriptionProductId },
        { key: "subscription.customerEmail", value: args.email.trim() },
        { key: "subscription.customerUserId", value: normalizedUserId || null },
        { key: "subscription.gateway", value: "authorizenet" },
        {
          key: "subscription.authnet.subscriptionId",
          value: authnetSubscriptionId,
        },
        {
          key: "subscription.authnet.customerProfileId",
          value: authnetCustomerProfileId || null,
        },
        {
          key: "subscription.authnet.customerPaymentProfileId",
          value: authnetCustomerPaymentProfileId || null,
        },
        {
          key: "subscription.amountMonthly",
          value: subscriptionAmountMonthlyCents,
        },
        { key: "subscription.currency", value: currency },
        { key: "subscription.currentPeriodStart", value: periodStartMs },
        { key: "subscription.currentPeriodEnd", value: periodEndMs },
        { key: "subscription.status", value: "active" },
      ];

      for (const entry of subMetaEntries) {
        await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
          postId: subscriptionPostId,
          key: entry.key,
          value: entry.value,
        });
      }
    }

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
    if (subscriptionPostId) {
      metaEntries.push({
        key: ORDER_META_KEYS.subscriptionId,
        value: subscriptionPostId,
      });
    }
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
    // Save the buyer-entered email so we can optionally attach it to a phone-matched user after OTP.
    metaEntries.push({
      key: ORDER_META_KEYS.secondaryEmailCandidate,
      value: args.email.trim(),
    });
    metaEntries.push({
      key: ORDER_META_KEYS.requiresAccount,
      value: cartRequiresAccount,
    });
    metaEntries.push({
      key: ORDER_META_KEYS.requiresAccessVerification,
      value: cartRequiresAccount && !normalizedUserId,
    });
    // For guest account-required checkouts, create an unguessable token so the
    // portal can safely upsert the Clerk + core user after purchase (before login),
    // and link the order to that user.
    const checkoutToken =
      cartRequiresAccount && !normalizedUserId ? createCheckoutToken() : null;
    if (checkoutToken) {
      metaEntries.push({
        key: ORDER_META_KEYS.checkoutToken,
        value: checkoutToken,
      });
    }
    // Persist tenant slug for post-purchase server-side workflows so we don't depend on request headers.
    if (args.organizationId) {
      try {
        const orgIdCandidate =
          typeof args.organizationId === "string" && args.organizationId.trim()
            ? args.organizationId === PORTAL_TENANT_SLUG
              ? PORTAL_TENANT_ID
              : /^[a-z0-9]{32}$/i.test(args.organizationId)
                ? (args.organizationId as Id<"organizations">)
                : null
            : null;
        const orgIdForQuery = orgIdCandidate
          ? normalizeOrganizationId(orgIdCandidate)
          : null;
        const org = orgIdForQuery
          ? await ctx.runQuery(apiAny.core.organizations.queries.getById, {
              organizationId: orgIdForQuery,
            })
          : null;
        const orgSlug =
          org && typeof org === "object"
            ? (org as Record<string, unknown>).slug
            : undefined;
        const slug = typeof orgSlug === "string" ? orgSlug.trim() : "";
        if (slug) {
          metaEntries.push({ key: ORDER_META_KEYS.tenantSlug, value: slug });
        }
      } catch (err) {
        console.warn(
          "[placeOrder] could not load org slug for order meta",
          err,
        );
      }
    }

    const buyerPhone =
      asString(args.billing.phone).trim() ||
      asString(args.shipping.phone).trim();
    if (buyerPhone) {
      metaEntries.push({
        key: ORDER_META_KEYS.customerPhone,
        value: buyerPhone,
      });
    }

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

    if (subscriptionPostId) {
      await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
        postId: subscriptionPostId,
        key: "subscription.lastOrderId",
        value: orderId,
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
          apiAny.plugins.commerce.payments.authorizenet.actions
            .chargeWithOpaqueData,
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
    // IMPORTANT: CRM should never be able to fail checkout (order + payment already succeeded).
    try {
      const shouldSyncCrm = await isCrmEnabledForOrg(ctx, {
        organizationId: args.organizationId,
      });
      const crmOrganizationId =
        asString(args.organizationId).trim() || PORTAL_TENANT_SLUG;

      if (shouldSyncCrm && crmOrganizationId && normalizedUserId) {
        const identity = await ctx.auth.getUserIdentity();
        const assignedBy = identity?.tokenIdentifier ?? undefined;
        const contactName =
          asString(args.billing.name).trim() ||
          asString(args.shipping.name).trim() ||
          asString(args.email).trim();

        let contactId: string | null = (await ctx.runQuery(
          crmContactsQueries.getContactIdForUser as any,
          {
            organizationId: crmOrganizationId,
            userId: normalizedUserId,
          },
        )) as string | null;

        if (!contactId) {
          const baseSlug =
            slugify(asString(args.email).trim()) || `contact-${Date.now()}`;
          const createdContactId = (await ctx.runMutation(
            crmContactsMutations.createContact as any,
            {
              organizationId: crmOrganizationId,
              postTypeSlug: "contact",
              title: contactName || "Contact",
              slug: baseSlug,
              status: "published",
              userId: normalizedUserId,
              meta: {
                "contact.userId": normalizedUserId,
                "contact.email": asString(args.email).trim(),
                "contact.name": contactName,
                "contact.source": "commerce.checkout",
              },
            },
          )) as string;
          contactId = createdContactId;
        } else {
          // Best-effort: keep basic fields up to date.
          await ctx.runMutation(crmContactsMutations.updateContact as any, {
            organizationId: crmOrganizationId,
            contactId,
            title: contactName || undefined,
            userId: normalizedUserId,
            meta: {
              "contact.userId": normalizedUserId,
              "contact.email": asString(args.email).trim(),
              "contact.name": contactName,
            },
          });
        }

        if (contactId) {
          const tagIds: string[] = [];
          const tagSlugs: string[] = [];

          for (const productId of uniqueProductIds) {
            const meta = await getProductMeta(productId);
            const rawIds = readMetaValue(meta, CRM_PRODUCT_TAG_IDS_META_KEY);
            tagIds.push(...parseJsonStringArray(rawIds));

            const rawSlugs = readMetaValue(
              meta,
              CRM_PRODUCT_TAG_SLUGS_META_KEY,
            );
            tagSlugs.push(...parseJsonStringArray(rawSlugs));
          }

          const normalizedIds = Array.from(
            new Set(tagIds.map((s) => s.trim()).filter(Boolean)),
          );
          for (const marketingTagId of normalizedIds) {
            await ctx.runMutation(
              crmMarketingTagsMutations.assignMarketingTagToUser as any,
              {
                organizationId: crmOrganizationId,
                contactId: contactId as any,
                marketingTagId: marketingTagId as any,
                source: "commerce.product_purchase",
                assignedBy,
              },
            );
          }

          // Legacy: allow storing tag slugs on products. We'll resolve/create tags by slug.
          const normalizedSlugs = Array.from(
            new Set(
              tagSlugs.map((s) => s.trim().toLowerCase()).filter(Boolean),
            ),
          );
          if (normalizedSlugs.length > 0) {
            const tags = (await ctx.runQuery(
              crmMarketingTagsQueries.listMarketingTags as any,
              { organizationId: crmOrganizationId },
            )) as { _id?: unknown; slug?: unknown; name?: unknown }[];
            const slugToId: Record<string, string> = {};
            for (const t of tags) {
              const slug =
                typeof t.slug === "string" ? t.slug.trim().toLowerCase() : "";
              const id = typeof t._id === "string" ? t._id : "";
              if (slug && id) slugToId[slug] = id;
            }

            for (const slug of normalizedSlugs) {
              let tagId = slugToId[slug] ?? "";
              if (!tagId) {
                const createdId = (await ctx.runMutation(
                  crmMarketingTagsMutations.createMarketingTag as any,
                  {
                    organizationId: crmOrganizationId,
                    name: slug,
                    slug,
                    createdBy: assignedBy,
                    isActive: true,
                  },
                )) as string;
                tagId = createdId;
                slugToId[slug] = createdId;
              }

              if (tagId) {
                await ctx.runMutation(
                  crmMarketingTagsMutations.assignMarketingTagToUser as any,
                  {
                    organizationId: crmOrganizationId,
                    contactId: contactId as any,
                    marketingTagId: tagId as any,
                    source: "commerce.product_purchase",
                    assignedBy,
                  },
                );
              }
            }
          }
        }
      }
    } catch (err: unknown) {
      console.error("[checkout] CRM sync failed (continuing)", err);
    }

    await ctx.runMutation(commerceCartMutations.clearCart as any, {
      userId: normalizedUserId || undefined,
      guestSessionId: normalizedGuestSessionId || undefined,
    });

    let redirectUrl: string | undefined = undefined;

    try {
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
            const tokenParam = checkoutToken
              ? `&t=${encodeURIComponent(checkoutToken)}`
              : "";
            redirectUrl = `${base}?orderId=${encodeURIComponent(orderId)}${tokenParam}`;
          }
        }
      }
    } catch (err: unknown) {
      console.error(
        "[checkout] could not compute redirectUrl (continuing)",
        err,
      );
    }

    return {
      success: true,
      orderId,
      redirectUrl,
      checkoutToken: checkoutToken ?? undefined,
    };
  },
});
