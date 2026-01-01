import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";

const DEFAULT_CHECKOUT_SLUG = "__default_checkout__";

const parsePredefinedProducts = (raw: unknown): string[] => {
  if (typeof raw !== "string" || raw.trim().length === 0) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is string => typeof v === "string" && v.trim().length > 0,
    );
  } catch {
    return [];
  }
};

const readMetaMap = async (
  ctx: any,
  postId: Id<"posts">,
): Promise<Record<string, unknown>> => {
  const rows = await ctx.db
    .query("postsMeta")
    .withIndex("by_post", (q: any) => q.eq("postId", postId))
    .collect();
  const map: Record<string, unknown> = {};
  rows.forEach((row: any) => {
    map[String(row.key)] = row.value;
  });
  return map;
};

export const getCheckoutConfigBySlug = query({
  args: {
    slug: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      postId: v.string(),
      slug: v.string(),
      title: v.optional(v.string()),
      design: v.string(),
      predefinedProductPostIds: v.array(v.string()),
      isDefault: v.boolean(),
    }),
  ),
  handler: async (ctx: any, args: any) => {
    const organizationId = args.organizationId ?? undefined;
    const slug = String(args.slug);

    const post = organizationId
      ? await ctx.db
          .query("posts")
          .withIndex("by_org_slug", (q: any) =>
            q.eq("organizationId", organizationId).eq("slug", slug),
          )
          .unique()
      : await ctx.db
          .query("posts")
          .withIndex("by_slug", (q: any) => q.eq("slug", slug))
          .filter((q: any) => q.eq(q.field("organizationId"), undefined))
          .unique();

    if (!post) return null;
    if (post.postTypeSlug !== "checkout") return null;

    const meta = await readMetaMap(ctx, post._id as Id<"posts">);
    const designRaw = meta["checkout.design"];
    const design = typeof designRaw === "string" && designRaw.trim() ? designRaw : "default";

    const isDefault = post.slug === DEFAULT_CHECKOUT_SLUG;
    const predefinedJson = meta["checkout.predefinedProductsJson"];
    const predefinedProductPostIds = isDefault
      ? []
      : parsePredefinedProducts(predefinedJson);

    return {
      postId: String(post._id),
      slug: String(post.slug ?? ""),
      title: typeof post.title === "string" ? post.title : undefined,
      design,
      predefinedProductPostIds,
      isDefault,
    };
  },
});

export const getCheckoutConfigById = query({
  args: {
    id: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      postId: v.string(),
      slug: v.string(),
      title: v.optional(v.string()),
      design: v.string(),
      predefinedProductPostIds: v.array(v.string()),
      isDefault: v.boolean(),
    }),
  ),
  handler: async (ctx: any, args: any) => {
    const post = await ctx.db.get(args.id as any);
    if (!post) return null;
    if (args.organizationId && post.organizationId !== args.organizationId) return null;
    if (post.postTypeSlug !== "checkout") return null;

    const meta = await readMetaMap(ctx, post._id as Id<"posts">);
    const designRaw = meta["checkout.design"];
    const design =
      typeof designRaw === "string" && designRaw.trim() ? designRaw : "default";

    const isDefault = post.slug === DEFAULT_CHECKOUT_SLUG;
    const predefinedJson = meta["checkout.predefinedProductsJson"];
    const predefinedProductPostIds = isDefault
      ? []
      : parsePredefinedProducts(predefinedJson);

    return {
      postId: String(post._id),
      slug: String(post.slug ?? ""),
      title: typeof post.title === "string" ? post.title : undefined,
      design,
      predefinedProductPostIds,
      isDefault,
    };
  },
});

export const getDefaultCheckoutConfig = query({
  args: {
    organizationId: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      postId: v.string(),
      slug: v.string(),
      title: v.optional(v.string()),
      design: v.string(),
      predefinedProductPostIds: v.array(v.string()),
      isDefault: v.boolean(),
    }),
  ),
  handler: async (ctx: any, args: any) => {
    return await ctx.runQuery(getCheckoutConfigBySlug as any, {
      slug: DEFAULT_CHECKOUT_SLUG,
      organizationId: args.organizationId,
    });
  },
});


