import { ConvexError } from "convex/values";

import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";

/**
 * Gets the authenticated user ID from the Convex context
 * @param ctx - The Convex query or mutation context
 * @returns The authenticated user ID
 * @throws ConvexError if the user is not authenticated
 */
export const getAuthenticatedUserId = async (
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError(
      "Unauthorized: You must be logged in to perform this action",
    );
  }

  // Find the user in the database
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new ConvexError("User not found in the database");
  }

  return user._id;
};

/**
 * Gets the authenticated user document from the Convex context
 * @param ctx - The Convex query or mutation context
 * @returns The authenticated user document
 * @throws ConvexError if the user is not authenticated
 */
export const getAuthenticatedUser = async (
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError(
      "Unauthorized: You must be logged in to perform this action",
    );
  }

  // Find the user in the database
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new ConvexError("User not found in the database");
  }

  return user;
};

/**
 * Checks if the current user is authenticated
 * @param ctx - The Convex query or mutation context
 * @returns True if the user is authenticated, false otherwise
 */
export const isAuthenticated = async (
  ctx: QueryCtx | MutationCtx,
): Promise<boolean> => {
  try {
    await getAuthenticatedUserId(ctx);
    return true;
  } catch {
    return false;
  }
};

/**
 * Gets the user identity information from the auth context
 * @param ctx - The Convex query or mutation context
 * @returns The user identity object or null if not authenticated
 */
export const getUserIdentity = async (ctx: QueryCtx | MutationCtx) => {
  return await ctx.auth.getUserIdentity();
};
