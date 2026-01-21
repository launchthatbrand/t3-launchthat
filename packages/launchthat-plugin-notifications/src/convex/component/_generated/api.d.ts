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
    createNotification: FunctionReference<
      "mutation",
      "public",
      {
        actionUrl?: string;
        clerkId: string;
        content?: string;
        eventKey: string;
        orgId: string;
        tabKey?: string;
        title: string;
      },
      null | string
    >;
    markAllNotificationsAsReadByClerkId: FunctionReference<
      "mutation",
      "public",
      { clerkId: string },
      number
    >;
    markAllNotificationsAsReadByClerkIdAndOrgId: FunctionReference<
      "mutation",
      "public",
      { clerkId: string; orgId: string },
      number
    >;
    markNotificationAsRead: FunctionReference<
      "mutation",
      "public",
      { notificationId: string },
      boolean
    >;
  };
  queries: {
    paginateByClerkIdAcrossOrgs: FunctionReference<
      "query",
      "public",
      {
        clerkId: string;
        filters?: { eventKey?: string; tabKey?: string };
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
      },
      { continueCursor: string | null; isDone: boolean; page: Array<any> }
    >;
    paginateByClerkIdAndOrgId: FunctionReference<
      "query",
      "public",
      {
        clerkId: string;
        filters?: { eventKey?: string; tabKey?: string };
        orgId: string;
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
      },
      { continueCursor: string | null; isDone: boolean; page: Array<any> }
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
