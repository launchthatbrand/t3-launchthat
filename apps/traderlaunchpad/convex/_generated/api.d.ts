/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accessPolicy from "../accessPolicy.js";
import type * as auth_exchange from "../auth/exchange.js";
import type * as auth_sessions from "../auth/sessions.js";
import type * as coreTenant_mutations from "../coreTenant/mutations.js";
import type * as coreTenant_organizations from "../coreTenant/organizations.js";
import type * as coreTenant_platformUsers from "../coreTenant/platformUsers.js";
import type * as coreTenant_queries from "../coreTenant/queries.js";
import type * as crons from "../crons.js";
import type * as discord_actions from "../discord/actions.js";
import type * as discord_automations from "../discord/automations.js";
import type * as discord_mutations from "../discord/mutations.js";
import type * as discord_queries from "../discord/queries.js";
import type * as email_actions from "../email/actions.js";
import type * as email_mutations from "../email/mutations.js";
import type * as email_queries from "../email/queries.js";
import type * as feedback_mutations from "../feedback/mutations.js";
import type * as feedback_queries from "../feedback/queries.js";
import type * as flags from "../flags.js";
import type * as http from "../http.js";
import type * as lib_clickhouseHttp from "../lib/clickhouseHttp.js";
import type * as notifications_mutations from "../notifications/mutations.js";
import type * as notifications_queries from "../notifications/queries.js";
import type * as notifications_test from "../notifications/test.js";
import type * as onboarding_mutations from "../onboarding/mutations.js";
import type * as onboarding_queries from "../onboarding/queries.js";
import type * as platform_affiliates from "../platform/affiliates.js";
import type * as platform_brokerConnections from "../platform/brokerConnections.js";
import type * as platform_brokerConnectionsActions from "../platform/brokerConnectionsActions.js";
import type * as platform_clickhouseCandles from "../platform/clickhouseCandles.js";
import type * as platform_clickhouseData from "../platform/clickhouseData.js";
import type * as platform_clickhouseDataInternalActions from "../platform/clickhouseDataInternalActions.js";
import type * as platform_crm from "../platform/crm.js";
import type * as platform_joinCodes from "../platform/joinCodes.js";
import type * as platform_newsAdmin from "../platform/newsAdmin.js";
import type * as platform_newsLogs from "../platform/newsLogs.js";
import type * as platform_newsParsingSettings from "../platform/newsParsingSettings.js";
import type * as platform_newsSchedulerInternal from "../platform/newsSchedulerInternal.js";
import type * as platform_newsSymbolUniverse from "../platform/newsSymbolUniverse.js";
import type * as platform_newsSymbolUniverseInternalQueries from "../platform/newsSymbolUniverseInternalQueries.js";
import type * as platform_priceDataAccountPolicies from "../platform/priceDataAccountPolicies.js";
import type * as platform_priceDataJobs from "../platform/priceDataJobs.js";
import type * as platform_priceDataJobsInternalActions from "../platform/priceDataJobsInternalActions.js";
import type * as platform_priceDataJobsInternalMutations from "../platform/priceDataJobsInternalMutations.js";
import type * as platform_priceDataLogs from "../platform/priceDataLogs.js";
import type * as platform_priceDataLogsInternalMutations from "../platform/priceDataLogsInternalMutations.js";
import type * as platform_priceDataSyncInternalMutations from "../platform/priceDataSyncInternalMutations.js";
import type * as platform_priceDataSyncInternalQueries from "../platform/priceDataSyncInternalQueries.js";
import type * as platform_priceDataSyncRules from "../platform/priceDataSyncRules.js";
import type * as platform_priceDataSyncSchedulerInternal from "../platform/priceDataSyncSchedulerInternal.js";
import type * as platform_priceDataSyncStatus from "../platform/priceDataSyncStatus.js";
import type * as platform_priceDataWorkflow from "../platform/priceDataWorkflow.js";
import type * as platform_queries from "../platform/queries.js";
import type * as platform_test_helpers from "../platform/test/helpers.js";
import type * as platform_test_mutations from "../platform/test/mutations.js";
import type * as platform_test_queries from "../platform/test/queries.js";
import type * as platform_tests from "../platform/tests.js";
import type * as platform_testsAuth from "../platform/testsAuth.js";
import type * as platform_testsDebug from "../platform/testsDebug.js";
import type * as platform_testsQueries from "../platform/testsQueries.js";
import type * as platform_tradelockerSources from "../platform/tradelockerSources.js";
import type * as platform_tradingviewConnections from "../platform/tradingviewConnections.js";
import type * as platform_tradingviewConnectionsActions from "../platform/tradingviewConnectionsActions.js";
import type * as platform_userAccess from "../platform/userAccess.js";
import type * as publicProfiles_types from "../publicProfiles/types.js";
import type * as publicProfiles from "../publicProfiles.js";
import type * as pushSubscriptions_actions from "../pushSubscriptions/actions.js";
import type * as pushSubscriptions_internalActions from "../pushSubscriptions/internalActions.js";
import type * as pushSubscriptions_mutations from "../pushSubscriptions/mutations.js";
import type * as pushSubscriptions_queries from "../pushSubscriptions/queries.js";
import type * as shortlinks_mutations from "../shortlinks/mutations.js";
import type * as shortlinks_queries from "../shortlinks/queries.js";
import type * as traderlaunchpad_actions from "../traderlaunchpad/actions.js";
import type * as traderlaunchpad_affiliates from "../traderlaunchpad/affiliates.js";
import type * as traderlaunchpad_autosync from "../traderlaunchpad/autosync.js";
import type * as traderlaunchpad_debug from "../traderlaunchpad/debug.js";
import type * as traderlaunchpad_lib_resolve from "../traderlaunchpad/lib/resolve.js";
import type * as traderlaunchpad_mutations from "../traderlaunchpad/mutations.js";
import type * as traderlaunchpad_public from "../traderlaunchpad/public.js";
import type * as traderlaunchpad_queries from "../traderlaunchpad/queries.js";
import type * as traderlaunchpad_types from "../traderlaunchpad/types.js";
import type * as userMedia from "../userMedia.js";
import type * as viewer_mutations from "../viewer/mutations.js";
import type * as viewer_queries from "../viewer/queries.js";
import type * as widgets_auth from "../widgets/auth.js";
import type * as widgets_data from "../widgets/data.js";
import type * as widgets_installations from "../widgets/installations.js";
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
  accessPolicy: typeof accessPolicy;
  "auth/exchange": typeof auth_exchange;
  "auth/sessions": typeof auth_sessions;
  "coreTenant/mutations": typeof coreTenant_mutations;
  "coreTenant/organizations": typeof coreTenant_organizations;
  "coreTenant/platformUsers": typeof coreTenant_platformUsers;
  "coreTenant/queries": typeof coreTenant_queries;
  crons: typeof crons;
  "discord/actions": typeof discord_actions;
  "discord/automations": typeof discord_automations;
  "discord/mutations": typeof discord_mutations;
  "discord/queries": typeof discord_queries;
  "email/actions": typeof email_actions;
  "email/mutations": typeof email_mutations;
  "email/queries": typeof email_queries;
  "feedback/mutations": typeof feedback_mutations;
  "feedback/queries": typeof feedback_queries;
  flags: typeof flags;
  http: typeof http;
  "lib/clickhouseHttp": typeof lib_clickhouseHttp;
  "notifications/mutations": typeof notifications_mutations;
  "notifications/queries": typeof notifications_queries;
  "notifications/test": typeof notifications_test;
  "onboarding/mutations": typeof onboarding_mutations;
  "onboarding/queries": typeof onboarding_queries;
  "platform/affiliates": typeof platform_affiliates;
  "platform/brokerConnections": typeof platform_brokerConnections;
  "platform/brokerConnectionsActions": typeof platform_brokerConnectionsActions;
  "platform/clickhouseCandles": typeof platform_clickhouseCandles;
  "platform/clickhouseData": typeof platform_clickhouseData;
  "platform/clickhouseDataInternalActions": typeof platform_clickhouseDataInternalActions;
  "platform/crm": typeof platform_crm;
  "platform/joinCodes": typeof platform_joinCodes;
  "platform/newsAdmin": typeof platform_newsAdmin;
  "platform/newsLogs": typeof platform_newsLogs;
  "platform/newsParsingSettings": typeof platform_newsParsingSettings;
  "platform/newsSchedulerInternal": typeof platform_newsSchedulerInternal;
  "platform/newsSymbolUniverse": typeof platform_newsSymbolUniverse;
  "platform/newsSymbolUniverseInternalQueries": typeof platform_newsSymbolUniverseInternalQueries;
  "platform/priceDataAccountPolicies": typeof platform_priceDataAccountPolicies;
  "platform/priceDataJobs": typeof platform_priceDataJobs;
  "platform/priceDataJobsInternalActions": typeof platform_priceDataJobsInternalActions;
  "platform/priceDataJobsInternalMutations": typeof platform_priceDataJobsInternalMutations;
  "platform/priceDataLogs": typeof platform_priceDataLogs;
  "platform/priceDataLogsInternalMutations": typeof platform_priceDataLogsInternalMutations;
  "platform/priceDataSyncInternalMutations": typeof platform_priceDataSyncInternalMutations;
  "platform/priceDataSyncInternalQueries": typeof platform_priceDataSyncInternalQueries;
  "platform/priceDataSyncRules": typeof platform_priceDataSyncRules;
  "platform/priceDataSyncSchedulerInternal": typeof platform_priceDataSyncSchedulerInternal;
  "platform/priceDataSyncStatus": typeof platform_priceDataSyncStatus;
  "platform/priceDataWorkflow": typeof platform_priceDataWorkflow;
  "platform/queries": typeof platform_queries;
  "platform/test/helpers": typeof platform_test_helpers;
  "platform/test/mutations": typeof platform_test_mutations;
  "platform/test/queries": typeof platform_test_queries;
  "platform/tests": typeof platform_tests;
  "platform/testsAuth": typeof platform_testsAuth;
  "platform/testsDebug": typeof platform_testsDebug;
  "platform/testsQueries": typeof platform_testsQueries;
  "platform/tradelockerSources": typeof platform_tradelockerSources;
  "platform/tradingviewConnections": typeof platform_tradingviewConnections;
  "platform/tradingviewConnectionsActions": typeof platform_tradingviewConnectionsActions;
  "platform/userAccess": typeof platform_userAccess;
  "publicProfiles/types": typeof publicProfiles_types;
  publicProfiles: typeof publicProfiles;
  "pushSubscriptions/actions": typeof pushSubscriptions_actions;
  "pushSubscriptions/internalActions": typeof pushSubscriptions_internalActions;
  "pushSubscriptions/mutations": typeof pushSubscriptions_mutations;
  "pushSubscriptions/queries": typeof pushSubscriptions_queries;
  "shortlinks/mutations": typeof shortlinks_mutations;
  "shortlinks/queries": typeof shortlinks_queries;
  "traderlaunchpad/actions": typeof traderlaunchpad_actions;
  "traderlaunchpad/affiliates": typeof traderlaunchpad_affiliates;
  "traderlaunchpad/autosync": typeof traderlaunchpad_autosync;
  "traderlaunchpad/debug": typeof traderlaunchpad_debug;
  "traderlaunchpad/lib/resolve": typeof traderlaunchpad_lib_resolve;
  "traderlaunchpad/mutations": typeof traderlaunchpad_mutations;
  "traderlaunchpad/public": typeof traderlaunchpad_public;
  "traderlaunchpad/queries": typeof traderlaunchpad_queries;
  "traderlaunchpad/types": typeof traderlaunchpad_types;
  userMedia: typeof userMedia;
  "viewer/mutations": typeof viewer_mutations;
  "viewer/queries": typeof viewer_queries;
  "widgets/auth": typeof widgets_auth;
  "widgets/data": typeof widgets_data;
  "widgets/installations": typeof widgets_installations;
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
  launchthat_core_tenant: {
    mutations: {
      createOrganization: FunctionReference<
        "mutation",
        "internal",
        {
          description?: string;
          logo?: string;
          logoMediaId?: string;
          name: string;
          slug?: string;
          userId: string;
        },
        string
      >;
      createOrganizationMedia: FunctionReference<
        "mutation",
        "internal",
        {
          contentType: string;
          filename?: string;
          organizationId: string;
          size: number;
          storageId: string;
          uploadedByUserId: string;
        },
        string
      >;
      deleteOrganizationMedia: FunctionReference<
        "mutation",
        "internal",
        { mediaId: string },
        null
      >;
      ensureMembership: FunctionReference<
        "mutation",
        "internal",
        {
          organizationId: string;
          role?: "owner" | "admin" | "editor" | "viewer" | "student";
          setActive?: boolean;
          userId: string;
        },
        null
      >;
      generateOrganizationMediaUploadUrl: FunctionReference<
        "mutation",
        "internal",
        { organizationId: string },
        string
      >;
      removeMembership: FunctionReference<
        "mutation",
        "internal",
        { organizationId: string; userId: string },
        null
      >;
      removeOrganizationDomain: FunctionReference<
        "mutation",
        "internal",
        { appKey: string; hostname: string; organizationId: string },
        null
      >;
      setActiveOrganizationForUser: FunctionReference<
        "mutation",
        "internal",
        { organizationId: string; userId: string },
        null
      >;
      setOrganizationDomainStatus: FunctionReference<
        "mutation",
        "internal",
        {
          appKey: string;
          hostname: string;
          lastError?: string;
          organizationId: string;
          records?: Array<{ name: string; type: string; value: string }>;
          status: "unconfigured" | "pending" | "verified" | "error";
        },
        null
      >;
      updateOrganization: FunctionReference<
        "mutation",
        "internal",
        {
          description?: string;
          logo?: string | null;
          logoMediaId?: string | null;
          name?: string;
          organizationId: string;
          slug?: string;
        },
        null
      >;
      updateOrganizationPublicProfileConfig: FunctionReference<
        "mutation",
        "internal",
        {
          config: null | {
            heroCtas?: Array<{
              id: string;
              label: string;
              url: string;
              variant?: "primary" | "outline";
            }>;
            links: Array<{ label: string; url: string }>;
            logoCrop?: { x: number; y: number };
            sections: Array<{
              enabled: boolean;
              id: string;
              kind: "hero" | "about" | "links" | "stats";
            }>;
            version: "v1";
          };
          organizationId: string;
        },
        null
      >;
      upsertOrganizationDomain: FunctionReference<
        "mutation",
        "internal",
        {
          appKey: string;
          hostname: string;
          organizationId: string;
          status?: "unconfigured" | "pending" | "verified" | "error";
        },
        null
      >;
    };
    queries: {
      getOrganizationByHostname: FunctionReference<
        "query",
        "internal",
        { appKey: string; hostname: string; requireVerified?: boolean },
        null | {
          _creationTime: number;
          _id: string;
          clerkOrganizationId?: string;
          createdAt?: number;
          description?: string;
          logo?: string;
          logoMediaId?: string;
          name: string;
          ownerId: string;
          publicProfileConfig?: {
            heroCtas?: Array<{
              id: string;
              label: string;
              url: string;
              variant?: "primary" | "outline";
            }>;
            links: Array<{ label: string; url: string }>;
            logoCrop?: { x: number; y: number };
            sections: Array<{
              enabled: boolean;
              id: string;
              kind: "hero" | "about" | "links" | "stats";
            }>;
            version: "v1";
          };
          slug: string;
          updatedAt?: number;
        }
      >;
      getOrganizationById: FunctionReference<
        "query",
        "internal",
        { organizationId: string },
        null | {
          _creationTime: number;
          _id: string;
          clerkOrganizationId?: string;
          createdAt?: number;
          description?: string;
          logo?: string;
          logoMediaId?: string;
          name: string;
          ownerId: string;
          publicProfileConfig?: {
            heroCtas?: Array<{
              id: string;
              label: string;
              url: string;
              variant?: "primary" | "outline";
            }>;
            links: Array<{ label: string; url: string }>;
            logoCrop?: { x: number; y: number };
            sections: Array<{
              enabled: boolean;
              id: string;
              kind: "hero" | "about" | "links" | "stats";
            }>;
            version: "v1";
          };
          slug: string;
          updatedAt?: number;
        }
      >;
      getOrganizationBySlug: FunctionReference<
        "query",
        "internal",
        { slug: string },
        null | {
          _creationTime: number;
          _id: string;
          clerkOrganizationId?: string;
          createdAt?: number;
          description?: string;
          logo?: string;
          logoMediaId?: string;
          name: string;
          ownerId: string;
          publicProfileConfig?: {
            heroCtas?: Array<{
              id: string;
              label: string;
              url: string;
              variant?: "primary" | "outline";
            }>;
            links: Array<{ label: string; url: string }>;
            logoCrop?: { x: number; y: number };
            sections: Array<{
              enabled: boolean;
              id: string;
              kind: "hero" | "about" | "links" | "stats";
            }>;
            version: "v1";
          };
          slug: string;
          updatedAt?: number;
        }
      >;
      getOrganizationMediaById: FunctionReference<
        "query",
        "internal",
        { mediaId: string },
        null | {
          _creationTime: number;
          _id: string;
          contentType: string;
          createdAt: number;
          filename?: string;
          organizationId: string;
          size: number;
          storageId: string;
          updatedAt: number;
          uploadedByUserId: string;
          url: string | null;
        }
      >;
      listDomainsForOrg: FunctionReference<
        "query",
        "internal",
        { appKey?: string; organizationId: string },
        Array<{
          _creationTime: number;
          _id: string;
          appKey: string;
          createdAt: number;
          hostname: string;
          lastError?: string;
          organizationId: string;
          records?: Array<{ name: string; type: string; value: string }>;
          status: "unconfigured" | "pending" | "verified" | "error";
          updatedAt: number;
          verifiedAt?: number;
        }>
      >;
      listMembersByOrganizationId: FunctionReference<
        "query",
        "internal",
        { organizationId: string },
        Array<{ isActive: boolean; role: string; userId: string }>
      >;
      listOrganizationMedia: FunctionReference<
        "query",
        "internal",
        { limit?: number; organizationId: string },
        Array<{
          _creationTime: number;
          _id: string;
          contentType: string;
          createdAt: number;
          filename?: string;
          organizationId: string;
          size: number;
          storageId: string;
          updatedAt: number;
          uploadedByUserId: string;
          url: string | null;
        }>
      >;
      listOrganizations: FunctionReference<
        "query",
        "internal",
        { limit?: number; search?: string },
        Array<{
          _creationTime: number;
          _id: string;
          clerkOrganizationId?: string;
          createdAt?: number;
          description?: string;
          logo?: string;
          logoMediaId?: string;
          name: string;
          ownerId: string;
          publicProfileConfig?: {
            heroCtas?: Array<{
              id: string;
              label: string;
              url: string;
              variant?: "primary" | "outline";
            }>;
            links: Array<{ label: string; url: string }>;
            logoCrop?: { x: number; y: number };
            sections: Array<{
              enabled: boolean;
              id: string;
              kind: "hero" | "about" | "links" | "stats";
            }>;
            version: "v1";
          };
          slug: string;
          updatedAt?: number;
        }>
      >;
      listOrganizationsByUserId: FunctionReference<
        "query",
        "internal",
        { userId: string },
        Array<{
          isActive: boolean;
          org: {
            _id: string;
            logoUrl: string | null;
            name: string;
            slug: string;
          };
          organizationId: string;
          role: string;
        }>
      >;
      listOrganizationsPublic: FunctionReference<
        "query",
        "internal",
        { includePlatform?: boolean; limit?: number; search?: string },
        Array<{
          _id: string;
          description?: string;
          logoUrl: string | null;
          name: string;
          slug: string;
        }>
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
  launchthat_notifications: {
    mutations: {
      createNotification: FunctionReference<
        "mutation",
        "internal",
        {
          actionUrl?: string;
          content?: string;
          eventKey: string;
          orgId: string;
          tabKey?: string;
          title: string;
          userId: string;
        },
        null | string
      >;
      createNotificationOnce: FunctionReference<
        "mutation",
        "internal",
        {
          actionUrl?: string;
          content?: string;
          eventKey: string;
          orgId: string;
          tabKey?: string;
          title: string;
          userId: string;
        },
        null | string
      >;
      markAllNotificationsAsReadByUserId: FunctionReference<
        "mutation",
        "internal",
        { userId: string },
        number
      >;
      markAllNotificationsAsReadByUserIdAndOrgId: FunctionReference<
        "mutation",
        "internal",
        { orgId: string; userId: string },
        number
      >;
      markNotificationAsRead: FunctionReference<
        "mutation",
        "internal",
        { notificationId: string },
        boolean
      >;
      trackNotificationEvent: FunctionReference<
        "mutation",
        "internal",
        {
          channel: string;
          eventType: string;
          notificationId: string;
          targetUrl?: string;
          userId: string;
        },
        null
      >;
    };
    queries: {
      getDeliveryTogglesForUserEvent: FunctionReference<
        "query",
        "internal",
        { eventKey: string; orgId: string; userId: string },
        {
          orgEmailDefault: boolean | null;
          orgInAppDefault: boolean | null;
          userEmailOverride: boolean | null;
          userInAppOverride: boolean | null;
        }
      >;
      getEventsAnalyticsSummary: FunctionReference<
        "query",
        "internal",
        { daysBack?: number; maxRows?: number },
        {
          eventKeyMetrics: Array<{
            ctrPct: number;
            eventKey: string;
            interactions: number;
            sent: number;
          }>;
          fromCreatedAt: number;
          interactions: {
            byChannelAndType: Array<{
              channel: string;
              count: number;
              eventType: string;
            }>;
            byEventKey: Array<{ count: number; eventKey: string }>;
            events: number;
            uniqueNotifications: number;
            uniqueUsers: number;
          };
          interactionsByChannelDaily: Array<{
            date: string;
            email: number;
            inApp: number;
            other: number;
            push: number;
          }>;
          sent: {
            byEventKey: Array<{ count: number; eventKey: string }>;
            notifications: number;
          };
          timeSeriesDaily: Array<{
            ctrPct: number;
            date: string;
            interactions: number;
            sent: number;
          }>;
        }
      >;
      getUnreadCountByUserIdAcrossOrgs: FunctionReference<
        "query",
        "internal",
        { userId: string },
        number
      >;
      getUnreadCountByUserIdAndOrgId: FunctionReference<
        "query",
        "internal",
        { orgId: string; userId: string },
        number
      >;
      paginateByUserIdAcrossOrgs: FunctionReference<
        "query",
        "internal",
        {
          filters?: { eventKey?: string; tabKey?: string };
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
        { continueCursor: string | null; isDone: boolean; page: Array<any> }
      >;
      paginateByUserIdAndOrgId: FunctionReference<
        "query",
        "internal",
        {
          filters?: { eventKey?: string; tabKey?: string };
          orgId: string;
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
        { continueCursor: string | null; isDone: boolean; page: Array<any> }
      >;
    };
  };
  launchthat_push: {
    mutations: {
      deleteMyPushSubscription: FunctionReference<
        "mutation",
        "internal",
        { endpoint?: string },
        null
      >;
      upsertMyPushSubscription: FunctionReference<
        "mutation",
        "internal",
        {
          subscription: {
            endpoint: string;
            expirationTime?: number | null;
            keys: { auth: string; p256dh: string };
          };
        },
        null
      >;
    };
    queries: {
      getMySubscriptionRowId: FunctionReference<
        "query",
        "internal",
        {},
        string | null
      >;
      listMySubscriptions: FunctionReference<
        "query",
        "internal",
        {},
        Array<{
          auth: string;
          endpoint: string;
          expirationTime?: number | null;
          p256dh: string;
        }>
      >;
      listSubscriptionsByUserId: FunctionReference<
        "query",
        "internal",
        { userId: string },
        Array<{
          auth: string;
          endpoint: string;
          expirationTime?: number | null;
          p256dh: string;
        }>
      >;
    };
  };
  launchthat_email: {
    actions: {
      syncEmailDomain: FunctionReference<
        "action",
        "internal",
        { orgId: string },
        {
          emailDomain: string | null;
          lastError?: string;
          records: Array<{ name: string; type: string; value: string }>;
          status: "unconfigured" | "pending" | "verified" | "error";
          updatedAt: number;
        }
      >;
    };
    delivery: {
      emailSink: {
        sendTransactionalEmail: FunctionReference<
          "mutation",
          "internal",
          {
            orgId: string;
            templateKey: string;
            to: string;
            variables: Record<string, string>;
          },
          string
        >;
      };
    };
    mutations: {
      enqueueEmail: FunctionReference<
        "mutation",
        "internal",
        {
          htmlBody: string;
          orgId: string;
          subject: string;
          templateKey?: string;
          textBody: string;
          to: string;
        },
        string
      >;
      enqueueTestEmail: FunctionReference<
        "mutation",
        "internal",
        { orgId: string; to: string },
        string
      >;
      setEmailDomain: FunctionReference<
        "mutation",
        "internal",
        { domain?: string; orgId: string },
        null
      >;
      upsertEmailSettings: FunctionReference<
        "mutation",
        "internal",
        {
          designKey?: "clean" | "bold" | "minimal";
          enabled: boolean;
          fromLocalPart: string;
          fromMode: "portal" | "custom";
          fromName: string;
          orgId: string;
          replyToEmail?: string;
        },
        null
      >;
    };
    queries: {
      getEmailDomain: FunctionReference<
        "query",
        "internal",
        { orgId: string },
        null | {
          domain: string | null;
          lastError?: string;
          records: Array<{ name: string; type: string; value: string }>;
          status: "unconfigured" | "pending" | "verified" | "error";
          updatedAt: number;
        }
      >;
      getEmailSettings: FunctionReference<
        "query",
        "internal",
        { orgId: string },
        null | {
          designKey?: "clean" | "bold" | "minimal";
          enabled: boolean;
          fromLocalPart: string;
          fromMode: "portal" | "custom";
          fromName: string;
          replyToEmail: string | null;
        }
      >;
      listOutbox: FunctionReference<
        "query",
        "internal",
        {
          orgId: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        { continueCursor: string | null; isDone: boolean; page: Array<any> }
      >;
    };
  };
  launchthat_feedback: {
    mutations: {
      addComment: FunctionReference<
        "mutation",
        "internal",
        { authorUserId: string; body: string; threadId: string },
        string
      >;
      createThread: FunctionReference<
        "mutation",
        "internal",
        {
          authorUserId: string;
          boardId: string;
          body: string;
          title: string;
          type?: "feedback" | "issue";
        },
        string
      >;
      toggleUpvote: FunctionReference<
        "mutation",
        "internal",
        { threadId: string; userId: string },
        { upvoteCount: number; upvoted: boolean }
      >;
    };
    queries: {
      getThreadWithViewer: FunctionReference<
        "query",
        "internal",
        { threadId: string; userId: string },
        null | any
      >;
      listComments: FunctionReference<
        "query",
        "internal",
        { limit?: number; threadId: string },
        Array<any>
      >;
      listThreadsForUser: FunctionReference<
        "query",
        "internal",
        {
          boardId: string;
          limit?: number;
          sort?: "trending" | "new";
          type?: "feedback" | "issue";
          userId: string;
        },
        Array<any>
      >;
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
    queries: {
      getCrmDashboardMetrics: FunctionReference<
        "query",
        "internal",
        { limit?: number },
        {
          contacts: { isTruncated: boolean; total: number };
          tagAssignments: { isTruncated: boolean; total: number };
          tags: { isTruncated: boolean; total: number };
        }
      >;
    };
  };
  launchthat_joincodes: {
    mutations: {
      createJoinCode: FunctionReference<
        "mutation",
        "internal",
        {
          code?: string;
          createdByUserId: string;
          expiresAt?: number;
          grants?: any;
          label?: string;
          maxUses?: number;
          organizationId?: string;
          permissions?: {
            globalEnabled?: boolean;
            openPositionsEnabled?: boolean;
            ordersEnabled?: boolean;
            tradeIdeasEnabled?: boolean;
          };
          role?: "user" | "staff" | "admin";
          scope: "platform" | "organization";
          tier?: "free" | "standard" | "pro";
        },
        { code: string; codeHash: string; joinCodeId: string }
      >;
      deactivateJoinCode: FunctionReference<
        "mutation",
        "internal",
        { joinCodeId: string },
        null
      >;
      deleteJoinCode: FunctionReference<
        "mutation",
        "internal",
        { joinCodeId: string },
        null
      >;
      redeemJoinCode: FunctionReference<
        "mutation",
        "internal",
        { code: string; redeemedByUserId: string },
        {
          expiresAt?: number;
          grants?: any;
          joinCodeId: string;
          label?: string;
          maxUses?: number;
          organizationId?: string;
          permissions?: {
            globalEnabled?: boolean;
            openPositionsEnabled?: boolean;
            ordersEnabled?: boolean;
            tradeIdeasEnabled?: boolean;
          };
          role?: "user" | "staff" | "admin";
          scope: "platform" | "organization";
          tier?: "free" | "standard" | "pro";
          uses: number;
        } | null
      >;
    };
    queries: {
      listJoinCodes: FunctionReference<
        "query",
        "internal",
        { organizationId?: string; scope: "platform" | "organization" },
        Array<{
          _id: string;
          code?: string;
          createdAt: number;
          createdByUserId: string;
          expiresAt?: number;
          grants?: any;
          isActive: boolean;
          label?: string;
          maxUses?: number;
          organizationId?: string;
          permissions?: {
            globalEnabled?: boolean;
            openPositionsEnabled?: boolean;
            ordersEnabled?: boolean;
            tradeIdeasEnabled?: boolean;
          };
          role?: "user" | "staff" | "admin";
          scope: "platform" | "organization";
          tier?: "free" | "standard" | "pro";
          updatedAt: number;
          uses: number;
        }>
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
        deleteConnectionAccountsByConnectionId: FunctionReference<
          "mutation",
          "internal",
          { connectionId: string; organizationId: string; userId: string },
          { deleted: number }
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
      platform: {
        consumeTradeLockerConnectDraft: FunctionReference<
          "mutation",
          "internal",
          { draftId: string },
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
        createTradeLockerConnectDraft: FunctionReference<
          "mutation",
          "internal",
          {
            accessTokenEncrypted: string;
            accessTokenExpiresAt?: number;
            environment: "demo" | "live";
            expiresAt: number;
            jwtHost?: string;
            refreshTokenEncrypted: string;
            refreshTokenExpiresAt?: number;
            server: string;
          },
          string
        >;
        deleteConnection: FunctionReference<
          "mutation",
          "internal",
          { connectionId: string },
          null
        >;
        getConnection: FunctionReference<
          "query",
          "internal",
          { connectionId: string },
          {
            _creationTime: number;
            _id: string;
            createdAt: number;
            isDefault: boolean;
            label: string;
            lastUsedAt?: number;
            provider: string;
            status: "active" | "disabled";
            updatedAt: number;
            username?: string;
          } | null
        >;
        getConnectionAccount: FunctionReference<
          "query",
          "internal",
          { accountRowId: string },
          {
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
            status?: string;
            updatedAt: number;
          } | null
        >;
        getConnectionSecrets: FunctionReference<
          "query",
          "internal",
          { connectionId: string },
          {
            connectionId: string;
            isDefault: boolean;
            provider: string;
            secrets: any;
            status: "active" | "disabled";
            updatedAt: number;
          } | null
        >;
        listConnectionAccounts: FunctionReference<
          "query",
          "internal",
          { connectionId: string },
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
            status?: string;
            updatedAt: number;
          }>
        >;
        listConnections: FunctionReference<
          "query",
          "internal",
          { limit?: number; provider?: string },
          Array<{
            _creationTime: number;
            _id: string;
            createdAt: number;
            isDefault: boolean;
            label: string;
            lastUsedAt?: number;
            provider: string;
            status: "active" | "disabled";
            updatedAt: number;
            username?: string;
          }>
        >;
        setConnectionStatus: FunctionReference<
          "mutation",
          "internal",
          { connectionId: string; status: "active" | "disabled" },
          null
        >;
        setDefaultConnection: FunctionReference<
          "mutation",
          "internal",
          { connectionId: string },
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
          },
          null
        >;
        upsertTradeLockerConnectionWithSecrets: FunctionReference<
          "mutation",
          "internal",
          {
            accessTokenEncrypted: string;
            accessTokenExpiresAt?: number;
            accounts: Array<{
              accNum: number;
              accountId: string;
              currency?: string;
              name?: string;
              status?: string;
            }>;
            connectionId?: string;
            environment: "demo" | "live";
            jwtHost?: string;
            label: string;
            makeDefault?: boolean;
            refreshTokenEncrypted: string;
            refreshTokenExpiresAt?: number;
            selectedAccNum: number;
            selectedAccountId: string;
            server: string;
            status: "active" | "disabled";
          },
          { connectionId: string }
        >;
      };
      queries: {
        getConnectionById: FunctionReference<
          "query",
          "internal",
          { connectionId: string },
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
            provider?: string;
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
            provider?: string;
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
    permissions: {
      getPermissions: FunctionReference<
        "query",
        "internal",
        { scopeId?: string; scopeType: "global" | "org"; userId: string },
        {
          globalEnabled: boolean;
          openPositionsEnabled: boolean;
          ordersEnabled: boolean;
          scopeId: string | null;
          scopeType: "global" | "org";
          tradeIdeasEnabled: boolean;
          updatedAt: number;
          userId: string;
        }
      >;
      listOrgPermissionsForUsers: FunctionReference<
        "query",
        "internal",
        { organizationId: string; userIds: Array<string> },
        Array<{
          globalEnabled: boolean;
          openPositionsEnabled: boolean;
          ordersEnabled: boolean;
          scopeId: string;
          scopeType: "org";
          tradeIdeasEnabled: boolean;
          updatedAt: number;
          userId: string;
        }>
      >;
      upsertPermissions: FunctionReference<
        "mutation",
        "internal",
        {
          globalEnabled: boolean;
          openPositionsEnabled: boolean;
          ordersEnabled: boolean;
          scopeId?: string;
          scopeType: "global" | "org";
          tradeIdeasEnabled: boolean;
          userId: string;
        },
        null
      >;
    };
    publicOrders: {
      listPublicOrdersForUser: FunctionReference<
        "query",
        "internal",
        { limit?: number; organizationId?: string; userId: string },
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
            ordersHistoryPatched: number;
            ordersPatched: number;
            positionsPatched: number;
            tradeIdeaGroupsPatched: number;
          }
        >;
        deleteTradeDataForConnection: FunctionReference<
          "mutation",
          "internal",
          {
            accountIds?: Array<string>;
            connectionId: string;
            maxDeletesPerTable?: number;
            organizationId: string;
            userId: string;
          },
          {
            tradeAccountStates: number;
            tradeExecutions: number;
            tradeIdeaEvents: number;
            tradeIdeaGroups: number;
            tradeIdeaNotes: number;
            tradeOrders: number;
            tradeOrdersHistory: number;
            tradePositions: number;
            tradeRealizationEvents: number;
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
    strategies: {
      index: {
        archiveMyStrategy: FunctionReference<
          "mutation",
          "internal",
          { organizationId: string; strategyId: string; userId: string },
          null
        >;
        createMyStrategyFromTemplate: FunctionReference<
          "mutation",
          "internal",
          { name?: string; organizationId: string; userId: string },
          string
        >;
        createOrgStrategyFromTemplate: FunctionReference<
          "mutation",
          "internal",
          { createdByUserId: string; name?: string; organizationId: string },
          string
        >;
        getMyActiveStrategy: FunctionReference<
          "query",
          "internal",
          { organizationId: string; userId: string },
          | {
              _creationTime: number;
              _id: string;
              archivedAt?: number;
              createdAt: number;
              kind: "plan";
              name: string;
              organizationId: string;
              ownerId: string;
              ownerType: "user" | "org";
              spec: {
                kpis: {
                  adherencePct: number;
                  avgRiskPerTradePct7d: number;
                  journalCompliancePct: number;
                  sessionDisciplinePct7d: number;
                  violations7d: number;
                };
                markets: Array<string>;
                risk: {
                  maxDailyLossPct: number;
                  maxOpenPositions: number;
                  maxRiskPerTradePct: number;
                  maxTradesPerDay: number;
                  maxWeeklyLossPct: number;
                };
                rules: Array<{
                  category:
                    | "Entry"
                    | "Risk"
                    | "Exit"
                    | "Process"
                    | "Psychology";
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
              };
              summary: string;
              updatedAt: number;
              version: string;
            }
          | {
              _creationTime: number;
              _id: string;
              archivedAt?: number;
              createdAt: number;
              kind: "dsl";
              name: string;
              organizationId: string;
              ownerId: string;
              ownerType: "user" | "org";
              spec: any;
              summary: string;
              updatedAt: number;
              version: string;
            }
          | null
        >;
        getMyOrgStrategy: FunctionReference<
          "query",
          "internal",
          { organizationId: string; userId: string },
          | {
              _creationTime: number;
              _id: string;
              archivedAt?: number;
              createdAt: number;
              kind: "plan";
              name: string;
              organizationId: string;
              ownerId: string;
              ownerType: "user" | "org";
              spec: {
                kpis: {
                  adherencePct: number;
                  avgRiskPerTradePct7d: number;
                  journalCompliancePct: number;
                  sessionDisciplinePct7d: number;
                  violations7d: number;
                };
                markets: Array<string>;
                risk: {
                  maxDailyLossPct: number;
                  maxOpenPositions: number;
                  maxRiskPerTradePct: number;
                  maxTradesPerDay: number;
                  maxWeeklyLossPct: number;
                };
                rules: Array<{
                  category:
                    | "Entry"
                    | "Risk"
                    | "Exit"
                    | "Process"
                    | "Psychology";
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
              };
              summary: string;
              updatedAt: number;
              version: string;
            }
          | {
              _creationTime: number;
              _id: string;
              archivedAt?: number;
              createdAt: number;
              kind: "dsl";
              name: string;
              organizationId: string;
              ownerId: string;
              ownerType: "user" | "org";
              spec: any;
              summary: string;
              updatedAt: number;
              version: string;
            }
          | null
        >;
        getMyStrategy: FunctionReference<
          "query",
          "internal",
          { organizationId: string; strategyId: string; userId: string },
          | {
              _creationTime: number;
              _id: string;
              archivedAt?: number;
              createdAt: number;
              kind: "plan";
              name: string;
              organizationId: string;
              ownerId: string;
              ownerType: "user" | "org";
              spec: {
                kpis: {
                  adherencePct: number;
                  avgRiskPerTradePct7d: number;
                  journalCompliancePct: number;
                  sessionDisciplinePct7d: number;
                  violations7d: number;
                };
                markets: Array<string>;
                risk: {
                  maxDailyLossPct: number;
                  maxOpenPositions: number;
                  maxRiskPerTradePct: number;
                  maxTradesPerDay: number;
                  maxWeeklyLossPct: number;
                };
                rules: Array<{
                  category:
                    | "Entry"
                    | "Risk"
                    | "Exit"
                    | "Process"
                    | "Psychology";
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
              };
              summary: string;
              updatedAt: number;
              version: string;
            }
          | {
              _creationTime: number;
              _id: string;
              archivedAt?: number;
              createdAt: number;
              kind: "dsl";
              name: string;
              organizationId: string;
              ownerId: string;
              ownerType: "user" | "org";
              spec: any;
              summary: string;
              updatedAt: number;
              version: string;
            }
          | null
        >;
        getOrgStrategy: FunctionReference<
          "query",
          "internal",
          { organizationId: string; strategyId: string },
          | {
              _creationTime: number;
              _id: string;
              archivedAt?: number;
              createdAt: number;
              kind: "plan";
              name: string;
              organizationId: string;
              ownerId: string;
              ownerType: "user" | "org";
              spec: {
                kpis: {
                  adherencePct: number;
                  avgRiskPerTradePct7d: number;
                  journalCompliancePct: number;
                  sessionDisciplinePct7d: number;
                  violations7d: number;
                };
                markets: Array<string>;
                risk: {
                  maxDailyLossPct: number;
                  maxOpenPositions: number;
                  maxRiskPerTradePct: number;
                  maxTradesPerDay: number;
                  maxWeeklyLossPct: number;
                };
                rules: Array<{
                  category:
                    | "Entry"
                    | "Risk"
                    | "Exit"
                    | "Process"
                    | "Psychology";
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
              };
              summary: string;
              updatedAt: number;
              version: string;
            }
          | {
              _creationTime: number;
              _id: string;
              archivedAt?: number;
              createdAt: number;
              kind: "dsl";
              name: string;
              organizationId: string;
              ownerId: string;
              ownerType: "user" | "org";
              spec: any;
              summary: string;
              updatedAt: number;
              version: string;
            }
          | null
        >;
        getOrgStrategyPolicy: FunctionReference<
          "query",
          "internal",
          { organizationId: string },
          {
            allowedStrategyIds: Array<string>;
            forcedStrategyId: string | null;
            updatedAt: number | null;
            updatedByUserId: string | null;
          }
        >;
        listMyStrategies: FunctionReference<
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
            kind: "plan" | "dsl";
            name: string;
            ownerType: "user" | "org";
            updatedAt: number;
            version: string;
          }>
        >;
        listOrgStrategies: FunctionReference<
          "query",
          "internal",
          { includeArchived?: boolean; limit?: number; organizationId: string },
          Array<{
            _id: string;
            archivedAt?: number;
            createdAt: number;
            kind: "plan" | "dsl";
            name: string;
            ownerType: "user" | "org";
            updatedAt: number;
            version: string;
          }>
        >;
        setMyActiveStrategy: FunctionReference<
          "mutation",
          "internal",
          { organizationId: string; strategyId: string; userId: string },
          null
        >;
        setMyOrgStrategy: FunctionReference<
          "mutation",
          "internal",
          { organizationId: string; strategyId: string; userId: string },
          null
        >;
        setOrgStrategyPolicy: FunctionReference<
          "mutation",
          "internal",
          {
            allowedStrategyIds: Array<string>;
            forcedStrategyId?: string | null;
            organizationId: string;
            updatedByUserId: string;
          },
          null
        >;
      };
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
            organizationId?: string;
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
            organizationId?: string;
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
            organizationId?: string;
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
            organizationId?: string;
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
            organizationId?: string;
            positionsLimit?: number;
            tradeIdeaId: string;
            userId: string;
          },
          null | {
            bias: "long" | "short" | "neutral";
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
          { limit?: number; organizationId?: string; userId: string },
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
          { expectedUserId: string; limit?: number; organizationId?: string },
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
          { organizationId?: string; scanCap?: number; userId: string },
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
            organizationId?: string;
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
            organizationId?: string;
            positionId: string;
            userId: string;
          },
          string | null
        >;
        getLatestGroupForSymbol: FunctionReference<
          "query",
          "internal",
          { organizationId?: string; symbol: string; userId: string },
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
          { organizationId?: string; symbol: string; userId: string },
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
          { organizationId?: string; userId: string },
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
          { organizationId?: string; tradeIdeaGroupId: string; userId: string },
          {
            _creationTime: number;
            _id: string;
            mistakes?: string;
            nextTime?: string;
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
            organizationId?: string;
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
          { organizationId?: string; tradeIdeaGroupId: string; userId: string },
          string
        >;
        upsertNoteForGroup: FunctionReference<
          "mutation",
          "internal",
          {
            mistakes?: string;
            nextTime?: string;
            organizationId?: string;
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
          { limit?: number; tradeIdeaGroupId: string; userId: string },
          Array<{
            _creationTime: number;
            _id: string;
            connectionId: string;
            createdAt: number;
            executedAt: number;
            externalExecutionId: string;
            externalOrderId?: string;
            externalPositionId?: string;
            tradeIdeaGroupId: string;
            userId: string;
          }>
        >;
        listLatestForSymbol: FunctionReference<
          "query",
          "internal",
          {
            limit?: number;
            status?: "open" | "closed";
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
  launchthat_clickhouse: {
    candles: {
      actions: {
        getMaxTsMs1m: FunctionReference<
          "action",
          "internal",
          {
            clickhouse: {
              database?: string;
              password: string;
              url: string;
              user: string;
            };
            sourceKey: string;
            tradableInstrumentId: string;
          },
          null | number
        >;
        insertCandles1mJsonEachRow: FunctionReference<
          "action",
          "internal",
          {
            clickhouse: {
              database?: string;
              password: string;
              url: string;
              user: string;
            };
            payload: string;
          },
          { error?: string; ok: boolean }
        >;
        listCandles: FunctionReference<
          "action",
          "internal",
          {
            clickhouse: {
              database?: string;
              password: string;
              url: string;
              user: string;
            };
            fromMs?: number;
            limit?: number;
            resolution?: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d";
            sourceKey: string;
            toMs?: number;
            tradableInstrumentId: string;
          },
          Array<{
            c: number;
            h: number;
            l: number;
            o: number;
            t: number;
            v?: number;
          }>
        >;
      };
      index: {
        getMaxTsMs1m: FunctionReference<
          "action",
          "internal",
          {
            clickhouse: {
              database?: string;
              password: string;
              url: string;
              user: string;
            };
            sourceKey: string;
            tradableInstrumentId: string;
          },
          null | number
        >;
        insertCandles1mJsonEachRow: FunctionReference<
          "action",
          "internal",
          {
            clickhouse: {
              database?: string;
              password: string;
              url: string;
              user: string;
            };
            payload: string;
          },
          { error?: string; ok: boolean }
        >;
        listCandles: FunctionReference<
          "action",
          "internal",
          {
            clickhouse: {
              database?: string;
              password: string;
              url: string;
              user: string;
            };
            fromMs?: number;
            limit?: number;
            resolution?: "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d";
            sourceKey: string;
            toMs?: number;
            tradableInstrumentId: string;
          },
          Array<{
            c: number;
            h: number;
            l: number;
            o: number;
            t: number;
            v?: number;
          }>
        >;
      };
    };
  };
  launchthat_affiliates: {
    admin: {
      getAffiliateProfileByUserId: FunctionReference<
        "query",
        "internal",
        { userId: string },
        null | {
          acceptedTermsAt?: number;
          acceptedTermsVersion?: string;
          createdAt: number;
          referralCode: string;
          status: "active" | "disabled";
          updatedAt: number;
          userId: string;
        }
      >;
      getProgramSettings: FunctionReference<
        "query",
        "internal",
        { scopeId: string; scopeType: "site" | "org" | "app" },
        {
          directCommissionBps: number;
          mlmEnabled: boolean;
          scopeId: string;
          scopeType: "site" | "org" | "app";
          sponsorOverrideBps: number;
          updatedAt: number;
        }
      >;
      listAffiliateConversions: FunctionReference<
        "query",
        "internal",
        { fromMs?: number; limit?: number },
        Array<{
          amountCents: number;
          currency: string;
          externalId: string;
          kind: string;
          occurredAt: number;
          referredUserId: string;
          referrerUserId: string;
        }>
      >;
      listAffiliateCreditEventsForUser: FunctionReference<
        "query",
        "internal",
        { limit?: number; userId: string },
        Array<{
          amountCents: number;
          conversionId?: string;
          createdAt: number;
          currency: string;
          externalEventId?: string;
          kind?: string;
          reason: string;
          referredUserId?: string;
          referrerUserId?: string;
          shortlinkCode?: string;
          utmContent?: string;
        }>
      >;
      listAffiliateLogs: FunctionReference<
        "query",
        "internal",
        { fromMs?: number; limit?: number },
        Array<{
          amountCents?: number;
          currency?: string;
          data?: any;
          externalId?: string;
          kind: string;
          message: string;
          ownerUserId: string;
          referralCode?: string;
          referredUserId?: string;
          ts: number;
          visitorId?: string;
        }>
      >;
      listAffiliateLogsForUser: FunctionReference<
        "query",
        "internal",
        { fromMs?: number; limit?: number; ownerUserId: string },
        Array<{
          amountCents?: number;
          currency?: string;
          data?: any;
          externalId?: string;
          kind: string;
          message: string;
          ownerUserId: string;
          referralCode?: string;
          referredUserId?: string;
          ts: number;
          visitorId?: string;
        }>
      >;
      listAffiliateProfiles: FunctionReference<
        "query",
        "internal",
        { limit?: number },
        Array<{
          acceptedTermsAt?: number;
          acceptedTermsVersion?: string;
          createdAt: number;
          referralCode: string;
          status: "active" | "disabled";
          updatedAt: number;
          userId: string;
        }>
      >;
      listReferredUsersForReferrer: FunctionReference<
        "query",
        "internal",
        { limit?: number; referrerUserId: string },
        Array<{
          activatedAt?: number;
          attributedAt: number;
          firstPaidConversionAt?: number;
          referredUserId: string;
          shortlinkCode?: string;
          utmContent?: string;
        }>
      >;
      upsertProgramSettings: FunctionReference<
        "mutation",
        "internal",
        {
          directCommissionBps?: number;
          mlmEnabled?: boolean;
          scopeId: string;
          scopeType: "site" | "org" | "app";
          sponsorOverrideBps?: number;
        },
        {
          directCommissionBps: number;
          mlmEnabled: boolean;
          ok: boolean;
          scopeId: string;
          scopeType: "site" | "org" | "app";
          sponsorOverrideBps: number;
          updatedAt: number;
        }
      >;
    };
    analytics: {
      queries: {
        getTopLandingPathsForUser: FunctionReference<
          "query",
          "internal",
          { daysBack?: number; limit?: number; userId: string },
          {
            daysBack: number;
            referralCode: string | null;
            topLandingPaths: Array<{ clicks: number; path: string }>;
            totalClicks: number;
            userId: string;
          }
        >;
      };
    };
    conversions: {
      recordPaidConversion: FunctionReference<
        "mutation",
        "internal",
        {
          amountCents: number;
          currency: string;
          externalId: string;
          kind: "paid_subscription" | "paid_order";
          occurredAt?: number;
          proDiscountAmountOffCentsMonthly?: number;
          referredUserId: string;
          referrerIsPro?: boolean;
        },
        {
          created: boolean;
          discountGranted?: boolean;
          ok: boolean;
          referrerUserId: string | null;
        }
      >;
    };
    credit: {
      actions: {
        consumeForPayout: FunctionReference<
          "mutation",
          "internal",
          {
            cashCents?: number;
            currency?: string;
            runId: string;
            source?: string;
            subscriptionCreditCents?: number;
            userId: string;
          },
          {
            balanceCents: number;
            consumedCashCents: number;
            consumedSubscriptionCreditCents: number;
            ok: boolean;
          }
        >;
        recordCommissionDistributionFromPayment: FunctionReference<
          "mutation",
          "internal",
          {
            currency?: string;
            externalEventId: string;
            grossAmountCents: number;
            occurredAt?: number;
            paymentKind?: string;
            referredUserId: string;
            scopeId?: string;
            scopeType?: "site" | "org" | "app";
            source?: string;
          },
          {
            created: boolean;
            directCommissionCents: number;
            grossAmountCents: number;
            ok: boolean;
            referrerUserId: string | null;
            sponsorOverrideCents: number;
            sponsorUserId: string | null;
          }
        >;
        recordCommissionFromPayment: FunctionReference<
          "mutation",
          "internal",
          {
            amountCents: number;
            commissionRateBps?: number;
            currency?: string;
            externalEventId: string;
            grossAmountCents: number;
            occurredAt?: number;
            paymentKind?: string;
            referredUserId: string;
            source?: string;
          },
          {
            amountCents: number;
            created: boolean;
            grossAmountCents: number;
            ok: boolean;
            referrerUserId: string | null;
          }
        >;
      };
      queries: {
        getCreditBalance: FunctionReference<
          "query",
          "internal",
          { currency?: string; userId: string },
          { balanceCents: number; currency: string; userId: string }
        >;
      };
    };
    network: {
      mutations: {
        setMySponsorByReferralCodeOptIn: FunctionReference<
          "mutation",
          "internal",
          { nowMs?: number; referralCode: string; userId: string },
          { created: boolean; ok: boolean; sponsorUserId: string | null }
        >;
        setSponsorForUserAdmin: FunctionReference<
          "mutation",
          "internal",
          {
            adminUserId?: string;
            nowMs?: number;
            sponsorUserId: string | null;
            userId: string;
          },
          {
            ok: boolean;
            previousSponsorUserId: string | null;
            sponsorUserId: string | null;
            userId: string;
          }
        >;
      };
      queries: {
        getSponsorLinkForUser: FunctionReference<
          "query",
          "internal",
          { userId: string },
          null | {
            createdAt: number;
            createdSource: string;
            sponsorUserId: string;
            updatedAt?: number;
            updatedBy?: string;
            userId: string;
          }
        >;
        listDirectDownlineForSponsor: FunctionReference<
          "query",
          "internal",
          { limit?: number; sponsorUserId: string },
          Array<{ createdAt: number; createdSource: string; userId: string }>
        >;
      };
    };
    profiles: {
      createOrGetMyAffiliateProfile: FunctionReference<
        "mutation",
        "internal",
        { acceptTerms?: boolean; termsVersion?: string; userId: string },
        { referralCode: string; status: "active" | "disabled"; userId: string }
      >;
      getAffiliateProfileByReferralCode: FunctionReference<
        "query",
        "internal",
        { referralCode: string },
        null | {
          referralCode: string;
          status: "active" | "disabled";
          userId: string;
        }
      >;
      getAffiliateProfileByUserId: FunctionReference<
        "query",
        "internal",
        { userId: string },
        null | {
          referralCode: string;
          status: "active" | "disabled";
          userId: string;
        }
      >;
      getMyAffiliateStats: FunctionReference<
        "query",
        "internal",
        { nowMs?: number; userId: string },
        {
          activations30d: number;
          clicks30d: number;
          conversions30d: number;
          creditBalanceCents: number;
          referralCode: string | null;
          signups30d: number;
          userId: string;
        }
      >;
      setAffiliateProfileStatus: FunctionReference<
        "mutation",
        "internal",
        { status: "active" | "disabled"; userId: string },
        { ok: boolean; status: "active" | "disabled"; userId: string }
      >;
    };
    referrals: {
      queries: {
        listMyReferredUsers: FunctionReference<
          "query",
          "internal",
          { limit?: number; referrerUserId: string },
          Array<{
            activatedAt?: number;
            attributedAt: number;
            expiresAt: number;
            firstPaidConversionAt?: number;
            referredUserId: string;
            shortlinkCode?: string;
            status: string;
            utmContent?: string;
          }>
        >;
      };
    };
    rewards: {
      actions: {
        evaluateRewardsForReferrer: FunctionReference<
          "mutation",
          "internal",
          { referrerUserId: string },
          null
        >;
        grantSubscriptionDiscountBenefit: FunctionReference<
          "mutation",
          "internal",
          { amountOffCentsMonthly?: number; userId: string },
          { created: boolean; ok: boolean }
        >;
        redeemCredit: FunctionReference<
          "mutation",
          "internal",
          {
            amountCents: number;
            currency?: string;
            reason?: string;
            userId: string;
          },
          { balanceCents: number; ok: boolean }
        >;
      };
      queries: {
        listActiveBenefitsForUser: FunctionReference<
          "query",
          "internal",
          { userId: string },
          Array<{
            endsAt?: number;
            kind: string;
            startsAt: number;
            status: string;
            value: any;
          }>
        >;
      };
    };
    tracking: {
      attributeSignup: FunctionReference<
        "mutation",
        "internal",
        {
          attributionWindowDays?: number;
          nowMs?: number;
          referralCode?: string;
          referredUserId: string;
          shortlinkCode?: string;
          utmContent?: string;
          visitorId?: string;
        },
        null | {
          expiresAt: number;
          referralCode: string;
          referredUserId: string;
          referrerUserId: string;
          shortlinkCode?: string;
          utmContent?: string;
        }
      >;
      markActivated: FunctionReference<
        "mutation",
        "internal",
        { referredUserId: string; source?: "email_verified" | "manual" },
        { activated: boolean; ok: boolean; referrerUserId: string | null }
      >;
      recordClick: FunctionReference<
        "mutation",
        "internal",
        {
          ipHash?: string;
          landingPath?: string;
          referralCode: string;
          referrer?: string;
          uaHash?: string;
          visitorId: string;
        },
        null
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
    payouts: {
      actions: {
        createStripeConnectOnboardingLinkForUser: FunctionReference<
          "action",
          "internal",
          {
            businessType?: "individual" | "company";
            email?: string;
            fullName?: string;
            metadata?: any;
            productDescription?: string;
            refreshUrl: string;
            returnUrl: string;
            stripeSecretKey: string;
            supportEmail?: string;
            userId: string;
            websiteUrl?: string;
          },
          { connectAccountId: string; ok: boolean; url: string }
        >;
        disconnectStripePayoutAccountForUser: FunctionReference<
          "action",
          "internal",
          { deleteRemote?: boolean; stripeSecretKey: string; userId: string },
          { deletedLocal: boolean; deletedRemote: boolean; ok: boolean }
        >;
        getUpcomingSubscriptionDueCentsForUser: FunctionReference<
          "action",
          "internal",
          { currency?: string; stripeSecretKey: string; userId: string },
          { dueCents: number; ok: boolean }
        >;
        processStripeWebhook: FunctionReference<
          "action",
          "internal",
          {
            affiliateScopeId?: string;
            affiliateScopeType?: "site" | "org" | "app";
            rawBody: string;
            signature: string;
            stripeSecretKey: string;
            stripeWebhookSecret: string;
          },
          { handled: boolean; ok: boolean }
        >;
        runMonthly: FunctionReference<
          "action",
          "internal",
          {
            dryRun?: boolean;
            periodEnd: number;
            periodStart: number;
            provider?: string;
            providerConfig?: any;
          },
          {
            errors: Array<string>;
            ok: boolean;
            processedUsers: number;
            runId: string | null;
            totalCashCents: number;
            totalSubscriptionCreditCents: number;
          }
        >;
      };
      mutations: {
        deletePayoutAccount: FunctionReference<
          "mutation",
          "internal",
          { provider?: string; userId: string },
          { connectAccountId?: string; deleted: boolean; ok: boolean }
        >;
        setPayoutPreference: FunctionReference<
          "mutation",
          "internal",
          {
            currency?: string;
            minPayoutCents?: number;
            policy: "payout_only" | "apply_to_subscription_then_payout";
            userId: string;
          },
          { ok: boolean }
        >;
        upsertPayoutAccount: FunctionReference<
          "mutation",
          "internal",
          {
            connectAccountId: string;
            details?: any;
            provider?: string;
            status: string;
            userId: string;
          },
          { created: boolean; ok: boolean }
        >;
      };
      paymentEvents: {
        recordCommissionablePayment: FunctionReference<
          "mutation",
          "internal",
          {
            amountCents: number;
            currency?: string;
            externalEventId: string;
            kind: string;
            occurredAt?: number;
            referredUserId: string;
            scopeId?: string;
            scopeType?: "site" | "org" | "app";
            source: string;
          },
          {
            created: boolean;
            directCommissionCents: number;
            ok: boolean;
            referrerUserId: string | null;
            sponsorOverrideCents: number;
          }
        >;
      };
      queries: {
        getPayoutAccount: FunctionReference<
          "query",
          "internal",
          { provider?: string; userId: string },
          null | {
            connectAccountId: string;
            createdAt: number;
            details?: any;
            provider: string;
            status: string;
            updatedAt: number;
            userId: string;
          }
        >;
        getPayoutPreference: FunctionReference<
          "query",
          "internal",
          { userId: string },
          null | {
            createdAt: number;
            currency: string;
            minPayoutCents: number;
            policy: string;
            updatedAt: number;
            userId: string;
          }
        >;
        listPayoutTransfersForUser: FunctionReference<
          "query",
          "internal",
          { limit?: number; userId: string },
          Array<{
            cashCents: number;
            createdAt: number;
            currency: string;
            error?: string;
            externalBalanceTxnId?: string;
            externalTransferId?: string;
            provider: string;
            runId: string;
            status: string;
            subscriptionCreditCents: number;
            updatedAt: number;
            userId: string;
          }>
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
  launchthat_pricedata: {
    bars: {
      index: {
        debugListBarChunks: FunctionReference<
          "query",
          "internal",
          {
            limit?: number;
            resolution: string;
            sourceKey: string;
            tradableInstrumentId: string;
          },
          Array<{
            _creationTime: number;
            _id: string;
            bars: Array<{
              c: number;
              h: number;
              l: number;
              o: number;
              t: number;
              v: number;
            }>;
            chunkEndMs: number;
            chunkStartMs: number;
            createdAt: number;
            resolution: string;
            sourceKey: string;
            tradableInstrumentId: string;
            updatedAt: number;
          }>
        >;
        getBarChunks: FunctionReference<
          "query",
          "internal",
          {
            fromMs: number;
            resolution: string;
            sourceKey: string;
            toMs: number;
            tradableInstrumentId: string;
          },
          Array<{
            _creationTime: number;
            _id: string;
            bars: Array<{
              c: number;
              h: number;
              l: number;
              o: number;
              t: number;
              v: number;
            }>;
            chunkEndMs: number;
            chunkStartMs: number;
            createdAt: number;
            resolution: string;
            sourceKey: string;
            tradableInstrumentId: string;
            updatedAt: number;
          }>
        >;
        upsertBarChunk: FunctionReference<
          "mutation",
          "internal",
          {
            bars: Array<{
              c: number;
              h: number;
              l: number;
              o: number;
              t: number;
              v: number;
            }>;
            chunkEndMs: number;
            chunkStartMs: number;
            resolution: string;
            sourceKey: string;
            tradableInstrumentId: string;
          },
          { chunkId: string }
        >;
      };
      internalQueries: {
        debugListBarChunks: FunctionReference<
          "query",
          "internal",
          {
            limit?: number;
            resolution: string;
            sourceKey: string;
            tradableInstrumentId: string;
          },
          Array<{
            _creationTime: number;
            _id: string;
            bars: Array<{
              c: number;
              h: number;
              l: number;
              o: number;
              t: number;
              v: number;
            }>;
            chunkEndMs: number;
            chunkStartMs: number;
            createdAt: number;
            resolution: string;
            sourceKey: string;
            tradableInstrumentId: string;
            updatedAt: number;
          }>
        >;
      };
      mutations: {
        upsertBarChunk: FunctionReference<
          "mutation",
          "internal",
          {
            bars: Array<{
              c: number;
              h: number;
              l: number;
              o: number;
              t: number;
              v: number;
            }>;
            chunkEndMs: number;
            chunkStartMs: number;
            resolution: string;
            sourceKey: string;
            tradableInstrumentId: string;
          },
          { chunkId: string }
        >;
      };
      queries: {
        getBarChunks: FunctionReference<
          "query",
          "internal",
          {
            fromMs: number;
            resolution: string;
            sourceKey: string;
            toMs: number;
            tradableInstrumentId: string;
          },
          Array<{
            _creationTime: number;
            _id: string;
            bars: Array<{
              c: number;
              h: number;
              l: number;
              o: number;
              t: number;
              v: number;
            }>;
            chunkEndMs: number;
            chunkStartMs: number;
            createdAt: number;
            resolution: string;
            sourceKey: string;
            tradableInstrumentId: string;
            updatedAt: number;
          }>
        >;
      };
    };
    instruments: {
      index: {
        getInstrumentBySymbol: FunctionReference<
          "query",
          "internal",
          { sourceKey: string; symbol: string },
          null | {
            _creationTime: number;
            _id: string;
            createdAt: number;
            infoRouteId?: number;
            metadata?: any;
            sourceKey: string;
            symbol: string;
            tradableInstrumentId: string;
            updatedAt: number;
          }
        >;
        listInstrumentsByTradableInstrumentIds: FunctionReference<
          "query",
          "internal",
          { sourceKey: string; tradableInstrumentIds: Array<string> },
          Array<{ symbol: string; tradableInstrumentId: string }>
        >;
        listInstrumentsForSource: FunctionReference<
          "query",
          "internal",
          { limit?: number; sourceKey: string },
          Array<{
            _creationTime: number;
            _id: string;
            createdAt: number;
            infoRouteId?: number;
            metadata?: any;
            sourceKey: string;
            symbol: string;
            tradableInstrumentId: string;
            updatedAt: number;
          }>
        >;
        upsertInstrument: FunctionReference<
          "mutation",
          "internal",
          {
            infoRouteId?: number;
            metadata?: any;
            sourceKey: string;
            symbol: string;
            tradableInstrumentId: string;
          },
          { instrumentId: string }
        >;
      };
      mutations: {
        upsertInstrument: FunctionReference<
          "mutation",
          "internal",
          {
            infoRouteId?: number;
            metadata?: any;
            sourceKey: string;
            symbol: string;
            tradableInstrumentId: string;
          },
          { instrumentId: string }
        >;
      };
      queries: {
        getInstrumentBySymbol: FunctionReference<
          "query",
          "internal",
          { sourceKey: string; symbol: string },
          null | {
            _creationTime: number;
            _id: string;
            createdAt: number;
            infoRouteId?: number;
            metadata?: any;
            sourceKey: string;
            symbol: string;
            tradableInstrumentId: string;
            updatedAt: number;
          }
        >;
        listInstrumentsByTradableInstrumentIds: FunctionReference<
          "query",
          "internal",
          { sourceKey: string; tradableInstrumentIds: Array<string> },
          Array<{ symbol: string; tradableInstrumentId: string }>
        >;
        listInstrumentsForSource: FunctionReference<
          "query",
          "internal",
          { limit?: number; sourceKey: string },
          Array<{
            _creationTime: number;
            _id: string;
            createdAt: number;
            infoRouteId?: number;
            metadata?: any;
            sourceKey: string;
            symbol: string;
            tradableInstrumentId: string;
            updatedAt: number;
          }>
        >;
      };
    };
    live: {
      index: {
        getLiveCandle: FunctionReference<
          "query",
          "internal",
          {
            resolution: string;
            sourceKey: string;
            tradableInstrumentId: string;
          },
          null | {
            c: number;
            h: number;
            l: number;
            lastUpdateAt: number;
            minuteStartMs: number;
            o: number;
            t: number;
            v: number;
          }
        >;
        upsertLiveCandle: FunctionReference<
          "mutation",
          "internal",
          {
            c: number;
            h: number;
            l: number;
            lastUpdateAt: number;
            minuteStartMs: number;
            o: number;
            resolution: string;
            sourceKey: string;
            tradableInstrumentId: string;
            v: number;
          },
          null
        >;
      };
      mutations: {
        upsertLiveCandle: FunctionReference<
          "mutation",
          "internal",
          {
            c: number;
            h: number;
            l: number;
            lastUpdateAt: number;
            minuteStartMs: number;
            o: number;
            resolution: string;
            sourceKey: string;
            tradableInstrumentId: string;
            v: number;
          },
          null
        >;
      };
      queries: {
        getLiveCandle: FunctionReference<
          "query",
          "internal",
          {
            resolution: string;
            sourceKey: string;
            tradableInstrumentId: string;
          },
          null | {
            c: number;
            h: number;
            l: number;
            lastUpdateAt: number;
            minuteStartMs: number;
            o: number;
            t: number;
            v: number;
          }
        >;
      };
    };
    sources: {
      index: {
        getDefaultSource: FunctionReference<
          "query",
          "internal",
          {},
          null | {
            _creationTime: number;
            _id: string;
            baseUrlHost?: string;
            createdAt: number;
            environment: "demo" | "live";
            isDefault?: boolean;
            jwtHost?: string;
            provider: "tradelocker";
            seedRef?: { organizationId: string; userId: string };
            server: string;
            sourceKey: string;
            updatedAt: number;
          }
        >;
        getSourceByKey: FunctionReference<
          "query",
          "internal",
          { sourceKey: string },
          null | {
            _creationTime: number;
            _id: string;
            baseUrlHost?: string;
            createdAt: number;
            environment: "demo" | "live";
            isDefault?: boolean;
            jwtHost?: string;
            provider: "tradelocker";
            seedRef?: { organizationId: string; userId: string };
            server: string;
            sourceKey: string;
            updatedAt: number;
          }
        >;
        listSources: FunctionReference<
          "query",
          "internal",
          { limit?: number },
          Array<{
            baseUrlHost?: string;
            createdAt: number;
            environment: "demo" | "live";
            isDefault?: boolean;
            jwtHost?: string;
            provider: "tradelocker";
            server: string;
            sourceKey: string;
            updatedAt: number;
          }>
        >;
        upsertSource: FunctionReference<
          "mutation",
          "internal",
          {
            baseUrlHost?: string;
            environment: "demo" | "live";
            isDefault?: boolean;
            jwtHost?: string;
            provider: "tradelocker";
            seedRef?: { organizationId: string; userId: string };
            server: string;
            sourceKey: string;
          },
          { sourceId: string }
        >;
      };
      mutations: {
        upsertSource: FunctionReference<
          "mutation",
          "internal",
          {
            baseUrlHost?: string;
            environment: "demo" | "live";
            isDefault?: boolean;
            jwtHost?: string;
            provider: "tradelocker";
            seedRef?: { organizationId: string; userId: string };
            server: string;
            sourceKey: string;
          },
          { sourceId: string }
        >;
      };
      queries: {
        getDefaultSource: FunctionReference<
          "query",
          "internal",
          {},
          null | {
            _creationTime: number;
            _id: string;
            baseUrlHost?: string;
            createdAt: number;
            environment: "demo" | "live";
            isDefault?: boolean;
            jwtHost?: string;
            provider: "tradelocker";
            seedRef?: { organizationId: string; userId: string };
            server: string;
            sourceKey: string;
            updatedAt: number;
          }
        >;
        getSourceByKey: FunctionReference<
          "query",
          "internal",
          { sourceKey: string },
          null | {
            _creationTime: number;
            _id: string;
            baseUrlHost?: string;
            createdAt: number;
            environment: "demo" | "live";
            isDefault?: boolean;
            jwtHost?: string;
            provider: "tradelocker";
            seedRef?: { organizationId: string; userId: string };
            server: string;
            sourceKey: string;
            updatedAt: number;
          }
        >;
        listSources: FunctionReference<
          "query",
          "internal",
          { limit?: number },
          Array<{
            baseUrlHost?: string;
            createdAt: number;
            environment: "demo" | "live";
            isDefault?: boolean;
            jwtHost?: string;
            provider: "tradelocker";
            server: string;
            sourceKey: string;
            updatedAt: number;
          }>
        >;
      };
    };
    tradelocker: {
      actions: {
        fetchAccountState: FunctionReference<
          "action",
          "internal",
          {
            accNum: number;
            accessToken: string;
            accountId: string;
            baseUrl: string;
            developerKey?: string;
            refreshToken?: string;
          },
          {
            accountState: any;
            error?: string;
            ok: boolean;
            refreshed?: {
              accessToken: string;
              expireDateMs?: number;
              refreshToken: string;
            };
            status: number;
            textPreview?: string;
          }
        >;
        fetchAllAccounts: FunctionReference<
          "action",
          "internal",
          {
            accessToken: string;
            baseUrl: string;
            developerKey?: string;
            refreshToken?: string;
          },
          {
            accounts: Array<any>;
            accountsPreview: Array<any>;
            error?: string;
            ok: boolean;
            refreshed?: {
              accessToken: string;
              expireDateMs?: number;
              refreshToken: string;
            };
            status: number;
            textPreview?: string;
          }
        >;
        fetchHistory: FunctionReference<
          "action",
          "internal",
          {
            accNum: number;
            accessToken: string;
            baseUrl: string;
            developerKey?: string;
            fromMs: number;
            infoRouteId: number;
            refreshToken?: string;
            resolution: string;
            toMs: number;
            tradableInstrumentId: string;
          },
          {
            bars: Array<{
              c: number;
              h: number;
              l: number;
              o: number;
              t: number;
              v: number;
            }>;
            error?: string;
            ok: boolean;
            refreshed?: {
              accessToken: string;
              expireDateMs?: number;
              refreshToken: string;
            };
            routeId: number;
            status: number;
            textPreview?: string;
            tradableInstrumentId: string;
          }
        >;
        fetchInstruments: FunctionReference<
          "action",
          "internal",
          {
            accNum: number;
            accessToken: string;
            accountId: string;
            baseUrl: string;
            developerKey?: string;
            refreshToken?: string;
          },
          {
            count: number;
            error?: string;
            instruments: Array<{
              infoRouteId?: number;
              raw: any;
              symbol: string;
              tradableInstrumentId: string;
            }>;
            ok: boolean;
            refreshed?: {
              accessToken: string;
              expireDateMs?: number;
              refreshToken: string;
            };
            status: number;
            textPreview?: string;
          }
        >;
      };
    };
  };
  launchthat_news: {
    events: {
      queries: {
        getEventById: FunctionReference<
          "query",
          "internal",
          { eventId: string },
          null | {
            _id: string;
            canonicalKey: string;
            country?: string;
            createdAt: number;
            currency?: string;
            eventType: string;
            impact?: string;
            meta?: any;
            publishedAt?: number;
            startsAt?: number;
            summary?: string;
            title: string;
            updatedAt: number;
          }
        >;
        listEventsForSymbol: FunctionReference<
          "query",
          "internal",
          { fromMs?: number; limit?: number; symbol: string; toMs?: number },
          Array<{
            at: number;
            country?: string;
            currency?: string;
            eventId: string;
            eventType: string;
            impact?: string;
            publishedAt?: number;
            startsAt?: number;
            summary?: string;
            symbol: string;
            title: string;
          }>
        >;
        listEventsGlobal: FunctionReference<
          "query",
          "internal",
          {
            eventType?: string;
            fromMs?: number;
            limit?: number;
            toMs?: number;
          },
          Array<{
            _id: string;
            country?: string;
            createdAt: number;
            currency?: string;
            eventType: string;
            impact?: string;
            meta?: any;
            publishedAt?: number;
            startsAt?: number;
            summary?: string;
            title: string;
            updatedAt: number;
          }>
        >;
        listSourcesForEvent: FunctionReference<
          "query",
          "internal",
          { eventId: string; limit?: number },
          Array<{
            createdAt: number;
            externalId?: string;
            sourceKey: string;
            url?: string;
          }>
        >;
        listSymbolsForEvent: FunctionReference<
          "query",
          "internal",
          { eventId: string },
          Array<{ symbol: string }>
        >;
      };
    };
    ingest: {
      actions: {
        ingestSource: FunctionReference<
          "action",
          "internal",
          {
            assetAliasMap?: Record<string, string>;
            disabledAliases?: Array<string>;
            nowMs: number;
            sourceId: string;
            supportedSymbols: Array<string>;
          },
          {
            createdEventIds: Array<string>;
            createdEvents: number;
            createdRaw: number;
            dedupedEvents: number;
            error?: string;
            kind: string;
            ok: boolean;
            sourceId: string;
            sourceKey: string;
            symbolLinksWritten: number;
            updatedEvents: number;
          }
        >;
        reprocessSourceDeterministic: FunctionReference<
          "action",
          "internal",
          {
            assetAliasMap?: Record<string, string>;
            disabledAliases?: Array<string>;
            limit?: number;
            lookbackDays?: number;
            sourceId: string;
            supportedSymbols: Array<string>;
          },
          {
            classificationsWritten: number;
            error?: string;
            eventsConsidered: number;
            ok: boolean;
            sourceId: string;
            symbolLinksAdded: number;
          }
        >;
      };
    };
    runs: {
      queries: {
        listRecentRuns: FunctionReference<
          "query",
          "internal",
          { limit?: number; sourceKey?: string },
          Array<{
            _creationTime: number;
            _id: string;
            createdEvents?: number;
            createdRaw?: number;
            dedupedEvents?: number;
            endedAt?: number;
            kind: string;
            lastError?: string;
            ok?: boolean;
            sourceId: string;
            sourceKey: string;
            startedAt: number;
            symbolLinksWritten?: number;
            updatedEvents?: number;
          }>
        >;
      };
    };
    sources: {
      mutations: {
        createSource: FunctionReference<
          "mutation",
          "internal",
          {
            cadenceSeconds?: number;
            config: any;
            enabled?: boolean;
            kind: string;
            label?: string;
            overlapSeconds?: number;
            sourceKey: string;
          },
          { sourceId: string }
        >;
        deleteSource: FunctionReference<
          "mutation",
          "internal",
          { sourceId: string },
          { ok: boolean }
        >;
        updateSource: FunctionReference<
          "mutation",
          "internal",
          {
            cadenceSeconds?: number;
            config?: any;
            cursor?: any;
            enabled?: boolean;
            label?: string;
            nextRunAt?: number;
            overlapSeconds?: number;
            sourceId: string;
          },
          { ok: boolean }
        >;
      };
      queries: {
        listDueSources: FunctionReference<
          "query",
          "internal",
          { limit?: number; nowMs: number },
          Array<{
            _id: string;
            cadenceSeconds: number;
            config: any;
            cursor?: any;
            enabled: boolean;
            kind: string;
            label?: string;
            nextRunAt: number;
            overlapSeconds: number;
            sourceKey: string;
          }>
        >;
        listSources: FunctionReference<
          "query",
          "internal",
          { limit?: number },
          Array<{
            _creationTime: number;
            _id: string;
            cadenceSeconds: number;
            config: any;
            createdAt: number;
            cursor?: any;
            enabled: boolean;
            kind: string;
            label?: string;
            nextRunAt: number;
            overlapSeconds: number;
            sourceKey: string;
            updatedAt: number;
          }>
        >;
      };
    };
    subscriptions: {
      mutations: {
        upsertSubscription: FunctionReference<
          "mutation",
          "internal",
          {
            channels?: any;
            cooldownSeconds?: number;
            enabled: boolean;
            minImpact?: string;
            orgId: string;
            symbol: string;
            userId: string;
          },
          { ok: boolean }
        >;
      };
      queries: {
        getSubscriptionForUserOrgSymbol: FunctionReference<
          "query",
          "internal",
          { orgId: string; symbol: string; userId: string },
          null | {
            _id: string;
            channels?: any;
            cooldownSeconds?: number;
            createdAt: number;
            enabled: boolean;
            lastSentAt?: number;
            minImpact?: string;
            updatedAt: number;
          }
        >;
        listEnabledSubscriptionsForSymbol: FunctionReference<
          "query",
          "internal",
          { limit?: number; symbol: string },
          Array<{
            channels?: any;
            cooldownSeconds?: number;
            enabled: boolean;
            lastSentAt?: number;
            minImpact?: string;
            orgId: string;
            symbol: string;
            userId: string;
          }>
        >;
      };
    };
  };
  launchthat_discord: {
    automations: {
      mutations: {
        createAutomation: FunctionReference<
          "mutation",
          "internal",
          {
            action: { config: any; type: "send_message" };
            conditions?: any;
            enabled: boolean;
            guildId: string;
            name: string;
            organizationId: string;
            trigger: { config: any; type: "schedule" | "event" };
          },
          string
        >;
        deleteAutomation: FunctionReference<
          "mutation",
          "internal",
          { automationId: string; organizationId: string },
          null
        >;
        markAutomationRun: FunctionReference<
          "mutation",
          "internal",
          {
            automationId: string;
            cursor?: string;
            lastRunAt?: number;
            nextRunAt?: number;
            organizationId: string;
          },
          null
        >;
        updateAutomation: FunctionReference<
          "mutation",
          "internal",
          {
            action?: { config: any; type: "send_message" };
            automationId: string;
            conditions?: any;
            enabled?: boolean;
            name?: string;
            organizationId: string;
            trigger?: { config: any; type: "schedule" | "event" };
          },
          null
        >;
      };
      queries: {
        listAutomations: FunctionReference<
          "query",
          "internal",
          { guildId: string; organizationId: string },
          Array<{
            action: any;
            conditions?: any;
            createdAt: number;
            enabled: boolean;
            guildId: string;
            id: string;
            name: string;
            nextRunAt?: number;
            organizationId: string;
            state?: any;
            trigger: any;
            updatedAt: number;
          }>
        >;
        listDueAutomations: FunctionReference<
          "query",
          "internal",
          { limit?: number; now: number; organizationId?: string },
          Array<{
            action: any;
            conditions?: any;
            createdAt: number;
            enabled: boolean;
            guildId: string;
            id: string;
            name: string;
            nextRunAt?: number;
            organizationId: string;
            state?: any;
            trigger: any;
            updatedAt: number;
          }>
        >;
      };
    };
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
    events: {
      mutations: {
        emitEvent: FunctionReference<
          "mutation",
          "internal",
          {
            dedupeKey?: string;
            eventKey: string;
            guildId?: string;
            organizationId: string;
            payloadJson: string;
          },
          null
        >;
      };
      queries: {
        listRecentEvents: FunctionReference<
          "query",
          "internal",
          {
            eventKey?: string;
            guildId?: string;
            limit?: number;
            organizationId: string;
          },
          Array<{
            createdAt: number;
            dedupeKey?: string;
            eventKey: string;
            guildId?: string;
            id: string;
            organizationId: string;
            payloadJson: string;
          }>
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
            guildId: string | null;
            organizationId?: string;
            userId: string;
          }
        >;
        startUserLink: FunctionReference<
          "action",
          "internal",
          {
            callbackPath: string;
            organizationId?: string;
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
            organizationId?: string;
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
            organizationId?: string;
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
            organizationId?: string;
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
            templateJson?: string;
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
            templateJson?: string;
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
            templateJson?: string;
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
            templateJson?: string;
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
            templateJson?: string;
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
          { discordUserId: string; organizationId?: string; userId: string },
          null
        >;
        unlinkUser: FunctionReference<
          "mutation",
          "internal",
          { organizationId?: string; userId: string },
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
        getUserLinkForUser: FunctionReference<
          "query",
          "internal",
          { userId: string },
          {
            discordUserId: string;
            linkedAt: number;
            organizationId?: string;
          } | null
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
  launchthat_shortlinks: {
    mutations: {
      create: FunctionReference<
        "mutation",
        "internal",
        {
          appKey: string;
          createdByUserId?: string;
          expiresAt?: number;
          kind?: string;
          path: string;
          targetId?: string;
        },
        { code: string }
      >;
      trackClickByCode: FunctionReference<
        "mutation",
        "internal",
        { appKey: string; code: string },
        null
      >;
      upsertSettings: FunctionReference<
        "mutation",
        "internal",
        {
          alphabet?: string;
          appKey: string;
          codeLength: number;
          domain: string;
          enabled: boolean;
          updatedByUserId?: string;
        },
        null
      >;
    };
    queries: {
      getByCode: FunctionReference<
        "query",
        "internal",
        { appKey: string; code: string },
        {
          appKey: string;
          code: string;
          disabledAt?: number;
          expiresAt?: number;
          kind?: string;
          path: string;
          targetId?: string;
        } | null
      >;
      getSettings: FunctionReference<
        "query",
        "internal",
        { appKey: string },
        {
          alphabet: string;
          codeLength: number;
          domain: string;
          enabled: boolean;
        }
      >;
      listByCreator: FunctionReference<
        "query",
        "internal",
        {
          appKey: string;
          createdByUserId: string;
          kind: string;
          limit?: number;
        },
        Array<{
          appKey: string;
          clickCount?: number;
          code: string;
          createdAt: number;
          createdByUserId?: string;
          disabledAt?: number;
          expiresAt?: number;
          kind?: string;
          lastAccessAt?: number;
          path: string;
          targetId?: string;
        }>
      >;
    };
  };
};
