/* eslint-disable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-definitions */
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import type {
  EntityFiltersInput,
  EntityRecord,
  EntitySaveInput,
  EntityStatus,
} from "./types";
import { api } from "../../_generated/api";
import { getScopedPostTypeBySlug } from "../../core/postTypes/lib/contentTypes";

const COMMERCE_SLUGS = new Set<string>([
  "products",
  "orders",
  "plans",
  "ecom-coupon",
  "ecom-chargeback",
  "ecom-balance",
  "ecom-transfer",
  "ecom-chargeback-evidence",
]);

const LMS_SLUGS = new Set<string>([
  "courses",
  "lessons",
  "topics",
  "quizzes",
  "certificates",
  "lms-quiz-question",
]);

const SUPPORT_SLUGS = new Set<string>(["helpdeskarticles"]);
const DOWNLOADS_SLUGS = new Set<string>(["downloads", "download"]);
const ATTACHMENTS_SLUGS = new Set<string>(["attachments", "attachment"]);

type ResolverContext = {
  postTypeSlug: string;
  organizationId?: string;
};

type Resolver = {
  read: (
    ctx: QueryCtx,
    args: ResolverContext & { id: string },
  ) => Promise<EntityRecord | null>;
  list: (
    ctx: QueryCtx,
    args: ResolverContext & { filters?: EntityFiltersInput },
  ) => Promise<EntityRecord[]>;
  create: (
    ctx: MutationCtx,
    args: ResolverContext & { data: EntitySaveInput },
  ) => Promise<EntityRecord>;
  update: (
    ctx: MutationCtx,
    args: ResolverContext & { id: string; data: Partial<EntitySaveInput> },
  ) => Promise<EntityRecord | null>;
  remove: (
    ctx: MutationCtx,
    args: ResolverContext & { id: string },
  ) => Promise<void>;
};

const normalizeStatus = (status?: string | null): EntityStatus | undefined => {
  if (!status) return undefined;
  return status.toLowerCase();
};

const adaptPortalPost = (post: Doc<"posts">): EntityRecord => ({
  id: post._id,
  postTypeSlug: post.postTypeSlug ?? "",
  title: post.title ?? null,
  content: post.content ?? null,
  excerpt: post.excerpt ?? null,
  slug: post.slug ?? null,
  status: normalizeStatus(post.status),
  category: post.category ?? null,
  tags: post.tags ?? null,
  featuredImageUrl: post.featuredImageUrl ?? null,
  organizationId: (post.organizationId as unknown as string | null) ?? null,
  authorId: (post.authorId as unknown as string | null) ?? null,
  createdAt: post.createdAt ?? post._creationTime ?? null,
  updatedAt: post.updatedAt ?? post._creationTime ?? null,
});

const adaptCommercePost = (record: any): EntityRecord => ({
  id: record._id,
  postTypeSlug: record.postTypeSlug ?? "",
  title: record.title ?? null,
  content: record.content ?? null,
  excerpt: record.excerpt ?? null,
  slug: record.slug ?? null,
  status: normalizeStatus(record.status),
  category: record.category ?? null,
  tags: record.tags ?? null,
  featuredImageUrl: record.featuredImageUrl ?? null,
  organizationId: record.organizationId ?? null,
  authorId: record.authorId ?? null,
  createdAt: record.createdAt ?? record._creationTime ?? null,
  updatedAt: record.updatedAt ?? record._creationTime ?? null,
});

const adaptLmsPost = (record: any): EntityRecord => ({
  id: record._id,
  postTypeSlug: record.postTypeSlug ?? "",
  title: record.title ?? null,
  content: record.content ?? null,
  excerpt: record.excerpt ?? null,
  slug: record.slug ?? null,
  status: normalizeStatus(record.status),
  category: record.category ?? null,
  tags: record.tags ?? null,
  featuredImageUrl: record.featuredImageUrl ?? null,
  organizationId: record.organizationId ?? null,
  authorId: record.authorId ?? null,
  createdAt: record.createdAt ?? record._creationTime ?? null,
  updatedAt: record.updatedAt ?? record._creationTime ?? null,
});

