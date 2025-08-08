import { ConvexError, v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import type { DownloadRole } from "./types";
import { mutation } from "../../_generated/server";
import { getAuthenticatedUserDocIdByToken } from "../lib/permissions";
import { hasDownloadPermission } from "./helpers";
import { DownloadPermissions, DownloadRoles } from "./types";

/**
 * Assign a download role to a user
 */
export const assignDownloadRole = mutation({
  args: {
    userIdToAssign: v.id("users"),
    roleToAssign: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const currentUserId = await getAuthenticatedUserDocIdByToken(ctx);
    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError(
        "Permission denied: Only admins can assign download roles.",
      );
    }

    if (
      !Object.values(DownloadRoles).includes(args.roleToAssign as DownloadRole)
    ) {
      throw new ConvexError(`Invalid role: ${args.roleToAssign}`);
    }

    const targetUser = await ctx.db.get(args.userIdToAssign);
    if (!targetUser) {
      throw new ConvexError("Target user not found");
    }

    // TODO: Add downloadRole field to users schema
    await ctx.db.patch(args.userIdToAssign, {
      downloadRole: args.roleToAssign,
    } as any);

    return true;
  },
});

/**
 * Grant specific access to a download for a user
 */
export const grantDownloadAccess = mutation({
  args: {
    downloadId: v.id("downloads"),
    userId: v.id("users"),
  },
  returns: v.boolean(),
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

    // Check if current user has permission to edit this download
    const isOwner = download.uploadedBy === currentUser._id;
    const hasEditPermission = await hasDownloadPermission(
      ctx,
      DownloadPermissions.EDIT_ANY,
    );

    if (!isOwner && !hasEditPermission) {
      throw new ConvexError("Permission denied");
    }

    // Get the target user
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new ConvexError("Target user not found");
    }

    // Add user to accessibleUserIds if not already present
    const accessibleUserIds = download.accessibleUserIds || [];
    if (!accessibleUserIds.includes(args.userId)) {
      await ctx.db.patch(args.downloadId, {
        accessibleUserIds: [...accessibleUserIds, args.userId],
      });
    }

    return true;
  },
});

/**
 * Revoke specific access to a download for a user
 */
export const revokeDownloadAccess = mutation({
  args: {
    downloadId: v.id("downloads"),
    userId: v.id("users"),
  },
  returns: v.boolean(),
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

    // Check if current user has permission to edit this download
    const isOwner = download.uploadedBy === currentUser._id;
    const hasEditPermission = await hasDownloadPermission(
      ctx,
      DownloadPermissions.EDIT_ANY,
    );

    if (!isOwner && !hasEditPermission) {
      throw new ConvexError("Permission denied");
    }

    // Remove user from accessibleUserIds if present
    const accessibleUserIds = download.accessibleUserIds || [];
    if (accessibleUserIds.includes(args.userId)) {
      await ctx.db.patch(args.downloadId, {
        accessibleUserIds: accessibleUserIds.filter((id) => id !== args.userId),
      });
    }

    return true;
  },
});
