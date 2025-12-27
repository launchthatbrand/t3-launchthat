import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { query } from "../_generated/server";
import { PORTAL_TENANT_ID } from "../constants";

// NOTE: We intentionally avoid a large `v.object({...})` return validator here.
// In this repo, TypeScript can sometimes hit inference limits ("excessively deep")
// inside `query({ returns: ... })` generics, which then cascades into `ctx.db`
// becoming error-typed and breaks `.withIndex(...)` chains.

const getUserByClerkId = async (
  ctx: QueryCtx,
  clerkId: string,
): Promise<{
  _id: Id<"users">;
  organizationId?: Id<"organizations"> | null;
} | null> => {
  // Mirrors `core/users/queries:getUserByClerkId` (tokenIdentifier lookup).
  const tokenIdentifier = `https://topical-raccoon-68.clerk.accounts.dev|${clerkId}`;
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .unique();
  if (!user) return null;
  return {
    _id: user._id,
    organizationId: user.organizationId ?? null,
  };
};

/**
 * Get unread count for the active org (by Clerk ID)
 */
export const getUnreadCountByClerkIdAndOrgId = query({
  args: {
    clerkId: v.string(),
    orgId: v.optional(v.id("organizations")),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await getUserByClerkId(ctx, args.clerkId);

    if (!user) return 0;

    const orgId: Id<"organizations"> =
      args.orgId ?? user.organizationId ?? PORTAL_TENANT_ID;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_org_read", (q) =>
        q.eq("userId", user._id).eq("orgId", orgId).eq("read", false),
      )
      .collect();

    return unread.length;
  },
});

/**
 * List latest notifications for the active org (by Clerk ID)
 */
export const listLatestByClerkIdAndOrgId = query({
  args: {
    clerkId: v.string(),
    orgId: v.optional(v.id("organizations")),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const user = await getUserByClerkId(ctx, args.clerkId);

    if (!user) return [];

    const orgId: Id<"organizations"> =
      args.orgId ?? user.organizationId ?? PORTAL_TENANT_ID;
    const limit = args.limit ?? 10;

    return await ctx.db
      .query("notifications")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", user._id).eq("orgId", orgId),
      )
      .order("desc")
      .take(limit);
  },
});

/**
 * Paginated list for \"View all\" and dropdown \"load more\".
 */
export const paginateByClerkIdAndOrgId = query({
  args: {
    clerkId: v.string(),
    orgId: v.optional(v.id("organizations")),
    filters: v.optional(
      v.object({
        eventKey: v.optional(v.string()),
      }),
    ),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const user = await getUserByClerkId(ctx, args.clerkId);

    if (!user) {
      return { page: [], isDone: true, continueCursor: null };
    }

    const orgId: Id<"organizations"> =
      args.orgId ?? user.organizationId ?? PORTAL_TENANT_ID;

    const eventKey = args.filters?.eventKey;
    const qBase = eventKey
      ? ctx.db
          .query("notifications")
          .withIndex("by_user_org_eventKey", (q) =>
            q
              .eq("userId", user._id)
              .eq("orgId", orgId)
              .eq("eventKey", eventKey),
          )
      : ctx.db
          .query("notifications")
          .withIndex("by_user_org", (q) =>
            q.eq("userId", user._id).eq("orgId", orgId),
          );

    const result = await qBase.order("desc").paginate(args.paginationOpts);
    // Normalize Convex pagination result to avoid extra fields (e.g. splitCursor/pageStatus)
    // that can cause returns validation failures across Convex versions.
    return {
      page: result.page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});
