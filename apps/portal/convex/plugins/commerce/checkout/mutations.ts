/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { api, components, internal } from "../../../_generated/api";
import { mutation } from "../../../_generated/server";
import type { Id } from "../../../_generated/dataModel";
import { grantCustomerAccess } from "../../../core/organizations/helpers";

// Avoid TS "type instantiation is excessively deep" from generated `api` types in large orchestration code.
const apiAny = api as any;

interface CommercePostsMutations {
  createPost: unknown;
  setPostMeta: unknown;
  updatePost: unknown;
}

interface CommercePostsQueries {
  getPostById: unknown;
  getPostMeta: unknown;
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
  // Admin meta box keys
  itemsJson: "order.itemsJson",
  itemsSubtotal: "order.itemsSubtotal",
  orderTotal: "order.orderTotal",
  currency: "order.currency",
  subscriptionId: "order.subscriptionId",
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
  checkoutToken: "order.checkoutToken",
} as const;

const CRM_PLUGIN_ENABLED_KEY = "plugin_crm_enabled";
const CRM_PRODUCT_TAG_IDS_META_KEY = "crm.marketingTagIdsJson";
const CRM_PRODUCT_TAG_SLUGS_META_KEY = "crm.tagSlugsJson";

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

const readMetaValue = (entries: unknown, key: string): unknown => {
  if (!Array.isArray(entries)) return undefined;
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    if (e.key === key) return e.value;
  }
  return undefined;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isCrmEnabledForOrg = async (
  ctx: Parameters<(typeof mutation)["handler"]>[0],
  args: { organizationId?: string | undefined },
): Promise<boolean> => {
  const option = await ctx.runQuery(api.core.options.get as any, {
    metaKey: CRM_PLUGIN_ENABLED_KEY,
    type: "site",
    orgId: args.organizationId ?? null,
  });
  return Boolean((option as any)?.metaValue);
};

const parsePurchasedProductIdsFromOrderMeta = (meta: unknown): string[] => {
  const itemsJsonRaw =
    readMetaValue(meta, ORDER_META_KEYS.itemsJson) ??
    readMetaValue(meta, "order:itemsJson") ??
    readMetaValue(meta, ORDER_META_KEYS.legacyPayload);
  const parsed =
    typeof itemsJsonRaw === "string"
      ? (() => {
          try {
            return JSON.parse(itemsJsonRaw) as unknown;
          } catch {
            return null;
          }
        })()
      : itemsJsonRaw;

  const rows: unknown[] = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? Array.isArray((parsed as any).items)
        ? ((parsed as any).items as unknown[])
        : []
      : [];

  const ids: string[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const productId = (row as Record<string, unknown>).productId;
    if (typeof productId === "string" && productId.trim()) {
      ids.push(productId);
    }
  }
  return Array.from(new Set(ids));
};

