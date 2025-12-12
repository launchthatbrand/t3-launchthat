import {
  COMMERCE_CHARGEBACK_POST_TYPE,
  COMMERCE_ORDER_POST_TYPE,
  ensureChargebackSyntheticId,
  ensureOrderSyntheticId,
} from "launchthat-plugin-commerce/admin/adapters";
import type {
  Doc as CommerceComponentDoc,
  Id as CommerceComponentId,
} from "../../../../../packages/convex/component/_generated/dataModel";
import type {
  Id as PortalId,
  Doc as PortalPost,
} from "@/convex/_generated/dataModel";

export * from "launchthat-plugin-commerce/admin/adapters";

const COMMERCE_POST_TYPE_SLUGS = new Set<string>([
  "products",
  "orders",
  "plans",
  "ecom-coupon",
  "ecom-chargeback",
  "ecom-balance",
  "ecom-transfer",
  "ecom-chargeback-evidence",
]);

const COMMERCE_SYNTHETIC_PREFIX = "custom:";

export type CommerceComponentPostId = CommerceComponentId<"posts">;
export type CommerceComponentPost = CommerceComponentDoc<"posts">;
export type CommerceComponentPostMeta = CommerceComponentDoc<"postsMeta">;

export const isCommercePostSlug = (slug?: string | null) => {
  if (!slug) {
    return false;
  }
  return COMMERCE_POST_TYPE_SLUGS.has(slug.toLowerCase());
};

const normalizeCommerceSlug = (slug?: string | null) =>
  (slug ?? "").toLowerCase();

export const encodeCommerceSyntheticId = (
  slug: string,
  componentId: CommerceComponentPostId | string,
): PortalId<"posts"> =>
  `${COMMERCE_SYNTHETIC_PREFIX}${normalizeCommerceSlug(slug)}:${componentId}` as PortalId<"posts">;

export const decodeCommerceSyntheticId = (
  syntheticId?: PortalId<"posts"> | string | null,
): { slug: string; componentId: CommerceComponentPostId } | null => {
  if (!syntheticId) {
    return null;
  }
  const raw = syntheticId as string;
  if (!raw.startsWith(COMMERCE_SYNTHETIC_PREFIX)) {
    return null;
  }
  const remainder = raw.slice(COMMERCE_SYNTHETIC_PREFIX.length);
  const [slug, ...rest] = remainder.split(":");
  if (!slug || rest.length === 0 || !isCommercePostSlug(slug)) {
    return null;
  }
  const componentId = rest.join(":") as CommerceComponentPostId;
  return { slug, componentId };
};

export const ensureCommerceSyntheticId = (
  slug: string,
  value: PortalId<"posts"> | string,
): PortalId<"posts"> => {
  return decodeCommerceSyntheticId(value)
    ? (value as PortalId<"posts">)
    : encodeCommerceSyntheticId(slug, value);
};

export const adaptCommercePostToPortal = (
  record: CommerceComponentPost,
): PortalPost<"posts"> => {
  const syntheticId = encodeCommerceSyntheticId(
    record.postTypeSlug,
    record._id,
  );
  return {
    _id: syntheticId,
    _creationTime: record._creationTime,
    title: record.title,
    content: record.content,
    excerpt: record.excerpt,
    slug: record.slug,
    status: record.status,
    category: record.category,
    tags: record.tags,
    featuredImageUrl: record.featuredImageUrl,
    postTypeSlug: record.postTypeSlug,
    organizationId: record.organizationId
      ? (record.organizationId as PortalId<"organizations">)
      : undefined,
    authorId: record.authorId
      ? (record.authorId as PortalId<"users">)
      : undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  } as PortalPost<"posts">;
};

export const adaptCommercePostMetaToPortal = (
  record: CommerceComponentPostMeta,
  slug: string,
): PortalPost<"postsMeta"> => {
  const syntheticPostId = encodeCommerceSyntheticId(slug, record.postId);
  return {
    _id: `${COMMERCE_SYNTHETIC_PREFIX}meta:${record._id}` as PortalId<"postsMeta">,
    _creationTime: record._creationTime,
    postId: syntheticPostId,
    key: record.key,
    value: record.value ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  } as PortalPost<"postsMeta">;
};

export const decodeAnyCommercePostId = (
  syntheticId?: PortalId<"posts"> | string | null,
) => {
  const decoded = decodeCommerceSyntheticId(syntheticId);
  if (decoded) {
    return decoded;
  }
  if (syntheticId && typeof syntheticId === "string") {
    const raw = syntheticId.toLowerCase();
    if (raw.startsWith(`custom:${COMMERCE_CHARGEBACK_POST_TYPE}:`)) {
      return {
        slug: COMMERCE_CHARGEBACK_POST_TYPE,
        componentId: syntheticId.slice(
          `custom:${COMMERCE_CHARGEBACK_POST_TYPE}:`.length,
        ) as CommerceComponentPostId,
      };
    }
    if (raw.startsWith(`custom:${COMMERCE_ORDER_POST_TYPE}:`)) {
      return {
        slug: COMMERCE_ORDER_POST_TYPE,
        componentId: syntheticId.slice(
          `custom:${COMMERCE_ORDER_POST_TYPE}:`.length,
        ) as CommerceComponentPostId,
      };
    }
  }
  return null;
};

export const normalizeCommercePostId = (
  slug: string,
  postId?: PortalId<"posts"> | string | null,
) => {
  if (!postId) {
    return undefined;
  }
  if (slug === COMMERCE_CHARGEBACK_POST_TYPE) {
    return ensureChargebackSyntheticId(postId);
  }
  if (slug === COMMERCE_ORDER_POST_TYPE) {
    return ensureOrderSyntheticId(postId);
  }
  return ensureCommerceSyntheticId(slug, postId);
};
