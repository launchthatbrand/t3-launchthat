/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bars_index from "../bars/index.js";
import type * as bars_mutations from "../bars/mutations.js";
import type * as bars_queries from "../bars/queries.js";
import type * as index from "../index.js";
import type * as instruments_index from "../instruments/index.js";
import type * as instruments_mutations from "../instruments/mutations.js";
import type * as instruments_queries from "../instruments/queries.js";
import type * as server from "../server.js";
import type * as sources_index from "../sources/index.js";
import type * as sources_mutations from "../sources/mutations.js";
import type * as sources_queries from "../sources/queries.js";
import type * as tradelocker_actions from "../tradelocker/actions.js";

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
  "bars/index": typeof bars_index;
  "bars/mutations": typeof bars_mutations;
  "bars/queries": typeof bars_queries;
  index: typeof index;
  "instruments/index": typeof instruments_index;
  "instruments/mutations": typeof instruments_mutations;
  "instruments/queries": typeof instruments_queries;
  server: typeof server;
  "sources/index": typeof sources_index;
  "sources/mutations": typeof sources_mutations;
  "sources/queries": typeof sources_queries;
  "tradelocker/actions": typeof tradelocker_actions;
}>;
export type Mounts = {
  bars: {
    index: {
      getBarChunks: FunctionReference<
        "query",
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
        { sourceKey: string; tradableInstrumentIds: Array<string> },
        Array<{ symbol: string; tradableInstrumentId: string }>
      >;
      listInstrumentsForSource: FunctionReference<
        "query",
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
        { sourceKey: string; tradableInstrumentIds: Array<string> },
        Array<{ symbol: string; tradableInstrumentId: string }>
      >;
      listInstrumentsForSource: FunctionReference<
        "query",
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