const syncCrmContactAndTagsBestEffort = async (
  ctx: Parameters<(typeof mutation)["handler"]>[0],
  args: {
    organizationId: string;
    userId: string;
    email: string;
    name?: string | undefined;
    assignedBy?: string | undefined;
    meta: unknown;
    source: "commerce.checkout" | "commerce.post_checkout_claim";
  },
): Promise<void> => {
  const shouldSyncCrm = await isCrmEnabledForOrg(ctx, {
    organizationId: args.organizationId,
  });
  if (!shouldSyncCrm) return;

  const crmContactsQueries = (components as any)?.launchthat_crm?.contacts?.queries;
  const crmContactsMutations =
    (components as any)?.launchthat_crm?.contacts?.mutations;
  const crmMarketingTagsQueries =
    (components as any)?.launchthat_crm?.marketingTags?.queries;
  const crmMarketingTagsMutations =
    (components as any)?.launchthat_crm?.marketingTags?.mutations;

  if (!crmContactsQueries || !crmContactsMutations || !crmMarketingTagsMutations) {
    return;
  }

  const crmOrgId = args.organizationId;

  let contactId: string | null = (await ctx.runQuery(
    crmContactsQueries.getContactIdForUser,
    {
      organizationId: crmOrgId,
      userId: args.userId,
    },
  )) as string | null;

  const contactName = (args.name?.trim() ?? "") || args.email;

  if (!contactId) {
    const baseSlug = slugify(args.email) || `contact-${Date.now()}`;
    contactId = (await ctx.runMutation(crmContactsMutations.createContact, {
      organizationId: crmOrgId,
      postTypeSlug: "contact",
      title: contactName || "Contact",
      slug: baseSlug,
      status: "published",
      userId: args.userId,
      meta: {
        "contact.userId": args.userId,
        "contact.email": args.email,
        "contact.name": contactName,
        "contact.source": args.source,
      },
    })) as string;
  } else {
    await ctx.runMutation(crmContactsMutations.updateContact, {
      organizationId: crmOrgId,
      contactId,
      title: contactName || undefined,
      userId: args.userId,
      meta: {
        "contact.userId": args.userId,
        "contact.email": args.email,
        "contact.name": contactName,
      },
    });
  }

  if (!contactId) return;

  const productIds = parsePurchasedProductIdsFromOrderMeta(args.meta);
  if (productIds.length === 0) return;

  const tagIds: string[] = [];
  const tagSlugs: string[] = [];

  for (const productId of productIds) {
    const pmeta = await ctx.runQuery(apiAny.plugins.commerce.queries.getPostMeta, {
      postId: productId,
      organizationId: crmOrgId,
    });
    tagIds.push(
      ...parseJsonStringArray(readMetaValue(pmeta, CRM_PRODUCT_TAG_IDS_META_KEY)),
    );
    tagSlugs.push(
      ...parseJsonStringArray(readMetaValue(pmeta, CRM_PRODUCT_TAG_SLUGS_META_KEY)),
    );
  }

  const normalizedIds = Array.from(
    new Set(tagIds.map((s) => s.trim()).filter(Boolean)),
  );
  for (const marketingTagId of normalizedIds) {
    await ctx.runMutation(crmMarketingTagsMutations.assignMarketingTagToUser, {
      organizationId: crmOrgId,
      contactId: contactId as any,
      marketingTagId: marketingTagId as any,
      source: "commerce.product_purchase",
      assignedBy: args.assignedBy,
    });
  }

  const normalizedSlugs = Array.from(
    new Set(tagSlugs.map((s) => s.trim().toLowerCase()).filter(Boolean)),
  );
  if (normalizedSlugs.length === 0 || !crmMarketingTagsQueries) return;

  const tags = (await ctx.runQuery(crmMarketingTagsQueries.listMarketingTags, {
    organizationId: crmOrgId,
  })) as { _id?: unknown; slug?: unknown; name?: unknown }[];
  const slugToId: Record<string, string> = {};
  for (const t of tags) {
    const slug = typeof t.slug === "string" ? t.slug.trim().toLowerCase() : "";
    const id = typeof t._id === "string" ? t._id : "";
    if (slug && id) slugToId[slug] = id;
  }

  for (const slug of normalizedSlugs) {
    let tagId = slugToId[slug] ?? "";
    if (!tagId && crmMarketingTagsMutations?.createMarketingTag) {
      const createdId = (await ctx.runMutation(
        crmMarketingTagsMutations.createMarketingTag,
        {
          organizationId: crmOrgId,
          name: slug,
          slug,
          createdBy: args.assignedBy,
          isActive: true,
        },
      )) as string;
      tagId = createdId;
      slugToId[slug] = createdId;
    }

    if (!tagId) continue;
    await ctx.runMutation(crmMarketingTagsMutations.assignMarketingTagToUser, {
      organizationId: crmOrgId,
      contactId: contactId as any,
      marketingTagId: tagId as any,
      source: "commerce.product_purchase",
      assignedBy: args.assignedBy,
    });
  }
};

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
    // This flow requires calling a Node action (payment gateway). In this codebase,
    // mutation ctx does not support ctx.runAction, so the real implementation lives in:
    // api.plugins.commerce.checkout.actions.placeOrder
    throw new Error(
      "placeOrder moved: call api.plugins.commerce.checkout.actions.placeOrder (useAction) instead of mutations.placeOrder.",
    );

    if (!args.userId && !args.guestSessionId) {
      throw new Error("Missing cart identity");
    }

    const ecommerceSettings: any = await ctx.runQuery(
      api.core.options.get as any,
      {
        metaKey: "plugin.ecommerce.settings",
        type: "site",
        orgId: args.organizationId ?? null,
      },
    );
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

    const metaEntries: {
      key: string;
      value: string | number | boolean | null;
    }[] = [];

    const itemsJson = JSON.stringify(lineItems);
    metaEntries.push({ key: ORDER_META_KEYS.itemsJson, value: itemsJson });
    metaEntries.push({ key: ORDER_META_KEYS.itemsSubtotal, value: subtotal });
    metaEntries.push({ key: ORDER_META_KEYS.orderTotal, value: subtotal });
    metaEntries.push({ key: ORDER_META_KEYS.currency, value: currency });
    metaEntries.push({
      key: ORDER_META_KEYS.paymentMethodId,
      value: args.paymentMethodId,
    });
    metaEntries.push({ key: ORDER_META_KEYS.paymentStatus, value: "pending" });
    metaEntries.push({ key: ORDER_META_KEYS.orderStatus, value: "pending" });
    metaEntries.push({
      key: ORDER_META_KEYS.customerEmail,
      value: args.email.trim(),
    });

    // Billing / shipping (full capture; store nulls only if explicitly empty)
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
    if (args.userId)
      metaEntries.push({
        key: ORDER_META_KEYS.legacyUserId,
        value: args.userId,
      });
    metaEntries.push({ key: ORDER_META_KEYS.legacySubtotal, value: subtotal });
    metaEntries.push({ key: ORDER_META_KEYS.legacyTotal, value: subtotal });
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
        const msg =
          asString((chargeResult as any)?.errorMessage) || "Payment failed";
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

