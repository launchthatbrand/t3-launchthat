"use client";

import type { Doc, Id } from "@convex-config/_generated/dataModel";

export const COMMERCE_CHARGEBACK_POST_TYPE = "ecom-chargeback";
const CHARGEBACK_PREFIX = `custom:${COMMERCE_CHARGEBACK_POST_TYPE}:`;
export const COMMERCE_ORDER_POST_TYPE = "orders";
const ORDER_PREFIX = `custom:${COMMERCE_ORDER_POST_TYPE}:`;

export const isCommerceChargebackSlug = (slug?: string | null) =>
  (slug ?? "").toLowerCase() === COMMERCE_CHARGEBACK_POST_TYPE;
export const isCommerceOrderSlug = (slug?: string | null) =>
  (slug ?? "").toLowerCase() === COMMERCE_ORDER_POST_TYPE;

export const encodeChargebackPostId = (
  recordId: Id<"chargebacks"> | string,
): Id<"posts"> => `${CHARGEBACK_PREFIX}${recordId}` as unknown as Id<"posts">;

export const decodeChargebackPostId = (
  syntheticId?: Id<"posts"> | string | null,
): Id<"chargebacks"> | null => {
  if (!syntheticId) {
    return null;
  }
  const raw = syntheticId as unknown as string;
  if (!raw.startsWith(CHARGEBACK_PREFIX)) {
    return null;
  }
  return raw.slice(CHARGEBACK_PREFIX.length) as Id<"chargebacks">;
};

export const ensureChargebackSyntheticId = (
  value: Id<"posts"> | string,
): Id<"posts"> => {
  return decodeChargebackPostId(value)
    ? (value as Id<"posts">)
    : encodeChargebackPostId(value);
};

export const mapChargebackToPost = (
  record: Doc<"chargebacks">,
): Doc<"posts"> => {
  const syntheticId = encodeChargebackPostId(record._id);
  return {
    _id: syntheticId,
    _creationTime: record._creationTime,
    postTypeSlug: COMMERCE_CHARGEBACK_POST_TYPE,
    title: record.chargebackId ?? `Chargeback ${record._id}`,
    slug: record.chargebackId ?? (record._id as string),
    status: record.status === "won" ? "published" : "draft",
    content: record.internalNotes ?? "",
    excerpt: record.reasonDescription ?? "",
    createdAt: record.receivedDate,
    updatedAt:
      record.resolvedDate ?? record.chargebackDate ?? record.receivedDate,
    authorId: record.customerInfo.customerId ?? undefined,
    meta: {
      chargebackId: record.chargebackId,
      orderId: record.orderId,
      amount: record.amount,
      currency: record.currency,
      processorName: record.processorName,
      chargebackStatus: record.status,
    },
  } as Doc<"posts">;
};

export const encodeOrderPostId = (
  recordId: Id<"orders"> | string,
): Id<"posts"> => `${ORDER_PREFIX}${recordId}` as unknown as Id<"posts">;

export const decodeOrderPostId = (
  syntheticId?: Id<"posts"> | string | null,
): Id<"orders"> | null => {
  if (!syntheticId) {
    return null;
  }
  const raw = syntheticId as unknown as string;
  if (!raw.startsWith(ORDER_PREFIX)) {
    return null;
  }
  return raw.slice(ORDER_PREFIX.length) as Id<"orders">;
};

export const ensureOrderSyntheticId = (
  value: Id<"posts"> | string,
): Id<"posts"> => {
  return decodeOrderPostId(value)
    ? (value as Id<"posts">)
    : encodeOrderPostId(value);
};

export const mapOrderToPost = (record: Doc<"orders">): Doc<"posts"> => {
  const syntheticId = encodeOrderPostId(record._id);
  const customerName =
    `${record.customerInfo.firstName} ${record.customerInfo.lastName}`.trim();
  const summaryLines = [
    `Customer: ${customerName || "N/A"}`,
    `Email: ${record.email}`,
    `Status: ${record.status}`,
    `Payment: ${record.paymentStatus}`,
    `Total: ${record.total}`,
  ];

  return {
    _id: syntheticId,
    _creationTime: record._creationTime,
    postTypeSlug: COMMERCE_ORDER_POST_TYPE,
    title: `Order ${record.orderId}`,
    slug: record.orderId,
    status: record.status === "completed" ? "published" : "draft",
    content: summaryLines.join("\n"),
    excerpt: `${customerName || "Customer"} · ${record.email}`,
    authorId: record.userId ?? undefined,
    meta: {
      orderId: record.orderId,
      paymentStatus: record.paymentStatus,
      status: record.status,
      total: record.total,
      email: record.email,
    },
  } as Doc<"posts">;
};
