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
export const markAllNotificationsAsReadByUserIdAndOrgId = mutation({
  args: {
    userId: v.string(),
    orgId: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_org_read", (q: any) =>
        q.eq("userId", args.userId).eq("orgId", args.orgId).eq("read", false),
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
export const markAllNotificationsAsReadByUserId = mutation({
  args: { userId: v.string() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("notifications")
      .withIndex("by_user_createdAt", (q: any) => q.eq("userId", args.userId))
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
    userId: v.string(),
    orgId: v.string(),
    eventKey: v.string(),
    tabKey: v.optional(v.string()),
    title: v.string(),
    content: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
  },
  returns: v.union(v.null(), v.id("notifications")),
  handler: async (ctx, args) => {
    const createdAt = Date.now();
    const id = await ctx.db.insert("notifications", {
      userId: args.userId,
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

/**
 * Create a single in-app notification, but dedupe by (userId, orgId, eventKey).
 *
 * This is critical for cron/scheduler fanout use-cases where the same "event" can be
 * observed on multiple runs (e.g. economic calendars, RSS polling).
 */
export const createNotificationOnce = mutation({
  args: {
    userId: v.string(),
    orgId: v.string(),
    eventKey: v.string(),
    tabKey: v.optional(v.string()),
    title: v.string(),
    content: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
  },
  returns: v.union(v.null(), v.id("notifications")),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("notifications")
      .withIndex("by_user_org_eventKey", (q: any) =>
        q
          .eq("userId", args.userId)
          .eq("orgId", args.orgId)
          .eq("eventKey", args.eventKey),
      )
      .first();
    if (existing) return null;
    const createdAt = Date.now();
    const id = await ctx.db.insert("notifications", {
      userId: args.userId,
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

/**
 * Record a notification interaction event (click/open/etc).
 *
 * This mutation is intentionally "dumb" about auth; the mounting app should pass the
 * correct `userId` and we verify it matches the notification owner.
 */
export const trackNotificationEvent = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.string(),
    channel: v.string(),
    eventType: v.string(),
    targetUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.notificationId);
    if (!row) return null;
    if (String(row.userId) !== String(args.userId)) return null;

    const createdAt = Date.now();
    await ctx.db.insert("notificationEvents", {
      notificationId: args.notificationId,
      userId: String(row.userId),
      orgId: String(row.orgId),
      eventKey: String(row.eventKey),
      channel: String(args.channel),
      eventType: String(args.eventType),
      targetUrl: typeof args.targetUrl === "string" ? args.targetUrl : undefined,
      createdAt,
    });

    return null;
  },
});

