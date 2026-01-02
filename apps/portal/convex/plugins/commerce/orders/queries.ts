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
  userIdDot: "order.userId",
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

export const listMyOrders = query({
  args: {
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return [];
    }

    const userId = String(user._id);
    const email = typeof user.email === "string" ? user.email : "";
    const organizationId = args.organizationId;

    const idsByUserId = (await ctx.runQuery(
      (commercePostsQueries as any).listPostIdsByMetaKeyValue,
      {
        key: ORDER_META_KEYS.userId,
        value: userId,
        organizationId,
        postTypeSlug: "orders",
      },
    )) as string[];

    const idsByUserIdDot = (await ctx.runQuery(
      (commercePostsQueries as any).listPostIdsByMetaKeyValue,
      {
        key: ORDER_META_KEYS.userIdDot,
        value: userId,
        organizationId,
        postTypeSlug: "orders",
      },
    )) as string[];

    const idsByEmail = email
      ? ((await ctx.runQuery(
          (commercePostsQueries as any).listPostIdsByMetaKeyValue,
          {
            key: ORDER_META_KEYS.email,
            value: email,
            organizationId,
            postTypeSlug: "orders",
          },
        )) as string[])
      : [];

    const uniqueIds = Array.from(
      new Set([...(idsByUserId ?? []), ...(idsByUserIdDot ?? []), ...(idsByEmail ?? [])]),
    );

    const result: Array<any> = [];
    for (const id of uniqueIds) {
      const post = (await ctx.runQuery(commercePostsQueries.getPostById as any, {
        id,
        organizationId,
      })) as any | null;
      if (!post) continue;

      const meta = (await ctx.runQuery(commercePostsQueries.getPostMeta as any, {
        postId: post._id,
        organizationId,
      })) as Array<{ key: string; value: unknown }>;

      const total =
        (getMetaValue(meta, "order.orderTotal") as unknown) ??
        (getMetaValue(meta, "order:total") as unknown);
      const currency = getMetaValue(meta, "order.currency");
      const itemsJson = getMetaValue(meta, "order.itemsJson");

      const itemsCount =
        typeof itemsJson === "string"
          ? (() => {
              try {
                const parsed = JSON.parse(itemsJson) as unknown;
                return Array.isArray(parsed) ? parsed.length : undefined;
              } catch {
                return undefined;
              }
            })()
          : undefined;

      result.push({
        _id: post._id,
        _creationTime: post._creationTime,
        status: post.status ?? "draft",
        total: typeof total === "number" ? total : 0,
        currency: typeof currency === "string" && currency.trim() ? currency : "USD",
        email,
        itemsCount,
      });
    }

    return result.sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0));
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

export const getMyOrder = query({
  args: {
    orderId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return null;
    }

    const userId = String(user._id);
    const email = typeof user.email === "string" ? user.email : "";

    const post = (await ctx.runQuery(commercePostsQueries.getPostById as any, {
      id: args.orderId,
      organizationId: args.organizationId,
    })) as any | null;
    if (!post) return null;

    const meta = (await ctx.runQuery(commercePostsQueries.getPostMeta as any, {
      postId: post._id,
      organizationId: args.organizationId,
    })) as Array<{ key: string; value: unknown }>;

    const assignedLegacy = getMetaValue(meta, "order:userId");
    const assignedDot = getMetaValue(meta, "order.userId");
    const orderEmail = getMetaValue(meta, "order:email");

    const isMine =
      (typeof assignedLegacy === "string" && assignedLegacy === userId) ||
      (typeof assignedDot === "string" && assignedDot === userId) ||
      (typeof orderEmail === "string" && orderEmail && orderEmail === email);

    if (!isMine) {
      return null;
    }

    const total =
      (getMetaValue(meta, "order.orderTotal") as unknown) ??
      (getMetaValue(meta, "order:total") as unknown);
    const currency = getMetaValue(meta, "order.currency");
    const itemsJson =
      (getMetaValue(meta, "order.itemsJson") as unknown) ??
      (getMetaValue(meta, "order:itemsJson") as unknown);

    const items =
      typeof itemsJson === "string"
        ? (() => {
            try {
              const parsed = JSON.parse(itemsJson) as unknown;
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          })()
        : [];

    return {
      _id: post._id,
      _creationTime: post._creationTime,
      status: post.status ?? "draft",
      total: typeof total === "number" ? total : 0,
      currency: typeof currency === "string" && currency.trim() ? currency : "USD",
      items,
      email,
    };
  },
});



