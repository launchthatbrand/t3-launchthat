import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { query } from "../_generated/server";
import { getUserNotificationPreferences } from "./lib/preferences";

/**
 * Get notifications for a user with optional filtering and pagination
 */
export const listNotifications = query({
  args: {
    userId: v.id("users"),
    filters: v.optional(
      v.object({
        type: v.optional(
          v.union(
            v.literal("friendRequest"),
            v.literal("friendAccepted"),
            v.literal("message"),
            v.literal("mention"),
            v.literal("groupInvite"),
            v.literal("groupJoinRequest"),
            v.literal("groupJoinApproved"),
            v.literal("groupJoinRejected"),
            v.literal("groupInvitation"),
            v.literal("invitationAccepted"),
            v.literal("invitationDeclined"),
            v.literal("groupPost"),
            v.literal("groupComment"),
            v.literal("eventInvite"),
            v.literal("eventReminder"),
            v.literal("eventUpdate"),
            v.literal("newDownload"),
            v.literal("courseUpdate"),
            v.literal("orderConfirmation"),
            v.literal("paymentSuccess"),
            v.literal("paymentFailed"),
            v.literal("productUpdate"),
            v.literal("systemAnnouncement"),
          ),
        ),
        read: v.optional(v.boolean()),
      }),
    ),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    notifications: v.array(
      v.object({
        _id: v.id("notifications"),
        _creationTime: v.number(),
        userId: v.id("users"),
        type: v.string(),
        title: v.string(),
        content: v.optional(v.string()),
        read: v.boolean(),
        createdAt: v.number(),
        sourceUserId: v.optional(v.id("users")),
        sourceGroupId: v.optional(v.id("groups")),
        actionUrl: v.optional(v.string()),
        message: v.optional(v.string()),
      }),
    ),
    hasMore: v.boolean(),
    cursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    let notificationsQuery;

    // Use the most appropriate index based on filters
    if (args.filters?.type && args.filters?.read !== undefined) {
      // If filtering by both type and read status, use the composite index
      notificationsQuery = ctx.db
        .query("notifications")
        .withIndex("by_user_type_read", (q) =>
          q
            .eq("userId", args.userId)
            .eq("type", args.filters.type as any) // Cast to any to avoid type issues
            .eq("read", Boolean(args.filters.read)),
        )
        .order("desc");
    } else if (args.filters?.type) {
      // If filtering only by type
      notificationsQuery = ctx.db
        .query("notifications")
        .withIndex(
          "by_user_type",
          (q) =>
            q.eq("userId", args.userId).eq("type", args.filters.type as any), // Cast to any to avoid type issues
        )
        .order("desc");
    } else if (args.filters?.read !== undefined) {
      // If filtering only by read status
      notificationsQuery = ctx.db
        .query("notifications")
        .withIndex("by_user_read", (q) =>
          q.eq("userId", args.userId).eq("read", Boolean(args.filters.read)),
        )
        .order("desc");
    } else {
      // No filters, use the base user index
      notificationsQuery = ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc");
    }

    // Get paginated results
    const paginationResult = await notificationsQuery.paginate(
      args.paginationOpts,
    );

    return {
      notifications: paginationResult.page,
      hasMore: !paginationResult.isDone,
      cursor: paginationResult.continueCursor,
    };
  },
});

/**
 * Get count of unread notifications for a user
 */
export const countUnreadNotifications = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    // Fetch only the IDs for better performance when counting
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", args.userId).eq("read", false),
      )
      .collect();

    return unreadNotifications.length;
  },
});

/**
 * Get user notification preferences
 */
export const getNotificationPreferences = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await getUserNotificationPreferences(ctx, args.userId);
  },
});

/**
 * Get notifications by type for a user
 */
export const listNotificationsByType = query({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("friendRequest"),
      v.literal("friendAccepted"),
      v.literal("message"),
      v.literal("mention"),
      v.literal("groupInvite"),
      v.literal("groupJoinRequest"),
      v.literal("groupJoinApproved"),
      v.literal("groupJoinRejected"),
      v.literal("groupInvitation"),
      v.literal("invitationAccepted"),
      v.literal("invitationDeclined"),
      v.literal("groupPost"),
      v.literal("groupComment"),
      v.literal("eventInvite"),
      v.literal("eventReminder"),
      v.literal("eventUpdate"),
      v.literal("newDownload"),
      v.literal("courseUpdate"),
      v.literal("orderConfirmation"),
      v.literal("paymentSuccess"),
      v.literal("paymentFailed"),
      v.literal("productUpdate"),
      v.literal("systemAnnouncement"),
    ),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const paginationResult = await ctx.db
      .query("notifications")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", args.userId).eq("type", args.type),
      )
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      notifications: paginationResult.page,
      hasMore: !paginationResult.isDone,
      cursor: paginationResult.continueCursor,
    };
  },
});

/**
 * Get recent notifications for a user (limited to a specified count)
 */
export const listRecentNotifications = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;

    const recentNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_timestamp", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return recentNotifications;
  },
});

/**
 * Get notifications by Clerk user ID
 */
export const listNotificationsByClerkId = query({
  args: {
    clerkId: v.string(),
    filters: v.optional(
      v.object({
        type: v.optional(v.string()),
        read: v.optional(v.boolean()),
      }),
    ),
    paginationOpts: v.optional(paginationOptsValidator),
  },
  handler: async (ctx, args) => {
    // First, look up the user by their Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", `clerk:${args.clerkId}`),
      )
      .first();

    if (!user) {
      return [];
    }

    // Default pagination options if not provided
    const paginationOptions = args.paginationOpts ?? {
      numItems: 10,
      cursor: null,
    };

    // Build the query
    let notificationsQuery = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc");

    // Apply optional filters
    if (args.filters?.type) {
      notificationsQuery = notificationsQuery.filter((q) =>
        q.eq(q.field("type"), args.filters?.type),
      );
    }

    if (args.filters?.read !== undefined) {
      notificationsQuery = notificationsQuery.filter((q) =>
        q.eq(q.field("read"), args.filters?.read),
      );
    }

    // Get the notifications with pagination
    const notifications = await notificationsQuery.paginate(paginationOptions);

    return notifications.page;
  },
});
