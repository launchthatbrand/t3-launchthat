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
import type * as tradingPlans_index from "../tradingPlans/index.js";

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
  "tradingPlans/index": typeof tradingPlans_index;
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
      setConnectionSelectedAccount: FunctionReference<
        "mutation",
        "public",
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
        "public",
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
      upsertConnectionAccount: FunctionReference<
        "mutation",
        "public",
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
      listMyConnectionAccounts: FunctionReference<
        "query",
        "public",
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
          unrealizedPnl?: number;
          userId: string;
        },
        { id: string; wasNew: boolean }
      >;
      upsertTradeRealizationEvent: FunctionReference<
        "mutation",
        "public",
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
    probeAllAccountsForUser: FunctionReference<
      "action",
      "public",
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
      "public",
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
      "public",
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
      "public",
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
      "public",
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
      "public",
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
      "public",
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
      "public",
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
      "public",
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
      "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
      listLatestForSymbol: FunctionReference<
        "query",
        "public",
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
        "public",
        { organizationId: string; planId: string; userId: string },
        null
      >;
      createOrgTradingPlanFromTemplate: FunctionReference<
        "mutation",
        "public",
        { createdByUserId: string; name?: string; organizationId: string },
        string
      >;
      createTradingPlanFromTemplate: FunctionReference<
        "mutation",
        "public",
        { name?: string; organizationId: string; userId: string },
        string
      >;
      getActiveTradingPlan: FunctionReference<
        "query",
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
        { organizationId: string; planId: string; userId: string },
        null
      >;
      setMyOrgTradingPlan: FunctionReference<
        "mutation",
        "public",
        { organizationId: string; planId: string; userId: string },
        null
      >;
      setOrgTradingPlanPolicy: FunctionReference<
        "mutation",
        "public",
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
