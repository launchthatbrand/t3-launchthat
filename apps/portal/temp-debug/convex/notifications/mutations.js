import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { throwNotFound } from "../shared/errors";
import { notificationTypeValidator, userIdValidator, } from "../shared/validators";
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
    },
    returns: v.number(),
    handler: async (ctx, args) => {
        // Use filter method instead of withIndex to avoid chaining eq calls
        const unreadNotifications = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("read"), false))
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
        type: notificationTypeValidator,
        title: v.string(),
        content: v.optional(v.string()),
        sourceUserId: v.optional(v.id("users")),
        sourceGroupId: v.optional(v.id("groups")),
        sourceEventId: v.optional(v.id("events")),
        sourceDownloadId: v.optional(v.id("downloads")),
        sourceOrderId: v.optional(v.id("transactions")),
        postId: v.optional(v.id("groupPosts")),
        commentId: v.optional(v.id("groupComments")),
        groupId: v.optional(v.id("groups")),
        invitationId: v.optional(v.id("groupInvitations")),
        joinRequestId: v.optional(v.id("groupJoinRequests")),
        actionUrl: v.optional(v.string()),
        actionData: v.optional(v.record(v.string(), v.string())),
        message: v.optional(v.string()),
        expiresAt: v.optional(v.number()),
        relatedId: v.optional(v.id("groupInvitations")),
    },
    returns: v.id("notifications"),
    handler: async (ctx, args) => {
        // Get user notification preferences to check if this notification type is enabled
        const preferencesDoc = await ctx.db
            .query("notificationPreferences")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();
        // Default to not disabled if preferences don't exist
        let isNotificationDisabled = false;
        // Check preferences if they exist
        if (preferencesDoc && preferencesDoc.appPreferences) {
            // Type-safe access to notification preferences
            const appPrefs = preferencesDoc.appPreferences;
            const notificationType = args.type;
            isNotificationDisabled = appPrefs[notificationType] === false;
        }
        if (isNotificationDisabled) {
            // User has disabled this notification type
            // Still create the notification but mark it as read already
            return await ctx.db.insert("notifications", {
                ...args,
                read: true,
                createdAt: Date.now(),
            });
        }
        // Use the formatter helper to generate content if not provided
        let content = args.content;
        if (!content) {
            content = await generateNotificationContent(ctx, args);
        }
        // Create the notification
        return await ctx.db.insert("notifications", {
            ...args,
            content,
            read: false,
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
    },
    returns: v.number(),
    handler: async (ctx, args) => {
        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
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
        type: notificationTypeValidator,
        title: v.string(),
        content: v.optional(v.string()),
        sourceUserId: v.optional(v.id("users")),
        sourceGroupId: v.optional(v.id("groups")),
        sourceEventId: v.optional(v.id("events")),
        sourceDownloadId: v.optional(v.id("downloads")),
        sourceOrderId: v.optional(v.id("transactions")),
        postId: v.optional(v.id("groupPosts")),
        commentId: v.optional(v.id("groupComments")),
        groupId: v.optional(v.id("groups")),
        invitationId: v.optional(v.id("groupInvitations")),
        joinRequestId: v.optional(v.id("groupJoinRequests")),
        actionUrl: v.optional(v.string()),
        actionData: v.optional(v.record(v.string(), v.string())),
        message: v.optional(v.string()),
        expiresAt: v.optional(v.number()),
        relatedId: v.optional(v.id("groupInvitations")),
    },
    returns: v.array(v.id("notifications")),
    handler: async (ctx, args) => {
        const { userIds, ...notificationData } = args;
        const notificationIds = [];
        // Create a notification for each user
        for (const userId of userIds) {
            const notificationId = await ctx.db.insert("notifications", {
                ...notificationData,
                userId,
                read: false,
                createdAt: Date.now(),
            });
            notificationIds.push(notificationId);
        }
        return notificationIds;
    },
});
