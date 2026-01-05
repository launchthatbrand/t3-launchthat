/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { query } from "../../../_generated/server";

type CommerceCartQueries = { getCart: unknown };
const commerceCartQueries = (
  components as unknown as {
    launchthat_ecommerce: { cart: { queries: CommerceCartQueries } };
  }
).launchthat_ecommerce.cart.queries;

type CommercePostsQueries = { getPostMeta: unknown };
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

    const featuresByPostId: Record<string, string[]> = {};
    const getFeaturesForPostId = async (postId: string): Promise<string[]> => {
      if (postId in featuresByPostId) return featuresByPostId[postId] ?? [];
      const meta: unknown = await ctx.runQuery(commercePostsQueries.getPostMeta as any, {
        postId,
      });
      const rows = Array.isArray(meta)
        ? (meta as Array<{ key?: unknown; value?: unknown }>)
        : [];
      const raw = rows.find((r) => r?.key === "product.features")?.value;
      const parsed = safeParseStringArray(raw);
      featuresByPostId[postId] = parsed;
      return parsed;
    };

    const enriched: unknown[] = [];
    for (const item of items) {
      if (!item || typeof item !== "object") {
        enriched.push(item);
        continue;
      }
      const it = item as any;
      const postId = typeof it.productPostId === "string" ? it.productPostId : "";
      const product = it.product && typeof it.product === "object" ? it.product : null;
      if (!postId || !product) {
        enriched.push(item);
        continue;
      }
      const features = await getFeaturesForPostId(postId);
      enriched.push({
        ...it,
        product: {
          ...product,
          features,
        },
      });
    }

    return { ...(typed as any), items: enriched };
  },
});
