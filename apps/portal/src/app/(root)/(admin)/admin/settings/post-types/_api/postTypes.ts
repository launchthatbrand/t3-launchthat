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
import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";

import type { PluginPostTypeConfig } from "~/lib/plugins/types";
import { api } from "@/convex/_generated/api";
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
  const ensureDefaults = useMutation(
    api.core.postTypes.mutations.ensureDefaults,
  );
  const hasEnsuredRef = useRef(false);
  useEffect(() => {
    if (hasEnsuredRef.current) {
      return;
    }
    hasEnsuredRef.current = true;
    void ensureDefaults({}).catch((error) => {
      console.error("Failed to ensure default post types", error);
    });
  }, [ensureDefaults]);
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
  const result = useQuery(api.core.postTypes.queries.fieldsBySlug, args);
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

type PostTypeDefinitionPayload = Pick<
  PluginPostTypeConfig,
  | "name"
  | "description"
  | "isPublic"
  | "enableApi"
  | "includeTimestamps"
  | "enableVersioning"
  | "pageTemplateSlug"
  | "supports"
  | "rewrite"
  | "adminMenu"
  | "storageKind"
  | "storageTables"
  | "storageComponent"
  | "metaBoxes"
>;

const pickPostTypeDefinition = (
  definition: PluginPostTypeConfig,
): PostTypeDefinitionPayload => ({
  name: definition.name,
  description: definition.description,
  isPublic: definition.isPublic,
  enableApi: definition.enableApi,
  includeTimestamps: definition.includeTimestamps,
  enableVersioning: definition.enableVersioning,
  pageTemplateSlug: definition.pageTemplateSlug,
  supports: definition.supports,
  rewrite: definition.rewrite,
  adminMenu: definition.adminMenu,
  storageKind: definition.storageKind,
  storageTables: definition.storageTables,
  storageComponent: definition.storageComponent,
  metaBoxes: definition.metaBoxes,
});

export function useEnsurePostTypeAccess() {
  const tenant = useTenant();
  const organizationId = resolvePortalAwareOrganizationId(tenant);
  const mutate = useMutation(
    api.core.postTypes.mutations.enableForOrganization,
  );
  type MutationArgs = Parameters<typeof mutate>[0];

  return useCallback(
    async (slugOrDefinition: string | PluginPostTypeConfig) => {
      if (!organizationId) {
        throw new Error("No tenant selected");
      }
      const hasDefinition = typeof slugOrDefinition !== "string";
      const slug = hasDefinition ? slugOrDefinition.slug : slugOrDefinition;
      const payload: MutationArgs = {
        slug,
        organizationId,
        definition: hasDefinition
          ? pickPostTypeDefinition(slugOrDefinition)
          : undefined,
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
