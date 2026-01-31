import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import { components } from "../_generated/api";
import { requirePlatformAdmin } from "../traderlaunchpad/lib/resolve";

const ordersStatusValidator = v.optional(
  v.union(v.literal("unpaid"), v.literal("paid"), v.literal("failed")),
);
const productsStatusValidator = v.optional(
  v.union(v.literal("published"), v.literal("draft"), v.literal("archived")),
);
const orderStatusValidator = v.union(
  v.literal("unpaid"),
  v.literal("paid"),
  v.literal("failed"),
);
const productStatusValidator = v.union(
  v.literal("published"),
  v.literal("draft"),
  v.literal("archived"),
);
const metaValueValidator = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
);
const metaRecordValidator = v.record(v.string(), metaValueValidator);

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const listOrders = query({
  args: {
    organizationId: v.optional(v.string()),
    status: ordersStatusValidator,
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    return await ctx.runQuery(
      components.launchthat_ecommerce.posts.queries.getAllPosts,
      {
        organizationId: args.organizationId,
        filters: {
          postTypeSlug: "orders",
          status: args.status,
          limit: args.limit,
        },
      },
    );
  },
});

export const listProducts = query({
  args: {
    organizationId: v.optional(v.string()),
    status: productsStatusValidator,
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    return await ctx.runQuery(
      components.launchthat_ecommerce.posts.queries.getAllPosts,
      {
        organizationId: args.organizationId,
        filters: {
          postTypeSlug: "products",
          status: args.status,
          limit: args.limit,
        },
      },
    );
  },
});

export const getOrderById = query({
  args: {
    id: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const post = await ctx.runQuery(
      components.launchthat_ecommerce.posts.queries.getPostById,
      {
        id: args.id,
        organizationId: args.organizationId,
      },
    );
    if (!post || post.postTypeSlug !== "orders") return null;
    return post;
  },
});

export const getProductById = query({
  args: {
    id: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const post = await ctx.runQuery(
      components.launchthat_ecommerce.posts.queries.getPostById,
      {
        id: args.id,
        organizationId: args.organizationId,
      },
    );
    if (!post || post.postTypeSlug !== "products") return null;
    return post;
  },
});

export const getOrderMeta = query({
  args: {
    postId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    return await ctx.runQuery(
      components.launchthat_ecommerce.posts.queries.getPostMeta,
      {
        postId: args.postId,
        organizationId: args.organizationId,
      },
    );
  },
});

export const getProductMeta = query({
  args: {
    postId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    return await ctx.runQuery(
      components.launchthat_ecommerce.posts.queries.getPostMeta,
      {
        postId: args.postId,
        organizationId: args.organizationId,
      },
    );
  },
});

export const listDiscountCodes = query({
  args: { organizationId: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    return await ctx.runQuery(
      components.launchthat_ecommerce.discounts.queries.listDiscountCodes,
      { organizationId: args.organizationId },
    );
  },
});

export const createOrder = mutation({
  args: {
    organizationId: v.optional(v.string()),
    title: v.string(),
    status: orderStatusValidator,
    meta: v.optional(metaRecordValidator),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const now = Date.now();
    const title = args.title.trim();
    const slugBase = slugify(title) || "order";
    return await ctx.runMutation(
      components.launchthat_ecommerce.posts.mutations.createPost,
      {
        title,
        slug: `${slugBase}-${now.toString().slice(-6)}`,
        postTypeSlug: "orders",
        status: args.status,
        organizationId: args.organizationId,
        createdAt: now,
        updatedAt: now,
        meta: args.meta,
      },
    );
  },
});

export const createProduct = mutation({
  args: {
    organizationId: v.optional(v.string()),
    title: v.string(),
    status: productStatusValidator,
    meta: v.optional(metaRecordValidator),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const now = Date.now();
    const title = args.title.trim();
    const slugBase = slugify(title) || "product";
    return await ctx.runMutation(
      components.launchthat_ecommerce.posts.mutations.createPost,
      {
        title,
        slug: `${slugBase}-${now.toString().slice(-6)}`,
        postTypeSlug: "products",
        status: args.status,
        organizationId: args.organizationId,
        createdAt: now,
        updatedAt: now,
        meta: args.meta,
      },
    );
  },
});

export const updateOrder = mutation({
  args: {
    id: v.string(),
    organizationId: v.optional(v.string()),
    title: v.optional(v.string()),
    status: v.optional(orderStatusValidator),
    meta: v.optional(metaRecordValidator),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    return await ctx.runMutation(
      components.launchthat_ecommerce.posts.mutations.updatePost,
      {
        id: args.id,
        organizationId: args.organizationId,
        title: args.title,
        status: args.status,
        meta: args.meta,
      },
    );
  },
});

export const updateProduct = mutation({
  args: {
    id: v.string(),
    organizationId: v.optional(v.string()),
    title: v.optional(v.string()),
    status: v.optional(productStatusValidator),
    meta: v.optional(metaRecordValidator),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    return await ctx.runMutation(
      components.launchthat_ecommerce.posts.mutations.updatePost,
      {
        id: args.id,
        organizationId: args.organizationId,
        title: args.title,
        status: args.status,
        meta: args.meta,
      },
    );
  },
});

export const createDiscountCode = mutation({
  args: {
    organizationId: v.optional(v.string()),
    code: v.string(),
    kind: v.union(v.literal("percent"), v.literal("fixed")),
    amount: v.number(),
    active: v.optional(v.boolean()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    return await ctx.runMutation(
      components.launchthat_ecommerce.discounts.mutations.createDiscountCode,
      {
        organizationId: args.organizationId,
        code: args.code,
        kind: args.kind,
        amount: args.amount,
        active: args.active,
      },
    );
  },
});

export const updateDiscountCode = mutation({
  args: {
    id: v.string(),
    code: v.optional(v.string()),
    kind: v.optional(v.union(v.literal("percent"), v.literal("fixed"))),
    amount: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    await ctx.runMutation(
      components.launchthat_ecommerce.discounts.mutations.updateDiscountCode,
      {
        id: args.id,
        code: args.code,
        kind: args.kind,
        amount: args.amount,
        active: args.active,
      },
    );
    return null;
  },
});

export const deleteDiscountCode = mutation({
  args: { id: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    await ctx.runMutation(
      components.launchthat_ecommerce.discounts.mutations.deleteDiscountCode,
      { id: args.id },
    );
    return null;
  },
});
