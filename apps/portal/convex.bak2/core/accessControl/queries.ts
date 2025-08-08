import { ConvexError, v } from "convex/values";

import { query } from "../../_generated/server";
import { hasDownloadPermission } from "./helpers";
import { DownloadPermissions } from "./types";

/**
 * Get list of users who have access to a download
 */
export const getDownloadAccessList = query({
  args: {
    downloadId: v.id("downloads"),
  },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      accessType: v.string(), // "owner", "explicit", "product", "course"
    }),
  ),
  handler: async (ctx, args) => {
    // Check permissions of the current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthorized");
    }

    // Get current user from database
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!currentUser) {
      throw new ConvexError("User not found");
    }

    // Get the download
    const download = await ctx.db.get(args.downloadId);
    if (!download) {
      throw new ConvexError("Download not found");
    }

    // Check if current user has permission to view access list
    const isOwner = download.uploadedBy === currentUser._id;
    const hasManagePermission = await hasDownloadPermission(
      ctx,
      DownloadPermissions.EDIT_ANY,
    );

    if (!isOwner && !hasManagePermission) {
      throw new ConvexError("Permission denied");
    }

    // Collect all users with access
    const result = [];

    // Add owner
    const owner = await ctx.db.get(download.uploadedBy);
    if (owner) {
      result.push({
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        accessType: "owner",
      });
    }

    // Add explicitly granted users
    if (download.accessibleUserIds && download.accessibleUserIds.length > 0) {
      for (const userId of download.accessibleUserIds) {
        // Skip if already in the list (owner)
        if (userId === download.uploadedBy) continue;

        const user = await ctx.db.get(userId);
        if (user) {
          result.push({
            _id: user._id,
            name: user.name,
            email: user.email,
            accessType: "explicit",
          });
        }
      }
    }

    // Add users with access through product purchase
    if (download.requiredProductId) {
      const purchasingUsers = await ctx.db
        .query("orders")
        .filter((q) => q.eq(q.field("status"), "completed"))
        .collect();

      for (const order of purchasingUsers) {
        // Check if this order contains the required product
        const hasRequiredProduct = order.items.some(
          (item) => item.productId === download.requiredProductId,
        );

        if (hasRequiredProduct && order.userId) {
          // Skip if already in the list
          if (result.some((u) => u._id === order.userId)) continue;

          const user = await ctx.db.get(order.userId);
          if (user) {
            result.push({
              _id: user._id,
              name: user.name,
              email: user.email,
              accessType: "product",
            });
          }
        }
      }
    }

    // Add users with access through course enrollment
    if (download.requiredCourseId) {
      const requiredCourseId = download.requiredCourseId;
      const enrolledUsers = await ctx.db
        .query("courseEnrollments")
        .withIndex("by_course", (q) => q.eq("courseId", requiredCourseId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      for (const enrollment of enrolledUsers) {
        // Skip if already in the list
        if (result.some((u) => u._id === enrollment.userId)) continue;

        const user = await ctx.db.get(enrollment.userId);
        if (user) {
          result.push({
            _id: user._id,
            name: user.name,
            email: user.email,
            accessType: "course",
          });
        }
      }
    }

    return result;
  },
});

/**
 * Check if the current user has admin role
 */
export const checkIsAdmin = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .first();

    if (!user) {
      return false;
    }

    // Check if the user has admin role
    return user.role === "admin";
  },
});
