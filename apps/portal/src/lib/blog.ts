import type { Id } from "@/convex/_generated/dataModel";
import { useCallback, useMemo } from "react";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

import { useTenant } from "~/context/TenantContext";

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
}

/**
 * Custom hooks for posts
 */

// Query hooks
export function useGetAllPosts(filters?: PostFilter) {
  const tenant = useTenant();
  const args = useMemo(() => {
    const params: {
      organizationId?: Id<"organizations">;
      filters?: PostFilter;
    } = {};
    if (tenant?._id) {
      params.organizationId = tenant._id;
    }
    if (filters) {
      params.filters = filters;
    }
    return params;
  }, [tenant?._id, filters]);

  const result = useQuery(api.core.posts.queries.getAllPosts, args);
  return {
    posts: result ?? [],
    isLoading: result === undefined,
  };
}

export function useGetPostById(id: Id<"posts"> | undefined) {
  const tenant = useTenant();
  const args = id
    ? tenant?._id
      ? { id, organizationId: tenant._id }
      : { id }
    : "skip";
  return useQuery(api.core.posts.queries.getPostById, args);
}

export function useGetPostBySlug(slug: string | undefined) {
  const tenant = useTenant();
  return useQuery(
    api.core.posts.queries.getPostBySlug,
    slug
      ? tenant?._id
        ? { slug, organizationId: tenant._id }
        : { slug }
      : "skip",
  );
}

export function useSearchPosts(args: SearchPostArgs) {
  const tenant = useTenant();
  const params = useMemo(() => {
    if (tenant?._id) {
      return { ...args, organizationId: tenant._id };
    }
    return args;
  }, [args, tenant?._id]);

  return useQuery(api.core.posts.queries.searchPosts, params);
}

export function useGetPostTags() {
  const tenant = useTenant();
  const args = tenant?._id ? { organizationId: tenant._id } : {};
  const result = useQuery(api.core.posts.queries.getPostTags, args);
  return {
    tags: result ?? [],
    isLoading: result === undefined,
  };
}

export function useGetPostCategories() {
  const tenant = useTenant();
  const args = tenant?._id ? { organizationId: tenant._id } : {};
  const result = useQuery(api.core.posts.queries.getPostCategories, args);
  return result;
}

// Mutation hooks
export function useCreatePost() {
  const tenant = useTenant();
  const mutate = useMutation(api.core.posts.mutations.createPost);
  return useCallback<
    (input: CreatePostArgs) => Promise<Id<"posts"> | undefined>
  >(
    (input) =>
      mutate({
        ...input,
        organizationId: tenant?._id ?? undefined,
      }),
    [mutate, tenant?._id],
  );
}

export function useUpdatePost() {
  return useMutation(api.core.posts.mutations.updatePost);
}

export function useDeletePost() {
  return useMutation(api.core.posts.mutations.deletePost);
}

export function useUpdatePostStatus() {
  return useMutation(api.core.posts.mutations.updatePostStatus);
}

export function useBulkUpdatePostStatus() {
  return useMutation(api.core.posts.mutations.bulkUpdatePostStatus);
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
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "");
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
