import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";

const DEFAULT_FUNNEL_SLUG = "__default_funnel__";

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

const mapFunnel = async (ctx: any, post: any) => {
  const meta = await readMetaMap(ctx, post._id as Id<"posts">);
  return {
    id: String(post._id),
    slug: String(post.slug ?? ""),
    title: typeof post.title === "string" ? post.title : undefined,
    isDefault: Boolean(meta["funnel.isDefault"]) || post.slug === DEFAULT_FUNNEL_SLUG,
  };
};

export const getDefaultFunnel = query({
  args: {
    organizationId: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      id: v.string(),
      slug: v.string(),
      title: v.optional(v.string()),
      isDefault: v.boolean(),
    }),
  ),
  handler: async (ctx: any, args: any) => {
    const organizationId = args.organizationId ?? undefined;
    const post = organizationId
      ? await ctx.db
          .query("posts")
          .withIndex("by_org_slug", (q: any) =>
            q.eq("organizationId", organizationId).eq("slug", DEFAULT_FUNNEL_SLUG),
          )
          .unique()
      : await ctx.db
          .query("posts")
          .withIndex("by_slug", (q: any) => q.eq("slug", DEFAULT_FUNNEL_SLUG))
          .filter((q: any) => q.eq(q.field("organizationId"), undefined))
          .unique();

    if (!post) return null;
    if (post.postTypeSlug !== "funnels") return null;
    return await mapFunnel(ctx, post);
  },
});

export const getFunnelBySlug = query({
  args: {
    slug: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      id: v.string(),
      slug: v.string(),
      title: v.optional(v.string()),
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
    if (post.postTypeSlug !== "funnels") return null;
    return await mapFunnel(ctx, post);
  },
});


