/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { query } from "../../../_generated/server";

type CommercePostsQueries = {
  getAllPosts: unknown;
  getPostById: unknown;
  getPostMeta: unknown;
};

const commercePostsQueries = (
  components as unknown as {
    launchthat_ecommerce: { posts: { queries: CommercePostsQueries } };
  }
).launchthat_ecommerce.posts.queries;

function getMetaValue(
  meta: Array<{ key: string; value: unknown }>,
  key: string,
): unknown {
  return meta.find((m) => m.key === key)?.value;
}

const ORDER_META_KEYS = {
  payload: "order:payload",
  subtotal: "order:subtotal",
  shipping: "order:shipping",
  tax: "order:tax",
  total: "order:total",
  email: "order:email",
  userId: "order:userId",
} as const;

export const listOrders = query({
  args: {
    organizationId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const posts = (await ctx.runQuery(commercePostsQueries.getAllPosts as any, {
      organizationId: args.organizationId,
      filters: { postTypeSlug: "orders", limit: args.limit ?? 50 },
    })) as Array<any>;

    const result: Array<any> = [];
    for (const post of posts) {
      const meta = (await ctx.runQuery(commercePostsQueries.getPostMeta as any, {
        postId: post._id,
        organizationId: args.organizationId,
      })) as Array<{ key: string; value: unknown }>;

      const payload = getMetaValue(meta, ORDER_META_KEYS.payload);
      const total = getMetaValue(meta, ORDER_META_KEYS.total);
      const email = getMetaValue(meta, ORDER_META_KEYS.email);

      result.push({
        _id: post._id,
        _creationTime: post._creationTime,
        orderId: post.slug ?? post._id,
        status: post.status ?? "draft",
        paymentStatus: "unknown",
        total: typeof total === "number" ? total : 0,
        email: typeof email === "string" ? email : undefined,
        customerInfo:
          typeof payload === "string"
            ? (() => {
                try {
                  return JSON.parse(payload)?.customerInfo ?? {};
                } catch {
                  return {};
                }
              })()
            : {},
        payload,
        post,
        meta,
      });
    }

    return result;
  },
});

export const getOrder = query({
  args: {
    orderId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const post = (await ctx.runQuery(commercePostsQueries.getPostById as any, {
      id: args.orderId,
      organizationId: args.organizationId,
    })) as any | null;
    if (!post) return null;

    const meta = (await ctx.runQuery(commercePostsQueries.getPostMeta as any, {
      postId: post._id,
      organizationId: args.organizationId,
    })) as Array<{ key: string; value: unknown }>;

    const payload = getMetaValue(meta, ORDER_META_KEYS.payload);
    const total = getMetaValue(meta, ORDER_META_KEYS.total);
    const email = getMetaValue(meta, ORDER_META_KEYS.email);

    return {
      _id: post._id,
      _creationTime: post._creationTime,
      orderId: post.slug ?? post._id,
      status: post.status ?? "draft",
      paymentStatus: "unknown",
      total: typeof total === "number" ? total : 0,
      email: typeof email === "string" ? email : undefined,
      customerInfo:
        typeof payload === "string"
          ? (() => {
              try {
                return JSON.parse(payload)?.customerInfo ?? {};
              } catch {
                return {};
              }
            })()
          : {},
      payload,
      post,
      meta,
    };
  },
});


