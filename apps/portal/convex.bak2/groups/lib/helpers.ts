import { ConvexError } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";

/**
 * Get the user ID associated with a Clerk ID
 */
export async function getUserIdFromClerkId(
  ctx: QueryCtx,
  clerkId: string,
): Promise<Id<"users"> | null> {
  // Get user ID from Clerk ID
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", `clerk:${clerkId}`))
    .first();

  return user?._id ?? null;
}

/**
 * Check if a user is a member of a group
 */
export async function isGroupMember(
  ctx: QueryCtx,
  userId: Id<"users">,
  groupId: Id<"groups">,
): Promise<boolean> {
  const membership = await ctx.db
    .query("groupMembers")
    .withIndex("by_group_user", (q) =>
      q.eq("groupId", groupId).eq("userId", userId),
    )
    .first();

  return !!membership && membership.status === "active";
}

/**
 * Check if a user is an admin or moderator of a group
 */
export async function isGroupAdminOrModerator(
  ctx: QueryCtx,
  userId: Id<"users">,
  groupId: Id<"groups">,
): Promise<boolean> {
  const membership = await ctx.db
    .query("groupMembers")
    .withIndex("by_group_user", (q) =>
      q.eq("groupId", groupId).eq("userId", userId),
    )
    .first();

  return (
    !!membership &&
    membership.status === "active" &&
    (membership.role === "admin" || membership.role === "moderator")
  );
}

/**
 * Get the authenticated user or throw an error
 */
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      code: 401,
      message: "Not authenticated",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .first();

  if (!user) {
    throw new ConvexError({
      code: 404,
      message: "User not found",
    });
  }

  return user;
}

/**
 * Get pending invitations count for a user
 */
export async function getPendingInvitationsCount(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
): Promise<number> {
  if (!userId) return 0;

  const pendingInvitations = await ctx.db
    .query("groupInvitations")
    .withIndex("by_user_status", (q) =>
      q.eq("invitedUserId", userId).eq("status", "pending"),
    )
    .collect();

  return pendingInvitations.length;
}
