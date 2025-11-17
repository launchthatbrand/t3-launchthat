"use client";

/**
 * Post Types API Client
 *
 * This module provides client functions to interact with the post types API.
 */
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

/**
 * Hook to get all post types
 */
export function usePostTypes(includeBuiltIn = true) {
  const result = useQuery(api.core.postTypes.queries.list, {
    includeBuiltIn,
  });
  return {
    data: result ?? [],
    isLoading: result === undefined,
  };
}

/**
 * Hook to get a post type by ID
 */
export function usePostType(id: Id<"postTypes"> | undefined) {
  return useQuery(api.core.postTypes.queries.get, id ? { id } : "skip");
}

/**
 * Hook to get a post type by slug
 */
export function usePostTypeBySlug(slug: string | undefined) {
  return useQuery(
    api.core.postTypes.queries.getBySlug,
    slug ? { slug } : "skip",
  );
}

/**
 * Hook for creating a post type
 */
export function useCreatePostType() {
  return useMutation(api.core.postTypes.mutations.create);
}

/**
 * Hook for updating a post type
 */
export function useUpdatePostType() {
  return useMutation(api.core.postTypes.mutations.update);
}

/**
 * Hook for deleting a post type
 */
export function useDeletePostType() {
  return useMutation(api.core.postTypes.mutations.remove);
}

/**
 * Hook for adding a field to a post type
 */
export function useAddPostTypeField() {
  return useMutation(api.core.postTypes.mutations.addField);
}

/**
 * Hook for updating a post type field
 */
export function useUpdatePostTypeField() {
  return useMutation(api.core.postTypes.mutations.updateField);
}

/**
 * Hook for removing a field from a post type
 */
export function useRemovePostTypeField() {
  return useMutation(api.core.postTypes.mutations.removeField);
}

/**
 * Hook for initializing the CMS system
 */
export function useInitPostTypes() {
  return useMutation(api.core.postTypes.mutations.initSystem);
}

/**
 * Hook for resetting the CMS system
 */
export function useResetPostTypes() {
  return useMutation(api.core.postTypes.mutations.resetSystem);
}

/**
 * Hook for updating entry counts
 */
export function useUpdatePostTypeEntryCounts() {
  return useMutation(api.core.postTypes.mutations.updateEntryCounts);
}
