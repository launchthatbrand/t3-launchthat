import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useCallback, useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

import type { CommerceComponentPostId } from "~/lib/postTypes/customAdapters";
import { useTenant } from "~/context/TenantContext";
import {
  adaptCommercePostToPortal,
  decodeCommerceSyntheticId,
  encodeCommerceSyntheticId,
  isCommercePostSlug,
} from "~/lib/postTypes/customAdapters";
import { getTenantOrganizationId } from "./tenant-fetcher";

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

// Posts Types - extend with more post metadata
export interface PostFilter {
  status?: "published" | "draft" | "archived";
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
  status: "published" | "draft" | "archived";
  category?: string;
  tags?: string[];
  featuredImage?: string;
  postTypeSlug?: string;
  meta?: Record<string, string | number | boolean | null>;
}

export interface UpdatePostArgs {
  id: Id<"posts">;
  title?: string;
  content?: string;
  excerpt?: string;
  slug?: string;
  status?: "published" | "draft" | "archived";
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

const toCommerceOrganizationId = (
  organizationId?: Id<"organizations"> | null,
): string | undefined =>
  organizationId ? (organizationId as unknown as string) : undefined;

/**
 * Custom hooks for posts
 */

// Query hooks
export function useGetAllPosts(filters?: PostFilter) {
  const tenant = useTenant();
  const tenantOrganizationId = getTenantOrganizationId(tenant);
  const args = useMemo(() => {
    const params: {
      organizationId?: Id<"organizations">;
      filters?: PostFilter;
    } = {};
    if (tenantOrganizationId) {
      params.organizationId = tenantOrganizationId;
    }
    if (filters) {
      params.filters = filters;
    }
    return params;
  }, [tenantOrganizationId, filters]);
  const targetSlug = filters?.postTypeSlug?.toLowerCase();
  const isCommerceType = targetSlug ? isCommercePostSlug(targetSlug) : false;
  const commerceArgs = useMemo(() => {
    if (!isCommerceType || !targetSlug) {
      return "skip" as const;
    }
    const payload: {
      organizationId?: string;
      filters?: PostFilter;
    } = {};
    const orgIdString = toCommerceOrganizationId(tenantOrganizationId);
    if (orgIdString) {
      payload.organizationId = orgIdString;
    }
    payload.filters = {
      ...filters,
      postTypeSlug: targetSlug,
    };
    return payload;
  }, [filters, isCommerceType, targetSlug, tenantOrganizationId]);
  const commercePostsResult = useQuery(
    api.commercePosts.getAllPosts,
    commerceArgs,
  );
  const postsResult = useQuery(
    api.core.posts.queries.getAllPosts,
    isCommerceType ? "skip" : args,
  );
  const posts = useMemo(() => {
    if (isCommerceType) {
      return (commercePostsResult ?? []).map(adaptCommercePostToPortal);
    }
    return postsResult ?? [];
  }, [commercePostsResult, isCommerceType, postsResult]);
  return {
    posts,
    isLoading: isCommerceType
      ? commercePostsResult === undefined
      : postsResult === undefined,
  };
}

export function useGetPostById(
  id: Id<"posts"> | undefined,
): Doc<"posts"> | null | undefined {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const commerceInfo = id ? decodeCommerceSyntheticId(id) : null;
  const commercePostResult = useQuery(
    api.commercePosts.getPostById,
    commerceInfo
      ? ({
          id: commerceInfo.componentId,
          organizationId: toCommerceOrganizationId(organizationId),
        } as const)
      : "skip",
  );
  const postArgs = useMemo(() => {
    if (!id || commerceInfo) {
      return "skip" as const;
    }
    return organizationId ? { id, organizationId } : { id };
  }, [commerceInfo, id, organizationId]);
  const postResult = useQuery(api.core.posts.queries.getPostById, postArgs);
  if (commerceInfo) {
    if (commercePostResult === undefined) {
      return undefined;
    }
    if (commercePostResult === null) {
      return null;
    }
    return adaptCommercePostToPortal(commercePostResult);
  }
  return postResult;
}

export function useGetPostBySlug(slug: string | undefined) {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const normalizedSlug = slug?.toLowerCase();
  const isCommerce = normalizedSlug
    ? isCommercePostSlug(normalizedSlug)
    : false;
  const commerceResult = useQuery(
    api.commercePosts.getPostBySlug,
    slug && isCommerce
      ? (() => {
          const orgIdString = toCommerceOrganizationId(organizationId);
          return orgIdString
            ? { slug: normalizedSlug ?? slug, organizationId: orgIdString }
            : { slug: normalizedSlug ?? slug };
        })()
      : "skip",
  );
  const portalResult = useQuery(
    api.core.posts.queries.getPostBySlug,
    slug && !isCommerce
      ? organizationId
        ? { slug, organizationId }
        : { slug }
      : "skip",
  );
  return useMemo(() => {
    if (isCommerce) {
      if (commerceResult === undefined || commerceResult === null) {
        return commerceResult;
      }
      return adaptCommercePostToPortal(commerceResult);
    }
    return portalResult;
  }, [commerceResult, isCommerce, portalResult]);
}

export function useSearchPosts(args: SearchPostArgs) {
  const tenant = useTenant();
  const tenantOrganizationId = getTenantOrganizationId(tenant);
  const params = useMemo(() => {
    if (tenantOrganizationId) {
      return { ...args, organizationId: tenantOrganizationId };
    }
    return args;
  }, [args, tenantOrganizationId]);
  const targetSlug = args.postTypeSlug?.toLowerCase();
  const isCommerceType = targetSlug ? isCommercePostSlug(targetSlug) : false;
  const commerceArgs = useMemo(() => {
    if (!isCommerceType) {
      return "skip" as const;
    }
    const payload: {
      searchTerm: string;
      limit?: number;
      organizationId?: string;
      postTypeSlug?: string;
    } = {
      searchTerm: args.searchTerm,
      limit: args.limit,
      postTypeSlug: targetSlug,
    };
    const orgIdString = toCommerceOrganizationId(tenantOrganizationId);
    if (orgIdString) {
      payload.organizationId = orgIdString;
    }
    return payload;
  }, [
    args.limit,
    args.searchTerm,
    isCommerceType,
    targetSlug,
    tenantOrganizationId,
  ]);
  const commerceResults = useQuery(api.commercePosts.searchPosts, commerceArgs);
  const portalResults = useQuery(
    api.core.posts.queries.searchPosts,
    isCommerceType ? "skip" : params,
  );
  return useMemo(() => {
    if (isCommerceType) {
      return (commerceResults ?? []).map(adaptCommercePostToPortal);
    }
    return portalResults;
  }, [commerceResults, isCommerceType, portalResults]);
}

export function useGetPostTags() {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const coreArgs = useMemo(
    () => (organizationId ? { organizationId } : {}),
    [organizationId],
  );
  const commerceArgs = useMemo(() => {
    const payload: { organizationId?: string } = {};
    const orgIdString = toCommerceOrganizationId(organizationId);
    if (orgIdString) {
      payload.organizationId = orgIdString;
    }
    return payload;
  }, [organizationId]);
  const coreResult = useQuery(api.core.posts.queries.getPostTags, coreArgs) as
    | string[]
    | undefined;
  const commerceResult = useQuery(
    api.commercePosts.getPostTags,
    commerceArgs,
  ) as string[] | undefined;
  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    (coreResult ?? []).forEach((tag) => tagSet.add(tag));
    (commerceResult ?? []).forEach((tag) => tagSet.add(tag));
    return Array.from(tagSet).sort();
  }, [commerceResult, coreResult]);
  return {
    tags,
    isLoading: coreResult === undefined || commerceResult === undefined,
  };
}

