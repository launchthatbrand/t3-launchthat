/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { query } from "../../../_generated/server";

interface CommercePostsQueries {
  getPostById: unknown;
  getPostMeta: unknown;
  listPostIdsByMetaKeyValue: unknown;
}

const commercePostsQueries = (
  components as unknown as {
    launchthat_ecommerce: { posts: { queries: CommercePostsQueries } };
  }
).launchthat_ecommerce.posts.queries;

const ORDER_META_KEYS = {
  subscriptionId: "order.subscriptionId",
  status: "order.status",
  totalAmount: "order.orderTotal",
  totalAmountLegacy: "order:total",
  currency: "order.currency",
} as const;

function getMetaValue(meta: { key: string; value: unknown }[], key: string): unknown {
  return meta.find((m) => m.key === key)?.value;
}

export const listOrdersForSubscription = query({
  args: {
    organizationId: v.string(),
    subscriptionId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      id: v.string(),
      createdAtMs: v.number(),
      status: v.string(),
      totalAmount: v.union(v.number(), v.null()),
      currency: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const organizationId = args.organizationId;
    const subscriptionId = args.subscriptionId.trim();
    if (!subscriptionId) return [];

    const ids = (await ctx.runQuery(
      commercePostsQueries.listPostIdsByMetaKeyValue as any,
      {
        key: ORDER_META_KEYS.subscriptionId,
        value: subscriptionId,
        organizationId,
        postTypeSlug: "orders",
        limit,
      },
    )) as string[];

    const out: Array<{
      id: string;
      createdAtMs: number;
      status: string;
      totalAmount: number | null;
      currency: string;
    }> = [];

    for (const id of ids ?? []) {
      const post = (await ctx.runQuery(commercePostsQueries.getPostById as any, {
        id,
        organizationId,
      })) as any;
      if (!post) continue;

      const meta = (await ctx.runQuery(commercePostsQueries.getPostMeta as any, {
        postId: post._id,
        organizationId,
      })) as { key: string; value: unknown }[];

      const statusRaw = getMetaValue(meta, ORDER_META_KEYS.status);
      const totalRaw =
        getMetaValue(meta, ORDER_META_KEYS.totalAmount) ??
        getMetaValue(meta, ORDER_META_KEYS.totalAmountLegacy);
      const currencyRaw = getMetaValue(meta, ORDER_META_KEYS.currency);

      const createdAtMs =
        typeof post.createdAt === "number" && Number.isFinite(post.createdAt)
          ? post.createdAt
          : typeof post._creationTime === "number"
            ? post._creationTime
            : Date.now();

      out.push({
        id: String(post._id),
        createdAtMs,
        status: typeof statusRaw === "string" && statusRaw.trim() ? statusRaw : "unknown",
        totalAmount: typeof totalRaw === "number" && Number.isFinite(totalRaw) ? totalRaw : null,
        currency:
          typeof currencyRaw === "string" && currencyRaw.trim()
            ? currencyRaw.trim()
            : "USD",
      });
    }

    return out.sort((a, b) => b.createdAtMs - a.createdAtMs).slice(0, limit);
  },
});