const adaptSupportPost = (record: any): EntityRecord => ({
  id: record._id,
  postTypeSlug: record.postTypeSlug ?? "",
  title: record.title ?? null,
  content: record.content ?? null,
  excerpt: record.excerpt ?? null,
  slug: record.slug ?? null,
  status: normalizeStatus(record.status),
  tags: record.tags ?? null,
  organizationId: record.organizationId ?? null,
  createdAt: record.createdAt ?? record._creationTime ?? null,
  updatedAt: record.updatedAt ?? record._creationTime ?? null,
});

const adaptDownload = (record: any): EntityRecord => ({
  id: record._id,
  postTypeSlug: "downloads",
  title: record.title ?? null,
  content: record.content ?? null,
  excerpt: record.description ?? null,
  slug: record.slug ?? null,
  status: normalizeStatus(record.status),
  organizationId: record.organizationId ?? null,
  createdAt: record.createdAt ?? record._creationTime ?? null,
  updatedAt: record.updatedAt ?? record._creationTime ?? null,
  meta: {
    mediaItemId: record.mediaItemId,
    accessKind: record.access?.kind,
    r2Key: record.r2Key,
    downloadCountTotal: record.downloadCountTotal,
  },
});

const adaptAttachment = (record: any): EntityRecord => ({
  id: record._id,
  postTypeSlug: "attachments",
  title: record.title ?? null,
  excerpt: record.caption ?? null,
  slug: record._id ?? null,
  status: normalizeStatus(record.status),
  createdAt: record.uploadedAt ?? record._creationTime ?? null,
  updatedAt: record.uploadedAt ?? record._creationTime ?? null,
  meta: {
    alt: record.alt,
    caption: record.caption,
    url: record.url,
    mimeType: record.mimeType,
  },
});

const coreResolver: Resolver = {
  read: async (ctx, { id, postTypeSlug, organizationId }) => {
    const result = await ctx.runQuery(api.core.posts.queries.getPostById, {
      id,
      organizationId: organizationId as Id<"organizations"> | undefined,
      postTypeSlug,
    });
    if (!result) return null;
    return adaptPortalPost(result as Doc<"posts">);
  },
  list: async (ctx, { filters, postTypeSlug, organizationId }) => {
    const slugFilter =
      typeof filters?.slug === "string" ? filters.slug.trim() : "";
    if (slugFilter) {
      const post = await ctx.runQuery(api.core.posts.queries.getPostBySlug, {
        slug: slugFilter,
        organizationId: organizationId as Id<"organizations"> | undefined,
      });
      if (!post) return [];
      const record = post as Doc<"posts">;
      if (
        (record.postTypeSlug ?? "").toLowerCase() !== postTypeSlug.toLowerCase()
      ) {
        return [];
      }
      return [adaptPortalPost(record)];
    }

    const payload: {
      organizationId?: Id<"organizations">;
      filters?: {
        status?: EntityStatus;
        category?: string;
        authorId?: Id<"users">;
        limit?: number;
        postTypeSlug?: string;
      };
    } = {};
    if (organizationId) {
      payload.organizationId = organizationId as Id<"organizations">;
    }
    if (filters) {
      payload.filters = {
        ...filters,
        postTypeSlug,
        authorId: filters.authorId as Id<"users"> | undefined,
      };
    } else {
      payload.filters = { postTypeSlug };
    }
    const results =
      (await ctx.runQuery(api.core.posts.queries.getAllPosts, payload)) ?? [];
    return results.map(adaptPortalPost);
  },
  create: async (ctx, { data, postTypeSlug }) => {
    const id = await ctx.runMutation(api.core.posts.mutations.createPost, {
      ...data,
      postTypeSlug,
      organizationId: data.organizationId
        ? (data.organizationId as Id<"organizations">)
        : undefined,
    });
    const created = await ctx.runQuery(api.core.posts.queries.getPostById, {
      id,
      postTypeSlug,
      organizationId: data.organizationId as Id<"organizations"> | undefined,
    });
    return adaptPortalPost(created as Doc<"posts">);
  },
  update: async (ctx, { id, data }) => {
    await ctx.runMutation(api.core.posts.mutations.updatePost, {
      id: id as Id<"posts">,
      ...data,
    });
    const updated = await ctx.runQuery(api.core.posts.queries.getPostById, {
      id,
    });
    return updated ? adaptPortalPost(updated as Doc<"posts">) : null;
  },
  remove: async (ctx, { id }) => {
    await ctx.runMutation(api.core.posts.mutations.deletePost, {
      id: id as Id<"posts">,
    });
  },
};

