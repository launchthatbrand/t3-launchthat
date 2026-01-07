"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";

import { useConvexUser } from "~/hooks/useConvexUser";

type PermissionLevel = "none" | "own" | "group" | "all";
type PermissionScope = "global" | "group" | "course" | "organization";

type PermissionsMap = Record<string, PermissionLevel>;

interface UsePermissionsResult {
  /**
   * Map of permission keys to their levels for the current user
   */
  permissions: PermissionsMap;
  /**
   * Check if the current user has a specific permission
   */
  hasPermission: (
    permissionKey: string,
    resourceOwnerId?: Id<"users">,
    scopeType?: PermissionScope,
    scopeId?: string,
  ) => boolean;
  /**
   * Check permission directly from the server (more accurate but slower)
   */
  checkPermission: (
    permissionKey: string,
    resourceOwnerId?: Id<"users">,
    scopeType?: PermissionScope,
    scopeId?: string,
  ) => Promise<boolean>;
  /**
   * Loading state for permissions
   */
  loading: boolean;
  /**
   * Error state for permissions
   */
  error: Error | null;
}

/**
 * Hook for checking user permissions
 */
export function usePermissions(
  scopeType?: PermissionScope,
  scopeId?: string,
): UsePermissionsResult {
  const { convexId: userId, isLoading: userLoading } = useConvexUser();
  const [error, setError] = useState<Error | null>(null);

  // Get all permissions for the current user
  const permissionsResult = useQuery(
    api.permissions.getUserPermissions,
    userId ? { scopeType, scopeId } : "skip",
  );

  // For direct permission checking
  const checkPermissionMutation = useQuery(api.permissions.checkPermission);

  const hasPermission = useCallback(
    (
      permissionKey: string,
      resourceOwnerId?: Id<"users">,
      permScopeType?: PermissionScope,
      permScopeId?: string,
    ): boolean => {
      if (!permissionsResult || !userId) return false;

      // Get the permission level
      const level = permissionsResult[permissionKey];
      if (!level || level === "none") return false;

      // If permission level is "all", always grant access
      if (level === "all") return true;

      // If permission level is "own", check if the user is the owner
      if (level === "own" && resourceOwnerId) {
        return resourceOwnerId === userId;
      }

      // If permission level is "group", we would need to check if the user is in the same group
      // but for simplicity in this implementation, we'll just check the provided scope
      if (level === "group" && permScopeType === "group" && permScopeId) {
        // In a real implementation, we would check if the user is in the group
        // For now, we'll assume true if scopeType is "group" and a scopeId is provided
        return true;
      }

      // Default to true for "own" without a specific resource owner (can act on own resources)
      if (level === "own") return true;

      // Default to false for any other cases
      return false;
    },
    [permissionsResult, userId],
  );

  // Function to check permission directly from the server
  const checkPermission = useCallback(
    async (
      permissionKey: string,
      resourceOwnerId?: Id<"users">,
      permScopeType?: PermissionScope,
      permScopeId?: string,
    ): Promise<boolean> => {
      if (!checkPermissionMutation || !userId) return false;

      try {
        return await checkPermissionMutation({
          permissionKey,
          scopeType: permScopeType || scopeType,
          scopeId: permScopeId || scopeId,
          resourceOwnerId,
        });
      } catch (err) {
        console.error("Error checking permission:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        return false;
      }
    },
    [checkPermissionMutation, userId, scopeType, scopeId],
  );

  return {
    permissions: permissionsResult || {},
    hasPermission,
    checkPermission,
    loading: permissionsResult === undefined,
    error,
  };
}

/**
 * Hook for checking if a user has a specific permission
 */
export function useHasPermission(
  permissionKey: string,
  resourceOwnerId?: Id<"users">,
  scopeType?: PermissionScope,
  scopeId?: string,
): boolean {
  const { convexId: userId } = useConvexUser();

  // Query the permission directly
  const hasPermission = useQuery(
    api.permissions.checkPermission,
    userId
      ? {
          permissionKey,
          resourceOwnerId,
          scopeType,
          scopeId,
        }
      : "skip",
  );

  return hasPermission ?? false;
}

/**
 * Hook for assigning a role to a user
 */
export function useAssignRole() {
  const assignRole = useMutation(api.permissions.assignRole);

  const assignRoleToUser = useCallback(
    async (
      userId: Id<"users">,
      roleId: Id<"roles">,
      scopeType?: PermissionScope,
      scopeId?: string,
    ) => {
      try {
        return await assignRole({
          userId,
          roleId,
          scopeType,
          scopeId,
        });
      } catch (error) {
        console.error("Error assigning role:", error);
        throw error;
      }
    },
    [assignRole],
  );

  return assignRoleToUser;
}
