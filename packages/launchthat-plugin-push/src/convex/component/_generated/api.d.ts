/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as index from "../index.js";
import type * as lib from "../lib.js";
import type * as mutations from "../mutations.js";
import type * as queries from "../queries.js";
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
  index: typeof index;
  lib: typeof lib;
  mutations: typeof mutations;
  queries: typeof queries;
  server: typeof server;
}>;
export type Mounts = {
  mutations: {
    deleteMyPushSubscription: FunctionReference<
      "mutation",
      "public",
      { endpoint?: string },
      null
    >;
    upsertMyPushSubscription: FunctionReference<
      "mutation",
      "public",
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
      "public",
      {},
      string | null
    >;
    listMySubscriptions: FunctionReference<
      "query",
      "public",
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
      "public",
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
