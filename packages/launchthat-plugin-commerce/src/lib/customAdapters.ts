"use client";

import type { Id } from "@convex-config/_generated/dataModel";

import {
  COMMERCE_BALANCE_POST_TYPE,
  COMMERCE_CHARGEBACK_POST_TYPE,
  COMMERCE_ORDER_POST_TYPE,
  COMMERCE_PRODUCT_POST_TYPE,
} from "../admin/adapters";

const COMMERCE_POST_TYPE_SLUGS = new Set<string>([
  COMMERCE_PRODUCT_POST_TYPE,
  COMMERCE_ORDER_POST_TYPE,
  COMMERCE_BALANCE_POST_TYPE,
  COMMERCE_CHARGEBACK_POST_TYPE,
]);

const COMMERCE_SYNTHETIC_PREFIX = "custom:";

const normalizeSlug = (slug?: string | null) => (slug ?? "").toLowerCase();

export const encodeCommerceSyntheticId = (
  slug: string,
  componentId: Id<"posts"> | string,
): Id<"posts"> =>
  `${COMMERCE_SYNTHETIC_PREFIX}${normalizeSlug(slug)}:${componentId}` as Id<"posts">;

export const decodeCommerceSyntheticId = (
  syntheticId?: Id<"posts"> | string | null,
): { slug: string; componentId: string } | null => {
  if (!syntheticId) return null;
  const raw = syntheticId as string;
  if (!raw.startsWith(COMMERCE_SYNTHETIC_PREFIX)) return null;
  const remainder = raw.slice(COMMERCE_SYNTHETIC_PREFIX.length);
  const [slug, ...rest] = remainder.split(":");
  if (!slug || rest.length === 0 || !COMMERCE_POST_TYPE_SLUGS.has(slug)) {
    return null;
  }
  const componentId = rest.join(":");
  return { slug, componentId };
};

export const ensureCommerceSyntheticId = (
  slug: string,
  value: Id<"posts"> | string,
): Id<"posts"> => {
  return decodeCommerceSyntheticId(value)
    ? (value as Id<"posts">)
    : encodeCommerceSyntheticId(slug, value);
};

