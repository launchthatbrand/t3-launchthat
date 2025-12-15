/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as helpers from "../helpers.js";
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
  helpers: typeof helpers;
  mutations: typeof mutations;
  queries: typeof queries;
}>;
export type Mounts = {
  mutations: {
    createSupportPost: FunctionReference<
      "mutation",
      "public",
      {
        authorId?: string;
        content?: string;
        excerpt?: string;
        meta?: Array<{ key: string; value?: string | number | boolean | null }>;
        organizationId: string;
        parentId?: string;
        parentTypeSlug?: string;
        postTypeSlug: string;
        slug: string;
        status: "published" | "draft" | "archived";
        tags?: Array<string>;
        title: string;
      },
      any
    >;
    updateSupportPost: FunctionReference<
      "mutation",
      "public",
      {
        authorId?: string;
        content?: string;
        excerpt?: string;
        id: string;
        meta?: Array<{ key: string; value?: string | number | boolean | null }>;
        organizationId: string;
        parentId?: string;
        parentTypeSlug?: string;
        postTypeSlug: string;
        slug: string;
        status: "published" | "draft" | "archived";
        tags?: Array<string>;
        title: string;
      },
      any
    >;
    upsertSupportOption: FunctionReference<
      "mutation",
      "public",
      {
        key: string;
        organizationId: string;
        value?: string | number | boolean | null;
      },
      any
    >;
    upsertSupportPostMeta: FunctionReference<
      "mutation",
      "public",
      {
        entries: Array<{
          key: string;
          value?: string | number | boolean | null;
        }>;
        organizationId: string;
        postId: string;
      },
      any
    >;
  };
  queries: {
    getSupportOption: FunctionReference<
      "query",
      "public",
      { key: string; organizationId: string },
      any
    >;
    getSupportPostById: FunctionReference<
      "query",
      "public",
      { id: string; organizationId?: string },
      any
    >;
    getSupportPostMeta: FunctionReference<
      "query",
      "public",
      { organizationId?: string; postId: string },
      any
    >;
    listSupportOptions: FunctionReference<
      "query",
      "public",
      { organizationId: string },
      any
    >;
    listSupportPosts: FunctionReference<
      "query",
      "public",
      {
        filters?: {
          limit?: number;
          parentId?: string;
          postTypeSlug?: string;
          status?: "published" | "draft" | "archived";
        };
        organizationId: string;
      },
      any
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
