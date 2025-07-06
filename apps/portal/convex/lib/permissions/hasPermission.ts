import type { Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import type { PermissionScope } from "../../core/schema/permissionsSchema";
import { internal } from "../../_generated/api";
import { getAuthenticatedUser } from "./userAuth";

/**
 * Checks if a user has a specific permission
 *
 * @param ctx - The Convex context (query or mutation)
 * @param permissionKey - The permission key to check
 * @param options - Additional options for permission checking
 * @returns A boolean indicating whether the user has the permission
 */
export const hasPermission = async (
  ctx: QueryCtx | MutationCtx,
  permissionKey: string,
  options?: {
    scopeType?: PermissionScope;
    scopeId?: string;
    resourceOwnerId?: Id<"users">;
    userId?: Id<"users">;
  },
): Promise<boolean> => {
  try {
    // If userId is provided, use it; otherwise get the authenticated user
    const userId = options?.userId || (await getAuthenticatedUser(ctx))._id;

    // Call the internal permission check function
    return await ctx.runQuery(internal.permissionsUtils.hasPermissionInternal, {
      userId,
      permissionKey,
      scopeType: options?.scopeType ?? "global",
      scopeId: options?.scopeId,
      resourceOwnerId: options?.resourceOwnerId,
    });
  } catch (error) {
    // If there's an error (user not authenticated, etc.), return false
    console.error("Permission check error:", error);
    return false;
  }
};

/**
 * Checks if the current user has permission to access a specific resource
 * Useful for owner-based access control
 *
 * @param ctx - The Convex context
 * @param permissionKey - The permission key to check
 * @param resourceOwnerId - The ID of the resource owner
 * @param options - Additional options for permission checking
 * @returns A boolean indicating whether the user has access
 */
export const hasResourceAccess = async (
  ctx: QueryCtx | MutationCtx,
  permissionKey: string,
  resourceOwnerId: Id<"users">,
  options?: {
    scopeType?: PermissionScope;
    scopeId?: string;
  },
): Promise<boolean> => {
  try {
    const user = await getAuthenticatedUser(ctx);

    // Check if the user is the resource owner
    const isOwner = user._id.toString() === resourceOwnerId.toString();

    // If the user is the owner and the permission allows owner access, return true
    if (isOwner) {
      return true;
    }

    // Otherwise, check if the user has the permission through roles
    return await hasPermission(ctx, permissionKey, {
      ...options,
      resourceOwnerId,
    });
  } catch (error) {
    console.error("Resource access check error:", error);
    return false;
  }
};

/**
 * Checks if the authenticated user is an admin
 *
 * @param ctx - The Convex context
 * @returns True if the user is an admin, false otherwise
 */
export const isAdmin = async (
  ctx: QueryCtx | MutationCtx,
): Promise<boolean> => {
  try {
    const user = await getAuthenticatedUser(ctx);

    // Normalize role string and check common admin indicators
    const roleNormalized = (user.role ?? "").toString().trim().toLowerCase();

    if (roleNormalized === "admin") return true;

    // Support older rows that store permissions array containing "admin"
    if (
      Array.isArray((user as any).permissions) &&
      (user as any).permissions.includes("admin")
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
};
