import { useMutation, useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Posts Types - extend with more post metadata
export interface PostFilter {
  status?: "published" | "draft" | "archived";
  category?: string;
  authorId?: Id<"users">;
  limit?: number;
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
  const result = useQuery(api.core.posts.queries.getAllPosts, { filters });
  return {
    posts: result ?? [],
    isLoading: result === undefined,
  };
}

export function useGetPostById(id: Id<"posts"> | undefined) {
  return useQuery(api.core.posts.queries.getPostById, id ? { id } : "skip");
}

export function useGetPostBySlug(slug: string | undefined) {
  return useQuery(
    api.core.posts.queries.getPostBySlug,
    slug ? { slug } : "skip",
  );
}

export function useSearchPosts(args: SearchPostArgs) {
  return useQuery(api.core.posts.queries.searchPosts, args);
}

export function useGetPostTags() {
  const result = useQuery(api.core.posts.queries.getPostTags, {});
  return {
    tags: result ?? [],
    isLoading: result === undefined,
  };
}

export function useGetPostCategories() {
  const result = useQuery(api.core.posts.queries.getPostCategories, {});
  return {
    categories: result ?? [],
    isLoading: result === undefined,
  };
}

// Mutation hooks
export function useCreatePost() {
  return useMutation(api.core.posts.mutations.createPost);
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
export function formatPostDate(date: number): string {
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
