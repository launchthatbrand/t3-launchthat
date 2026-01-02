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
) {
  const row = meta.find((m) => m.key === key);
  return row?.value;
}

export const listProducts = query({
  args: {
    organizationId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const posts = (await ctx.runQuery(commercePostsQueries.getAllPosts as any, {
      organizationId: args.organizationId,
      filters: {
        postTypeSlug: "products",
        limit: args.limit ?? 50,
      },
    })) as Array<any>;

    const result: Array<any> = [];
    for (const post of posts) {
      const meta = (await ctx.runQuery(
        commercePostsQueries.getPostMeta as any,
        {
          postId: post._id,
          organizationId: args.organizationId,
        },
      )) as Array<{ key: string; value: unknown }>;

      const price = getMetaValue(meta, "product:price");
      const sku = getMetaValue(meta, "product:sku");
      const payload = getMetaValue(meta, "product:payload");

      result.push({
        post,
        meta,
        price: typeof price === "number" ? price : null,
        sku: typeof sku === "string" ? sku : null,
        payload,
      });
    }

    return result;
  },
});

export const getProductById = query({
  args: {
    postId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    const post = (await ctx.runQuery(commercePostsQueries.getPostById as any, {
      id: args.postId,
      organizationId: args.organizationId,
    })) as any | null;
    if (!post) return null;
    if ((post.postTypeSlug ?? "").toLowerCase() !== "products") return null;

    const meta = (await ctx.runQuery(commercePostsQueries.getPostMeta as any, {
      postId: post._id,
      organizationId: args.organizationId,
    })) as Array<{ key: string; value: unknown }>;

    const price = getMetaValue(meta, "product:price");
    const sku = getMetaValue(meta, "product:sku");
    const payload = getMetaValue(meta, "product:payload");

    return {
      post,
      meta,
      price: typeof price === "number" ? price : null,
      sku: typeof sku === "string" ? sku : null,
      payload,
    };
  },
});


