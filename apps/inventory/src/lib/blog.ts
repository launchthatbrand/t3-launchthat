import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

export type PostStatus = "draft" | "published" | "archived";

export interface Post {
  _id: Id<"posts">;
  _creationTime: number;
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  status: PostStatus;
  category: string;
  slug: string;
  authorId?: Id<"users">;
  createdAt: number;
  updatedAt?: number;
  featuredImageUrl?: string;
  featured?: boolean;
  readTime?: string;
  author?: {
    _id: Id<"users">;
    name: string;
    imageUrl?: string;
  };
}

export interface PostFilters {
  status?: PostStatus;
  authorId?: Id<"users">;
  category?: string;
  tags?: string[];
  featured?: boolean;
}

export interface PostFormData {
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  status: PostStatus;
  category: string;
  slug?: string;
  featuredImageUrl?: string;
  featured?: boolean;
  readTime?: string;
}

export interface PostsQueryResult {
  posts: Post[];
  hasMore: boolean;
  cursor: string | null;
}

export interface CategoryResult {
  name: string;
  count: number;
}

/**
 * Hook to get all blog posts with optional filtering
 */
export function useAllPosts(filters?: PostFilters) {
  const result = useQuery(api.cms.queries.getAllPosts, { filters });

  return {
    data: result,
    isLoading: result === undefined,
  };
}

/**
 * Hook to get a post by ID
 */
export function usePost(postId: Id<"posts"> | null) {
  const result = useQuery(
    api.cms.queries.getPostById,
    postId ? { id: postId } : "skip",
  );

  return {
    data: result,
    isLoading: result === undefined,
  };
}

/**
 * Hook to get a post by slug
 */
export function usePostBySlug(slug: string | null) {
  const result = useQuery(
    api.cms.queries.getPostBySlug,
    slug ? { slug } : "skip",
  );

  return {
    data: result,
    isLoading: result === undefined,
  };
}

/**
 * Hook to search posts
 */
export function useSearchPosts(
  searchTerm: string,
  filters?: { status?: PostStatus; category?: string },
) {
  const result = useQuery(
    api.cms.queries.searchPosts,
    searchTerm ? { searchTerm, filters } : "skip",
  );

  return {
    data: result,
    isLoading: result === undefined,
  };
}

/**
 * Hook to get all post tags
 */
export function usePostTags() {
  const result = useQuery(api.cms.queries.getPostTags, {});

  return {
    data: result,
    isLoading: result === undefined,
  };
}

/**
 * Hook to get all post categories
 */
export function usePostCategories() {
  const result = useQuery(api.cms.queries.getPostCategories, {});

  return {
    data: result || [],
    isLoading: result === undefined,
    mutate: () => {},
  };
}

/**
 * Hook for creating a new post
 */
export function useCreatePost() {
  return useMutation(api.cms.mutations.createPost);
}

/**
 * Hook for updating an existing post
 */
export function useUpdatePost() {
  return useMutation(api.cms.mutations.updatePost);
}

/**
 * Hook for deleting a post
 */
export function useDeletePost() {
  return useMutation(api.cms.mutations.deletePost);
}

/**
 * Hook for updating a post's status
 */
export function useUpdatePostStatus() {
  return useMutation(api.cms.mutations.updatePostStatus);
}

/**
 * Hook for bulk updating post statuses
 */
export function useBulkUpdatePostStatus() {
  return useMutation(api.cms.mutations.bulkUpdatePostStatus);
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
