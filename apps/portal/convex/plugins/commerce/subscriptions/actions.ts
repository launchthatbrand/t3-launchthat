"use node";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { createHmac, timingSafeEqual } from "crypto";
import { v } from "convex/values";

import { api, components } from "../../../_generated/api";
import { action } from "../../../_generated/server";

interface CommercePostsQueries {
  findFirstPostIdByMetaKeyValue: unknown;
  getPostById: unknown;
  getPostMeta: unknown;
}
interface CommercePostsMutations {
  createPost: unknown;
  setPostMeta: unknown;
  updatePost: unknown;
}

const commercePostsQueries = (
  components as unknown as {
    launchthat_ecommerce: { posts: { queries: CommercePostsQueries } };
  }
).launchthat_ecommerce.posts.queries;
const commercePostsMutations = (
  components as unknown as {
    launchthat_ecommerce: { posts: { mutations: CommercePostsMutations } };
  }
).launchthat_ecommerce.posts.mutations;

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";
const asBoolean = (value: unknown): boolean => value === true;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const ORDER_META_KEYS = {
  subscriptionId: "order.subscriptionId",
  itemsJson: "order.itemsJson",
  itemsSubtotal: "order.itemsSubtotal",
  orderTotal: "order.orderTotal",
  currency: "order.currency",
  paymentMethodId: "order.paymentMethodId",
  paymentStatus: "order.paymentStatus",
  orderStatus: "order.status",
  gateway: "order.gateway",
  gatewayTransactionId: "order.gatewayTransactionId",
  customerEmail: "order.customerEmail",
} as const;

const SUB_META_KEYS = {
  authnetSubscriptionId: "subscription.authnet.subscriptionId",
  amountMonthlyCents: "subscription.amountMonthly",
  currency: "subscription.currency",
  customerEmail: "subscription.customerEmail",
  productId: "subscription.productId",
  lastOrderId: "subscription.lastOrderId",
  currentPeriodStart: "subscription.currentPeriodStart",
  currentPeriodEnd: "subscription.currentPeriodEnd",
} as const;

const AUTHNET_SETTINGS_KEY = "plugin.ecommerce.authorizenet.settings";

const pickSignatureKey = (value: unknown): string => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const v = value as Record<string, unknown>;
  return asString(v.signatureKey).trim();
};

const getMetaValue = (meta: { key: string; value: unknown }[], key: string): unknown =>
  meta.find((m) => m.key === key)?.value;

