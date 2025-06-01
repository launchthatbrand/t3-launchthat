import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";
import { isAdmin, logAuditEvent, SYSTEM_ROLES } from "./permissions";

// List all roles
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("roles"),
      name: v.string(),
      description: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
      createdBy: v.string(),
      isSystem: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    try {
      // Check if user is admin
      if (!(await isAdmin(ctx))) {
        throw new ConvexError("You don't have permission to view all roles");
      }

      // Get all roles
      const roles = await ctx.db.query("roles").collect();
      return roles;
    } catch (error) {
      console.error("Error in list roles:", error);
      throw error;
    }
  },
});

// Get a single role by ID
export const get = query({
  args: { id: v.id("roles") },
  returns: v.union(
    v.object({
      _id: v.id("roles"),
      name: v.string(),
      description: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
      createdBy: v.string(),
      isSystem: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    try {
      // Check if user is admin
      if (!(await isAdmin(ctx))) {
        throw new ConvexError("You don't have permission to view role details");
      }

      // Get the role
      const role = await ctx.db.get(args.id);
      return role;
    } catch (error) {
      console.error("Error in get role:", error);
      throw error;
    }
  },
});

// Create a new role
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id("roles"),
  handler: async (ctx, args) => {
    try {
      const { name, description } = args;
      const userId = await requireUser(ctx);

      // Check if user is admin
      if (!(await isAdmin(ctx))) {
        throw new ConvexError("You don't have permission to create roles");
      }

      // Check if role name already exists
      const existingRole = await ctx.db
        .query("roles")
        .withIndex("by_name", (q) => q.eq("name", name))
        .first();

      if (existingRole) {
        throw new ConvexError(`Role with name '${name}' already exists`);
      }

      // Don't allow creating system roles
      const systemRoleValues = Object.values(SYSTEM_ROLES);
      if (systemRoleValues.includes(name)) {
        throw new ConvexError(`Cannot create system role: ${name}`);
      }

      const now = Date.now();

      // Create the role
      const roleId = await ctx.db.insert("roles", {
        name,
        description,
        createdAt: now,
        createdBy: userId,
        isSystem: false,
      });

      // Log the action
      await logAuditEvent(ctx, userId, "create", "roles", roleId, {
        name,
        description: description ?? "",
      });

      return roleId;
    } catch (error) {
      console.error("Error in create role:", error);
      throw error;
    }
  },
});

