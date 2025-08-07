import { ConvexError } from "convex/values";

import type { PermissionAction, ResourceType } from "./types";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";

/**
 * Gets the authenticated user ID from the Convex auth context.
 *
 * @param ctx - The Convex context (query, mutation, or action)
 * @returns The user ID or null if not authenticated
 */
export async function getUser(
  ctx: QueryCtx | MutationCtx | ActionCtx,
): Promise<string | null> {
  // Get the identity from Clerk auth
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  // In a real application, we might do additional checks or fetch more user data here
  return identity.tokenIdentifier;
}

/**
 * Requires authentication and returns the user ID.
 * Throws an error if the user is not authenticated.
 *
 * @param ctx - The Convex context (query, mutation, or action)
 * @returns The user ID
 * @throws ConvexError if user is not authenticated
 */
export async function requireUser(
  ctx: QueryCtx | MutationCtx | ActionCtx,
): Promise<string> {
  const userId = await getUser(ctx);
  if (!userId) {
    throw new ConvexError(
      "Authentication required. Please log in to continue.",
    );
  }
  return userId;
}

/**
 * Checks if a user has permission to perform an action on a resource.
 *
 * @param ctx - The Convex context (query, mutation, or action)
 * @param resourceType - The type of resource (e.g., "email", "template")
 * @param action - The action to perform (e.g., "read", "write")
 * @param resourceId - The ID of the resource
 * @returns A boolean indicating if the user has permission
 */
export async function hasPermission(
  ctx: QueryCtx | MutationCtx,
  resourceType: ResourceType,
  action: PermissionAction,
  resourceId: Id<"emails"> | Id<"templates">,
): Promise<boolean> {
  const userId = await getUser(ctx);
  if (!userId) return false;

  // If they're the owner, they always have permission
  const resource = await ctx.db.get(resourceId);
  if (resource && resource.userId === userId) {
    return true;
  }

  // Check for explicit permissions in sharedResources
  const sharedResource = await ctx.db
    .query("sharedResources")
    .withIndex("by_resourceId", (q) => q.eq("resourceId", resourceId))
    .filter((q) => q.eq(q.field("sharedWithUserId"), userId))
    .first();

  if (sharedResource?.permissions.includes(action)) {
    return true;
  }

  return false;
}
