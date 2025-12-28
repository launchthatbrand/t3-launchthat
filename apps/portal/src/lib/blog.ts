import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useCallback, useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

import { useTenant } from "~/context/TenantContext";
import { getTenantOrganizationId } from "./tenant-fetcher";

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

const LMS_COMPONENT_POST_TYPE_SLUGS = new Set<string>([
  "courses",
  "lessons",
  "topics",
  "quizzes",
  "certificates",
  "badges",
]);

const isLmsComponentPostTypeSlug = (value: string | undefined) => {
  const normalized = value?.toLowerCase().trim();
  return normalized ? LMS_COMPONENT_POST_TYPE_SLUGS.has(normalized) : false;
};

// Posts Types - extend with more post metadata
export interface PostFilter {
  status?: string;
  category?: string;
  authorId?: Id<"users">;
  limit?: number;
  postTypeSlug?: string;
}

export interface CreatePostArgs {
  title: string;
  content?: string;
  excerpt?: string;
  slug: string;
  status: string;
  category?: string;
  tags?: string[];
  featuredImage?: string;
  postTypeSlug?: string;
  meta?: Record<string, string | number | boolean | null>;
}

export interface UpdatePostArgs {
  id: Id<"posts"> | string;
  title?: string;
  content?: string;
  excerpt?: string;
  slug?: string;
  status?: string;
  category?: string;
  tags?: string[];
  featuredImage?: string;
  postTypeSlug?: string;
  meta?: Record<string, string | number | boolean | null>;
}

export interface SearchPostArgs {
  searchTerm: string;
  limit?: number;
  postTypeSlug?: string;
}

const toOrgString = (
  organizationId?: Id<"organizations"> | null,
): string | undefined =>
  organizationId ? (organizationId as unknown as string) : undefined;

const adaptEntityToPost = (
  entity:
    | {
        id: string;
        postTypeSlug?: string;
        title?: string | null;
        content?: string | null;
        excerpt?: string | null;
        slug?: string | null;
        status?: string | null;
        category?: string | null;
        tags?: string[] | null;
        featuredImageUrl?: string | null;
        organizationId?: string | null;
        authorId?: string | null;
        createdAt?: number | null;
        updatedAt?: number | null;
      }
    | null
    | undefined,
): Doc<"posts"> | null | undefined => {
  if (entity === undefined) return undefined;
  if (entity === null) return null;
  return {
    _id: entity.id as Id<"posts">,
    _creationTime: entity.createdAt ?? Date.now(),
    title: entity.title ?? undefined,
    content: entity.content ?? undefined,
    excerpt: entity.excerpt ?? undefined,
    slug: entity.slug ?? undefined,
    status: (entity.status ?? "draft") as unknown as Doc<"posts">["status"],
    category: entity.category ?? undefined,
    tags: entity.tags ?? undefined,
    featuredImageUrl: entity.featuredImageUrl ?? undefined,
    postTypeSlug: entity.postTypeSlug ?? undefined,
    organizationId: entity.organizationId as Id<"organizations"> | undefined,
    authorId: entity.authorId as Id<"users"> | undefined,
    createdAt: entity.createdAt ?? undefined,
    updatedAt: entity.updatedAt ?? undefined,
  } as unknown as Doc<"posts">;
};

/**
 * Custom hooks for posts
 */

// Query hooks
export function useGetAllPosts(filters?: PostFilter) {
  const tenant = useTenant();
  const tenantOrganizationId = getTenantOrganizationId(tenant);
  const args = useMemo(() => {
    if (!filters?.postTypeSlug) {
      return "skip" as const;
    }
    return {
      postTypeSlug: filters.postTypeSlug.toLowerCase(),
      organizationId: toOrgString(tenantOrganizationId),
      filters: {
        status: filters.status,
        category: filters.category,
        authorId: filters.authorId as unknown as string | undefined,
        limit: filters.limit,
      },
    };
  }, [filters, tenantOrganizationId]);
  const lmsPosts = useQuery(
    api.plugins.lms.posts.queries.getAllPosts as any,
    filters?.postTypeSlug && isLmsComponentPostTypeSlug(filters.postTypeSlug)
      ? ({
          organizationId: toOrgString(tenantOrganizationId),
          filters: {
            status: filters.status,
            category: filters.category,
            authorId: filters.authorId as unknown as string | undefined,
            postTypeSlug: filters.postTypeSlug.toLowerCase(),
            limit: filters.limit,
          },
        } as const)
      : ("skip" as const),
  );
  const entities = useQuery(
    api.plugins.entity.queries.listEntities,
    filters?.postTypeSlug && !isLmsComponentPostTypeSlug(filters.postTypeSlug)
      ? (args as any)
      : ("skip" as const),
  );

  const posts = useMemo(() => {
    if (filters?.postTypeSlug && isLmsComponentPostTypeSlug(filters.postTypeSlug)) {
      return (lmsPosts ?? []) as Doc<"posts">[];
    }
    return (entities ?? []).map((entry: unknown): Doc<"posts"> | null | undefined =>
      adaptEntityToPost(entry as { id: string } | null | undefined),
    );
  }, [entities, filters?.postTypeSlug, lmsPosts]);
  return {
    posts,
    isLoading:
      filters?.postTypeSlug && isLmsComponentPostTypeSlug(filters.postTypeSlug)
        ? lmsPosts === undefined
        : entities === undefined,
  };
}

