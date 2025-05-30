import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

/**
 * Get all roles
 */
export const getRoles = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("roles").collect();
  },
});

/**
 * Get roles that can be assigned to users
 */
export const getAssignableRoles = query({
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
    const { scopeType = "global" } = args;

    // Get roles for the specified scope
    return await ctx.db
      .query("roles")
      .filter((q) => q.eq(q.field("isAssignable"), true))
      .filter((q) => q.eq(q.field("scope"), scopeType))
      .collect();
  },
});

/**
 * Get a role by ID
 */
export const getRole = query({
  args: {
    roleId: v.id("roles"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.roleId);
  },
});

/**
 * Get permissions for a role
 */
export const getRolePermissions = query({
  args: {
    roleId: v.id("roles"),
  },
  handler: async (ctx, args) => {
    const rolePermissions = await ctx.db
      .query("rolePermissions")
      .withIndex("by_role", (q) => q.eq("roleId", args.roleId))
      .collect();

    return rolePermissions;
  },
});

/**
 * Get all roles assigned to a user
 */
export const getUserRoles = query({
  args: {
    userId: v.id("users"),
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
    const { userId, scopeType, scopeId } = args;

    // Build the query based on provided arguments
    let userRolesQuery = ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    // Apply scope filter if provided
    if (scopeType) {
      userRolesQuery = userRolesQuery.filter((q) =>
        q.eq(q.field("scopeType"), scopeType),
      );
    }

    // Apply scopeId filter if provided
    if (scopeId) {
      userRolesQuery = userRolesQuery.filter((q) =>
        q.eq(q.field("scopeId"), scopeId),
      );
    }

    const userRoles = await userRolesQuery.collect();

    // Fetch the role details for each role assignment
    const roleDetails = await Promise.all(
      userRoles.map(async (userRole) => {
        const role = await ctx.db.get(userRole.roleId);
        return {
          roleId: userRole.roleId,
          name: role?.name ?? "Unknown Role",
          description: role?.description ?? "",
          scope: userRole.scopeType,
          scopeId: userRole.scopeId,
          assignedAt: userRole.assignedAt,
        };
      }),
    );

    return roleDetails;
  },
});

/**
 * Get all users with a specific role
 */
export const getUsersWithRole = query({
  args: {
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
    const { roleId, scopeType, scopeId } = args;

    // Build the query based on provided arguments
    let userRolesQuery = ctx.db
      .query("userRoles")
      .withIndex("by_role", (q) => q.eq("roleId", roleId));

    // Apply scope filter if provided
    if (scopeType) {
      userRolesQuery = userRolesQuery.filter((q) =>
        q.eq(q.field("scopeType"), scopeType),
      );
    }

    // Apply scopeId filter if provided
    if (scopeId) {
      userRolesQuery = userRolesQuery.filter((q) =>
        q.eq(q.field("scopeId"), scopeId),
      );
    }

    const userRoles = await userRolesQuery.collect();

    // Fetch the user details for each role assignment
    const userDetails = await Promise.all(
      userRoles.map(async (userRole) => {
        const user = await ctx.db.get(userRole.userId);
        return {
          userId: userRole.userId,
          name: user?.name ?? "Unknown User",
          email: user?.email ?? "",
          scope: userRole.scopeType,
          scopeId: userRole.scopeId,
          assignedAt: userRole.assignedAt,
        };
      }),
    );

    return userDetails;
  },
});

/**
 * Delete a role
 */
export const deleteRole = mutation({
  args: {
    roleId: v.id("roles"),
  },
  handler: async (ctx, args) => {
    const { roleId } = args;

    // Get the role
    const role = await ctx.db.get(roleId);

    // Verify role exists
    if (!role) {
      throw new Error(`Role with ID ${roleId} not found`);
    }

    // Don't allow deleting system roles
    if (role.isSystem) {
      throw new Error("Cannot delete system roles");
    }

    // Get role permissions
    const rolePermissions = await ctx.db
      .query("rolePermissions")
      .withIndex("by_role", (q) => q.eq("roleId", roleId))
      .collect();

    // Delete role permissions
    for (const permission of rolePermissions) {
      await ctx.db.delete(permission._id);
    }

    // Get user role assignments
    const userRoles = await ctx.db
      .query("userRoles")
      .withIndex("by_role", (q) => q.eq("roleId", roleId))
      .collect();

    // Delete user role assignments
    for (const userRole of userRoles) {
      await ctx.db.delete(userRole._id);
    }

    // Delete the role
    await ctx.db.delete(roleId);

    return { success: true, message: "Role deleted successfully" };
  },
});
