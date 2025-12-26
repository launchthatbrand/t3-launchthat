import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";
import { PORTAL_TENANT_ID } from "../constants";
import { throwInvalidInput, throwNotFound } from "../shared/errors";
import { userIdValidator } from "../shared/validators";
import { generateNotificationContent } from "./lib/formatters";

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throwNotFound("Notification", args.notificationId);
    }

    await ctx.db.patch(args.notificationId, {
      read: true,
    });

    return true;
  },
});

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = mutation({
  args: {
    userId: userIdValidator,
    orgId: v.id("organizations"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_org_read", (q) =>
        q.eq("userId", args.userId).eq("orgId", args.orgId).eq("read", false),
      )
      .collect();

    // Update each unread notification
    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        read: true,
      });
    }

    return unreadNotifications.length;
  },
});

/**
 * Create a notification
 */
export const createNotification = mutation({
  args: {
    userId: userIdValidator,
    orgId: v.optional(v.id("organizations")),
    eventKey: v.optional(v.string()),
    // Legacy field name (pre-pluggable). Prefer `eventKey`.
    type: v.optional(v.string()),
    title: v.string(),
    content: v.optional(v.string()),
    sourceUserId: v.optional(v.id("users")),
    // sourceDownloadId: v.optional(v.id("downloads")),
    sourceOrderId: v.optional(v.id("transactions")),
    actionUrl: v.optional(v.string()),
    actionData: v.optional(v.record(v.string(), v.string())),
    message: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    relatedId: v.optional(v.id("groupInvitations")),
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    const eventKey = (args.eventKey ?? args.type)?.trim();
    if (!eventKey) {
      throwInvalidInput("Either eventKey or type must be provided");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throwNotFound("User", args.userId);
    }

    const orgId = args.orgId ?? user.organizationId ?? PORTAL_TENANT_ID;

    // Get user notification preferences to check if this notification type is enabled
    const preferencesDoc = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Default to not disabled if preferences don't exist
    let isNotificationDisabled = false;

    // Check preferences if they exist
    if (preferencesDoc?.appPreferences) {
      // Type-safe access to notification preferences
      const appPrefs = preferencesDoc.appPreferences;
      isNotificationDisabled = appPrefs[eventKey] === false;
    }

    if (isNotificationDisabled) {
      // User has disabled this notification type
      // Still create the notification but mark it as read already
      return await ctx.db.insert("notifications", {
        userId: args.userId,
        orgId,
        eventKey,
        scopeKind: undefined,
        scopeId: undefined,
        title: args.title,
        content: args.content,
        sourceUserId: args.sourceUserId,
        sourceOrderId: args.sourceOrderId,
        actionUrl: args.actionUrl,
        actionData: args.actionData,
        expiresAt: args.expiresAt,
        relatedId: args.relatedId,
        read: true,
        createdAt: Date.now(),
      });
    }

    // Use the formatter helper to generate content if not provided
    let content = args.content;
    if (!content) {
      content = await generateNotificationContent(ctx, {
        type: eventKey,
        userId: args.userId,
        sourceUserId: args.sourceUserId,
        sourceOrderId: args.sourceOrderId,
        title: args.title,
        message: args.message,
      });
    }

    // Create the notification
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      orgId,
      eventKey,
      scopeKind: undefined,
      scopeId: undefined,
      title: args.title,
      content,
      read: false,
      sourceUserId: args.sourceUserId,
      sourceOrderId: args.sourceOrderId,
      actionUrl: args.actionUrl,
      actionData: args.actionData,
      expiresAt: args.expiresAt,
      relatedId: args.relatedId,
      createdAt: Date.now(),
    });
  },
});

/**
 * Delete a notification
 */
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throwNotFound("Notification", args.notificationId);
    }

    await ctx.db.delete(args.notificationId);
    return true;
  },
});

/**
 * Delete all notifications for a user
 */
export const deleteAllNotifications = mutation({
  args: {
    userId: userIdValidator,
    orgId: v.id("organizations"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", args.userId).eq("orgId", args.orgId),
      )
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    return notifications.length;
  },
});

/**
 * Batch create notifications (for multiple recipients)
 */
export const batchCreateNotifications = mutation({
  args: {
    userIds: v.array(userIdValidator),
    orgId: v.optional(v.id("organizations")),
    eventKey: v.optional(v.string()),
    // Legacy field name (pre-pluggable). Prefer `eventKey`.
    type: v.optional(v.string()),
    title: v.string(),
    content: v.optional(v.string()),
    sourceUserId: v.optional(v.id("users")),
    // sourceDownloadId: v.optional(v.id("downloads")),
    sourceOrderId: v.optional(v.id("transactions")),
    actionUrl: v.optional(v.string()),
    actionData: v.optional(v.record(v.string(), v.string())),
    message: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    relatedId: v.optional(v.id("groupInvitations")),
  },
  returns: v.array(v.id("notifications")),
  handler: async (ctx, args) => {
    const { userIds, ...notificationData } = args;
    const notificationIds: Id<"notifications">[] = [];

    const eventKey = (notificationData.eventKey ?? notificationData.type)?.trim();
    if (!eventKey) {
      throwInvalidInput("Either eventKey or type must be provided");
    }

    // Create a notification for each user
    for (const userId of userIds) {
      const user = await ctx.db.get(userId);
      if (!user) continue;
      const orgId = notificationData.orgId ?? user.organizationId ?? PORTAL_TENANT_ID;
      const notificationId = await ctx.db.insert("notifications", {
        title: notificationData.title,
        content: notificationData.content,
        sourceUserId: notificationData.sourceUserId,
        sourceOrderId: notificationData.sourceOrderId,
        actionUrl: notificationData.actionUrl,
        actionData: notificationData.actionData,
        expiresAt: notificationData.expiresAt,
        relatedId: notificationData.relatedId,
        userId,
        orgId,
        eventKey,
        scopeKind: undefined,
        scopeId: undefined,
        read: false,
        createdAt: Date.now(),
      });
      notificationIds.push(notificationId);
    }

    return notificationIds;
  },
});