export function useGetPostById(
  id: Id<"posts"> | string | undefined,
  postTypeSlug: string | undefined,
): Doc<"posts"> | null | undefined {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const args = useMemo(() => {
    if (!id || !postTypeSlug) {
      return "skip" as const;
    }
    return {
      postTypeSlug: postTypeSlug.toLowerCase(),
      id: id as string,
      organizationId: toOrgString(organizationId),
    };
  }, [id, organizationId, postTypeSlug]);
  const lmsPost = useQuery(
    api.plugins.lms.posts.queries.getPostById as any,
    id && postTypeSlug && isLmsComponentPostTypeSlug(postTypeSlug)
      ? ({
          id: id as string,
          organizationId: toOrgString(organizationId),
        } as const)
      : ("skip" as const),
  );
  const entity = useQuery(
    api.plugins.entity.queries.readEntity,
    id && postTypeSlug && !isLmsComponentPostTypeSlug(postTypeSlug)
      ? (args as any)
      : ("skip" as const),
  );
  if (postTypeSlug && isLmsComponentPostTypeSlug(postTypeSlug)) {
    return lmsPost as any;
  }
  return adaptEntityToPost(entity);
}

export function useGetHelpdeskArticleById(
  id: Id<"posts"> | undefined,
): Doc<"posts"> | null | undefined {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);

  const args = useMemo(() => {
    if (!id || !organizationId) {
      return "skip" as const;
    }
    return {
      postTypeSlug: "helpdeskarticles",
      id: id as string,
      organizationId: toOrgString(organizationId),
    };
  }, [id, organizationId]);

  const entity = useQuery(api.plugins.entity.queries.readEntity, args);
  return adaptEntityToPost(entity);
}

export function useGetPostBySlug(slug: string | undefined) {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const normalizedSlug = slug?.toLowerCase();
  const entities = useQuery(
    api.plugins.entity.queries.listEntities,
    slug
      ? {
          postTypeSlug: normalizedSlug ?? slug,
          organizationId: toOrgString(organizationId),
          filters: { limit: 1 },
        }
      : "skip",
  );
  const first = Array.isArray(entities) ? entities[0] : undefined;
  return adaptEntityToPost(first);
}

export function useSearchPosts(args: SearchPostArgs) {
  const tenant = useTenant();
  const tenantOrganizationId = getTenantOrganizationId(tenant);
  const params = useMemo(() => {
    if (!args.postTypeSlug) return "skip" as const;
    return {
      postTypeSlug: args.postTypeSlug.toLowerCase(),
      organizationId: toOrgString(tenantOrganizationId),
      filters: { limit: args.limit },
    };
  }, [args.limit, args.postTypeSlug, tenantOrganizationId]);
  const results = useQuery(api.plugins.entity.queries.listEntities, params);
  return useMemo(
    () =>
      (results ?? []).map((entry: unknown): Doc<"posts"> | null | undefined =>
        adaptEntityToPost(entry as { id: string } | null | undefined),
      ) as Doc<"posts">[] | null | undefined,
    [results],
  );
}

export function useGetPostTags() {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const coreResult = useQuery(api.core.posts.queries.getPostTags, {
    organizationId,
  });
  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    (coreResult ?? []).forEach((tag: string) => tagSet.add(tag));
    return Array.from(tagSet).sort();
  }, [coreResult]);
  return {
    tags,
    isLoading: coreResult === undefined,
  };
}

export function useGetPostCategories() {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const coreResult = useQuery(
    api.core.posts.queries.getPostCategories,
    organizationId ? { organizationId } : {},
  ) as string[] | undefined;
  return useMemo(() => {
    const categories = new Set<string>();
    (coreResult ?? []).forEach((category) => categories.add(category));
    return Array.from(categories).sort();
  }, [coreResult]);
}

