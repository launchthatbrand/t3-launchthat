import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

// Constants for system roles
export const SYSTEM_ROLES = {
  ADMIN: "admin",
  USER: "user",
  GUEST: "guest",
};

// Constants for resource types
export const RESOURCE_TYPES = {
  EMAIL: "emails",
  TEMPLATE: "templates",
  FIELD: "fields",
  HIGHLIGHT: "highlights",
  PARSED_RESULT: "parsedResults",
};

// Constants for actions
export const ACTIONS = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  SHARE: "share",
};

/**
 * Check if a user has a specific permission for a resource
 */
export async function hasPermission(
  ctx: QueryCtx | MutationCtx,
  resourceType: string,
  action: string,
  resourceId: Id<any>,
): Promise<boolean> {
  const userId = await requireUser(ctx);

  // First check if user is admin - admins have all permissions
  if (await isAdmin(ctx)) {
    return true;
  }

  // Check if user is the owner of the resource
  let resource = null;
  if (resourceType === RESOURCE_TYPES.EMAIL) {
    resource = await ctx.db.get(resourceId as Id<"emails">);
  } else if (resourceType === RESOURCE_TYPES.TEMPLATE) {
    resource = await ctx.db.get(resourceId as Id<"templates">);
  } else if (resourceType === RESOURCE_TYPES.FIELD) {
    resource = await ctx.db.get(resourceId as Id<"fields">);
  } else if (resourceType === RESOURCE_TYPES.HIGHLIGHT) {
    resource = await ctx.db.get(resourceId as Id<"highlights">);
  } else if (resourceType === RESOURCE_TYPES.PARSED_RESULT) {
    resource = await ctx.db.get(resourceId as Id<"parsedResults">);
  }

  if (!resource) {
    return false;
  }

  // If user is the owner, they have all permissions
  if (resource.userId === userId) {
    return true;
  }

  // Check for shared resources permissions
  const sharedResource = await ctx.db
    .query("sharedResources")
    .withIndex("by_resourceType_resourceId_sharedWithUserId", (q) =>
      q
        .eq("resourceType", resourceType)
        .eq("resourceId", resourceId)
        .eq("sharedWithUserId", userId),
    )
    .first();

  if (sharedResource && sharedResource.permissions.includes(action)) {
    return true;
  }

  // User doesn't have permission
  return false;
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(ctx: QueryCtx | MutationCtx): Promise<boolean> {
  const userId = await requireUser(ctx);

  // Get user roles
  const userRoles = await ctx.db
    .query("userRoles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();

  if (userRoles.length === 0) {
    return false;
  }

  // Get the actual role objects
  const roleIds = userRoles.map((ur) => ur.roleId);

  for (const roleId of roleIds) {
    const role = await ctx.db.get(roleId);
    if (role && role.name === SYSTEM_ROLES.ADMIN) {
      return true;
    }
  }

  return false;
}

/**
 * Log an audit event for security tracking
 */
export async function logAuditEvent(
  ctx: MutationCtx,
  userId: string,
  action: string,
  resourceType: string,
  resourceId: Id<any>,
  metadata?: Record<string, string>,
): Promise<Id<"auditLogs">> {
  const auditLogId = await ctx.db.insert("auditLogs", {
    userId,
    action,
    resourceType,
    resourceId: resourceId.toString(),
    timestamp: Date.now(),
    metadata: metadata || {},
  });

  return auditLogId;
}

// Get audit logs for a user or resource
export const getAuditLogs = query({
  args: {
    userId: v.optional(v.string()),
    resourceType: v.optional(v.string()),
    resourceId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("auditLogs"),
      userId: v.string(),
      action: v.string(),
      resourceType: v.string(),
      resourceId: v.string(),
      timestamp: v.number(),
      metadata: v.any(),
    }),
  ),
  handler: async (ctx, args) => {
    // Check if user is admin
    if (!(await isAdmin(ctx))) {
      throw new ConvexError("Only admins can view audit logs");
    }

    let query = ctx.db.query("auditLogs");

    // Apply filters
    if (args.userId) {
      query = query.withIndex("by_userId", (q) => q.eq("userId", args.userId));
    } else if (args.resourceType && args.resourceId) {
      query = query.withIndex("by_resourceType_resourceId", (q) =>
        q
          .eq("resourceType", args.resourceType)
          .eq("resourceId", args.resourceId),
      );
    } else if (args.resourceType) {
      query = query.withIndex("by_resourceType", (q) =>
        q.eq("resourceType", args.resourceType),
      );
    }

    // Order by timestamp (most recent first)
    query = query.order("desc");

    // Apply limit if provided
    if (args.limit && args.limit > 0) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

// Query to get user's roles
export const getUserRoles = query({
  args: {
    userId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("roles"),
      name: v.string(),
      description: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    try {
      // Get target user ID (current user if not specified)
      const requestingUserId = await requireUser(ctx);
      const targetUserId = args.userId || requestingUserId;

      // If requesting for another user, check if requester is admin
      if (targetUserId !== requestingUserId && !(await isAdmin(ctx))) {
        throw new ConvexError(
          "You don't have permission to view other users' roles",
        );
      }

      // Get user's role assignments
      const userRoles = await ctx.db
        .query("userRoles")
        .withIndex("by_userId", (q) => q.eq("userId", targetUserId))
        .collect();

      if (userRoles.length === 0) {
        return [];
      }

      // Get role details
      const roleIds = userRoles.map((ur) => ur.roleId);
      const roles = [];

      for (const roleId of roleIds) {
        const role = await ctx.db.get(roleId);
        if (role) {
          roles.push({
            _id: role._id,
            name: role.name,
            description: role.description,
          });
        }
      }

      return roles;
    } catch (error) {
      console.error("Error in getUserRoles:", error);
      throw error;
    }
  },
});

// Initialize default roles and permissions
export const initializeDefaultRolesAndPermissions = mutation({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    try {
      const userId = await requireUser(ctx);
      const now = Date.now();

      // Check if roles already exist
      const existingAdmin = await ctx.db
        .query("roles")
        .withIndex("by_name", (q) => q.eq("name", SYSTEM_ROLES.ADMIN))
        .first();

      if (existingAdmin) {
        // Roles already initialized
        return false;
      }

      // Create system roles
      const adminRoleId = await ctx.db.insert("roles", {
        name: SYSTEM_ROLES.ADMIN,
        description: "Administrator with full access",
        createdAt: now,
        createdBy: userId,
        isSystem: true,
      });

      const userRoleId = await ctx.db.insert("roles", {
        name: SYSTEM_ROLES.USER,
        description: "Regular user with standard permissions",
        createdAt: now,
        createdBy: userId,
        isSystem: true,
      });

      const guestRoleId = await ctx.db.insert("roles", {
        name: SYSTEM_ROLES.GUEST,
        description: "Guest user with limited read access",
        createdAt: now,
        createdBy: userId,
        isSystem: true,
      });

      // Create permissions
      const permissionIds = {};

      // For each resource type and action, create a permission
      for (const resourceType of Object.values(RESOURCE_TYPES)) {
        for (const action of Object.values(ACTIONS)) {
          const permissionId = await ctx.db.insert("permissions", {
            resource: resourceType,
            action,
            description: `Permission to ${action} ${resourceType}`,
          });

          permissionIds[`${resourceType}_${action}`] = permissionId;
        }
      }

      // Assign permissions to roles
      // Admin gets all permissions
      for (const permissionId of Object.values(permissionIds)) {
        await ctx.db.insert("rolePermissions", {
          roleId: adminRoleId,
          permissionId,
          createdAt: now,
          createdBy: userId,
        });
      }

      // User gets basic permissions (create, read, update own resources)
      for (const resourceType of Object.values(RESOURCE_TYPES)) {
        await ctx.db.insert("rolePermissions", {
          roleId: userRoleId,
          permissionId: permissionIds[`${resourceType}_${ACTIONS.CREATE}`],
          createdAt: now,
          createdBy: userId,
        });

        await ctx.db.insert("rolePermissions", {
          roleId: userRoleId,
          permissionId: permissionIds[`${resourceType}_${ACTIONS.READ}`],
          createdAt: now,
          createdBy: userId,
        });

        await ctx.db.insert("rolePermissions", {
          roleId: userRoleId,
          permissionId: permissionIds[`${resourceType}_${ACTIONS.UPDATE}`],
          createdAt: now,
          createdBy: userId,
        });
      }

      // Guest only gets read permissions for emails and templates
      await ctx.db.insert("rolePermissions", {
        roleId: guestRoleId,
        permissionId: permissionIds[`${RESOURCE_TYPES.EMAIL}_${ACTIONS.READ}`],
        createdAt: now,
        createdBy: userId,
      });

      await ctx.db.insert("rolePermissions", {
        roleId: guestRoleId,
        permissionId:
          permissionIds[`${RESOURCE_TYPES.TEMPLATE}_${ACTIONS.READ}`],
        createdAt: now,
        createdBy: userId,
      });

      // Assign the requesting user the admin role
      await ctx.db.insert("userRoles", {
        userId,
        roleId: adminRoleId,
        assignedAt: now,
        assignedBy: userId,
      });

      // Log the initialization
      await logAuditEvent(
        ctx,
        userId,
        "initialize",
        "roles_permissions",
        "system",
        { message: "Initialized default roles and permissions" },
      );

      return true;
    } catch (error) {
      console.error("Error initializing roles and permissions:", error);
      throw error;
    }
  },
});
