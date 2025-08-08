/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as calendar_attendance_mutations from "../calendar/attendance/mutations.js";
import type * as calendar_attendance_queries from "../calendar/attendance/queries.js";
import type * as calendar_attendees from "../calendar/attendees.js";
import type * as calendar_crud from "../calendar/crud.js";
import type * as calendar_events_crud from "../calendar/events/crud.js";
import type * as calendar_events_queries from "../calendar/events/queries.js";
import type * as calendar_invitations from "../calendar/invitations.js";
import type * as calendar_lib_authUtils from "../calendar/lib/authUtils.js";
import type * as calendar_lib_dateUtils from "../calendar/lib/dateUtils.js";
import type * as calendar_permissions from "../calendar/permissions.js";
import type * as calendar_queries from "../calendar/queries.js";
import type * as calendar_reminders_mutations from "../calendar/reminders/mutations.js";
import type * as calendar_reminders_queries from "../calendar/reminders/queries.js";
import type * as calendar_reminders from "../calendar/reminders.js";
import type * as calendar_schema_calendarSchema from "../calendar/schema/calendarSchema.js";
import type * as categories_index from "../categories/index.js";
import type * as categories_migration from "../categories/migration.js";
import type * as categories_mutations from "../categories/mutations.js";
import type * as categories_queries from "../categories/queries.js";
import type * as contacts_crud from "../contacts/crud.js";
import type * as contacts_import from "../contacts/import.js";
import type * as contacts_index from "../contacts/index.js";
import type * as contacts_organizations from "../contacts/organizations.js";
import type * as contacts_queries from "../contacts/queries.js";
import type * as contacts_schema_contactsSchema from "../contacts/schema/contactsSchema.js";
import type * as contacts_schema_index from "../contacts/schema/index.js";
import type * as contacts_tags from "../contacts/tags.js";
import type * as contacts_types from "../contacts/types.js";
import type * as core_accessControl_helpers from "../core/accessControl/helpers.js";
import type * as core_accessControl_mutations from "../core/accessControl/mutations.js";
import type * as core_accessControl_queries from "../core/accessControl/queries.js";
import type * as core_accessControl_types from "../core/accessControl/types.js";
import type * as core_auditLog_mutations from "../core/auditLog/mutations.js";
import type * as core_auditLog_queries from "../core/auditLog/queries.js";
import type * as core_categories_mutations from "../core/categories/mutations.js";
import type * as core_categories_queries from "../core/categories/queries.js";
import type * as core_contentTypes_lib_contentTypes from "../core/contentTypes/lib/contentTypes.js";
import type * as core_contentTypes_mutations from "../core/contentTypes/mutations.js";
import type * as core_contentTypes_queries from "../core/contentTypes/queries.js";
import type * as core_contentTypes_types from "../core/contentTypes/types.js";
import type * as core_crud_mutations from "../core/crud/mutations.js";
import type * as core_crud_queries from "../core/crud/queries.js";
import type * as core_files_mutations from "../core/files/mutations.js";
import type * as core_files_queries from "../core/files/queries.js";
import type * as core_files_types from "../core/files/types.js";
import type * as core_groupPosts_queries from "../core/groupPosts/queries.js";
import type * as core_helpdesk_mutations from "../core/helpdesk/mutations.js";
import type * as core_helpdesk_queries from "../core/helpdesk/queries.js";
import type * as core_lib_auth from "../core/lib/auth.js";
import type * as core_lib_index from "../core/lib/index.js";
import type * as core_lib_permissions from "../core/lib/permissions.js";
import type * as core_menus_mutations from "../core/menus/mutations.js";
import type * as core_menus_queries from "../core/menus/queries.js";
import type * as core_mutations from "../core/mutations.js";
import type * as core_options from "../core/options.js";
import type * as core_permissions_mutations from "../core/permissions/mutations.js";
import type * as core_permissions_queries from "../core/permissions/queries.js";
import type * as core_permissions_seed from "../core/permissions/seed.js";
import type * as core_permissionsUtils_helpers from "../core/permissionsUtils/helpers.js";
import type * as core_permissionsUtils_internal from "../core/permissionsUtils/internal.js";
import type * as core_permissionsUtils_mutations from "../core/permissionsUtils/mutations.js";
import type * as core_permissionsUtils_queries from "../core/permissionsUtils/queries.js";
import type * as core_permissionsUtils_types from "../core/permissionsUtils/types.js";
import type * as core_posts_mutations from "../core/posts/mutations.js";
import type * as core_posts_queries from "../core/posts/queries.js";
import type * as core_queries from "../core/queries.js";
import type * as core_roles_helpers from "../core/roles/helpers.js";
import type * as core_roles_mutations from "../core/roles/mutations.js";
import type * as core_roles_queries from "../core/roles/queries.js";
import type * as core_roles_types from "../core/roles/types.js";
import type * as core_schema_index from "../core/schema/index.js";
import type * as core_schema_optionsSchema from "../core/schema/optionsSchema.js";
import type * as core_schema_permissionsSchema from "../core/schema/permissionsSchema.js";
import type * as core_schema_postsSchema from "../core/schema/postsSchema.js";
import type * as core_schema_rolesSchema from "../core/schema/rolesSchema.js";
import type * as core_search_queries from "../core/search/queries.js";
import type * as downloads_index from "../downloads/index.js";
import type * as downloads_internal from "../downloads/internal.js";
import type * as downloads_lib_fileTypeUtils from "../downloads/lib/fileTypeUtils.js";
import type * as downloads_lib_helpers from "../downloads/lib/helpers.js";
import type * as downloads_lib_imageExtraction from "../downloads/lib/imageExtraction.js";
import type * as downloads_lib_index from "../downloads/lib/index.js";
import type * as downloads_library from "../downloads/library.js";
import type * as downloads_mutations from "../downloads/mutations.js";
import type * as downloads_queries from "../downloads/queries.js";
import type * as downloads_schema_index from "../downloads/schema/index.js";
import type * as downloads_schema_types from "../downloads/schema/types.js";
import type * as ecommerce_balances_mutations from "../ecommerce/balances/mutations.js";
import type * as ecommerce_balances_queries from "../ecommerce/balances/queries.js";
import type * as ecommerce_cart_cartUtils from "../ecommerce/cart/cartUtils.js";
import type * as ecommerce_cart_mutations from "../ecommerce/cart/mutations.js";
import type * as ecommerce_cart_queries from "../ecommerce/cart/queries.js";
import type * as ecommerce_categories_helpers from "../ecommerce/categories/helpers.js";
import type * as ecommerce_categories_mutations from "../ecommerce/categories/mutations.js";
import type * as ecommerce_categories_queries from "../ecommerce/categories/queries.js";
import type * as ecommerce_chargebacks_evidence from "../ecommerce/chargebacks/evidence.js";
import type * as ecommerce_chargebacks_mockData from "../ecommerce/chargebacks/mockData.js";
import type * as ecommerce_chargebacks_mutations from "../ecommerce/chargebacks/mutations.js";
import type * as ecommerce_chargebacks_queries from "../ecommerce/chargebacks/queries.js";
import type * as ecommerce_checkout_customCheckouts from "../ecommerce/checkout/customCheckouts.js";
import type * as ecommerce_checkout_mutations from "../ecommerce/checkout/mutations.js";
import type * as ecommerce_checkout_queries from "../ecommerce/checkout/queries.js";
import type * as ecommerce_lib_index from "../ecommerce/lib/index.js";
import type * as ecommerce_lib_permissions from "../ecommerce/lib/permissions.js";
import type * as ecommerce_lib_pricing from "../ecommerce/lib/pricing.js";
import type * as ecommerce_lib_stockUtils from "../ecommerce/lib/stockUtils.js";
import type * as ecommerce_mutations from "../ecommerce/mutations.js";
import type * as ecommerce_orders_calendar from "../ecommerce/orders/calendar.js";
import type * as ecommerce_orders_mockData from "../ecommerce/orders/mockData.js";
import type * as ecommerce_orders_mutation from "../ecommerce/orders/mutation.js";
import type * as ecommerce_orders_mutations from "../ecommerce/orders/mutations.js";
import type * as ecommerce_orders_notes from "../ecommerce/orders/notes.js";
import type * as ecommerce_orders_queries from "../ecommerce/orders/queries.js";
import type * as ecommerce_payments_mutations from "../ecommerce/payments/mutations.js";
import type * as ecommerce_payments_queries from "../ecommerce/payments/queries.js";
import type * as ecommerce_products_helpers from "../ecommerce/products/helpers.js";
import type * as ecommerce_products_media from "../ecommerce/products/media.js";
import type * as ecommerce_products_mutations from "../ecommerce/products/mutations.js";
import type * as ecommerce_products_queries from "../ecommerce/products/queries.js";
import type * as ecommerce_products_uploads from "../ecommerce/products/uploads.js";
import type * as ecommerce_queries from "../ecommerce/queries.js";
import type * as ecommerce_transfers_mockData from "../ecommerce/transfers/mockData.js";
import type * as ecommerce_transfers_mutations from "../ecommerce/transfers/mutations.js";
import type * as ecommerce_transfers_queries from "../ecommerce/transfers/queries.js";
import type * as ecommerce_variations_mutations from "../ecommerce/variations/mutations.js";
import type * as ecommerce_variations_queries from "../ecommerce/variations/queries.js";
import type * as env from "../env.js";
import type * as groups_index from "../groups/index.js";
import type * as groups_lib_dashboards from "../groups/lib/dashboards.js";
import type * as groups_lib_helpers from "../groups/lib/helpers.js";
import type * as groups_lib_index from "../groups/lib/index.js";
import type * as groups_lib_permissions from "../groups/lib/permissions.js";
import type * as groups_mutations from "../groups/mutations.js";
import type * as groups_posts from "../groups/posts.js";
import type * as groups_queries from "../groups/queries.js";
import type * as groups_schema_groupsSchema from "../groups/schema/groupsSchema.js";
import type * as groups_schema_index from "../groups/schema/index.js";
import type * as groups_schema_types from "../groups/schema/types.js";
import type * as http from "../http.js";
import type * as integrations_actions_index from "../integrations/actions/index.js";
import type * as integrations_actions_traderlaunchpad from "../integrations/actions/traderlaunchpad.js";
import type * as integrations_actions_webhooks from "../integrations/actions/webhooks.js";
import type * as integrations_apps_index from "../integrations/apps/index.js";
import type * as integrations_apps_migrations from "../integrations/apps/migrations.js";
import type * as integrations_apps_mutations from "../integrations/apps/mutations.js";
import type * as integrations_apps_queries from "../integrations/apps/queries.js";
import type * as integrations_apps_seed from "../integrations/apps/seed.js";
import type * as integrations_automationLogs_index from "../integrations/automationLogs/index.js";
import type * as integrations_automationLogs_mutations from "../integrations/automationLogs/mutations.js";
import type * as integrations_automationLogs_queries from "../integrations/automationLogs/queries.js";
import type * as integrations_connections_index from "../integrations/connections/index.js";
import type * as integrations_connections_internalConnections from "../integrations/connections/internalConnections.js";
import type * as integrations_connections_mutations from "../integrations/connections/mutations.js";
import type * as integrations_connections_queries from "../integrations/connections/queries.js";
import type * as integrations_connections from "../integrations/connections.js";
import type * as integrations_index from "../integrations/index.js";
import type * as integrations_init from "../integrations/init.js";
import type * as integrations_lib_httpFetch from "../integrations/lib/httpFetch.js";
import type * as integrations_nodes_index from "../integrations/nodes/index.js";
import type * as integrations_nodes_mutations from "../integrations/nodes/mutations.js";
import type * as integrations_nodes_queries from "../integrations/nodes/queries.js";
import type * as integrations_scenarios_index from "../integrations/scenarios/index.js";
import type * as integrations_scenarios_mutations from "../integrations/scenarios/mutations.js";
import type * as integrations_scenarios_queries from "../integrations/scenarios/queries.js";
import type * as integrations_schema_appsSchema from "../integrations/schema/appsSchema.js";
import type * as integrations_schema_automationLogsSchema from "../integrations/schema/automationLogsSchema.js";
import type * as integrations_schema_connectionsSchema from "../integrations/schema/connectionsSchema.js";
import type * as integrations_schema_index from "../integrations/schema/index.js";
import type * as integrations_schema_nodesSchema from "../integrations/schema/nodesSchema.js";
import type * as integrations_schema_scenariosSchema from "../integrations/schema/scenariosSchema.js";
import type * as integrations_triggers_index from "../integrations/triggers/index.js";
import type * as integrations_triggers_orderEvents from "../integrations/triggers/orderEvents.js";
import type * as lib_db from "../lib/db.js";
import type * as lib_fileTypes from "../lib/fileTypes.js";
import type * as lib_permissions_hasPermission from "../lib/permissions/hasPermission.js";
import type * as lib_permissions_index from "../lib/permissions/index.js";
import type * as lib_permissions_requirePermission from "../lib/permissions/requirePermission.js";
import type * as lib_permissions_userAuth from "../lib/permissions/userAuth.js";
import type * as lib_queryAnalyzer from "../lib/queryAnalyzer.js";
import type * as lib_slugs from "../lib/slugs.js";
import type * as lms_contentAccess_mutations from "../lms/contentAccess/mutations.js";
import type * as lms_contentAccess_queries from "../lms/contentAccess/queries.js";
import type * as lms_courses_helpers from "../lms/courses/helpers.js";
import type * as lms_courses_mutations from "../lms/courses/mutations.js";
import type * as lms_courses_queries from "../lms/courses/queries.js";
import type * as lms_enrollments_helpers from "../lms/enrollments/helpers.js";
import type * as lms_enrollments_mutations from "../lms/enrollments/mutations.js";
import type * as lms_enrollments_queries from "../lms/enrollments/queries.js";
import type * as lms_lessons_helpers from "../lms/lessons/helpers.js";
import type * as lms_lessons_mutations from "../lms/lessons/mutations.js";
import type * as lms_lessons_queries from "../lms/lessons/queries.js";
import type * as lms_progress_helpers from "../lms/progress/helpers.js";
import type * as lms_progress_mutations from "../lms/progress/mutations.js";
import type * as lms_progress_queries from "../lms/progress/queries.js";
import type * as lms_quizzes_helpers from "../lms/quizzes/helpers.js";
import type * as lms_quizzes_mutations from "../lms/quizzes/mutations.js";
import type * as lms_quizzes_queries from "../lms/quizzes/queries.js";
import type * as lms_topics_helpers from "../lms/topics/helpers.js";
import type * as lms_topics_mutations from "../lms/topics/mutations.js";
import type * as lms_topics_queries from "../lms/topics/queries.js";
import type * as media_categories from "../media/categories.js";
import type * as media_http from "../media/http.js";
import type * as media_index from "../media/index.js";
import type * as media_integration from "../media/integration.js";
import type * as media_mutations from "../media/mutations.js";
import type * as media_queries from "../media/queries.js";
import type * as notifications_index from "../notifications/index.js";
import type * as notifications_lib_feedNotifications from "../notifications/lib/feedNotifications.js";
import type * as notifications_lib_formatters from "../notifications/lib/formatters.js";
import type * as notifications_lib_index from "../notifications/lib/index.js";
import type * as notifications_lib_preferences from "../notifications/lib/preferences.js";
import type * as notifications_mutations from "../notifications/mutations.js";
import type * as notifications_preferences from "../notifications/preferences.js";
import type * as notifications_queries from "../notifications/queries.js";
import type * as notifications_schema_index from "../notifications/schema/index.js";
import type * as notifications_schema_notificationsSchema from "../notifications/schema/notificationsSchema.js";
import type * as notifications_schema_types from "../notifications/schema/types.js";
import type * as organizations_helpers from "../organizations/helpers.js";
import type * as organizations_index from "../organizations/index.js";
import type * as organizations_mutations from "../organizations/mutations.js";
import type * as organizations_queries from "../organizations/queries.js";
import type * as organizations_seed from "../organizations/seed.js";
import type * as organizations_types from "../organizations/types.js";
import type * as permissions_functions from "../permissions/functions.js";
import type * as puckEditor_mutations from "../puckEditor/mutations.js";
import type * as puckEditor_queries from "../puckEditor/queries.js";
import type * as shared_auth from "../shared/auth.js";
import type * as shared_constants from "../shared/constants.js";
import type * as shared_dates from "../shared/dates.js";
import type * as shared_errors from "../shared/errors.js";
import type * as shared_formatting from "../shared/formatting.js";
import type * as shared_index from "../shared/index.js";
import type * as shared_pagination from "../shared/pagination.js";
import type * as shared_search from "../shared/search.js";
import type * as shared_validation from "../shared/validation.js";
import type * as shared_validators from "../shared/validators.js";
import type * as socialfeed_crons from "../socialfeed/crons.js";
import type * as socialfeed_lib_recommendationEngine from "../socialfeed/lib/recommendationEngine.js";
import type * as socialfeed_lib_trendingAlgorithm from "../socialfeed/lib/trendingAlgorithm.js";
import type * as socialfeed_mutations from "../socialfeed/mutations.js";
import type * as socialfeed_queries from "../socialfeed/queries.js";
import type * as socialfeed_schema_commentsSchema from "../socialfeed/schema/commentsSchema.js";
import type * as socialfeed_schema_contentRecommendationsSchema from "../socialfeed/schema/contentRecommendationsSchema.js";
import type * as socialfeed_schema_feedItemsSchema from "../socialfeed/schema/feedItemsSchema.js";
import type * as socialfeed_schema_hashtagsSchema from "../socialfeed/schema/hashtagsSchema.js";
import type * as socialfeed_schema_index from "../socialfeed/schema/index.js";
import type * as socialfeed_schema_reactionsSchema from "../socialfeed/schema/reactionsSchema.js";
import type * as socialfeed_schema_savedItemsSchema from "../socialfeed/schema/savedItemsSchema.js";
import type * as socialfeed_schema_subscriptionsSchema from "../socialfeed/schema/subscriptionsSchema.js";
import type * as socialfeed_schema_topicFollowsSchema from "../socialfeed/schema/topicFollowsSchema.js";
import type * as socialfeed_schema_trendingContentSchema from "../socialfeed/schema/trendingContentSchema.js";
import type * as tags_index from "../tags/index.js";
import type * as tasks_boards_mutations from "../tasks/boards/mutations.js";
import type * as tasks_boards_queries from "../tasks/boards/queries.js";
import type * as tasks_boards from "../tasks/boards.js";
import type * as tasks_index from "../tasks/index.js";
import type * as users_helpers from "../users/helpers.js";
import type * as users_index from "../users/index.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";
import type * as users_schema_types from "../users/schema/types.js";
import type * as vimeo_actions from "../vimeo/actions.js";
import type * as vimeo_crons from "../vimeo/crons.js";
import type * as vimeo_index from "../vimeo/index.js";
import type * as vimeo_mutations from "../vimeo/mutations.js";
import type * as vimeo_queries from "../vimeo/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "calendar/attendance/mutations": typeof calendar_attendance_mutations;
  "calendar/attendance/queries": typeof calendar_attendance_queries;
  "calendar/attendees": typeof calendar_attendees;
  "calendar/crud": typeof calendar_crud;
  "calendar/events/crud": typeof calendar_events_crud;
  "calendar/events/queries": typeof calendar_events_queries;
  "calendar/invitations": typeof calendar_invitations;
  "calendar/lib/authUtils": typeof calendar_lib_authUtils;
  "calendar/lib/dateUtils": typeof calendar_lib_dateUtils;
  "calendar/permissions": typeof calendar_permissions;
  "calendar/queries": typeof calendar_queries;
  "calendar/reminders/mutations": typeof calendar_reminders_mutations;
  "calendar/reminders/queries": typeof calendar_reminders_queries;
  "calendar/reminders": typeof calendar_reminders;
  "calendar/schema/calendarSchema": typeof calendar_schema_calendarSchema;
  "categories/index": typeof categories_index;
  "categories/migration": typeof categories_migration;
  "categories/mutations": typeof categories_mutations;
  "categories/queries": typeof categories_queries;
  "contacts/crud": typeof contacts_crud;
  "contacts/import": typeof contacts_import;
  "contacts/index": typeof contacts_index;
  "contacts/organizations": typeof contacts_organizations;
  "contacts/queries": typeof contacts_queries;
  "contacts/schema/contactsSchema": typeof contacts_schema_contactsSchema;
  "contacts/schema/index": typeof contacts_schema_index;
  "contacts/tags": typeof contacts_tags;
  "contacts/types": typeof contacts_types;
  "core/accessControl/helpers": typeof core_accessControl_helpers;
  "core/accessControl/mutations": typeof core_accessControl_mutations;
  "core/accessControl/queries": typeof core_accessControl_queries;
  "core/accessControl/types": typeof core_accessControl_types;
  "core/auditLog/mutations": typeof core_auditLog_mutations;
  "core/auditLog/queries": typeof core_auditLog_queries;
  "core/categories/mutations": typeof core_categories_mutations;
  "core/categories/queries": typeof core_categories_queries;
  "core/contentTypes/lib/contentTypes": typeof core_contentTypes_lib_contentTypes;
  "core/contentTypes/mutations": typeof core_contentTypes_mutations;
  "core/contentTypes/queries": typeof core_contentTypes_queries;
  "core/contentTypes/types": typeof core_contentTypes_types;
  "core/crud/mutations": typeof core_crud_mutations;
  "core/crud/queries": typeof core_crud_queries;
  "core/files/mutations": typeof core_files_mutations;
  "core/files/queries": typeof core_files_queries;
  "core/files/types": typeof core_files_types;
  "core/groupPosts/queries": typeof core_groupPosts_queries;
  "core/helpdesk/mutations": typeof core_helpdesk_mutations;
  "core/helpdesk/queries": typeof core_helpdesk_queries;
  "core/lib/auth": typeof core_lib_auth;
  "core/lib/index": typeof core_lib_index;
  "core/lib/permissions": typeof core_lib_permissions;
  "core/menus/mutations": typeof core_menus_mutations;
  "core/menus/queries": typeof core_menus_queries;
  "core/mutations": typeof core_mutations;
  "core/options": typeof core_options;
  "core/permissions/mutations": typeof core_permissions_mutations;
  "core/permissions/queries": typeof core_permissions_queries;
  "core/permissions/seed": typeof core_permissions_seed;
  "core/permissionsUtils/helpers": typeof core_permissionsUtils_helpers;
  "core/permissionsUtils/internal": typeof core_permissionsUtils_internal;
  "core/permissionsUtils/mutations": typeof core_permissionsUtils_mutations;
  "core/permissionsUtils/queries": typeof core_permissionsUtils_queries;
  "core/permissionsUtils/types": typeof core_permissionsUtils_types;
  "core/posts/mutations": typeof core_posts_mutations;
  "core/posts/queries": typeof core_posts_queries;
  "core/queries": typeof core_queries;
  "core/roles/helpers": typeof core_roles_helpers;
  "core/roles/mutations": typeof core_roles_mutations;
  "core/roles/queries": typeof core_roles_queries;
  "core/roles/types": typeof core_roles_types;
  "core/schema/index": typeof core_schema_index;
  "core/schema/optionsSchema": typeof core_schema_optionsSchema;
  "core/schema/permissionsSchema": typeof core_schema_permissionsSchema;
  "core/schema/postsSchema": typeof core_schema_postsSchema;
  "core/schema/rolesSchema": typeof core_schema_rolesSchema;
  "core/search/queries": typeof core_search_queries;
  "downloads/index": typeof downloads_index;
  "downloads/internal": typeof downloads_internal;
  "downloads/lib/fileTypeUtils": typeof downloads_lib_fileTypeUtils;
  "downloads/lib/helpers": typeof downloads_lib_helpers;
  "downloads/lib/imageExtraction": typeof downloads_lib_imageExtraction;
  "downloads/lib/index": typeof downloads_lib_index;
  "downloads/library": typeof downloads_library;
  "downloads/mutations": typeof downloads_mutations;
  "downloads/queries": typeof downloads_queries;
  "downloads/schema/index": typeof downloads_schema_index;
  "downloads/schema/types": typeof downloads_schema_types;
  "ecommerce/balances/mutations": typeof ecommerce_balances_mutations;
  "ecommerce/balances/queries": typeof ecommerce_balances_queries;
  "ecommerce/cart/cartUtils": typeof ecommerce_cart_cartUtils;
  "ecommerce/cart/mutations": typeof ecommerce_cart_mutations;
  "ecommerce/cart/queries": typeof ecommerce_cart_queries;
  "ecommerce/categories/helpers": typeof ecommerce_categories_helpers;
  "ecommerce/categories/mutations": typeof ecommerce_categories_mutations;
  "ecommerce/categories/queries": typeof ecommerce_categories_queries;
  "ecommerce/chargebacks/evidence": typeof ecommerce_chargebacks_evidence;
  "ecommerce/chargebacks/mockData": typeof ecommerce_chargebacks_mockData;
  "ecommerce/chargebacks/mutations": typeof ecommerce_chargebacks_mutations;
  "ecommerce/chargebacks/queries": typeof ecommerce_chargebacks_queries;
  "ecommerce/checkout/customCheckouts": typeof ecommerce_checkout_customCheckouts;
  "ecommerce/checkout/mutations": typeof ecommerce_checkout_mutations;
  "ecommerce/checkout/queries": typeof ecommerce_checkout_queries;
  "ecommerce/lib/index": typeof ecommerce_lib_index;
  "ecommerce/lib/permissions": typeof ecommerce_lib_permissions;
  "ecommerce/lib/pricing": typeof ecommerce_lib_pricing;
  "ecommerce/lib/stockUtils": typeof ecommerce_lib_stockUtils;
  "ecommerce/mutations": typeof ecommerce_mutations;
  "ecommerce/orders/calendar": typeof ecommerce_orders_calendar;
  "ecommerce/orders/mockData": typeof ecommerce_orders_mockData;
  "ecommerce/orders/mutation": typeof ecommerce_orders_mutation;
  "ecommerce/orders/mutations": typeof ecommerce_orders_mutations;
  "ecommerce/orders/notes": typeof ecommerce_orders_notes;
  "ecommerce/orders/queries": typeof ecommerce_orders_queries;
  "ecommerce/payments/mutations": typeof ecommerce_payments_mutations;
  "ecommerce/payments/queries": typeof ecommerce_payments_queries;
  "ecommerce/products/helpers": typeof ecommerce_products_helpers;
  "ecommerce/products/media": typeof ecommerce_products_media;
  "ecommerce/products/mutations": typeof ecommerce_products_mutations;
  "ecommerce/products/queries": typeof ecommerce_products_queries;
  "ecommerce/products/uploads": typeof ecommerce_products_uploads;
  "ecommerce/queries": typeof ecommerce_queries;
  "ecommerce/transfers/mockData": typeof ecommerce_transfers_mockData;
  "ecommerce/transfers/mutations": typeof ecommerce_transfers_mutations;
  "ecommerce/transfers/queries": typeof ecommerce_transfers_queries;
  "ecommerce/variations/mutations": typeof ecommerce_variations_mutations;
  "ecommerce/variations/queries": typeof ecommerce_variations_queries;
  env: typeof env;
  "groups/index": typeof groups_index;
  "groups/lib/dashboards": typeof groups_lib_dashboards;
  "groups/lib/helpers": typeof groups_lib_helpers;
  "groups/lib/index": typeof groups_lib_index;
  "groups/lib/permissions": typeof groups_lib_permissions;
  "groups/mutations": typeof groups_mutations;
  "groups/posts": typeof groups_posts;
  "groups/queries": typeof groups_queries;
  "groups/schema/groupsSchema": typeof groups_schema_groupsSchema;
  "groups/schema/index": typeof groups_schema_index;
  "groups/schema/types": typeof groups_schema_types;
  http: typeof http;
  "integrations/actions/index": typeof integrations_actions_index;
  "integrations/actions/traderlaunchpad": typeof integrations_actions_traderlaunchpad;
  "integrations/actions/webhooks": typeof integrations_actions_webhooks;
  "integrations/apps/index": typeof integrations_apps_index;
  "integrations/apps/migrations": typeof integrations_apps_migrations;
  "integrations/apps/mutations": typeof integrations_apps_mutations;
  "integrations/apps/queries": typeof integrations_apps_queries;
  "integrations/apps/seed": typeof integrations_apps_seed;
  "integrations/automationLogs/index": typeof integrations_automationLogs_index;
  "integrations/automationLogs/mutations": typeof integrations_automationLogs_mutations;
  "integrations/automationLogs/queries": typeof integrations_automationLogs_queries;
  "integrations/connections/index": typeof integrations_connections_index;
  "integrations/connections/internalConnections": typeof integrations_connections_internalConnections;
  "integrations/connections/mutations": typeof integrations_connections_mutations;
  "integrations/connections/queries": typeof integrations_connections_queries;
  "integrations/connections": typeof integrations_connections;
  "integrations/index": typeof integrations_index;
  "integrations/init": typeof integrations_init;
  "integrations/lib/httpFetch": typeof integrations_lib_httpFetch;
  "integrations/nodes/index": typeof integrations_nodes_index;
  "integrations/nodes/mutations": typeof integrations_nodes_mutations;
  "integrations/nodes/queries": typeof integrations_nodes_queries;
  "integrations/scenarios/index": typeof integrations_scenarios_index;
  "integrations/scenarios/mutations": typeof integrations_scenarios_mutations;
  "integrations/scenarios/queries": typeof integrations_scenarios_queries;
  "integrations/schema/appsSchema": typeof integrations_schema_appsSchema;
  "integrations/schema/automationLogsSchema": typeof integrations_schema_automationLogsSchema;
  "integrations/schema/connectionsSchema": typeof integrations_schema_connectionsSchema;
  "integrations/schema/index": typeof integrations_schema_index;
  "integrations/schema/nodesSchema": typeof integrations_schema_nodesSchema;
  "integrations/schema/scenariosSchema": typeof integrations_schema_scenariosSchema;
  "integrations/triggers/index": typeof integrations_triggers_index;
  "integrations/triggers/orderEvents": typeof integrations_triggers_orderEvents;
  "lib/db": typeof lib_db;
  "lib/fileTypes": typeof lib_fileTypes;
  "lib/permissions/hasPermission": typeof lib_permissions_hasPermission;
  "lib/permissions/index": typeof lib_permissions_index;
  "lib/permissions/requirePermission": typeof lib_permissions_requirePermission;
  "lib/permissions/userAuth": typeof lib_permissions_userAuth;
  "lib/queryAnalyzer": typeof lib_queryAnalyzer;
  "lib/slugs": typeof lib_slugs;
  "lms/contentAccess/mutations": typeof lms_contentAccess_mutations;
  "lms/contentAccess/queries": typeof lms_contentAccess_queries;
  "lms/courses/helpers": typeof lms_courses_helpers;
  "lms/courses/mutations": typeof lms_courses_mutations;
  "lms/courses/queries": typeof lms_courses_queries;
  "lms/enrollments/helpers": typeof lms_enrollments_helpers;
  "lms/enrollments/mutations": typeof lms_enrollments_mutations;
  "lms/enrollments/queries": typeof lms_enrollments_queries;
  "lms/lessons/helpers": typeof lms_lessons_helpers;
  "lms/lessons/mutations": typeof lms_lessons_mutations;
  "lms/lessons/queries": typeof lms_lessons_queries;
  "lms/progress/helpers": typeof lms_progress_helpers;
  "lms/progress/mutations": typeof lms_progress_mutations;
  "lms/progress/queries": typeof lms_progress_queries;
  "lms/quizzes/helpers": typeof lms_quizzes_helpers;
  "lms/quizzes/mutations": typeof lms_quizzes_mutations;
  "lms/quizzes/queries": typeof lms_quizzes_queries;
  "lms/topics/helpers": typeof lms_topics_helpers;
  "lms/topics/mutations": typeof lms_topics_mutations;
  "lms/topics/queries": typeof lms_topics_queries;
  "media/categories": typeof media_categories;
  "media/http": typeof media_http;
  "media/index": typeof media_index;
  "media/integration": typeof media_integration;
  "media/mutations": typeof media_mutations;
  "media/queries": typeof media_queries;
  "notifications/index": typeof notifications_index;
  "notifications/lib/feedNotifications": typeof notifications_lib_feedNotifications;
  "notifications/lib/formatters": typeof notifications_lib_formatters;
  "notifications/lib/index": typeof notifications_lib_index;
  "notifications/lib/preferences": typeof notifications_lib_preferences;
  "notifications/mutations": typeof notifications_mutations;
  "notifications/preferences": typeof notifications_preferences;
  "notifications/queries": typeof notifications_queries;
  "notifications/schema/index": typeof notifications_schema_index;
  "notifications/schema/notificationsSchema": typeof notifications_schema_notificationsSchema;
  "notifications/schema/types": typeof notifications_schema_types;
  "organizations/helpers": typeof organizations_helpers;
  "organizations/index": typeof organizations_index;
  "organizations/mutations": typeof organizations_mutations;
  "organizations/queries": typeof organizations_queries;
  "organizations/seed": typeof organizations_seed;
  "organizations/types": typeof organizations_types;
  "permissions/functions": typeof permissions_functions;
  "puckEditor/mutations": typeof puckEditor_mutations;
  "puckEditor/queries": typeof puckEditor_queries;
  "shared/auth": typeof shared_auth;
  "shared/constants": typeof shared_constants;
  "shared/dates": typeof shared_dates;
  "shared/errors": typeof shared_errors;
  "shared/formatting": typeof shared_formatting;
  "shared/index": typeof shared_index;
  "shared/pagination": typeof shared_pagination;
  "shared/search": typeof shared_search;
  "shared/validation": typeof shared_validation;
  "shared/validators": typeof shared_validators;
  "socialfeed/crons": typeof socialfeed_crons;
  "socialfeed/lib/recommendationEngine": typeof socialfeed_lib_recommendationEngine;
  "socialfeed/lib/trendingAlgorithm": typeof socialfeed_lib_trendingAlgorithm;
  "socialfeed/mutations": typeof socialfeed_mutations;
  "socialfeed/queries": typeof socialfeed_queries;
  "socialfeed/schema/commentsSchema": typeof socialfeed_schema_commentsSchema;
  "socialfeed/schema/contentRecommendationsSchema": typeof socialfeed_schema_contentRecommendationsSchema;
  "socialfeed/schema/feedItemsSchema": typeof socialfeed_schema_feedItemsSchema;
  "socialfeed/schema/hashtagsSchema": typeof socialfeed_schema_hashtagsSchema;
  "socialfeed/schema/index": typeof socialfeed_schema_index;
  "socialfeed/schema/reactionsSchema": typeof socialfeed_schema_reactionsSchema;
  "socialfeed/schema/savedItemsSchema": typeof socialfeed_schema_savedItemsSchema;
  "socialfeed/schema/subscriptionsSchema": typeof socialfeed_schema_subscriptionsSchema;
  "socialfeed/schema/topicFollowsSchema": typeof socialfeed_schema_topicFollowsSchema;
  "socialfeed/schema/trendingContentSchema": typeof socialfeed_schema_trendingContentSchema;
  "tags/index": typeof tags_index;
  "tasks/boards/mutations": typeof tasks_boards_mutations;
  "tasks/boards/queries": typeof tasks_boards_queries;
  "tasks/boards": typeof tasks_boards;
  "tasks/index": typeof tasks_index;
  "users/helpers": typeof users_helpers;
  "users/index": typeof users_index;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
  "users/schema/types": typeof users_schema_types;
  "vimeo/actions": typeof vimeo_actions;
  "vimeo/crons": typeof vimeo_crons;
  "vimeo/index": typeof vimeo_index;
  "vimeo/mutations": typeof vimeo_mutations;
  "vimeo/queries": typeof vimeo_queries;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  actionCache: {
    crons: {
      purge: FunctionReference<
        "mutation",
        "internal",
        { expiresAt?: number },
        null
      >;
    };
    lib: {
      get: FunctionReference<
        "query",
        "internal",
        { args: any; name: string; ttl: number | null },
        { kind: "hit"; value: any } | { expiredEntry?: string; kind: "miss" }
      >;
      put: FunctionReference<
        "mutation",
        "internal",
        {
          args: any;
          expiredEntry?: string;
          name: string;
          ttl: number | null;
          value: any;
        },
        { cacheHit: boolean; deletedExpiredEntry: boolean }
      >;
      remove: FunctionReference<
        "mutation",
        "internal",
        { args: any; name: string },
        null
      >;
      removeAll: FunctionReference<
        "mutation",
        "internal",
        { batchSize?: number; before?: number; name?: string },
        null
      >;
    };
  };
};
