import { v } from "convex/values";

import type { Doc } from "../../_generated/dataModel";
import { mutation, query } from "../../_generated/server";
import { throwInvalidInput, throwNotFound } from "../../shared/errors";
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
    emailPreferences: v.optional(v.record(v.string(), v.boolean())),
    appPreferences: v.optional(v.record(v.string(), v.boolean())),
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
    // Plugin-agnostic: any event key can be toggled.
    type: v.string(),
    emailEnabled: v.optional(v.boolean()),
    appEnabled: v.optional(v.boolean()),
  },
  returns: v.id("notificationPreferences"),
  handler: async (ctx, args) => {
    const key = args.type.trim();
    if (!key) {
      throwInvalidInput("type (event key) must be a non-empty string");
    }
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
          [key]: args.emailEnabled,
        };
      }

      if (args.appEnabled !== undefined) {
        updates.appPreferences = {
          ...existingPrefs.appPreferences,
          [key]: args.appEnabled,
        };
      }

      await ctx.db.patch(existingPrefs._id, updates);
      return existingPrefs._id;
    } else {
      // Create new preferences with defaults, overriding just this type
      const emailPreferences: Record<string, boolean> = {};
      const appPreferences: Record<string, boolean> = {};

      if (args.emailEnabled !== undefined) {
        emailPreferences[key] = args.emailEnabled;
      }

      if (args.appEnabled !== undefined) {
        appPreferences[key] = args.appEnabled;
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
  returns: v.id("notificationPreferences"),
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
        emailPreferences: defaultEmailPreferences,
        appPreferences: defaultAppPreferences,
        pushEnabled: args.pushEnabled,
        pushToken: args.pushToken,
      });
    }
  },
});
