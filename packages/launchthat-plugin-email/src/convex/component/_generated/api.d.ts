/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";
import type * as delivery_emailSink from "../delivery/emailSink.js";
import type * as delivery_render from "../delivery/render.js";
import type * as delivery_templates from "../delivery/templates.js";
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
  actions: typeof actions;
  "delivery/emailSink": typeof delivery_emailSink;
  "delivery/render": typeof delivery_render;
  "delivery/templates": typeof delivery_templates;
  index: typeof index;
  mutations: typeof mutations;
  queries: typeof queries;
  server: typeof server;
}>;
export type Mounts = {
  actions: {
    syncEmailDomain: FunctionReference<
      "action",
      "public",
      { orgId: string },
      {
        emailDomain: string | null;
        lastError?: string;
        records: Array<{ name: string; type: string; value: string }>;
        status: "unconfigured" | "pending" | "verified" | "error";
        updatedAt: number;
      }
    >;
  };
  delivery: {
    emailSink: {
      sendTransactionalEmail: FunctionReference<
        "mutation",
        "public",
        {
          orgId: string;
          templateKey: string;
          to: string;
          variables: Record<string, string>;
        },
        string
      >;
    };
  };
  mutations: {
    enqueueEmail: FunctionReference<
      "mutation",
      "public",
      {
        htmlBody: string;
        orgId: string;
        subject: string;
        templateKey?: string;
        textBody: string;
        to: string;
      },
      string
    >;
    enqueueTestEmail: FunctionReference<
      "mutation",
      "public",
      { orgId: string; to: string },
      string
    >;
    setEmailDomain: FunctionReference<
      "mutation",
      "public",
      { domain?: string; orgId: string },
      null
    >;
    upsertEmailSettings: FunctionReference<
      "mutation",
      "public",
      {
        designKey?: "clean" | "bold" | "minimal";
        enabled: boolean;
        fromLocalPart: string;
        fromMode: "portal" | "custom";
        fromName: string;
        orgId: string;
        replyToEmail?: string;
      },
      null
    >;
  };
  queries: {
    getEmailDomain: FunctionReference<
      "query",
      "public",
      { orgId: string },
      null | {
        domain: string | null;
        lastError?: string;
        records: Array<{ name: string; type: string; value: string }>;
        status: "unconfigured" | "pending" | "verified" | "error";
        updatedAt: number;
      }
    >;
    getEmailSettings: FunctionReference<
      "query",
      "public",
      { orgId: string },
      null | {
        designKey?: "clean" | "bold" | "minimal";
        enabled: boolean;
        fromLocalPart: string;
        fromMode: "portal" | "custom";
        fromName: string;
        replyToEmail: string | null;
      }
    >;
    listOutbox: FunctionReference<
      "query",
      "public",
      {
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
