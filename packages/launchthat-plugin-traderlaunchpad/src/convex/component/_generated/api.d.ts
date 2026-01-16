/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as connections_drafts from "../connections/drafts.js";
import type * as connections_index from "../connections/index.js";
import type * as connections_internalQueries from "../connections/internalQueries.js";
import type * as connections_mutations from "../connections/mutations.js";
import type * as connections_queries from "../connections/queries.js";
import type * as index from "../index.js";
import type * as journal_index from "../journal/index.js";
import type * as journal_mutations from "../journal/mutations.js";
import type * as journal_queries from "../journal/queries.js";
import type * as raw_index from "../raw/index.js";
import type * as raw_mutations from "../raw/mutations.js";
import type * as raw_queries from "../raw/queries.js";
import type * as server from "../server.js";
import type * as sync from "../sync.js";
import type * as tradeIdeas_analytics from "../tradeIdeas/analytics.js";
import type * as tradeIdeas_index from "../tradeIdeas/index.js";
import type * as tradeIdeas_internalQueries from "../tradeIdeas/internalQueries.js";
import type * as tradeIdeas_mutations from "../tradeIdeas/mutations.js";
import type * as tradeIdeas_notes from "../tradeIdeas/notes.js";
import type * as tradeIdeas_queries from "../tradeIdeas/queries.js";

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
  "connections/drafts": typeof connections_drafts;
  "connections/index": typeof connections_index;
  "connections/internalQueries": typeof connections_internalQueries;
  "connections/mutations": typeof connections_mutations;
  "connections/queries": typeof connections_queries;
  index: typeof index;
  "journal/index": typeof journal_index;
  "journal/mutations": typeof journal_mutations;
  "journal/queries": typeof journal_queries;
  "raw/index": typeof raw_index;
  "raw/mutations": typeof raw_mutations;
  "raw/queries": typeof raw_queries;
  server: typeof server;
  sync: typeof sync;
  "tradeIdeas/analytics": typeof tradeIdeas_analytics;
  "tradeIdeas/index": typeof tradeIdeas_index;
  "tradeIdeas/internalQueries": typeof tradeIdeas_internalQueries;
  "tradeIdeas/mutations": typeof tradeIdeas_mutations;
  "tradeIdeas/notes": typeof tradeIdeas_notes;
  "tradeIdeas/queries": typeof tradeIdeas_queries;
}>;
export type Mounts = {
  connections: {
    drafts: {
      consumeConnectDraft: FunctionReference<
        "mutation",
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
        { organizationId: string; userId: string },
        null
      >;
      updateConnectionSyncState: FunctionReference<
        "mutation",
        "public",
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
        "public",
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
    };
    queries: {
      getMyConnection: FunctionReference<
        "query",
        "public",
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
    };
  };
  journal: {
    mutations: {
      upsertProfile: FunctionReference<
        "mutation",
        "public",
        { isPublic: boolean; organizationId: string; userId: string },
        { _id: string }
      >;
    };
    queries: {
      getProfileForUser: FunctionReference<
        "query",
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
      "public",
      {
        instrumentId: string;
        organizationId: string;
        secretsKey: string;
        tokenStorage?: "raw" | "enc";
        userId: string;
      },
      { instrumentId: string; raw: any; symbol?: string } | null
    >;
    syncTradeLockerConnection: FunctionReference<
      "action",
      "public",
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
        "public",
        { limit?: number; organizationId: string; userId: string },
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
        "public",
        { limit?: number; organizationId: string; userId: string },
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
    };
    internalQueries: {
      getLatestGroupForSymbol: FunctionReference<
        "query",
        "public",
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
        "public",
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
        "public",
        { organizationId: string; userId: string },
        boolean
      >;
    };
    mutations: {
      markDiscordSynced: FunctionReference<
        "mutation",
        "public",
        { tradeIdeaGroupId: string },
        null
      >;
      rebuildTradeIdeaForPosition: FunctionReference<
        "mutation",
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
        { limit?: number; organizationId: string; userId: string },
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
        "public",
        { organizationId: string; tradeIdeaGroupId: string; userId: string },
        string
      >;
      upsertNoteForGroup: FunctionReference<
        "mutation",
        "public",
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
        "public",
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
        "public",
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
        "public",
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
