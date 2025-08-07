import { v } from "convex/values";

import type {
  GenericQueryCtx,
  IndexRangeBuilder,
  MutationCtx,
  QueryCtx,
} from "../_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type {
  PermissionLevel,
  PermissionScope,
} from "./core/schema/permissionsSchema";
import { internal } from "../_generated/api";
import { internalMutation, internalQuery, query } from "./_generated/server";
// Import the validator without redefining it
import { permissionScopeTypeValidator } from "./core/schema/permissionsSchema";

// Define a specific query builder type to use throughout the file
// This was likely added for a reason, let's try to make it compatible
// or replace its usages carefully if it's truly the source of error.
// For now, let's assume it's needed and try to fix the call sites.
interface QueryBuilder {
  eq: (field: string, value: any) => QueryBuilder;
  collect: () => Promise<any[]>; // Make it async if queries are async
  first: () => Promise<any | null>; // Make it async
  unique: () => Promise<any | null>; // Make it async
}

/**
 * Internal helper to check permission level vs resource ownership
 */
function hasRequiredAccess(
  level: PermissionLevel,
  userId: Id<"users">,
  resourceOwnerId?: Id<"users">,
): boolean {
  if (level === "all") return true;
  if (
    level === "own" &&
    resourceOwnerId &&
    resourceOwnerId.toString() === userId.toString()
  )
    return true;
  // TODO: Implement group checking logic here if needed
  return false;
}

/**
 * Internal implementation of permission checking
 * This is separated from the query to allow direct calling without circular references
 */