/**
 * Claim / attach a guest order to the currently authenticated user.
 * This is idempotent and safe to call multiple times.
 */
export const claimOrderAfterAuth = mutation({
  args: {
    organizationId: v.string(),
    orderId: v.string(),
    // Optional: allow an authenticated user to claim an order even if their verified
    // email/phone doesn't match the checkout info, as long as they present the
    // checkout token and explicitly confirm.
    checkoutToken: v.optional(v.string()),
    force: v.optional(v.boolean()),
  },
  returns: v.object({
    ok: v.boolean(),
    orderId: v.string(),
    claimed: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const normalizedOrgId = asString(args.organizationId).trim();
    const normalizedOrderId = asString(args.orderId).trim();
    if (!normalizedOrgId || !normalizedOrderId) {
      throw new Error("Missing organizationId or orderId");
    }

    // Ensure a core user exists for this Clerk identity.
    const userId = (await ctx.runMutation(
      internal.core.users.mutations.internalEnsureUser,
      {},
    )) as Id<"users"> | null;
    if (!userId) {
      throw new Error("User not found");
    }

    const user = await ctx.db.get(userId);
    const userEmail =
      user && typeof user.email === "string" ? user.email.trim() : "";

    // Load order + meta from the ecommerce component.
    const post = (await ctx.runQuery(commercePostsQueries.getPostById as any, {
      id: normalizedOrderId,
      organizationId: normalizedOrgId,
    }));
    if (!post) {
      throw new Error("Order not found");
    }

    const meta = (await ctx.runQuery(commercePostsQueries.getPostMeta as any, {
      postId: post._id,
      organizationId: normalizedOrgId,
    })) as { key: string; value: unknown }[];

    const assignedDot = readMetaValue(meta, "order.userId");
    const assignedLegacy = readMetaValue(meta, "order:userId");
    const assignedUserId =
      typeof assignedDot === "string"
        ? assignedDot
        : typeof assignedLegacy === "string"
          ? assignedLegacy
          : "";

    if (assignedUserId && assignedUserId !== String(userId)) {
      // If the order is already linked to a "pending" user created post-checkout,
      // and the current auth identity matches that same Clerk user, treat as the
      // same user (avoid false "claimed by another user" on first login).
      if (typeof (identity as any)?.subject === "string") {
        const assigned = await ctx.db.get(assignedUserId as Id<"users">);
        const assignedClerkId =
          assigned && typeof (assigned as any)?.clerkId === "string"
            ? String((assigned as any).clerkId).trim()
            : "";
        const identityClerkId = String((identity as any).subject).trim();
        if (assignedClerkId && identityClerkId && assignedClerkId === identityClerkId) {
          // Continue; we'll overwrite the linkage below as idempotent.
        } else {
          throw new Error("Order already claimed by another user.");
        }
      } else {
        throw new Error("Order already claimed by another user.");
      }
    }

    const orderEmailRaw =
      readMetaValue(meta, "order.customerEmail") ??
      readMetaValue(meta, "order:email") ??
      readMetaValue(meta, "billing.email") ??
      readMetaValue(meta, "order.customerEmail");
    const orderEmail =
      typeof orderEmailRaw === "string" ? orderEmailRaw.trim() : "";

    const orderPhoneRaw =
      readMetaValue(meta, "order.customerPhone") ??
      readMetaValue(meta, "billing.phone") ??
      readMetaValue(meta, "shipping.phone");
    const orderPhone =
      typeof orderPhoneRaw === "string" ? orderPhoneRaw.trim() : "";

    const identityEmail =
      typeof (identity as any)?.email === "string"
        ? String((identity as any).email).trim()
        : "";
    const identityPhone =
      typeof (identity as any)?.phone_number === "string"
        ? String((identity as any).phone_number).trim()
        : typeof (identity as any)?.phoneNumber === "string"
          ? String((identity as any).phoneNumber).trim()
          : "";

    const normalize = (s: string) => s.trim().toLowerCase();
    const phoneDigits = (s: string): string => {
      const digits = s.replace(/[^0-9]/g, "");
      // Common US normalization: treat 1XXXXXXXXXX and XXXXXXXXXX as equivalent.
      if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
      return digits;
    };
    const emailMatches =
      orderEmail && (normalize(orderEmail) === normalize(identityEmail || userEmail));
    const phoneMatches =
      orderPhone &&
      identityPhone &&
      phoneDigits(orderPhone) === phoneDigits(identityPhone);

    if (!emailMatches && !phoneMatches) {
      const wantsForce = args.force === true;
      const token = asString(args.checkoutToken).trim();
      const tokenInOrder = readMetaValue(meta, ORDER_META_KEYS.checkoutToken);
      const tokenMatches =
        wantsForce &&
        token &&
        typeof tokenInOrder === "string" &&
        tokenInOrder.trim() === token;

      if (!tokenMatches) {
        throw new Error("Access denied: verification does not match this order.");
      }
    }

    // Attach order → user (idempotent)
    await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
      postId: normalizedOrderId,
      key: "order.userId",
      value: String(userId),
    });
    await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
      postId: normalizedOrderId,
      key: "order:userId",
      value: String(userId),
    });
    await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
      postId: normalizedOrderId,
      key: "order.requiresAccessVerification",
      value: false,
    });

    // Grant tenant access in Convex (student role). Best-effort; idempotent.
    await grantCustomerAccess(ctx, {
      organizationId: normalizedOrgId as any,
      customerUserId: userId,
      grantedBy: userId,
      accessType: "product_purchase",
      sourceId: normalizedOrderId,
    });

    // Best-effort: sync CRM contact + assign marketing tags from purchased products.
    try {
      const assignedBy =
        typeof (identity as any)?.tokenIdentifier === "string"
          ? (identity as any).tokenIdentifier
          : undefined;
      await syncCrmContactAndTagsBestEffort(ctx, {
        organizationId: normalizedOrgId,
        userId: String(userId),
        email: orderEmail || userEmail || "",
        name: typeof user?.name === "string" ? user.name : undefined,
        assignedBy,
        meta,
        source: "commerce.post_checkout_claim",
      });
    } catch (err) {
      console.error("[checkout] post-auth claim CRM sync failed (continuing)", err);
    }

    return { ok: true, orderId: normalizedOrderId, claimed: true };
  },
});