export function useGetPostCategories() {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const coreArgs = useMemo(
    () => (organizationId ? { organizationId } : {}),
    [organizationId],
  );
  const commerceArgs = useMemo(() => {
    const payload: { organizationId?: string } = {};
    const orgIdString = toCommerceOrganizationId(organizationId);
    if (orgIdString) {
      payload.organizationId = orgIdString;
    }
    return payload;
  }, [organizationId]);
  const coreResult = useQuery(
    api.core.posts.queries.getPostCategories,
    coreArgs,
  ) as string[] | undefined;
  const commerceResult = useQuery(
    api.commercePosts.getPostCategories,
    commerceArgs,
  ) as string[] | undefined;
  return useMemo(() => {
    const categories = new Set<string>();
    (coreResult ?? []).forEach((category) => categories.add(category));
    (commerceResult ?? []).forEach((category) => categories.add(category));
    return Array.from(categories).sort();
  }, [commerceResult, coreResult]);
}

// Mutation hooks
export function useCreatePost() {
  const tenant = useTenant();
  const mutate = useMutation(api.core.posts.mutations.createPost);
  const createCommercePost = useMutation(api.commercePosts.createPost);
  return useCallback<
    (input: CreatePostArgs) => Promise<Id<"posts"> | undefined>
  >(
    async (input) => {
      const tenantOrganizationId = getTenantOrganizationId(tenant);
      const organizationId = tenantOrganizationId ?? undefined;
      const normalizedSlug = input.postTypeSlug?.toLowerCase();
      if (normalizedSlug && isCommercePostSlug(normalizedSlug)) {
        const componentId = await createCommercePost({
          title: input.title,
          content: input.content,
          excerpt: input.excerpt,
          slug: input.slug,
          status: input.status,
          category: input.category,
          tags: input.tags,
          featuredImage: input.featuredImage,
          postTypeSlug: normalizedSlug,
          meta: input.meta ?? undefined,
          organizationId: toCommerceOrganizationId(tenantOrganizationId),
        });
        return encodeCommerceSyntheticId(normalizedSlug, componentId);
      }
      return mutate({
        ...input,
        organizationId,
      });
    },
    [createCommercePost, mutate, tenant],
  );
}

