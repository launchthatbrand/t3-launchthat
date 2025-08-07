/**
 * Content Types API Client
 *
 * This module provides client functions to interact with the content types API.
 */
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

/**
 * Hook to get all content types
 */
export function useContentTypes(includeBuiltIn = false) {
  const result = useQuery(api.core.contentTypes.queries.list, {
    includeBuiltIn,
  });
  return {
    data: result ?? [],
    isLoading: result === undefined,
  };
}

/**
 * Hook to get a content type by ID
 */
export function useContentType(id: Id<"contentTypes"> | undefined) {
  return useQuery(api.core.contentTypes.get, id ? { id } : "skip");
}

/**
 * Hook to get a content type by slug
 */
export function useContentTypeBySlug(slug: string | undefined) {
  return useQuery(api.core.contentTypes.getBySlug, slug ? { slug } : "skip");
}

/**
 * Hook for creating a content type
 */
export function useCreateContentType() {
  return useMutation(api.core.contentTypes.create);
}

/**
 * Hook for updating a content type
 */
export function useUpdateContentType() {
  return useMutation(api.core.contentTypes.update);
}

/**
 * Hook for deleting a content type
 */
export function useDeleteContentType() {
  return useMutation(api.core.contentTypes.remove);
}

/**
 * Hook for adding a field to a content type
 */
export function useAddContentTypeField() {
  return useMutation(api.core.contentTypes.addField);
}

/**
 * Hook for updating a content type field
 */
export function useUpdateContentTypeField() {
  return useMutation(api.core.contentTypes.updateField);
}

/**
 * Hook for removing a field from a content type
 */
export function useRemoveContentTypeField() {
  return useMutation(api.core.contentTypes.mutations.removeField);
}

/**
 * Hook for initializing the CMS system
 */
export function useInitSystem() {
  return useMutation(api.core.contentTypes.mutations.initSystem);
}

/**
 * Hook for resetting the CMS system
 */
export function useResetSystem() {
  return useMutation(api.core.contentTypes.mutations.resetSystem);
}

/**
 * Hook for updating entry counts
 */
export function useUpdateEntryCounts() {
  return useMutation(api.core.contentTypes.updateEntryCounts);
}
