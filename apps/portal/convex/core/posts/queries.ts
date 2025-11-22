/**
 * Posts Queries
 *
 * This module provides query endpoints for posts.
 */
import { v } from "convex/values";

import type { Doc, Id } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";
import { query } from "../../_generated/server";
import {
  TEMPLATE_META_KEYS,
  TEMPLATE_POST_TYPE_SLUG,
  buildTemplatePageIdentifier,
  requiresTargetPostType,
  templateCategoryValidator,
  type TemplateCategory,
} from "./templates";
import { isAdmin } from "../../lib/permissions/hasPermission";

/**
 * Get all posts with optional filtering
 */
export const getAllPosts = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
    filters: v.optional(
      v.object({
        status: v.optional(
          v.union(
            v.literal("published"),
            v.literal("draft"),
            v.literal("archived"),
          ),
        ),
        category: v.optional(v.string()),
        authorId: v.optional(v.id("users")),
        limit: v.optional(v.number()),
        postTypeSlug: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const organizationId = args.organizationId ?? undefined;

    let queryBuilder;
    if (organizationId) {
      if (args.filters?.postTypeSlug) {
        queryBuilder = ctx.db
          .query("posts")
          .withIndex("by_organization_postTypeSlug", (q) =>
            q
              .eq("organizationId", organizationId)
              .eq("postTypeSlug", args.filters?.postTypeSlug ?? ""),
          );
      } else {
        queryBuilder = ctx.db
          .query("posts")
          .withIndex("by_organization", (q) =>
            q.eq("organizationId", organizationId),
          );
      }
    } else if (args.filters?.postTypeSlug) {
      queryBuilder = ctx.db
        .query("posts")
        .withIndex("by_postTypeSlug", (q) =>
          q.eq("postTypeSlug", args.filters?.postTypeSlug ?? ""),
        )
        .filter((q) => q.eq(q.field("organizationId"), undefined));
    } else {
      queryBuilder = ctx.db
        .query("posts")
        .filter((q) => q.eq(q.field("organizationId"), undefined));
    }

    if (args.filters?.status) {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field("status"), args.filters?.status),
      );
    }

    if (args.filters?.category) {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field("category"), args.filters?.category),
      );
    }

    if (args.filters?.authorId) {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field("authorId"), args.filters?.authorId),
      );
    }

    const posts = await queryBuilder
      .order("desc")
      .take(args.filters?.limit ?? 50);

    return posts;
  },
});

/**
 * Get a post by ID
 */
export const getPostById = query({
  args: {
    id: v.id("posts"),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) {
      return null;
    }

    const requestedOrg = args.organizationId ?? undefined;
    const postOrg = post.organizationId ?? undefined;
    if (requestedOrg !== postOrg) {
      return null;
    }

    return post;
  },
});

export const getPostMeta = query({
  args: {
    postId: v.id("posts"),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      return [];
    }
    const requestedOrg = args.organizationId ?? undefined;
    const postOrg = post.organizationId ?? undefined;
    if (requestedOrg !== postOrg) {
      return [];
    }

    return await ctx.db
      .query("postsMeta")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
  },
});

/**
 * Get a post by slug
 */
export const getPostBySlug = query({
  args: {
    slug: v.string(),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const requestedOrg = args.organizationId ?? undefined;

    const post = requestedOrg
      ? await ctx.db
          .query("posts")
          .withIndex("by_organization_slug", (q) =>
            q.eq("organizationId", requestedOrg).eq("slug", args.slug),
          )
          .unique()
      : await ctx.db
          .query("posts")
          .withIndex("by_slug", (q) => q.eq("slug", args.slug))
          .filter((q) => q.eq(q.field("organizationId"), undefined))
          .first();

    if (!post) {
      return null;
    }

    const status = (post.status ?? "published").toLowerCase();
    const isDraftOrArchived =
      status === "draft" || status === "archived" || status === "private";

    if (isDraftOrArchived) {
      const adminUser = await isAdmin(ctx);
      if (!adminUser) {
        return null;
      }
    }

    return post;
  },
});

/**
 * Search posts by content
 */
export const searchPosts = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const organizationId = args.organizationId ?? undefined;
    const posts = await ctx.db
      .query("posts")
      .filter((q) =>
        q.eq(q.field("organizationId"), organizationId ?? undefined),
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("title"), args.searchTerm),
          q.eq(q.field("content"), args.searchTerm),
        ),
      )
      .take(args.limit ?? 20);

    return posts;
  },
});

/**
 * Get all post tags
 */
export const getPostTags = query({
  args: { organizationId: v.optional(v.id("organizations")) },
  handler: async (ctx, args) => {
    const organizationId = args.organizationId ?? undefined;
    const posts = await ctx.db
      .query("posts")
      .filter((q) =>
        q.eq(q.field("organizationId"), organizationId ?? undefined),
      )
      .collect();
    const tagsSet = new Set<string>();

    posts.forEach((post) => {
      if (post.tags) {
        post.tags.forEach((tag) => tagsSet.add(tag));
      }
    });

    return Array.from(tagsSet).sort();
  },
});

/**
 * Get all post categories
 */
export const getPostCategories = query({
  args: { organizationId: v.optional(v.id("organizations")) },
  handler: async (ctx, _args) => {
    // TODO: Categories should be tenant-scoped; currently shared.
    const postCategories = await ctx.db
      .query("categories")
      .withIndex("by_postTypes", (q) => q.eq("postTypes", ["post"]))
      .collect();
    return postCategories;
  },
});

