/**
 * Permission and access control system for the integrations module
 *
 * This file provides functions and utilities for implementing RBAC
 * (Role-Based Access Control) for integration resources.
 */
import { ConvexError, v } from "convex/values";

import { Id } from "../../../_generated/dataModel";
import { internalMutation, internalQuery } from "../../../_generated/server";

/**
 * Permission levels for integration resources
 */
export enum PermissionLevel {
  NONE = "none",
  VIEW = "view",
  EDIT = "edit",
  ADMIN = "admin",
  OWNER = "owner",
}

/**
 * Resource types that can have permissions
 */
export enum ResourceType {
  APP = "app",
  CONNECTION = "connection",
  SCENARIO = "scenario",
}

/**
 * Access scope for permissions
 */
export enum AccessScope {
  USER = "user",
  GROUP = "group",
  ORG = "org",
  GLOBAL = "global",
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  granted: boolean;
  level?: PermissionLevel;
  reason?: string;
}

/**
 * Check if a user has permission to access a resource
 */
export const hasPermission = internalQuery({
  args: {
    userId: v.optional(v.string()), // Optional because system operations may not have a user
    resourceType: v.union(
      v.literal(ResourceType.APP),
      v.literal(ResourceType.CONNECTION),
      v.literal(ResourceType.SCENARIO),
    ),
    resourceId: v.union(v.id("apps"), v.id("connections"), v.id("scenarios")),
    requiredLevel: v.union(
      v.literal(PermissionLevel.VIEW),
      v.literal(PermissionLevel.EDIT),
      v.literal(PermissionLevel.ADMIN),
      v.literal(PermissionLevel.OWNER),
    ),
  },
  returns: v.object({
    granted: v.boolean(),
    level: v.optional(v.string()),
    reason: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const { userId, resourceType, resourceId, requiredLevel } = args;

    // If no user ID is provided, deny access unless it's a system operation
    if (!userId) {
      return {
        granted: false,
        reason: "No user ID provided",
      };
    }

    // Fetch the user
    const user = await ctx.db.get(userId as Id<"users">);
    if (!user) {
      return {
        granted: false,
        reason: "User not found",
      };
    }

    // Check if the user is a system admin (has unrestricted access)
    const isAdmin = await isSystemAdmin(ctx, userId);
    if (isAdmin) {
      return {
        granted: true,
        level: PermissionLevel.ADMIN,
        reason: "System administrator access",
      };
    }

    // Fetch the resource
    const resource = await ctx.db.get(resourceId);
    if (!resource) {
      return {
        granted: false,
        reason: "Resource not found",
      };
    }

    // Check if the user is the owner of the resource
    // @ts-ignore - we know resource has an owner property but TypeScript doesn't
    if (resource.ownerId === userId) {
      return {
        granted: true,
        level: PermissionLevel.OWNER,
        reason: "Resource owner",
      };
    }

    // Check resource-specific permissions
    let permission = PermissionLevel.NONE;

    // In a real implementation, we would check:
    // 1. Direct user permissions
    // 2. Group memberships and their permissions
    // 3. Organization-level permissions
    // 4. Global/public access settings

    // For now, implement a simple check based on resource type
    if (resourceType === ResourceType.APP) {
      // Apps are typically available to all users for viewing
      permission = PermissionLevel.VIEW;
    } else if (resourceType === ResourceType.CONNECTION) {
      // Connections are typically restricted to their creator and org admins
      // @ts-ignore - we know resource might have a createdBy property
      if (resource.createdBy === userId) {
        permission = PermissionLevel.EDIT;
      }
    } else if (resourceType === ResourceType.SCENARIO) {
      // Scenarios are typically restricted to their creator and specified collaborators
      // @ts-ignore - we know resource might have a createdBy property
      if (resource.createdBy === userId) {
        permission = PermissionLevel.EDIT;
      }

      // Check for collaborator status
      // @ts-ignore - we know resource might have a collaborators property
      const collaborators = resource.collaborators || [];
      if (collaborators.includes(userId)) {
        permission = PermissionLevel.EDIT;
      }
    }

    // Convert permission levels to numeric values for comparison
    const permissionRank = {
      [PermissionLevel.NONE]: 0,
      [PermissionLevel.VIEW]: 1,
      [PermissionLevel.EDIT]: 2,
      [PermissionLevel.ADMIN]: 3,
      [PermissionLevel.OWNER]: 4,
    };

    // Check if the user's permission level is sufficient
    const hasRequiredPermission =
      permissionRank[permission] >= permissionRank[requiredLevel];

    return {
      granted: hasRequiredPermission,
      level: permission,
      reason: hasRequiredPermission
        ? `User has ${permission} access`
        : `User only has ${permission} access, but ${requiredLevel} is required`,
    };
  },
});

/**
 * Check if a user is a system administrator
 *
 * @param ctx Database context
 * @param userId User ID to check
 * @returns True if the user is a system admin
 */
async function isSystemAdmin(ctx: any, userId: string): Promise<boolean> {
  // In a real implementation, we would check the user's roles or admin status
  // For now, just return false
  return false;
}

/**
 * Grant a permission to a user for a specific resource
 */
export const grantPermission = internalMutation({
  args: {
    grantedBy: v.string(), // User ID who is granting the permission
    userId: v.string(), // User ID receiving the permission
    resourceType: v.union(
      v.literal(ResourceType.APP),
      v.literal(ResourceType.CONNECTION),
      v.literal(ResourceType.SCENARIO),
    ),
    resourceId: v.union(v.id("apps"), v.id("connections"), v.id("scenarios")),
    level: v.union(
      v.literal(PermissionLevel.VIEW),
      v.literal(PermissionLevel.EDIT),
      v.literal(PermissionLevel.ADMIN),
    ),
    scope: v.union(
      v.literal(AccessScope.USER),
      v.literal(AccessScope.GROUP),
      v.literal(AccessScope.ORG),
    ),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { grantedBy, userId, resourceType, resourceId, level, scope } = args;

    // Check if the granting user has admin permissions
    const grantorPermission = await hasPermission.handler(ctx, {
      userId: grantedBy,
      resourceType,
      resourceId,
      requiredLevel: PermissionLevel.ADMIN,
    });

    if (!grantorPermission.granted) {
      throw new ConvexError({
        code: "permission_denied",
        message: "You don't have permission to grant access to this resource",
      });
    }

    // In a real implementation, we would store the permission in a
    // permissions table with fields like:
    // - resourceType
    // - resourceId
    // - userId
    // - level
    // - scope
    // - grantedBy
    // - grantedAt

    // For now, just return true to simulate success
    return true;
  },
});

/**
 * Revoke a permission from a user for a specific resource
 */
export const revokePermission = internalMutation({
  args: {
    revokedBy: v.string(), // User ID who is revoking the permission
    userId: v.string(), // User ID losing the permission
    resourceType: v.union(
      v.literal(ResourceType.APP),
      v.literal(ResourceType.CONNECTION),
      v.literal(ResourceType.SCENARIO),
    ),
    resourceId: v.union(v.id("apps"), v.id("connections"), v.id("scenarios")),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { revokedBy, userId, resourceType, resourceId } = args;

    // Check if the revoking user has admin permissions
    const revokerPermission = await hasPermission.handler(ctx, {
      userId: revokedBy,
      resourceType,
      resourceId,
      requiredLevel: PermissionLevel.ADMIN,
    });

    if (!revokerPermission.granted) {
      throw new ConvexError({
        code: "permission_denied",
        message: "You don't have permission to revoke access to this resource",
      });
    }

    // In a real implementation, we would delete the permission from
    // the permissions table where it matches the resourceType, resourceId, and userId

    // For now, just return true to simulate success
    return true;
  },
});

/**
 * Get a list of users with permissions for a resource
 */
export const getResourcePermissions = internalQuery({
  args: {
    requestedBy: v.string(), // User ID requesting the permissions list
    resourceType: v.union(
      v.literal(ResourceType.APP),
      v.literal(ResourceType.CONNECTION),
      v.literal(ResourceType.SCENARIO),
    ),
    resourceId: v.union(v.id("apps"), v.id("connections"), v.id("scenarios")),
  },
  returns: v.array(
    v.object({
      userId: v.string(),
      userName: v.optional(v.string()),
      level: v.string(),
      scope: v.string(),
      grantedBy: v.string(),
      grantedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const { requestedBy, resourceType, resourceId } = args;

    // Check if the requesting user has at least view permissions
    const requesterPermission = await hasPermission.handler(ctx, {
      userId: requestedBy,
      resourceType,
      resourceId,
      requiredLevel: PermissionLevel.VIEW,
    });

    if (!requesterPermission.granted) {
      throw new ConvexError({
        code: "permission_denied",
        message:
          "You don't have permission to view permissions for this resource",
      });
    }

    // In a real implementation, we would query the permissions table
    // for all permissions related to this resource, join with user info
    // to get user names, and return the results

    // For now, return an empty array
    return [];
  },
});
