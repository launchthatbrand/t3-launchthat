import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

/**
 * Get all permissions
 */
export const getAllPermissions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("permissions").collect();
  },
});

/**
 * Check if a user has a specific permission
 */
export const checkPermission = query({
  args: {
    permissionKey: v.string(),
    scopeType: v.optional(
      v.union(
        v.literal("global"),
        v.literal("group"),
        v.literal("course"),
        v.literal("organization"),
      ),
    ),
    scopeId: v.optional(v.string()),
    resourceOwnerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const {
      permissionKey,
      scopeType = "global",
      scopeId,
      resourceOwnerId,
    } = args;

    // Get the identity from the context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    // Extract user ID from the identity
    const userId = identity.tokenIdentifier;

    // Find the user in our database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", userId))
      .first();

    if (!user) {
      return false;
    }

    // Get user's roles in the specified scope
    const userRoleAssignments = await ctx.db
      .query("userRoles")
      .withIndex("by_user_scope", (q) =>
        q.eq("userId", user._id).eq("scopeType", scopeType),
      )
      .collect();

    // If scopeId is provided, filter to only include roles for that scope
    const filteredRoleAssignments = scopeId
      ? userRoleAssignments.filter(
          (ra) => !ra.scopeId || ra.scopeId === scopeId,
        )
      : userRoleAssignments;

    // Also include global roles which apply everywhere
    const globalRoleAssignments =
      scopeType !== "global"
        ? await ctx.db
            .query("userRoles")
            .withIndex("by_user_scope", (q) =>
              q.eq("userId", user._id).eq("scopeType", "global"),
            )
            .collect()
        : [];

    // Combine role assignments
    const allRoleAssignments = [
      ...filteredRoleAssignments,
      ...globalRoleAssignments,
    ];

    // If no roles, check direct user permissions
    if (allRoleAssignments.length === 0) {
      const userPermission = await ctx.db
        .query("userPermissions")
        .withIndex("by_user_permission", (q) =>
          q.eq("userId", user._id).eq("permissionKey", permissionKey),
        )
        .first();

      if (!userPermission) {
        return false;
      }

      // Check permission level
      return checkPermissionLevel(
        userPermission.level,
        resourceOwnerId ? resourceOwnerId === user._id : false,
      );
    }

    // Get all role IDs
    const roleIds = allRoleAssignments.map((ra) => ra.roleId);

    // Sort roles by priority (higher priority roles override lower priority ones)
    const roles = await Promise.all(
      roleIds.map((roleId) => ctx.db.get(roleId)),
    );

    // Filter out null roles and sort by priority (descending)
    const sortedRoles = roles
      .filter(Boolean)
      .sort((a, b) => (b?.priority ?? 0) - (a?.priority ?? 0));

    // Check role permissions for the specified permission key
    for (const role of sortedRoles) {
      if (!role) continue;

      const rolePermission = await ctx.db
        .query("rolePermissions")
        .withIndex("by_role_permission", (q) =>
          q.eq("roleId", role._id).eq("permissionKey", permissionKey),
        )
        .first();

      if (rolePermission) {
        // Check permission level
        return checkPermissionLevel(
          rolePermission.level,
          resourceOwnerId ? resourceOwnerId === user._id : false,
        );
      }
    }

    // No matching permission found
    return false;
  },
});

/**
 * Get all permissions for a user
 */
