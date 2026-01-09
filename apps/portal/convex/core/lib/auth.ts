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
  // Prefer resolving by tokenIdentifier, but fall back to Clerk subject (clerk user id).
  let user =
    (await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()) ?? null;
  if (!user && typeof identity.subject === "string" && identity.subject.trim()) {
    user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  }

  if (!user) {
    throw new Error("User not found in database");
  }

  return user._id;
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
  if (!identity) return null;
  let user =
    (await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()) ?? null;
  if (!user && typeof identity.subject === "string" && identity.subject.trim()) {
    user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  }
  return user?._id ?? null;
}
