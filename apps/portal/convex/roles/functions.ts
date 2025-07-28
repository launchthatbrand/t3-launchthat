import { mutation, query } from "../_generated/server";

import { requirePermission } from "../lib/permissions/requirePermission";
import { v } from "convex/values";

/**
 * Get all available roles (simplified version)
 */
export const getRoles = query({
  args: {},
  handler: async (ctx) => {
    // For now, return a hardcoded list of roles
    // In a full implementation, this would query the roles table
    return [
      {
        _id: "admin" as any,
        _creationTime: Date.now(),
        name: "Administrator",
        description: "Full system access with all permissions",
        isSystem: true,
        isAssignable: true,
        priority: 100,
        scope: "global" as const,
      },
      {
        _id: "manager" as any,
        _creationTime: Date.now(),
        name: "Manager",
        description: "Management access with most permissions",
        isSystem: true,
        isAssignable: true,
        priority: 50,
        scope: "global" as const,
      },
      {
        _id: "user" as any,
        _creationTime: Date.now(),
        name: "User",
        description: "Basic user access",
        isSystem: true,
        isAssignable: true,
        priority: 10,
        scope: "global" as const,
      },
    ];
  },
});

/**
 * Delete a role (placeholder)
 */
export const deleteRole = mutation({
  args: {
    roleId: v.any(),
  },
  handler: async (ctx, args) => {
    // For now, just return success
    // In a full implementation, this would check permissions and delete the role
    return { success: true };
  },
});

/**
 * Get user role information
 */
export const getUserRole = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return {
      userId: user._id,
      role: user.role || "user",
    };
  },
});

/**
 * Assign role to user
 */
export const assignRoleToUser = mutation({
  args: {
    userId: v.id("users"),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if current user can manage users
    await requirePermission(ctx, "canManageUsers");

    await ctx.db.patch(args.userId, {
      role: args.role,
    });

    return { success: true };
  },
});

/**
 * Check if user has admin role
 */
export const isUserAdmin = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.role === "admin" || false;
  },
});
