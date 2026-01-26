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
import type * as lib_hash from "../lib/hash.js";
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
  "lib/hash": typeof lib_hash;
  mutations: typeof mutations;
  queries: typeof queries;
}>;
export type Mounts = {
  mutations: {
    createJoinCode: FunctionReference<
      "mutation",
      "public",
      {
        code?: string;
        createdByUserId: string;
        expiresAt?: number;
        label?: string;
        maxUses?: number;
        organizationId?: string;
        scope: "platform" | "organization";
      },
      { code: string; codeHash: string; joinCodeId: string }
    >;
    deactivateJoinCode: FunctionReference<
      "mutation",
      "public",
      { joinCodeId: string },
      null
    >;
    deleteJoinCode: FunctionReference<
      "mutation",
      "public",
      { joinCodeId: string },
      null
    >;
    redeemJoinCode: FunctionReference<
      "mutation",
      "public",
      { code: string; redeemedByUserId: string },
      {
        expiresAt?: number;
        joinCodeId: string;
        label?: string;
        maxUses?: number;
        organizationId?: string;
        scope: "platform" | "organization";
        uses: number;
      } | null
    >;
  };
  queries: {
    listJoinCodes: FunctionReference<
      "query",
      "public",
      { organizationId?: string; scope: "platform" | "organization" },
      Array<{
        _id: string;
        createdAt: number;
        createdByUserId: string;
        expiresAt?: number;
        isActive: boolean;
        label?: string;
        maxUses?: number;
        organizationId?: string;
        scope: "platform" | "organization";
        updatedAt: number;
        uses: number;
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
