/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as posts_helpers from "../posts/helpers.js";
import type * as posts_mutations from "../posts/mutations.js";
import type * as posts_queries from "../posts/queries.js";

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
  "posts/helpers": typeof posts_helpers;
  "posts/mutations": typeof posts_mutations;
  "posts/queries": typeof posts_queries;
}>;
export type Mounts = {
  posts: {
    mutations: {
      bulkUpdatePostStatus: FunctionReference<
        "mutation",
        "public",
        { ids: Array<string>; status: "published" | "draft" | "archived" },
        any
      >;
      createPost: FunctionReference<
        "mutation",
        "public",
        {
          category?: string;
          content?: string;
          excerpt?: string;
          featuredImage?: string;
          meta?: Record<string, string | number | boolean | null>;
          organizationId?: string;
          postTypeSlug: string;
          slug: string;
          status: "published" | "draft" | "archived";
          tags?: Array<string>;
          title: string;
        },
        any
      >;
      deletePost: FunctionReference<"mutation", "public", { id: string }, any>;
      updatePost: FunctionReference<
        "mutation",
        "public",
        {
          category?: string;
          content?: string;
          excerpt?: string;
          featuredImage?: string;
          id: string;
          meta?: Record<string, string | number | boolean | null>;
          slug?: string;
          status?: "published" | "draft" | "archived";
          tags?: Array<string>;
          title?: string;
        },
        any
      >;
      updatePostStatus: FunctionReference<
        "mutation",
        "public",
        { id: string; status: "published" | "draft" | "archived" },
        any
      >;
    };
    queries: {
      getAllPosts: FunctionReference<
        "query",
        "public",
        {
          filters?: {
            authorId?: string;
            category?: string;
            limit?: number;
            postTypeSlug?: string;
            status?: "published" | "draft" | "archived";
          };
          organizationId?: string;
        },
        any
      >;
      getPostById: FunctionReference<
        "query",
        "public",
        { id: string; organizationId?: string },
        any
      >;
      getPostBySlug: FunctionReference<
        "query",
        "public",
        { organizationId?: string; slug: string },
        any
      >;
      getPostCategories: FunctionReference<
        "query",
        "public",
        { organizationId?: string; postTypeSlug?: string },
        any
      >;
      getPostMeta: FunctionReference<
        "query",
        "public",
        { organizationId?: string; postId: string },
        any
      >;
      getPostTags: FunctionReference<
        "query",
        "public",
        { organizationId?: string; postTypeSlug?: string },
        any
      >;
      searchPosts: FunctionReference<
        "query",
        "public",
        {
          limit?: number;
          organizationId?: string;
          postTypeSlug?: string;
          searchTerm: string;
        },
        any
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
