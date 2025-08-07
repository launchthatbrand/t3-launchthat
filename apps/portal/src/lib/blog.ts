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
  const result = useQuery(api.core.posts.getAllPosts, { filters });
  return {
    posts: result ?? [],
    isLoading: result === undefined,
  };
}

export function useGetPostById(id: Id<"posts"> | undefined) {
  return useQuery(api.core.posts.getPostById, id ? { id } : "skip");
}

export function useGetPostBySlug(slug: string | undefined) {
  return useQuery(api.core.posts.getPostBySlug, slug ? { slug } : "skip");
}

export function useSearchPosts(args: SearchPostArgs) {
  return useQuery(api.core.posts.searchPosts, args);
}

export function useGetPostTags() {
  const result = useQuery(api.core.posts.getPostTags, {});
  return {
    tags: result ?? [],
    isLoading: result === undefined,
  };
}

export function useGetPostCategories() {
  const result = useQuery(api.core.posts.getPostCategories, {});
  return {
    categories: result ?? [],
    isLoading: result === undefined,
  };
}

// Mutation hooks
export function useCreatePost() {
  return useMutation(api.core.posts.createPost);
}

export function useUpdatePost() {
  return useMutation(api.core.posts.updatePost);
}

export function useDeletePost() {
  return useMutation(api.core.posts.deletePost);
}

export function useUpdatePostStatus() {
  return useMutation(api.core.posts.updatePostStatus);
}

export function useBulkUpdatePostStatus() {
  return useMutation(api.core.posts.bulkUpdatePostStatus);
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
