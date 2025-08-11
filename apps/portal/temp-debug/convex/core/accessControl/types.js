/**
 * Access Control Types and Constants
 *
 * Defines user roles and permissions for the downloads system
 */
/**
 * Defines user roles for the downloads system
 */
export const DownloadRoles = {
    VIEWER: "viewer", // Can view and download files they have access to
    UPLOADER: "uploader", // Can upload files and manage their own uploads
    MANAGER: "manager", // Can manage all downloads, including others' uploads
    ADMIN: "admin", // Full access to all download functionality
};
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
/**
 * Maps roles to their associated permissions
 */
export const RolePermissionsMap = {
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