const downloadsResolver: Resolver = {
  read: async (ctx, { id, organizationId }) => {
    if (!organizationId) return null;
    const result = await ctx.runQuery(
      api.core.downloads.queries.getDownloadById,
      {
        organizationId: organizationId as Id<"organizations">,
        downloadId: id as Id<"downloads">,
      },
    );
    return result ? adaptDownload(result.download) : null;
  },
  list: async (ctx, { filters, organizationId }) => {
    if (!organizationId) return [];
    const slugFilter =
      typeof filters?.slug === "string" ? filters.slug.trim() : "";
    if (slugFilter) {
      const result = await ctx.runQuery(
        api.core.downloads.queries.getDownloadBySlug,
        {
          organizationId: organizationId as Id<"organizations">,
          slug: slugFilter,
        },
      );
      return result ? [adaptDownload(result.download)] : [];
    }

    const status =
      filters?.status === "draft" || filters?.status === "published"
        ? (filters.status as "draft" | "published")
        : undefined;
    const rows =
      (await ctx.runQuery(api.core.downloads.queries.listDownloads, {
        organizationId: organizationId as Id<"organizations">,
        status,
      })) ?? [];
    const limit =
      typeof filters?.limit === "number" ? filters.limit : undefined;
    const mapped = rows.map(adaptDownload);
    return typeof limit === "number" ? mapped.slice(0, limit) : mapped;
  },
  create: async (ctx, { data, organizationId }) => {
    if (!organizationId) {
      throw new Error("organizationId is required for downloads.");
    }
    const raw = data as unknown as Record<string, unknown>;
    const mediaItemId = raw.mediaItemId as string | undefined;
    if (!mediaItemId) {
      throw new Error("mediaItemId is required to create a download.");
    }
    const createdId = await ctx.runMutation(
      api.core.downloads.mutations.createDownloadFromMediaItem,
      {
        organizationId: organizationId as Id<"organizations">,
        mediaItemId: mediaItemId as Id<"mediaItems">,
        title: typeof raw.title === "string" ? raw.title : undefined,
        description:
          typeof raw.description === "string" ? raw.description : undefined,
        content: typeof raw.content === "string" ? raw.content : undefined,
        slug: typeof raw.slug === "string" ? raw.slug : undefined,
        accessKind:
          raw.accessKind === "public" || raw.accessKind === "gated"
            ? (raw.accessKind as "public" | "gated")
            : undefined,
      },
    );
    const result = await ctx.runQuery(
      api.core.downloads.queries.getDownloadById,
      {
        organizationId: organizationId as Id<"organizations">,
        downloadId: createdId,
      },
    );
    if (!result) {
      throw new Error("Failed to load created download.");
    }
    return adaptDownload(result.download);
  },
  update: async (ctx, { id, data, organizationId }) => {
    if (!organizationId) {
      throw new Error("organizationId is required for downloads.");
    }
    const raw = data as unknown as Record<string, unknown>;
    await ctx.runMutation(api.core.downloads.mutations.updateDownload, {
      organizationId: organizationId as Id<"organizations">,
      downloadId: id as Id<"downloads">,
      data: {
        title: typeof raw.title === "string" ? raw.title : undefined,
        description:
          typeof raw.description === "string" ? raw.description : undefined,
        content: typeof raw.content === "string" ? raw.content : undefined,
        slug: typeof raw.slug === "string" ? raw.slug : undefined,
        accessKind:
          raw.accessKind === "public" || raw.accessKind === "gated"
            ? (raw.accessKind as "public" | "gated")
            : undefined,
        status:
          raw.status === "draft" || raw.status === "published"
            ? (raw.status as "draft" | "published")
            : undefined,
        mediaItemId:
          typeof raw.mediaItemId === "string" && raw.mediaItemId.length > 0
            ? (raw.mediaItemId as Id<"mediaItems">)
            : undefined,
      },
    });
    const result = await ctx.runQuery(
      api.core.downloads.queries.getDownloadById,
      {
        organizationId: organizationId as Id<"organizations">,
        downloadId: id as Id<"downloads">,
      },
    );
    return result ? adaptDownload(result.download) : null;
  },
  remove: async () => {
    throw new Error("Delete is not yet supported for downloads.");
  },
};

