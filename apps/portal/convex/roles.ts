import { v } from "convex/values";

// Use top-level import type
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
// Import 'api' from './_generated/api' as per convex-rules.mdc
import { api } from "./_generated/api";
import { mutation, query } from "./_generated/server";
// Import the consolidated requireAdmin from central permissions module
import { requireAdmin } from "./lib/permissions/requirePermission";

// Define role types for better type safety
export type UserRole = "admin" | "user"; // Restricting to admin/user based on schema

/**
 * Helper to get the Convex user document based on the Clerk identity.
 * Throws an error if the user is not authenticated or not found in the DB.
 * @param ctx - The query or mutation context.
 * @returns The user document.
 */
const getUserByTokenIdentifier = async (
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (user === null) {
    throw new Error("User not found");
  }

  return user;
};

/**
 * Get all roles in the system.
 * Only admin users can see all roles.
 */
export const getRoles = query({
  args: {},
  handler: async (ctx) => {
    try {
      // Check if user is an admin
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        console.warn("Unauthenticated user attempted to get roles");
        return [];
      }

      // Get the user from the database
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .first();

      if (!user || user.role !== "admin") {
        console.warn("Non-admin user attempted to get roles");
        return [];
      }

      // Get all roles
      const roles = await ctx.db.query("roles").collect();
      return roles;
    } catch (error) {
      console.error("Error getting roles:", error);
      return [];
    }
  },
});

/**
 * Gets the role of the currently authenticated user.
 * Throws an error if the user is not authenticated or not found.
 */
export const getCurrentUserRole = query({
  args: {},
  handler: async (ctx): Promise<UserRole> => {
    const user = await getUserByTokenIdentifier(ctx);
    // The schema already validates the role is 'admin' or 'user'
    return user.role as UserRole;
  },
});

/**
 * Checks if the currently authenticated user has the specified role.
 * Returns false if the user is not authenticated, not found, or doesn't have the role.
 */
export const hasRole = query({
  args: { role: v.union(v.literal("admin"), v.literal("user")) },
  handler: async (ctx, args): Promise<boolean> => {
    try {
      const user = await getUserByTokenIdentifier(ctx);
      return user.role === args.role;
    } catch (error) {
      // Log or handle the error minimally
      console.warn(
        "Role check failed:",
        error instanceof Error ? error.message : String(error),
      );
      return false;
    }
  },
});

/**
 * Checks if the currently authenticated user is an admin.
 * Returns false if the user is not authenticated, not found, or not an admin.
 */
export const isAdmin = query({
  args: {},
  handler: async (ctx): Promise<boolean> => {
    // Use ctx.runQuery with the correctly imported 'api' object
    return await ctx.runQuery(api.roles.hasRole, { role: "admin" });
  },
});

// --- Mutation Functions ---

/**
 * Admin-only function to update a user's role.
 */
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    newRole: v.union(v.literal("admin"), v.literal("user")), // Use correct UserRole type
  },
  handler: async (ctx, args) => {
    // Verify the caller is an admin using the imported helper
    await requireAdmin(ctx);

    // Check if target user exists (optional, but good practice)
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error(`User with ID ${args.userId} not found.`);
    }

    // Update the user's role
    await ctx.db.patch(args.userId, {
      role: args.newRole,
    });

    console.log(
      `User ${args.userId} role updated to ${args.newRole} by admin.`,
    );
    // Consider returning something meaningful, or null if nothing else needed
    return null;
  },
});

// Note: A function to update roles might be better placed in an admin-specific file
// or added later when the admin panel functionality is built.
// --- Helper for Access Control ---

/**
 * Throws an error if the current user does not have the required role.
 * To be used inside other queries or mutations to enforce access control.
 * @param ctx - The query or mutation context.
 * @param requiredRole - The role required for the operation.
 */
export const requireRole = async (
  ctx: QueryCtx | MutationCtx,
  requiredRole: UserRole,
): Promise<void> => {
  const user = await getUserByTokenIdentifier(ctx); // Throws if unauthenticated/not found
  if (user.role !== requiredRole) {
    throw new Error(`Unauthorized: '${requiredRole}' role required.`);
  }
};
