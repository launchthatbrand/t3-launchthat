import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";
import { isAdmin } from "./permissions";

// Get the roles for a user
export const getUserRoles = query({
  args: {
    userId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("userRoles"),
      userId: v.string(),
      roleId: v.id("roles"),
      assignedAt: v.number(),
      assignedBy: v.string(),
      roleName: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const currentUserId = await requireUser(ctx);

    // Determine which user to get roles for
    const targetUserId = args.userId ?? currentUserId;

    // If requesting other user's roles, require admin
    if (targetUserId !== currentUserId && !(await isAdmin(ctx))) {
      throw new ConvexError("Only admins can view other users' roles");
    }

    // Get user roles
    const userRoles = await ctx.db
      .query("userRoles")
      .withIndex("by_userId", (q) => q.eq("userId", targetUserId))
      .collect();

    // Get role details for each user role
    const result = [];
    for (const userRole of userRoles) {
      const role = await ctx.db.get(userRole.roleId);
      if (role) {
        result.push({
          ...userRole,
          roleName: role.name,
        });
      }
    }

    return result;
  },
});

// Check if a user has a specific role
export const hasRole = query({
  args: {
    userId: v.optional(v.string()),
    roleName: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const currentUserId = await requireUser(ctx);
    const targetUserId = args.userId ?? currentUserId;

    // If checking other user's roles, require admin
    if (targetUserId !== currentUserId && !(await isAdmin(ctx))) {
      throw new ConvexError("Only admins can check other users' roles");
    }

    // Find the role by name
    const role = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.roleName))
      .first();

    if (!role) {
      return false;
    }

    // Check if user has this role
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_userId_roleId", (q) =>
        q.eq("userId", targetUserId).eq("roleId", role._id),
      )
      .first();

    return !!userRole;
  },
});

// Initialize system roles and permissions
export const initSystemRoles = mutation({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);

    // Check if already initialized
    const existingAdmin = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", "admin"))
      .first();

    if (existingAdmin) {
      return false; // Already initialized
    }

    const now = Date.now();

    // Create system roles
    const adminRoleId = await ctx.db.insert("roles", {
      name: "admin",
      description: "System administrator with full access",
      createdAt: now,
      createdBy: userId,
      isSystem: true,
    });

    // Create user role
    const _userRoleId = await ctx.db.insert("roles", {
      name: "user",
      description: "Regular user with standard access",
      createdAt: now,
      createdBy: userId,
      isSystem: true,
    });

    // Create guest role
    const _guestRoleId = await ctx.db.insert("roles", {
      name: "guest",
      description: "Guest user with limited access",
      createdAt: now,
      createdBy: userId,
      isSystem: true,
    });

    // Assign current user as admin
    await ctx.db.insert("userRoles", {
      userId,
      roleId: adminRoleId,
      assignedAt: now,
      assignedBy: userId,
    });

    return true;
  },
});
