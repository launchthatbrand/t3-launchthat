/**
 * Content Types API Client
 *
 * This module provides client functions to interact with the content types API.
 */
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

/**
 * Hook to get all content types
 */
export function useContentTypes(includeBuiltIn = true) {
  // Note: We don't check if the API exists - let Convex handle any errors
  return useQuery(api.cms.contentTypes.list, { includeBuiltIn });
}

/**
 * Hook to get a specific content type by ID
 */
export function useContentType(id: Id<"contentTypes"> | null) {
  return useQuery(api.cms.contentTypes.get, id ? { id } : "skip");
}

/**
 * Hook to get a specific content type by slug
 */
export function useContentTypeBySlug(slug: string | null) {
  return useQuery(api.cms.contentTypes.getBySlug, slug ? { slug } : "skip");
}

/**
 * Hook to create a new content type
 */
export function useCreateContentType() {
  return useMutation(api.cms.contentTypes.create);
}

/**
 * Hook to update a content type
 */
export function useUpdateContentType() {
  return useMutation(api.cms.contentTypes.update);
}

/**
 * Hook to delete a content type
 */
export function useDeleteContentType() {
  return useMutation(api.cms.contentTypes.remove);
}

/**
 * Hook to add a field to a content type
 */
export function useAddField() {
  return useMutation(api.cms.contentTypes.addField);
}

/**
 * Hook to update a field
 */
export function useUpdateField() {
  return useMutation(api.cms.contentTypes.updateField);
}

/**
 * Hook to remove a field
 */
export function useRemoveField() {
  return useMutation(api.cms.contentTypes.removeField);
}

/**
 * Hook to initialize the CMS system with built-in content types
 */
export function useInitCmsSystem() {
  return useMutation(api.cms.init.index.initSystem);
}

/**
 * Hook to reset the CMS system (for development only)
 */
export function useResetCmsSystem() {
  return useMutation(api.cms.init.index.resetSystem);
}

/**
 * Hook to update all content type entry counts
 */
export function useUpdateEntryCounts() {
  return useMutation(api.cms.contentTypes.updateEntryCounts);
}
