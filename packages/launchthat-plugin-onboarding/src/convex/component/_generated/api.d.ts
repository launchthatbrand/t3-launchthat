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
  mutations: typeof mutations;
  queries: typeof queries;
  server: typeof server;
}>;
export type Mounts = {
  mutations: {
    markOnboardingComplete: FunctionReference<
      "mutation",
      "public",
      { organizationId: string; userId: string },
      null
    >;
    setStepComplete: FunctionReference<
      "mutation",
      "public",
      { organizationId: string; stepId: string; userId: string },
      null
    >;
    upsertOnboardingConfig: FunctionReference<
      "mutation",
      "public",
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
      "public",
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
      "public",
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
