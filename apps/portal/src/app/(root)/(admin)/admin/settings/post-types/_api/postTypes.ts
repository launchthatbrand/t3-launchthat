"use client";

/**
 * Post Types API Client
 *
 * This module provides client functions to interact with the post types API.
 */
import type { Id } from "@/convex/_generated/dataModel";
import type { InferMutationInput } from "convex/react";
import { useCallback } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

import { useTenant } from "~/context/TenantContext";

/**
 * Hook to get all post types
 */
export function usePostTypes(includeBuiltIn = true) {
  const tenant = useTenant();
  const args = tenant?._id
    ? { includeBuiltIn, organizationId: tenant._id }
    : { includeBuiltIn };
  const result = useQuery(api.core.postTypes.queries.list, args);
  return {
    data: result ?? [],
    isLoading: result === undefined,
  };
}

/**
 * Hook to get a post type by ID
 */
export function usePostType(id: Id<"postTypes"> | undefined) {
  const tenant = useTenant();
  return useQuery(
    api.core.postTypes.queries.get,
    id
      ? {
          id,
          organizationId: tenant?._id ?? undefined,
        }
      : "skip",
  );
}

/**
 * Hook to get a post type by slug
 */
export function usePostTypeBySlug(slug: string | undefined) {
  const tenant = useTenant();
  return useQuery(
    api.core.postTypes.queries.getBySlug,
    slug
      ? {
          slug,
          organizationId: tenant?._id ?? undefined,
        }
      : "skip",
  );
}

/**
 * Hook for creating a post type
 */
type CreatePostTypeArgs = InferMutationInput<
  typeof api.core.postTypes.mutations.create
>;

export function useCreatePostType() {
  const tenant = useTenant();
  const mutate = useMutation(api.core.postTypes.mutations.create);

  return useCallback(
    async (
      args: Omit<CreatePostTypeArgs, "organizationId"> & {
        organizationId?: CreatePostTypeArgs["organizationId"];
      },
    ) => {
      const payload: CreatePostTypeArgs = {
        ...args,
        organizationId: args.organizationId ?? tenant?._id ?? undefined,
      };
      return await mutate(payload);
    },
    [mutate, tenant?._id],
  );
}

type EnablePostTypeAccessArgs = InferMutationInput<
  typeof api.core.postTypes.mutations.enableForOrganization
>;

export function useEnsurePostTypeAccess() {
  const tenant = useTenant();
  const mutate = useMutation(
    api.core.postTypes.mutations.enableForOrganization,
  );

  return useCallback(
    async (slug: string) => {
      if (!tenant?._id) {
        throw new Error("No tenant selected");
      }
      const payload: EnablePostTypeAccessArgs = {
        slug,
        organizationId: tenant._id,
      };
      return await mutate(payload);
    },
    [mutate, tenant?._id],
  );
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