export const getUserPermissions = query({
  args: {
    scopeType: v.optional(
      v.union(
        v.literal("global"),
        v.literal("group"),
        v.literal("course"),
        v.literal("organization"),
      ),
    ),
    scopeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { scopeType = "global", scopeId } = args;

    // Get the identity from the context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {};
    }

    // Extract user ID from the identity
    const userId = identity.tokenIdentifier;

    // Find the user in our database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", userId))
      .first();

    if (!user) {
      return {};
    }

    // Get all permissions
    const allPermissions = await ctx.db.query("permissions").collect();

    // Initialize result with default values
    const result: Record<string, string> = {};
    allPermissions.forEach((permission) => {
      result[permission.key] = permission.defaultLevel;
    });

    // Get user's direct permissions
    const userPermissions = await ctx.db
      .query("userPermissions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Apply user permissions
    userPermissions.forEach((permission) => {
      result[permission.permissionKey] = permission.level;
    });

    // Get user's roles
    const userRoleAssignments = await ctx.db
      .query("userRoles")
      .withIndex("by_user_scope", (q) =>
        q.eq("userId", user._id).eq("scopeType", scopeType),
      )
      .collect();

    // If scopeId is provided, filter to only include roles for that scope
    const filteredRoleAssignments = scopeId
      ? userRoleAssignments.filter(
          (ra) => !ra.scopeId || ra.scopeId === scopeId,
        )
      : userRoleAssignments;

    // Also include global roles which apply everywhere
    const globalRoleAssignments =
      scopeType !== "global"
        ? await ctx.db
            .query("userRoles")
            .withIndex("by_user_scope", (q) =>
              q.eq("userId", user._id).eq("scopeType", "global"),
            )
            .collect()
        : [];

    // Combine role assignments
    const allRoleAssignments = [
      ...filteredRoleAssignments,
      ...globalRoleAssignments,
    ];

    // Get all role IDs
    const roleIds = allRoleAssignments.map((ra) => ra.roleId);

    // Get roles with their priorities
    const roles = await Promise.all(
      roleIds.map((roleId) => ctx.db.get(roleId)),
    );

    // Filter out null roles and sort by priority (descending)
    const sortedRoles = roles
      .filter(Boolean)
      .sort((a, b) => (b?.priority ?? 0) - (a?.priority ?? 0));

    // Get permissions for each role
    for (const role of sortedRoles) {
      if (!role) continue;

      const rolePermissions = await ctx.db
        .query("rolePermissions")
        .withIndex("by_role", (q) => q.eq("roleId", role._id))
        .collect();

      // Apply role permissions (higher priority roles override lower priority ones)
      rolePermissions.forEach((permission) => {
        // Determine the "higher" permission level
        const currentLevel = result[permission.permissionKey];
        const newLevel = permission.level;

        // Apply the higher permission level
        if (
          newLevel === "all" ||
          (newLevel === "group" && currentLevel !== "all") ||
          (newLevel === "own" &&
            currentLevel !== "all" &&
            currentLevel !== "group")
        ) {
          result[permission.permissionKey] = newLevel;
        }
      });
    }

    return result;
  },
});

/**
 * Create a custom role
 */
export const createCustomRole = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    scope: v.union(
      v.literal("global"),
      v.literal("group"),
      v.literal("course"),
      v.literal("organization"),
    ),
    isAssignable: v.boolean(),
    priority: v.number(),
    permissions: v.array(
      v.object({
        key: v.string(),
        level: v.union(
          v.literal("none"),
          v.literal("own"),
          v.literal("group"),
          v.literal("all"),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { name, description, scope, isAssignable, priority, permissions } =
      args;

    // Create the role
    const roleId = await ctx.db.insert("roles", {
      name,
      description,
      scope,
      isAssignable,
      isSystem: false,
      priority,
    });

    // Add permissions to the role
    for (const permission of permissions) {
      // Skip "none" permissions as they're the default
      if (permission.level === "none") continue;

      await ctx.db.insert("rolePermissions", {
        roleId,
        permissionKey: permission.key,
        level: permission.level,
      });
    }

    return roleId;
  },
});

/**
 * Update a role
 */
export const updateRole = mutation({
  args: {
    roleId: v.id("roles"),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      isAssignable: v.optional(v.boolean()),
      priority: v.optional(v.number()),
    }),
    permissions: v.optional(
      v.array(
        v.object({
          key: v.string(),
          level: v.union(
            v.literal("none"),
            v.literal("own"),
            v.literal("group"),
            v.literal("all"),
          ),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { roleId, updates, permissions } = args;

    // Get the role
    const role = await ctx.db.get(roleId);

    // Verify role exists
    if (!role) {
      throw new Error(`Role with ID ${roleId} not found`);
    }

    // Don't allow modifying system roles
    if (role.isSystem) {
      throw new Error("Cannot modify system roles");
    }

    // Update the role
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(roleId, updates);
    }

    // Update permissions if provided
    if (permissions) {
      // Get existing permissions
      const existingPermissions = await ctx.db
        .query("rolePermissions")
        .withIndex("by_role", (q) => q.eq("roleId", roleId))
        .collect();

      // Remove existing permissions
      for (const permission of existingPermissions) {
        await ctx.db.delete(permission._id);
      }

      // Add new permissions
      for (const permission of permissions) {
        // Skip "none" permissions as they're the default
        if (permission.level === "none") continue;

        await ctx.db.insert("rolePermissions", {
          roleId,
          permissionKey: permission.key,
          level: permission.level,
        });
      }
    }

    return roleId;
  },
});

/**
 * Assign a role to a user
 */
export const assignRole = mutation({
  args: {
    userId: v.id("users"),
    roleId: v.id("roles"),
    scopeType: v.optional(
      v.union(
        v.literal("global"),
        v.literal("group"),
        v.literal("course"),
        v.literal("organization"),
      ),
    ),
    scopeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, roleId, scopeType = "global", scopeId } = args;

    // Verify user exists
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Verify role exists and is assignable
    const role = await ctx.db.get(roleId);
    if (!role) {
      throw new Error(`Role with ID ${roleId} not found`);
    }

    if (!role.isAssignable) {
      throw new Error(`Role ${role.name} is not assignable`);
    }

    // Check if role is already assigned in this scope
    const existingAssignment = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter(
        (q) =>
          q.eq(q.field("roleId"), roleId) &&
          q.eq(q.field("scopeType"), scopeType) &&
          (scopeId
            ? q.eq(q.field("scopeId"), scopeId)
            : q.eq(q.field("scopeId"), undefined)),
      )
      .first();

    // If already assigned, return existing assignment
    if (existingAssignment) {
      return existingAssignment._id;
    }

    // Assign role to user
    return await ctx.db.insert("userRoles", {
      userId,
      roleId,
      scopeType,
      scopeId,
      assignedAt: Date.now(),
      assignedBy: undefined,
    });
  },
});

/**
 * Revoke a role from a user
 */
export const revokeRole = mutation({
  args: {
    userId: v.id("users"),
    roleId: v.id("roles"),
    scopeType: v.optional(
      v.union(
        v.literal("global"),
        v.literal("group"),
        v.literal("course"),
        v.literal("organization"),
      ),
    ),
    scopeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, roleId, scopeType = "global", scopeId } = args;

    // Find the role assignment
    const roleAssignment = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter(
        (q) =>
          q.eq(q.field("roleId"), roleId) &&
          q.eq(q.field("scopeType"), scopeType) &&
          (scopeId
            ? q.eq(q.field("scopeId"), scopeId)
            : q.eq(q.field("scopeId"), undefined)),
      )
      .first();

    // If not found, return success (idempotent)
    if (!roleAssignment) {
      return { success: true, message: "Role was not assigned" };
    }

    // Delete the role assignment
    await ctx.db.delete(roleAssignment._id);

    return { success: true, message: "Role revoked successfully" };
  },
});