export function useUpdatePost() {
  const updatePost = useMutation(api.core.posts.mutations.updatePost);
  const updateCommercePost = useMutation(api.commercePosts.updatePost);
  return useCallback(
    async (input: UpdatePostArgs) => {
      const commerceInfo = decodeCommerceSyntheticId(input.id);
      const normalizedSlug =
        input.postTypeSlug?.toLowerCase() ?? commerceInfo?.slug;
      if (normalizedSlug && isCommercePostSlug(normalizedSlug)) {
        if (!commerceInfo) {
          throw new Error("Invalid commerce identifier.");
        }
        await updateCommercePost({
          id: commerceInfo.componentId,
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
      await updatePost(input);
    },
    [updateCommercePost, updatePost],
  );
}

export function useDeletePost() {
  const deletePost = useMutation(api.core.posts.mutations.deletePost);
  const deleteCommercePost = useMutation(api.commercePosts.deletePost);
  return useCallback(
    async ({ id }: { id: Id<"posts"> }) => {
      const commerceInfo = decodeCommerceSyntheticId(id);
      if (commerceInfo) {
        await deleteCommercePost({ id: commerceInfo.componentId });
        return;
      }
      await deletePost({ id });
    },
    [deleteCommercePost, deletePost],
  );
}

export function useUpdatePostStatus() {
  const updatePostStatus = useMutation(
    api.core.posts.mutations.updatePostStatus,
  );
  const updateCommerceStatus = useMutation(api.commercePosts.updatePostStatus);
  return useCallback<
    (args: {
      id: Id<"posts">;
      status: "published" | "draft" | "archived";
    }) => Promise<void>
  >(
    async (args) => {
      const commerceInfo = decodeCommerceSyntheticId(args.id);
      if (commerceInfo) {
        await updateCommerceStatus({
          id: commerceInfo.componentId,
          status: args.status,
        });
        return;
      }
      await updatePostStatus(args);
    },
    [updateCommerceStatus, updatePostStatus],
  );
}

export function useBulkUpdatePostStatus() {
  const bulkUpdate = useMutation(api.core.posts.mutations.bulkUpdatePostStatus);
  const bulkUpdateCommerce = useMutation(
    api.commercePosts.bulkUpdatePostStatus,
  );
  return useCallback<
    (args: {
      ids: Id<"posts">[];
      status: "published" | "draft" | "archived";
    }) => Promise<void>
  >(
    async (args) => {
      const commerceIds: CommerceComponentPostId[] = [];
      const coreIds: Id<"posts">[] = [];
      args.ids.forEach((postId) => {
        const info = decodeCommerceSyntheticId(postId);
        if (info) {
          commerceIds.push(info.componentId);
        } else {
          coreIds.push(postId);
        }
      });
      await Promise.all([
        commerceIds.length > 0
          ? bulkUpdateCommerce({ ids: commerceIds, status: args.status })
          : Promise.resolve(),
        coreIds.length > 0
          ? bulkUpdate({ ids: coreIds, status: args.status })
          : Promise.resolve(),
      ]);
    },
    [bulkUpdate, bulkUpdateCommerce],
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
