import { v } from "convex/values";

import type { PermissionKey, PermissionScope } from "./schema";
import { query } from "../../_generated/server";
import { hasPermission } from "../lib/permissions";
import { permissionScopeTypeValidator } from "./schema";

// Get all available permissions from the permissions table
export const getPermissions = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("permissions"),
      _creationTime: v.number(),
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
    }),
  ),
  handler: async (ctx) => {
    const permissions = await ctx.db.query("permissions").collect();
    return permissions;
  },
});

export const getRoles = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("roles"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      isSystem: v.boolean(),
      isAssignable: v.boolean(),
      priority: v.number(),
      parentId: v.optional(v.id("roles")),
      scope: permissionScopeTypeValidator,
      customData: v.optional(v.any()),
    }),
  ),
  handler: async (ctx) => {
    const roles = await ctx.db.query("roles").collect();
    return roles;
  },
});

// Check if a user has a specific permission (optionally within a scope)
export const checkUserPermission = query({
  args: {
    userId: v.id("users"),
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
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const has = await hasPermission(
      ctx,
      args.userId,
      args.permissionKey as PermissionKey,
      (args.scopeType ?? "global") as PermissionScope,
      args.scopeId ?? undefined,
      args.resourceOwnerId ?? undefined,
    );
    return has;
  },
});