// Mutation hooks
export function useCreatePost() {
  const tenant = useTenant();
  const saveEntity = useMutation(api.plugins.entity.mutations.saveEntity);
  const lmsCreatePost = useMutation(api.plugins.lms.posts.mutations.createPost as any);
  return useCallback<
    (input: CreatePostArgs) => Promise<Id<"posts"> | undefined>
  >(
    async (input) => {
      const tenantOrganizationId = getTenantOrganizationId(tenant);
      const normalizedSlug = input.postTypeSlug?.toLowerCase();
      if (!normalizedSlug) {
        throw new Error("postTypeSlug is required for entity creation");
      }

      if (isLmsComponentPostTypeSlug(normalizedSlug)) {
        const id = await lmsCreatePost({
          ...input,
          postTypeSlug: normalizedSlug,
          organizationId: toOrgString(tenantOrganizationId),
        });
        return id as Id<"posts"> | undefined;
      }

      const entity = await saveEntity({
        postTypeSlug: normalizedSlug,
        data: {
          ...input,
          organizationId: toOrgString(tenantOrganizationId),
        },
      });
      return entity?.id as Id<"posts"> | undefined;
    },
    [lmsCreatePost, saveEntity, tenant],
  );
}

export function useUpdatePost() {
  const updateEntity = useMutation(api.plugins.entity.mutations.updateEntity);
  const lmsUpdatePost = useMutation(api.plugins.lms.posts.mutations.updatePost as any);
  return useCallback(
    async (input: UpdatePostArgs) => {
      const normalizedSlug = input.postTypeSlug?.toLowerCase();
      if (!normalizedSlug) {
        throw new Error("postTypeSlug is required for update");
      }

      if (isLmsComponentPostTypeSlug(normalizedSlug)) {
        await lmsUpdatePost({
          id: input.id as string,
          title: input.title,
          content: input.content,
          excerpt: input.excerpt,
          slug: input.slug,
          status: input.status,
          category: input.category,
          tags: input.tags,
          featuredImage: input.featuredImage,
          meta: input.meta ?? undefined,
        });
        return;
      }

      await updateEntity({
        postTypeSlug: normalizedSlug,
        id: input.id as string,
        data: {
          title: input.title,
          content: input.content,
          excerpt: input.excerpt,
          slug: input.slug,
          status: input.status,
          category: input.category,
          tags: input.tags,
          featuredImage: input.featuredImage,
          meta: input.meta ?? undefined,
        },
      });
    },
    [lmsUpdatePost, updateEntity],
  );
}

export function useDeletePost() {
  const deleteEntity = useMutation(api.plugins.entity.mutations.deleteEntity);
  const lmsDeletePost = useMutation(api.plugins.lms.posts.mutations.deletePost as any);
  return useCallback(
    async ({ id, postTypeSlug }: { id: Id<"posts">; postTypeSlug: string }) => {
      if (isLmsComponentPostTypeSlug(postTypeSlug)) {
        await lmsDeletePost({ id: id as unknown as string });
        return;
      }
      await deleteEntity({
        postTypeSlug: postTypeSlug.toLowerCase(),
        id: id as string,
      });
    },
    [deleteEntity, lmsDeletePost],
  );
}

export function useUpdatePostStatus() {
  const updateEntity = useMutation(api.plugins.entity.mutations.updateEntity);
  return useCallback<
    (args: {
      id: Id<"posts"> | string;
      postTypeSlug: string;
      status: "published" | "draft" | "archived";
    }) => Promise<void>
  >(
    async (args) => {
      await updateEntity({
        postTypeSlug: args.postTypeSlug.toLowerCase(),
        id: args.id as string,
        data: { status: args.status },
      });
    },
    [updateEntity],
  );
}

export function useBulkUpdatePostStatus() {
  const updateEntity = useMutation(api.plugins.entity.mutations.updateEntity);
  return useCallback<
    (args: {
      ids: (Id<"posts"> | string)[];
      postTypeSlug: string;
      status: "published" | "draft" | "archived";
    }) => Promise<void>
  >(
    async (args) => {
      await Promise.all(
        args.ids.map((id) =>
          updateEntity({
            postTypeSlug: args.postTypeSlug.toLowerCase(),
            id: id as string,
            data: { status: args.status },
          }),
        ),
      );
    },
    [updateEntity],
  );
}

/**
 * Format a date for display
 */
export function formatPostDate(date: number | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Convert tags string to array
 */
export function parseTags(tagsString: string): string[] {
  return tagsString
    .split(",")
    .map((tag: string) => tag.trim())
    .filter((tag): tag is string => tag.length > 0);
}

/**
 * Generate a slug from a title
 */
export function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