type TemplateMeta = {
  templateCategory: TemplateCategory;
  targetPostType: string | null;
  loopContext: unknown | null;
  pageIdentifier: string;
};

type TemplateRecord = Doc<"posts"> & TemplateMeta;

const loadTemplateMeta = async (
  ctx: QueryCtx,
  post: Doc<"posts">,
): Promise<TemplateMeta> => {
  const metaEntries = await ctx.db
    .query("postsMeta")
    .withIndex("by_post", (q) => q.eq("postId", post._id))
    .collect();

  const metaMap = new Map<string, string | number | boolean | null>();
  metaEntries.forEach((entry) => metaMap.set(entry.key, entry.value ?? null));

  const rawCategory = metaMap.get(TEMPLATE_META_KEYS.category);
  const category = (typeof rawCategory === "string"
    ? rawCategory
    : "single") as TemplateCategory;

  const targetPostTypeRaw = metaMap.get(TEMPLATE_META_KEYS.targetPostType);
  const targetPostType =
    typeof targetPostTypeRaw === "string" && targetPostTypeRaw.length > 0
      ? targetPostTypeRaw
      : null;

  const loopContextRaw = metaMap.get(TEMPLATE_META_KEYS.loopContext);
  let loopContext: unknown | null = null;
  if (typeof loopContextRaw === "string" && loopContextRaw.length > 0) {
    try {
      loopContext = JSON.parse(loopContextRaw);
    } catch {
      loopContext = loopContextRaw;
    }
  }

  const storedIdentifier = metaMap.get(TEMPLATE_META_KEYS.pageIdentifier);
  const pageIdentifier =
    typeof storedIdentifier === "string" && storedIdentifier.length > 0
      ? storedIdentifier
      : buildTemplatePageIdentifier({
          organizationId: post.organizationId ?? null,
          templateCategory: category,
          targetPostType,
          postId: post._id,
        });

  return {
    templateCategory: category,
    targetPostType,
    loopContext,
    pageIdentifier,
  };
};

const hydrateTemplateRecord = async (
  ctx: QueryCtx,
  post: Doc<"posts">,
) => {
  const meta = await loadTemplateMeta(ctx, post);
  const createdAt = post.createdAt ?? post._creationTime;
  const updatedAt = post.updatedAt ?? createdAt;

  return {
    ...post,
    ...meta,
    createdAt,
    updatedAt,
  } satisfies TemplateRecord;
};

const collectTemplatesForScope = async (
  ctx: QueryCtx,
  organizationId: Id<"organizations"> | null,
) => {
  if (organizationId) {
    return await ctx.db
      .query("posts")
      .withIndex("by_organization_postTypeSlug", (q) =>
        q.eq("organizationId", organizationId).eq(
          "postTypeSlug",
          TEMPLATE_POST_TYPE_SLUG,
        ),
      )
      .collect();
  }

  return await ctx.db
    .query("posts")
    .withIndex("by_postTypeSlug", (q) =>
      q.eq("postTypeSlug", TEMPLATE_POST_TYPE_SLUG),
    )
    .filter((q) => q.eq(q.field("organizationId"), undefined))
    .collect();
};

const findTemplateForScope = async (
  ctx: QueryCtx,
  opts: {
    organizationId: Id<"organizations"> | null;
    templateCategory: TemplateCategory;
    targetPostType: string | null;
  },
) => {
  const candidates = await collectTemplatesForScope(
    ctx,
    opts.organizationId,
  );

  for (const candidate of candidates) {
    const meta = await loadTemplateMeta(ctx, candidate);
    if (meta.templateCategory !== opts.templateCategory) {
      continue;
    }
    if (
      requiresTargetPostType(opts.templateCategory) &&
      meta.targetPostType !== opts.targetPostType
    ) {
      continue;
    }
    return candidate;
  }

  return null;
};

export const listTemplates = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const tenantId = args.organizationId ?? null;
    const tenantTemplates = tenantId
      ? await collectTemplatesForScope(ctx, tenantId)
      : [];
    const globalTemplates = await collectTemplatesForScope(ctx, null);

    const hydrated = await Promise.all(
      [...tenantTemplates, ...globalTemplates].map((post) =>
        hydrateTemplateRecord(ctx, post),
      ),
    );

    return hydrated.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getTemplateForPostType = query({
  args: {
    templateCategory: templateCategoryValidator,
    postTypeSlug: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const category = args.templateCategory as TemplateCategory;
    const targetPostType = args.postTypeSlug ?? null;

    if (requiresTargetPostType(category) && !targetPostType) {
      return null;
    }

    const tenantTemplate = args.organizationId
      ? await findTemplateForScope(ctx, {
          organizationId: args.organizationId,
          templateCategory: category,
          targetPostType,
        })
      : null;

    if (tenantTemplate) {
      return await hydrateTemplateRecord(ctx, tenantTemplate);
    }

    const globalTemplate = await findTemplateForScope(ctx, {
      organizationId: null,
      templateCategory: category,
      targetPostType,
    });

    if (!globalTemplate) {
      return null;
    }

    return await hydrateTemplateRecord(ctx, globalTemplate);
  },
});
