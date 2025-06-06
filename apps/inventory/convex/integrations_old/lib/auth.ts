/**
 * Authentication utilities for the integrations module
 */
import { ConvexError } from "convex/values";

import type { ActionCtx, MutationCtx, QueryCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";

/**
 * Gets the authenticated user ID from the Convex context
 * @param ctx - The Convex query, mutation, or action context
 * @returns The authenticated user ID as an Id<"users">
 * @throws ConvexError if the user is not authenticated
 */
export const getUserId = async (
  ctx: QueryCtx | MutationCtx | ActionCtx,
): Promise<Id<"users">> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      code: "unauthorized",
      message: "You must be logged in to perform this action",
    });
  }

  // Get the user ID from the subject (this depends on your auth provider)
  // For systems like Clerk, the subject is the user ID
  return identity.subject as Id<"users">;
};

/**
 * Gets the authenticated user ID from the Convex context, returning null if not authenticated
 * @param ctx - The Convex query, mutation, or action context
 * @returns The authenticated user ID as an Id<"users"> or null if not authenticated
 */
export const getOptionalUserId = async (
  ctx: QueryCtx | MutationCtx | ActionCtx,
): Promise<Id<"users"> | null> => {
  try {
    return await getUserId(ctx);
  } catch (_error) {
    return null;
  }
};

/**
 * Ensure the user is authenticated and return the user ID
 * @param ctx - The Convex query, mutation, or action context
 * @returns The authenticated user ID
 * @throws ConvexError if the user is not authenticated
 */
export const requireUserId = async (
  ctx: QueryCtx | MutationCtx | ActionCtx,
): Promise<Id<"users">> => {
  return await getUserId(ctx);
};

/**
 * Create an audit log for authentication operations
 * @param ctx - The Convex mutation context
 * @param action - The action performed
 * @param resourceType - The type of resource
 * @param resourceId - The ID of the resource
 * @param metadata - Additional metadata
 */
export const logAuthEvent = async (
  ctx: MutationCtx,
  action: string,
  resourceType: string,
  resourceId:
    | Id<"audit_logs">
    | Id<"connections">
    | Id<"apps">
    | Id<"scenarios">,
  metadata: Record<string, unknown> = {},
): Promise<void> => {
  const userId = await getOptionalUserId(ctx);

  await ctx.db.insert("audit_logs", {
    action,
    resourceType,
    resourceId,
    userId,
    timestamp: Date.now(),
    metadata,
  });
};
