/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { query } from "../../../_generated/server";

interface CommerceCartQueries { getCart: unknown }
const commerceCartQueries = (
  components as unknown as {
    launchthat_ecommerce: { cart: { queries: CommerceCartQueries } };
  }
).launchthat_ecommerce.cart.queries;

interface CommercePostsQueries { getPostMeta: unknown }
const commercePostsQueries = (
  components as unknown as {
    launchthat_ecommerce: { posts: { queries: CommercePostsQueries } };
  }
).launchthat_ecommerce.posts.queries;

const safeParseStringArray = (value: unknown): string[] => {
  if (typeof value !== "string") return [];
  const raw = value.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v) => (typeof v === "string" ? v : ""))
      .map((v) => v.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
};

const safeParseBoolean = (value: unknown): boolean =>
  value === true || value === "true" || value === 1 || value === "1";

interface AttachmentMetaEntry {
  mediaItemId?: string;
  url?: string;
  mimeType?: string;
  title?: string;
}

const resolvePrimaryImageUrlFromAttachmentsMeta = (
  attachmentsMetaValue: unknown,
): string | null => {
  const raw =
    typeof attachmentsMetaValue === "string" ? attachmentsMetaValue.trim() : "";
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const entry = item as AttachmentMetaEntry;

      const url = typeof entry.url === "string" ? entry.url.trim() : "";
      const mimeType = typeof entry.mimeType === "string" ? entry.mimeType : "";
      const mediaItemId =
        typeof entry.mediaItemId === "string" ? entry.mediaItemId : "";

      const looksLikeImageUrl =
        /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i.test(url) ||
        url.includes("vimeocdn.com");

      if (mimeType.startsWith("image/") || looksLikeImageUrl) {
        if (/^https?:\/\//i.test(url)) return url;
        if (mediaItemId) return `/api/media/${mediaItemId}`;
        if (url) return url;
      }
    }

    const first = parsed[0];
    if (first && typeof first === "object") {
      const entry = first as AttachmentMetaEntry;
      const url = typeof entry.url === "string" ? entry.url.trim() : "";
      const mediaItemId =
        typeof entry.mediaItemId === "string" ? entry.mediaItemId : "";
      if (/^https?:\/\//i.test(url)) return url;
      if (mediaItemId) return `/api/media/${mediaItemId}`;
      if (url) return url;
    }
  } catch {
    // ignore
  }

  return null;
};

export const getCart = query({
  args: {
    userId: v.optional(v.string()),
    guestSessionId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const result: unknown = await ctx.runQuery(
      commerceCartQueries.getCart as any,
      args,
    );

    // Enrich with product.features so checkout order summary can render them.
    // (This keeps portal behavior stable even if the component cart query changes.)
    if (!result || typeof result !== "object") return result;
    const typed = result as { items?: unknown[] };
    const items = Array.isArray(typed.items) ? typed.items : [];
    if (items.length === 0) return result;

    const enrichByPostId: Record<
      string,
      {
        features: string[];
        featuredImageUrl: string | null;
        requiresAccount: boolean;
        crmMarketingTagIds: string[];
      }
    > = {};
    const getEnrichmentForPostId = async (
      postId: string,
    ): Promise<{
      features: string[];
      featuredImageUrl: string | null;
      requiresAccount: boolean;
      crmMarketingTagIds: string[];
    }> => {
      if (postId in enrichByPostId) {
        return (
          enrichByPostId[postId] ?? {
            features: [],
            featuredImageUrl: null,
            requiresAccount: false,
            crmMarketingTagIds: [],
          }
        );
      }
      const meta: unknown = await ctx.runQuery(
        commercePostsQueries.getPostMeta as any,
        {
          postId,
        },
      );
      const rows = Array.isArray(meta)
        ? (meta as { key?: unknown; value?: unknown }[])
        : [];
      const rawFeatures = rows.find(
        (r) => r.key === "product.features",
      )?.value;
      const parsedFeatures = safeParseStringArray(rawFeatures);

      const rawRequireAccount = rows.find(
        (r) => r.key === "product.requireAccount",
      )?.value;

      const rawCrmMarketingTagIds = rows.find(
        (r) => r.key === "crm.marketingTagIdsJson",
      )?.value;
      const parsedCrmMarketingTagIds = safeParseStringArray(rawCrmMarketingTagIds);

      const rawAttachments = rows.find(
        (r) => r.key === "__core_attachments",
      )?.value;
      const featuredImageUrl =
        resolvePrimaryImageUrlFromAttachmentsMeta(rawAttachments);

      const result = {
        features: parsedFeatures,
        featuredImageUrl,
        requiresAccount: safeParseBoolean(rawRequireAccount),
        crmMarketingTagIds: parsedCrmMarketingTagIds,
      };
      enrichByPostId[postId] = result;
      return result;
    };

    const enriched: unknown[] = [];
    for (const item of items) {
      if (!item || typeof item !== "object") {
        enriched.push(item);
        continue;
      }
      const it = item as any;
      const postId =
        typeof it.productPostId === "string" ? it.productPostId : "";
      const product =
        it.product && typeof it.product === "object" ? it.product : null;
      if (!postId || !product) {
        enriched.push(item);
        continue;
      }
      const enrichment = await getEnrichmentForPostId(postId);
      const existingFeatured =
        typeof product.featuredImageUrl === "string" &&
        product.featuredImageUrl.trim()
          ? product.featuredImageUrl.trim()
          : null;
      enriched.push({
        ...it,
        product: {
          ...product,
          features: enrichment.features,
          requiresAccount: enrichment.requiresAccount,
          crmMarketingTagIds: enrichment.crmMarketingTagIds,
          ...(existingFeatured
            ? {}
            : enrichment.featuredImageUrl
              ? { featuredImageUrl: enrichment.featuredImageUrl }
              : {}),
        },
      });
    }

    return { ...(typed as any), items: enriched };
  },
});
