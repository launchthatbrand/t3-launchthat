import { getOptionalAuthenticatedUserIdentity } from "../lib/permissions";
import { DownloadRoles, RolePermissionsMap } from "./types";
/**
 * Check if a user has a specific permission for downloads
 * TODO: This function needs to be refactored to use the generic hasPermission system.
 * For now, it uses its own local role/permission logic.
 */
export const hasDownloadPermission = async (ctx, permission) => {
    const identity = await getOptionalAuthenticatedUserIdentity(ctx);
    if (!identity) {
        return false;
    }
    const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();
    if (!user) {
        return false;
    }
    if (user.role === "admin") {
        return true;
    }
    // TODO: Add downloadRole field to users schema
    const userDownloadRole = user.downloadRole;
    const effectiveRole = userDownloadRole && Object.values(DownloadRoles).includes(userDownloadRole)
        ? userDownloadRole
        : DownloadRoles.VIEWER;
    const permissionsForRole = RolePermissionsMap[effectiveRole];
    return permissionsForRole ? permissionsForRole.includes(permission) : false;
};
/**
 * Check if a user has owner access to a download
 */
export const isDownloadOwner = async (ctx, userId, downloadId) => {
    const download = await ctx.db.get(downloadId);
    if (!download) {
        return false;
    }
    return download.uploadedBy === userId;
};
/**
 * Check if a user can access a specific download
 */
export const checkDownloadAccess = async (ctx, userId, downloadId) => {
    const download = await ctx.db.get(downloadId);
    if (!download)
        return false;
    // Check for admin status first (admins can access everything)
    const user = await ctx.db.get(userId);
    if (user?.role === "admin") {
        return true;
    }
    // Public downloads are accessible to all authenticated users
    if (download.isPublic)
        return true;
    // Check if user is the owner of the download
    if (download.uploadedBy === userId)
        return true;
    // Check if user is in accessibleUserIds
    if (download.accessibleUserIds?.includes(userId))
        return true;
    // Check if user has purchased required product
    if (download.requiredProductId) {
        const userOrders = await ctx.db
            .query("orders")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("status"), "completed"))
            .collect();
        // Check if any order contains the required product
        const hasRequiredProduct = userOrders.some((order) => order.items.some((item) => item.productId === download.requiredProductId));
        if (hasRequiredProduct)
            return true;
    }
    // Check if user is enrolled in required course
    if (download.requiredCourseId) {
        const enrollment = await ctx.db
            .query("courseEnrollments")
            .withIndex("by_user_course", (q) => q.eq("userId", userId).eq("courseId", download.requiredCourseId))
            .filter((q) => q.eq(q.field("status"), "active"))
            .first();
        if (enrollment)
            return true;
    }
    return false;
};
