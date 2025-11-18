"use client";

/**
 * Post Types API Client
 *
 * This module provides client functions to interact with the post types API.
 */
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  PORTAL_TENANT_ID,
  getTenantOrganizationId,
} from "~/lib/tenant-fetcher";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { useCallback } from "react";
import { useTenant } from "~/context/TenantContext";

const resolvePortalAwareOrganizationId = (
  tenant: ReturnType<typeof useTenant>,
) => getTenantOrganizationId(tenant) ?? PORTAL_TENANT_ID;

/**
 * Hook to get all post types
 */
export function usePostTypes(includeBuiltIn = true): {
  data: Doc<"postTypes">[];
  isLoading: boolean;
} {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const args = organizationId
    ? { includeBuiltIn, organizationId }
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
  const organizationId = getTenantOrganizationId(tenant);
  return useQuery(
    api.core.postTypes.queries.get,
    id
      ? {
          id,
          organizationId,
        }
      : "skip",
  );
}

/**
 * Hook to get a post type by slug
 */
export function usePostTypeBySlug(slug: string | undefined) {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  return useQuery(
    api.core.postTypes.queries.getBySlug,
    slug
      ? {
          slug,
          organizationId,
        }
      : "skip",
  );
}

export function usePostTypeFields(
  slug: string | null | undefined,
  includeSystem = true,
): {
  data: Doc<"postTypeFields">[];
  isLoading: boolean;
} {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const args = slug
    ? {
        slug,
        includeSystem,
        ...(organizationId ? { organizationId } : {}),
      }
    : "skip";
  const result = useQuery(api.core.postTypes.queries.fieldsBySlug, args) as
    | Doc<"postTypeFields">[]
    | undefined;
  if (!slug) {
    return { data: [], isLoading: false };
  }
  return {
    data: result ?? [],
    isLoading: result === undefined,
  };
}

/**
 * Hook for creating a post type
 */
export function useCreatePostType() {
  const tenant = useTenant();
  const mutate = useMutation(api.core.postTypes.mutations.create);
  type MutationArgs = Parameters<typeof mutate>[0];

  return useCallback(
    async (
      args: Omit<MutationArgs, "organizationId"> & {
        organizationId?: MutationArgs["organizationId"];
      },
    ) => {
      const payload: MutationArgs = {
        ...args,
        organizationId:
          args.organizationId ?? getTenantOrganizationId(tenant) ?? undefined,
      };
      return await mutate(payload);
    },
    [mutate, tenant],
  );
}

export function useEnsurePostTypeAccess() {
  const tenant = useTenant();
  const organizationId = resolvePortalAwareOrganizationId(tenant);
  const mutate = useMutation(
    api.core.postTypes.mutations.enableForOrganization,
  );
  type MutationArgs = Parameters<typeof mutate>[0];

  return useCallback(
    async (slug: string) => {
      if (!organizationId) {
        throw new Error("No tenant selected");
      }
      const payload: MutationArgs = {
        slug,
        organizationId,
      };
      return await mutate(payload);
    },
    [mutate, organizationId],
  );
}

export function useDisablePostTypeAccess() {
  const tenant = useTenant();
  const organizationId = resolvePortalAwareOrganizationId(tenant);
  const mutate = useMutation(
    api.core.postTypes.mutations.disableForOrganization,
  );
  type MutationArgs = Parameters<typeof mutate>[0];

  return useCallback(
    async (slug: string) => {
      if (!organizationId) {
        throw new Error("No tenant selected");
      }
      const payload: MutationArgs = {
        slug,
        organizationId,
      };

      const result = await mutate(payload);
      console.log("[disablePostTypeAccess] result", result);
      return result;
    },
    [mutate, organizationId],
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