const attachmentsResolver: Resolver = {
  read: async (ctx, { id }) => {
    const media = await ctx.runQuery(api.core.media.queries.getMediaById, {
      id: id as Id<"mediaItems">,
    });
    return media ? adaptAttachment(media) : null;
  },
  list: async (ctx, { filters }) => {
    const slugFilter =
      typeof filters?.slug === "string" ? filters.slug.trim() : "";
    if (slugFilter) {
      const media = await ctx.runQuery(api.core.media.queries.getMediaById, {
        id: slugFilter as Id<"mediaItems">,
      });
      return media ? [adaptAttachment(media)] : [];
    }
    const status =
      filters?.status === "draft" || filters?.status === "published"
        ? (filters.status as "draft" | "published")
        : undefined;
    const limit = typeof filters?.limit === "number" ? filters.limit : 200;
    const page = await ctx.runQuery(
      api.core.media.queries.listMediaItemsWithUrl,
      {
        paginationOpts: { numItems: limit, cursor: null },
        status,
      },
    );
    return (page?.page ?? []).map(adaptAttachment);
  },
  create: async () => {
    throw new Error("Attachments must be created via upload.");
  },
  update: async (ctx, { id, data }) => {
    const raw = data as unknown as Record<string, unknown>;
    await ctx.runMutation(api.core.media.mutations.updateMedia, {
      id: id as Id<"mediaItems">,
      title: typeof raw.title === "string" ? raw.title : undefined,
      caption: typeof raw.caption === "string" ? raw.caption : undefined,
      alt: typeof raw.alt === "string" ? raw.alt : undefined,
      status:
        raw.status === "draft" || raw.status === "published"
          ? (raw.status as "draft" | "published")
          : undefined,
    });
    const media = await ctx.runQuery(api.core.media.queries.getMediaById, {
      id: id as Id<"mediaItems">,
    });
    return media ? adaptAttachment(media) : null;
  },
  remove: async (ctx, { id }) => {
    await ctx.runMutation(api.core.media.mutations.deleteMedia, {
      id: id as Id<"mediaItems">,
    });
  },
};

const commerceResolver: Resolver = {
  read: async (ctx, { id, organizationId }) => {
    const result = await ctx.runQuery(
      api.plugins.commerce.queries.getPostById,
      {
        id,
        organizationId,
      },
    );
    return result ? adaptCommercePost(result) : null;
  },
  list: async (ctx, { filters, postTypeSlug, organizationId }) => {
    const slugFilter =
      typeof filters?.slug === "string" ? filters.slug.trim() : "";
    if (slugFilter) {
      const result = await ctx.runQuery(
        api.plugins.commerce.queries.getPostBySlug,
        {
          slug: slugFilter,
          organizationId,
        },
      );
      if (!result) return [];
      const adapted = adaptCommercePost(result);
      if (
        (adapted.postTypeSlug ?? "").toLowerCase() !==
        postTypeSlug.toLowerCase()
      ) {
        return [];
      }
      return [adapted];
    }

    const payload: Record<string, unknown> = {
      organizationId,
    };
    if (filters) {
      payload.filters = { ...filters, postTypeSlug };
    } else {
      payload.filters = { postTypeSlug };
    }
    const results =
      (await ctx.runQuery(
        api.plugins.commerce.queries.getAllPosts,
        payload as any,
      )) ?? [];
    return results.map(adaptCommercePost);
  },
  create: async (ctx, { data, postTypeSlug }) => {
    const id = await ctx.runMutation(
      api.plugins.commerce.mutations.createPost,
      {
        ...data,
        postTypeSlug,
        organizationId: data.organizationId,
      },
    );
    const created = await ctx.runQuery(
      api.plugins.commerce.queries.getPostById,
      {
        id,
        organizationId: data.organizationId,
      },
    );
    return adaptCommercePost(created);
  },
  update: async (ctx, { id, data }) => {
    await ctx.runMutation(api.plugins.commerce.mutations.updatePost, {
      id,
      ...data,
    });
    const updated = await ctx.runQuery(
      api.plugins.commerce.queries.getPostById,
      {
        id,
        organizationId: data.organizationId,
      },
    );
    return updated ? adaptCommercePost(updated) : null;
  },
  remove: async (ctx, { id }) => {
    await ctx.runMutation(api.plugins.commerce.mutations.deletePost, { id });
  },
};