const toIsoDateUtc = (d: Date): string => {
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

const addDaysUtc = (d: Date, days: number): Date => {
  const next = new Date(d.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const computeWebhookSignature = (rawBody: string, signatureKey: string): string => {
  const keyIsHex = /^[0-9a-f]+$/i.test(signatureKey) && signatureKey.length % 2 === 0;
  const key = keyIsHex ? Buffer.from(signatureKey, "hex") : Buffer.from(signatureKey, "utf8");
  return createHmac("sha512", key).update(rawBody, "utf8").digest("hex");
};

const safeEqualHex = (aHex: string, bHex: string): boolean => {
  const a = Buffer.from(aHex, "hex");
  const b = Buffer.from(bHex, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};

export const processAuthnetWebhook = action({
  args: {
    // Required to pick the correct settings + signature key.
    organizationId: v.string(),
    // Raw request body (exact bytes as string, before JSON parsing).
    rawBody: v.string(),
    // `X-ANET-Signature` header value (expected `sha512=<hex>` or `<hex>`).
    signature: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.boolean(),
    createdOrderId: v.union(v.string(), v.null()),
    reason: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const option: any = await ctx.runQuery(api.core.options.get as any, {
      metaKey: AUTHNET_SETTINGS_KEY,
      type: "site",
      orgId: args.organizationId,
    });
    const signatureKey = pickSignatureKey(option?.metaValue);
    if (!signatureKey) {
      return {
        ok: false,
        createdOrderId: null,
        reason: "Authorize.Net signature key not configured for this organization",
      };
    }

    const signatureHeader = asString(args.signature).trim();
    if (!signatureHeader) {
      return { ok: false, createdOrderId: null, reason: "Missing signature" };
    }
    const providedHex = signatureHeader.toLowerCase().startsWith("sha512=")
      ? signatureHeader.slice("sha512=".length).trim()
      : signatureHeader.trim();
    if (!/^[0-9a-f]+$/i.test(providedHex)) {
      return { ok: false, createdOrderId: null, reason: "Invalid signature format" };
    }

    const expectedHex = computeWebhookSignature(args.rawBody, signatureKey);
    if (!safeEqualHex(expectedHex, providedHex)) {
      return { ok: false, createdOrderId: null, reason: "Invalid signature" };
    }

    // Parse body (JSON webhook or Silent Post form).
    let json: unknown = null;
    try {
      json = JSON.parse(args.rawBody) as unknown;
    } catch {
      json = null;
    }
    const form = new URLSearchParams(args.rawBody);

    const subscriptionAuthnetId =
      form.get("x_subscription_id")?.trim() ||
      asString(asRecord(json).subscriptionId).trim() ||
      asString(asRecord(asRecord(json).payload).subscriptionId).trim() ||
      asString(asRecord(asRecord(asRecord(json).payload).subscription).id).trim() ||
      asString(asRecord(asRecord(json).subscription).id).trim() ||
      asString(asRecord(asRecord(json).payload).id).trim();

    if (!subscriptionAuthnetId) {
      return { ok: true, createdOrderId: null, reason: "No subscription id found" };
    }

    // Silent Post: x_response_code === "1" means approved.
    const responseCode = (form.get("x_response_code") ?? "").trim();
    if (responseCode && responseCode !== "1") {
      return { ok: true, createdOrderId: null, reason: "Payment not approved" };
    }

    const transactionId =
      (form.get("x_trans_id") ?? "").trim() ||
      asString(asRecord(asRecord(json).payload).id).trim();
    const amountRaw = (form.get("x_amount") ?? "").trim();
    const amount = amountRaw ? Number(amountRaw) : null;
    const amountNumber = amount !== null && Number.isFinite(amount) ? amount : null;

    // Resolve local subscription postId by authnet subscription id meta.
    const subscriptionPostId = (await ctx.runQuery(
      commercePostsQueries.findFirstPostIdByMetaKeyValue as any,
      {
        key: SUB_META_KEYS.authnetSubscriptionId,
        value: subscriptionAuthnetId,
        organizationId: args.organizationId,
        postTypeSlug: "subscription",
      },
    )) as string | null;

    if (!subscriptionPostId) {
      return { ok: true, createdOrderId: null, reason: "No matching subscription" };
    }

    // Idempotency by gateway transaction id (if present).
    if (transactionId) {
      const existing = (await ctx.runQuery(
        commercePostsQueries.findFirstPostIdByMetaKeyValue as any,
        {
          key: ORDER_META_KEYS.gatewayTransactionId,
          value: transactionId,
          organizationId: args.organizationId,
          postTypeSlug: "orders",
        },
      )) as string | null;
      if (existing) {
        return { ok: true, createdOrderId: existing, reason: "Duplicate event" };
      }
    }

    const subMeta = (await ctx.runQuery(commercePostsQueries.getPostMeta as any, {
      postId: subscriptionPostId,
      organizationId: args.organizationId,
    })) as { key: string; value: unknown }[];

    const productId = asString(getMetaValue(subMeta, SUB_META_KEYS.productId)).trim();
    const customerEmail =
      asString(getMetaValue(subMeta, SUB_META_KEYS.customerEmail)).trim() || "";
    const currency =
      asString(getMetaValue(subMeta, SUB_META_KEYS.currency)).trim() || "USD";
    const amountMonthlyCentsRaw = getMetaValue(subMeta, SUB_META_KEYS.amountMonthlyCents);
    const amountMonthly =
      typeof amountMonthlyCentsRaw === "number" && Number.isFinite(amountMonthlyCentsRaw)
        ? Math.max(0, amountMonthlyCentsRaw) / 100
        : 0;

    const orderAmount = amountNumber ?? amountMonthly;
    if (orderAmount <= 0) {
      return { ok: true, createdOrderId: null, reason: "Invalid amount" };
    }

    const now = Date.now();
    const orderId = (await ctx.runMutation(commercePostsMutations.createPost as any, {
      organizationId: args.organizationId,
      postTypeSlug: "orders",
      title: `Subscription order ${now}`,
      slug: `sub-order-${now}`,
      content: "",
      excerpt: "",
      status: "paid",
      createdAt: now,
    })) as string;

    const itemsJson = JSON.stringify([
      {
        productId: productId || "subscription",
        title: "Subscription renewal",
        unitPrice: orderAmount,
        quantity: 1,
      },
    ]);

    const metaEntries: Array<{ key: string; value: string | number | boolean | null }> = [
      { key: ORDER_META_KEYS.subscriptionId, value: subscriptionPostId },
      { key: ORDER_META_KEYS.itemsJson, value: itemsJson },
      { key: ORDER_META_KEYS.itemsSubtotal, value: orderAmount },
      { key: ORDER_META_KEYS.orderTotal, value: orderAmount },
      { key: ORDER_META_KEYS.currency, value: currency },
      { key: ORDER_META_KEYS.paymentMethodId, value: "authorizenet" },
      { key: ORDER_META_KEYS.gateway, value: "authorizenet" },
      { key: ORDER_META_KEYS.paymentStatus, value: "paid" },
      { key: ORDER_META_KEYS.orderStatus, value: "processing" },
      { key: ORDER_META_KEYS.customerEmail, value: customerEmail || null },
    ];
    if (transactionId) {
      metaEntries.push({ key: ORDER_META_KEYS.gatewayTransactionId, value: transactionId });
    }

    for (const entry of metaEntries) {
      await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
        postId: orderId,
        key: entry.key,
        value: entry.value,
      });
    }

    // Update subscription bookkeeping.
    await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
      postId: subscriptionPostId,
      key: SUB_META_KEYS.lastOrderId,
      value: orderId,
    });
    await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
      postId: subscriptionPostId,
      key: SUB_META_KEYS.currentPeriodStart,
      value: now,
    });
    await ctx.runMutation(commercePostsMutations.setPostMeta as any, {
      postId: subscriptionPostId,
      key: SUB_META_KEYS.currentPeriodEnd,
      value: addDaysUtc(new Date(), 30).getTime(),
    });

    return { ok: true, createdOrderId: orderId, reason: null };
  },
});


