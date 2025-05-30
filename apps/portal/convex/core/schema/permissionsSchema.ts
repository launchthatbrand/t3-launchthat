import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define permission types for better type safety
export type ResourceType =
  | "global"
  | "user"
  | "group"
  | "post"
  | "content"
  | "file"
  | "calendar"
  | "event"
  | "course"
  | "product"
  | "order"
  | "download"
  | "setting";

export type ActionType =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "manage"
  | "approve"
  | "assign"
  | "view"
  | "edit";

// Format: resource:action (e.g., "users:create", "content:read")
export type PermissionKey = `${ResourceType}:${ActionType}`;

// Define permission level
export type PermissionLevel = "none" | "own" | "group" | "all";

// Define permission scope (where this permission applies)
export type PermissionScope = "global" | "group" | "course" | "organization";

// Export the validator for PermissionScope - used by rolesSchema.ts and other tables here
export const permissionScopeTypeValidator = v.union(
  v.literal("global"),
  v.literal("group"),
  v.literal("course"),
  v.literal("organization"),
);

// Permission table - defines all available permissions in the system
export const permissionsTable = defineTable({
  key: v.string(),
  name: v.string(),
  description: v.string(),
  resource: v.string(),
  action: v.string(),
  defaultLevel: v.union(
    v.literal("none"),
    v.literal("own"),
    v.literal("group"),
    v.literal("all"),
  ),
  isSystem: v.boolean(),
  category: v.optional(v.string()),
  dependencies: v.optional(v.array(v.string())),
})
  .index("by_key", ["key"])
  .index("by_resource", ["resource"])
  .index("by_category", ["category"]);

// Role permissions - defines which permissions are granted to which roles
export const rolePermissionsTable = defineTable({
  roleId: v.id("roles"),
  permissionKey: v.string(),
  level: v.union(
    v.literal("none"),
    v.literal("own"),
    v.literal("group"),
    v.literal("all"),
  ),
})
  .index("by_role", ["roleId"])
  .index("by_permission", ["permissionKey"])
  .index("by_role_permission", ["roleId", "permissionKey"]);

// User roles - assigns roles to users
export const userRolesTable = defineTable({
  userId: v.id("users"),
  roleId: v.id("roles"),
  scopeId: v.optional(v.string()),
  scopeType: permissionScopeTypeValidator,
  assignedAt: v.number(),
  assignedBy: v.optional(v.id("users")),
  expiresAt: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_role", ["roleId"])
  .index("by_user_scope", ["userId", "scopeType", "scopeId"]);

// User direct permissions - for custom permissions not tied to roles
export const userPermissionsTable = defineTable({
  userId: v.id("users"),
  permissionKey: v.string(),
  level: v.union(
    v.literal("none"),
    v.literal("own"),
    v.literal("group"),
    v.literal("all"),
  ),
  scopeId: v.optional(v.string()),
  scopeType: permissionScopeTypeValidator,
  assignedAt: v.number(),
  assignedBy: v.optional(v.id("users")),
  expiresAt: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_permission", ["permissionKey"])
  .index("by_user_permission", ["userId", "permissionKey"])
  .index("by_user_scope", ["userId", "scopeType", "scopeId"]);

// Permission audit log - tracks permission changes
export const permissionAuditLogTable = defineTable({
  action: v.union(
    v.literal("role_assigned"),
    v.literal("role_removed"),
    v.literal("permission_granted"),
    v.literal("permission_revoked"),
    v.literal("role_created"),
    v.literal("role_updated"),
    v.literal("role_deleted"),
  ),
  performedBy: v.id("users"),
  timestamp: v.number(),
  targetUserId: v.optional(v.id("users")),
  targetRoleId: v.optional(v.id("roles")),
  permissionKey: v.optional(v.string()),
  previousValue: v.optional(v.any()),
  newValue: v.optional(v.any()),
  metadata: v.optional(v.any()),
})
  .index("by_timestamp", ["timestamp"])
  .index("by_performer", ["performedBy"])
  .index("by_target_user", ["targetUserId"])
  .index("by_target_role", ["targetRoleId"]);

export const permissionsSchema = defineSchema({
  permissions: permissionsTable,
  rolePermissions: rolePermissionsTable,
  userRoles: userRolesTable,
  userPermissions: userPermissionsTable,
  permissionAuditLog: permissionAuditLogTable,
});
