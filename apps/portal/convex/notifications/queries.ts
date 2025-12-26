import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { api } from "../_generated/api";
import { query } from "../_generated/server";
import { PORTAL_TENANT_ID } from "../constants";

const notificationReturnValidator = v.object({
  _id: v.id("notifications"),
  _creationTime: v.number(),
  userId: v.id("users"),
  orgId: v.id("organizations"),
  eventKey: v.string(),
  scopeKind: v.optional(v.string()),
  scopeId: v.optional(v.string()),
  title: v.string(),
  content: v.optional(v.string()),
  read: v.boolean(),
  actionUrl: v.optional(v.string()),
  actionData: v.optional(v.record(v.string(), v.string())),
  createdAt: v.number(),
  sourceUserId: v.optional(v.id("users")),
  sourceOrderId: v.optional(v.id("transactions")),
  expiresAt: v.optional(v.number()),
  relatedId: v.optional(v.id("groupInvitations")),
});

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
    const user: {
      _id: Id<"users">;
      organizationId?: Id<"organizations"> | null;
    } | null = await ctx.runQuery(api.core.users.getUserByClerkId, {
      clerkId: args.clerkId,
    });

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
  returns: v.array(notificationReturnValidator),
  handler: async (ctx, args) => {
    const user: {
      _id: Id<"users">;
      organizationId?: Id<"organizations"> | null;
    } | null = await ctx.runQuery(api.core.users.getUserByClerkId, {
      clerkId: args.clerkId,
    });

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
    page: v.array(notificationReturnValidator),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const user: {
      _id: Id<"users">;
      organizationId?: Id<"organizations"> | null;
    } | null = await ctx.runQuery(api.core.users.getUserByClerkId, {
      clerkId: args.clerkId,
    });

    if (!user) {
      return { page: [], isDone: true, continueCursor: null };
    }

    const orgId: Id<"organizations"> =
      args.orgId ?? user.organizationId ?? PORTAL_TENANT_ID;

    const qBase = args.filters?.eventKey
      ? ctx.db
          .query("notifications")
          .withIndex("by_user_org_eventKey", (q) =>
            q
              .eq("userId", user._id)
              .eq("orgId", orgId)
              .eq("eventKey", args.filters!.eventKey!),
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
