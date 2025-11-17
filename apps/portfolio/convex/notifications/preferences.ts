import { v } from "convex/values";

import type { Doc } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { throwInvalidInput, throwNotFound } from "../shared/errors";
import {
  defaultAppPreferences,
  defaultEmailPreferences,
  getUserNotificationPreferences,
} from "./lib/preferences";

/**
 * Get user notification preferences
 */
export const getNotificationPreferences = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throwNotFound("User", args.userId);
    }

    return await getUserNotificationPreferences(ctx, args.userId);
  },
});

/**
 * Update user notification preferences
 */
export const updateNotificationPreferences = mutation({
  args: {
    userId: v.id("users"),
    emailPreferences: v.optional(v.object({})),
    appPreferences: v.optional(v.object({})),
    pushEnabled: v.optional(v.boolean()),
    pushToken: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Check if user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throwNotFound("User", args.userId);
    }

    const { userId, ...preferencesToUpdate } = args;

    // Validate that at least one preference is being updated
    if (Object.keys(preferencesToUpdate).length === 0) {
      throwInvalidInput("At least one preference must be provided to update");
    }

    // Get existing preferences
    const existingPreferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingPreferences) {
      // Update existing preferences
      await ctx.db.patch(existingPreferences._id, {
        ...preferencesToUpdate,
      });
    } else {
      // Create new preferences with defaults + updates
      await ctx.db.insert("notificationPreferences", {
        userId,
        emailPreferences: args.emailPreferences ?? defaultEmailPreferences,
        appPreferences: args.appPreferences ?? defaultAppPreferences,
        pushEnabled: args.pushEnabled ?? false,
        pushToken: args.pushToken,
      });
    }

    return true;
  },
});

/**
 * Reset notification preferences to defaults
 */
export const resetNotificationPreferences = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Check if user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throwNotFound("User", args.userId);
    }

    const existingPreferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingPreferences) {
      await ctx.db.patch(existingPreferences._id, {
        emailPreferences: defaultEmailPreferences,
        appPreferences: defaultAppPreferences,
        pushEnabled: false,
        pushToken: undefined,
      });
    } else {
      await ctx.db.insert("notificationPreferences", {
        userId: args.userId,
        emailPreferences: defaultEmailPreferences,
        appPreferences: defaultAppPreferences,
        pushEnabled: false,
      });
    }

    return true;
  },
});

/**
 * Update a single notification preference
 */
export const updateSingleNotificationPreference = mutation({
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
    emailEnabled: v.optional(v.boolean()),
    appEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throwNotFound("User", args.userId);
    }

    // Validate that at least one preference is being updated
    if (args.emailEnabled === undefined && args.appEnabled === undefined) {
      throwInvalidInput("Either emailEnabled or appEnabled must be provided");
    }

    // Look for existing preferences
    const existingPrefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingPrefs) {
      // Update existing preferences for just this notification type
      const updates: Partial<Doc<"notificationPreferences">> = {};

      if (args.emailEnabled !== undefined) {
        updates.emailPreferences = {
          ...existingPrefs.emailPreferences,
          [args.type]: args.emailEnabled,
        };
      }

      if (args.appEnabled !== undefined) {
        updates.appPreferences = {
          ...existingPrefs.appPreferences,
          [args.type]: args.appEnabled,
        };
      }

      await ctx.db.patch(existingPrefs._id, updates);
      return existingPrefs._id;
    } else {
      // Create new preferences with defaults, overriding just this type
      const emailPreferences: Record<string, boolean> = {
        ...defaultEmailPreferences,
      };

      const appPreferences: Record<string, boolean> = {
        ...defaultAppPreferences,
      };

      if (args.emailEnabled !== undefined) {
        emailPreferences[args.type] = args.emailEnabled;
      }

      if (args.appEnabled !== undefined) {
        appPreferences[args.type] = args.appEnabled;
      }

      const prefId = await ctx.db.insert("notificationPreferences", {
        userId: args.userId,
        emailPreferences,
        appPreferences,
        pushEnabled: false,
      });

      return prefId;
    }
  },
});

/**
 * Update push notification settings
 */
export const updatePushSettings = mutation({
  args: {
    userId: v.id("users"),
    pushEnabled: v.boolean(),
    pushToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Look for existing preferences
    const existingPrefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingPrefs) {
      // Update existing preferences
      await ctx.db.patch(existingPrefs._id, {
        pushEnabled: args.pushEnabled,
        ...(args.pushToken && { pushToken: args.pushToken }),
      });

      return existingPrefs._id;
    } else {
      // Create new preferences
      return await ctx.db.insert("notificationPreferences", {
        userId: args.userId,
        emailPreferences: {
          // Default all to true
          friendRequest: true,
          friendAccepted: true,
          message: true,
          mention: true,
          groupInvite: true,
          groupJoinRequest: true,
          groupJoinApproved: true,
          groupJoinRejected: true,
          groupInvitation: true,
          invitationAccepted: true,
          invitationDeclined: true,
          groupPost: true,
          groupComment: true,
          eventInvite: true,
          eventReminder: true,
          eventUpdate: true,
          newDownload: true,
          courseUpdate: true,
          orderConfirmation: true,
          paymentSuccess: true,
          paymentFailed: true,
          productUpdate: true,
          systemAnnouncement: true,
        },
        appPreferences: {
          // Default all to true
          friendRequest: true,
          friendAccepted: true,
          message: true,
          mention: true,
          groupInvite: true,
          groupJoinRequest: true,
          groupJoinApproved: true,
          groupJoinRejected: true,
          groupInvitation: true,
          invitationAccepted: true,
          invitationDeclined: true,
          groupPost: true,
          groupComment: true,
          eventInvite: true,
          eventReminder: true,
          eventUpdate: true,
          newDownload: true,
          courseUpdate: true,
          orderConfirmation: true,
          paymentSuccess: true,
          paymentFailed: true,
          productUpdate: true,
          systemAnnouncement: true,
        },
        pushEnabled: args.pushEnabled,
        pushToken: args.pushToken,
      });
    }
  },
});
