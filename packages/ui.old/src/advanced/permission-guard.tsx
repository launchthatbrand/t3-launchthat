"use client";

import * as React from "react";

import { cn } from "@acme/ui";

// Types for permission-based rendering
export type PermissionLevel = "admin" | "moderator" | "member" | "guest";

export interface PermissionCheck {
  // User's role or permission level
  userRole?: PermissionLevel;
  // Required role to access
  requiredRole?: PermissionLevel;
  // Specific permissions the user has
  userPermissions?: string[];
  // Permissions required to access
  requiredPermissions?: string[] | string;
  // Custom permission check
  customCheck?: () => boolean;
  // If true, shows the UI element but disables interaction
  disableIfNoPermission?: boolean;
  // If true, shows placeholder content when permission is denied
  showPlaceholder?: boolean;
  // Class to apply when permission is denied and disabled
  disabledClassName?: string;
}

// Helper to determine if a user meets the required role level
export function meetsRoleRequirement(
  userRole: PermissionLevel | undefined,
  requiredRole: PermissionLevel | undefined,
): boolean {
  if (!requiredRole || !userRole) return false;

  const roleHierarchy: Record<PermissionLevel, number> = {
    admin: 100,
    moderator: 75,
    member: 50,
    guest: 25,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Helper to check if user has required permissions
export function hasRequiredPermissions(
  userPermissions: string[] | undefined,
  requiredPermissions: string[] | string | undefined,
): boolean {
  if (!requiredPermissions || !userPermissions) return false;

  const required = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  return required.every((permission) => userPermissions.includes(permission));
}

// Main component to conditionally render based on permissions
export function PermissionGuard({
  children,
  fallback,
  userRole,
  requiredRole,
  userPermissions,
  requiredPermissions,
  customCheck,
  disableIfNoPermission = false,
  showPlaceholder = false,
  disabledClassName,
  className,
}: PermissionCheck & {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}) {
  // Check if the user has the required permissions
  const hasPermission = React.useMemo(() => {
    // Check custom permission logic first
    if (customCheck !== undefined) {
      return customCheck();
    }

    // Check role-based permission
    const roleCheck = requiredRole
      ? meetsRoleRequirement(userRole, requiredRole)
      : true;

    // Check specific permissions
    const permissionCheck = requiredPermissions
      ? hasRequiredPermissions(userPermissions, requiredPermissions)
      : true;

    return roleCheck && permissionCheck;
  }, [
    customCheck,
    userRole,
    requiredRole,
    userPermissions,
    requiredPermissions,
  ]);

  // If the user has permission, render the children
  if (hasPermission) {
    return <>{children}</>;
  }

  // Show placeholder if enabled
  if (showPlaceholder) {
    return (
      fallback || (
        <div className="rounded border border-dashed border-muted-foreground/25 p-4 text-center text-muted-foreground">
          You don't have permission to view this content
        </div>
      )
    );
  }

  // Disable the element but still show it
  if (disableIfNoPermission) {
    return (
      <div
        className={cn(
          "pointer-events-none cursor-not-allowed opacity-50",
          disabledClassName,
          className,
        )}
        aria-disabled="true"
      >
        {children}
      </div>
    );
  }

  // Default: don't render anything
  return null;
}

// Component that only renders its children if the user is an admin
export function AdminOnly({
  children,
  userRole,
  fallback,
  disableIfNoPermission,
  showPlaceholder,
  ...props
}: Omit<PermissionCheck, "requiredRole"> & {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGuard
      userRole={userRole}
      requiredRole="admin"
      fallback={fallback}
      disableIfNoPermission={disableIfNoPermission}
      showPlaceholder={showPlaceholder}
      {...props}
    >
      {children}
    </PermissionGuard>
  );
}

// Component that only renders its children if the user is a moderator or higher
export function ModeratorOnly({
  children,
  userRole,
  fallback,
  disableIfNoPermission,
  showPlaceholder,
  ...props
}: Omit<PermissionCheck, "requiredRole"> & {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGuard
      userRole={userRole}
      requiredRole="moderator"
      fallback={fallback}
      disableIfNoPermission={disableIfNoPermission}
      showPlaceholder={showPlaceholder}
      {...props}
    >
      {children}
    </PermissionGuard>
  );
}

// Component that only renders its children if the user is a member or higher
export function MemberOnly({
  children,
  userRole,
  fallback,
  disableIfNoPermission,
  showPlaceholder,
  ...props
}: Omit<PermissionCheck, "requiredRole"> & {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <PermissionGuard
      userRole={userRole}
      requiredRole="member"
      fallback={fallback}
      disableIfNoPermission={disableIfNoPermission}
      showPlaceholder={showPlaceholder}
      {...props}
    >
      {children}
    </PermissionGuard>
  );
}

// Component to conditionally render a button based on permissions
type PermissionButtonChild = React.ReactElement<{
  disabled?: boolean;
  className?: string;
}>;

export function PermissionButton({
  children,
  ...props
}: PermissionCheck & {
  children: PermissionButtonChild;
}) {
  // Check if the user has permissions
  const hasPermission = React.useMemo(() => {
    // Check custom permission logic first
    if (props.customCheck !== undefined) {
      return props.customCheck();
    }

    // Check role-based permission
    const roleCheck = props.requiredRole
      ? meetsRoleRequirement(props.userRole, props.requiredRole)
      : true;

    // Check specific permissions
    const permissionCheck = props.requiredPermissions
      ? hasRequiredPermissions(props.userPermissions, props.requiredPermissions)
      : true;

    return roleCheck && permissionCheck;
  }, [
    props.customCheck,
    props.userRole,
    props.requiredRole,
    props.userPermissions,
    props.requiredPermissions,
  ]);

  // Clone the button with disabled prop if needed
  if (!hasPermission && props.disableIfNoPermission) {
    return React.cloneElement(children, {
      disabled: true,
      className: cn(
        children.props.className,
        "cursor-not-allowed opacity-50",
        props.disabledClassName,
      ),
    });
  }

  // Don't render if no permission
  if (!hasPermission) {
    return null;
  }

  // If permissions are granted, render the button as is
  return children;
}
