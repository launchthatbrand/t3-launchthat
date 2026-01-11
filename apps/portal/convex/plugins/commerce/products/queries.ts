/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../_generated/api";
import { query } from "../../../_generated/server";

interface CommercePostsQueries {
  getAllPosts: unknown;
  getPostById: unknown;
  getPostMeta: unknown;
}

const commercePostsQueries = (
  components as unknown as {
    launchthat_ecommerce: { posts: { queries: CommercePostsQueries } };
  }
).launchthat_ecommerce.posts.queries;

function getMetaValue(
  meta: { key: string; value: unknown }[],
  key: string,
) {
  const row = meta.find((m) => m.key === key);
  return row?.value;
}

const asString = (value: unknown): string => (typeof value === "string" ? value : "");

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
    })) as any[];

    const result: any[] = [];
    for (const post of posts) {
      const meta = (await ctx.runQuery(
        commercePostsQueries.getPostMeta as any,
        {
          postId: post._id,
          organizationId: args.organizationId,
        },
      )) as { key: string; value: unknown }[];

      const productType = asString(getMetaValue(meta, "product.type")).toLowerCase();
      const regularPrice = getMetaValue(meta, "product.regularPrice");
      const salePrice = getMetaValue(meta, "product.salePrice");
      const subscriptionAmountMonthlyCents = getMetaValue(
        meta,
        "product.subscription.amountMonthly",
      );

      const pricingKind =
        productType === "simple_subscription" ? "subscription_monthly" : "one_time";

      const price =
        pricingKind === "subscription_monthly"
          ? typeof subscriptionAmountMonthlyCents === "number"
            ? subscriptionAmountMonthlyCents / 100
            : null
          : typeof salePrice === "number"
            ? salePrice
            : typeof regularPrice === "number"
              ? regularPrice
              : null;

      const priceText =
        typeof price === "number"
          ? pricingKind === "subscription_monthly"
            ? `$${price.toFixed(2)}/mo`
            : `$${price.toFixed(2)}`
          : null;

      const sku = getMetaValue(meta, "product.sku");
      const payload = getMetaValue(meta, "product.payload");

      result.push({
        post,
        meta,
        price: typeof price === "number" ? price : null,
        pricingKind,
        priceText,
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
    }));
    if (!post) return null;
    if ((post.postTypeSlug ?? "").toLowerCase() !== "products") return null;

    const meta = (await ctx.runQuery(commercePostsQueries.getPostMeta as any, {
      postId: post._id,
      organizationId: args.organizationId,
    })) as { key: string; value: unknown }[];

    const productType = asString(getMetaValue(meta, "product.type")).toLowerCase();
    const regularPrice = getMetaValue(meta, "product.regularPrice");
    const salePrice = getMetaValue(meta, "product.salePrice");
    const subscriptionAmountMonthlyCents = getMetaValue(
      meta,
      "product.subscription.amountMonthly",
    );

    const pricingKind =
      productType === "simple_subscription" ? "subscription_monthly" : "one_time";

    const price =
      pricingKind === "subscription_monthly"
        ? typeof subscriptionAmountMonthlyCents === "number"
          ? subscriptionAmountMonthlyCents / 100
          : null
        : typeof salePrice === "number"
          ? salePrice
          : typeof regularPrice === "number"
            ? regularPrice
            : null;

    const priceText =
      typeof price === "number"
        ? pricingKind === "subscription_monthly"
          ? `$${price.toFixed(2)}/mo`
          : `$${price.toFixed(2)}`
        : null;

    const sku = getMetaValue(meta, "product.sku");
    const payload = getMetaValue(meta, "product.payload");

    return {
      post,
      meta,
      price: typeof price === "number" ? price : null,
      pricingKind,
      priceText,
      sku: typeof sku === "string" ? sku : null,
      payload,
    };
  },
});