const lmsResolver: Resolver = {
  read: async (ctx, { id, organizationId }) => {
    const result = await ctx.runQuery(
      api.plugins.lms.posts.queries.getPostById,
      {
        id,
        organizationId,
      },
    );
    return result ? adaptLmsPost(result) : null;
  },
  list: async (ctx, { filters, postTypeSlug, organizationId }) => {
    const slugFilter =
      typeof filters?.slug === "string" ? filters.slug.trim() : "";
    if (slugFilter) {
      const result = await ctx.runQuery(
        api.plugins.lms.posts.queries.getPostBySlug,
        {
          slug: slugFilter,
          organizationId,
        },
      );
      if (!result) return [];
      const adapted = adaptLmsPost(result);
      if (
        (adapted.postTypeSlug ?? "").toLowerCase() !==
        postTypeSlug.toLowerCase()
      ) {
        return [];
      }
      return [adapted];
    }

    const payload: Record<string, unknown> = {
      organizationId,
    };
    if (filters) {
      payload.filters = { ...filters, postTypeSlug };
    } else {
      payload.filters = { postTypeSlug };
    }
    const results =
      (await ctx.runQuery(
        api.plugins.lms.posts.queries.getAllPosts,
        payload as any,
      )) ?? [];
    return results.map(adaptLmsPost);
  },
  create: async (ctx, { data, postTypeSlug }) => {
    const id = await ctx.runMutation(
      api.plugins.lms.posts.mutations.createPost,
      {
        ...data,
        postTypeSlug,
        organizationId: data.organizationId,
      },
    );
    const created = await ctx.runQuery(
      api.plugins.lms.posts.queries.getPostById,
      {
        id,
        organizationId: data.organizationId,
      },
    );
    return adaptLmsPost(created);
  },
  update: async (ctx, { id, data }) => {
    await ctx.runMutation(api.plugins.lms.posts.mutations.updatePost, {
      id,
      ...data,
    });
    const updated = await ctx.runQuery(
      api.plugins.lms.posts.queries.getPostById,
      {
        id,
        organizationId: data.organizationId,
      },
    );
    return updated ? adaptLmsPost(updated) : null;
  },
  remove: async (ctx, { id }) => {
    await ctx.runMutation(api.plugins.lms.posts.mutations.deletePost, { id });
  },
};

