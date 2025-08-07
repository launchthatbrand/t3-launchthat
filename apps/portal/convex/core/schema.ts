/**
 * Core Schema
 *
 * Consolidated schema for all core modules in the unified architecture.
 * This file re-exports schemas from each modular subfolder.
 */

import { defineSchema } from "convex/server";

// Import individual table definitions from their respective subfolders
import { auditLogsTable } from "./auditLog/schema";
import { categoriesSchema } from "./categories/schema";
import {
  contentTypeFieldsTable,
  contentTypesTable,
} from "./contentTypes/schema";
import { menuItemsTable, menusTable } from "./menus/schema";
import { optionsTable } from "./options/schema";
import {
  permissionAuditLogTable,
  permissionsTable,
  rolePermissionsTable,
  userPermissionsTable,
  userRolesTable,
} from "./permissions/schema";
import { postsTable } from "./posts/schema";
import { rolesTable } from "./roles/schema";

// Create the unified core schema by combining all modular table definitions
export const coreSchema = defineSchema({
  // Content Types (formerly CMS)
  contentTypes: contentTypesTable,
  contentTypeFields: contentTypeFieldsTable,

  // Posts (formerly CMS)
  posts: postsTable,

  // Menus (formerly CMS)
  menus: menusTable,
  menuItems: menuItemsTable,

  // Categories (derived from posts for now - empty placeholder)
  ...categoriesSchema,

  // Options (Core functionality)
  options: optionsTable,

  // Permissions (Core functionality)
  permissions: permissionsTable,
  userRoles: userRolesTable,
  rolePermissions: rolePermissionsTable,
  userPermissions: userPermissionsTable,
  permissionAuditLog: permissionAuditLogTable,

  // Roles (Core functionality)
  roles: rolesTable,

  // Audit Log (Core functionality)
  auditLogs: auditLogsTable,
});

export default coreSchema;
