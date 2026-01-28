/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as candles_actions from "../candles/actions.js";
import type * as candles_index from "../candles/index.js";
import type * as index from "../index.js";
import type * as lib_clickhouseHttp from "../lib/clickhouseHttp.js";
import type * as server from "../server.js";

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
  "candles/actions": typeof candles_actions;
  "candles/index": typeof candles_index;
  index: typeof index;
  "lib/clickhouseHttp": typeof lib_clickhouseHttp;
  server: typeof server;
}>;
export type Mounts = {
  candles: {
    actions: {
      getMaxTsMs1m: FunctionReference<
        "action",
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
        "public",
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
