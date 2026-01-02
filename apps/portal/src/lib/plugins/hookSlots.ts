export const ADMIN_ARCHIVE_HEADER_BEFORE = "admin.archive.header.before";
export const ADMIN_ARCHIVE_HEADER_AFTER = "admin.archive.header.after";
export const ADMIN_ARCHIVE_HEADER_SUPPRESS = "admin.archive.header.suppress";
export const ADMIN_ARCHIVE_CONTENT_BEFORE = "admin.archive.content.before";
export const ADMIN_ARCHIVE_CONTENT_AFTER = "admin.archive.content.after";
export const ADMIN_ARCHIVE_CONTENT_SUPPRESS = "admin.archive.content.suppress";

export const ADMIN_PLUGIN_SETTINGS_HEADER_BEFORE =
  "admin.plugin.settings.header.before";
export const ADMIN_PLUGIN_SETTINGS_HEADER_AFTER =
  "admin.plugin.settings.header.after";

// Attachments (media library) archive extension points
export const ADMIN_ATTACHMENTS_ARCHIVE_TABS_FILTER =
  "admin.attachments.archive.tabs.filter";

// Frontend single-post extension points
export const FRONTEND_SINGLE_SLOTS_FILTER = "frontend.single.slots";

// Portal (frontend) header extension points
export const FRONTEND_PORTAL_HEADER_RIGHT_FILTER =
  "frontend.portal.header.right";

// Portal (frontend) account page extension points
export const FRONTEND_ACCOUNT_TABS_FILTER = "frontend.account.tabs";

// Portal (frontend) routing extension points
// Plugins (and core) can register route handlers with priorities, used by the frontend catch-all route.
// Lower priority runs first (e.g. 5 overrides core priority 10).
export const FRONTEND_ROUTE_HANDLERS_FILTER = "frontend.route.handlers";
