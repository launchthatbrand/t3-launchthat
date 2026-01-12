/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as entries_index from "../entries/index.js";
import type * as entries_mutations from "../entries/mutations.js";
import type * as entries_queries from "../entries/queries.js";
import type * as index from "../index.js";
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
  "entries/index": typeof entries_index;
  "entries/mutations": typeof entries_mutations;
  "entries/queries": typeof entries_queries;
  index: typeof index;
  server: typeof server;
}>;
export type Mounts = {
  entries: {
    mutations: {
      insertLogEntry: FunctionReference<
        "mutation",
        "public",
        {
          actionUrl?: string;
          actorUserId?: string;
          createdAt?: number;
          email?: string;
          kind: string;
          level: "debug" | "info" | "warn" | "error";
          message: string;
          metadata?: any;
          organizationId: string;
          pluginKey: string;
          scopeId?: string;
          scopeKind?: string;
          status?: "scheduled" | "running" | "complete" | "failed";
        },
        string
      >;
    };
    queries: {
      listLogsForOrg: FunctionReference<
        "query",
        "public",
        {
          filter?: {
            after?: number;
            before?: number;
            email?: string;
            kind?: string;
            level?: "debug" | "info" | "warn" | "error";
            pluginKey?: string;
            status?: "scheduled" | "running" | "complete" | "failed";
          };
          limit?: number;
          organizationId: string;
        },
        Array<{
          _creationTime: number;
          _id: string;
          actionUrl?: string;
          actorUserId?: string;
          createdAt: number;
          email?: string;
          kind: string;
          level: "debug" | "info" | "warn" | "error";
          message: string;
          metadata?: any;
          organizationId: string;
          pluginKey: string;
          scopeId?: string;
          scopeKind?: string;
          status?: "scheduled" | "running" | "complete" | "failed";
        }>
      >;
      listLogsForOrgPaginated: FunctionReference<
        "query",
        "public",
        {
          filter?: {
            after?: number;
            before?: number;
            email?: string;
            kind?: string;
            level?: "debug" | "info" | "warn" | "error";
            pluginKey?: string;
            status?: "scheduled" | "running" | "complete" | "failed";
          };
          organizationId: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string | null;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            actionUrl?: string;
            actorUserId?: string;
            createdAt: number;
            email?: string;
            kind: string;
            level: "debug" | "info" | "warn" | "error";
            message: string;
            metadata?: any;
            organizationId: string;
            pluginKey: string;
            scopeId?: string;
            scopeKind?: string;
            status?: "scheduled" | "running" | "complete" | "failed";
          }>;
        }
      >;
      listRecentEmailsForOrg: FunctionReference<
        "query",
        "public",
        { limit?: number; organizationId: string; prefix?: string },
        Array<string>
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
