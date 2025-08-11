import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { permissionScopeTypeValidator, } from "./permissionsSchema";
// Import from the new permissionsSchema.ts, assuming it will export this validator.
// If permissionsSchema.ts is created after this, this import might temporarily be invalid
// but will be resolved once permissionsSchema.ts is in place.
// For now, to make this file self-contained until the full refactor of permissionsSchema.ts is done,
// I will redefine it here. It should ultimately be imported.
// Roles table - defines roles that can be assigned to users
export const rolesTable = defineTable({
    name: v.string(), // Role name (e.g., "Admin", "Editor", "Member")
    description: v.string(), // Role description
    isSystem: v.boolean(), // Is this a system role that can't be modified?
    isAssignable: v.boolean(), // Is this role assignable by admins?
    priority: v.number(), // Priority (higher number = higher priority when permissions conflict)
    parentId: v.optional(v.id("roles")), // Parent role for inheritance (optional)
    scope: permissionScopeTypeValidator, // Scope where this role can be used
    customData: v.optional(v.any()), // Custom data for the role
})
    .index("by_name", ["name"])
    .index("by_scope", ["scope"])
    .index("by_parent", ["parentId"]);
// Table to link users to roles (User Role Assignments)
export const userRoleAssignmentsTable = defineTable({
    userId: v.id("users"),
    roleId: v.id("roles"),
    scopeType: permissionScopeTypeValidator, // Using the same validator as rolesTable.scope
    scopeId: v.optional(v.string()), // ID of the specific entity if scope is not global (e.g., courseId, groupId)
})
    .index("by_user_role_scope", ["userId", "roleId", "scopeType", "scopeId"])
    .index("by_role_scope", ["roleId", "scopeType", "scopeId"])
    .index("by_user_scope", ["userId", "scopeType", "scopeId"]); // This is the index hasPermission expects
export const rolesSchema = defineSchema({
    roles: rolesTable,
    userRoleAssignments: userRoleAssignmentsTable, // Add the new table to the schema
});
