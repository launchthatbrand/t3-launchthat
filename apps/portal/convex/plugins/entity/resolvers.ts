/* eslint-disable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-unnecessary-type-assertion */
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import type {
  EntityFiltersInput,
  EntityRecord,
  EntitySaveInput,
  EntityStatus,
} from "./types";
import {
  api as apiGenerated,
  components as componentsGenerated,
} from "../../_generated/api";
import { getScopedPostTypeBySlug } from "../../core/postTypes/lib/contentTypes";

// The generated `api`/`components` types are extremely deep; in this router we prefer
// runtime safety and flexibility over full static typing.
const api: any = apiGenerated;
const components: any = componentsGenerated;

const DOWNLOADS_SLUGS = new Set<string>(["downloads", "download"]);
const ATTACHMENTS_SLUGS = new Set<string>(["attachments", "attachment"]);

type PostStatus =
  | "draft"
  | "published"
  | "archived"
  | "paid"
  | "unpaid"
  | "failed";

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

const _adaptLmsPost = (record: any): EntityRecord => ({
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

const _adaptSupportPost = (record: any): EntityRecord => ({
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

const inferStorageComponent = (tables: readonly string[] | undefined) => {
  const storageTables = tables ?? [];
  const candidate =
    storageTables.find((t) => t.includes(":posts")) ?? storageTables[0];
  if (!candidate) return undefined;
  const prefix = candidate.split(":")[0];
  return prefix && prefix.trim().length > 0 ? prefix.trim() : undefined;
};

const makeComponentPostsResolver = (storageComponent: string): Resolver => {
  const componentPosts = components?.[storageComponent]?.posts;
  const postsQueries = componentPosts?.queries;
  const postsMutations = componentPosts?.mutations;

  if (!postsQueries || !postsMutations) {
    // Fail safe: fall back to core behavior rather than hard error.
    return coreResolver;
  }

  const buildCreatePayload = (args: {
    postTypeSlug: string;
    data: EntitySaveInput;
    organizationId?: string;
  }) => {
    const raw = (args.data ?? {}) as Record<string, unknown>;
    const featuredImage =
      typeof raw.featuredImageUrl === "string"
        ? raw.featuredImageUrl
        : undefined;
    const status: PostStatus =
      raw.status === "published" ||
      raw.status === "draft" ||
      raw.status === "archived" ||
      raw.status === "paid" ||
      raw.status === "unpaid" ||
      raw.status === "failed"
        ? (raw.status as PostStatus)
        : "draft";

    return {
      organizationId:
        typeof raw.organizationId === "string"
          ? raw.organizationId
          : args.organizationId,
      postTypeSlug: args.postTypeSlug,
      title: typeof raw.title === "string" ? raw.title : "",
      content: typeof raw.content === "string" ? raw.content : undefined,
      excerpt: typeof raw.excerpt === "string" ? raw.excerpt : undefined,
      slug: typeof raw.slug === "string" ? raw.slug : "",
      status,
      category: typeof raw.category === "string" ? raw.category : undefined,
      tags: Array.isArray(raw.tags) ? raw.tags : undefined,
      featuredImage,
      meta: raw.meta && typeof raw.meta === "object" ? raw.meta : undefined,
    };
  };

  const buildUpdatePayload = (args: {
    id: string;
    data: Partial<EntitySaveInput>;
    organizationId?: string;
  }) => {
    const raw = (args.data ?? {}) as Record<string, unknown>;
    const featuredImage =
      typeof raw.featuredImageUrl === "string"
        ? raw.featuredImageUrl
        : undefined;
    const status: PostStatus | undefined =
      raw.status === "published" ||
      raw.status === "draft" ||
      raw.status === "archived" ||
      raw.status === "paid" ||
      raw.status === "unpaid" ||
      raw.status === "failed"
        ? (raw.status as PostStatus)
        : undefined;
    return {
      id: args.id,
      organizationId:
        typeof raw.organizationId === "string"
          ? raw.organizationId
          : args.organizationId,
      title: typeof raw.title === "string" ? raw.title : undefined,
      content: typeof raw.content === "string" ? raw.content : undefined,
      excerpt: typeof raw.excerpt === "string" ? raw.excerpt : undefined,
      slug: typeof raw.slug === "string" ? raw.slug : undefined,
      status,
      category: typeof raw.category === "string" ? raw.category : undefined,
      tags: Array.isArray(raw.tags) ? raw.tags : undefined,
      featuredImage,
      meta: raw.meta && typeof raw.meta === "object" ? raw.meta : undefined,
      // Some components (e.g. ecommerce) support patch-style updates; harmless for others
      // because we only include it when needed later.
    };
  };

  return {
    read: async (ctx, { id, organizationId }) => {
      const result = await ctx.runQuery(postsQueries.getPostById as any, {
        id,
        organizationId,
      });
      return result ? adaptCommercePost(result) : null;
    },
    list: async (ctx, { filters, postTypeSlug, organizationId }) => {
      const slugFilter =
        typeof filters?.slug === "string" ? filters.slug.trim() : "";
      if (slugFilter) {
        const result = await ctx.runQuery(postsQueries.getPostBySlug as any, {
          slug: slugFilter,
          organizationId,
        });
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

      const payload: Record<string, unknown> = { organizationId };
      payload.filters = { ...(filters ?? {}), postTypeSlug };
      const results =
        (await ctx.runQuery(postsQueries.getAllPosts as any, payload as any)) ??
        [];
      return results.map(adaptCommercePost);
    },
    create: async (ctx, { data, postTypeSlug, organizationId }) => {
      const payload = buildCreatePayload({
        postTypeSlug,
        data,
        organizationId,
      });
      const id = await ctx.runMutation(
        postsMutations.createPost as any,
        payload,
      );
      const created = await ctx.runQuery(postsQueries.getPostById as any, {
        id,
        organizationId: payload.organizationId,
      });
      return adaptCommercePost(created);
    },
    update: async (ctx, { id, data, organizationId }) => {
      const payload = buildUpdatePayload({ id, data, organizationId });
      await ctx.runMutation(postsMutations.updatePost as any, payload);
      const updated = await ctx.runQuery(postsQueries.getPostById as any, {
        id,
        organizationId: payload.organizationId,
      });
      return updated ? adaptCommercePost(updated) : null;
    },
    remove: async (ctx, { id }) => {
      await ctx.runMutation(postsMutations.deletePost as any, { id });
    },
  };
};

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
  create: async (ctx, { data, postTypeSlug, organizationId }) => {
    const id = await ctx.runMutation(api.core.posts.mutations.createPost, {
      ...data,
      postTypeSlug,
      organizationId: organizationId
        ? (organizationId as Id<"organizations">)
        : undefined,
    });
    const created = await ctx.runQuery(api.core.posts.queries.getPostById, {
      id,
      postTypeSlug,
      organizationId: organizationId
        ? (organizationId as Id<"organizations">)
        : undefined,
    });
    return adaptPortalPost(created as Doc<"posts">);
  },
  update: async (ctx, { id, data, organizationId, postTypeSlug }) => {
    await ctx.runMutation(api.core.posts.mutations.updatePost, {
      id: id as Id<"posts">,
      ...data,
    });
    const updated = await ctx.runQuery(api.core.posts.queries.getPostById, {
      id,
      ...(organizationId
        ? { organizationId: organizationId as Id<"organizations"> }
        : {}),
      ...(postTypeSlug ? { postTypeSlug } : {}),
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
  remove: () => {
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
  create: () => {
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
    if (storageKind === "component") {
      const storageComponent =
        (postType as any).storageComponent ??
        inferStorageComponent((postType as any).storageTables);
      if (!storageComponent) {
        return coreResolver;
      }
      return makeComponentPostsResolver(storageComponent);
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
  return coreResolver;
};

export const entityResolvers = {
  get: getResolver,
};
