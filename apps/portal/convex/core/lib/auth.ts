import type { Id } from "../../_generated/dataModel";
import type { ActionCtx, MutationCtx, QueryCtx } from "../../_generated/server";

/**
 * Retrieves the authenticated user's ID (subject) from the context.
 * Throws an error if the user is not authenticated.
 *
 * @param ctx - The Convex query, mutation, or action context.
 * @returns The authenticated user's ID (subject).
 * @throws Error if the user is not authenticated.
 */
export async function getAuthenticatedUserId(
  ctx: QueryCtx | MutationCtx | ActionCtx,
): Promise<Id<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error(
      "User not authenticated. Unable to retrieve user identity.",
    );
  }
  // Assuming the subject is the user's ID in the "users" table.
  // If your user ID / subject comes from a different source or has a different type,
  // adjust the return type and casting accordingly.
  return identity.subject as Id<"users">;
}

/**
 * Retrieves the authenticated user's identity object.
 * Returns null if the user is not authenticated.
 *
 * @param ctx - The Convex query, mutation, or action context.
 * @returns The user identity object or null if not authenticated.
 */
export async function getOptionalAuthenticatedUserIdentity(
  ctx: QueryCtx | MutationCtx | ActionCtx,
) {
  const identity = await ctx.auth.getUserIdentity();
  return identity;
}

/**
 * Retrieves the authenticated user's ID (subject) from the context.
 * Returns null if the user is not authenticated.
 *
 * @param ctx - The Convex query, mutation, or action context.
 * @returns The authenticated user's ID (subject) or null.
 */
export async function getOptionalAuthenticatedUserId(
  ctx: QueryCtx | MutationCtx | ActionCtx,
): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  const subject = identity?.subject;
  return subject ? (subject as Id<"users">) : null;
}
