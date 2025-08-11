import { v } from "convex/values";
import { query } from "../../_generated/server";
import { hasPermission } from "../lib/permissions";
// Get all available permissions from the permissions table
export const getPermissions = query({
    args: {},
    returns: v.array(v.object({
        _id: v.id("permissions"),
        _creationTime: v.number(),
        key: v.string(),
        name: v.string(),
        description: v.string(),
        resource: v.string(),
        action: v.string(),
        defaultLevel: v.union(v.literal("none"), v.literal("own"), v.literal("group"), v.literal("all")),
        isSystem: v.boolean(),
        category: v.optional(v.string()),
        dependencies: v.optional(v.array(v.string())),
    })),
    handler: async (ctx) => {
        const permissions = await ctx.db.query("permissions").collect();
        return permissions;
    },
});
// Check if a user has a specific permission (optionally within a scope)
export const checkUserPermission = query({
    args: {
        userId: v.id("users"),
        permissionKey: v.string(),
        scopeType: v.optional(v.union(v.literal("global"), v.literal("group"), v.literal("course"), v.literal("organization"))),
        scopeId: v.optional(v.string()),
        resourceOwnerId: v.optional(v.id("users")),
    },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        const has = await hasPermission(ctx, args.userId, args.permissionKey, (args.scopeType ?? "global"), args.scopeId ?? undefined, args.resourceOwnerId ?? undefined);
        return has;
    },
});
