import { mutation, query } from "../_generated/server";

import { requirePermission } from "../lib/permissions/requirePermission";
import { v } from "convex/values";

/**
 * Get all available permissions (simplified version)
 */
export const getPermissions = query({
  args: {},
  handler: async (_ctx) => {
    // For now, return a hardcoded list of permissions
    // In a full implementation, this would query the permissions table
    return [
      {
        _id: "canManageOrders" as any,
        _creationTime: Date.now(),
        key: "canManageOrders",
        name: "Manage Orders",
        description: "Can create, view, edit, and delete orders",
        resource: "orders",
        action: "manage",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "ecommerce",
      },
      {
        _id: "canViewOrders" as any,
        _creationTime: Date.now(),
        key: "canViewOrders",
        name: "View Orders",
        description: "Can view orders",
        resource: "orders",
        action: "view",
        defaultLevel: "own" as const,
        isSystem: true,
        category: "ecommerce",
      },
      {
        _id: "canManageProducts" as any,
        _creationTime: Date.now(),
        key: "canManageProducts",
        name: "Manage Products",
        description: "Can create, view, edit, and delete products",
        resource: "products",
        action: "manage",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "ecommerce",
      },
      {
        _id: "canManageUsers" as any,
        _creationTime: Date.now(),
        key: "canManageUsers",
        name: "Manage Users",
        description: "Can create, view, edit, and delete users",
        resource: "users",
        action: "manage",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "admin",
      },
      {
        _id: "canManageRoles" as any,
        _creationTime: Date.now(),
        key: "canManageRoles",
        name: "Manage Roles",
        description: "Can create, view, edit, and delete roles",
        resource: "roles",
        action: "manage",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "admin",
      },
      {
        _id: "canManagePermissions" as any,
        _creationTime: Date.now(),
        key: "canManagePermissions",
        name: "Manage Permissions",
        description: "Can create, view, edit, and delete permissions",
        resource: "permissions",
        action: "manage",
        defaultLevel: "none" as const,
        isSystem: true,
        category: "admin",
      },
    ];
  },
});

/**
 * Delete a permission (placeholder)
 */
export const deletePermission = mutation({
  args: {
    permissionId: v.any(),
  },
  handler: async (_ctx, _args) => {
    // For now, just return success
    // In a full implementation, this would check permissions and delete the permission
    return { success: true };
  },
});

/**
 * Check if user has a specific permission based on their role
 */
export const checkUserPermission = query({
  args: {
    userId: v.id("users"),
    permission: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return false;

    // Simple role-based permission check
    const userRole = user.role || "user";

    // Admin has all permissions
    if (userRole === "admin") {
      return true;
    }

    // Define role permissions
    const rolePermissions: Record<string, string[]> = {
      manager: ["canViewOrders", "canManageProducts", "canManageUsers"],
      user: [
        "canViewOrders", // Only own orders
      ],
    };

    const permissions = rolePermissions[userRole] || [];
    return permissions.includes(args.permission);
  },
});
