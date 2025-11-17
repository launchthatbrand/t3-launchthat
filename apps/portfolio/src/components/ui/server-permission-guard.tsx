import React from "react";
import { Id } from "@/convex/_generated/dataModel";

type PermissionScope = "global" | "group" | "course" | "organization";

interface ServerPermissionGuardProps {
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

/**
 * A server-side component that renders content without permission checks
 * Used as a placeholder in server components - permissions will be checked client-side
 */
export function ServerPermissionGuard({
  children,
}: ServerPermissionGuardProps) {
  // In server components, we just render the children
  // The actual permission check will happen client-side
  return <>{children}</>;
}