const disclaimersResolver: Resolver = {
  read: async (ctx, { id, organizationId }) => {
    const result = await ctx.runQuery(
      api.plugins.disclaimers.posts.queries.getPostById,
      {
        id,
        organizationId,
      },
    );
    return result ? adaptLmsPost(result) : null;
  },
  list: async (ctx, { filters, postTypeSlug, organizationId }) => {
    const slugFilter =
      typeof filters?.slug === "string" ? filters.slug.trim() : "";
    if (slugFilter) {
      const result = await ctx.runQuery(
        api.plugins.disclaimers.posts.queries.getPostBySlug,
        {
          slug: slugFilter,
          organizationId,
        },
      );
      if (!result) return [];
      const adapted = adaptLmsPost(result);
      if (
        (adapted.postTypeSlug ?? "").toLowerCase() !==
        postTypeSlug.toLowerCase()
      ) {
        return [];
      }
      return [adapted];
    }

    const payload: Record<string, unknown> = {
      organizationId,
    };
    if (filters) {
      payload.filters = { ...filters, postTypeSlug };
    } else {
      payload.filters = { postTypeSlug };
    }
    const results =
      (await ctx.runQuery(
        api.plugins.disclaimers.posts.queries.getAllPosts,
        payload as any,
      )) ?? [];
    return results.map(adaptLmsPost);
  },
  create: async (ctx, { data, postTypeSlug }) => {
    const id = await ctx.runMutation(
      api.plugins.disclaimers.posts.mutations.createPost,
      {
        ...data,
        postTypeSlug,
        organizationId: data.organizationId,
      },
    );
    const created = await ctx.runQuery(
      api.plugins.disclaimers.posts.queries.getPostById,
      {
        id,
        organizationId: data.organizationId,
      },
    );
    return adaptLmsPost(created);
  },
  update: async (ctx, { id, data }) => {
    // The /admin/edit entity payload includes additional fields used for resolver
    // selection and scoping (e.g. organizationId, postTypeSlug). The underlying
    // component post mutation validators don't accept these fields, so we must
    // explicitly strip them before forwarding.
    const raw = (data ?? {}) as Record<string, unknown>;
    const updatePayload: Record<string, unknown> = { id };
    if (typeof raw.title === "string") updatePayload.title = raw.title;
    if (typeof raw.content === "string") updatePayload.content = raw.content;
    if (typeof raw.excerpt === "string") updatePayload.excerpt = raw.excerpt;
    if (typeof raw.slug === "string") updatePayload.slug = raw.slug;
    if (
      raw.status === "published" ||
      raw.status === "draft" ||
      raw.status === "archived"
    ) {
      updatePayload.status = raw.status;
    }
    if (typeof raw.category === "string") updatePayload.category = raw.category;
    if (Array.isArray(raw.tags)) updatePayload.tags = raw.tags;
    if (typeof raw.featuredImage === "string") {
      updatePayload.featuredImage = raw.featuredImage;
    }
    if (raw.meta && typeof raw.meta === "object") updatePayload.meta = raw.meta;

    await ctx.runMutation(
      api.plugins.disclaimers.posts.mutations.updatePost,
      updatePayload as any,
    );
    const updated = await ctx.runQuery(
      api.plugins.disclaimers.posts.queries.getPostById,
      {
        id,
        organizationId: data.organizationId,
      },
    );
    return updated ? adaptLmsPost(updated) : null;
  },
  remove: async (ctx, { id }) => {
    await ctx.runMutation(api.plugins.disclaimers.posts.mutations.deletePost, {
      id,
    });
  },
};

