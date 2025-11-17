import { v } from "convex/values";

import { mutation } from "../../_generated/server";
import { requirePermission } from "../lib/permissions";
import { permissionScopeTypeValidator } from "./schema";

export const createRole = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    scope: permissionScopeTypeValidator,
    isAssignable: v.boolean(),
    priority: v.number(),
    parentId: v.optional(v.id("roles")),
  },
  returns: v.object({ _id: v.id("roles") }),
  handler: async (ctx, args) => {
    await requirePermission(ctx, "admin:manage_permissions");

    const roleId = await ctx.db.insert("roles", {
      name: args.name,
      description: args.description,
      scope: args.scope,
      isAssignable: args.isAssignable,
      priority: args.priority,
      parentId: args.parentId,
      isSystem: false,
    });

    return { _id: roleId };
  },
});

export const deletePermission = mutation({
  args: {
    permissionId: v.id("permissions"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    await requirePermission(ctx, "admin:manage_permissions");

    const existing = await ctx.db.get(args.permissionId);
    if (!existing) {
      return { success: false };
    }

    await ctx.db.delete(args.permissionId);
    return { success: true };
  },
});

export const deleteRole = mutation({
  args: {
    roleId: v.id("roles"),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    await requirePermission(ctx, "admin:manage_permissions");

    const role = await ctx.db.get(args.roleId);
    if (!role || role.isSystem) {
      return { success: false };
    }

    await ctx.db.delete(args.roleId);
    return { success: true };
  },
});