// Update an existing role
export const update = mutation({
  args: {
    id: v.id("roles"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.id("roles"),
  handler: async (ctx, args) => {
    try {
      const { id, ...updates } = args;
      const userId = await requireUser(ctx);

      // Check if user is admin
      if (!(await isAdmin(ctx))) {
        throw new ConvexError("You don't have permission to update roles");
      }

      // Get the current role
      const role = await ctx.db.get(id);

      if (!role) {
        throw new ConvexError(`Role with ID ${id} not found`);
      }

      // Don't allow modifying system roles
      if (role.isSystem) {
        throw new ConvexError("Cannot modify system roles");
      }

      // If updating name, check for duplicates
      if (updates.name && updates.name !== role.name) {
        const existingRole = await ctx.db
          .query("roles")
          .withIndex("by_name", (q) => q.eq("name", updates.name))
          .first();

        if (existingRole) {
          throw new ConvexError(
            `Role with name '${updates.name}' already exists`,
          );
        }

        // Don't allow renaming to system role names
        const systemRoleValues = Object.values(SYSTEM_ROLES);
        if (systemRoleValues.includes(updates.name)) {
          throw new ConvexError(`Cannot use system role name: ${updates.name}`);
        }
      }

      // Update the role
      await ctx.db.patch(id, {
        ...updates,
        updatedAt: Date.now(),
      });

      // Log the action
      await logAuditEvent(ctx, userId, "update", "roles", id, {
        updateInfo: JSON.stringify(updates),
      });

      return id;
    } catch (error) {
      console.error("Error in update role:", error);
      throw error;
    }
  },
});

// Delete a role
export const remove = mutation({
  args: {
    id: v.id("roles"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      const { id } = args;
      const userId = await requireUser(ctx);

      // Check if user is admin
      if (!(await isAdmin(ctx))) {
        throw new ConvexError("You don't have permission to delete roles");
      }

      // Get the role to check if it exists
      const role = await ctx.db.get(id);

      if (!role) {
        throw new ConvexError(`Role with ID ${id} not found`);
      }

      // Don't allow deleting system roles
      if (role.isSystem) {
        throw new ConvexError("Cannot delete system roles");
      }

      // Find all role-permission associations
      const rolePermissions = await ctx.db
        .query("rolePermissions")
        .withIndex("by_roleId", (q) => q.eq("roleId", id))
        .collect();

      // Delete all role-permission associations
      for (const rp of rolePermissions) {
        await ctx.db.delete(rp._id);
      }

      // Find all user-role associations
      const userRoles = await ctx.db
        .query("userRoles")
        .withIndex("by_roleId", (q) => q.eq("roleId", id))
        .collect();

      // Delete all user-role associations
      for (const ur of userRoles) {
        await ctx.db.delete(ur._id);
      }

      // Delete the role
      await ctx.db.delete(id);

      // Log the action
      await logAuditEvent(ctx, userId, "delete", "roles", id, {
        name: role.name,
      });

      return true;
    } catch (error) {
      console.error("Error in delete role:", error);
      throw error;
    }
  },
});

// Assign a role to a user
export const assignRoleToUser = mutation({
  args: {
    userId: v.string(),
    roleId: v.id("roles"),
  },
  returns: v.id("userRoles"),
  handler: async (ctx, args) => {
    try {
      const { userId: targetUserId, roleId } = args;
      const requestingUserId = await requireUser(ctx);

      // Check if user is admin
      if (!(await isAdmin(ctx))) {
        throw new ConvexError("You don't have permission to assign roles");
      }

      // Check if role exists
      const role = await ctx.db.get(roleId);
      if (!role) {
        throw new ConvexError(`Role with ID ${roleId} not found`);
      }

      // Check if user already has this role
      const existingAssignment = await ctx.db
        .query("userRoles")
        .withIndex("by_userId_roleId", (q) =>
          q.eq("userId", targetUserId).eq("roleId", roleId),
        )
        .first();

      if (existingAssignment) {
        throw new ConvexError(`User already has the role '${role.name}'`);
      }

      const now = Date.now();

      // Assign the role to the user
      const userRoleId = await ctx.db.insert("userRoles", {
        userId: targetUserId,
        roleId,
        assignedAt: now,
        assignedBy: requestingUserId,
      });

      // Log the action
      await logAuditEvent(
        ctx,
        requestingUserId,
        "assign",
        "userRoles",
        userRoleId,
        { targetUserId, roleName: role.name },
      );

      return userRoleId;
    } catch (error) {
      console.error("Error in assign role to user:", error);
      throw error;
    }
  },
});

// Remove a role from a user
export const removeRoleFromUser = mutation({
  args: {
    userId: v.string(),
    roleId: v.id("roles"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      const { userId: targetUserId, roleId } = args;
      const requestingUserId = await requireUser(ctx);

      // Check if user is admin
      if (!(await isAdmin(ctx))) {
        throw new ConvexError("You don't have permission to remove roles");
      }

      // Get the role name for logging
      const role = await ctx.db.get(roleId);
      if (!role) {
        throw new ConvexError(`Role with ID ${roleId} not found`);
      }

      // Find the user-role assignment
      const userRole = await ctx.db
        .query("userRoles")
        .withIndex("by_userId_roleId", (q) =>
          q.eq("userId", targetUserId).eq("roleId", roleId),
        )
        .first();

      if (!userRole) {
        throw new ConvexError(`User does not have the role '${role.name}'`);
      }

      // Remove the role from the user
      await ctx.db.delete(userRole._id);

      // Log the action
      await logAuditEvent(
        ctx,
        requestingUserId,
        "remove",
        "userRoles",
        userRole._id,
        { targetUserId, roleName: role.name },
      );

      return true;
    } catch (error) {
      console.error("Error in remove role from user:", error);
      throw error;
    }
  },
});