/**
 * Grant a direct permission to a user
 */
export const grantPermission = mutation({
  args: {
    userId: v.id("users"),
    permissionKey: v.string(),
    level: v.union(
      v.literal("none"),
      v.literal("own"),
      v.literal("group"),
      v.literal("all"),
    ),
    scopeType: v.optional(
      v.union(
        v.literal("global"),
        v.literal("group"),
        v.literal("course"),
        v.literal("organization"),
      ),
    ),
    scopeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      userId,
      permissionKey,
      level,
      scopeType = "global",
      scopeId,
    } = args;

    // Verify user exists
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Verify permission exists
    const permission = await ctx.db
      .query("permissions")
      .filter((q) => q.eq(q.field("key"), permissionKey))
      .first();

    if (!permission) {
      throw new Error(`Permission with key ${permissionKey} not found`);
    }

    // Check if permission is already granted
    const existingPermission = await ctx.db
      .query("userPermissions")
      .withIndex("by_user_permission", (q) =>
        q.eq("userId", userId).eq("permissionKey", permissionKey),
      )
      .first();

    // If "none", remove the permission
    if (level === "none") {
      if (existingPermission) {
        await ctx.db.delete(existingPermission._id);
      }
      return { success: true, message: "Permission removed" };
    }

    // Update or insert permission
    if (existingPermission) {
      await ctx.db.patch(existingPermission._id, { level });
      return existingPermission._id;
    } else {
      return await ctx.db.insert("userPermissions", {
        userId,
        permissionKey,
        level,
        scopeType,
        scopeId,
        assignedAt: Date.now(),
        assignedBy: undefined, // In a real app, we would set this to the current user's ID
      });
    }
  },
});

/**
 * Utility function to check if a permission level allows access
 */
function checkPermissionLevel(level: string, isOwner: boolean): boolean {
  switch (level) {
    case "all":
      return true;
    case "group":
      // In a real implementation, check if the user is in the same group
      // For now, assume group access implies owner access
      return isOwner;
    case "own":
      return isOwner;
    case "none":
    default:
      return false;
  }
}
