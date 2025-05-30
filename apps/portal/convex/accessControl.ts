import { ConvexError, v } from "convex/values";

import { Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import {
  getAuthenticatedUserDocIdByToken,
  getOptionalAuthenticatedUserIdentity,
} from "./core/lib/permissions";

// Import genericHasPermission and genericRequirePermission but mark as unused for now if not immediately used
// import { /* _genericHasPermission, _genericRequirePermission */ } from "./core/lib/permissions";

// SUBTASK 3: ROLE-BASED ACCESS CONTROL SYSTEM

/**
 * Defines user roles and permissions for the downloads system
 */
export const DownloadRoles = {
  VIEWER: "viewer", // Can view and download files they have access to
  UPLOADER: "uploader", // Can upload files and manage their own uploads
  MANAGER: "manager", // Can manage all downloads, including others' uploads
  ADMIN: "admin", // Full access to all download functionality
};

export type DownloadRole = (typeof DownloadRoles)[keyof typeof DownloadRoles];

/**
 * Defines permissions for the downloads system
 */
export const DownloadPermissions = {
  VIEW_PUBLIC: "view_public", // View public downloads
  VIEW_PRIVATE: "view_private", // View private downloads
  DOWNLOAD: "download", // Download files
  UPLOAD: "upload", // Upload new files
  EDIT_OWN: "edit_own", // Edit own uploads
  EDIT_ANY: "edit_any", // Edit any uploads
  DELETE_OWN: "delete_own", // Delete own uploads
  DELETE_ANY: "delete_any", // Delete any uploads
  MANAGE_CATEGORIES: "manage_categories", // Manage download categories
  VIEW_STATS: "view_stats", // View download statistics
};

export type DownloadPermission =
  (typeof DownloadPermissions)[keyof typeof DownloadPermissions];

/**
 * Maps roles to their associated permissions
 */
export const RolePermissionsMap: Record<DownloadRole, DownloadPermission[]> = {
  [DownloadRoles.VIEWER]: [
    DownloadPermissions.VIEW_PUBLIC,
    DownloadPermissions.DOWNLOAD,
  ],
  [DownloadRoles.UPLOADER]: [
    DownloadPermissions.VIEW_PUBLIC,
    DownloadPermissions.DOWNLOAD,
    DownloadPermissions.UPLOAD,
    DownloadPermissions.EDIT_OWN,
    DownloadPermissions.DELETE_OWN,
  ],
  [DownloadRoles.MANAGER]: [
    DownloadPermissions.VIEW_PUBLIC,
    DownloadPermissions.VIEW_PRIVATE,
    DownloadPermissions.DOWNLOAD,
    DownloadPermissions.UPLOAD,
    DownloadPermissions.EDIT_OWN,
    DownloadPermissions.EDIT_ANY,
    DownloadPermissions.DELETE_OWN,
    DownloadPermissions.DELETE_ANY,
    DownloadPermissions.MANAGE_CATEGORIES,
    DownloadPermissions.VIEW_STATS,
  ],
  [DownloadRoles.ADMIN]: [
    DownloadPermissions.VIEW_PUBLIC,
    DownloadPermissions.VIEW_PRIVATE,
    DownloadPermissions.DOWNLOAD,
    DownloadPermissions.UPLOAD,
    DownloadPermissions.EDIT_OWN,
    DownloadPermissions.EDIT_ANY,
    DownloadPermissions.DELETE_OWN,
    DownloadPermissions.DELETE_ANY,
    DownloadPermissions.MANAGE_CATEGORIES,
    DownloadPermissions.VIEW_STATS,
  ],
};

/**
 * Check if a user has a specific permission for downloads
 * TODO: This function needs to be refactored to use the generic hasPermission system.
 * For now, it uses its own local role/permission logic.
 */
export const hasDownloadPermission = async (
  ctx: MutationCtx | QueryCtx,
  permission: DownloadPermission,
): Promise<boolean> => {
  const identity = await getOptionalAuthenticatedUserIdentity(ctx);
  if (!identity) {
    return false;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .first();

  if (!user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  const userDownloadRole = user.downloadRole as DownloadRole | undefined;
  const effectiveRole =
    userDownloadRole && Object.values(DownloadRoles).includes(userDownloadRole)
      ? userDownloadRole
      : DownloadRoles.VIEWER;

  const permissionsForRole = RolePermissionsMap[effectiveRole];
  return permissionsForRole ? permissionsForRole.includes(permission) : false;
};

/**
 * Check if a user has owner access to a download
 */
export const isDownloadOwner = async (
  ctx: MutationCtx | QueryCtx,
  userId: Id<"users">,
  downloadId: Id<"downloads">,
): Promise<boolean> => {
  const download = await ctx.db.get(downloadId);
  if (!download) {
    return false;
  }

  return download.uploadedBy === userId;
};

/**
 * Check if a user can access a specific download
 */
export const checkDownloadAccess = async (
  ctx: MutationCtx | QueryCtx,
  userId: Id<"users">,
  downloadId: Id<"downloads">,
): Promise<boolean> => {
  const download = await ctx.db.get(downloadId);
  if (!download) return false;

  // Check for admin status first (admins can access everything)
  const user = await ctx.db.get(userId);
  if (user?.role === "admin") {
    return true;
  }

  // Public downloads are accessible to all authenticated users
  if (download.isPublic) return true;

  // Check if user is the owner of the download
  if (download.uploadedBy === userId) return true;

  // Check if user is in accessibleUserIds
  if (download.accessibleUserIds?.includes(userId)) return true;

  // Check if user has purchased required product
  if (download.requiredProductId) {
    const userPurchases = await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("productId"), download.requiredProductId!))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .first();

    if (userPurchases) return true;
  }

  // Check if user is enrolled in required course
  if (download.requiredCourseId) {
    const enrollment = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_user_and_course", (q) =>
        q.eq("userId", userId).eq("courseId", download.requiredCourseId!),
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (enrollment) return true;
  }

  return false;
};

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

    await ctx.db.patch(args.userIdToAssign, {
      downloadRole: args.roleToAssign,
    });

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
        .query("purchases")
        .withIndex("by_product", (q) =>
          q.eq("productId", download.requiredProductId!),
        )
        .filter((q) => q.eq(q.field("status"), "completed"))
        .collect();

      for (const purchase of purchasingUsers) {
        // Skip if already in the list
        if (result.some((u) => u._id === purchase.userId)) continue;

        const user = await ctx.db.get(purchase.userId);
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

    // Add users with access through course enrollment
    if (download.requiredCourseId) {
      const enrolledUsers = await ctx.db
        .query("courseEnrollments")
        .withIndex("by_course", (q) =>
          q.eq("courseId", download.requiredCourseId!),
        )
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