export const attachOrderToClerkUser = mutation({
  args: {
    organizationId: v.string(),
    orderId: v.string(),
    checkoutToken: v.string(),
    clerkUserId: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    coreUserId: v.string(),
    orderId: v.string(),
  }),
  handler: async (ctx, args) => {
    const organizationId = asString(args.organizationId).trim();
    const orderId = asString(args.orderId).trim();
    const checkoutToken = asString(args.checkoutToken).trim();
    const clerkUserId = asString(args.clerkUserId).trim();
    const email = asString(args.email).trim();
    const phone = asString(args.phone).trim() || undefined;
    const name = asString(args.name).trim() || undefined;

    if (!organizationId || !orderId || !checkoutToken || !clerkUserId || !email) {
      throw new Error("Missing required fields.");
    }

    const post = (await ctx.runQuery(commercePostsQueries.getPostById as any, {
      id: orderId,
      organizationId,
    }));
    if (!post) throw new Error("Order not found.");

    const meta = (await ctx.runQuery(commercePostsQueries.getPostMeta as any, {
      postId: post._id,
      organizationId,
    })) as { key: string; value: unknown }[];

    const tokenInOrder = readMetaValue(meta, ORDER_META_KEYS.checkoutToken);
    if (typeof tokenInOrder !== "string" || tokenInOrder.trim() !== checkoutToken) {
      throw new Error("Invalid checkout token.");
    }

    const assigned = readMetaValue(meta, "order.userId");
    if (typeof assigned === "string" && assigned.trim()) {
      // Already linked.
      return { ok: true, coreUserId: assigned.trim(), orderId };
    }

    // Upsert a core user record by Clerk id (pending until first real login).
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkUserId))
      .unique();

    let coreUserId: Id<"users">;
    if (existing) {
      coreUserId = existing._id;
      await ctx.db.patch(existing._id, {
        email,
        ...(name ? { name } : {}),
        ...(phone ? { phoneNumber: phone } : {}),
        ...(existing.status ? {} : { status: "pending" }),
        updatedAt: Date.now(),
      });
    } else {
      coreUserId = await ctx.db.insert("users", {
        clerkId: clerkUserId,
        tokenIdentifier: "",
        email,
        ...(name ? { name } : {}),
        ...(phone ? { phoneNumber: phone } : {}),
        role: "user",
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Link order → user (keep requiresAccessVerification true until they sign in).
    await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
      postId: orderId,
      key: "order.userId",
      value: String(coreUserId),
    });
    await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
      postId: orderId,
      key: "order:userId",
      value: String(coreUserId),
    });

    // Give tenant access in Convex now (idempotent).
    await grantCustomerAccess(ctx, {
      organizationId: organizationId as any,
      customerUserId: coreUserId,
      grantedBy: coreUserId,
      accessType: "product_purchase",
      sourceId: orderId,
    });

    // Best-effort: create CRM contact + assign marketing tags immediately after purchase,
    // so admins can see the contact/tags even before the user completes OTP/email sign-in.
    try {
      await syncCrmContactAndTagsBestEffort(ctx, {
        organizationId,
        userId: String(coreUserId),
        email,
        name,
        assignedBy: undefined,
        meta,
        source: "commerce.checkout",
      });
    } catch (err) {
      console.error("[attachOrderToClerkUser] CRM sync failed (continuing)", err);
    }

    return { ok: true, coreUserId: String(coreUserId), orderId };
  },
});
