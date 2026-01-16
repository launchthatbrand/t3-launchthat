/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as traderlaunchpad_actions from "../traderlaunchpad/actions.js";
import type * as traderlaunchpad_lib_resolve from "../traderlaunchpad/lib/resolve.js";
import type * as traderlaunchpad_queries from "../traderlaunchpad/queries.js";
import type * as traderlaunchpad_types from "../traderlaunchpad/types.js";

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
  "traderlaunchpad/actions": typeof traderlaunchpad_actions;
  "traderlaunchpad/lib/resolve": typeof traderlaunchpad_lib_resolve;
  "traderlaunchpad/queries": typeof traderlaunchpad_queries;
  "traderlaunchpad/types": typeof traderlaunchpad_types;
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
  launchthat_traderlaunchpad: {
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
      syncTradeLockerConnection: FunctionReference<
        "action",
        "internal",
        {
          limit?: number;
          organizationId: string;
          secretsKey: string;
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
      internalQueries: {
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
      };
    };
  };
};
