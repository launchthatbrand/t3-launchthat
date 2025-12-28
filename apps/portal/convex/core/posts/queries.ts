/**
 * Posts Queries
 *
 * This module provides query endpoints for posts.
 */
import { v } from "convex/values";

import type { Doc, Id } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";
import type { TemplateCategory } from "./templates";
import { api } from "../../_generated/api";
import { query } from "../../_generated/server";
import { isAdmin } from "../../lib/permissions/hasPermission";
import { getScopedPostTypeBySlug } from "../postTypes/lib/contentTypes";
import {
  buildTemplatePageIdentifier,
  requiresTargetPostType,
  TEMPLATE_META_KEYS,
  TEMPLATE_POST_TYPE_SLUG,
  templateCategoryValidator,
} from "./templates";

/**
 * Get all posts with optional filtering
 */
export const getAllPosts = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
    filters: v.optional(
      v.object({
        status: v.optional(v.string()),
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
interface HelpdeskArticle {
  _id: Id<"posts">;
  _creationTime: number;
  organizationId: Id<"organizations">;
  title: string;
  content?: string;
  excerpt?: string;
  slug: string;
  status: "draft" | "published" | "archived";
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  postTypeSlug: string;
}

export const getPostById = query({
  args: {
    id: v.string(),
    organizationId: v.optional(v.id("organizations")),
    postTypeSlug: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (
    ctx,
    args,
  ): Promise<Doc<"posts"> | HelpdeskArticle | null> => {
    const requestedOrg = args.organizationId ?? undefined;
    const postTypeSlug = args.postTypeSlug ?? undefined;

    const postType: Doc<"postTypes"> | null = postTypeSlug
      ? await getScopedPostTypeBySlug(ctx, postTypeSlug, requestedOrg)
      : null;
    const storageKind = postType?.storageKind;
    const storageTables = postType?.storageTables ?? [];
    const isSupportComponent =
      storageKind === "component" &&
      storageTables.some((table) => table.includes("launchthat_support:posts"));

    if (isSupportComponent) {
      if (!requestedOrg) {
        return null;
      }
      const record = await ctx.runQuery(
        api.plugins.support.queries.getSupportPostById,
        {
          id: args.id as Id<"posts">,
          organizationId: requestedOrg as Id<"organizations">,
        },
      );
      return record
        ? {
            ...record,
            _id: args.id as Id<"posts">,
            postTypeSlug: record.postTypeSlug ?? postTypeSlug ?? "",
            organizationId: requestedOrg,
          }
        : null;
    }

    const postId = args.id as Id<"posts">;
    const post = await ctx.db.get(postId);
    if (!post) {
      return null;
    }

    const postOrg = post.organizationId ?? undefined;
    if (requestedOrg !== postOrg) {
      return null;
    }

    return post;
  },
});

export const getPostMeta = query({
  args: {
    postId: v.string(),
    organizationId: v.optional(v.id("organizations")),
    postTypeSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const requestedOrg = args.organizationId ?? undefined;

    // Support synthetic IDs for custom-table-backed post types.
    // Format: `custom:{postTypeSlug}:{rawId}`
    const rawPostId = args.postId;
    const isSynthetic = rawPostId.startsWith("custom:");
    const syntheticParts = isSynthetic ? rawPostId.split(":") : null;
    const syntheticPostTypeSlug =
      syntheticParts && syntheticParts.length >= 3
        ? syntheticParts[1]?.toLowerCase()
        : undefined;
    const syntheticRawId =
      syntheticParts && syntheticParts.length >= 3
        ? syntheticParts.slice(2).join(":")
        : undefined;

    const resolvedPostTypeSlug =
      (args.postTypeSlug ?? syntheticPostTypeSlug)?.toLowerCase() ?? undefined;

    // Route custom-table meta first (so we don't attempt `ctx.db.get` with a non-Id).
    if (isSynthetic && resolvedPostTypeSlug && syntheticRawId && requestedOrg) {
      if (resolvedPostTypeSlug === "downloads" || resolvedPostTypeSlug === "download") {
        const downloadId = syntheticRawId as Id<"downloads">;
        const download = await ctx.db.get(downloadId);
        if (!download || download.organizationId !== requestedOrg) {
          return [];
        }
        const meta = await ctx.db
          .query("downloadsMeta")
          .withIndex("by_org_and_download", (q) =>
            q.eq("organizationId", requestedOrg).eq("downloadId", downloadId),
          )
          .collect();

        // Adapt to postsMeta-like entries (client only relies on `key`/`value`).
        return meta.map((entry) => ({
          _id: `custom:meta:downloads:${entry._id}` as unknown as Id<"postsMeta">,
          _creationTime: entry._creationTime,
          postId: rawPostId as unknown as Id<"posts">,
          key: entry.key,
          value: entry.value,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        }));
      }

      if (
        resolvedPostTypeSlug === "attachments" ||
        resolvedPostTypeSlug === "attachment"
      ) {
        const mediaItemId = syntheticRawId as Id<"mediaItems">;
        const mediaItem = await ctx.db.get(mediaItemId);
        if (!mediaItem) {
          return [];
        }
        const meta = await ctx.db
          .query("mediaItemsMeta")
          .withIndex("by_org_and_mediaItem", (q) =>
            q
              .eq("organizationId", requestedOrg)
              .eq("mediaItemId", mediaItemId),
          )
          .collect();

        return meta.map((entry) => ({
          _id: `custom:meta:mediaItems:${entry._id}` as unknown as Id<"postsMeta">,
          _creationTime: entry._creationTime,
          postId: rawPostId as unknown as Id<"posts">,
          key: entry.key,
          value: entry.value,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        }));
      }
    }

    const postId = rawPostId as Id<"posts">;
    const postType: Doc<"postTypes"> | null = args.postTypeSlug
      ? await getScopedPostTypeBySlug(ctx, args.postTypeSlug, requestedOrg)
      : null;
    const storageKind = postType?.storageKind;
    const storageTables = postType?.storageTables ?? [];
    const isSupportComponent =
      storageKind === "component" &&
      storageTables.some((table) => table.includes("launchthat_support:posts"));

    if (isSupportComponent) {
      const meta = await ctx.runQuery(
        api.plugins.support.queries.getSupportPostMeta,
        {
          postId,
          organizationId: requestedOrg as Id<"organizations"> | undefined,
        },
      );
      return meta as {
        _id: Id<"postsMeta">;
        _creationTime: number;
        postId: Id<"posts">;
        key: string;
        value: string | number | boolean | null | undefined;
        createdAt: number;
        updatedAt?: number;
      }[];
    }

    const post = await ctx.db.get(postId);
    if (!post) {
      return [];
    }
    const postOrg = post.organizationId ?? undefined;
    if (requestedOrg !== postOrg) {
      return [];
    }

    return await ctx.db
      .query("postsMeta")
      .withIndex("by_post", (q) => q.eq("postId", postId))
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

interface TemplateMeta {
  templateCategory: TemplateCategory;
  targetPostType: string | null;
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  loopContext: unknown | null;
  pageIdentifier: string;
  puckData: string | null;
}

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
  const category = (
    typeof rawCategory === "string" ? rawCategory : "single"
  ) as TemplateCategory;

  const targetPostTypeRaw = metaMap.get(TEMPLATE_META_KEYS.targetPostType);
  const targetPostType =
    typeof targetPostTypeRaw === "string" && targetPostTypeRaw.length > 0
      ? targetPostTypeRaw
      : null;

  const loopContextRaw = metaMap.get(TEMPLATE_META_KEYS.loopContext);
  let loopContext: unknown = null;
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

  const puckDataRaw = metaMap.get("puck_data");
  const puckData =
    typeof puckDataRaw === "string" && puckDataRaw.length > 0
      ? puckDataRaw
      : null;

  return {
    templateCategory: category,
    targetPostType,
    loopContext,
    pageIdentifier,
    puckData,
  };
};

const hydrateTemplateRecord = async (ctx: QueryCtx, post: Doc<"posts">) => {
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
        q
          .eq("organizationId", organizationId)
          .eq("postTypeSlug", TEMPLATE_POST_TYPE_SLUG),
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
  const candidates = await collectTemplatesForScope(ctx, opts.organizationId);

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
