import { v } from "convex/values";

import { mutation } from "./server";

export const markNotificationAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.notificationId);
    if (!row) return false;
    await ctx.db.patch(args.notificationId, { read: true });
    return true;
  },
});

/**
 * Mark all notifications as read for a user in a specific org.
 * Primarily used by Portal-style inbox.
 */
export const markAllNotificationsAsReadByClerkIdAndOrgId = mutation({
  args: {
    clerkId: v.string(),
    orgId: v.id("organizations"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const tokenIdentifier =
      typeof identity?.tokenIdentifier === "string" ? identity.tokenIdentifier : null;

    const user =
      tokenIdentifier
        ? await ctx.db
            .query("users")
            .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", tokenIdentifier))
            .first()
        : await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
            .first();
    if (!user) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_org_read", (q: any) =>
        q.eq("userId", user._id).eq("orgId", args.orgId).eq("read", false),
      )
      .collect();

    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }

    return unread.length;
  },
});

/**
 * Mark all notifications as read across all orgs for a user.
 * Used by TraderLaunchpad "all orgs" inbox.
 */
export const markAllNotificationsAsReadByClerkId = mutation({
  args: { clerkId: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const tokenIdentifier =
      typeof identity?.tokenIdentifier === "string" ? identity.tokenIdentifier : null;

    const user =
      tokenIdentifier
        ? await ctx.db
            .query("users")
            .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", tokenIdentifier))
            .first()
        : await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
            .first();
    if (!user) return 0;

    const all = await ctx.db
      .query("notifications")
      .withIndex("by_user_createdAt", (q: any) => q.eq("userId", user._id))
      .collect();
    const unread = all.filter((n: any) => n.read === false);

    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }

    return unread.length;
  },
});

/**
 * Create a single in-app notification (direct insert).
 * Intended for simple app usage and manual/admin notifications.
 */
export const createNotification = mutation({
  args: {
    clerkId: v.string(),
    orgId: v.id("organizations"),
    eventKey: v.string(),
    tabKey: v.optional(v.string()),
    title: v.string(),
    content: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
  },
  returns: v.union(v.null(), v.id("notifications")),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const tokenIdentifier =
      typeof identity?.tokenIdentifier === "string" ? identity.tokenIdentifier : null;

    const user =
      tokenIdentifier
        ? await ctx.db
            .query("users")
            .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", tokenIdentifier))
            .first()
        : await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
            .first();
    if (!user) return null;

    const createdAt = Date.now();
    const id = await ctx.db.insert("notifications", {
      userId: user._id,
      orgId: args.orgId,
      eventKey: args.eventKey,
      tabKey: (args.tabKey ?? "system").trim() || "system",
      title: args.title,
      content: args.content,
      read: false,
      actionUrl: args.actionUrl,
      createdAt,
    });
    return id;
  },
});

