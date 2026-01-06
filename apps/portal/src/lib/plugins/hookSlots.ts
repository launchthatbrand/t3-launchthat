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

// Portal (frontend) metadata generation extension points
// Plugins can register metadata resolvers for non-post routes (e.g. /f/... checkout funnels).
// Lower priority runs first (e.g. 5 overrides core priority 10).
export const FRONTEND_METADATA_RESOLVERS_FILTER = "frontend.metadata.resolvers";

// Portal (frontend) routing extension points
// Plugins (and core) can register route handlers with priorities, used by the frontend catch-all route.
// Lower priority runs first (e.g. 5 overrides core priority 10).
export const FRONTEND_ROUTE_HANDLERS_FILTER = "frontend.route.handlers";

// Portal (frontend) post resolution extension points (WordPress-style “main query”)
// Override stores run first (priority-ordered) and may short-circuit.
export const FRONTEND_POST_STORE_OVERRIDES_FILTER =
  "frontend.postStores.overrides";
// Primary stores provide a (mostly) exclusive resolver per postTypeSlug.
export const FRONTEND_POST_STORES_FILTER = "frontend.postStores";

// Portal (frontend) content access extension points
// Providers return ContentAccessDecisions used to gate post-type controlled frontend routes.
export const FRONTEND_CONTENT_ACCESS_PROVIDERS_FILTER =
  "frontend.contentAccess.providers";

// Portal-wide content access rule sources (for admin overview).
// Sources are registered as filter returns, ordered by source.priority (lower runs first).
export const FRONTEND_CONTENT_ACCESS_RULE_SOURCES_FILTER =
  "frontend.contentAccess.ruleSources";

// Portal (frontend) access denied UI extension points
// Plugins can contribute additional CTA buttons/links shown on the AccessDeniedPage.
export const FRONTEND_ACCESS_DENIED_ACTIONS_FILTER =
  "frontend.accessDenied.actions";

// Portal (frontend) notifications UI extension points
// Plugins can contribute additional notification tabs/groupings to the header dropdown + notifications page.
export const FRONTEND_NOTIFICATIONS_TABS_FILTER = "frontend.notifications.tabs";

// Admin edit meta box extension point for content access UI.
// Plugins can contribute additional UI sections (e.g. CRM marketing tags) to the core Content Access metabox.
export const ADMIN_CONTENT_ACCESS_SECTIONS_FILTER =
  "admin.contentAccess.sections";

// Admin edit meta box extension point for ecommerce product details.
// Plugins can contribute additional UI sections (e.g. CRM “grant tags on purchase”) to the Product Details metabox.
export const ADMIN_ECOMMERCE_PRODUCT_DETAILS_SECTIONS_FILTER =
  "admin.ecommerce.productDetails.sections";