async function checkPermission(
  ctx: any,
  userId: Id<"users">,
  permissionKey: string,
  scopeType: PermissionScope,
  scopeId?: string,
  resourceOwnerId?: Id<"users">,
): Promise<boolean> {
  if (!userId) return false; // Ensure user ID is present

  // Check if the user is an admin; if so, grant all permissions
  const userDoc = await ctx.db.get(userId);
  if (userDoc && userDoc.role === "admin") {
    return true;
  }

  // Check direct user permissions first
  const directPermission = await ctx.db
    .query("userPermissions")
    .withIndex("by_user_permission", (q: IndexRangeBuilder) =>
      q.eq("userId", userId).eq("permissionKey", permissionKey),
    )
    .first();

  if (directPermission) {
    // Check if the permission applies to the requested scope
    const scopeMatches =
      directPermission.scopeType === scopeType &&
      (!scopeId || directPermission.scopeId === scopeId);

    if (
      scopeMatches &&
      hasRequiredAccess(directPermission.level, userId, resourceOwnerId)
    ) {
      return true;
    }
  }

  // Get all roles for the user in the specified scope
  const scopedRoleLinks = await ctx.db
    .query("userRoles")
    .withIndex("by_user_scope", (q: IndexRangeBuilder) =>
      q
        .eq("userId", userId)
        .eq("scopeType", scopeType)
        .eq("scopeId", scopeId ?? undefined),
    )
    .collect();

  // Also check global roles if we're looking at a non-global scope
  const globalRoleLinks =
    scopeType !== "global"
      ? await ctx.db
          .query("userRoles")
          .withIndex("by_user_scope", (q: IndexRangeBuilder) =>
            q
              .eq("userId", userId)
              .eq("scopeType", "global" as PermissionScope)
              .eq("scopeId", undefined),
          )
          .collect()
      : [];

  // Combine all roles (with type safety)
  const allRoleLinks = [...scopedRoleLinks, ...globalRoleLinks];
  if (allRoleLinks.length === 0) {
    return false;
  }

  // Check each role for the requested permission
  for (const roleLink of allRoleLinks) {
    const rolePermission = await ctx.db
      .query("rolePermissions")
      .withIndex("by_role_permission", (q: IndexRangeBuilder) =>
        q.eq("roleId", roleLink.roleId).eq("permissionKey", permissionKey),
      )
      .first();

    if (
      rolePermission &&
      hasRequiredAccess(rolePermission.level, userId, resourceOwnerId)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Internal query to check if a user has a specific permission
 */
export const hasPermissionInternal = internalQuery({
  args: {
    userId: v.id("users"),
    permissionKey: v.string(),
    scopeType: permissionScopeTypeValidator,
    scopeId: v.optional(v.string()),
    resourceOwnerId: v.optional(v.id("users")),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return checkPermission(
      ctx,
      args.userId,
      args.permissionKey,
      args.scopeType,
      args.scopeId,
      args.resourceOwnerId,
    );
  },
});

/**
 * Public query to check if the current user has a specific permission
 */
export const hasPermission = query({
  args: {
    permissionKey: v.string(),
    scopeType: v.optional(permissionScopeTypeValidator),
    scopeId: v.optional(v.string()),
    resourceOwnerId: v.optional(v.id("users")),
  },
  returns: v.boolean(),
  handler: async (ctx, args): Promise<boolean> => {
    // Get the authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    // Find the user record
    const user = await ctx.db
      .query("users")
      .withIndex(
        "by_token",
        (
          q: IndexRangeBuilder<
            Doc<"users">,
            ["tokenIdentifier", "_creationTime"],
            0
          >,
        ) => q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      return false;
    }

    // Call the internal implementation function directly
    return checkPermission(
      ctx,
      user._id,
      args.permissionKey,
      args.scopeType ?? "global",
      args.scopeId,
      args.resourceOwnerId,
    );
  },
});

/**
 * Internal implementation for getting all user permissions
 * This is separated to avoid circular references
 */
async function getUserPermissions(
  ctx: any,
  userId: Id<"users">,
  scopeType?: PermissionScope,
  scopeId?: string,
): Promise<{ permissionKey: string; level: PermissionLevel }[]> {
  if (!userId) return [];

  let userRoleLinks: { roleId: Id<"roles"> }[] = [];

  if (scopeType && scopeId) {
    userRoleLinks = await ctx.db
      .query("userRoles")
      .withIndex(
        "by_user_scope",
        (
          q: IndexRangeBuilder<
            Doc<"userRoles">,
            ["userId", "scopeType", "scopeId"],
            0
          >,
        ) =>
          q
            .eq("userId", userId)
            .eq("scopeType", scopeType)
            .eq("scopeId", scopeId),
      )
      .collect();
  } else if (scopeType === "global" || (!scopeType && !scopeId)) {
    userRoleLinks = await ctx.db
      .query("userRoles")
      .withIndex(
        "by_user_scope",
        (
          q: IndexRangeBuilder<
            Doc<"userRoles">,
            ["userId", "scopeType", "scopeId"],
            0
          >,
        ) =>
          q
            .eq("userId", userId)
            .eq("scopeType", "global")
            .eq("scopeId", undefined),
      )
      .collect();
  } else if (scopeType && !scopeId) {
    userRoleLinks = await ctx.db
      .query("userRoles")
      .withIndex(
        "by_user_scope",
        (
          q: IndexRangeBuilder<
            Doc<"userRoles">,
            ["userId", "scopeType", "scopeId"],
            0
          >,
        ) =>
          q
            .eq("userId", userId)
            .eq("scopeType", scopeType)
            .eq("scopeId", undefined),
      )
      .collect();
  }

  const globalUserRoleLinks = await ctx.db
    .query("userRoles")
    .withIndex(
      "by_user_scope",
      (
        q: IndexRangeBuilder<
          Doc<"userRoles">,
          ["userId", "scopeType", "scopeId"],
          0
        >,
      ) =>
        q
          .eq("userId", userId)
          .eq("scopeType", "global")
          .eq("scopeId", undefined),
    )
    .collect();

  const allUserRoleLinksMap = new Map<string, { roleId: Id<"roles"> }>();
  userRoleLinks.forEach((link: { roleId: Id<"roles"> }) =>
    allUserRoleLinksMap.set(link.roleId.toString(), link),
  );
  globalUserRoleLinks.forEach((link: { roleId: Id<"roles"> }) => {
    if (!allUserRoleLinksMap.has(link.roleId.toString())) {
      allUserRoleLinksMap.set(link.roleId.toString(), link);
    }
  });
  const finalUserRoleLinks = Array.from(allUserRoleLinksMap.values());

  if (finalUserRoleLinks.length === 0) return [];

  const roleIds = finalUserRoleLinks.map((link) => link.roleId);

  const allPermissionsForUser: {
    permissionKey: string;
    level: PermissionLevel;
  }[] = [];

  for (const roleId of roleIds) {
    const permissions = await ctx.db
      .query("rolePermissions")
      .withIndex(
        "by_role",
        (q: IndexRangeBuilder<Doc<"rolePermissions">, ["roleId"], 0>) =>
          q.eq("roleId", roleId),
      )
      .collect();

    for (const rp of permissions) {
      const existing = allPermissionsForUser.find(
        (p) => p.permissionKey === rp.permissionKey,
      );
      if (existing) {
        if (rp.level === "all") existing.level = "all";
        else if (rp.level === "group" && existing.level !== "all")
          existing.level = "group";
        else if (
          rp.level === "own" &&
          existing.level !== "all" &&
          existing.level !== "group"
        )
          existing.level = "own";
      } else {
        allPermissionsForUser.push({
          permissionKey: rp.permissionKey,
          level: rp.level,
        });
      }
    }
  }
  return allPermissionsForUser;
}

export const getAllUserPermissions = internalQuery({
  args: {
    userId: v.id("users"),
    scopeType: v.optional(permissionScopeTypeValidator),
    scopeId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      permissionKey: v.string(),
      level: v.union(
        v.literal("none"),
        v.literal("own"),
        v.literal("group"),
        v.literal("all"),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    return getUserPermissions(ctx, args.userId, args.scopeType, args.scopeId);
  },
});

export const getMyPermissions = query({
  args: {
    scopeType: v.optional(permissionScopeTypeValidator),
    scopeId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      permissionKey: v.string(),
      level: v.union(
        v.literal("none"),
        v.literal("own"),
        v.literal("group"),
        v.literal("all"),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex(
        "by_token",
        (
          q: IndexRangeBuilder<Doc<"users">, ["tokenIdentifier", "subject"], 0>,
        ) => q.eq("tokenIdentifier", identity.subject),
      )
      .unique();

    if (!user) return [];

    // Call the internal implementation function directly
    return getUserPermissions(ctx, user._id, args.scopeType, args.scopeId);
  },
});

export const ensureUserRegistered = internalMutation({
  args: {
    clerkId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Rely on Convex inference for ctx and args type here
    let user = await ctx.db
      .query("users")
      .withIndex(
        "by_token",
        (q: IndexRangeBuilder<Doc<"users">, ["tokenIdentifier"], 0>) =>
          q.eq("tokenIdentifier", args.clerkId),
      )
      .unique();

    if (user) return user;

    if (!args.email) {
      console.warn(
        `Cannot create user for clerkId ${args.clerkId} without an email.`,
      );
      return null;
    }

    const defaultUserRole = await ctx.db
      .query("roles")
      .withIndex("by_name", (q: IndexRangeBuilder<Doc<"roles">, ["name"], 0>) =>
        q.eq("name", "User"),
      )
      .first();

    if (!defaultUserRole) {
      console.error(
        "Default 'User' role not found. Cannot assign to new user.",
      );
    }

    try {
      // Only include known properties in the insert
      const newUserId = await ctx.db.insert("users", {
        tokenIdentifier: args.clerkId,
        name: args.name ?? args.email,
        email: args.email,
        role: "user",
        // imageUrl was causing a type error, so only include it if the schema allows
        // If it's needed, update the schema first
      });

      user = await ctx.db.get(newUserId);

      if (user && defaultUserRole) {
        await ctx.db.insert("userRoles", {
          userId: newUserId,
          roleId: defaultUserRole._id,
          scopeType: "global",
          assignedAt: Date.now(),
        });
        console.log(
          `New user ${args.name ?? args.email} (ID: ${newUserId}) created and assigned 'User' role.`,
        );
      } else if (user) {
        console.log(
          `New user ${args.name ?? args.email} (ID: ${newUserId}) created, but 'User' role not found or failed to assign.`,
        );
      }
      return user;
    } catch (error: unknown) {
      // Type-safe error handling
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `Failed to create user for clerkId ${args.clerkId}: ${errorMessage}`,
      );
      return null;
    }
  },
});

// Type for UI permission display
interface PermissionDisplay {
  key: string;
  name: string;
  level: PermissionLevel;
  scopeInfo?: string;
}

/**
 * Internal implementation for getting user permissions in UI format
 */
async function getUserPermissionsForUI(
  ctx: any,
  userId: Id<"users">,
  scopeType?: PermissionScope,
  scopeId?: string,
): Promise<PermissionDisplay[]> {
  // Get the user's permissions
  const userPerms = await getUserPermissions(ctx, userId, scopeType, scopeId);

  // Convert to display format
  return userPerms.map((p) => ({
    key: p.permissionKey,
    name: p.permissionKey.split(":").join(" "), // Simple display name
    level: p.level,
    scopeInfo: scopeType
      ? `Scope: ${scopeType}${scopeId ? `:${scopeId}` : ""}`
      : "Global",
  }));
}

/**
 * Get all permissions for the currently authenticated user
 */
export const getCurrentUserPermissions = query({
  args: {
    scopeType: v.optional(permissionScopeTypeValidator),
    scopeId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      key: v.string(),
      name: v.string(),
      level: v.union(
        v.literal("none"),
        v.literal("own"),
        v.literal("group"),
        v.literal("all"),
      ),
      scopeInfo: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args): Promise<PermissionDisplay[]> => {
    // Get the authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Find the user record
    const user = await ctx.db
      .query("users")
      .withIndex(
        "by_token",
        (
          q: IndexRangeBuilder<
            Doc<"users">,
            ["tokenIdentifier", "_creationTime"],
            0
          >,
        ) => q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      return [];
    }

    try {
      return getUserPermissionsForUI(
        ctx,
        user._id,
        args.scopeType,
        args.scopeId,
      );
    } catch (error: unknown) {
      console.error("Error fetching user permissions:", error);
      return [];
    }
  },
});
