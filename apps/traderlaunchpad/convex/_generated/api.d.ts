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
import type * as coreTenant_mutations from "../coreTenant/mutations.js";
import type * as coreTenant_organizations from "../coreTenant/organizations.js";
import type * as coreTenant_platformUsers from "../coreTenant/platformUsers.js";
import type * as coreTenant_queries from "../coreTenant/queries.js";
import type * as discord_actions from "../discord/actions.js";
import type * as discord_mutations from "../discord/mutations.js";
import type * as discord_queries from "../discord/queries.js";
import type * as email_actions from "../email/actions.js";
import type * as email_mutations from "../email/mutations.js";
import type * as email_queries from "../email/queries.js";
import type * as feedback_mutations from "../feedback/mutations.js";
import type * as feedback_queries from "../feedback/queries.js";
import type * as notifications_mutations from "../notifications/mutations.js";
import type * as notifications_queries from "../notifications/queries.js";
import type * as notifications_test from "../notifications/test.js";
import type * as onboarding_mutations from "../onboarding/mutations.js";
import type * as onboarding_queries from "../onboarding/queries.js";
import type * as publicProfiles_types from "../publicProfiles/types.js";
import type * as publicProfiles from "../publicProfiles.js";
import type * as traderlaunchpad_actions from "../traderlaunchpad/actions.js";
import type * as traderlaunchpad_lib_resolve from "../traderlaunchpad/lib/resolve.js";
import type * as traderlaunchpad_mutations from "../traderlaunchpad/mutations.js";
import type * as traderlaunchpad_queries from "../traderlaunchpad/queries.js";
import type * as traderlaunchpad_types from "../traderlaunchpad/types.js";
import type * as userMedia from "../userMedia.js";
import type * as viewer_mutations from "../viewer/mutations.js";
import type * as viewer_queries from "../viewer/queries.js";

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
  "coreTenant/mutations": typeof coreTenant_mutations;
  "coreTenant/organizations": typeof coreTenant_organizations;
  "coreTenant/platformUsers": typeof coreTenant_platformUsers;
  "coreTenant/queries": typeof coreTenant_queries;
  "discord/actions": typeof discord_actions;
  "discord/mutations": typeof discord_mutations;
  "discord/queries": typeof discord_queries;
  "email/actions": typeof email_actions;
  "email/mutations": typeof email_mutations;
  "email/queries": typeof email_queries;
  "feedback/mutations": typeof feedback_mutations;
  "feedback/queries": typeof feedback_queries;
  "notifications/mutations": typeof notifications_mutations;
  "notifications/queries": typeof notifications_queries;
  "notifications/test": typeof notifications_test;
  "onboarding/mutations": typeof onboarding_mutations;
  "onboarding/queries": typeof onboarding_queries;
  "publicProfiles/types": typeof publicProfiles_types;
  publicProfiles: typeof publicProfiles;
  "traderlaunchpad/actions": typeof traderlaunchpad_actions;
  "traderlaunchpad/lib/resolve": typeof traderlaunchpad_lib_resolve;
  "traderlaunchpad/mutations": typeof traderlaunchpad_mutations;
  "traderlaunchpad/queries": typeof traderlaunchpad_queries;
  "traderlaunchpad/types": typeof traderlaunchpad_types;
  userMedia: typeof userMedia;
  "viewer/mutations": typeof viewer_mutations;
  "viewer/queries": typeof viewer_queries;
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
            links: Array<{ label: string; url: string }>;
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
            links: Array<{ label: string; url: string }>;
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
            links: Array<{ label: string; url: string }>;
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
            links: Array<{ label: string; url: string }>;
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
            links: Array<{ label: string; url: string }>;
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
        { authorUserId: string; boardId: string; body: string; title: string },
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
          userId: string;
        },
        Array<any>
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
    raw: {
      mutations: {
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
            updatedAt: number;
            userId: string;
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
            updatedAt: number;
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
  };
  launchthat_pricedata: {
    bars: {
      index: {
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
      };
    };
    tradelocker: {
      actions: {
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
  launchthat_discord: {
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
      queries: {
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
};
