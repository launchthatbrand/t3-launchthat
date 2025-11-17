"use client";

import React from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";

type PermissionScope = "global" | "group" | "course" | "organization";
export type PermissionLevel = "none" | "own" | "group" | "all";

interface PermissionGuardProps {
  /**
   * The permission key to check
   */
  permissionKey: string;
  /**
   * The ID of the resource owner (for "own" level permissions)
   */
  resourceOwnerId?: Id<"users">;
  /**
   * The scope type
   */
  scopeType?: PermissionScope;
  /**
   * The scope ID
   */
  scopeId?: string;
  /**
   * Content to render if permission is granted
   */
  children: React.ReactNode;
  /**
   * Optional content to render if permission is denied
   */
  fallback?: React.ReactNode;
  /**
   * Whether to render nothing (not even the fallback) if permission is denied
   */
  renderNothing?: boolean;
  /**
   * Loading state component
   */
  loading?: React.ReactNode;
}

const BYPASS_PERMISSIONS = false; // Set to false to enable permission checks

const DefaultLoadingComponent = () => (
  <div className="flex min-h-[100px] items-center justify-center">
    <p>Loading permissions...</p>
  </div>
);

const DefaultFallbackComponent = ({
  permissionKey,
}: {
  permissionKey: string;
}) => (
  <div className="flex min-h-[200px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
    <h3 className="mb-2 text-lg font-semibold">Permission Denied</h3>
    <p className="text-sm text-muted-foreground">
      You do not have the required permission ({permissionKey}) to access this
      content.
    </p>
  </div>
);

function checkUserPermission(
  userPermissions:
    | { permissionKey: string; level: PermissionLevel }[]
    | undefined,
  currentUserClerkId: string | undefined,
  requiredKey: string,
  resourceOwnerId?: Id<"users">,
  // scopeType?: PermissionScope, // scopeType and scopeId might be relevant for more granular "group" checks
  // scopeId?: string
): boolean {
  if (!userPermissions) return false;

  const permission = userPermissions.find(
    (p) => p.permissionKey === requiredKey,
  );
  if (!permission) return false;

  switch (permission.level) {
    case "all":
      return true;
    case "own":
      // For 'own', resourceOwnerId must be provided and match the current user.
      // Note: In Convex, user._id is the Convex Id, not Clerk Id.
      // This check assumes resourceOwnerId is the Convex Id<"users">.
      // If `resourceOwnerId` is the Clerk ID, this comparison needs adjustment.
      // For now, we assume that if `resourceOwnerId` is present, it's the Convex ID of the owner.
      // The `hasPermissionInternal` query on the backend should use Convex User ID.
      // This client-side check is a bit tricky if we only have Clerk ID readily available.
      // For now, if `resourceOwnerId` is passed, we assume it's the *target* resource's owner.
      // The backend `getMyPermissions` doesn't directly tell us if `resourceOwnerId === currentUserConvexId`.
      // The `hasPermission` query *does* take `resourceOwnerId`.
      // This simplified check on the client is based on the *level* returned from `getMyPermissions`.
      // A more robust client-side check for "own" would be to call the specific `hasPermission` query.
      // However, `getMyPermissions` gives us all permissions, which is efficient.
      // Let's assume for 'own' level from `getMyPermissions`, if resourceOwnerId is passed to PermissionGuard, it must match.
      // This is imperfect because `getMyPermissions` doesn't know about `resourceOwnerId`.
      // The backend `hasPermission` query is the source of truth for specific resource checks.
      // For simplicity here: if level is "own", we need a way to confirm ownership.
      // This component can't easily get the current user's *Convex* ID without another query.
      // Let's defer complex "own" logic to a direct `hasPermission` call if needed, or refine this.
      // For now, if level is "own", we require resourceOwnerId to be explicitly passed and match.
      return !!resourceOwnerId && resourceOwnerId === currentUserClerkId; // This is problematic: resourceOwnerId is Convex ID, currentUserClerkId is Clerk ID
    // This needs to be fixed. For now, this will likely fail "own" checks correctly.
    // A proper fix involves having current user's Convex ID or using the specific `hasPermission` query.
    case "group":
      // If the permission level is "group", it implies that having the role within the current scope (group/course) is enough.
      // The `getMyPermissions` query already filters by scopeType and scopeId if provided.
      // So, if we get a permission with level "group", it's valid for the current scope.
      return true;
    case "none":
    default:
      return false;
  }
}

/**
 * A component that conditionally renders content based on whether the user has a specific permission
 */
export function PermissionGuard({
  children,
  fallback,
  permissionKey,
  resourceOwnerId,
  scopeType,
  scopeId,
  renderNothing,
  loading = <DefaultLoadingComponent />,
}: PermissionGuardProps) {
  const { user: clerkUser, isSignedIn, isLoaded: clerkIsLoaded } = useUser();

  // Use the specific hasPermission query for more accurate checks, especially for "own"
  const hasSpecificPermission = useQuery(
    api.permissionsUtils.hasPermission,
    isSignedIn && clerkUser
      ? {
          permissionKey,
          scopeType,
          scopeId,
          resourceOwnerId, // Pass resourceOwnerId here for backend to check "own"
        }
      : "skip", // Skip query if not signed in or clerkUser not available
  );

  if (BYPASS_PERMISSIONS) {
    console.log(`[DEV] Bypassing permission check for: ${permissionKey}`);
    return <>{children}</>;
  }

  if (!clerkIsLoaded || (!isSignedIn && hasSpecificPermission === undefined)) {
    return loading;
  }

  if (!isSignedIn) {
    if (renderNothing) return null;
    return (
      fallback ?? <DefaultFallbackComponent permissionKey={permissionKey} />
    );
  }

  // hasSpecificPermission will be true, false, or undefined (if loading/skipped)
  if (hasSpecificPermission === undefined && clerkIsLoaded && isSignedIn) {
    // Still loading from Convex query
    return loading;
  }

  if (hasSpecificPermission) {
    return <>{children}</>;
  } else {
    if (renderNothing) return null;
    return (
      fallback ?? <DefaultFallbackComponent permissionKey={permissionKey} />
    );
  }
}

/**
 * Higher-order component that wraps a component with PermissionGuard
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permissionKey: string,
  options?: {
    resourceOwnerId?: Id<"users">;
    scopeType?: PermissionScope;
    scopeId?: string;
    fallback?: React.ReactNode;
    renderNothing?: boolean;
    loading?: React.ReactNode;
  },
) {
  return function PermissionGuardedComponent(props: P) {
    return (
      <PermissionGuard
        permissionKey={permissionKey}
        resourceOwnerId={options?.resourceOwnerId}
        scopeType={options?.scopeType}
        scopeId={options?.scopeId}
        fallback={options?.fallback}
        renderNothing={options?.renderNothing}
        loading={options?.loading}
      >
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

/**
 * A hook that returns a component protected by a permission check
 */
export function usePermissionGuarded<P extends object>(
  Component: React.ComponentType<P>,
  permissionKey: string,
  options?: {
    resourceOwnerId?: Id<"users">;
    scopeType?: PermissionScope;
    scopeId?: string;
    fallback?: React.ReactNode;
    renderNothing?: boolean;
    loading?: React.ReactNode;
  },
) {
  return React.useMemo(
    () => withPermission(Component, permissionKey, options),
    [
      Component,
      permissionKey,
      options?.resourceOwnerId,
      options?.scopeType,
      options?.scopeId,
      options?.fallback,
      options?.renderNothing,
      options?.loading,
    ],
  );
}
