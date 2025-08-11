import { ConvexError } from "convex/values";

import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Gets the authenticated user ID from the Convex context
 * @param ctx - The Convex query or mutation context
 * @returns The authenticated user ID
 * @throws ConvexError if the user is not authenticated
 */
export const getAuthenticatedUserId = async (
  ctx: QueryCtx | MutationCtx,
): Promise<string> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError(
      "Unauthorized: You must be logged in to perform this action",
    );
  }
  return identity.subject;
};

/**
 * Checks if the current user is authenticated
 * @param ctx - The Convex query or mutation context
 * @returns True if the user is authenticated, false otherwise
 */
export const isAuthenticated = async (
  ctx: QueryCtx | MutationCtx,
): Promise<boolean> => {
  const identity = await ctx.auth.getUserIdentity();
  return !!identity;
};

/**
 * Gets the authenticated user's identity information
 * @param ctx - The Convex query or mutation context
 * @returns The user identity object or null if not authenticated
 */
export const getUserIdentity = async (ctx: QueryCtx | MutationCtx) => {
  return await ctx.auth.getUserIdentity();
};
