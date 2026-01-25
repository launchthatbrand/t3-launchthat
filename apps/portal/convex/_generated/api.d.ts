/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth_exchange from "../auth/exchange.js";
import type * as auth_sessions from "../auth/sessions.js";
import type * as constants from "../constants.js";
import type * as core_adminUiLayouts_mutations from "../core/adminUiLayouts/mutations.js";
import type * as core_adminUiLayouts_queries from "../core/adminUiLayouts/queries.js";
import type * as core_auditLog_queries from "../core/auditLog/queries.js";
import type * as core_categories_mutations from "../core/categories/mutations.js";
import type * as core_categories_queries from "../core/categories/queries.js";
import type * as core_downloads_actions from "../core/downloads/actions.js";
import type * as core_downloads_meta from "../core/downloads/meta.js";
import type * as core_downloads_mutations from "../core/downloads/mutations.js";
import type * as core_downloads_policy from "../core/downloads/policy.js";
import type * as core_downloads_queries from "../core/downloads/queries.js";
import type * as core_emails_reactEmail from "../core/emails/reactEmail.js";
import type * as core_emails_reactEmailRender from "../core/emails/reactEmailRender.js";
import type * as core_emails_render from "../core/emails/render.js";
import type * as core_emails_service from "../core/emails/service.js";
import type * as core_lib_auth from "../core/lib/auth.js";
import type * as core_lib_index from "../core/lib/index.js";
import type * as core_lib_permissions from "../core/lib/permissions.js";
import type * as core_logs_queries from "../core/logs/queries.js";
import type * as core_media_actions from "../core/media/actions.js";
import type * as core_media_http from "../core/media/http.js";
import type * as core_media_integration from "../core/media/integration.js";
import type * as core_media_meta from "../core/media/meta.js";
import type * as core_media_mutations from "../core/media/mutations.js";
import type * as core_media_queries from "../core/media/queries.js";
import type * as core_menus_mutations from "../core/menus/mutations.js";
import type * as core_menus_queries from "../core/menus/queries.js";
import type * as core_notifications_broadcasts from "../core/notifications/broadcasts.js";
import type * as core_notifications_delivery_registerSinks from "../core/notifications/delivery/registerSinks.js";
import type * as core_notifications_delivery_registry from "../core/notifications/delivery/registry.js";
import type * as core_notifications_delivery_runSinks from "../core/notifications/delivery/runSinks.js";
import type * as core_notifications_delivery_sinks_emailSink from "../core/notifications/delivery/sinks/emailSink.js";
import type * as core_notifications_delivery_types from "../core/notifications/delivery/types.js";
import type * as core_notifications_helpers from "../core/notifications/helpers.js";
import type * as core_notifications_internal_dispatch from "../core/notifications/internal/dispatch.js";
import type * as core_notifications_internal_testHelpers from "../core/notifications/internal/testHelpers.js";
import type * as core_notifications_lib_formatters from "../core/notifications/lib/formatters.js";
import type * as core_notifications_lib_index from "../core/notifications/lib/index.js";
import type * as core_notifications_lib_preferences from "../core/notifications/lib/preferences.js";
import type * as core_notifications_mutations from "../core/notifications/mutations.js";
import type * as core_notifications_preferences from "../core/notifications/preferences.js";
import type * as core_notifications_queries from "../core/notifications/queries.js";
import type * as core_notifications_settings from "../core/notifications/settings.js";
import type * as core_notifications_test from "../core/notifications/test.js";
import type * as core_notifications_types from "../core/notifications/types.js";
import type * as core_options from "../core/options.js";
import type * as core_organizations_domains from "../core/organizations/domains.js";
import type * as core_organizations_domainsInternal from "../core/organizations/domainsInternal.js";
import type * as core_organizations_emailDomains from "../core/organizations/emailDomains.js";
import type * as core_organizations_helpers from "../core/organizations/helpers.js";
import type * as core_organizations_membershipsInternal from "../core/organizations/membershipsInternal.js";
import type * as core_organizations_membershipsInternalQueries from "../core/organizations/membershipsInternalQueries.js";
import type * as core_organizations_mutations from "../core/organizations/mutations.js";
import type * as core_organizations_queries from "../core/organizations/queries.js";
import type * as core_organizations_seed from "../core/organizations/seed.js";
import type * as core_organizations_types from "../core/organizations/types.js";
import type * as core_permissions_mutations from "../core/permissions/mutations.js";
import type * as core_permissions_queries from "../core/permissions/queries.js";
import type * as core_postTypes_lib_contentTypes from "../core/postTypes/lib/contentTypes.js";
import type * as core_postTypes_migrations from "../core/postTypes/migrations.js";
import type * as core_postTypes_mutations from "../core/postTypes/mutations.js";
import type * as core_postTypes_queries from "../core/postTypes/queries.js";
import type * as core_postTypes_types from "../core/postTypes/types.js";
import type * as core_posts_mutations from "../core/posts/mutations.js";
import type * as core_posts_postMeta from "../core/posts/postMeta.js";
import type * as core_posts_queries from "../core/posts/queries.js";
import type * as core_posts_templates from "../core/posts/templates.js";
import type * as core_roles_queries from "../core/roles/queries.js";
import type * as core_tags_mutations from "../core/tags/mutations.js";
import type * as core_tags_queries from "../core/tags/queries.js";
import type * as core_taxonomies_mutations from "../core/taxonomies/mutations.js";
import type * as core_taxonomies_queries from "../core/taxonomies/queries.js";
import type * as core_users_helpers from "../core/users/helpers.js";
import type * as core_users_mutations from "../core/users/mutations.js";
import type * as core_users_queries from "../core/users/queries.js";
import type * as core_users_types from "../core/users/types.js";
import type * as core_users from "../core/users.js";
import type * as crons from "../crons.js";
import type * as dev_ffmpeg from "../dev/ffmpeg.js";
import type * as env from "../env.js";
import type * as http from "../http.js";
import type * as integrations_connections_actions from "../integrations/connections/actions.js";
import type * as integrations_connections_cryptoActions from "../integrations/connections/cryptoActions.js";
import type * as integrations_connections_internalConnections from "../integrations/connections/internalConnections.js";
import type * as integrations_connections_mutations from "../integrations/connections/mutations.js";
import type * as integrations_connections_queries from "../integrations/connections/queries.js";
import type * as integrations_hardcodedSeeds from "../integrations/hardcodedSeeds.js";
import type * as integrations_importBasedSeeding from "../integrations/importBasedSeeding.js";
import type * as integrations_init from "../integrations/init.js";
import type * as integrations_integrationNodes_mutations from "../integrations/integrationNodes/mutations.js";
import type * as integrations_integrationNodes_queries from "../integrations/integrationNodes/queries.js";
import type * as integrations_integrationNodes_registry from "../integrations/integrationNodes/registry.js";
import type * as integrations_integrationNodes_seed from "../integrations/integrationNodes/seed.js";
import type * as integrations_lib_actionExecution from "../integrations/lib/actionExecution.js";
import type * as integrations_lib_crypto from "../integrations/lib/crypto.js";
import type * as integrations_lib_errors from "../integrations/lib/errors.js";
import type * as integrations_lib_httpFetch from "../integrations/lib/httpFetch.js";
import type * as integrations_lib_idempotency from "../integrations/lib/idempotency.js";
import type * as integrations_lib_manifestDiscovery from "../integrations/lib/manifestDiscovery.js";
import type * as integrations_lib_manifestTypes from "../integrations/lib/manifestTypes.js";
import type * as integrations_lib_migrations from "../integrations/lib/migrations.js";
import type * as integrations_lib_registries from "../integrations/lib/registries.js";
import type * as integrations_lib_retry from "../integrations/lib/retry.js";
import type * as integrations_lib_runManagement from "../integrations/lib/runManagement.js";
import type * as integrations_lib_seedingUtils from "../integrations/lib/seedingUtils.js";
import type * as integrations_manifestSeeding from "../integrations/manifestSeeding.js";
import type * as integrations_triggers_orderEvents from "../integrations/triggers/orderEvents.js";
import type * as integrations_triggers_registry from "../integrations/triggers/registry.js";
import type * as lib_db from "../lib/db.js";
import type * as lib_fileTypes from "../lib/fileTypes.js";
import type * as lib_permissions_hasPermission from "../lib/permissions/hasPermission.js";
import type * as lib_permissions_index from "../lib/permissions/index.js";
import type * as lib_permissions_requirePermission from "../lib/permissions/requirePermission.js";
import type * as lib_permissions_userAuth from "../lib/permissions/userAuth.js";
import type * as lib_queryAnalyzer from "../lib/queryAnalyzer.js";
import type * as lib_slugs from "../lib/slugs.js";
import type * as migrations_portal from "../migrations/portal.js";
import type * as plugins_calendar_crud from "../plugins/calendar/crud.js";
import type * as plugins_calendar_events_crud from "../plugins/calendar/events/crud.js";
import type * as plugins_calendar_events_orders from "../plugins/calendar/events/orders.js";
import type * as plugins_calendar_events_queries from "../plugins/calendar/events/queries.js";
import type * as plugins_calendar_helpers from "../plugins/calendar/helpers.js";
import type * as plugins_calendar_queries from "../plugins/calendar/queries.js";
import type * as plugins_commerce_cart_mutations from "../plugins/commerce/cart/mutations.js";
import type * as plugins_commerce_cart_queries from "../plugins/commerce/cart/queries.js";
import type * as plugins_commerce_chargebacks_evidence_mutations from "../plugins/commerce/chargebacks/evidence/mutations.js";
import type * as plugins_commerce_chargebacks_evidence_queries from "../plugins/commerce/chargebacks/evidence/queries.js";
import type * as plugins_commerce_checkout_actions from "../plugins/commerce/checkout/actions.js";
import type * as plugins_commerce_checkout_mutations from "../plugins/commerce/checkout/mutations.js";
import type * as plugins_commerce_discounts_mutations from "../plugins/commerce/discounts/mutations.js";
import type * as plugins_commerce_discounts_queries from "../plugins/commerce/discounts/queries.js";
import type * as plugins_commerce_funnelSteps_mutations from "../plugins/commerce/funnelSteps/mutations.js";
import type * as plugins_commerce_funnelSteps_queries from "../plugins/commerce/funnelSteps/queries.js";
import type * as plugins_commerce_funnels_mutations from "../plugins/commerce/funnels/mutations.js";
import type * as plugins_commerce_funnels_queries from "../plugins/commerce/funnels/queries.js";
import type * as plugins_commerce_mutations from "../plugins/commerce/mutations.js";
import type * as plugins_commerce_orders_mutations from "../plugins/commerce/orders/mutations.js";
import type * as plugins_commerce_orders_notes from "../plugins/commerce/orders/notes.js";
import type * as plugins_commerce_orders_queries from "../plugins/commerce/orders/queries.js";
import type * as plugins_commerce_orgPlans from "../plugins/commerce/orgPlans.js";
import type * as plugins_commerce_payments_authorizenet_actions from "../plugins/commerce/payments/authorizenet/actions.js";
import type * as plugins_commerce_products_queries from "../plugins/commerce/products/queries.js";
import type * as plugins_commerce_queries from "../plugins/commerce/queries.js";
import type * as plugins_commerce_subscriptions_actions from "../plugins/commerce/subscriptions/actions.js";
import type * as plugins_commerce_subscriptions_queries from "../plugins/commerce/subscriptions/queries.js";
import type * as plugins_commerce from "../plugins/commerce.js";
import type * as plugins_crm_contacts_mutations from "../plugins/crm/contacts/mutations.js";
import type * as plugins_crm_contacts_queries from "../plugins/crm/contacts/queries.js";
import type * as plugins_crm_marketingTags_mutations from "../plugins/crm/marketingTags/mutations.js";
import type * as plugins_crm_marketingTags_queries from "../plugins/crm/marketingTags/queries.js";
import type * as plugins_disclaimers_actions from "../plugins/disclaimers/actions.js";
import type * as plugins_disclaimers_mutations from "../plugins/disclaimers/mutations.js";
import type * as plugins_disclaimers_posts_mutations from "../plugins/disclaimers/posts/mutations.js";
import type * as plugins_disclaimers_posts_queries from "../plugins/disclaimers/posts/queries.js";
import type * as plugins_disclaimers_queries from "../plugins/disclaimers/queries.js";
import type * as plugins_discord_actions from "../plugins/discord/actions.js";
import type * as plugins_discord_gateway from "../plugins/discord/gateway.js";
import type * as plugins_discord_gatewayRateLimits from "../plugins/discord/gatewayRateLimits.js";
import type * as plugins_discord_mutations from "../plugins/discord/mutations.js";
import type * as plugins_discord_notificationsSink from "../plugins/discord/notificationsSink.js";
import type * as plugins_discord_permissions from "../plugins/discord/permissions.js";
import type * as plugins_discord_queries from "../plugins/discord/queries.js";
import type * as plugins_discord_roleRules from "../plugins/discord/roleRules.js";
import type * as plugins_discord_sync from "../plugins/discord/sync.js";
import type * as plugins_entity_mutations from "../plugins/entity/mutations.js";
import type * as plugins_entity_queries from "../plugins/entity/queries.js";
import type * as plugins_entity_resolvers from "../plugins/entity/resolvers.js";
import type * as plugins_entity_types from "../plugins/entity/types.js";
import type * as plugins_lms_actions from "../plugins/lms/actions.js";
import type * as plugins_lms_enrollments_mutations from "../plugins/lms/enrollments/mutations.js";
import type * as plugins_lms_enrollments_queries from "../plugins/lms/enrollments/queries.js";
import type * as plugins_lms_helpers from "../plugins/lms/helpers.js";
import type * as plugins_lms_mutations from "../plugins/lms/mutations.js";
import type * as plugins_lms_posts_mutations from "../plugins/lms/posts/mutations.js";
import type * as plugins_lms_posts_queries from "../plugins/lms/posts/queries.js";
import type * as plugins_lms_queries from "../plugins/lms/queries.js";
import type * as plugins_onboarding_mutations from "../plugins/onboarding/mutations.js";
import type * as plugins_onboarding_permissions from "../plugins/onboarding/permissions.js";
import type * as plugins_onboarding_queries from "../plugins/onboarding/queries.js";
import type * as plugins_socialfeed_crons from "../plugins/socialfeed/crons.js";
import type * as plugins_socialfeed_lib_recommendationEngine from "../plugins/socialfeed/lib/recommendationEngine.js";
import type * as plugins_socialfeed_lib_trendingAlgorithm from "../plugins/socialfeed/lib/trendingAlgorithm.js";
import type * as plugins_socialfeed_mutations from "../plugins/socialfeed/mutations.js";
import type * as plugins_socialfeed_queries from "../plugins/socialfeed/queries.js";
import type * as plugins_support_agent from "../plugins/support/agent.js";
import type * as plugins_support_helpers from "../plugins/support/helpers.js";
import type * as plugins_support_http from "../plugins/support/http.js";
import type * as plugins_support_internalQueries from "../plugins/support/internalQueries.js";
import type * as plugins_support_mutations from "../plugins/support/mutations.js";
import type * as plugins_support_openaiModels from "../plugins/support/openaiModels.js";
import type * as plugins_support_options from "../plugins/support/options.js";
import type * as plugins_support_posts_queries from "../plugins/support/posts/queries.js";
import type * as plugins_support_queries from "../plugins/support/queries.js";
import type * as plugins_support_rag from "../plugins/support/rag.js";
import type * as plugins_traderlaunchpad_actions from "../plugins/traderlaunchpad/actions.js";
import type * as plugins_traderlaunchpad_discord from "../plugins/traderlaunchpad/discord.js";
import type * as plugins_traderlaunchpad_discordSnapshots from "../plugins/traderlaunchpad/discordSnapshots.js";
import type * as plugins_traderlaunchpad_permissions from "../plugins/traderlaunchpad/permissions.js";
import type * as plugins_traderlaunchpad_polling from "../plugins/traderlaunchpad/polling.js";
import type * as plugins_traderlaunchpad_queries from "../plugins/traderlaunchpad/queries.js";
import type * as plugins_traderlaunchpad_roleQueries from "../plugins/traderlaunchpad/roleQueries.js";
import type * as plugins_traderlaunchpad_sync from "../plugins/traderlaunchpad/sync.js";
import type * as plugins_vimeo_actions from "../plugins/vimeo/actions.js";
import type * as plugins_vimeo_crons from "../plugins/vimeo/crons.js";
import type * as plugins_vimeo_internalMutations from "../plugins/vimeo/internalMutations.js";
import type * as plugins_vimeo_mutations from "../plugins/vimeo/mutations.js";
import type * as plugins_vimeo_queries from "../plugins/vimeo/queries.js";
import type * as plugins_vimeo_syncState from "../plugins/vimeo/syncState.js";
import type * as plugins_vimeo_workflow from "../plugins/vimeo/workflow.js";
import type * as presence from "../presence.js";
import type * as puckEditor_mutations from "../puckEditor/mutations.js";
import type * as puckEditor_queries from "../puckEditor/queries.js";
import type * as r2 from "../r2.js";
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
import type * as tasks_boards_mutations from "../tasks/boards/mutations.js";
import type * as tasks_boards_queries from "../tasks/boards/queries.js";
import type * as tasks_mutations from "../tasks/mutations.js";
import type * as tasks_queries from "../tasks/queries.js";
import type * as workflow from "../workflow.js";

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
  "auth/exchange": typeof auth_exchange;
  "auth/sessions": typeof auth_sessions;
  constants: typeof constants;
  "core/adminUiLayouts/mutations": typeof core_adminUiLayouts_mutations;
  "core/adminUiLayouts/queries": typeof core_adminUiLayouts_queries;
  "core/auditLog/queries": typeof core_auditLog_queries;
  "core/categories/mutations": typeof core_categories_mutations;
  "core/categories/queries": typeof core_categories_queries;
  "core/downloads/actions": typeof core_downloads_actions;
  "core/downloads/meta": typeof core_downloads_meta;
  "core/downloads/mutations": typeof core_downloads_mutations;
  "core/downloads/policy": typeof core_downloads_policy;
  "core/downloads/queries": typeof core_downloads_queries;
  "core/emails/reactEmail": typeof core_emails_reactEmail;
  "core/emails/reactEmailRender": typeof core_emails_reactEmailRender;
  "core/emails/render": typeof core_emails_render;
  "core/emails/service": typeof core_emails_service;
  "core/lib/auth": typeof core_lib_auth;
  "core/lib/index": typeof core_lib_index;
  "core/lib/permissions": typeof core_lib_permissions;
  "core/logs/queries": typeof core_logs_queries;
  "core/media/actions": typeof core_media_actions;
  "core/media/http": typeof core_media_http;
  "core/media/integration": typeof core_media_integration;
  "core/media/meta": typeof core_media_meta;
  "core/media/mutations": typeof core_media_mutations;
  "core/media/queries": typeof core_media_queries;
  "core/menus/mutations": typeof core_menus_mutations;
  "core/menus/queries": typeof core_menus_queries;
  "core/notifications/broadcasts": typeof core_notifications_broadcasts;
  "core/notifications/delivery/registerSinks": typeof core_notifications_delivery_registerSinks;
  "core/notifications/delivery/registry": typeof core_notifications_delivery_registry;
  "core/notifications/delivery/runSinks": typeof core_notifications_delivery_runSinks;
  "core/notifications/delivery/sinks/emailSink": typeof core_notifications_delivery_sinks_emailSink;
  "core/notifications/delivery/types": typeof core_notifications_delivery_types;
  "core/notifications/helpers": typeof core_notifications_helpers;
  "core/notifications/internal/dispatch": typeof core_notifications_internal_dispatch;
  "core/notifications/internal/testHelpers": typeof core_notifications_internal_testHelpers;
  "core/notifications/lib/formatters": typeof core_notifications_lib_formatters;
  "core/notifications/lib/index": typeof core_notifications_lib_index;
  "core/notifications/lib/preferences": typeof core_notifications_lib_preferences;
  "core/notifications/mutations": typeof core_notifications_mutations;
  "core/notifications/preferences": typeof core_notifications_preferences;
  "core/notifications/queries": typeof core_notifications_queries;
  "core/notifications/settings": typeof core_notifications_settings;
  "core/notifications/test": typeof core_notifications_test;
  "core/notifications/types": typeof core_notifications_types;
  "core/options": typeof core_options;
  "core/organizations/domains": typeof core_organizations_domains;
  "core/organizations/domainsInternal": typeof core_organizations_domainsInternal;
  "core/organizations/emailDomains": typeof core_organizations_emailDomains;
  "core/organizations/helpers": typeof core_organizations_helpers;
  "core/organizations/membershipsInternal": typeof core_organizations_membershipsInternal;
  "core/organizations/membershipsInternalQueries": typeof core_organizations_membershipsInternalQueries;
  "core/organizations/mutations": typeof core_organizations_mutations;
  "core/organizations/queries": typeof core_organizations_queries;
  "core/organizations/seed": typeof core_organizations_seed;
  "core/organizations/types": typeof core_organizations_types;
  "core/permissions/mutations": typeof core_permissions_mutations;
  "core/permissions/queries": typeof core_permissions_queries;
  "core/postTypes/lib/contentTypes": typeof core_postTypes_lib_contentTypes;
  "core/postTypes/migrations": typeof core_postTypes_migrations;
  "core/postTypes/mutations": typeof core_postTypes_mutations;
  "core/postTypes/queries": typeof core_postTypes_queries;
  "core/postTypes/types": typeof core_postTypes_types;
  "core/posts/mutations": typeof core_posts_mutations;
  "core/posts/postMeta": typeof core_posts_postMeta;
  "core/posts/queries": typeof core_posts_queries;
  "core/posts/templates": typeof core_posts_templates;
  "core/roles/queries": typeof core_roles_queries;
  "core/tags/mutations": typeof core_tags_mutations;
  "core/tags/queries": typeof core_tags_queries;
  "core/taxonomies/mutations": typeof core_taxonomies_mutations;
  "core/taxonomies/queries": typeof core_taxonomies_queries;
  "core/users/helpers": typeof core_users_helpers;
  "core/users/mutations": typeof core_users_mutations;
  "core/users/queries": typeof core_users_queries;
  "core/users/types": typeof core_users_types;
  "core/users": typeof core_users;
  crons: typeof crons;
  "dev/ffmpeg": typeof dev_ffmpeg;
  env: typeof env;
  http: typeof http;
  "integrations/connections/actions": typeof integrations_connections_actions;
  "integrations/connections/cryptoActions": typeof integrations_connections_cryptoActions;
  "integrations/connections/internalConnections": typeof integrations_connections_internalConnections;
  "integrations/connections/mutations": typeof integrations_connections_mutations;
  "integrations/connections/queries": typeof integrations_connections_queries;
  "integrations/hardcodedSeeds": typeof integrations_hardcodedSeeds;
  "integrations/importBasedSeeding": typeof integrations_importBasedSeeding;
  "integrations/init": typeof integrations_init;
  "integrations/integrationNodes/mutations": typeof integrations_integrationNodes_mutations;
  "integrations/integrationNodes/queries": typeof integrations_integrationNodes_queries;
  "integrations/integrationNodes/registry": typeof integrations_integrationNodes_registry;
  "integrations/integrationNodes/seed": typeof integrations_integrationNodes_seed;
  "integrations/lib/actionExecution": typeof integrations_lib_actionExecution;
  "integrations/lib/crypto": typeof integrations_lib_crypto;
  "integrations/lib/errors": typeof integrations_lib_errors;
  "integrations/lib/httpFetch": typeof integrations_lib_httpFetch;
  "integrations/lib/idempotency": typeof integrations_lib_idempotency;
  "integrations/lib/manifestDiscovery": typeof integrations_lib_manifestDiscovery;
  "integrations/lib/manifestTypes": typeof integrations_lib_manifestTypes;
  "integrations/lib/migrations": typeof integrations_lib_migrations;
  "integrations/lib/registries": typeof integrations_lib_registries;
  "integrations/lib/retry": typeof integrations_lib_retry;
  "integrations/lib/runManagement": typeof integrations_lib_runManagement;
  "integrations/lib/seedingUtils": typeof integrations_lib_seedingUtils;
  "integrations/manifestSeeding": typeof integrations_manifestSeeding;
  "integrations/triggers/orderEvents": typeof integrations_triggers_orderEvents;
  "integrations/triggers/registry": typeof integrations_triggers_registry;
  "lib/db": typeof lib_db;
  "lib/fileTypes": typeof lib_fileTypes;
  "lib/permissions/hasPermission": typeof lib_permissions_hasPermission;
  "lib/permissions/index": typeof lib_permissions_index;
  "lib/permissions/requirePermission": typeof lib_permissions_requirePermission;
  "lib/permissions/userAuth": typeof lib_permissions_userAuth;
  "lib/queryAnalyzer": typeof lib_queryAnalyzer;
  "lib/slugs": typeof lib_slugs;
  "migrations/portal": typeof migrations_portal;
  "plugins/calendar/crud": typeof plugins_calendar_crud;
  "plugins/calendar/events/crud": typeof plugins_calendar_events_crud;
  "plugins/calendar/events/orders": typeof plugins_calendar_events_orders;
  "plugins/calendar/events/queries": typeof plugins_calendar_events_queries;
  "plugins/calendar/helpers": typeof plugins_calendar_helpers;
  "plugins/calendar/queries": typeof plugins_calendar_queries;
  "plugins/commerce/cart/mutations": typeof plugins_commerce_cart_mutations;
  "plugins/commerce/cart/queries": typeof plugins_commerce_cart_queries;
  "plugins/commerce/chargebacks/evidence/mutations": typeof plugins_commerce_chargebacks_evidence_mutations;
  "plugins/commerce/chargebacks/evidence/queries": typeof plugins_commerce_chargebacks_evidence_queries;
  "plugins/commerce/checkout/actions": typeof plugins_commerce_checkout_actions;
  "plugins/commerce/checkout/mutations": typeof plugins_commerce_checkout_mutations;
  "plugins/commerce/discounts/mutations": typeof plugins_commerce_discounts_mutations;
  "plugins/commerce/discounts/queries": typeof plugins_commerce_discounts_queries;
  "plugins/commerce/funnelSteps/mutations": typeof plugins_commerce_funnelSteps_mutations;
  "plugins/commerce/funnelSteps/queries": typeof plugins_commerce_funnelSteps_queries;
  "plugins/commerce/funnels/mutations": typeof plugins_commerce_funnels_mutations;
  "plugins/commerce/funnels/queries": typeof plugins_commerce_funnels_queries;
  "plugins/commerce/mutations": typeof plugins_commerce_mutations;
  "plugins/commerce/orders/mutations": typeof plugins_commerce_orders_mutations;
  "plugins/commerce/orders/notes": typeof plugins_commerce_orders_notes;
  "plugins/commerce/orders/queries": typeof plugins_commerce_orders_queries;
  "plugins/commerce/orgPlans": typeof plugins_commerce_orgPlans;
  "plugins/commerce/payments/authorizenet/actions": typeof plugins_commerce_payments_authorizenet_actions;
  "plugins/commerce/products/queries": typeof plugins_commerce_products_queries;
  "plugins/commerce/queries": typeof plugins_commerce_queries;
  "plugins/commerce/subscriptions/actions": typeof plugins_commerce_subscriptions_actions;
  "plugins/commerce/subscriptions/queries": typeof plugins_commerce_subscriptions_queries;
  "plugins/commerce": typeof plugins_commerce;
  "plugins/crm/contacts/mutations": typeof plugins_crm_contacts_mutations;
  "plugins/crm/contacts/queries": typeof plugins_crm_contacts_queries;
  "plugins/crm/marketingTags/mutations": typeof plugins_crm_marketingTags_mutations;
  "plugins/crm/marketingTags/queries": typeof plugins_crm_marketingTags_queries;
  "plugins/disclaimers/actions": typeof plugins_disclaimers_actions;
  "plugins/disclaimers/mutations": typeof plugins_disclaimers_mutations;
  "plugins/disclaimers/posts/mutations": typeof plugins_disclaimers_posts_mutations;
  "plugins/disclaimers/posts/queries": typeof plugins_disclaimers_posts_queries;
  "plugins/disclaimers/queries": typeof plugins_disclaimers_queries;
  "plugins/discord/actions": typeof plugins_discord_actions;
  "plugins/discord/gateway": typeof plugins_discord_gateway;
  "plugins/discord/gatewayRateLimits": typeof plugins_discord_gatewayRateLimits;
  "plugins/discord/mutations": typeof plugins_discord_mutations;
  "plugins/discord/notificationsSink": typeof plugins_discord_notificationsSink;
  "plugins/discord/permissions": typeof plugins_discord_permissions;
  "plugins/discord/queries": typeof plugins_discord_queries;
  "plugins/discord/roleRules": typeof plugins_discord_roleRules;
  "plugins/discord/sync": typeof plugins_discord_sync;
  "plugins/entity/mutations": typeof plugins_entity_mutations;
  "plugins/entity/queries": typeof plugins_entity_queries;
  "plugins/entity/resolvers": typeof plugins_entity_resolvers;
  "plugins/entity/types": typeof plugins_entity_types;
  "plugins/lms/actions": typeof plugins_lms_actions;
  "plugins/lms/enrollments/mutations": typeof plugins_lms_enrollments_mutations;
  "plugins/lms/enrollments/queries": typeof plugins_lms_enrollments_queries;
  "plugins/lms/helpers": typeof plugins_lms_helpers;
  "plugins/lms/mutations": typeof plugins_lms_mutations;
  "plugins/lms/posts/mutations": typeof plugins_lms_posts_mutations;
  "plugins/lms/posts/queries": typeof plugins_lms_posts_queries;
  "plugins/lms/queries": typeof plugins_lms_queries;
  "plugins/onboarding/mutations": typeof plugins_onboarding_mutations;
  "plugins/onboarding/permissions": typeof plugins_onboarding_permissions;
  "plugins/onboarding/queries": typeof plugins_onboarding_queries;
  "plugins/socialfeed/crons": typeof plugins_socialfeed_crons;
  "plugins/socialfeed/lib/recommendationEngine": typeof plugins_socialfeed_lib_recommendationEngine;
  "plugins/socialfeed/lib/trendingAlgorithm": typeof plugins_socialfeed_lib_trendingAlgorithm;
  "plugins/socialfeed/mutations": typeof plugins_socialfeed_mutations;
  "plugins/socialfeed/queries": typeof plugins_socialfeed_queries;
  "plugins/support/agent": typeof plugins_support_agent;
  "plugins/support/helpers": typeof plugins_support_helpers;
  "plugins/support/http": typeof plugins_support_http;
  "plugins/support/internalQueries": typeof plugins_support_internalQueries;
  "plugins/support/mutations": typeof plugins_support_mutations;
  "plugins/support/openaiModels": typeof plugins_support_openaiModels;
  "plugins/support/options": typeof plugins_support_options;
  "plugins/support/posts/queries": typeof plugins_support_posts_queries;
  "plugins/support/queries": typeof plugins_support_queries;
  "plugins/support/rag": typeof plugins_support_rag;
  "plugins/traderlaunchpad/actions": typeof plugins_traderlaunchpad_actions;
  "plugins/traderlaunchpad/discord": typeof plugins_traderlaunchpad_discord;
  "plugins/traderlaunchpad/discordSnapshots": typeof plugins_traderlaunchpad_discordSnapshots;
  "plugins/traderlaunchpad/permissions": typeof plugins_traderlaunchpad_permissions;
  "plugins/traderlaunchpad/polling": typeof plugins_traderlaunchpad_polling;
  "plugins/traderlaunchpad/queries": typeof plugins_traderlaunchpad_queries;
  "plugins/traderlaunchpad/roleQueries": typeof plugins_traderlaunchpad_roleQueries;
  "plugins/traderlaunchpad/sync": typeof plugins_traderlaunchpad_sync;
  "plugins/vimeo/actions": typeof plugins_vimeo_actions;
  "plugins/vimeo/crons": typeof plugins_vimeo_crons;
  "plugins/vimeo/internalMutations": typeof plugins_vimeo_internalMutations;
  "plugins/vimeo/mutations": typeof plugins_vimeo_mutations;
  "plugins/vimeo/queries": typeof plugins_vimeo_queries;
  "plugins/vimeo/syncState": typeof plugins_vimeo_syncState;
  "plugins/vimeo/workflow": typeof plugins_vimeo_workflow;
  presence: typeof presence;
  "puckEditor/mutations": typeof puckEditor_mutations;
  "puckEditor/queries": typeof puckEditor_queries;
  r2: typeof r2;
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
  "tasks/boards/mutations": typeof tasks_boards_mutations;
  "tasks/boards/queries": typeof tasks_boards_queries;
  "tasks/mutations": typeof tasks_mutations;
  "tasks/queries": typeof tasks_queries;
  workflow: typeof workflow;
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
  agent: {
    apiKeys: {
      destroy: FunctionReference<
        "mutation",
        "internal",
        { apiKey?: string; name?: string },
        | "missing"
        | "deleted"
        | "name mismatch"
        | "must provide either apiKey or name"
      >;
      issue: FunctionReference<
        "mutation",
        "internal",
        { name?: string },
        string
      >;
      validate: FunctionReference<
        "query",
        "internal",
        { apiKey: string },
        boolean
      >;
    };
    files: {
      addFile: FunctionReference<
        "mutation",
        "internal",
        {
          filename?: string;
          hash: string;
          mimeType: string;
          storageId: string;
        },
        { fileId: string; storageId: string }
      >;
      copyFile: FunctionReference<
        "mutation",
        "internal",
        { fileId: string },
        null
      >;
      deleteFiles: FunctionReference<
        "mutation",
        "internal",
        { fileIds: Array<string>; force?: boolean },
        Array<string>
      >;
      get: FunctionReference<
        "query",
        "internal",
        { fileId: string },
        null | {
          _creationTime: number;
          _id: string;
          filename?: string;
          hash: string;
          lastTouchedAt: number;
          mimeType: string;
          refcount: number;
          storageId: string;
        }
      >;
      getFilesToDelete: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            filename?: string;
            hash: string;
            lastTouchedAt: number;
            mimeType: string;
            refcount: number;
            storageId: string;
          }>;
        }
      >;
      useExistingFile: FunctionReference<
        "mutation",
        "internal",
        { filename?: string; hash: string },
        null | { fileId: string; storageId: string }
      >;
    };
    messages: {
      addMessages: FunctionReference<
        "mutation",
        "internal",
        {
          agentName?: string;
          embeddings?: {
            dimension:
              | 128
              | 256
              | 512
              | 768
              | 1024
              | 1408
              | 1536
              | 2048
              | 3072
              | 4096;
            model: string;
            vectors: Array<Array<number> | null>;
          };
          failPendingSteps?: boolean;
          hideFromUserIdSearch?: boolean;
          messages: Array<{
            error?: string;
            fileIds?: Array<string>;
            finishReason?:
              | "stop"
              | "length"
              | "content-filter"
              | "tool-calls"
              | "error"
              | "other"
              | "unknown";
            message:
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            image: string | ArrayBuffer;
                            mimeType?: string;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "image";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mimeType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "user";
                }
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mimeType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            signature?: string;
                            text: string;
                            type: "reasoning";
                          }
                        | {
                            data: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "redacted-reasoning";
                          }
                        | {
                            args: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args?: any;
                            experimental_content?: Array<
                              | { text: string; type: "text" }
                              | {
                                  data: string;
                                  mimeType?: string;
                                  type: "image";
                                }
                            >;
                            isError?: boolean;
                            output?:
                              | { type: "text"; value: string }
                              | { type: "json"; value: any }
                              | { type: "error-text"; value: string }
                              | { type: "error-json"; value: any }
                              | {
                                  type: "content";
                                  value: Array<
                                    | { text: string; type: "text" }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        type: "media";
                                      }
                                  >;
                                };
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            result?: any;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-result";
                          }
                        | {
                            id: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "url";
                            title?: string;
                            type: "source";
                            url: string;
                          }
                        | {
                            filename?: string;
                            id: string;
                            mediaType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "document";
                            title: string;
                            type: "source";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "assistant";
                }
              | {
                  content: Array<{
                    args?: any;
                    experimental_content?: Array<
                      | { text: string; type: "text" }
                      | { data: string; mimeType?: string; type: "image" }
                    >;
                    isError?: boolean;
                    output?:
                      | { type: "text"; value: string }
                      | { type: "json"; value: any }
                      | { type: "error-text"; value: string }
                      | { type: "error-json"; value: any }
                      | {
                          type: "content";
                          value: Array<
                            | { text: string; type: "text" }
                            | { data: string; mediaType: string; type: "media" }
                          >;
                        };
                    providerExecuted?: boolean;
                    providerMetadata?: Record<string, Record<string, any>>;
                    providerOptions?: Record<string, Record<string, any>>;
                    result?: any;
                    toolCallId: string;
                    toolName: string;
                    type: "tool-result";
                  }>;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "tool";
                }
              | {
                  content: string;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "system";
                };
            model?: string;
            provider?: string;
            providerMetadata?: Record<string, Record<string, any>>;
            reasoning?: string;
            reasoningDetails?: Array<
              | {
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  signature?: string;
                  text: string;
                  type: "reasoning";
                }
              | { signature?: string; text: string; type: "text" }
              | { data: string; type: "redacted" }
            >;
            sources?: Array<
              | {
                  id: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "url";
                  title?: string;
                  type?: "source";
                  url: string;
                }
              | {
                  filename?: string;
                  id: string;
                  mediaType: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "document";
                  title: string;
                  type: "source";
                }
            >;
            status?: "pending" | "success" | "failed";
            text?: string;
            usage?: {
              cachedInputTokens?: number;
              completionTokens: number;
              promptTokens: number;
              reasoningTokens?: number;
              totalTokens: number;
            };
            warnings?: Array<
              | {
                  details?: string;
                  setting: string;
                  type: "unsupported-setting";
                }
              | { details?: string; tool: any; type: "unsupported-tool" }
              | { message: string; type: "other" }
            >;
          }>;
          pendingMessageId?: string;
          promptMessageId?: string;
          threadId: string;
          userId?: string;
        },
        {
          messages: Array<{
            _creationTime: number;
            _id: string;
            agentName?: string;
            embeddingId?: string;
            error?: string;
            fileIds?: Array<string>;
            finishReason?:
              | "stop"
              | "length"
              | "content-filter"
              | "tool-calls"
              | "error"
              | "other"
              | "unknown";
            id?: string;
            message?:
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            image: string | ArrayBuffer;
                            mimeType?: string;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "image";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mimeType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "user";
                }
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mimeType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            signature?: string;
                            text: string;
                            type: "reasoning";
                          }
                        | {
                            data: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "redacted-reasoning";
                          }
                        | {
                            args: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args?: any;
                            experimental_content?: Array<
                              | { text: string; type: "text" }
                              | {
                                  data: string;
                                  mimeType?: string;
                                  type: "image";
                                }
                            >;
                            isError?: boolean;
                            output?:
                              | { type: "text"; value: string }
                              | { type: "json"; value: any }
                              | { type: "error-text"; value: string }
                              | { type: "error-json"; value: any }
                              | {
                                  type: "content";
                                  value: Array<
                                    | { text: string; type: "text" }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        type: "media";
                                      }
                                  >;
                                };
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            result?: any;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-result";
                          }
                        | {
                            id: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "url";
                            title?: string;
                            type: "source";
                            url: string;
                          }
                        | {
                            filename?: string;
                            id: string;
                            mediaType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "document";
                            title: string;
                            type: "source";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "assistant";
                }
              | {
                  content: Array<{
                    args?: any;
                    experimental_content?: Array<
                      | { text: string; type: "text" }
                      | { data: string; mimeType?: string; type: "image" }
                    >;
                    isError?: boolean;
                    output?:
                      | { type: "text"; value: string }
                      | { type: "json"; value: any }
                      | { type: "error-text"; value: string }
                      | { type: "error-json"; value: any }
                      | {
                          type: "content";
                          value: Array<
                            | { text: string; type: "text" }
                            | { data: string; mediaType: string; type: "media" }
                          >;
                        };
                    providerExecuted?: boolean;
                    providerMetadata?: Record<string, Record<string, any>>;
                    providerOptions?: Record<string, Record<string, any>>;
                    result?: any;
                    toolCallId: string;
                    toolName: string;
                    type: "tool-result";
                  }>;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "tool";
                }
              | {
                  content: string;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "system";
                };
            model?: string;
            order: number;
            provider?: string;
            providerMetadata?: Record<string, Record<string, any>>;
            providerOptions?: Record<string, Record<string, any>>;
            reasoning?: string;
            reasoningDetails?: Array<
              | {
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  signature?: string;
                  text: string;
                  type: "reasoning";
                }
              | { signature?: string; text: string; type: "text" }
              | { data: string; type: "redacted" }
            >;
            sources?: Array<
              | {
                  id: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "url";
                  title?: string;
                  type?: "source";
                  url: string;
                }
              | {
                  filename?: string;
                  id: string;
                  mediaType: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "document";
                  title: string;
                  type: "source";
                }
            >;
            status: "pending" | "success" | "failed";
            stepOrder: number;
            text?: string;
            threadId: string;
            tool: boolean;
            usage?: {
              cachedInputTokens?: number;
              completionTokens: number;
              promptTokens: number;
              reasoningTokens?: number;
              totalTokens: number;
            };
            userId?: string;
            warnings?: Array<
              | {
                  details?: string;
                  setting: string;
                  type: "unsupported-setting";
                }
              | { details?: string; tool: any; type: "unsupported-tool" }
              | { message: string; type: "other" }
            >;
          }>;
        }
      >;
      cloneThread: FunctionReference<
        "action",
        "internal",
        {
          batchSize?: number;
          copyUserIdForVectorSearch?: boolean;
          excludeToolMessages?: boolean;
          insertAtOrder?: number;
          limit?: number;
          sourceThreadId: string;
          statuses?: Array<"pending" | "success" | "failed">;
          targetThreadId: string;
          upToAndIncludingMessageId?: string;
        },
        number
      >;
      deleteByIds: FunctionReference<
        "mutation",
        "internal",
        { messageIds: Array<string> },
        Array<string>
      >;
      deleteByOrder: FunctionReference<
        "mutation",
        "internal",
        {
          endOrder: number;
          endStepOrder?: number;
          startOrder: number;
          startStepOrder?: number;
          threadId: string;
        },
        { isDone: boolean; lastOrder?: number; lastStepOrder?: number }
      >;
      finalizeMessage: FunctionReference<
        "mutation",
        "internal",
        {
          messageId: string;
          result: { status: "success" } | { error: string; status: "failed" };
        },
        null
      >;
      getMessageSearchFields: FunctionReference<
        "query",
        "internal",
        { messageId: string },
        { embedding?: Array<number>; embeddingModel?: string; text?: string }
      >;
      getMessagesByIds: FunctionReference<
        "query",
        "internal",
        { messageIds: Array<string> },
        Array<null | {
          _creationTime: number;
          _id: string;
          agentName?: string;
          embeddingId?: string;
          error?: string;
          fileIds?: Array<string>;
          finishReason?:
            | "stop"
            | "length"
            | "content-filter"
            | "tool-calls"
            | "error"
            | "other"
            | "unknown";
          id?: string;
          message?:
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          image: string | ArrayBuffer;
                          mimeType?: string;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "image";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mimeType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "user";
              }
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mimeType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          signature?: string;
                          text: string;
                          type: "reasoning";
                        }
                      | {
                          data: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "redacted-reasoning";
                        }
                      | {
                          args: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args?: any;
                          experimental_content?: Array<
                            | { text: string; type: "text" }
                            | { data: string; mimeType?: string; type: "image" }
                          >;
                          isError?: boolean;
                          output?:
                            | { type: "text"; value: string }
                            | { type: "json"; value: any }
                            | { type: "error-text"; value: string }
                            | { type: "error-json"; value: any }
                            | {
                                type: "content";
                                value: Array<
                                  | { text: string; type: "text" }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      type: "media";
                                    }
                                >;
                              };
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          result?: any;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-result";
                        }
                      | {
                          id: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "url";
                          title?: string;
                          type: "source";
                          url: string;
                        }
                      | {
                          filename?: string;
                          id: string;
                          mediaType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "document";
                          title: string;
                          type: "source";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "assistant";
              }
            | {
                content: Array<{
                  args?: any;
                  experimental_content?: Array<
                    | { text: string; type: "text" }
                    | { data: string; mimeType?: string; type: "image" }
                  >;
                  isError?: boolean;
                  output?:
                    | { type: "text"; value: string }
                    | { type: "json"; value: any }
                    | { type: "error-text"; value: string }
                    | { type: "error-json"; value: any }
                    | {
                        type: "content";
                        value: Array<
                          | { text: string; type: "text" }
                          | { data: string; mediaType: string; type: "media" }
                        >;
                      };
                  providerExecuted?: boolean;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  result?: any;
                  toolCallId: string;
                  toolName: string;
                  type: "tool-result";
                }>;
                providerOptions?: Record<string, Record<string, any>>;
                role: "tool";
              }
            | {
                content: string;
                providerOptions?: Record<string, Record<string, any>>;
                role: "system";
              };
          model?: string;
          order: number;
          provider?: string;
          providerMetadata?: Record<string, Record<string, any>>;
          providerOptions?: Record<string, Record<string, any>>;
          reasoning?: string;
          reasoningDetails?: Array<
            | {
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                signature?: string;
                text: string;
                type: "reasoning";
              }
            | { signature?: string; text: string; type: "text" }
            | { data: string; type: "redacted" }
          >;
          sources?: Array<
            | {
                id: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "url";
                title?: string;
                type?: "source";
                url: string;
              }
            | {
                filename?: string;
                id: string;
                mediaType: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "document";
                title: string;
                type: "source";
              }
          >;
          status: "pending" | "success" | "failed";
          stepOrder: number;
          text?: string;
          threadId: string;
          tool: boolean;
          usage?: {
            cachedInputTokens?: number;
            completionTokens: number;
            promptTokens: number;
            reasoningTokens?: number;
            totalTokens: number;
          };
          userId?: string;
          warnings?: Array<
            | { details?: string; setting: string; type: "unsupported-setting" }
            | { details?: string; tool: any; type: "unsupported-tool" }
            | { message: string; type: "other" }
          >;
        }>
      >;
      listMessagesByThreadId: FunctionReference<
        "query",
        "internal",
        {
          excludeToolMessages?: boolean;
          order: "asc" | "desc";
          paginationOpts?: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          statuses?: Array<"pending" | "success" | "failed">;
          threadId: string;
          upToAndIncludingMessageId?: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            agentName?: string;
            embeddingId?: string;
            error?: string;
            fileIds?: Array<string>;
            finishReason?:
              | "stop"
              | "length"
              | "content-filter"
              | "tool-calls"
              | "error"
              | "other"
              | "unknown";
            id?: string;
            message?:
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            image: string | ArrayBuffer;
                            mimeType?: string;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "image";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mimeType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "user";
                }
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mimeType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            signature?: string;
                            text: string;
                            type: "reasoning";
                          }
                        | {
                            data: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "redacted-reasoning";
                          }
                        | {
                            args: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args?: any;
                            experimental_content?: Array<
                              | { text: string; type: "text" }
                              | {
                                  data: string;
                                  mimeType?: string;
                                  type: "image";
                                }
                            >;
                            isError?: boolean;
                            output?:
                              | { type: "text"; value: string }
                              | { type: "json"; value: any }
                              | { type: "error-text"; value: string }
                              | { type: "error-json"; value: any }
                              | {
                                  type: "content";
                                  value: Array<
                                    | { text: string; type: "text" }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        type: "media";
                                      }
                                  >;
                                };
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            result?: any;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-result";
                          }
                        | {
                            id: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "url";
                            title?: string;
                            type: "source";
                            url: string;
                          }
                        | {
                            filename?: string;
                            id: string;
                            mediaType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "document";
                            title: string;
                            type: "source";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "assistant";
                }
              | {
                  content: Array<{
                    args?: any;
                    experimental_content?: Array<
                      | { text: string; type: "text" }
                      | { data: string; mimeType?: string; type: "image" }
                    >;
                    isError?: boolean;
                    output?:
                      | { type: "text"; value: string }
                      | { type: "json"; value: any }
                      | { type: "error-text"; value: string }
                      | { type: "error-json"; value: any }
                      | {
                          type: "content";
                          value: Array<
                            | { text: string; type: "text" }
                            | { data: string; mediaType: string; type: "media" }
                          >;
                        };
                    providerExecuted?: boolean;
                    providerMetadata?: Record<string, Record<string, any>>;
                    providerOptions?: Record<string, Record<string, any>>;
                    result?: any;
                    toolCallId: string;
                    toolName: string;
                    type: "tool-result";
                  }>;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "tool";
                }
              | {
                  content: string;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "system";
                };
            model?: string;
            order: number;
            provider?: string;
            providerMetadata?: Record<string, Record<string, any>>;
            providerOptions?: Record<string, Record<string, any>>;
            reasoning?: string;
            reasoningDetails?: Array<
              | {
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  signature?: string;
                  text: string;
                  type: "reasoning";
                }
              | { signature?: string; text: string; type: "text" }
              | { data: string; type: "redacted" }
            >;
            sources?: Array<
              | {
                  id: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "url";
                  title?: string;
                  type?: "source";
                  url: string;
                }
              | {
                  filename?: string;
                  id: string;
                  mediaType: string;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  sourceType: "document";
                  title: string;
                  type: "source";
                }
            >;
            status: "pending" | "success" | "failed";
            stepOrder: number;
            text?: string;
            threadId: string;
            tool: boolean;
            usage?: {
              cachedInputTokens?: number;
              completionTokens: number;
              promptTokens: number;
              reasoningTokens?: number;
              totalTokens: number;
            };
            userId?: string;
            warnings?: Array<
              | {
                  details?: string;
                  setting: string;
                  type: "unsupported-setting";
                }
              | { details?: string; tool: any; type: "unsupported-tool" }
              | { message: string; type: "other" }
            >;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      searchMessages: FunctionReference<
        "action",
        "internal",
        {
          embedding?: Array<number>;
          embeddingModel?: string;
          limit: number;
          messageRange?: { after: number; before: number };
          searchAllMessagesForUserId?: string;
          targetMessageId?: string;
          text?: string;
          textSearch?: boolean;
          threadId?: string;
          vectorScoreThreshold?: number;
          vectorSearch?: boolean;
        },
        Array<{
          _creationTime: number;
          _id: string;
          agentName?: string;
          embeddingId?: string;
          error?: string;
          fileIds?: Array<string>;
          finishReason?:
            | "stop"
            | "length"
            | "content-filter"
            | "tool-calls"
            | "error"
            | "other"
            | "unknown";
          id?: string;
          message?:
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          image: string | ArrayBuffer;
                          mimeType?: string;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "image";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mimeType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "user";
              }
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mimeType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          signature?: string;
                          text: string;
                          type: "reasoning";
                        }
                      | {
                          data: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "redacted-reasoning";
                        }
                      | {
                          args: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args?: any;
                          experimental_content?: Array<
                            | { text: string; type: "text" }
                            | { data: string; mimeType?: string; type: "image" }
                          >;
                          isError?: boolean;
                          output?:
                            | { type: "text"; value: string }
                            | { type: "json"; value: any }
                            | { type: "error-text"; value: string }
                            | { type: "error-json"; value: any }
                            | {
                                type: "content";
                                value: Array<
                                  | { text: string; type: "text" }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      type: "media";
                                    }
                                >;
                              };
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          result?: any;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-result";
                        }
                      | {
                          id: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "url";
                          title?: string;
                          type: "source";
                          url: string;
                        }
                      | {
                          filename?: string;
                          id: string;
                          mediaType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "document";
                          title: string;
                          type: "source";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "assistant";
              }
            | {
                content: Array<{
                  args?: any;
                  experimental_content?: Array<
                    | { text: string; type: "text" }
                    | { data: string; mimeType?: string; type: "image" }
                  >;
                  isError?: boolean;
                  output?:
                    | { type: "text"; value: string }
                    | { type: "json"; value: any }
                    | { type: "error-text"; value: string }
                    | { type: "error-json"; value: any }
                    | {
                        type: "content";
                        value: Array<
                          | { text: string; type: "text" }
                          | { data: string; mediaType: string; type: "media" }
                        >;
                      };
                  providerExecuted?: boolean;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  result?: any;
                  toolCallId: string;
                  toolName: string;
                  type: "tool-result";
                }>;
                providerOptions?: Record<string, Record<string, any>>;
                role: "tool";
              }
            | {
                content: string;
                providerOptions?: Record<string, Record<string, any>>;
                role: "system";
              };
          model?: string;
          order: number;
          provider?: string;
          providerMetadata?: Record<string, Record<string, any>>;
          providerOptions?: Record<string, Record<string, any>>;
          reasoning?: string;
          reasoningDetails?: Array<
            | {
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                signature?: string;
                text: string;
                type: "reasoning";
              }
            | { signature?: string; text: string; type: "text" }
            | { data: string; type: "redacted" }
          >;
          sources?: Array<
            | {
                id: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "url";
                title?: string;
                type?: "source";
                url: string;
              }
            | {
                filename?: string;
                id: string;
                mediaType: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "document";
                title: string;
                type: "source";
              }
          >;
          status: "pending" | "success" | "failed";
          stepOrder: number;
          text?: string;
          threadId: string;
          tool: boolean;
          usage?: {
            cachedInputTokens?: number;
            completionTokens: number;
            promptTokens: number;
            reasoningTokens?: number;
            totalTokens: number;
          };
          userId?: string;
          warnings?: Array<
            | { details?: string; setting: string; type: "unsupported-setting" }
            | { details?: string; tool: any; type: "unsupported-tool" }
            | { message: string; type: "other" }
          >;
        }>
      >;
      textSearch: FunctionReference<
        "query",
        "internal",
        {
          limit: number;
          searchAllMessagesForUserId?: string;
          targetMessageId?: string;
          text?: string;
          threadId?: string;
        },
        Array<{
          _creationTime: number;
          _id: string;
          agentName?: string;
          embeddingId?: string;
          error?: string;
          fileIds?: Array<string>;
          finishReason?:
            | "stop"
            | "length"
            | "content-filter"
            | "tool-calls"
            | "error"
            | "other"
            | "unknown";
          id?: string;
          message?:
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          image: string | ArrayBuffer;
                          mimeType?: string;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "image";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mimeType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "user";
              }
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mimeType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          signature?: string;
                          text: string;
                          type: "reasoning";
                        }
                      | {
                          data: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "redacted-reasoning";
                        }
                      | {
                          args: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args?: any;
                          experimental_content?: Array<
                            | { text: string; type: "text" }
                            | { data: string; mimeType?: string; type: "image" }
                          >;
                          isError?: boolean;
                          output?:
                            | { type: "text"; value: string }
                            | { type: "json"; value: any }
                            | { type: "error-text"; value: string }
                            | { type: "error-json"; value: any }
                            | {
                                type: "content";
                                value: Array<
                                  | { text: string; type: "text" }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      type: "media";
                                    }
                                >;
                              };
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          result?: any;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-result";
                        }
                      | {
                          id: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "url";
                          title?: string;
                          type: "source";
                          url: string;
                        }
                      | {
                          filename?: string;
                          id: string;
                          mediaType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "document";
                          title: string;
                          type: "source";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "assistant";
              }
            | {
                content: Array<{
                  args?: any;
                  experimental_content?: Array<
                    | { text: string; type: "text" }
                    | { data: string; mimeType?: string; type: "image" }
                  >;
                  isError?: boolean;
                  output?:
                    | { type: "text"; value: string }
                    | { type: "json"; value: any }
                    | { type: "error-text"; value: string }
                    | { type: "error-json"; value: any }
                    | {
                        type: "content";
                        value: Array<
                          | { text: string; type: "text" }
                          | { data: string; mediaType: string; type: "media" }
                        >;
                      };
                  providerExecuted?: boolean;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  result?: any;
                  toolCallId: string;
                  toolName: string;
                  type: "tool-result";
                }>;
                providerOptions?: Record<string, Record<string, any>>;
                role: "tool";
              }
            | {
                content: string;
                providerOptions?: Record<string, Record<string, any>>;
                role: "system";
              };
          model?: string;
          order: number;
          provider?: string;
          providerMetadata?: Record<string, Record<string, any>>;
          providerOptions?: Record<string, Record<string, any>>;
          reasoning?: string;
          reasoningDetails?: Array<
            | {
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                signature?: string;
                text: string;
                type: "reasoning";
              }
            | { signature?: string; text: string; type: "text" }
            | { data: string; type: "redacted" }
          >;
          sources?: Array<
            | {
                id: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "url";
                title?: string;
                type?: "source";
                url: string;
              }
            | {
                filename?: string;
                id: string;
                mediaType: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "document";
                title: string;
                type: "source";
              }
          >;
          status: "pending" | "success" | "failed";
          stepOrder: number;
          text?: string;
          threadId: string;
          tool: boolean;
          usage?: {
            cachedInputTokens?: number;
            completionTokens: number;
            promptTokens: number;
            reasoningTokens?: number;
            totalTokens: number;
          };
          userId?: string;
          warnings?: Array<
            | { details?: string; setting: string; type: "unsupported-setting" }
            | { details?: string; tool: any; type: "unsupported-tool" }
            | { message: string; type: "other" }
          >;
        }>
      >;
      updateMessage: FunctionReference<
        "mutation",
        "internal",
        {
          messageId: string;
          patch: {
            error?: string;
            fileIds?: Array<string>;
            finishReason?:
              | "stop"
              | "length"
              | "content-filter"
              | "tool-calls"
              | "error"
              | "other"
              | "unknown";
            message?:
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            image: string | ArrayBuffer;
                            mimeType?: string;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "image";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mimeType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "user";
                }
              | {
                  content:
                    | string
                    | Array<
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            text: string;
                            type: "text";
                          }
                        | {
                            data: string | ArrayBuffer;
                            filename?: string;
                            mimeType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "file";
                          }
                        | {
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            signature?: string;
                            text: string;
                            type: "reasoning";
                          }
                        | {
                            data: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            type: "redacted-reasoning";
                          }
                        | {
                            args: any;
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-call";
                          }
                        | {
                            args?: any;
                            experimental_content?: Array<
                              | { text: string; type: "text" }
                              | {
                                  data: string;
                                  mimeType?: string;
                                  type: "image";
                                }
                            >;
                            isError?: boolean;
                            output?:
                              | { type: "text"; value: string }
                              | { type: "json"; value: any }
                              | { type: "error-text"; value: string }
                              | { type: "error-json"; value: any }
                              | {
                                  type: "content";
                                  value: Array<
                                    | { text: string; type: "text" }
                                    | {
                                        data: string;
                                        mediaType: string;
                                        type: "media";
                                      }
                                  >;
                                };
                            providerExecuted?: boolean;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            result?: any;
                            toolCallId: string;
                            toolName: string;
                            type: "tool-result";
                          }
                        | {
                            id: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "url";
                            title?: string;
                            type: "source";
                            url: string;
                          }
                        | {
                            filename?: string;
                            id: string;
                            mediaType: string;
                            providerMetadata?: Record<
                              string,
                              Record<string, any>
                            >;
                            providerOptions?: Record<
                              string,
                              Record<string, any>
                            >;
                            sourceType: "document";
                            title: string;
                            type: "source";
                          }
                      >;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "assistant";
                }
              | {
                  content: Array<{
                    args?: any;
                    experimental_content?: Array<
                      | { text: string; type: "text" }
                      | { data: string; mimeType?: string; type: "image" }
                    >;
                    isError?: boolean;
                    output?:
                      | { type: "text"; value: string }
                      | { type: "json"; value: any }
                      | { type: "error-text"; value: string }
                      | { type: "error-json"; value: any }
                      | {
                          type: "content";
                          value: Array<
                            | { text: string; type: "text" }
                            | { data: string; mediaType: string; type: "media" }
                          >;
                        };
                    providerExecuted?: boolean;
                    providerMetadata?: Record<string, Record<string, any>>;
                    providerOptions?: Record<string, Record<string, any>>;
                    result?: any;
                    toolCallId: string;
                    toolName: string;
                    type: "tool-result";
                  }>;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "tool";
                }
              | {
                  content: string;
                  providerOptions?: Record<string, Record<string, any>>;
                  role: "system";
                };
            model?: string;
            provider?: string;
            providerOptions?: Record<string, Record<string, any>>;
            status?: "pending" | "success" | "failed";
          };
        },
        {
          _creationTime: number;
          _id: string;
          agentName?: string;
          embeddingId?: string;
          error?: string;
          fileIds?: Array<string>;
          finishReason?:
            | "stop"
            | "length"
            | "content-filter"
            | "tool-calls"
            | "error"
            | "other"
            | "unknown";
          id?: string;
          message?:
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          image: string | ArrayBuffer;
                          mimeType?: string;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "image";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mimeType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "user";
              }
            | {
                content:
                  | string
                  | Array<
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          text: string;
                          type: "text";
                        }
                      | {
                          data: string | ArrayBuffer;
                          filename?: string;
                          mimeType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "file";
                        }
                      | {
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          signature?: string;
                          text: string;
                          type: "reasoning";
                        }
                      | {
                          data: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          type: "redacted-reasoning";
                        }
                      | {
                          args: any;
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-call";
                        }
                      | {
                          args?: any;
                          experimental_content?: Array<
                            | { text: string; type: "text" }
                            | { data: string; mimeType?: string; type: "image" }
                          >;
                          isError?: boolean;
                          output?:
                            | { type: "text"; value: string }
                            | { type: "json"; value: any }
                            | { type: "error-text"; value: string }
                            | { type: "error-json"; value: any }
                            | {
                                type: "content";
                                value: Array<
                                  | { text: string; type: "text" }
                                  | {
                                      data: string;
                                      mediaType: string;
                                      type: "media";
                                    }
                                >;
                              };
                          providerExecuted?: boolean;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          result?: any;
                          toolCallId: string;
                          toolName: string;
                          type: "tool-result";
                        }
                      | {
                          id: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "url";
                          title?: string;
                          type: "source";
                          url: string;
                        }
                      | {
                          filename?: string;
                          id: string;
                          mediaType: string;
                          providerMetadata?: Record<
                            string,
                            Record<string, any>
                          >;
                          providerOptions?: Record<string, Record<string, any>>;
                          sourceType: "document";
                          title: string;
                          type: "source";
                        }
                    >;
                providerOptions?: Record<string, Record<string, any>>;
                role: "assistant";
              }
            | {
                content: Array<{
                  args?: any;
                  experimental_content?: Array<
                    | { text: string; type: "text" }
                    | { data: string; mimeType?: string; type: "image" }
                  >;
                  isError?: boolean;
                  output?:
                    | { type: "text"; value: string }
                    | { type: "json"; value: any }
                    | { type: "error-text"; value: string }
                    | { type: "error-json"; value: any }
                    | {
                        type: "content";
                        value: Array<
                          | { text: string; type: "text" }
                          | { data: string; mediaType: string; type: "media" }
                        >;
                      };
                  providerExecuted?: boolean;
                  providerMetadata?: Record<string, Record<string, any>>;
                  providerOptions?: Record<string, Record<string, any>>;
                  result?: any;
                  toolCallId: string;
                  toolName: string;
                  type: "tool-result";
                }>;
                providerOptions?: Record<string, Record<string, any>>;
                role: "tool";
              }
            | {
                content: string;
                providerOptions?: Record<string, Record<string, any>>;
                role: "system";
              };
          model?: string;
          order: number;
          provider?: string;
          providerMetadata?: Record<string, Record<string, any>>;
          providerOptions?: Record<string, Record<string, any>>;
          reasoning?: string;
          reasoningDetails?: Array<
            | {
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                signature?: string;
                text: string;
                type: "reasoning";
              }
            | { signature?: string; text: string; type: "text" }
            | { data: string; type: "redacted" }
          >;
          sources?: Array<
            | {
                id: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "url";
                title?: string;
                type?: "source";
                url: string;
              }
            | {
                filename?: string;
                id: string;
                mediaType: string;
                providerMetadata?: Record<string, Record<string, any>>;
                providerOptions?: Record<string, Record<string, any>>;
                sourceType: "document";
                title: string;
                type: "source";
              }
          >;
          status: "pending" | "success" | "failed";
          stepOrder: number;
          text?: string;
          threadId: string;
          tool: boolean;
          usage?: {
            cachedInputTokens?: number;
            completionTokens: number;
            promptTokens: number;
            reasoningTokens?: number;
            totalTokens: number;
          };
          userId?: string;
          warnings?: Array<
            | { details?: string; setting: string; type: "unsupported-setting" }
            | { details?: string; tool: any; type: "unsupported-tool" }
            | { message: string; type: "other" }
          >;
        }
      >;
    };
    streams: {
      abort: FunctionReference<
        "mutation",
        "internal",
        {
          finalDelta?: {
            end: number;
            parts: Array<any>;
            start: number;
            streamId: string;
          };
          reason: string;
          streamId: string;
        },
        boolean
      >;
      abortByOrder: FunctionReference<
        "mutation",
        "internal",
        { order: number; reason: string; threadId: string },
        boolean
      >;
      addDelta: FunctionReference<
        "mutation",
        "internal",
        { end: number; parts: Array<any>; start: number; streamId: string },
        boolean
      >;
      create: FunctionReference<
        "mutation",
        "internal",
        {
          agentName?: string;
          format?: "UIMessageChunk" | "TextStreamPart";
          model?: string;
          order: number;
          provider?: string;
          providerOptions?: Record<string, Record<string, any>>;
          stepOrder: number;
          threadId: string;
          userId?: string;
        },
        string
      >;
      deleteAllStreamsForThreadIdAsync: FunctionReference<
        "mutation",
        "internal",
        { deltaCursor?: string; streamOrder?: number; threadId: string },
        { deltaCursor?: string; isDone: boolean; streamOrder?: number }
      >;
      deleteAllStreamsForThreadIdSync: FunctionReference<
        "action",
        "internal",
        { threadId: string },
        null
      >;
      deleteStreamAsync: FunctionReference<
        "mutation",
        "internal",
        { cursor?: string; streamId: string },
        null
      >;
      deleteStreamSync: FunctionReference<
        "mutation",
        "internal",
        { streamId: string },
        null
      >;
      finish: FunctionReference<
        "mutation",
        "internal",
        {
          finalDelta?: {
            end: number;
            parts: Array<any>;
            start: number;
            streamId: string;
          };
          streamId: string;
        },
        null
      >;
      heartbeat: FunctionReference<
        "mutation",
        "internal",
        { streamId: string },
        null
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          startOrder?: number;
          statuses?: Array<"streaming" | "finished" | "aborted">;
          threadId: string;
        },
        Array<{
          agentName?: string;
          format?: "UIMessageChunk" | "TextStreamPart";
          model?: string;
          order: number;
          provider?: string;
          providerOptions?: Record<string, Record<string, any>>;
          status: "streaming" | "finished" | "aborted";
          stepOrder: number;
          streamId: string;
          userId?: string;
        }>
      >;
      listDeltas: FunctionReference<
        "query",
        "internal",
        {
          cursors: Array<{ cursor: number; streamId: string }>;
          threadId: string;
        },
        Array<{
          end: number;
          parts: Array<any>;
          start: number;
          streamId: string;
        }>
      >;
    };
    threads: {
      createThread: FunctionReference<
        "mutation",
        "internal",
        {
          defaultSystemPrompt?: string;
          parentThreadIds?: Array<string>;
          summary?: string;
          title?: string;
          userId?: string;
        },
        {
          _creationTime: number;
          _id: string;
          status: "active" | "archived";
          summary?: string;
          title?: string;
          userId?: string;
        }
      >;
      deleteAllForThreadIdAsync: FunctionReference<
        "mutation",
        "internal",
        {
          cursor?: string;
          deltaCursor?: string;
          limit?: number;
          messagesDone?: boolean;
          streamOrder?: number;
          streamsDone?: boolean;
          threadId: string;
        },
        { isDone: boolean }
      >;
      deleteAllForThreadIdSync: FunctionReference<
        "action",
        "internal",
        { limit?: number; threadId: string },
        null
      >;
      getThread: FunctionReference<
        "query",
        "internal",
        { threadId: string },
        {
          _creationTime: number;
          _id: string;
          status: "active" | "archived";
          summary?: string;
          title?: string;
          userId?: string;
        } | null
      >;
      listThreadsByUserId: FunctionReference<
        "query",
        "internal",
        {
          order?: "asc" | "desc";
          paginationOpts?: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          userId?: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            status: "active" | "archived";
            summary?: string;
            title?: string;
            userId?: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      searchThreadTitles: FunctionReference<
        "query",
        "internal",
        { limit: number; query: string; userId?: string | null },
        Array<{
          _creationTime: number;
          _id: string;
          status: "active" | "archived";
          summary?: string;
          title?: string;
          userId?: string;
        }>
      >;
      updateThread: FunctionReference<
        "mutation",
        "internal",
        {
          patch: {
            status?: "active" | "archived";
            summary?: string;
            title?: string;
            userId?: string;
          };
          threadId: string;
        },
        {
          _creationTime: number;
          _id: string;
          status: "active" | "archived";
          summary?: string;
          title?: string;
          userId?: string;
        }
      >;
    };
    users: {
      deleteAllForUserId: FunctionReference<
        "action",
        "internal",
        { userId: string },
        null
      >;
      deleteAllForUserIdAsync: FunctionReference<
        "mutation",
        "internal",
        { userId: string },
        boolean
      >;
      listUsersWithThreads: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<string>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
    };
    vector: {
      index: {
        deleteBatch: FunctionReference<
          "mutation",
          "internal",
          {
            ids: Array<
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
            >;
          },
          null
        >;
        deleteBatchForThread: FunctionReference<
          "mutation",
          "internal",
          {
            cursor?: string;
            limit: number;
            model: string;
            threadId: string;
            vectorDimension:
              | 128
              | 256
              | 512
              | 768
              | 1024
              | 1408
              | 1536
              | 2048
              | 3072
              | 4096;
          },
          { continueCursor: string; isDone: boolean }
        >;
        insertBatch: FunctionReference<
          "mutation",
          "internal",
          {
            vectorDimension:
              | 128
              | 256
              | 512
              | 768
              | 1024
              | 1408
              | 1536
              | 2048
              | 3072
              | 4096;
            vectors: Array<{
              messageId?: string;
              model: string;
              table: string;
              threadId?: string;
              userId?: string;
              vector: Array<number>;
            }>;
          },
          Array<
            | string
            | string
            | string
            | string
            | string
            | string
            | string
            | string
            | string
            | string
          >
        >;
        paginate: FunctionReference<
          "query",
          "internal",
          {
            cursor?: string;
            limit: number;
            table?: string;
            targetModel: string;
            vectorDimension:
              | 128
              | 256
              | 512
              | 768
              | 1024
              | 1408
              | 1536
              | 2048
              | 3072
              | 4096;
          },
          {
            continueCursor: string;
            ids: Array<
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
              | string
            >;
            isDone: boolean;
          }
        >;
        updateBatch: FunctionReference<
          "mutation",
          "internal",
          {
            vectors: Array<{
              id:
                | string
                | string
                | string
                | string
                | string
                | string
                | string
                | string
                | string
                | string;
              model: string;
              vector: Array<number>;
            }>;
          },
          null
        >;
      };
    };
  };
  presence: {
    public: {
      disconnect: FunctionReference<
        "mutation",
        "internal",
        { sessionToken: string },
        null
      >;
      heartbeat: FunctionReference<
        "mutation",
        "internal",
        {
          interval?: number;
          roomId: string;
          sessionId: string;
          userId: string;
        },
        { roomToken: string; sessionToken: string }
      >;
      list: FunctionReference<
        "query",
        "internal",
        { limit?: number; roomToken: string },
        Array<{
          data?: any;
          lastDisconnected: number;
          online: boolean;
          userId: string;
        }>
      >;
      listRoom: FunctionReference<
        "query",
        "internal",
        { limit?: number; onlineOnly?: boolean; roomId: string },
        Array<{ lastDisconnected: number; online: boolean; userId: string }>
      >;
      listUser: FunctionReference<
        "query",
        "internal",
        { limit?: number; onlineOnly?: boolean; userId: string },
        Array<{ lastDisconnected: number; online: boolean; roomId: string }>
      >;
      removeRoom: FunctionReference<
        "mutation",
        "internal",
        { roomId: string },
        null
      >;
      removeRoomUser: FunctionReference<
        "mutation",
        "internal",
        { roomId: string; userId: string },
        null
      >;
      updateRoomUser: FunctionReference<
        "mutation",
        "internal",
        { data?: any; roomId: string; userId: string },
        null
      >;
    };
  };
  rag: {
    chunks: {
      insert: FunctionReference<
        "mutation",
        "internal",
        {
          chunks: Array<{
            content: { metadata?: Record<string, any>; text: string };
            embedding: Array<number>;
            searchableText?: string;
          }>;
          entryId: string;
          startOrder: number;
        },
        { status: "pending" | "ready" | "replaced" }
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          entryId: string;
          order: "desc" | "asc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            metadata?: Record<string, any>;
            order: number;
            state: "pending" | "ready" | "replaced";
            text: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      replaceChunksPage: FunctionReference<
        "mutation",
        "internal",
        { entryId: string; startOrder: number },
        { nextStartOrder: number; status: "pending" | "ready" | "replaced" }
      >;
    };
    entries: {
      add: FunctionReference<
        "mutation",
        "internal",
        {
          allChunks?: Array<{
            content: { metadata?: Record<string, any>; text: string };
            embedding: Array<number>;
            searchableText?: string;
          }>;
          entry: {
            contentHash?: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            namespaceId: string;
            title?: string;
          };
          onComplete?: string;
        },
        {
          created: boolean;
          entryId: string;
          status: "pending" | "ready" | "replaced";
        }
      >;
      addAsync: FunctionReference<
        "mutation",
        "internal",
        {
          chunker: string;
          entry: {
            contentHash?: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            namespaceId: string;
            title?: string;
          };
          onComplete?: string;
        },
        { created: boolean; entryId: string; status: "pending" | "ready" }
      >;
      deleteAsync: FunctionReference<
        "mutation",
        "internal",
        { entryId: string; startOrder: number },
        null
      >;
      deleteByKeyAsync: FunctionReference<
        "mutation",
        "internal",
        { beforeVersion?: number; key: string; namespaceId: string },
        null
      >;
      deleteByKeySync: FunctionReference<
        "action",
        "internal",
        { key: string; namespaceId: string },
        null
      >;
      deleteSync: FunctionReference<
        "action",
        "internal",
        { entryId: string },
        null
      >;
      findByContentHash: FunctionReference<
        "query",
        "internal",
        {
          contentHash: string;
          dimension: number;
          filterNames: Array<string>;
          key: string;
          modelId: string;
          namespace: string;
        },
        {
          contentHash?: string;
          entryId: string;
          filterValues: Array<{ name: string; value: any }>;
          importance: number;
          key?: string;
          metadata?: Record<string, any>;
          replacedAt?: number;
          status: "pending" | "ready" | "replaced";
          title?: string;
        } | null
      >;
      get: FunctionReference<
        "query",
        "internal",
        { entryId: string },
        {
          contentHash?: string;
          entryId: string;
          filterValues: Array<{ name: string; value: any }>;
          importance: number;
          key?: string;
          metadata?: Record<string, any>;
          replacedAt?: number;
          status: "pending" | "ready" | "replaced";
          title?: string;
        } | null
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          namespaceId?: string;
          order?: "desc" | "asc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          status: "pending" | "ready" | "replaced";
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            contentHash?: string;
            entryId: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            replacedAt?: number;
            status: "pending" | "ready" | "replaced";
            title?: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      promoteToReady: FunctionReference<
        "mutation",
        "internal",
        { entryId: string },
        {
          replacedEntry: {
            contentHash?: string;
            entryId: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            replacedAt?: number;
            status: "pending" | "ready" | "replaced";
            title?: string;
          } | null;
        }
      >;
    };
    namespaces: {
      deleteNamespace: FunctionReference<
        "mutation",
        "internal",
        { namespaceId: string },
        {
          deletedNamespace: null | {
            createdAt: number;
            dimension: number;
            filterNames: Array<string>;
            modelId: string;
            namespace: string;
            namespaceId: string;
            status: "pending" | "ready" | "replaced";
            version: number;
          };
        }
      >;
      deleteNamespaceSync: FunctionReference<
        "action",
        "internal",
        { namespaceId: string },
        null
      >;
      get: FunctionReference<
        "query",
        "internal",
        {
          dimension: number;
          filterNames: Array<string>;
          modelId: string;
          namespace: string;
        },
        null | {
          createdAt: number;
          dimension: number;
          filterNames: Array<string>;
          modelId: string;
          namespace: string;
          namespaceId: string;
          status: "pending" | "ready" | "replaced";
          version: number;
        }
      >;
      getOrCreate: FunctionReference<
        "mutation",
        "internal",
        {
          dimension: number;
          filterNames: Array<string>;
          modelId: string;
          namespace: string;
          onComplete?: string;
          status: "pending" | "ready";
        },
        { namespaceId: string; status: "pending" | "ready" }
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          status: "pending" | "ready" | "replaced";
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            createdAt: number;
            dimension: number;
            filterNames: Array<string>;
            modelId: string;
            namespace: string;
            namespaceId: string;
            status: "pending" | "ready" | "replaced";
            version: number;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      listNamespaceVersions: FunctionReference<
        "query",
        "internal",
        {
          namespace: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            createdAt: number;
            dimension: number;
            filterNames: Array<string>;
            modelId: string;
            namespace: string;
            namespaceId: string;
            status: "pending" | "ready" | "replaced";
            version: number;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      lookup: FunctionReference<
        "query",
        "internal",
        {
          dimension: number;
          filterNames: Array<string>;
          modelId: string;
          namespace: string;
        },
        null | string
      >;
      promoteToReady: FunctionReference<
        "mutation",
        "internal",
        { namespaceId: string },
        {
          replacedNamespace: null | {
            createdAt: number;
            dimension: number;
            filterNames: Array<string>;
            modelId: string;
            namespace: string;
            namespaceId: string;
            status: "pending" | "ready" | "replaced";
            version: number;
          };
        }
      >;
    };
    search: {
      search: FunctionReference<
        "action",
        "internal",
        {
          chunkContext?: { after: number; before: number };
          embedding: Array<number>;
          filters: Array<{ name: string; value: any }>;
          limit: number;
          modelId: string;
          namespace: string;
          vectorScoreThreshold?: number;
        },
        {
          entries: Array<{
            contentHash?: string;
            entryId: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            replacedAt?: number;
            status: "pending" | "ready" | "replaced";
            title?: string;
          }>;
          results: Array<{
            content: Array<{ metadata?: Record<string, any>; text: string }>;
            entryId: string;
            order: number;
            score: number;
            startOrder: number;
          }>;
        }
      >;
    };
  };
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
  workflow: {
    event: {
      create: FunctionReference<
        "mutation",
        "internal",
        { name: string; workflowId: string },
        string
      >;
      send: FunctionReference<
        "mutation",
        "internal",
        {
          eventId?: string;
          name?: string;
          result:
            | { kind: "success"; returnValue: any }
            | { error: string; kind: "failed" }
            | { kind: "canceled" };
          workflowId?: string;
          workpoolOptions?: {
            defaultRetryBehavior?: {
              base: number;
              initialBackoffMs: number;
              maxAttempts: number;
            };
            logLevel?: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
            maxParallelism?: number;
            retryActionsByDefault?: boolean;
          };
        },
        string
      >;
    };
    journal: {
      load: FunctionReference<
        "query",
        "internal",
        { shortCircuit?: boolean; workflowId: string },
        {
          blocked?: boolean;
          journalEntries: Array<{
            _creationTime: number;
            _id: string;
            step:
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  functionType: "query" | "mutation" | "action";
                  handle: string;
                  inProgress: boolean;
                  kind?: "function";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  handle: string;
                  inProgress: boolean;
                  kind: "workflow";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workflowId?: string;
                }
              | {
                  args: { eventId?: string };
                  argsSize: number;
                  completedAt?: number;
                  eventId?: string;
                  inProgress: boolean;
                  kind: "event";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                };
            stepNumber: number;
            workflowId: string;
          }>;
          logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
          ok: boolean;
          workflow: {
            _creationTime: number;
            _id: string;
            args: any;
            generationNumber: number;
            logLevel?: any;
            name?: string;
            onComplete?: { context?: any; fnHandle: string };
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            startedAt?: any;
            state?: any;
            workflowHandle: string;
          };
        }
      >;
      startSteps: FunctionReference<
        "mutation",
        "internal",
        {
          generationNumber: number;
          steps: Array<{
            retry?:
              | boolean
              | { base: number; initialBackoffMs: number; maxAttempts: number };
            schedulerOptions?: { runAt?: number } | { runAfter?: number };
            step:
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  functionType: "query" | "mutation" | "action";
                  handle: string;
                  inProgress: boolean;
                  kind?: "function";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  handle: string;
                  inProgress: boolean;
                  kind: "workflow";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workflowId?: string;
                }
              | {
                  args: { eventId?: string };
                  argsSize: number;
                  completedAt?: number;
                  eventId?: string;
                  inProgress: boolean;
                  kind: "event";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                };
          }>;
          workflowId: string;
          workpoolOptions?: {
            defaultRetryBehavior?: {
              base: number;
              initialBackoffMs: number;
              maxAttempts: number;
            };
            logLevel?: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
            maxParallelism?: number;
            retryActionsByDefault?: boolean;
          };
        },
        Array<{
          _creationTime: number;
          _id: string;
          step:
            | {
                args: any;
                argsSize: number;
                completedAt?: number;
                functionType: "query" | "mutation" | "action";
                handle: string;
                inProgress: boolean;
                kind?: "function";
                name: string;
                runResult?:
                  | { kind: "success"; returnValue: any }
                  | { error: string; kind: "failed" }
                  | { kind: "canceled" };
                startedAt: number;
                workId?: string;
              }
            | {
                args: any;
                argsSize: number;
                completedAt?: number;
                handle: string;
                inProgress: boolean;
                kind: "workflow";
                name: string;
                runResult?:
                  | { kind: "success"; returnValue: any }
                  | { error: string; kind: "failed" }
                  | { kind: "canceled" };
                startedAt: number;
                workflowId?: string;
              }
            | {
                args: { eventId?: string };
                argsSize: number;
                completedAt?: number;
                eventId?: string;
                inProgress: boolean;
                kind: "event";
                name: string;
                runResult?:
                  | { kind: "success"; returnValue: any }
                  | { error: string; kind: "failed" }
                  | { kind: "canceled" };
                startedAt: number;
              };
          stepNumber: number;
          workflowId: string;
        }>
      >;
    };
    workflow: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { workflowId: string },
        null
      >;
      cleanup: FunctionReference<
        "mutation",
        "internal",
        { workflowId: string },
        boolean
      >;
      complete: FunctionReference<
        "mutation",
        "internal",
        {
          generationNumber: number;
          runResult:
            | { kind: "success"; returnValue: any }
            | { error: string; kind: "failed" }
            | { kind: "canceled" };
          workflowId: string;
        },
        null
      >;
      create: FunctionReference<
        "mutation",
        "internal",
        {
          maxParallelism?: number;
          onComplete?: { context?: any; fnHandle: string };
          startAsync?: boolean;
          workflowArgs: any;
          workflowHandle: string;
          workflowName: string;
        },
        string
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { workflowId: string },
        {
          inProgress: Array<{
            _creationTime: number;
            _id: string;
            step:
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  functionType: "query" | "mutation" | "action";
                  handle: string;
                  inProgress: boolean;
                  kind?: "function";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  handle: string;
                  inProgress: boolean;
                  kind: "workflow";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workflowId?: string;
                }
              | {
                  args: { eventId?: string };
                  argsSize: number;
                  completedAt?: number;
                  eventId?: string;
                  inProgress: boolean;
                  kind: "event";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                };
            stepNumber: number;
            workflowId: string;
          }>;
          logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
          workflow: {
            _creationTime: number;
            _id: string;
            args: any;
            generationNumber: number;
            logLevel?: any;
            name?: string;
            onComplete?: { context?: any; fnHandle: string };
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            startedAt?: any;
            state?: any;
            workflowHandle: string;
          };
        }
      >;
      listSteps: FunctionReference<
        "query",
        "internal",
        {
          order: "asc" | "desc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          workflowId: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            args: any;
            completedAt?: number;
            eventId?: string;
            kind: "function" | "workflow" | "event";
            name: string;
            nestedWorkflowId?: string;
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            startedAt: number;
            stepId: string;
            stepNumber: number;
            workId?: string;
            workflowId: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
    };
  };
  r2: {
    lib: {
      deleteMetadata: FunctionReference<
        "mutation",
        "internal",
        { bucket: string; key: string },
        null
      >;
      deleteObject: FunctionReference<
        "mutation",
        "internal",
        {
          accessKeyId: string;
          bucket: string;
          endpoint: string;
          key: string;
          secretAccessKey: string;
        },
        null
      >;
      deleteR2Object: FunctionReference<
        "action",
        "internal",
        {
          accessKeyId: string;
          bucket: string;
          endpoint: string;
          key: string;
          secretAccessKey: string;
        },
        null
      >;
      getMetadata: FunctionReference<
        "query",
        "internal",
        {
          accessKeyId: string;
          bucket: string;
          endpoint: string;
          key: string;
          secretAccessKey: string;
        },
        {
          bucket: string;
          bucketLink: string;
          contentType?: string;
          key: string;
          lastModified: string;
          link: string;
          sha256?: string;
          size?: number;
          url: string;
        } | null
      >;
      listMetadata: FunctionReference<
        "query",
        "internal",
        {
          accessKeyId: string;
          bucket: string;
          cursor?: string;
          endpoint: string;
          limit?: number;
          secretAccessKey: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            bucket: string;
            bucketLink: string;
            contentType?: string;
            key: string;
            lastModified: string;
            link: string;
            sha256?: string;
            size?: number;
            url: string;
          }>;
          pageStatus?: null | "SplitRecommended" | "SplitRequired";
          splitCursor?: null | string;
        }
      >;
      store: FunctionReference<
        "action",
        "internal",
        {
          accessKeyId: string;
          bucket: string;
          endpoint: string;
          secretAccessKey: string;
          url: string;
        },
        any
      >;
      syncMetadata: FunctionReference<
        "action",
        "internal",
        {
          accessKeyId: string;
          bucket: string;
          endpoint: string;
          key: string;
          onComplete?: string;
          secretAccessKey: string;
        },
        null
      >;
      upsertMetadata: FunctionReference<
        "mutation",
        "internal",
        {
          bucket: string;
          contentType?: string;
          key: string;
          lastModified: string;
          link: string;
          sha256?: string;
          size?: number;
        },
        { isNew: boolean }
      >;
    };
  };
  rateLimiter: {
    lib: {
      checkRateLimit: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
      getValue: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          key?: string;
          name: string;
          sampleShards?: number;
        },
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          shard: number;
          ts: number;
          value: number;
        }
      >;
      rateLimit: FunctionReference<
        "mutation",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      resetRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key?: string; name: string },
        null
      >;
    };
    time: {
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
    };
  };
  launchthat_support: {
    mutations: {
      addConversationNote: FunctionReference<
        "mutation",
        "internal",
        {
          actorId?: string;
          actorName?: string;
          note: string;
          organizationId: string;
          sessionId?: string;
          threadId?: string;
        },
        null
      >;
      appendConversationEvent: FunctionReference<
        "mutation",
        "internal",
        {
          actorId?: string;
          actorName?: string;
          eventType: string;
          organizationId: string;
          payload?: any;
          sessionId?: string;
          threadId?: string;
        },
        null
      >;
      assignConversation: FunctionReference<
        "mutation",
        "internal",
        {
          actorId?: string;
          actorName?: string;
          assignedAgentId: string;
          assignedAgentName?: string;
          organizationId: string;
          sessionId?: string;
          threadId?: string;
        },
        null
      >;
      createSupportPost: FunctionReference<
        "mutation",
        "internal",
        {
          authorId?: string;
          content?: string;
          excerpt?: string;
          meta?: Array<{
            key: string;
            value?: string | number | boolean | null;
          }>;
          organizationId: string;
          parentId?: string;
          parentTypeSlug?: string;
          postTypeSlug: string;
          slug: string;
          status: "published" | "draft" | "archived";
          tags?: Array<string>;
          title: string;
        },
        any
      >;
      deleteRagSourceConfig: FunctionReference<
        "mutation",
        "internal",
        { organizationId: string; sourceId: string },
        null
      >;
      rateLimitOrThrow: FunctionReference<
        "mutation",
        "internal",
        { key: string; limit: number; windowMs: number },
        null
      >;
      recordMessageIndexUpdate: FunctionReference<
        "mutation",
        "internal",
        {
          contactEmail?: string;
          contactId?: string;
          contactName?: string;
          mode?: "agent" | "manual";
          organizationId: string;
          role: "user" | "assistant";
          sessionId: string;
          snippet: string;
          threadId: string;
        },
        null
      >;
      saveRagSourceConfig: FunctionReference<
        "mutation",
        "internal",
        {
          additionalMetaKeys?: string;
          baseInstructions?: string;
          displayName?: string;
          fields?: Array<string>;
          includeTags?: boolean;
          isEnabled?: boolean;
          metaFieldKeys?: Array<string>;
          organizationId: string;
          postTypeSlug: string;
          sourceId?: string;
          sourceType?: "postType" | "lmsPostType";
          useCustomBaseInstructions?: boolean;
        },
        { ragSourceId: string }
      >;
      setAgentPresence: FunctionReference<
        "mutation",
        "internal",
        {
          agentName?: string;
          agentUserId: string;
          organizationId: string;
          sessionId?: string;
          status: "typing" | "idle";
          threadId?: string;
        },
        null
      >;
      setConversationMode: FunctionReference<
        "mutation",
        "internal",
        {
          actorId?: string;
          actorName?: string;
          mode: "agent" | "manual";
          organizationId: string;
          sessionId?: string;
          threadId?: string;
        },
        null
      >;
      setConversationStatus: FunctionReference<
        "mutation",
        "internal",
        {
          actorId?: string;
          actorName?: string;
          organizationId: string;
          sessionId?: string;
          status: "open" | "snoozed" | "closed";
          threadId?: string;
        },
        null
      >;
      touchRagSourceIndexedAt: FunctionReference<
        "mutation",
        "internal",
        { sourceId: string },
        null
      >;
      unassignConversation: FunctionReference<
        "mutation",
        "internal",
        {
          actorId?: string;
          actorName?: string;
          organizationId: string;
          sessionId?: string;
          threadId?: string;
        },
        null
      >;
      updateSupportPost: FunctionReference<
        "mutation",
        "internal",
        {
          authorId?: string;
          content?: string;
          excerpt?: string;
          id: string;
          meta?: Array<{
            key: string;
            value?: string | number | boolean | null;
          }>;
          organizationId: string;
          parentId?: string;
          parentTypeSlug?: string;
          postTypeSlug: string;
          slug: string;
          status: "published" | "draft" | "archived";
          tags?: Array<string>;
          title: string;
        },
        any
      >;
      upsertConversationIndex: FunctionReference<
        "mutation",
        "internal",
        {
          agentThreadId?: string;
          assignedAgentId?: string;
          assignedAgentName?: string;
          contactEmail?: string;
          contactId?: string;
          contactName?: string;
          emailThreadId?: string;
          firstMessageAt?: number;
          inboundAlias?: string;
          lastMessageAt?: number;
          lastMessageAuthor?: "user" | "assistant";
          lastMessageSnippet?: string;
          mode?: "agent" | "manual";
          organizationId: string;
          origin: "chat" | "email";
          sessionId: string;
          status?: "open" | "snoozed" | "closed";
          subject?: string;
          totalMessages?: number;
        },
        null
      >;
      upsertRagIndexStatus: FunctionReference<
        "mutation",
        "internal",
        {
          entryKey: string;
          lastAttemptAt: number;
          lastEntryId?: string;
          lastEntryStatus?: "pending" | "ready" | "replaced";
          lastError?: string;
          lastStatus: string;
          lastSuccessAt?: number;
          organizationId: string;
          postId: string;
          postTypeSlug: string;
          sourceType: "postType" | "lmsPostType";
        },
        null
      >;
      upsertSupportOption: FunctionReference<
        "mutation",
        "internal",
        {
          key: string;
          organizationId: string;
          value?: string | number | boolean | null;
        },
        any
      >;
      upsertSupportPostMeta: FunctionReference<
        "mutation",
        "internal",
        {
          entries: Array<{
            key: string;
            value?: string | number | boolean | null;
          }>;
          organizationId: string;
          postId: string;
        },
        any
      >;
    };
    posts: {
      mutations: {
        createPost: FunctionReference<
          "mutation",
          "internal",
          {
            category?: string;
            content?: string;
            excerpt?: string;
            featuredImage?: string;
            meta?: Record<string, string | number | boolean | null>;
            organizationId?: string;
            postTypeSlug: string;
            slug: string;
            status: "published" | "draft" | "archived";
            tags?: Array<string>;
            title: string;
          },
          string
        >;
        deletePost: FunctionReference<
          "mutation",
          "internal",
          { id: string },
          null
        >;
        updatePost: FunctionReference<
          "mutation",
          "internal",
          {
            category?: string;
            content?: string;
            excerpt?: string;
            featuredImage?: string;
            id: string;
            meta?: Record<string, string | number | boolean | null>;
            organizationId?: string;
            slug?: string;
            status?: "published" | "draft" | "archived";
            tags?: Array<string>;
            title?: string;
          },
          null
        >;
      };
      queries: {
        getAllPosts: FunctionReference<
          "query",
          "internal",
          {
            filters?: {
              authorId?: string;
              category?: string;
              limit?: number;
              postTypeSlug?: string;
              status?: "published" | "draft" | "archived";
            };
            organizationId?: string;
          },
          any
        >;
        getPostById: FunctionReference<
          "query",
          "internal",
          { id: string; organizationId?: string },
          any
        >;
        getPostBySlug: FunctionReference<
          "query",
          "internal",
          { organizationId?: string; slug: string },
          any
        >;
        getPostMeta: FunctionReference<
          "query",
          "internal",
          { organizationId?: string; postId: string },
          any
        >;
      };
    };
    queries: {
      getAgentPresence: FunctionReference<
        "query",
        "internal",
        { organizationId: string; sessionId?: string; threadId?: string },
        any
      >;
      getConversationIndex: FunctionReference<
        "query",
        "internal",
        { organizationId: string; sessionId?: string; threadId?: string },
        any
      >;
      getConversationMode: FunctionReference<
        "query",
        "internal",
        { organizationId: string; sessionId?: string; threadId?: string },
        any
      >;
      getRagIndexStatusForPost: FunctionReference<
        "query",
        "internal",
        { organizationId: string; postId: string; postTypeSlug: string },
        any
      >;
      getRagSourceConfigForPostType: FunctionReference<
        "query",
        "internal",
        { organizationId: string; postTypeSlug: string },
        any
      >;
      getRagSourceForPostType: FunctionReference<
        "query",
        "internal",
        {
          organizationId: string;
          postTypeSlug: string;
          sourceType: "postType" | "lmsPostType";
        },
        any
      >;
      getRagSourceForPostTypeAny: FunctionReference<
        "query",
        "internal",
        { organizationId: string; postTypeSlug: string },
        any
      >;
      getSupportOption: FunctionReference<
        "query",
        "internal",
        { key: string; organizationId: string },
        any
      >;
      getSupportPostById: FunctionReference<
        "query",
        "internal",
        { id: string; organizationId?: string },
        any
      >;
      getSupportPostMeta: FunctionReference<
        "query",
        "internal",
        { organizationId?: string; postId: string },
        any
      >;
      listConversationEvents: FunctionReference<
        "query",
        "internal",
        { organizationId: string; sessionId?: string; threadId?: string },
        any
      >;
      listConversationNotes: FunctionReference<
        "query",
        "internal",
        { organizationId: string; sessionId?: string; threadId?: string },
        any
      >;
      listConversations: FunctionReference<
        "query",
        "internal",
        { limit?: number; organizationId: string },
        any
      >;
      listRagSources: FunctionReference<
        "query",
        "internal",
        { organizationId: string },
        any
      >;
      listSupportOptions: FunctionReference<
        "query",
        "internal",
        { organizationId: string },
        any
      >;
      listSupportPosts: FunctionReference<
        "query",
        "internal",
        {
          filters?: {
            limit?: number;
            parentId?: string;
            postTypeSlug?: string;
            status?: "published" | "draft" | "archived";
          };
          organizationId: string;
        },
        any
      >;
    };
  };
  launchthat_socialfeed: {
    mutations: {
      addComment: FunctionReference<
        "mutation",
        "internal",
        {
          content: string;
          feedItemId?: string;
          mediaUrls?: Array<string>;
          parentCommentId?: string;
          parentId?: string;
          parentType?:
            | "feedItem"
            | "course"
            | "lesson"
            | "topic"
            | "quiz"
            | "post"
            | "download"
            | "helpdeskArticle";
          userId: string;
        },
        string
      >;
      addReaction: FunctionReference<
        "mutation",
        "internal",
        {
          feedItemId: string;
          reactionType:
            | "like"
            | "love"
            | "celebrate"
            | "support"
            | "insightful"
            | "curious";
          userId: string;
        },
        string
      >;
      createOrUpdateTopic: FunctionReference<
        "mutation",
        "internal",
        {
          category?: string;
          coverImage?: string;
          description?: string;
          tag: string;
        },
        string
      >;
      createPost: FunctionReference<
        "mutation",
        "internal",
        {
          content: string;
          creatorId: string;
          mediaUrls?: Array<string>;
          moduleId?: string;
          moduleType?: "blog" | "course" | "group" | "event";
          visibility: "public" | "private" | "group";
        },
        string
      >;
      deleteComment: FunctionReference<
        "mutation",
        "internal",
        { asAdmin?: boolean; commentId: string; userId: string },
        boolean
      >;
      deletePost: FunctionReference<
        "mutation",
        "internal",
        { postId: string; userId: string },
        boolean
      >;
      followTopic: FunctionReference<
        "mutation",
        "internal",
        { topicId: string; userId: string },
        boolean
      >;
      generateUserRecommendations: FunctionReference<
        "mutation",
        "internal",
        { limit?: number; userId: string },
        boolean
      >;
      markRecommendationAsInteracted: FunctionReference<
        "mutation",
        "internal",
        {
          contentId: string;
          reaction?: "like" | "dislike" | "neutral";
          userId: string;
        },
        boolean
      >;
      markRecommendationAsSeen: FunctionReference<
        "mutation",
        "internal",
        { contentId: string; userId: string },
        boolean
      >;
      shareContent: FunctionReference<
        "mutation",
        "internal",
        {
          content?: string;
          creatorId: string;
          moduleId?: string;
          moduleType?: "blog" | "course" | "group" | "event";
          originalContentId: string;
          visibility: "public" | "private" | "group";
        },
        string
      >;
      unfollowTopic: FunctionReference<
        "mutation",
        "internal",
        { topicId: string; userId: string },
        boolean
      >;
      updateComment: FunctionReference<
        "mutation",
        "internal",
        {
          asAdmin?: boolean;
          commentId: string;
          content: string;
          userId: string;
        },
        boolean
      >;
      updatePost: FunctionReference<
        "mutation",
        "internal",
        {
          content?: string;
          mediaUrls?: Array<string>;
          postId: string;
          userId: string;
          visibility?: "public" | "private" | "group";
        },
        boolean
      >;
      updatePostTrendingMetrics: FunctionReference<
        "mutation",
        "internal",
        { contentId: string },
        boolean
      >;
    };
    queries: {
      checkTopicFollow: FunctionReference<
        "query",
        "internal",
        { topicId: string; userId: string },
        boolean
      >;
      getAllCommentsForParent: FunctionReference<
        "query",
        "internal",
        {
          parentId: string;
          parentType:
            | "feedItem"
            | "course"
            | "lesson"
            | "topic"
            | "quiz"
            | "post"
            | "download"
            | "helpdeskArticle";
        },
        Array<{
          _creationTime: number;
          _id: string;
          content: string;
          hashtags?: Array<string>;
          mediaUrls?: Array<string>;
          mentionedUserIds?: Array<string>;
          mentions?: Array<string>;
          parentCommentId?: string;
          parentId: string;
          parentType:
            | "feedItem"
            | "course"
            | "lesson"
            | "topic"
            | "quiz"
            | "post"
            | "download"
            | "helpdeskArticle";
          updatedAt?: number;
          userId: string;
        }>
      >;
      getComments: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          parentId: string;
          parentType: "feedItem" | "post" | "download" | "helpdeskArticle";
          sortOrder?: "newest" | "oldest";
        },
        {
          continueCursor: string | null;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            content: string;
            hashtags?: Array<string>;
            mediaUrls?: Array<string>;
            mentionedUserIds?: Array<string>;
            mentions?: Array<string>;
            parentCommentId?: string;
            parentId: string;
            parentType:
              | "feedItem"
              | "course"
              | "lesson"
              | "topic"
              | "quiz"
              | "post"
              | "download"
              | "helpdeskArticle";
            repliesCount: number;
            updatedAt?: number;
            user: { _id: string; image?: string; name: string };
            userId: string;
          }>;
        }
      >;
      getFeedItem: FunctionReference<
        "query",
        "internal",
        { feedItemId: string },
        null | {
          _creationTime: number;
          _id: string;
          commentsCount: number;
          content: string;
          contentType: "post" | "share" | "comment";
          creator: { _id: string; image?: string; name: string };
          creatorId: string;
          hashtags?: Array<string>;
          mediaUrls?: Array<string>;
          mentionedUserIds?: Array<string>;
          mentions?: Array<string>;
          moduleId?: string;
          moduleType?: "blog" | "course" | "group" | "event";
          originalContentId?: string;
          reactionsCount: number;
          visibility: "public" | "private" | "group";
        }
      >;
      getGroupFeed: FunctionReference<
        "query",
        "internal",
        {
          groupId: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string | null;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            commentsCount: number;
            content: string;
            contentType: "post" | "share" | "comment";
            creator: { _id: string; image?: string; name: string };
            creatorId: string;
            hashtags?: Array<string>;
            mediaUrls?: Array<string>;
            mentionedUserIds?: Array<string>;
            mentions?: Array<string>;
            moduleId?: string;
            moduleType?: "blog" | "course" | "group" | "event";
            originalContentId?: string;
            reactionsCount: number;
            visibility: "public" | "private" | "group";
          }>;
        }
      >;
      getHashtagFeed: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          tag: string;
        },
        {
          feedItems: {
            continueCursor: string | null;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              commentsCount: number;
              content: string;
              contentType: "post" | "share" | "comment";
              creator: { _id: string; image?: string; name: string };
              creatorId: string;
              hashtags?: Array<string>;
              mediaUrls?: Array<string>;
              mentionedUserIds?: Array<string>;
              mentions?: Array<string>;
              moduleId?: string;
              moduleType?: "blog" | "course" | "group" | "event";
              originalContentId?: string;
              reactionsCount: number;
              visibility: "public" | "private" | "group";
            }>;
          };
          hashtag: null | {
            _creationTime: number;
            _id: string;
            category?: string;
            coverImage?: string;
            description?: string;
            followerCount?: number;
            isBlocked?: boolean;
            isTopic?: boolean;
            lastUsed: number;
            relatedTags?: Array<string>;
            tag: string;
            usageCount: number;
          };
        }
      >;
      getPersonalizedFeed: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          userId: string;
        },
        {
          continueCursor: string | null;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            commentsCount: number;
            content: string;
            contentType: "post" | "share" | "comment";
            creator: { _id: string; image?: string; name: string };
            creatorId: string;
            hashtags?: Array<string>;
            mediaUrls?: Array<string>;
            mentionedUserIds?: Array<string>;
            mentions?: Array<string>;
            moduleId?: string;
            moduleType?: "blog" | "course" | "group" | "event";
            originalContentId?: string;
            reactionsCount: number;
            visibility: "public" | "private" | "group";
          }>;
        }
      >;
      getRecommendedContent: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          userId: string;
        },
        {
          continueCursor: string | null;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            commentsCount: number;
            content: string;
            contentType: "post" | "share" | "comment";
            creator: { _id: string; image?: string; name: string };
            creatorId: string;
            hashtags?: Array<string>;
            mediaUrls?: Array<string>;
            mentionedUserIds?: Array<string>;
            mentions?: Array<string>;
            moduleId?: string;
            moduleType?: "blog" | "course" | "group" | "event";
            originalContentId?: string;
            reactionsCount: number;
            visibility: "public" | "private" | "group";
          }>;
        }
      >;
      getRecommendedHashtags: FunctionReference<
        "query",
        "internal",
        { limit: number; userId: string },
        Array<{
          _creationTime: number;
          _id: string;
          category?: string;
          coverImage?: string;
          description?: string;
          followerCount?: number;
          isBlocked?: boolean;
          isTopic?: boolean;
          lastUsed: number;
          relatedTags?: Array<string>;
          tag: string;
          usageCount: number;
        }>
      >;
      getReplies: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          parentCommentId: string;
        },
        {
          continueCursor: string | null;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            content: string;
            hashtags?: Array<string>;
            mediaUrls?: Array<string>;
            mentionedUserIds?: Array<string>;
            mentions?: Array<string>;
            parentCommentId?: string;
            parentId: string;
            parentType:
              | "feedItem"
              | "course"
              | "lesson"
              | "topic"
              | "quiz"
              | "post"
              | "download"
              | "helpdeskArticle";
            repliesCount: number;
            updatedAt?: number;
            user: { _id: string; image?: string; name: string };
            userId: string;
          }>;
        }
      >;
      getTopic: FunctionReference<
        "query",
        "internal",
        { topicId: string },
        {
          _creationTime: number;
          _id: string;
          category?: string;
          coverImage?: string;
          description?: string;
          followerCount?: number;
          isBlocked?: boolean;
          isTopic?: boolean;
          lastUsed: number;
          relatedTags?: Array<string>;
          tag: string;
          usageCount: number;
        } | null
      >;
      getTopicSuggestions: FunctionReference<
        "query",
        "internal",
        { limit?: number; userId: string },
        Array<{
          _creationTime: number;
          _id: string;
          category?: string;
          coverImage?: string;
          description?: string;
          followerCount?: number;
          isBlocked?: boolean;
          isTopic?: boolean;
          lastUsed: number;
          relatedTags?: Array<string>;
          tag: string;
          usageCount: number;
        }>
      >;
      getTopics: FunctionReference<
        "query",
        "internal",
        {
          category?: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          query?: string;
        },
        Array<{
          _creationTime: number;
          _id: string;
          category?: string;
          coverImage?: string;
          description?: string;
          followerCount?: number;
          isBlocked?: boolean;
          isTopic?: boolean;
          lastUsed: number;
          relatedTags?: Array<string>;
          tag: string;
          usageCount: number;
        }>
      >;
      getUniversalFeed: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string | null;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            commentsCount: number;
            content: string;
            contentType: "post" | "share" | "comment";
            creator: { _id: string; image?: string; name: string };
            creatorId: string;
            hashtags?: Array<string>;
            mediaUrls?: Array<string>;
            mentionedUserIds?: Array<string>;
            mentions?: Array<string>;
            moduleId?: string;
            moduleType?: "blog" | "course" | "group" | "event";
            originalContentId?: string;
            reactionsCount: number;
            visibility: "public" | "private" | "group";
          }>;
        }
      >;
      getUserFollowedTopics: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          userId: string;
        },
        Array<{
          _creationTime: number;
          _id: string;
          category?: string;
          coverImage?: string;
          description?: string;
          followerCount?: number;
          isBlocked?: boolean;
          isTopic?: boolean;
          lastUsed: number;
          relatedTags?: Array<string>;
          tag: string;
          usageCount: number;
        }>
      >;
      getUserProfileFeed: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          profileId: string;
          viewerId?: string;
        },
        {
          continueCursor: string | null;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            commentsCount: number;
            content: string;
            contentType: "post" | "share" | "comment";
            creator: { _id: string; image?: string; name: string };
            creatorId: string;
            hashtags?: Array<string>;
            mediaUrls?: Array<string>;
            mentionedUserIds?: Array<string>;
            mentions?: Array<string>;
            moduleId?: string;
            moduleType?: "blog" | "course" | "group" | "event";
            originalContentId?: string;
            reactionsCount: number;
            visibility: "public" | "private" | "group";
          }>;
        }
      >;
      searchUsersForMentions: FunctionReference<
        "query",
        "internal",
        { limit?: number; query: string },
        Array<{ _id: string; image?: string; name: string }>
      >;
    };
  };
  launchthat_lms: {
    enrollments: {
      mutations: {
        revokeEnrollment: FunctionReference<
          "mutation",
          "internal",
          { courseId: string; userId: string },
          null
        >;
        upsertEnrollment: FunctionReference<
          "mutation",
          "internal",
          {
            courseId: string;
            organizationId?: string;
            source: "manual" | "crm_tag" | "purchase";
            status: "active" | "revoked";
            userId: string;
          },
          null
        >;
      };
      queries: {
        getEnrollment: FunctionReference<
          "query",
          "internal",
          { courseId: string; userId: string },
          null | any
        >;
        listEnrollmentsForCourse: FunctionReference<
          "query",
          "internal",
          { courseId: string },
          any
        >;
        listEnrollmentsForUser: FunctionReference<
          "query",
          "internal",
          { userId: string },
          any
        >;
      };
    };
    posts: {
      mutations: {
        bulkUpdatePostStatus: FunctionReference<
          "mutation",
          "internal",
          { ids: Array<string>; status: "published" | "draft" | "archived" },
          Array<string>
        >;
        createPost: FunctionReference<
          "mutation",
          "internal",
          {
            category?: string;
            content?: string;
            excerpt?: string;
            featuredImage?: string;
            meta?: Record<string, string | number | boolean | null>;
            organizationId?: string;
            postTypeSlug: string;
            slug: string;
            status: "published" | "draft" | "archived";
            tags?: Array<string>;
            title: string;
          },
          string
        >;
        deletePost: FunctionReference<
          "mutation",
          "internal",
          { id: string },
          null
        >;
        deletePostMetaKey: FunctionReference<
          "mutation",
          "internal",
          { key: string; postId: string },
          null
        >;
        updatePost: FunctionReference<
          "mutation",
          "internal",
          {
            category?: string;
            content?: string;
            excerpt?: string;
            featuredImage?: string;
            id: string;
            meta?: Record<string, string | number | boolean | null>;
            organizationId?: string;
            slug?: string;
            status?: "published" | "draft" | "archived";
            tags?: Array<string>;
            title?: string;
          },
          string
        >;
        updatePostStatus: FunctionReference<
          "mutation",
          "internal",
          { id: string; status: "published" | "draft" | "archived" },
          string
        >;
      };
      queries: {
        getAllPosts: FunctionReference<
          "query",
          "internal",
          {
            filters?: {
              authorId?: string;
              category?: string;
              limit?: number;
              postTypeSlug?: string;
              status?: "published" | "draft" | "archived";
            };
            organizationId?: string;
          },
          any
        >;
        getPostById: FunctionReference<
          "query",
          "internal",
          { id: string; organizationId?: string },
          any
        >;
        getPostByIdInternal: FunctionReference<
          "query",
          "internal",
          { id: string },
          any
        >;
        getPostBySlug: FunctionReference<
          "query",
          "internal",
          { organizationId?: string; slug: string },
          any
        >;
        getPostCategories: FunctionReference<
          "query",
          "internal",
          { organizationId?: string; postTypeSlug?: string },
          any
        >;
        getPostMeta: FunctionReference<
          "query",
          "internal",
          { organizationId?: string; postId: string },
          any
        >;
        getPostMetaInternal: FunctionReference<
          "query",
          "internal",
          { postId: string },
          any
        >;
        getPostTags: FunctionReference<
          "query",
          "internal",
          { organizationId?: string; postTypeSlug?: string },
          any
        >;
        listPostsWithMetaKey: FunctionReference<
          "query",
          "internal",
          { key: string; organizationId?: string },
          any
        >;
        searchPosts: FunctionReference<
          "query",
          "internal",
          {
            limit?: number;
            organizationId?: string;
            postTypeSlug?: string;
            searchTerm: string;
          },
          any
        >;
      };
    };
    progress: {
      mutations: {
        insertQuizAttempt: FunctionReference<
          "mutation",
          "internal",
          {
            completedAt: number;
            correctCount: number;
            courseId?: string;
            durationMs?: number;
            gradedQuestions: number;
            lessonId?: string;
            organizationId?: string;
            quizId: string;
            responses: Array<{
              answerText?: string;
              isCorrect?: boolean;
              questionId: string;
              questionType:
                | "singleChoice"
                | "multipleChoice"
                | "shortText"
                | "longText";
              selectedOptionIds?: Array<string>;
            }>;
            scorePercent: number;
            totalQuestions: number;
            userId: string;
          },
          any
        >;
        upsertCourseProgress: FunctionReference<
          "mutation",
          "internal",
          {
            completedAt?: number;
            completedLessonIds?: Array<string>;
            completedTopicIds?: Array<string>;
            courseId: string;
            lastAccessedAt?: number;
            lastAccessedId?: string;
            lastAccessedType?: "lesson" | "topic";
            organizationId?: string;
            startedAt?: number;
            userId: string;
          },
          any
        >;
      };
      queries: {
        getCourseProgressByUserCourse: FunctionReference<
          "query",
          "internal",
          { courseId: string; userId: string },
          any
        >;
        listQuizAttemptsByUserAndQuiz: FunctionReference<
          "query",
          "internal",
          { quizId: string; userId: string },
          any
        >;
      };
    };
  };
  launchthat_disclaimers: {
    actions: {
      importTemplatePdfFromUrl: FunctionReference<
        "action",
        "internal",
        { sourceUrl: string },
        string
      >;
      submitSignature: FunctionReference<
        "action",
        "internal",
        {
          fieldSignatures?: Array<{
            fieldId: string;
            signatureDataUrl: string;
          }>;
          ip?: string;
          issueId: string;
          signatureDataUrl?: string;
          signedByUserId?: string;
          tokenHash: string;
          userAgent?: string;
        },
        { signatureId: string; signedPdfFileId: string }
      >;
    };
    mutations: {
      createManualIssue: FunctionReference<
        "mutation",
        "internal",
        {
          organizationId?: string;
          recipientEmail: string;
          recipientName?: string;
          recipientUserId?: string;
          templatePostId: string;
        },
        { issueId: string; token: string }
      >;
      createManualIssueFromPost: FunctionReference<
        "mutation",
        "internal",
        {
          issuePostId: string;
          organizationId?: string;
          recipientEmail: string;
          recipientName?: string;
          recipientUserId?: string;
          templatePostId: string;
        },
        { issueId: string; token: string }
      >;
      finalizeSignature: FunctionReference<
        "mutation",
        "internal",
        {
          consentText: string;
          ip?: string;
          issueId: string;
          organizationId?: string;
          pdfSha256: string;
          signaturePngFileId?: string;
          signedByUserId?: string;
          signedEmail: string;
          signedName: string;
          signedPdfFileId: string;
          tokenHash: string;
          userAgent?: string;
        },
        { signatureId: string; signedPdfFileId: string }
      >;
      recordSigningView: FunctionReference<
        "mutation",
        "internal",
        { ip?: string; issueId: string; tokenHash: string; userAgent?: string },
        null
      >;
      resendIssue: FunctionReference<
        "mutation",
        "internal",
        { issueId: string; organizationId?: string },
        {
          issueId: string;
          recipientEmail: string;
          recipientUserId?: string;
          templatePostId: string;
          token: string;
        }
      >;
      upsertDisclaimerTemplateMeta: FunctionReference<
        "mutation",
        "internal",
        {
          builderTemplateJson?: string;
          consentText?: string;
          description?: string;
          organizationId?: string;
          pdfFileId?: string;
          postId: string;
        },
        string
      >;
    };
    posts: {
      mutations: {
        bulkUpdatePostStatus: FunctionReference<
          "mutation",
          "internal",
          { ids: Array<string>; status: "published" | "draft" | "archived" },
          Array<string>
        >;
        createPost: FunctionReference<
          "mutation",
          "internal",
          {
            category?: string;
            content?: string;
            excerpt?: string;
            featuredImage?: string;
            meta?: Record<string, string | number | boolean | null>;
            organizationId?: string;
            postTypeSlug: string;
            slug: string;
            status: "published" | "draft" | "archived";
            tags?: Array<string>;
            title: string;
          },
          string
        >;
        deletePost: FunctionReference<
          "mutation",
          "internal",
          { id: string },
          null
        >;
        updatePost: FunctionReference<
          "mutation",
          "internal",
          {
            category?: string;
            content?: string;
            excerpt?: string;
            featuredImage?: string;
            id: string;
            meta?: Record<string, string | number | boolean | null>;
            slug?: string;
            status?: "published" | "draft" | "archived";
            tags?: Array<string>;
            title?: string;
          },
          string
        >;
        updatePostStatus: FunctionReference<
          "mutation",
          "internal",
          { id: string; status: "published" | "draft" | "archived" },
          string
        >;
      };
      queries: {
        getAllPosts: FunctionReference<
          "query",
          "internal",
          {
            filters?: {
              authorId?: string;
              category?: string;
              limit?: number;
              postTypeSlug?: string;
              status?: "published" | "draft" | "archived";
            };
            organizationId?: string;
          },
          any
        >;
        getPostById: FunctionReference<
          "query",
          "internal",
          { id: string; organizationId?: string },
          any
        >;
        getPostBySlug: FunctionReference<
          "query",
          "internal",
          { organizationId?: string; slug: string },
          any
        >;
        getPostMeta: FunctionReference<
          "query",
          "internal",
          { organizationId?: string; postId: string },
          any
        >;
      };
    };
    queries: {
      getLatestSignatureForIssue: FunctionReference<
        "query",
        "internal",
        { issueId: string; organizationId?: string },
        null | {
          createdAt: number;
          pdfSha256: string;
          signatureId: string;
          signedPdfFileId: string;
          signedPdfUrl: string | null;
        }
      >;
      getSigningContext: FunctionReference<
        "query",
        "internal",
        { issueId: string; tokenHash: string },
        null | {
          audit: {
            completedAt?: number;
            firstViewedAt?: number;
            lastViewedAt?: number;
            sentAt?: number;
            viewCount?: number;
          };
          issueId: string;
          recipientEmail: string;
          recipientName?: string;
          status: "incomplete" | "complete";
          template: {
            builderTemplateJson?: string;
            consentText: string;
            pdfUrl: string;
            pdfVersion: number;
            postId: string;
            title: string;
          };
        }
      >;
      getSigningContextDebug: FunctionReference<
        "query",
        "internal",
        { issueId: string; tokenHash: string },
        {
          checks: {
            issueFound: boolean;
            organizationMatch: boolean;
            templateFound: boolean;
            templatePdfFileIdPresent: boolean;
            templatePdfUrlResolved: boolean;
            templatePostTypeMatch: boolean;
            tokenMatch: boolean;
          };
          ok: boolean;
          reason: string;
          snapshot: {
            issueId: string | null;
            issueOrganizationId: string | null;
            templateOrganizationId: string | null;
            templatePdfFileId: string | null;
            templatePostId: string | null;
            templatePostTypeSlug: string | null;
          };
        }
      >;
      getSigningReceipt: FunctionReference<
        "query",
        "internal",
        { issueId: string; tokenHash: string },
        null | {
          pdfSha256: string;
          signedAt: number;
          signedEmail: string;
          signedName: string;
          signedPdfUrl: string | null;
        }
      >;
      getSigningViewEvents: FunctionReference<
        "query",
        "internal",
        { issueId: string; limit?: number; tokenHash: string },
        Array<{ at: number; ip?: string; userAgent?: string }>
      >;
      getTemplateBuilderContext: FunctionReference<
        "query",
        "internal",
        { organizationId?: string; templatePostId: string },
        null | {
          builderTemplateJson?: string;
          pdfUrl?: string;
          pdfVersion: number;
          title?: string;
        }
      >;
      listDisclaimerTemplates: FunctionReference<
        "query",
        "internal",
        { organizationId?: string },
        Array<{
          createdAt: number;
          id: string;
          meta: Record<string, string | number | boolean | null>;
          pdfUrl: string | null;
          slug: string;
          status: string;
          title: string;
          updatedAt?: number;
        }>
      >;
      listIssues: FunctionReference<
        "query",
        "internal",
        {
          limit?: number;
          organizationId?: string;
          status?: "incomplete" | "complete";
        },
        Array<{
          completedAt?: number;
          createdAt: number;
          id: string;
          lastSentAt?: number;
          organizationId?: string;
          recipientEmail: string;
          recipientName?: string;
          recipientUserId?: string;
          sendCount: number;
          status: "incomplete" | "complete";
          templatePostId: string;
          templateVersion: number;
          updatedAt: number;
        }>
      >;
    };
  };
  launchthat_ecommerce: {
    cart: {
      mutations: {
        addToCart: FunctionReference<
          "mutation",
          "internal",
          {
            productPostId: string;
            quantity?: number;
            userId: string;
            variationId?: string;
          },
          any
        >;
        addToGuestCart: FunctionReference<
          "mutation",
          "internal",
          {
            guestSessionId: string;
            productPostId: string;
            quantity?: number;
            variationId?: string;
          },
          any
        >;
        clearCart: FunctionReference<
          "mutation",
          "internal",
          { guestSessionId?: string; userId?: string },
          any
        >;
        mergeGuestCartIntoUserCart: FunctionReference<
          "mutation",
          "internal",
          { guestSessionId: string; userId: string },
          any
        >;
        removeFromCart: FunctionReference<
          "mutation",
          "internal",
          { cartItemId: string; userId: string },
          any
        >;
        removeFromGuestCart: FunctionReference<
          "mutation",
          "internal",
          { cartItemId: string; guestSessionId: string },
          any
        >;
        replaceCart: FunctionReference<
          "mutation",
          "internal",
          {
            guestSessionId?: string;
            productPostIds: Array<string>;
            userId?: string;
          },
          any
        >;
        updateCartItemQuantity: FunctionReference<
          "mutation",
          "internal",
          {
            cartItemId: string;
            guestSessionId?: string;
            quantity: number;
            userId?: string;
          },
          any
        >;
      };
      queries: {
        getCart: FunctionReference<
          "query",
          "internal",
          { guestSessionId?: string; userId?: string },
          any
        >;
      };
    };
    discounts: {
      mutations: {
        createDiscountCode: FunctionReference<
          "mutation",
          "internal",
          {
            active?: boolean;
            amount: number;
            code: string;
            kind: "percent" | "fixed";
            organizationId?: string;
          },
          string
        >;
        deleteDiscountCode: FunctionReference<
          "mutation",
          "internal",
          { id: string },
          null
        >;
        updateDiscountCode: FunctionReference<
          "mutation",
          "internal",
          {
            active?: boolean;
            amount?: number;
            code?: string;
            id: string;
            kind?: "percent" | "fixed";
          },
          null
        >;
        validateDiscountCode: FunctionReference<
          "mutation",
          "internal",
          { code: string; organizationId?: string; subtotal: number },
          {
            amount?: number;
            appliedCode?: string;
            discountAmount: number;
            kind?: "percent" | "fixed";
            ok: boolean;
            reason?: string;
          }
        >;
      };
      queries: {
        getDiscountCodeByCode: FunctionReference<
          "query",
          "internal",
          { code: string; organizationId?: string },
          null | any
        >;
        listDiscountCodes: FunctionReference<
          "query",
          "internal",
          { organizationId?: string },
          any
        >;
      };
    };
    funnelSteps: {
      mutations: {
        addFunnelStep: FunctionReference<
          "mutation",
          "internal",
          {
            funnelId: string;
            kind: "checkout" | "upsell" | "thankYou";
            order?: number;
            organizationId?: string;
            slug?: string;
            title?: string;
          },
          string
        >;
        backfillFunnelStepRoutingMeta: FunctionReference<
          "mutation",
          "internal",
          { organizationId?: string },
          { scanned: number; skipped: number; updated: number }
        >;
        ensureBaselineStepsForFunnel: FunctionReference<
          "mutation",
          "internal",
          { funnelId: string; organizationId?: string },
          null
        >;
        ensureDefaultFunnelSteps: FunctionReference<
          "mutation",
          "internal",
          { organizationId?: string },
          null
        >;
        ensureFunnelStepRoutingMeta: FunctionReference<
          "mutation",
          "internal",
          { organizationId?: string; stepId: string },
          null
        >;
      };
      queries: {
        getFunnelStepById: FunctionReference<
          "query",
          "internal",
          { organizationId?: string; stepId: string },
          null | {
            checkout?: {
              design: string;
              predefinedProductPostIds: Array<string>;
            };
            funnelId: string;
            funnelSlug: string;
            isDefaultFunnel: boolean;
            kind: string;
            order: number;
            stepId: string;
            stepSlug: string;
            stepTitle?: string;
          }
        >;
        getFunnelStepBySlug: FunctionReference<
          "query",
          "internal",
          { funnelSlug: string; organizationId?: string; stepSlug: string },
          null | {
            checkout?: {
              design: string;
              predefinedProductPostIds: Array<string>;
            };
            funnelId: string;
            funnelSlug: string;
            isDefaultFunnel: boolean;
            kind: string;
            order: number;
            stepId: string;
            stepSlug: string;
            stepTitle?: string;
          }
        >;
        getFunnelStepsForFunnel: FunctionReference<
          "query",
          "internal",
          { funnelId: string; organizationId?: string },
          Array<{
            id: string;
            kind: string;
            order: number;
            slug: string;
            title?: string;
          }>
        >;
      };
    };
    funnels: {
      mutations: {
        ensureDefaultFunnel: FunctionReference<
          "mutation",
          "internal",
          { organizationId?: string },
          string
        >;
      };
      queries: {
        getDefaultFunnel: FunctionReference<
          "query",
          "internal",
          { organizationId?: string },
          null | {
            id: string;
            isDefault: boolean;
            slug: string;
            title?: string;
          }
        >;
        getFunnelBySlug: FunctionReference<
          "query",
          "internal",
          { organizationId?: string; slug: string },
          null | {
            id: string;
            isDefault: boolean;
            slug: string;
            title?: string;
          }
        >;
      };
    };
    plans: {
      mutations: {
        deactivateProductPlan: FunctionReference<
          "mutation",
          "internal",
          { productPostId: string },
          null
        >;
        seedPlans: FunctionReference<"mutation", "internal", {}, Array<string>>;
        updatePlan: FunctionReference<
          "mutation",
          "internal",
          {
            description?: string;
            displayName?: string;
            features?: Array<string>;
            isActive?: boolean;
            limits?: {
              crmMaxContacts?: number;
              discordAiDaily?: number;
              supportBubbleAiDaily?: number;
            };
            maxOrganizations?: number;
            planId: string;
            priceMonthly?: number;
            priceYearly?: number;
            sortOrder?: number;
          },
          null
        >;
        upsertProductPlan: FunctionReference<
          "mutation",
          "internal",
          {
            description?: string;
            displayName?: string;
            features?: Array<string>;
            isActive: boolean;
            limits?: {
              crmMaxContacts?: number;
              discordAiDaily?: number;
              supportBubbleAiDaily?: number;
            };
            maxOrganizations?: number;
            priceMonthly?: number;
            priceYearly?: number;
            productPostId: string;
            sortOrder?: number;
          },
          string
        >;
      };
      queries: {
        getPlanById: FunctionReference<
          "query",
          "internal",
          { planId: string },
          null | {
            _creationTime: number;
            _id: string;
            description: string;
            displayName: string;
            features?: Array<string>;
            isActive: boolean;
            kind: "system" | "product";
            limits?: {
              crmMaxContacts?: number;
              discordAiDaily?: number;
              supportBubbleAiDaily?: number;
            };
            maxOrganizations: number;
            name: string;
            priceMonthly: number;
            priceYearly?: number;
            productPostId?: string;
            sortOrder: number;
            updatedAt: number;
          }
        >;
        getPlanByName: FunctionReference<
          "query",
          "internal",
          { name: string },
          null | {
            _creationTime: number;
            _id: string;
            description: string;
            displayName: string;
            features?: Array<string>;
            isActive: boolean;
            kind: "system" | "product";
            limits?: {
              crmMaxContacts?: number;
              discordAiDaily?: number;
              supportBubbleAiDaily?: number;
            };
            maxOrganizations: number;
            name: string;
            priceMonthly: number;
            priceYearly?: number;
            productPostId?: string;
            sortOrder: number;
            updatedAt: number;
          }
        >;
        getPlanByProductPostId: FunctionReference<
          "query",
          "internal",
          { productPostId: string },
          null | {
            _creationTime: number;
            _id: string;
            description: string;
            displayName: string;
            features?: Array<string>;
            isActive: boolean;
            kind: "system" | "product";
            limits?: {
              crmMaxContacts?: number;
              discordAiDaily?: number;
              supportBubbleAiDaily?: number;
            };
            maxOrganizations: number;
            name: string;
            priceMonthly: number;
            priceYearly?: number;
            productPostId?: string;
            sortOrder: number;
            updatedAt: number;
          }
        >;
        getPlans: FunctionReference<
          "query",
          "internal",
          { isActive?: boolean },
          Array<{
            _creationTime: number;
            _id: string;
            description: string;
            displayName: string;
            features?: Array<string>;
            isActive: boolean;
            kind: "system" | "product";
            limits?: {
              crmMaxContacts?: number;
              discordAiDaily?: number;
              supportBubbleAiDaily?: number;
            };
            maxOrganizations: number;
            name: string;
            priceMonthly: number;
            priceYearly?: number;
            productPostId?: string;
            sortOrder: number;
            updatedAt: number;
          }>
        >;
        listAssignableOrgPlans: FunctionReference<
          "query",
          "internal",
          {},
          Array<{
            _creationTime: number;
            _id: string;
            description: string;
            displayName: string;
            features?: Array<string>;
            isActive: boolean;
            kind: "system" | "product";
            limits?: {
              crmMaxContacts?: number;
              discordAiDaily?: number;
              supportBubbleAiDaily?: number;
            };
            maxOrganizations: number;
            name: string;
            priceMonthly: number;
            priceYearly?: number;
            productPostId?: string;
            sortOrder: number;
            updatedAt: number;
          }>
        >;
      };
    };
    posts: {
      mutations: {
        createPost: FunctionReference<
          "mutation",
          "internal",
          {
            authorId?: string;
            category?: string;
            content?: string;
            createdAt?: number;
            excerpt?: string;
            featuredImage?: string;
            featuredImageUrl?: string;
            meta?: Record<string, string | number | boolean | null>;
            organizationId?: string;
            postTypeSlug: string;
            slug: string;
            status:
              | "published"
              | "draft"
              | "archived"
              | "unpaid"
              | "paid"
              | "failed";
            tags?: Array<string>;
            title: string;
            updatedAt?: number;
          },
          any
        >;
        deletePost: FunctionReference<
          "mutation",
          "internal",
          { id: string },
          any
        >;
        setPostMeta: FunctionReference<
          "mutation",
          "internal",
          {
            key: string;
            postId: string;
            value?: string | number | boolean | null;
          },
          any
        >;
        updatePost: FunctionReference<
          "mutation",
          "internal",
          {
            category?: string;
            content?: string;
            excerpt?: string;
            featuredImage?: string;
            featuredImageUrl?: string;
            id: string;
            meta?: Record<string, string | number | boolean | null>;
            organizationId?: string;
            patch?: any;
            slug?: string;
            status?:
              | "published"
              | "draft"
              | "archived"
              | "unpaid"
              | "paid"
              | "failed";
            tags?: Array<string>;
            title?: string;
          },
          any
        >;
      };
      queries: {
        findFirstPostIdByMetaKeyValue: FunctionReference<
          "query",
          "internal",
          {
            key: string;
            organizationId?: string;
            postTypeSlug?: string;
            value: string;
          },
          null | string
        >;
        getAllPosts: FunctionReference<
          "query",
          "internal",
          {
            filters?: {
              authorId?: string;
              category?: string;
              limit?: number;
              postTypeSlug?: string;
              status?:
                | "published"
                | "draft"
                | "archived"
                | "unpaid"
                | "paid"
                | "failed";
            };
            organizationId?: string;
          },
          any
        >;
        getPostById: FunctionReference<
          "query",
          "internal",
          { id: string; organizationId?: string },
          null | any
        >;
        getPostBySlug: FunctionReference<
          "query",
          "internal",
          { organizationId?: string; slug: string },
          null | any
        >;
        getPostCategories: FunctionReference<
          "query",
          "internal",
          { organizationId?: string; postTypeSlug?: string },
          any
        >;
        getPostMeta: FunctionReference<
          "query",
          "internal",
          { organizationId?: string; postId: string },
          any
        >;
        getPostTags: FunctionReference<
          "query",
          "internal",
          { organizationId?: string; postTypeSlug?: string },
          any
        >;
        listPostIdsByMetaKeyValue: FunctionReference<
          "query",
          "internal",
          {
            key: string;
            limit?: number;
            organizationId?: string;
            postTypeSlug?: string;
            value: string;
          },
          Array<string>
        >;
        searchPosts: FunctionReference<
          "query",
          "internal",
          {
            limit?: number;
            organizationId?: string;
            postTypeSlug?: string;
            searchTerm: string;
          },
          any
        >;
      };
    };
  };
  launchthat_discord: {
    delivery: {
      mutations: {
        incrementUserDeliveryStat: FunctionReference<
          "mutation",
          "internal",
          {
            kind: string;
            messagesSent?: number;
            organizationId: string;
            userId: string;
          },
          null
        >;
      };
      queries: {
        getUserDeliveryStats: FunctionReference<
          "query",
          "internal",
          {
            daysBack?: number;
            kind?: string;
            organizationId: string;
            userId: string;
          },
          {
            byDay: Array<{ day: string; messagesSent: number }>;
            daysBack: number;
            totalMessagesSent: number;
          }
        >;
      };
    };
    guildConnections: {
      mutations: {
        deleteGuildConnection: FunctionReference<
          "mutation",
          "internal",
          { guildId: string; organizationId: string },
          null
        >;
        upsertGuildConnection: FunctionReference<
          "mutation",
          "internal",
          {
            botModeAtConnect: "global" | "custom";
            connectedAt: number;
            guildId: string;
            guildName?: string;
            organizationId: string;
          },
          null
        >;
      };
      queries: {
        getGuildConnectionByGuildId: FunctionReference<
          "query",
          "internal",
          { guildId: string },
          null | {
            botModeAtConnect: "global" | "custom";
            connectedAt: number;
            guildId: string;
            guildName?: string;
            organizationId: string;
          }
        >;
        listGuildConnectionsForOrg: FunctionReference<
          "query",
          "internal",
          { organizationId: string },
          Array<{
            botModeAtConnect: "global" | "custom";
            connectedAt: number;
            guildId: string;
            guildName?: string;
          }>
        >;
      };
    };
    guildSettings: {
      mutations: {
        upsertGuildSettings: FunctionReference<
          "mutation",
          "internal",
          {
            announcementChannelId?: string;
            announcementEventKeys?: Array<string>;
            approvedMemberRoleId?: string;
            courseUpdatesChannelId?: string;
            escalationConfidenceThreshold?: number;
            escalationKeywords?: Array<string>;
            guildId: string;
            inviteUrl?: string;
            memberTradesChannelId?: string;
            memberTradesTemplateId?: string;
            mentorTradesChannelId?: string;
            mentorTradesTemplateId?: string;
            organizationId: string;
            supportAiDisabledMessageEnabled?: boolean;
            supportAiDisabledMessageText?: string;
            supportAiEnabled: boolean;
            supportForumChannelId?: string;
            supportPrivateIntakeChannelId?: string;
            supportStaffRoleId?: string;
            threadReplyCooldownMs?: number;
          },
          null
        >;
      };
      queries: {
        getGuildSettings: FunctionReference<
          "query",
          "internal",
          { guildId: string; organizationId: string },
          null | {
            announcementChannelId?: string;
            announcementEventKeys?: Array<string>;
            approvedMemberRoleId?: string;
            courseUpdatesChannelId?: string;
            escalationConfidenceThreshold?: number;
            escalationKeywords?: Array<string>;
            guildId: string;
            inviteUrl?: string;
            memberTradesChannelId?: string;
            memberTradesTemplateId?: string;
            mentorTradesChannelId?: string;
            mentorTradesTemplateId?: string;
            organizationId: string;
            supportAiDisabledMessageEnabled?: boolean;
            supportAiDisabledMessageText?: string;
            supportAiEnabled: boolean;
            supportForumChannelId?: string;
            supportPrivateIntakeChannelId?: string;
            supportStaffRoleId?: string;
            threadReplyCooldownMs?: number;
            updatedAt: number;
          }
        >;
      };
    };
    oauth: {
      actions: {
        completeUserLink: FunctionReference<
          "action",
          "internal",
          { code: string; state: string },
          {
            discordUserId: string;
            guildId: string;
            organizationId: string;
            userId: string;
          }
        >;
        startUserLink: FunctionReference<
          "action",
          "internal",
          {
            callbackPath: string;
            organizationId: string;
            returnTo: string;
            userId: string;
          },
          { state: string; url: string }
        >;
      };
      helpers: {
        queries: {
          computeAuthRedirectUri: FunctionReference<
            "query",
            "internal",
            {
              callbackPath: string;
              fallbackAuthHost?: string;
              returnTo: string;
              rootDomain?: string;
            },
            { isLocal: boolean; redirectUri: string; returnToHost: string }
          >;
        };
      };
      mutations: {
        consumeOauthState: FunctionReference<
          "mutation",
          "internal",
          { state: string },
          {
            callbackPath?: string;
            codeVerifier: string;
            kind: "org_install" | "user_link";
            organizationId: string;
            returnTo: string;
            userId?: string;
          } | null
        >;
        createOauthState: FunctionReference<
          "mutation",
          "internal",
          {
            callbackPath?: string;
            codeVerifier: string;
            kind: "org_install" | "user_link";
            organizationId: string;
            returnTo: string;
            state: string;
            userId?: string;
          },
          null
        >;
      };
      queries: {
        peekOauthState: FunctionReference<
          "query",
          "internal",
          { state: string },
          {
            callbackPath?: string;
            codeVerifier: string;
            createdAt: number;
            kind: "org_install" | "user_link";
            organizationId: string;
            returnTo: string;
            userId?: string;
          } | null
        >;
      };
    };
    orgConfigs: {
      internalQueries: {
        getOrgConfigSecrets: FunctionReference<
          "query",
          "internal",
          { organizationId: string },
          {
            botMode: "global" | "custom";
            botTokenEncrypted?: string;
            clientId?: string;
            clientSecretEncrypted?: string;
            customBotTokenEncrypted?: string;
            customClientId?: string;
            customClientSecretEncrypted?: string;
            enabled: boolean;
            guildId?: string;
            organizationId: string;
          } | null
        >;
      };
      mutations: {
        upsertOrgConfig: FunctionReference<
          "mutation",
          "internal",
          {
            botTokenEncrypted: string;
            clientId: string;
            clientSecretEncrypted: string;
            enabled: boolean;
            guildId: string;
            organizationId: string;
          },
          null
        >;
        upsertOrgConfigV2: FunctionReference<
          "mutation",
          "internal",
          {
            botMode: "global" | "custom";
            customBotTokenEncrypted?: string;
            customClientId?: string;
            customClientSecretEncrypted?: string;
            enabled: boolean;
            organizationId: string;
          },
          null
        >;
      };
      queries: {
        getOrgConfig: FunctionReference<
          "query",
          "internal",
          { organizationId: string },
          {
            botMode: "global" | "custom";
            connectedAt: number;
            customClientId?: string;
            enabled: boolean;
            hasBotToken: boolean;
            hasClientSecret: boolean;
            lastError?: string;
            lastValidatedAt?: number;
            organizationId: string;
          } | null
        >;
      };
    };
    roleRules: {
      mutations: {
        replaceMarketingTagRoleRules: FunctionReference<
          "mutation",
          "internal",
          {
            marketingTagId: string;
            organizationId: string;
            rules: Array<{
              guildId: string;
              roleId: string;
              roleName?: string;
            }>;
          },
          null
        >;
        replaceOrgRoleRules: FunctionReference<
          "mutation",
          "internal",
          {
            organizationId: string;
            rules: Array<{
              enabled: boolean;
              guildId?: string;
              kind: "product" | "marketingTag";
              marketingTagId?: string;
              productId?: string;
              roleId: string;
              roleName?: string;
            }>;
          },
          null
        >;
        replaceProductRoleRules: FunctionReference<
          "mutation",
          "internal",
          {
            organizationId: string;
            productId: string;
            rules: Array<{
              guildId: string;
              roleId: string;
              roleName?: string;
            }>;
          },
          null
        >;
      };
      queries: {
        listRoleRulesForMarketingTags: FunctionReference<
          "query",
          "internal",
          { marketingTagIds: Array<string>; organizationId: string },
          Array<{
            enabled: boolean;
            guildId?: string;
            marketingTagId: string;
            roleId: string;
            roleName?: string;
          }>
        >;
        listRoleRulesForOrgKind: FunctionReference<
          "query",
          "internal",
          { kind: "product" | "marketingTag"; organizationId: string },
          Array<{
            enabled: boolean;
            guildId?: string;
            roleId: string;
            roleName?: string;
          }>
        >;
        listRoleRulesForProduct: FunctionReference<
          "query",
          "internal",
          { organizationId: string; productId: string },
          Array<{
            enabled: boolean;
            guildId?: string;
            roleId: string;
            roleName?: string;
          }>
        >;
      };
    };
    routing: {
      mutations: {
        replaceRoutingRules: FunctionReference<
          "mutation",
          "internal",
          {
            guildId: string;
            kind: "trade_feed";
            organizationId: string;
            rules: Array<{
              channelId: string;
              channelKind?: "mentors" | "members";
              conditions?: {
                actorRoles?: Array<string>;
                symbols?: Array<string>;
              };
              enabled: boolean;
              order: number;
              priority: number;
            }>;
          },
          null
        >;
        upsertRoutingRuleSet: FunctionReference<
          "mutation",
          "internal",
          {
            guildId: string;
            kind: "trade_feed";
            matchStrategy: "first_match" | "multi_cast" | "priority";
            organizationId: string;
          },
          null
        >;
      };
      queries: {
        getRoutingRuleSet: FunctionReference<
          "query",
          "internal",
          { guildId: string; kind: "trade_feed"; organizationId: string },
          null | {
            guildId: string;
            kind: "trade_feed";
            matchStrategy: "first_match" | "multi_cast" | "priority";
            organizationId: string;
            updatedAt: number;
          }
        >;
        listRoutingRules: FunctionReference<
          "query",
          "internal",
          { guildId: string; kind: "trade_feed"; organizationId: string },
          Array<{
            channelId: string;
            conditions?: {
              actorRoles?: Array<string>;
              symbols?: Array<string>;
            };
            enabled: boolean;
            id: string;
            order: number;
            priority: number;
          }>
        >;
        resolveChannelsForEvent: FunctionReference<
          "query",
          "internal",
          {
            actorRole: string;
            guildId: string;
            kind: "trade_feed";
            organizationId: string;
            symbol: string;
          },
          Array<string>
        >;
        resolveTradeFeedChannel: FunctionReference<
          "query",
          "internal",
          {
            channelKind: "mentors" | "members";
            guildId: string;
            organizationId: string;
          },
          string | null
        >;
      };
    };
    support: {
      mutations: {
        logDiscordApiCall: FunctionReference<
          "mutation",
          "internal",
          {
            error?: string;
            guildId?: string;
            kind: string;
            method: string;
            organizationId?: string;
            retryAfterMs?: number;
            status: number;
            url: string;
          },
          null
        >;
        recordSupportAiRun: FunctionReference<
          "mutation",
          "internal",
          {
            answer: string;
            confidence?: number;
            escalated: boolean;
            guildId: string;
            model?: string;
            organizationId: string;
            promptHash: string;
            threadId: string;
            triggerMessageId: string;
          },
          null
        >;
        setEscalationMapping: FunctionReference<
          "mutation",
          "internal",
          {
            guildId: string;
            keyword?: string;
            organizationId: string;
            privateThreadId: string;
            publicThreadId: string;
            requesterDiscordUserId: string;
          },
          null
        >;
        upsertSupportThreadAndMessage: FunctionReference<
          "mutation",
          "internal",
          {
            authorDiscordUserId?: string;
            authorIsBot?: boolean;
            content?: string;
            createdByDiscordUserId?: string;
            forumChannelId?: string;
            guildId: string;
            messageCreatedAt?: number;
            messageId?: string;
            organizationId: string;
            threadId: string;
            threadName?: string;
          },
          null
        >;
      };
      queries: {
        getEscalationMappingForThread: FunctionReference<
          "query",
          "internal",
          { guildId: string; threadId: string },
          null | {
            privateThreadId: string;
            publicThreadId: string;
            requesterDiscordUserId: string;
          }
        >;
        hasAiRunForTriggerMessage: FunctionReference<
          "query",
          "internal",
          { guildId: string; triggerMessageId: string },
          boolean
        >;
      };
    };
    syncJobs: {
      mutations: {
        deleteJob: FunctionReference<
          "mutation",
          "internal",
          { jobId: string },
          null
        >;
        enqueueSyncJob: FunctionReference<
          "mutation",
          "internal",
          {
            organizationId: string;
            payload: any;
            reason: "purchase" | "tagChange" | "manual";
            userId: string;
          },
          null
        >;
        setJobStatus: FunctionReference<
          "mutation",
          "internal",
          {
            attempts?: number;
            jobId: string;
            lastError?: string;
            status: "pending" | "processing" | "done" | "failed";
          },
          null
        >;
      };
      queries: {
        listPendingJobs: FunctionReference<
          "query",
          "internal",
          { limit?: number },
          Array<{
            _id: string;
            attempts: number;
            createdAt: number;
            organizationId: string;
            payload: any;
            reason: "purchase" | "tagChange" | "manual";
            userId: string;
          }>
        >;
      };
    };
    templates: {
      mutations: {
        createTemplate: FunctionReference<
          "mutation",
          "internal",
          {
            description?: string;
            guildId?: string;
            kind: string;
            name: string;
            organizationId: string;
            template: string;
          },
          string
        >;
        deleteTemplate: FunctionReference<
          "mutation",
          "internal",
          { organizationId: string; templateId: string },
          null
        >;
        updateTemplate: FunctionReference<
          "mutation",
          "internal",
          {
            description?: string;
            name?: string;
            organizationId: string;
            template?: string;
            templateId: string;
          },
          null
        >;
        upsertTemplate: FunctionReference<
          "mutation",
          "internal",
          {
            description?: string;
            guildId?: string;
            kind: string;
            name?: string;
            organizationId: string;
            template: string;
          },
          null
        >;
      };
      queries: {
        getTemplate: FunctionReference<
          "query",
          "internal",
          { guildId?: string; kind: string; organizationId: string },
          null | { template: string; updatedAt: number }
        >;
        getTemplateById: FunctionReference<
          "query",
          "internal",
          { organizationId: string; templateId: string },
          null | {
            _id: string;
            createdAt?: number;
            description?: string;
            guildId?: string;
            kind: string;
            name?: string;
            template: string;
            updatedAt: number;
          }
        >;
        listTemplates: FunctionReference<
          "query",
          "internal",
          { guildId?: string; kind: string; organizationId: string },
          Array<{
            _id: string;
            createdAt?: number;
            description?: string;
            guildId?: string;
            kind: string;
            name?: string;
            scope: "org" | "guild";
            template: string;
            updatedAt: number;
          }>
        >;
        renderTradeIdeaMessage: FunctionReference<
          "query",
          "internal",
          {
            avgEntryPrice?: number;
            closedAt?: number;
            direction: "long" | "short";
            fees?: number;
            guildId?: string;
            netQty: number;
            openedAt?: number;
            organizationId: string;
            realizedPnl?: number;
            status: "open" | "closed";
            symbol: string;
            templateId?: string;
          },
          { content: string }
        >;
      };
    };
    userLinks: {
      mutations: {
        linkUser: FunctionReference<
          "mutation",
          "internal",
          { discordUserId: string; organizationId: string; userId: string },
          null
        >;
        unlinkUser: FunctionReference<
          "mutation",
          "internal",
          { organizationId: string; userId: string },
          null
        >;
      };
      queries: {
        getUserIdByDiscordUserId: FunctionReference<
          "query",
          "internal",
          { discordUserId: string; organizationId: string },
          { linkedAt: number; userId: string } | null
        >;
        getUserLink: FunctionReference<
          "query",
          "internal",
          { organizationId: string; userId: string },
          { discordUserId: string; linkedAt: number } | null
        >;
      };
    };
    userStreaming: {
      mutations: {
        setUserStreamingEnabled: FunctionReference<
          "mutation",
          "internal",
          { enabled: boolean; organizationId: string; userId: string },
          null
        >;
      };
      queries: {
        getUserStreamingPrefs: FunctionReference<
          "query",
          "internal",
          { organizationId: string; userId: string },
          null | {
            disabledAt?: number;
            enabled: boolean;
            enabledAt?: number;
            updatedAt: number;
          }
        >;
      };
    };
  };
  launchthat_crm: {
    contacts: {
      mutations: {
        createContact: FunctionReference<
          "mutation",
          "internal",
          {
            authorId?: string;
            category?: string;
            content?: string;
            excerpt?: string;
            featuredImageUrl?: string;
            meta?: any;
            organizationId?: string;
            postTypeSlug: string;
            slug: string;
            status: string;
            tags?: Array<string>;
            title: string;
            userId?: string;
          },
          string
        >;
        deleteContact: FunctionReference<
          "mutation",
          "internal",
          { contactId: string; organizationId?: string },
          null
        >;
        updateContact: FunctionReference<
          "mutation",
          "internal",
          {
            authorId?: string;
            category?: string;
            contactId: string;
            content?: string;
            excerpt?: string;
            featuredImageUrl?: string;
            meta?: any;
            organizationId?: string;
            slug?: string;
            status?: string;
            tags?: Array<string>;
            title?: string;
            userId?: string;
          },
          null
        >;
      };
      queries: {
        getContactById: FunctionReference<
          "query",
          "internal",
          { contactId: string; organizationId?: string },
          null | {
            _creationTime: number;
            _id: string;
            authorId?: string;
            category?: string;
            content?: string;
            createdAt: number;
            excerpt?: string;
            featuredImageUrl?: string;
            organizationId?: string;
            postTypeSlug: string;
            slug: string;
            status: string;
            tags?: Array<string>;
            title: string;
            updatedAt?: number;
            userId?: string;
          }
        >;
        getContactBySlug: FunctionReference<
          "query",
          "internal",
          { organizationId?: string; slug: string },
          null | {
            _creationTime: number;
            _id: string;
            authorId?: string;
            category?: string;
            content?: string;
            createdAt: number;
            excerpt?: string;
            featuredImageUrl?: string;
            organizationId?: string;
            postTypeSlug: string;
            slug: string;
            status: string;
            tags?: Array<string>;
            title: string;
            updatedAt?: number;
            userId?: string;
          }
        >;
        getContactIdForUser: FunctionReference<
          "query",
          "internal",
          { organizationId?: string; userId: string },
          string | null
        >;
        getContactMeta: FunctionReference<
          "query",
          "internal",
          { contactId: string },
          Array<{
            _creationTime: number;
            _id: string;
            contactId: string;
            createdAt: number;
            key: string;
            updatedAt?: number;
            value?: string | number | boolean | null;
          }>
        >;
        listContacts: FunctionReference<
          "query",
          "internal",
          { limit?: number; organizationId?: string; status?: string },
          Array<{
            _creationTime: number;
            _id: string;
            authorId?: string;
            category?: string;
            content?: string;
            createdAt: number;
            excerpt?: string;
            featuredImageUrl?: string;
            organizationId?: string;
            postTypeSlug: string;
            slug: string;
            status: string;
            tags?: Array<string>;
            title: string;
            updatedAt?: number;
            userId?: string;
          }>
        >;
      };
    };
    marketingTags: {
      mutations: {
        assignMarketingTagToUser: FunctionReference<
          "mutation",
          "internal",
          {
            assignedBy?: string;
            contactId: string;
            expiresAt?: number;
            marketingTagId: string;
            notes?: string;
            organizationId?: string;
            source?: string;
          },
          string
        >;
        createMarketingTag: FunctionReference<
          "mutation",
          "internal",
          {
            category?: string;
            color?: string;
            createdBy?: string;
            description?: string;
            isActive?: boolean;
            name: string;
            organizationId?: string;
            slug?: string;
          },
          string
        >;
        removeMarketingTagFromUser: FunctionReference<
          "mutation",
          "internal",
          {
            contactId: string;
            marketingTagId: string;
            organizationId?: string;
          },
          boolean
        >;
      };
      queries: {
        contactHasMarketingTags: FunctionReference<
          "query",
          "internal",
          {
            contactId: string;
            organizationId?: string;
            requireAll?: boolean;
            tagSlugs: Array<string>;
          },
          {
            hasAccess: boolean;
            matchingTags: Array<string>;
            missingTags: Array<string>;
          }
        >;
        getContactIdForUser: FunctionReference<
          "query",
          "internal",
          { organizationId?: string; userId: string },
          string | null
        >;
        getContactMarketingTags: FunctionReference<
          "query",
          "internal",
          { contactId: string; organizationId?: string },
          Array<{
            _id: string;
            assignedAt: number;
            assignedBy?: string;
            contactId: string;
            expiresAt?: number;
            marketingTag: {
              _creationTime: number;
              _id: string;
              category?: string;
              color?: string;
              createdAt?: number;
              createdBy?: string;
              description?: string;
              isActive?: boolean;
              name: string;
              organizationId?: string;
              slug?: string;
            };
            notes?: string;
            source?: string;
          }>
        >;
        getUserMarketingTags: FunctionReference<
          "query",
          "internal",
          { organizationId?: string; userId: string },
          Array<{
            _id: string;
            assignedAt: number;
            assignedBy?: string;
            contactId: string;
            expiresAt?: number;
            marketingTag: {
              _creationTime: number;
              _id: string;
              category?: string;
              color?: string;
              createdAt?: number;
              createdBy?: string;
              description?: string;
              isActive?: boolean;
              name: string;
              organizationId?: string;
              slug?: string;
            };
            notes?: string;
            source?: string;
          }>
        >;
        listMarketingTags: FunctionReference<
          "query",
          "internal",
          { organizationId?: string },
          Array<{
            _creationTime: number;
            _id: string;
            category?: string;
            color?: string;
            createdAt?: number;
            createdBy?: string;
            description?: string;
            isActive?: boolean;
            name: string;
            organizationId?: string;
            slug?: string;
          }>
        >;
      };
    };
  };
  launchthat_tasks: {
    tasks: {
      boards: {
        mutations: {
          createBoard: FunctionReference<
            "mutation",
            "internal",
            { name: string },
            string
          >;
          deleteBoard: FunctionReference<
            "mutation",
            "internal",
            { boardId: string },
            boolean
          >;
          updateBoard: FunctionReference<
            "mutation",
            "internal",
            { boardId: string; name: string },
            boolean
          >;
        };
        queries: {
          getBoard: FunctionReference<
            "query",
            "internal",
            { boardId: string },
            null | {
              _creationTime: number;
              _id: string;
              createdAt: number;
              name: string;
              updatedAt: number;
            }
          >;
          listBoards: FunctionReference<
            "query",
            "internal",
            {},
            Array<{
              _creationTime: number;
              _id: string;
              createdAt: number;
              name: string;
              updatedAt: number;
            }>
          >;
        };
      };
      mutations: {
        createTask: FunctionReference<
          "mutation",
          "internal",
          {
            boardId?: string;
            description?: string;
            dueDate?: number;
            isRecurring?: boolean;
            recurrenceRule?: string;
            status?: "pending" | "completed" | "cancelled";
            title: string;
          },
          string
        >;
        deleteTask: FunctionReference<
          "mutation",
          "internal",
          { taskId: string },
          boolean
        >;
        reorderTasks: FunctionReference<
          "mutation",
          "internal",
          { tasks: Array<{ sortIndex: number; taskId: string }> },
          boolean
        >;
        updateTask: FunctionReference<
          "mutation",
          "internal",
          {
            description?: string;
            dueDate?: number;
            isRecurring?: boolean;
            recurrenceRule?: string;
            status?: "pending" | "completed" | "cancelled";
            taskId: string;
            title?: string;
          },
          boolean
        >;
      };
      queries: {
        getTask: FunctionReference<
          "query",
          "internal",
          { taskId: string },
          null | {
            _creationTime: number;
            _id: string;
            boardId?: string;
            createdAt: number;
            description?: string;
            dueDate?: number;
            isRecurring?: boolean;
            recurrenceRule?: string;
            sortIndex?: number;
            status: "pending" | "completed" | "cancelled";
            title: string;
            updatedAt: number;
          }
        >;
        listTasks: FunctionReference<
          "query",
          "internal",
          {},
          Array<{
            _creationTime: number;
            _id: string;
            boardId?: string;
            createdAt: number;
            description?: string;
            dueDate?: number;
            isRecurring?: boolean;
            recurrenceRule?: string;
            sortIndex?: number;
            status: "pending" | "completed" | "cancelled";
            title: string;
            updatedAt: number;
          }>
        >;
        listTasksByBoard: FunctionReference<
          "query",
          "internal",
          { boardId: string },
          Array<{
            _creationTime: number;
            _id: string;
            boardId?: string;
            createdAt: number;
            description?: string;
            dueDate?: number;
            isRecurring?: boolean;
            recurrenceRule?: string;
            sortIndex?: number;
            status: "pending" | "completed" | "cancelled";
            title: string;
            updatedAt: number;
          }>
        >;
      };
    };
  };
  launchthat_vimeo: {
    syncState: {
      mutations: {
        updateSyncState: FunctionReference<
          "mutation",
          "internal",
          {
            connectionId: string;
            estimatedTotalPages?: number | null;
            finishedAt?: number | null;
            lastError?: string | null;
            nextPage?: number;
            pagesFetchedDelta?: number;
            perPage?: number;
            setPagesFetched?: number;
            setSyncedCount?: number;
            startedAt?: number | null;
            status?: "idle" | "running" | "error" | "done";
            syncedCountDelta?: number;
            totalVideos?: number | null;
            webhookId?: string | null;
            webhookLastError?: string | null;
            webhookLastEventAt?: number | null;
            webhookSecret?: string | null;
            webhookStatus?: "idle" | "active" | "error" | "disabled" | null;
            workflowId?: string | null;
          },
          string
        >;
      };
      queries: {
        getSyncStateByConnection: FunctionReference<
          "query",
          "internal",
          { connectionId: string },
          any
        >;
      };
    };
    videos: {
      mutations: {
        createVideo: FunctionReference<
          "mutation",
          "internal",
          {
            connectionId: string;
            createdAt: number;
            description?: string;
            embedUrl: string;
            publishedAt: number;
            thumbnailUrl?: string;
            title: string;
            updatedAt: number;
            videoId: string;
          },
          string
        >;
        markVideoDeleted: FunctionReference<
          "mutation",
          "internal",
          { connectionId: string; deletedAt: number; videoId: string },
          boolean
        >;
        updateVideo: FunctionReference<
          "mutation",
          "internal",
          {
            description?: string;
            embedUrl?: string;
            id: string;
            publishedAt?: number;
            thumbnailUrl?: string;
            title?: string;
            updatedAt: number;
          },
          string
        >;
        upsertVideo: FunctionReference<
          "mutation",
          "internal",
          {
            connectionId: string;
            now: number;
            video: {
              description?: string;
              embedUrl: string;
              publishedAt: number;
              thumbnailUrl?: string;
              title: string;
              videoId: string;
            };
          },
          { id: string; inserted: boolean }
        >;
        upsertVideosPage: FunctionReference<
          "mutation",
          "internal",
          {
            connectionId: string;
            now: number;
            videos: Array<{
              description?: string;
              embedUrl: string;
              publishedAt: number;
              thumbnailUrl?: string;
              title: string;
              videoId: string;
            }>;
          },
          { inserted: number; updated: number }
        >;
      };
      queries: {
        getVideoByExternalId: FunctionReference<
          "query",
          "internal",
          { connectionId: string; videoId: string },
          any
        >;
        listVideosByConnectionPaginated: FunctionReference<
          "query",
          "internal",
          {
            connectionId: string;
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            search?: string;
          },
          any
        >;
      };
    };
  };
  launchthat_logs: {
    entries: {
      mutations: {
        insertLogEntry: FunctionReference<
          "mutation",
          "internal",
          {
            actionUrl?: string;
            actorUserId?: string;
            createdAt?: number;
            email?: string;
            kind: string;
            level: "debug" | "info" | "warn" | "error";
            message: string;
            metadata?: any;
            organizationId: string;
            pluginKey: string;
            scopeId?: string;
            scopeKind?: string;
            status?: "scheduled" | "running" | "complete" | "failed";
          },
          string
        >;
      };
      queries: {
        listLogsForOrg: FunctionReference<
          "query",
          "internal",
          {
            filter?: {
              after?: number;
              before?: number;
              email?: string;
              kind?: string;
              level?: "debug" | "info" | "warn" | "error";
              pluginKey?: string;
              status?: "scheduled" | "running" | "complete" | "failed";
            };
            limit?: number;
            organizationId: string;
          },
          Array<{
            _creationTime: number;
            _id: string;
            actionUrl?: string;
            actorUserId?: string;
            createdAt: number;
            email?: string;
            kind: string;
            level: "debug" | "info" | "warn" | "error";
            message: string;
            metadata?: any;
            organizationId: string;
            pluginKey: string;
            scopeId?: string;
            scopeKind?: string;
            status?: "scheduled" | "running" | "complete" | "failed";
          }>
        >;
        listLogsForOrgPaginated: FunctionReference<
          "query",
          "internal",
          {
            filter?: {
              after?: number;
              before?: number;
              email?: string;
              kind?: string;
              level?: "debug" | "info" | "warn" | "error";
              pluginKey?: string;
              status?: "scheduled" | "running" | "complete" | "failed";
            };
            organizationId: string;
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
          },
          {
            continueCursor: string | null;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              actionUrl?: string;
              actorUserId?: string;
              createdAt: number;
              email?: string;
              kind: string;
              level: "debug" | "info" | "warn" | "error";
              message: string;
              metadata?: any;
              organizationId: string;
              pluginKey: string;
              scopeId?: string;
              scopeKind?: string;
              status?: "scheduled" | "running" | "complete" | "failed";
            }>;
          }
        >;
        listRecentEmailsForOrg: FunctionReference<
          "query",
          "internal",
          { limit?: number; organizationId: string; prefix?: string },
          Array<string>
        >;
      };
    };
  };
  launchthat_onboarding: {
    mutations: {
      markOnboardingComplete: FunctionReference<
        "mutation",
        "internal",
        { organizationId: string; userId: string },
        null
      >;
      setStepComplete: FunctionReference<
        "mutation",
        "internal",
        { organizationId: string; stepId: string; userId: string },
        null
      >;
      upsertOnboardingConfig: FunctionReference<
        "mutation",
        "internal",
        {
          ctaLabel?: string;
          ctaRoute?: string;
          description?: string;
          enabled: boolean;
          organizationId: string;
          steps: Array<{
            description?: string;
            id: string;
            required?: boolean;
            route?: string;
            title: string;
          }>;
          title?: string;
        },
        null
      >;
    };
    queries: {
      getOnboardingConfig: FunctionReference<
        "query",
        "internal",
        { organizationId: string },
        null | {
          createdAt: number;
          ctaLabel?: string;
          ctaRoute?: string;
          description?: string;
          enabled: boolean;
          organizationId: string;
          steps: Array<{
            description?: string;
            id: string;
            required?: boolean;
            route?: string;
            title: string;
          }>;
          title?: string;
          updatedAt: number;
        }
      >;
      getOnboardingStatus: FunctionReference<
        "query",
        "internal",
        { organizationId: string; userId: string },
        {
          ctaLabel?: string;
          ctaRoute?: string;
          description?: string;
          enabled: boolean;
          shouldBlock: boolean;
          steps: Array<{
            completed: boolean;
            description?: string;
            id: string;
            route?: string;
            title: string;
          }>;
          title?: string;
        }
      >;
    };
  };
  launchthat_traderlaunchpad: {
    analytics: {
      mutations: {
        createMyAnalyticsReport: FunctionReference<
          "mutation",
          "internal",
          {
            accountId?: string;
            name: string;
            organizationId: string;
            spec: {
              direction?: Array<"long" | "short">;
              fromMs?: number;
              includeUnrealized?: boolean;
              maxHoldMs?: number;
              maxPnl?: number;
              minHoldMs?: number;
              minPnl?: number;
              rangePreset: "7d" | "30d" | "90d" | "ytd" | "all" | "custom";
              symbols?: Array<string>;
              timezone: string;
              toMs?: number;
              version: 1;
              weekdays?: Array<number>;
            };
            userId: string;
            visibility: "private" | "link";
          },
          { reportId: string }
        >;
        deleteMyAnalyticsReport: FunctionReference<
          "mutation",
          "internal",
          { organizationId: string; reportId: string; userId: string },
          null
        >;
        disableShareLink: FunctionReference<
          "mutation",
          "internal",
          { organizationId: string; reportId: string; userId: string },
          null
        >;
        enableShareLink: FunctionReference<
          "mutation",
          "internal",
          { organizationId: string; reportId: string; userId: string },
          { shareToken: string }
        >;
        updateMyAnalyticsReport: FunctionReference<
          "mutation",
          "internal",
          {
            accountId?: string;
            name?: string;
            organizationId: string;
            reportId: string;
            spec?: {
              direction?: Array<"long" | "short">;
              fromMs?: number;
              includeUnrealized?: boolean;
              maxHoldMs?: number;
              maxPnl?: number;
              minHoldMs?: number;
              minPnl?: number;
              rangePreset: "7d" | "30d" | "90d" | "ytd" | "all" | "custom";
              symbols?: Array<string>;
              timezone: string;
              toMs?: number;
              version: 1;
              weekdays?: Array<number>;
            };
            userId: string;
            visibility?: "private" | "link";
          },
          null
        >;
      };
      queries: {
        getMyAnalyticsReport: FunctionReference<
          "query",
          "internal",
          { organizationId: string; reportId: string; userId: string },
          {
            accountId?: string;
            createdAt: number;
            name: string;
            reportId: string;
            shareToken?: string;
            spec: {
              direction?: Array<"long" | "short">;
              fromMs?: number;
              includeUnrealized?: boolean;
              maxHoldMs?: number;
              maxPnl?: number;
              minHoldMs?: number;
              minPnl?: number;
              rangePreset: "7d" | "30d" | "90d" | "ytd" | "all" | "custom";
              symbols?: Array<string>;
              timezone: string;
              toMs?: number;
              version: 1;
              weekdays?: Array<number>;
            };
            updatedAt: number;
            visibility: "private" | "link";
          } | null
        >;
        getOnboardingSignalsForUserIds: FunctionReference<
          "query",
          "internal",
          { maxRows?: number; userIds: Array<string> },
          {
            connectedAtByUserId: Record<string, number>;
            connectedIsTruncated: boolean;
            syncedAtByUserId: Record<string, number>;
            syncedIsTruncated: boolean;
          }
        >;
        getSharedAnalyticsReport: FunctionReference<
          "query",
          "internal",
          { shareToken: string },
          {
            name: string;
            ownerOrganizationId: string;
            ownerUserId: string;
            reportId: string;
            result: {
              byHour: Array<{
                closeEventCount: number;
                hour: number;
                pnl: number;
              }>;
              bySymbol: Array<{
                closeEventCount: number;
                pnl: number;
                symbol: string;
              }>;
              byWeekday: Array<{
                closeEventCount: number;
                pnl: number;
                weekday: number;
              }>;
              drawdown: Array<{
                date: string;
                drawdown: number;
                equity: number;
                peak: number;
              }>;
              equityCurve: Array<{
                cumulative: number;
                date: string;
                pnl: number;
              }>;
              fromMs: number;
              headline: {
                avgHoldMs: number;
                avgLoss: number;
                avgWin: number;
                closeEventCount: number;
                expectancy: number;
                grossLoss: number;
                grossWin: number;
                losses: number;
                netPnl: number;
                profitFactor: number;
                realizedPnl: number;
                totalFees: number;
                tradeCount: number;
                unrealizedPnl: number;
                winRate: number;
                wins: number;
              };
              isTruncated: boolean;
              timezone: string;
              toMs: number;
            };
            spec: {
              direction?: Array<"long" | "short">;
              fromMs?: number;
              includeUnrealized?: boolean;
              maxHoldMs?: number;
              maxPnl?: number;
              minHoldMs?: number;
              minPnl?: number;
              rangePreset: "7d" | "30d" | "90d" | "ytd" | "all" | "custom";
              symbols?: Array<string>;
              timezone: string;
              toMs?: number;
              version: 1;
              weekdays?: Array<number>;
            };
          } | null
        >;
        getUserOnboardingFunnelCounts: FunctionReference<
          "query",
          "internal",
          { maxScan?: number },
          {
            connected: { isTruncated: boolean; users: number };
            synced: { isTruncated: boolean; users: number };
          }
        >;
        listMyAnalyticsReports: FunctionReference<
          "query",
          "internal",
          { organizationId: string; userId: string },
          Array<{
            accountId?: string;
            createdAt: number;
            name: string;
            reportId: string;
            shareToken?: string;
            updatedAt: number;
            visibility: "private" | "link";
          }>
        >;
        runAnalyticsReport: FunctionReference<
          "query",
          "internal",
          {
            accountId?: string;
            organizationId: string;
            spec: {
              direction?: Array<"long" | "short">;
              fromMs?: number;
              includeUnrealized?: boolean;
              maxHoldMs?: number;
              maxPnl?: number;
              minHoldMs?: number;
              minPnl?: number;
              rangePreset: "7d" | "30d" | "90d" | "ytd" | "all" | "custom";
              symbols?: Array<string>;
              timezone: string;
              toMs?: number;
              version: 1;
              weekdays?: Array<number>;
            };
            userId: string;
          },
          {
            byHour: Array<{
              closeEventCount: number;
              hour: number;
              pnl: number;
            }>;
            bySymbol: Array<{
              closeEventCount: number;
              pnl: number;
              symbol: string;
            }>;
            byWeekday: Array<{
              closeEventCount: number;
              pnl: number;
              weekday: number;
            }>;
            drawdown: Array<{
              date: string;
              drawdown: number;
              equity: number;
              peak: number;
            }>;
            equityCurve: Array<{
              cumulative: number;
              date: string;
              pnl: number;
            }>;
            fromMs: number;
            headline: {
              avgHoldMs: number;
              avgLoss: number;
              avgWin: number;
              closeEventCount: number;
              expectancy: number;
              grossLoss: number;
              grossWin: number;
              losses: number;
              netPnl: number;
              profitFactor: number;
              realizedPnl: number;
              totalFees: number;
              tradeCount: number;
              unrealizedPnl: number;
              winRate: number;
              wins: number;
            };
            isTruncated: boolean;
            timezone: string;
            toMs: number;
          }
        >;
      };
    };
    connections: {
      drafts: {
        consumeConnectDraft: FunctionReference<
          "mutation",
          "internal",
          { draftId: string; organizationId: string; userId: string },
          {
            accessTokenEncrypted: string;
            accessTokenExpiresAt?: number;
            environment: "demo" | "live";
            jwtHost?: string;
            refreshTokenEncrypted: string;
            refreshTokenExpiresAt?: number;
            server: string;
          } | null
        >;
        createConnectDraft: FunctionReference<
          "mutation",
          "internal",
          {
            accessTokenEncrypted: string;
            accessTokenExpiresAt?: number;
            environment: "demo" | "live";
            expiresAt: number;
            jwtHost?: string;
            organizationId: string;
            refreshTokenEncrypted: string;
            refreshTokenExpiresAt?: number;
            server: string;
            userId: string;
          },
          string
        >;
      };
      internalQueries: {
        getConnectionSecrets: FunctionReference<
          "query",
          "internal",
          { organizationId: string; userId: string },
          {
            accessTokenEncrypted: string;
            accessTokenExpiresAt?: number;
            connectionId: string;
            environment: "demo" | "live";
            jwtHost?: string;
            organizationId: string;
            refreshTokenEncrypted: string;
            refreshTokenExpiresAt?: number;
            selectedAccNum: number;
            selectedAccountId: string;
            server: string;
            status: "connected" | "error" | "disconnected";
            userId: string;
          } | null
        >;
        listConnectionsDueForPoll: FunctionReference<
          "query",
          "internal",
          {
            activeWindowMs?: number;
            dueIntervalMs: number;
            limit?: number;
            now: number;
            tier: "active" | "warm";
          },
          Array<{
            _creationTime: number;
            _id: string;
            hasOpenTrade?: boolean;
            lastBrokerActivityAt?: number;
            lastSyncAt: number;
            organizationId: string;
            status: "connected" | "error" | "disconnected";
            syncLeaseOwner?: string;
            syncLeaseUntil?: number;
            userId: string;
          }>
        >;
      };
      mutations: {
        claimSyncLeases: FunctionReference<
          "mutation",
          "internal",
          {
            connectionIds: Array<string>;
            leaseMs: number;
            leaseOwner: string;
            now: number;
          },
          Array<string>
        >;
        deleteConnection: FunctionReference<
          "mutation",
          "internal",
          { organizationId: string; userId: string },
          null
        >;
        setConnectionSelectedAccount: FunctionReference<
          "mutation",
          "internal",
          {
            connectionId: string;
            organizationId: string;
            selectedAccNum: number;
            selectedAccountId: string;
            userId: string;
          },
          null
        >;
        updateConnectionAccountDebug: FunctionReference<
          "mutation",
          "internal",
          {
            accountRowId: string;
            customerAccess?: {
              filledOrders: boolean;
              marketDepth: boolean;
              orders: boolean;
              ordersHistory: boolean;
              positions: boolean;
              symbolInfo: boolean;
            };
            lastConfigError?: string;
            lastConfigOk: boolean;
            lastConfigRaw?: any;
            organizationId: string;
            userId: string;
          },
          null
        >;
        updateConnectionSyncState: FunctionReference<
          "mutation",
          "internal",
          {
            connectionId: string;
            hasOpenTrade?: boolean;
            lastBrokerActivityAt?: number;
            lastError?: string;
            lastSyncAt?: number;
            status?: "connected" | "error" | "disconnected";
            syncLeaseOwner?: string;
            syncLeaseUntil?: number;
          },
          null
        >;
        upsertConnection: FunctionReference<
          "mutation",
          "internal",
          {
            accessTokenEncrypted: string;
            accessTokenExpiresAt?: number;
            environment: "demo" | "live";
            jwtHost?: string;
            lastError?: string;
            organizationId: string;
            refreshTokenEncrypted: string;
            refreshTokenExpiresAt?: number;
            selectedAccNum: number;
            selectedAccountId: string;
            server: string;
            status: "connected" | "error" | "disconnected";
            userId: string;
          },
          string
        >;
        upsertConnectionAccount: FunctionReference<
          "mutation",
          "internal",
          {
            accNum: number;
            accountId: string;
            connectionId: string;
            currency?: string;
            name?: string;
            organizationId: string;
            status?: string;
            userId: string;
          },
          string
        >;
      };
      queries: {
        getMyConnection: FunctionReference<
          "query",
          "internal",
          { organizationId: string; userId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            environment: "demo" | "live";
            hasOpenTrade?: boolean;
            jwtHost?: string;
            lastBrokerActivityAt?: number;
            lastError?: string;
            lastSyncAt: number;
            organizationId: string;
            selectedAccNum: number;
            selectedAccountId: string;
            server: string;
            status: "connected" | "error" | "disconnected";
            syncLeaseOwner?: string;
            syncLeaseUntil?: number;
            updatedAt: number;
            userId: string;
          } | null
        >;
        listMyConnectionAccounts: FunctionReference<
          "query",
          "internal",
          { connectionId: string; organizationId: string; userId: string },
          Array<{
            _creationTime: number;
            _id: string;
            accNum: number;
            accountId: string;
            connectionId: string;
            createdAt: number;
            currency?: string;
            customerAccess?: {
              filledOrders: boolean;
              marketDepth: boolean;
              orders: boolean;
              ordersHistory: boolean;
              positions: boolean;
              symbolInfo: boolean;
            };
            lastConfigCheckedAt?: number;
            lastConfigError?: string;
            lastConfigOk?: boolean;
            lastConfigRaw?: any;
            name?: string;
            organizationId: string;
            status?: string;
            updatedAt: number;
            userId: string;
          }>
        >;
      };
    };
    journal: {
      mutations: {
        upsertProfile: FunctionReference<
          "mutation",
          "internal",
          { isPublic: boolean; organizationId: string; userId: string },
          { _id: string }
        >;
      };
      queries: {
        getProfileForUser: FunctionReference<
          "query",
          "internal",
          { organizationId: string; userId: string },
          null | {
            _creationTime: number;
            _id: string;
            createdAt: number;
            isPublic: boolean;
            organizationId: string;
            updatedAt: number;
            userId: string;
          }
        >;
        listPublicProfiles: FunctionReference<
          "query",
          "internal",
          { limit?: number; organizationId: string },
          Array<{
            _creationTime: number;
            _id: string;
            createdAt: number;
            isPublic: boolean;
            organizationId: string;
            updatedAt: number;
            userId: string;
          }>
        >;
      };
    };
    publicOrders: {
      listPublicOrdersForUser: FunctionReference<
        "query",
        "internal",
        { limit?: number; organizationId: string; userId: string },
        Array<{
          closedAt: number | null;
          createdAt: number | null;
          externalOrderId: string;
          side: "buy" | "sell" | null;
          status: string | null;
          symbol: string;
        }>
      >;
    };
    raw: {
      mutations: {
        backfillSymbolsForUser: FunctionReference<
          "mutation",
          "internal",
          {
            instrumentSymbols: Array<{ instrumentId: string; symbol: string }>;
            organizationId: string;
            perInstrumentCap?: number;
            userId: string;
          },
          {
            executionsPatched: number;
            instrumentsReceived: number;
            tradeIdeaGroupsPatched: number;
          }
        >;
        upsertTradeAccountState: FunctionReference<
          "mutation",
          "internal",
          {
            accountId: string;
            connectionId: string;
            organizationId: string;
            raw: any;
            userId: string;
          },
          { id: string; wasNew: boolean }
        >;
        upsertTradeExecution: FunctionReference<
          "mutation",
          "internal",
          {
            connectionId: string;
            executedAt: number;
            externalExecutionId: string;
            externalOrderId?: string;
            externalPositionId?: string;
            fees?: number;
            instrumentId?: string;
            organizationId: string;
            price?: number;
            qty?: number;
            raw: any;
            side?: "buy" | "sell";
            symbol?: string;
            userId: string;
          },
          { id: string; wasNew: boolean }
        >;
        upsertTradeOrder: FunctionReference<
          "mutation",
          "internal",
          {
            closedAt?: number;
            connectionId: string;
            createdAt?: number;
            externalOrderId: string;
            instrumentId?: string;
            organizationId: string;
            raw: any;
            side?: "buy" | "sell";
            status?: string;
            symbol?: string;
            userId: string;
          },
          { id: string; wasNew: boolean }
        >;
        upsertTradeOrderHistory: FunctionReference<
          "mutation",
          "internal",
          {
            closedAt?: number;
            connectionId: string;
            createdAt?: number;
            externalOrderId: string;
            instrumentId?: string;
            organizationId: string;
            raw: any;
            side?: "buy" | "sell";
            status?: string;
            symbol?: string;
            userId: string;
          },
          { id: string; wasNew: boolean }
        >;
        upsertTradePosition: FunctionReference<
          "mutation",
          "internal",
          {
            avgPrice?: number;
            connectionId: string;
            externalPositionId: string;
            instrumentId?: string;
            openedAt?: number;
            organizationId: string;
            qty?: number;
            raw: any;
            side?: "buy" | "sell";
            symbol?: string;
            unrealizedPnl?: number;
            userId: string;
          },
          { id: string; wasNew: boolean }
        >;
        upsertTradeRealizationEvent: FunctionReference<
          "mutation",
          "internal",
          {
            accountId: string;
            closePrice?: number;
            closeTradeId?: string;
            closedAt: number;
            commission?: number;
            connectionId: string;
            externalEventId: string;
            externalOrderId?: string;
            externalPositionId: string;
            fees?: number;
            instrumentId?: string;
            openAtMs?: number;
            openOrderId?: string;
            openPrice?: number;
            openTradeId?: string;
            orderType?: string;
            organizationId: string;
            positionSide?: string;
            qtyClosed?: number;
            raw: any;
            realizedPnl: number;
            swap?: number;
            tradableInstrumentId?: string;
            tradeIdeaGroupId?: string;
            userId: string;
          },
          { id: string; wasNew: boolean }
        >;
      };
      queries: {
        getAccountStateForUser: FunctionReference<
          "query",
          "internal",
          { accountId: string; organizationId: string; userId: string },
          {
            _creationTime: number;
            _id: string;
            accountId: string;
            connectionId: string;
            organizationId: string;
            raw: any;
            updatedAt: number;
            userId: string;
          } | null
        >;
        getOrderById: FunctionReference<
          "query",
          "internal",
          {
            kind?: "order" | "history";
            orderId: string;
            organizationId: string;
            userId: string;
          },
          | {
              kind: "order";
              order: {
                _creationTime: number;
                _id: string;
                closedAt?: number;
                connectionId: string;
                createdAt?: number;
                externalOrderId: string;
                instrumentId?: string;
                organizationId: string;
                raw: any;
                side?: "buy" | "sell";
                status?: string;
                symbol?: string;
                updatedAt: number;
                userId: string;
              };
            }
          | {
              kind: "history";
              order: {
                _creationTime: number;
                _id: string;
                closedAt?: number;
                connectionId: string;
                createdAt?: number;
                externalOrderId: string;
                instrumentId?: string;
                organizationId: string;
                raw: any;
                side?: "buy" | "sell";
                status?: string;
                symbol?: string;
                updatedAt: number;
                userId: string;
              };
            }
          | null
        >;
        listExecutionsForOrder: FunctionReference<
          "query",
          "internal",
          {
            externalOrderId: string;
            limit?: number;
            organizationId: string;
            userId: string;
          },
          Array<{
            _creationTime: number;
            _id: string;
            connectionId: string;
            executedAt: number;
            externalExecutionId: string;
            externalOrderId?: string;
            externalPositionId?: string;
            fees?: number;
            instrumentId?: string;
            organizationId: string;
            price?: number;
            qty?: number;
            raw: any;
            side?: "buy" | "sell";
            symbol?: string;
            updatedAt: number;
            userId: string;
          }>
        >;
        listExecutionsForPosition: FunctionReference<
          "query",
          "internal",
          {
            limit?: number;
            organizationId: string;
            positionId: string;
            userId: string;
          },
          Array<{
            _creationTime: number;
            _id: string;
            connectionId: string;
            executedAt: number;
            externalExecutionId: string;
            externalOrderId?: string;
            externalPositionId?: string;
            fees?: number;
            instrumentId?: string;
            organizationId: string;
            price?: number;
            qty?: number;
            raw: any;
            side?: "buy" | "sell";
            symbol?: string;
            updatedAt: number;
            userId: string;
          }>
        >;
        listExecutionsForUser: FunctionReference<
          "query",
          "internal",
          {
            fromExecutedAt?: number;
            limit?: number;
            organizationId: string;
            toExecutedAt?: number;
            userId: string;
          },
          Array<{
            _creationTime: number;
            _id: string;
            connectionId: string;
            executedAt: number;
            externalExecutionId: string;
            externalOrderId?: string;
            externalPositionId?: string;
            fees?: number;
            instrumentId?: string;
            organizationId: string;
            price?: number;
            qty?: number;
            raw: any;
            side?: "buy" | "sell";
            symbol?: string;
            updatedAt: number;
            userId: string;
          }>
        >;
        listExecutionsForUserByInstrumentId: FunctionReference<
          "query",
          "internal",
          {
            instrumentId: string;
            limit?: number;
            organizationId: string;
            userId: string;
          },
          Array<{
            _creationTime: number;
            _id: string;
            connectionId: string;
            executedAt: number;
            externalExecutionId: string;
            externalOrderId?: string;
            externalPositionId?: string;
            fees?: number;
            instrumentId?: string;
            organizationId: string;
            price?: number;
            qty?: number;
            raw: any;
            side?: "buy" | "sell";
            symbol?: string;
            updatedAt: number;
            userId: string;
          }>
        >;
        listInstrumentIdsMissingExecutionSymbols: FunctionReference<
          "query",
          "internal",
          {
            limit?: number;
            organizationId: string;
            scanCap?: number;
            userId: string;
          },
          Array<string>
        >;
        listOrdersForUser: FunctionReference<
          "query",
          "internal",
          { limit?: number; organizationId: string; userId: string },
          Array<{
            _creationTime: number;
            _id: string;
            closedAt?: number;
            connectionId: string;
            createdAt?: number;
            externalOrderId: string;
            instrumentId?: string;
            organizationId: string;
            raw: any;
            side?: "buy" | "sell";
            status?: string;
            symbol?: string;
            updatedAt: number;
            userId: string;
          }>
        >;
        listOrdersForUserByInstrumentId: FunctionReference<
          "query",
          "internal",
          {
            instrumentId: string;
            limit?: number;
            organizationId: string;
            userId: string;
          },
          Array<{
            _creationTime: number;
            _id: string;
            closedAt?: number;
            connectionId: string;
            createdAt?: number;
            externalOrderId: string;
            instrumentId?: string;
            organizationId: string;
            raw: any;
            side?: "buy" | "sell";
            status?: string;
            symbol?: string;
            updatedAt: number;
            userId: string;
          }>
        >;
        listOrdersHistoryForUser: FunctionReference<
          "query",
          "internal",
          { limit?: number; organizationId: string; userId: string },
          Array<{
            _creationTime: number;
            _id: string;
            closedAt?: number;
            connectionId: string;
            createdAt?: number;
            externalOrderId: string;
            instrumentId?: string;
            organizationId: string;
            raw: any;
            side?: "buy" | "sell";
            status?: string;
            symbol?: string;
            updatedAt: number;
            userId: string;
          }>
        >;
        listOrdersHistoryForUserByInstrumentId: FunctionReference<
          "query",
          "internal",
          {
            instrumentId: string;
            limit?: number;
            organizationId: string;
            userId: string;
          },
          Array<{
            _creationTime: number;
            _id: string;
            closedAt?: number;
            connectionId: string;
            createdAt?: number;
            externalOrderId: string;
            instrumentId?: string;
            organizationId: string;
            raw: any;
            side?: "buy" | "sell";
            status?: string;
            symbol?: string;
            updatedAt: number;
            userId: string;
          }>
        >;
        listPositionsForUser: FunctionReference<
          "query",
          "internal",
          { limit?: number; organizationId: string; userId: string },
          Array<{
            _creationTime: number;
            _id: string;
            avgPrice?: number;
            connectionId: string;
            externalPositionId: string;
            instrumentId?: string;
            openedAt?: number;
            organizationId: string;
            qty?: number;
            raw: any;
            side?: "buy" | "sell";
            symbol?: string;
            updatedAt: number;
            userId: string;
          }>
        >;
      };
    };
    sharing: {
      getMyShareVisibilitySettings: FunctionReference<
        "query",
        "internal",
        { organizationId: string; userId: string },
        {
          globalEnabled: boolean;
          ordersEnabled: boolean;
          positionsEnabled: boolean;
          profileEnabled: boolean;
          tradeIdeasEnabled: boolean;
        }
      >;
      upsertMyShareVisibilitySettings: FunctionReference<
        "mutation",
        "internal",
        {
          globalEnabled: boolean;
          ordersEnabled: boolean;
          organizationId: string;
          positionsEnabled: boolean;
          profileEnabled: boolean;
          tradeIdeasEnabled: boolean;
          userId: string;
        },
        null
      >;
    };
    sync: {
      getInstrumentDetails: FunctionReference<
        "action",
        "internal",
        {
          instrumentId: string;
          organizationId: string;
          secretsKey: string;
          tokenStorage?: "raw" | "enc";
          userId: string;
        },
        { instrumentId: string; raw: any; symbol?: string } | null
      >;
      probeAllAccountsForUser: FunctionReference<
        "action",
        "internal",
        {
          organizationId: string;
          secretsKey: string;
          tokenStorage?: "raw" | "enc";
          userId: string;
        },
        {
          accounts: Array<any>;
          accountsPreview: Array<any>;
          baseUrl: string;
          count: number;
          error?: string;
          jwtHost?: string;
          ok: boolean;
          status: number;
          textPreview: string;
        }
      >;
      probeBackendPathForAccount: FunctionReference<
        "action",
        "internal",
        {
          accNum: number;
          accountId: string;
          organizationId: string;
          path: string;
          secretsKey: string;
          tokenStorage?: "raw" | "enc";
          userId: string;
        },
        {
          accNum: number;
          accountId: string;
          apiStatus?: string;
          attempts?: Array<any>;
          baseUrl: string;
          error?: string;
          jsonPreview?: any;
          ok: boolean;
          pathUsed?: string;
          status?: number;
          textPreview?: string;
        }
      >;
      probeHistoryForInstrument: FunctionReference<
        "action",
        "internal",
        {
          lookbackDays?: number;
          organizationId: string;
          resolution?: string;
          routeId?: number;
          secretsKey: string;
          tokenStorage?: "raw" | "enc";
          tradableInstrumentId: string;
          userId: string;
        },
        {
          accNum: number;
          accountId: string;
          barsPreview?: any;
          baseUrl: string;
          error?: string;
          instrumentId: string;
          ok: boolean;
          requestPath?: string;
          routeId: number;
          status?: number;
          textPreview?: string;
        }
      >;
      probeHistoryForInstrumentForAccount: FunctionReference<
        "action",
        "internal",
        {
          accNum: number;
          accountId: string;
          lookbackDays?: number;
          organizationId: string;
          resolution?: string;
          routeId?: number;
          secretsKey: string;
          tokenStorage?: "raw" | "enc";
          tradableInstrumentId: string;
          userId: string;
        },
        {
          accNum: number;
          accountId: string;
          barsPreview?: any;
          baseUrl: string;
          error?: string;
          instrumentId: string;
          ok: boolean;
          requestPath?: string;
          routeId: number;
          status?: number;
          textPreview?: string;
        }
      >;
      probeHistoryForSymbol: FunctionReference<
        "action",
        "internal",
        {
          lookbackDays?: number;
          organizationId: string;
          resolution?: string;
          secretsKey: string;
          symbol: string;
          tokenStorage?: "raw" | "enc";
          userId: string;
        },
        {
          accNum: number;
          barsPreview?: any;
          baseUrl: string;
          error?: string;
          instrumentId?: string;
          ok: boolean;
          requestPath?: string;
          routeId: number;
          status?: number;
          symbol: string;
          textPreview?: string;
        }
      >;
      probeInstrumentsForAllAccounts: FunctionReference<
        "action",
        "internal",
        {
          organizationId: string;
          secretsKey: string;
          tokenStorage?: "raw" | "enc";
          userId: string;
        },
        {
          accNum: number;
          accountsPreview: Array<any>;
          attempts: Array<{
            apiErrmsg?: string;
            apiS?: string;
            candidateType: string;
            candidateValue: string;
            httpOk: boolean;
            instrumentsCount: number;
            status: number;
            textPreview: string;
          }>;
          baseUrl: string;
          jwtHost?: string;
          ok: boolean;
          storedSelectedAccountId: string;
        }
      >;
      probeInstrumentsForSelectedAccount: FunctionReference<
        "action",
        "internal",
        {
          organizationId: string;
          secretsKey: string;
          tokenStorage?: "raw" | "enc";
          userId: string;
        },
        {
          accNum: number;
          accountId: string;
          baseUrl: string;
          count?: number;
          error?: string;
          instruments?: any;
          instrumentsPreview?: any;
          ok: boolean;
          status?: number;
          textPreview?: string;
        }
      >;
      probeTradeConfig: FunctionReference<
        "action",
        "internal",
        {
          organizationId: string;
          secretsKey: string;
          tokenStorage?: "raw" | "enc";
          userId: string;
        },
        {
          accNum: number;
          baseUrl: string;
          error?: string;
          json?: any;
          ok: boolean;
          status?: number;
          textPreview?: string;
        }
      >;
      probeTradeConfigForAccNum: FunctionReference<
        "action",
        "internal",
        {
          accNum: number;
          organizationId: string;
          secretsKey: string;
          tokenStorage?: "raw" | "enc";
          userId: string;
        },
        {
          accNum: number;
          baseUrl: string;
          error?: string;
          json?: any;
          ok: boolean;
          status?: number;
          textPreview?: string;
        }
      >;
      probeTradeEndpointForAccount: FunctionReference<
        "action",
        "internal",
        {
          accNum: number;
          accountId: string;
          endpoint:
            | "state"
            | "positions"
            | "orders"
            | "ordersHistory"
            | "filledOrders"
            | "executions";
          organizationId: string;
          secretsKey: string;
          tokenStorage?: "raw" | "enc";
          userId: string;
        },
        {
          accNum: number;
          accountId: string;
          apiStatus?: string;
          attempts?: Array<any>;
          baseUrl: string;
          endpoint: string;
          error?: string;
          jsonPreview?: any;
          ok: boolean;
          pathUsed?: string;
          status?: number;
          textPreview?: string;
          tradeAccNum?: number;
          tradeAccountId?: string;
        }
      >;
      syncTradeLockerConnection: FunctionReference<
        "action",
        "internal",
        {
          limit?: number;
          organizationId: string;
          secretsKey: string;
          tokenStorage?: "raw" | "enc";
          userId: string;
        },
        {
          executionsNew: number;
          executionsUpserted: number;
          groupsTouched: number;
          ordersUpserted: number;
          tradeIdeaGroupIds: Array<string>;
        }
      >;
    };
    tradeIdeas: {
      analytics: {
        getSummary: FunctionReference<
          "query",
          "internal",
          {
            accountId?: string;
            limit?: number;
            organizationId: string;
            userId: string;
          },
          {
            avgLoss: number;
            avgWin: number;
            closedTrades: number;
            expectancy: number;
            openTrades: number;
            sampleSize: number;
            totalFees: number;
            totalPnl: number;
            winRate: number;
          }
        >;
        listByInstrument: FunctionReference<
          "query",
          "internal",
          {
            accountId?: string;
            limit?: number;
            organizationId: string;
            userId: string;
          },
          Array<{
            avgPnl: number;
            instrumentId: string;
            lastOpenedAt: number;
            symbol: string;
            totalPnl: number;
            trades: number;
            winRate: number;
          }>
        >;
        listCalendarDailyStats: FunctionReference<
          "query",
          "internal",
          {
            accountId?: string;
            daysBack?: number;
            organizationId: string;
            userId: string;
          },
          Array<{
            date: string;
            losses: number;
            pnl: number;
            unrealizedPnl?: number;
            wins: number;
          }>
        >;
        listCalendarRealizationEvents: FunctionReference<
          "query",
          "internal",
          {
            accountId?: string;
            daysBack?: number;
            organizationId: string;
            userId: string;
          },
          Array<{
            closePrice?: number;
            closeTradeId?: string;
            closedAt: number;
            commission?: number;
            direction: "long" | "short" | null;
            externalEventId: string;
            externalOrderId?: string;
            externalPositionId: string;
            fees?: number;
            instrumentId?: string;
            openAtMs?: number;
            openOrderId?: string;
            openPrice?: number;
            openTradeId?: string;
            orderType?: string;
            positionSide?: string;
            qtyClosed?: number;
            realizedPnl: number;
            swap?: number;
            symbol: string | null;
            tradableInstrumentId?: string;
            tradeIdeaGroupId?: string;
          }>
        >;
        listPositionRealizationEvents: FunctionReference<
          "query",
          "internal",
          {
            accountId: string;
            limit?: number;
            organizationId: string;
            positionId: string;
            userId: string;
          },
          Array<{
            closePrice?: number;
            closeTradeId?: string;
            closedAt: number;
            commission?: number;
            externalEventId: string;
            externalOrderId?: string;
            externalPositionId: string;
            fees?: number;
            instrumentId?: string;
            openAtMs?: number;
            openOrderId?: string;
            openPrice?: number;
            openTradeId?: string;
            orderType?: string;
            positionSide?: string;
            qtyClosed?: number;
            realizedPnl: number;
            swap?: number;
            tradableInstrumentId?: string;
            tradeIdeaGroupId?: string;
          }>
        >;
        listTradeIdeaRealizationEvents: FunctionReference<
          "query",
          "internal",
          {
            limit?: number;
            organizationId: string;
            tradeIdeaGroupId: string;
            userId: string;
          },
          Array<{
            closePrice?: number;
            closeTradeId?: string;
            closedAt: number;
            commission?: number;
            externalEventId: string;
            externalOrderId?: string;
            externalPositionId: string;
            fees?: number;
            instrumentId?: string;
            openAtMs?: number;
            openOrderId?: string;
            openPrice?: number;
            openTradeId?: string;
            orderType?: string;
            positionSide?: string;
            qtyClosed?: number;
            realizedPnl: number;
            swap?: number;
            tradableInstrumentId?: string;
            tradeIdeaGroupId?: string;
          }>
        >;
      };
      ideas: {
        backfillIdeasForUser: FunctionReference<
          "mutation",
          "internal",
          {
            limitAssigned?: number;
            organizationId: string;
            scanCap?: number;
            userId: string;
          },
          { assigned: number; createdIdeas: number; scanned: number }
        >;
        createTradeIdea: FunctionReference<
          "mutation",
          "internal",
          {
            bias: "long" | "short" | "neutral";
            instrumentId?: string;
            organizationId: string;
            symbol: string;
            tags?: Array<string>;
            thesis?: string;
            timeframe?: string;
            timeframeLabel?: string;
            userId: string;
          },
          { tradeIdeaId: string }
        >;
        debugExplainTradeIdeaGroupingForUser: FunctionReference<
          "query",
          "internal",
          { organizationId: string; scanCap?: number; userId: string },
          {
            decisions: Array<{
              derivedLastActivityAt: number;
              direction: "long" | "short";
              matchedIdeaId_byLastActivity?: string;
              matchedIdeaId_byOpenedAt?: string;
              note: string;
              openedAt: number;
              symbol: string;
              tradeIdeaGroupId: string;
            }>;
            groups: Array<{
              closedAt?: number;
              direction: "long" | "short";
              instrumentId?: string;
              lastExecutionAt?: number;
              openedAt: number;
              positionId: string;
              status: "open" | "closed";
              symbol: string;
              tradeIdeaGroupId: string;
              tradeIdeaId?: string;
            }>;
            ideas: Array<{
              bias: "long" | "short" | "neutral";
              lastActivityAt: number;
              openedAt: number;
              status: "active" | "closed";
              symbol: string;
              tradeIdeaId: string;
              updatedAt: number;
            }>;
            settings: {
              defaultTimeframe: string;
              groupingWindowMs: number;
              splitOnDirectionFlip: boolean;
            };
          }
        >;
        debugListRecentTradeIdeaPairs: FunctionReference<
          "query",
          "internal",
          { limit?: number },
          Array<{
            groups: number;
            ideas: number;
            organizationId: string;
            userId: string;
          }>
        >;
        getMyTradeIdeaDetail: FunctionReference<
          "query",
          "internal",
          {
            organizationId: string;
            positionsLimit?: number;
            tradeIdeaId: string;
            userId: string;
          },
          null | {
            bias: "long" | "short" | "neutral";
            expiresAt?: number;
            instrumentId?: string;
            lastActivityAt: number;
            openedAt: number;
            positions: Array<{
              closedAt?: number;
              direction: "long" | "short";
              fees?: number;
              instrumentId?: string;
              netQty: number;
              openedAt: number;
              realizedPnl?: number;
              status: "open" | "closed";
              symbol: string;
              tradeIdeaGroupId: string;
            }>;
            shareEnabledAt?: number;
            shareToken?: string;
            status: "active" | "closed";
            symbol: string;
            tags?: Array<string>;
            thesis?: string;
            timeframe: string;
            timeframeLabel?: string;
            tradeIdeaId: string;
            visibility: "private" | "link" | "public";
          }
        >;
        getMyTradeIdeaSettings: FunctionReference<
          "query",
          "internal",
          { organizationId: string; userId: string },
          {
            defaultTimeframe: string;
            groupingWindowMs: number;
            splitOnDirectionFlip: boolean;
          }
        >;
        getPublicTradeIdeaById: FunctionReference<
          "query",
          "internal",
          {
            code?: string;
            expectedUserId: string;
            organizationId: string;
            tradeIdeaId: string;
          },
          null | {
            bias: "long" | "short" | "neutral";
            expiresAt?: number;
            instrumentId?: string;
            lastActivityAt: number;
            openedAt: number;
            organizationId: string;
            positions: Array<{
              closedAt?: number;
              direction: "long" | "short";
              fees?: number;
              instrumentId?: string;
              netQty: number;
              openedAt: number;
              realizedPnl?: number;
              status: "open" | "closed";
              symbol: string;
              tradeIdeaGroupId: string;
            }>;
            shareToken?: string;
            status: "active" | "closed";
            symbol: string;
            tags?: Array<string>;
            thesis?: string;
            timeframe: string;
            timeframeLabel?: string;
            tradeIdeaId: string;
            userId: string;
            visibility: "private" | "link" | "public";
          }
        >;
        getSharedTradeIdeaByToken: FunctionReference<
          "query",
          "internal",
          { shareToken: string },
          null | {
            bias: "long" | "short" | "neutral";
            instrumentId?: string;
            lastActivityAt: number;
            openedAt: number;
            organizationId: string;
            positions: Array<{
              closedAt?: number;
              direction: "long" | "short";
              fees?: number;
              instrumentId?: string;
              netQty: number;
              openedAt: number;
              realizedPnl?: number;
              status: "open" | "closed";
              symbol: string;
              tradeIdeaGroupId: string;
            }>;
            status: "active" | "closed";
            symbol: string;
            tags?: Array<string>;
            thesis?: string;
            timeframe: string;
            timeframeLabel?: string;
            tradeIdeaId: string;
            userId: string;
            visibility: "private" | "link" | "public";
          }
        >;
        listMyTradeIdeas: FunctionReference<
          "query",
          "internal",
          { limit?: number; organizationId: string; userId: string },
          Array<{
            bias: "long" | "short" | "neutral";
            instrumentId?: string;
            lastActivityAt: number;
            openedAt: number;
            positionsCount: number;
            realizedPnl: number;
            status: "active" | "closed";
            symbol: string;
            tags?: Array<string>;
            thesis?: string;
            timeframe: string;
            timeframeLabel?: string;
            tradeIdeaId: string;
            updatedAt: number;
            visibility: "private" | "link" | "public";
          }>
        >;
        listPublicTradeIdeasForUser: FunctionReference<
          "query",
          "internal",
          { expectedUserId: string; limit?: number; organizationId: string },
          Array<{
            bias: "long" | "short" | "neutral";
            lastActivityAt: number;
            openedAt: number;
            status: "active" | "closed";
            symbol: string;
            timeframe: string;
            timeframeLabel?: string;
            tradeIdeaId: string;
          }>
        >;
        reconcileIdeasForUser: FunctionReference<
          "mutation",
          "internal",
          { organizationId: string; scanCap?: number; userId: string },
          {
            groupsReassigned: number;
            ideasDeleted: number;
            ideasPatched: number;
            ideasScanned: number;
          }
        >;
        setTradeIdeaSharing: FunctionReference<
          "mutation",
          "internal",
          {
            expiresAt?: number;
            organizationId: string;
            tradeIdeaId: string;
            userId: string;
            visibility: "private" | "link" | "public";
          },
          {
            ok: boolean;
            shareToken?: string;
            visibility: "private" | "link" | "public";
          }
        >;
        upsertMyTradeIdeaSettings: FunctionReference<
          "mutation",
          "internal",
          {
            defaultTimeframe?: string;
            groupingWindowMs: number;
            organizationId: string;
            splitOnDirectionFlip: boolean;
            userId: string;
          },
          null
        >;
      };
      internalQueries: {
        getGroupIdByPositionId: FunctionReference<
          "query",
          "internal",
          {
            accountId: string;
            organizationId: string;
            positionId: string;
            userId: string;
          },
          string | null
        >;
        getLatestGroupForSymbol: FunctionReference<
          "query",
          "internal",
          { organizationId: string; symbol: string; userId: string },
          {
            _creationTime: number;
            _id: string;
            accountId: string;
            avgEntryPrice?: number;
            closedAt?: number;
            connectionId: string;
            createdAt: number;
            direction: "long" | "short";
            discordChannelId?: string;
            discordChannelKind?: "mentors" | "members";
            discordLastSyncedAt?: number;
            discordMessageId?: string;
            fees?: number;
            ideaAssignedAt?: number;
            instrumentId?: string;
            lastExecutionAt?: number;
            lastProcessedExecutionId?: string;
            netQty: number;
            openedAt: number;
            organizationId: string;
            positionId?: string;
            realizedPnl?: number;
            status: "open" | "closed";
            symbol: string;
            tradeIdeaId?: string;
            updatedAt: number;
            userId: string;
          } | null
        >;
        getOpenGroupForSymbol: FunctionReference<
          "query",
          "internal",
          { organizationId: string; symbol: string; userId: string },
          {
            _creationTime: number;
            _id: string;
            accountId: string;
            avgEntryPrice?: number;
            closedAt?: number;
            connectionId: string;
            createdAt: number;
            direction: "long" | "short";
            discordChannelId?: string;
            discordChannelKind?: "mentors" | "members";
            discordLastSyncedAt?: number;
            discordMessageId?: string;
            fees?: number;
            ideaAssignedAt?: number;
            instrumentId?: string;
            lastExecutionAt?: number;
            lastProcessedExecutionId?: string;
            netQty: number;
            openedAt: number;
            organizationId: string;
            positionId?: string;
            realizedPnl?: number;
            status: "open" | "closed";
            symbol: string;
            tradeIdeaId?: string;
            updatedAt: number;
            userId: string;
          } | null
        >;
        hasAnyOpenGroup: FunctionReference<
          "query",
          "internal",
          { organizationId: string; userId: string },
          boolean
        >;
      };
      mutations: {
        markDiscordSynced: FunctionReference<
          "mutation",
          "internal",
          { tradeIdeaGroupId: string },
          null
        >;
        rebuildTradeIdeaForPosition: FunctionReference<
          "mutation",
          "internal",
          {
            accountId: string;
            connectionId: string;
            isOpen: boolean;
            organizationId: string;
            positionId: string;
            userId: string;
          },
          { executionsLinked: number; tradeIdeaGroupId: string }
        >;
        rebuildTradeIdeasForInstrument: FunctionReference<
          "mutation",
          "internal",
          {
            accountId: string;
            connectionId: string;
            instrumentId: string;
            organizationId: string;
            userId: string;
          },
          {
            episodesBuilt: number;
            eventsLinked: number;
            tradeIdeaGroupIds: Array<string>;
          }
        >;
        setDiscordMessageLink: FunctionReference<
          "mutation",
          "internal",
          {
            discordChannelId: string;
            discordChannelKind: "mentors" | "members";
            discordMessageId: string;
            tradeIdeaGroupId: string;
          },
          null
        >;
        upsertDiscordSymbolSnapshotFeed: FunctionReference<
          "mutation",
          "internal",
          {
            channelId: string;
            guildId: string;
            lastEditedAt?: number;
            lastError?: string;
            lastPostedAt?: number;
            messageId: string;
            organizationId: string;
            symbol: string;
          },
          null
        >;
        upsertTradeIdeaGroup: FunctionReference<
          "mutation",
          "internal",
          {
            accountId: string;
            avgEntryPrice?: number;
            closedAt?: number;
            connectionId: string;
            direction: "long" | "short";
            fees?: number;
            instrumentId?: string;
            lastExecutionAt?: number;
            lastProcessedExecutionId?: string;
            netQty: number;
            openedAt: number;
            organizationId: string;
            positionId: string;
            realizedPnl?: number;
            status: "open" | "closed";
            symbol: string;
            userId: string;
          },
          string
        >;
      };
      notes: {
        getNoteForGroup: FunctionReference<
          "query",
          "internal",
          { organizationId: string; tradeIdeaGroupId: string; userId: string },
          {
            _creationTime: number;
            _id: string;
            mistakes?: string;
            nextTime?: string;
            organizationId: string;
            outcome?: string;
            reviewStatus: "todo" | "reviewed";
            reviewedAt?: number;
            setup?: string;
            tags?: Array<string>;
            thesis?: string;
            tradeIdeaGroupId: string;
            updatedAt: number;
            userId: string;
          } | null
        >;
        listNextToReview: FunctionReference<
          "query",
          "internal",
          {
            accountId?: string;
            limit?: number;
            organizationId: string;
            userId: string;
          },
          Array<{
            closedAt: number;
            direction: "long" | "short";
            fees?: number;
            instrumentId?: string;
            noteUpdatedAt?: number;
            realizedPnl?: number;
            reviewStatus: "todo" | "reviewed";
            reviewedAt?: number;
            symbol: string;
            tradeIdeaGroupId: string;
          }>
        >;
        listRecentClosedWithReviewStatus: FunctionReference<
          "query",
          "internal",
          {
            accountId?: string;
            limit?: number;
            organizationId: string;
            userId: string;
          },
          Array<{
            closedAt: number;
            direction: "long" | "short";
            fees?: number;
            instrumentId?: string;
            noteUpdatedAt?: number;
            realizedPnl?: number;
            reviewStatus: "todo" | "reviewed";
            reviewedAt?: number;
            symbol: string;
            tradeIdeaGroupId: string;
          }>
        >;
        markReviewed: FunctionReference<
          "mutation",
          "internal",
          { organizationId: string; tradeIdeaGroupId: string; userId: string },
          string
        >;
        upsertNoteForGroup: FunctionReference<
          "mutation",
          "internal",
          {
            mistakes?: string;
            nextTime?: string;
            organizationId: string;
            outcome?: string;
            setup?: string;
            tags?: Array<string>;
            thesis?: string;
            tradeIdeaGroupId: string;
            userId: string;
          },
          string
        >;
      };
      queries: {
        getById: FunctionReference<
          "query",
          "internal",
          { tradeIdeaGroupId: string },
          {
            _creationTime: number;
            _id: string;
            accountId: string;
            avgEntryPrice?: number;
            closedAt?: number;
            connectionId: string;
            createdAt: number;
            direction: "long" | "short";
            discordChannelId?: string;
            discordChannelKind?: "mentors" | "members";
            discordLastSyncedAt?: number;
            discordMessageId?: string;
            fees?: number;
            ideaAssignedAt?: number;
            instrumentId?: string;
            lastExecutionAt?: number;
            lastProcessedExecutionId?: string;
            netQty: number;
            openedAt: number;
            organizationId: string;
            positionId?: string;
            realizedPnl?: number;
            status: "open" | "closed";
            symbol: string;
            tags?: Array<string>;
            thesis?: string;
            tradeIdeaId?: string;
            updatedAt: number;
            userId: string;
          } | null
        >;
        getDiscordSymbolSnapshotFeed: FunctionReference<
          "query",
          "internal",
          { organizationId: string; symbol: string },
          {
            _creationTime: number;
            _id: string;
            channelId: string;
            createdAt: number;
            guildId: string;
            lastEditedAt?: number;
            lastError?: string;
            lastPostedAt?: number;
            messageId: string;
            organizationId: string;
            symbol: string;
            updatedAt: number;
          } | null
        >;
        listByStatus: FunctionReference<
          "query",
          "internal",
          {
            organizationId: string;
            paginationOpts: {
              cursor: string | null;
              endCursor?: string | null;
              id?: number;
              maximumBytesRead?: number;
              maximumRowsRead?: number;
              numItems: number;
            };
            status: "open" | "closed";
            userId: string;
          },
          {
            continueCursor: string | null;
            isDone: boolean;
            page: Array<{
              _creationTime: number;
              _id: string;
              accountId: string;
              avgEntryPrice?: number;
              closedAt?: number;
              connectionId: string;
              createdAt: number;
              direction: "long" | "short";
              discordChannelId?: string;
              discordChannelKind?: "mentors" | "members";
              discordLastSyncedAt?: number;
              discordMessageId?: string;
              fees?: number;
              ideaAssignedAt?: number;
              instrumentId?: string;
              lastExecutionAt?: number;
              lastProcessedExecutionId?: string;
              netQty: number;
              openedAt: number;
              organizationId: string;
              positionId?: string;
              realizedPnl?: number;
              status: "open" | "closed";
              symbol: string;
              tags?: Array<string>;
              thesis?: string;
              tradeIdeaId?: string;
              updatedAt: number;
              userId: string;
            }>;
          }
        >;
        listEventsForGroup: FunctionReference<
          "query",
          "internal",
          {
            limit?: number;
            organizationId: string;
            tradeIdeaGroupId: string;
            userId: string;
          },
          Array<{
            _creationTime: number;
            _id: string;
            connectionId: string;
            createdAt: number;
            executedAt: number;
            externalExecutionId: string;
            externalOrderId?: string;
            externalPositionId?: string;
            organizationId: string;
            tradeIdeaGroupId: string;
            userId: string;
          }>
        >;
        listLatestForSymbol: FunctionReference<
          "query",
          "internal",
          {
            limit?: number;
            organizationId: string;
            symbol: string;
            userId: string;
          },
          Array<{
            _creationTime: number;
            _id: string;
            accountId: string;
            avgEntryPrice?: number;
            closedAt?: number;
            connectionId: string;
            createdAt: number;
            direction: "long" | "short";
            discordChannelId?: string;
            discordChannelKind?: "mentors" | "members";
            discordLastSyncedAt?: number;
            discordMessageId?: string;
            fees?: number;
            ideaAssignedAt?: number;
            instrumentId?: string;
            lastExecutionAt?: number;
            lastProcessedExecutionId?: string;
            netQty: number;
            openedAt: number;
            organizationId: string;
            positionId?: string;
            realizedPnl?: number;
            status: "open" | "closed";
            symbol: string;
            tags?: Array<string>;
            thesis?: string;
            tradeIdeaId?: string;
            updatedAt: number;
            userId: string;
          }>
        >;
        listOpenGroupsForOrgSymbol: FunctionReference<
          "query",
          "internal",
          { limit?: number; organizationId: string; symbol: string },
          Array<{
            avgEntryPrice?: number;
            direction: "long" | "short";
            netQty: number;
            openedAt: number;
            tradeIdeaGroupId: string;
            userId: string;
          }>
        >;
      };
    };
    tradingPlans: {
      index: {
        archiveTradingPlan: FunctionReference<
          "mutation",
          "internal",
          { organizationId: string; planId: string; userId: string },
          null
        >;
        createOrgTradingPlanFromTemplate: FunctionReference<
          "mutation",
          "internal",
          { createdByUserId: string; name?: string; organizationId: string },
          string
        >;
        createTradingPlanFromTemplate: FunctionReference<
          "mutation",
          "internal",
          { name?: string; organizationId: string; userId: string },
          string
        >;
        getActiveTradingPlan: FunctionReference<
          "query",
          "internal",
          { organizationId: string; userId: string },
          {
            _creationTime: number;
            _id: string;
            archivedAt?: number;
            createdAt: number;
            kpis: {
              adherencePct: number;
              avgRiskPerTradePct7d: number;
              journalCompliancePct: number;
              sessionDisciplinePct7d: number;
              violations7d: number;
            };
            markets: Array<string>;
            name: string;
            organizationId: string;
            risk: {
              maxDailyLossPct: number;
              maxOpenPositions: number;
              maxRiskPerTradePct: number;
              maxTradesPerDay: number;
              maxWeeklyLossPct: number;
            };
            rules: Array<{
              category: "Entry" | "Risk" | "Exit" | "Process" | "Psychology";
              description: string;
              id: string;
              severity: "hard" | "soft";
              title: string;
            }>;
            sessions: Array<{
              days: Array<string>;
              end: string;
              id: string;
              label: string;
              start: string;
              timezone: string;
            }>;
            strategySummary: string;
            updatedAt: number;
            userId: string;
            version: string;
          } | null
        >;
        getMyOrgTradingPlan: FunctionReference<
          "query",
          "internal",
          { organizationId: string; userId: string },
          {
            _creationTime: number;
            _id: string;
            archivedAt?: number;
            createdAt: number;
            createdByUserId: string;
            kpis: {
              adherencePct: number;
              avgRiskPerTradePct7d: number;
              journalCompliancePct: number;
              sessionDisciplinePct7d: number;
              violations7d: number;
            };
            markets: Array<string>;
            name: string;
            organizationId: string;
            risk: {
              maxDailyLossPct: number;
              maxOpenPositions: number;
              maxRiskPerTradePct: number;
              maxTradesPerDay: number;
              maxWeeklyLossPct: number;
            };
            rules: Array<{
              category: "Entry" | "Risk" | "Exit" | "Process" | "Psychology";
              description: string;
              id: string;
              severity: "hard" | "soft";
              title: string;
            }>;
            sessions: Array<{
              days: Array<string>;
              end: string;
              id: string;
              label: string;
              start: string;
              timezone: string;
            }>;
            strategySummary: string;
            updatedAt: number;
            version: string;
          } | null
        >;
        getOrgTradingPlan: FunctionReference<
          "query",
          "internal",
          { organizationId: string; planId: string },
          {
            _creationTime: number;
            _id: string;
            archivedAt?: number;
            createdAt: number;
            createdByUserId: string;
            kpis: {
              adherencePct: number;
              avgRiskPerTradePct7d: number;
              journalCompliancePct: number;
              sessionDisciplinePct7d: number;
              violations7d: number;
            };
            markets: Array<string>;
            name: string;
            organizationId: string;
            risk: {
              maxDailyLossPct: number;
              maxOpenPositions: number;
              maxRiskPerTradePct: number;
              maxTradesPerDay: number;
              maxWeeklyLossPct: number;
            };
            rules: Array<{
              category: "Entry" | "Risk" | "Exit" | "Process" | "Psychology";
              description: string;
              id: string;
              severity: "hard" | "soft";
              title: string;
            }>;
            sessions: Array<{
              days: Array<string>;
              end: string;
              id: string;
              label: string;
              start: string;
              timezone: string;
            }>;
            strategySummary: string;
            updatedAt: number;
            version: string;
          } | null
        >;
        getOrgTradingPlanPolicy: FunctionReference<
          "query",
          "internal",
          { organizationId: string },
          {
            allowedPlanIds: Array<string>;
            forcedPlanId: string | null;
            updatedAt: number | null;
            updatedByUserId: string | null;
          }
        >;
        getTradingPlan: FunctionReference<
          "query",
          "internal",
          { organizationId: string; planId: string; userId: string },
          {
            _creationTime: number;
            _id: string;
            archivedAt?: number;
            createdAt: number;
            kpis: {
              adherencePct: number;
              avgRiskPerTradePct7d: number;
              journalCompliancePct: number;
              sessionDisciplinePct7d: number;
              violations7d: number;
            };
            markets: Array<string>;
            name: string;
            organizationId: string;
            risk: {
              maxDailyLossPct: number;
              maxOpenPositions: number;
              maxRiskPerTradePct: number;
              maxTradesPerDay: number;
              maxWeeklyLossPct: number;
            };
            rules: Array<{
              category: "Entry" | "Risk" | "Exit" | "Process" | "Psychology";
              description: string;
              id: string;
              severity: "hard" | "soft";
              title: string;
            }>;
            sessions: Array<{
              days: Array<string>;
              end: string;
              id: string;
              label: string;
              start: string;
              timezone: string;
            }>;
            strategySummary: string;
            updatedAt: number;
            userId: string;
            version: string;
          } | null
        >;
        listOrgTradingPlans: FunctionReference<
          "query",
          "internal",
          { includeArchived?: boolean; limit?: number; organizationId: string },
          Array<{
            _id: string;
            archivedAt?: number;
            createdAt: number;
            name: string;
            updatedAt: number;
            version: string;
          }>
        >;
        listTradingPlans: FunctionReference<
          "query",
          "internal",
          {
            includeArchived?: boolean;
            limit?: number;
            organizationId: string;
            userId: string;
          },
          Array<{
            _id: string;
            archivedAt?: number;
            createdAt: number;
            name: string;
            updatedAt: number;
            version: string;
          }>
        >;
        setActiveTradingPlan: FunctionReference<
          "mutation",
          "internal",
          { organizationId: string; planId: string; userId: string },
          null
        >;
        setMyOrgTradingPlan: FunctionReference<
          "mutation",
          "internal",
          { organizationId: string; planId: string; userId: string },
          null
        >;
        setOrgTradingPlanPolicy: FunctionReference<
          "mutation",
          "internal",
          {
            allowedPlanIds: Array<string>;
            forcedPlanId?: string | null;
            organizationId: string;
            updatedByUserId: string;
          },
          null
        >;
      };
    };
    visibility: {
      getMyVisibilitySettings: FunctionReference<
        "query",
        "internal",
        { organizationId: string; userId: string },
        {
          analyticsReportsPublic: boolean;
          globalPublic: boolean;
          ordersPublic: boolean;
          positionsPublic: boolean;
          profilePublic: boolean;
          tradeIdeasPublic: boolean;
        }
      >;
      upsertMyVisibilitySettings: FunctionReference<
        "mutation",
        "internal",
        {
          analyticsReportsPublic: boolean;
          globalPublic: boolean;
          ordersPublic: boolean;
          organizationId: string;
          positionsPublic: boolean;
          profilePublic: boolean;
          tradeIdeasPublic: boolean;
          userId: string;
        },
        null
      >;
    };
  };
};
