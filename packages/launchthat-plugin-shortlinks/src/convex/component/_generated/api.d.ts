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
import type * as mutations from "../mutations.js";
import type * as queries from "../queries.js";

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
  mutations: typeof mutations;
  queries: typeof queries;
}>;
export type Mounts = {
  mutations: {
    create: FunctionReference<
      "mutation",
      "public",
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
      "public",
      { appKey: string; code: string },
      null
    >;
    upsertSettings: FunctionReference<
      "mutation",
      "public",
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
      "public",
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
      "public",
      { appKey: string },
      { alphabet: string; codeLength: number; domain: string; enabled: boolean }
    >;
    listByCreator: FunctionReference<
      "query",
      "public",
      { appKey: string; createdByUserId: string; kind: string; limit?: number },
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
