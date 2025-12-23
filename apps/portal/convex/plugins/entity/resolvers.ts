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
  const lowered = status.toLowerCase();
  if (
    lowered === "published" ||
    lowered === "draft" ||
    lowered === "archived"
  ) {
    return lowered;
  }
  return undefined;
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
    const results =
      (await ctx.runQuery(api.plugins.support.queries.listSupportPosts, {
        organizationId,
        filters: {
          postTypeSlug: "helpdeskarticles",
          status: filters?.status,
          limit: filters?.limit ?? 200,
        },
      })) ?? [];
    return results.map(adaptSupportPost);
  },
  create: () => {
    throw new Error("Helpdesk creation is not supported through entity router");
  },
  update: () => {
    throw new Error("Helpdesk update is not supported through entity router");
  },
  remove: () => {
    throw new Error("Helpdesk delete is not supported through entity router");
  },
};

const getResolver = (postTypeSlug: string): Resolver => {
  const normalized = postTypeSlug.toLowerCase();
  if (COMMERCE_SLUGS.has(normalized)) {
    return commerceResolver;
  }
  if (LMS_SLUGS.has(normalized)) {
    return lmsResolver;
  }
  if (SUPPORT_SLUGS.has(normalized)) {
    return supportResolver;
  }
  return coreResolver;
};

export const entityResolvers = {
  get: getResolver,
};