const supportResolver: Resolver = {
  read: async (ctx, { id, organizationId }) => {
    if (!organizationId) return null;
    const result = await ctx.runQuery(
      api.plugins.support.queries.getHelpdeskArticleById,
      {
        id,
        organizationId,
      },
    );
    return result ? adaptSupportPost(result) : null;
  },
  list: async (ctx, { filters, organizationId }) => {
    if (!organizationId) return [];
    const slugFilter =
      typeof filters?.slug === "string" ? filters.slug.trim() : "";
    const results =
      (await ctx.runQuery(api.plugins.support.queries.listSupportPosts, {
        organizationId,
        filters: {
          postTypeSlug: "helpdeskarticles",
          status: filters?.status,
          limit: Math.max(filters?.limit ?? 200, slugFilter ? 200 : 0),
        },
      })) ?? [];
    if (slugFilter) {
      const match = results.find((row: any) => row?.slug === slugFilter);
      return match ? [adaptSupportPost(match)] : [];
    }
    return results.map(adaptSupportPost);
  },
  create: async (ctx, { data, postTypeSlug, organizationId }) => {
    if (!organizationId) {
      throw new Error("organizationId is required for helpdesk posts.");
    }
    const raw = data as unknown as Record<string, unknown>;
    const id = await ctx.runMutation(
      api.plugins.support.mutations.createSupportPost,
      {
        organizationId,
        postTypeSlug,
        title: typeof raw.title === "string" ? raw.title : "",
        content: typeof raw.content === "string" ? raw.content : undefined,
        excerpt: typeof raw.excerpt === "string" ? raw.excerpt : undefined,
        slug: typeof raw.slug === "string" ? raw.slug : "",
        status:
          raw.status === "published" ||
          raw.status === "draft" ||
          raw.status === "archived"
            ? (raw.status as any)
            : "draft",
        tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : undefined,
        authorId: typeof raw.authorId === "string" ? raw.authorId : undefined,
        meta: Array.isArray(raw.meta) ? (raw.meta as any) : undefined,
      },
    );
    const created = await ctx.runQuery(
      api.plugins.support.queries.getSupportPostById,
      {
        id: id as Id<"posts">,
        organizationId,
      },
    );
    return created
      ? adaptSupportPost(created)
      : { id, postTypeSlug, title: raw.title as any };
  },
  update: async (ctx, { id, data, postTypeSlug, organizationId }) => {
    if (!organizationId) {
      throw new Error("organizationId is required for helpdesk posts.");
    }
    const raw = data as unknown as Record<string, unknown>;
    await ctx.runMutation(api.plugins.support.mutations.updateSupportPost, {
      id: id as Id<"posts">,
      organizationId,
      postTypeSlug,
      title: typeof raw.title === "string" ? raw.title : "",
      content: typeof raw.content === "string" ? raw.content : undefined,
      excerpt: typeof raw.excerpt === "string" ? raw.excerpt : undefined,
      slug: typeof raw.slug === "string" ? raw.slug : "",
      status:
        raw.status === "published" ||
        raw.status === "draft" ||
        raw.status === "archived"
          ? (raw.status as any)
          : "draft",
      tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : undefined,
      authorId: typeof raw.authorId === "string" ? raw.authorId : undefined,
      meta: Array.isArray(raw.meta) ? (raw.meta as any) : undefined,
    });
    const updated = await ctx.runQuery(
      api.plugins.support.queries.getSupportPostById,
      {
        id: id as Id<"posts">,
        organizationId,
      },
    );
    return updated ? adaptSupportPost(updated) : null;
  },
  remove: async () => {
    throw new Error("Helpdesk delete is not supported through entity router.");
  },
};

const resolveFromPostType = async (
  ctx: QueryCtx | MutationCtx,
  postTypeSlug: string,
  organizationId?: string,
): Promise<Resolver | null> => {
  const orgId = organizationId
    ? (organizationId as unknown as Id<"organizations">)
    : undefined;
  try {
    const postType = await getScopedPostTypeBySlug(
      ctx as unknown as QueryCtx,
      postTypeSlug,
      orgId,
    );
    if (!postType) return null;
    const storageKind = postType.storageKind;
    const storageTables = postType.storageTables ?? [];
    if (storageKind === "component") {
      if (storageTables.some((t) => t.includes("launchthat_lms:posts"))) {
        return lmsResolver;
      }
      if (storageTables.some((t) => t.includes("launchthat_commerce:posts"))) {
        return commerceResolver;
      }
      if (
        storageTables.some((t) => t.includes("launchthat_disclaimers:posts"))
      ) {
        return disclaimersResolver;
      }
      if (storageTables.some((t) => t.includes("launchthat_support:posts"))) {
        return supportResolver;
      }
      // Unknown component storage; fall back to core (safe default).
      return coreResolver;
    }
    return coreResolver;
  } catch {
    return null;
  }
};

const getResolver = async (
  ctx: QueryCtx | MutationCtx,
  postTypeSlug: string,
  organizationId?: string,
): Promise<Resolver> => {
  const normalized = postTypeSlug.toLowerCase();
  if (DOWNLOADS_SLUGS.has(normalized)) {
    return downloadsResolver;
  }
  if (ATTACHMENTS_SLUGS.has(normalized)) {
    return attachmentsResolver;
  }

  // Preferred: choose based on postTypes definitions (storageKind/storageTables).
  const fromPostType = await resolveFromPostType(
    ctx,
    normalized,
    organizationId,
  );
  if (fromPostType) return fromPostType;

  // Fallback: legacy slug sets (kept for safety during migration).
  if (COMMERCE_SLUGS.has(normalized)) return commerceResolver;
  if (LMS_SLUGS.has(normalized)) return lmsResolver;
  if (SUPPORT_SLUGS.has(normalized)) return supportResolver;
  return coreResolver;
};

export const entityResolvers = {
  get: getResolver,
};
