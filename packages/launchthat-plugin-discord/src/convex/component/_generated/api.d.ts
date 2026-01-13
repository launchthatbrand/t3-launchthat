/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as guildConnections_index from "../guildConnections/index.js";
import type * as guildConnections_mutations from "../guildConnections/mutations.js";
import type * as guildConnections_queries from "../guildConnections/queries.js";
import type * as guildSettings_index from "../guildSettings/index.js";
import type * as guildSettings_mutations from "../guildSettings/mutations.js";
import type * as guildSettings_queries from "../guildSettings/queries.js";
import type * as index from "../index.js";
import type * as oauth_index from "../oauth/index.js";
import type * as oauth_mutations from "../oauth/mutations.js";
import type * as oauth_queries from "../oauth/queries.js";
import type * as orgConfigs_index from "../orgConfigs/index.js";
import type * as orgConfigs_internal from "../orgConfigs/internal.js";
import type * as orgConfigs_internalQueries from "../orgConfigs/internalQueries.js";
import type * as orgConfigs_migrations from "../orgConfigs/migrations.js";
import type * as orgConfigs_mutations from "../orgConfigs/mutations.js";
import type * as orgConfigs_queries from "../orgConfigs/queries.js";
import type * as roleRules_index from "../roleRules/index.js";
import type * as roleRules_mutations from "../roleRules/mutations.js";
import type * as roleRules_queries from "../roleRules/queries.js";
import type * as server from "../server.js";
import type * as support_index from "../support/index.js";
import type * as support_mutations from "../support/mutations.js";
import type * as support_queries from "../support/queries.js";
import type * as syncJobs_index from "../syncJobs/index.js";
import type * as syncJobs_mutations from "../syncJobs/mutations.js";
import type * as syncJobs_queries from "../syncJobs/queries.js";
import type * as userLinks_index from "../userLinks/index.js";
import type * as userLinks_mutations from "../userLinks/mutations.js";
import type * as userLinks_queries from "../userLinks/queries.js";

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
  "guildConnections/index": typeof guildConnections_index;
  "guildConnections/mutations": typeof guildConnections_mutations;
  "guildConnections/queries": typeof guildConnections_queries;
  "guildSettings/index": typeof guildSettings_index;
  "guildSettings/mutations": typeof guildSettings_mutations;
  "guildSettings/queries": typeof guildSettings_queries;
  index: typeof index;
  "oauth/index": typeof oauth_index;
  "oauth/mutations": typeof oauth_mutations;
  "oauth/queries": typeof oauth_queries;
  "orgConfigs/index": typeof orgConfigs_index;
  "orgConfigs/internal": typeof orgConfigs_internal;
  "orgConfigs/internalQueries": typeof orgConfigs_internalQueries;
  "orgConfigs/migrations": typeof orgConfigs_migrations;
  "orgConfigs/mutations": typeof orgConfigs_mutations;
  "orgConfigs/queries": typeof orgConfigs_queries;
  "roleRules/index": typeof roleRules_index;
  "roleRules/mutations": typeof roleRules_mutations;
  "roleRules/queries": typeof roleRules_queries;
  server: typeof server;
  "support/index": typeof support_index;
  "support/mutations": typeof support_mutations;
  "support/queries": typeof support_queries;
  "syncJobs/index": typeof syncJobs_index;
  "syncJobs/mutations": typeof syncJobs_mutations;
  "syncJobs/queries": typeof syncJobs_queries;
  "userLinks/index": typeof userLinks_index;
  "userLinks/mutations": typeof userLinks_mutations;
  "userLinks/queries": typeof userLinks_queries;
}>;
export type Mounts = {
  guildConnections: {
    mutations: {
      deleteGuildConnection: FunctionReference<
        "mutation",
        "public",
        { guildId: string; organizationId: string },
        null
      >;
      upsertGuildConnection: FunctionReference<
        "mutation",
        "public",
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
        "public",
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
        "public",
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
        "public",
        {
          announcementChannelId?: string;
          announcementEventKeys?: Array<string>;
          approvedMemberRoleId?: string;
          courseUpdatesChannelId?: string;
          escalationConfidenceThreshold?: number;
          escalationKeywords?: Array<string>;
          guildId: string;
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
        "public",
        { guildId: string; organizationId: string },
        null | {
          announcementChannelId?: string;
          announcementEventKeys?: Array<string>;
          approvedMemberRoleId?: string;
          courseUpdatesChannelId?: string;
          escalationConfidenceThreshold?: number;
          escalationKeywords?: Array<string>;
          guildId: string;
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
    mutations: {
      consumeOauthState: FunctionReference<
        "mutation",
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
        {
          marketingTagId: string;
          organizationId: string;
          rules: Array<{ guildId: string; roleId: string; roleName?: string }>;
        },
        null
      >;
      replaceOrgRoleRules: FunctionReference<
        "mutation",
        "public",
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
        "public",
        {
          organizationId: string;
          productId: string;
          rules: Array<{ guildId: string; roleId: string; roleName?: string }>;
        },
        null
      >;
    };
    queries: {
      listRoleRulesForMarketingTags: FunctionReference<
        "query",
        "public",
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
        "public",
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
        "public",
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
  support: {
    mutations: {
      logDiscordApiCall: FunctionReference<
        "mutation",
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
        { guildId: string; threadId: string },
        null | {
          privateThreadId: string;
          publicThreadId: string;
          requesterDiscordUserId: string;
        }
      >;
      hasAiRunForTriggerMessage: FunctionReference<
        "query",
        "public",
        { guildId: string; triggerMessageId: string },
        boolean
      >;
    };
  };
  syncJobs: {
    mutations: {
      deleteJob: FunctionReference<
        "mutation",
        "public",
        { jobId: string },
        null
      >;
      enqueueSyncJob: FunctionReference<
        "mutation",
        "public",
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
        "public",
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
        "public",
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
  userLinks: {
    mutations: {
      linkUser: FunctionReference<
        "mutation",
        "public",
        { discordUserId: string; organizationId: string; userId: string },
        null
      >;
    };
    queries: {
      getUserLink: FunctionReference<
        "query",
        "public",
        { organizationId: string; userId: string },
        { discordUserId: string; linkedAt: number } | null
      >;
    };
  };
};
// For now fullApiWithMounts is only fullApi which provides
// jump-to-definition in component client code.
// Use Mounts for the same type without the inference.
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
