/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as cart_mutations from "../cart/mutations.js";
import type * as cart_queries from "../cart/queries.js";
import type * as checkouts_mutations from "../checkouts/mutations.js";
import type * as checkouts_queries from "../checkouts/queries.js";
import type * as index from "../index.js";
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
  "cart/mutations": typeof cart_mutations;
  "cart/queries": typeof cart_queries;
  "checkouts/mutations": typeof checkouts_mutations;
  "checkouts/queries": typeof checkouts_queries;
  index: typeof index;
  "posts/helpers": typeof posts_helpers;
  "posts/mutations": typeof posts_mutations;
  "posts/queries": typeof posts_queries;
}>;
export type Mounts = {
  cart: {
    mutations: {
      addToCart: FunctionReference<
        "mutation",
        "public",
        {
          productPostId: string;
          quantity?: number;
          userId: string;
          variationId?: string;
        },
        any
      >;
      addToGuestCart: FunctionReference<
        "mutation",
        "public",
        {
          guestSessionId: string;
          productPostId: string;
          quantity?: number;
          variationId?: string;
        },
        any
      >;
      clearCart: FunctionReference<
        "mutation",
        "public",
        { guestSessionId?: string; userId?: string },
        any
      >;
      removeFromCart: FunctionReference<
        "mutation",
        "public",
        { cartItemId: string; userId: string },
        any
      >;
      removeFromGuestCart: FunctionReference<
        "mutation",
        "public",
        { cartItemId: string; guestSessionId: string },
        any
      >;
      replaceCart: FunctionReference<
        "mutation",
        "public",
        {
          guestSessionId?: string;
          productPostIds: Array<string>;
          userId?: string;
        },
        any
      >;
      updateCartItemQuantity: FunctionReference<
        "mutation",
        "public",
        {
          cartItemId: string;
          guestSessionId?: string;
          quantity: number;
          userId?: string;
        },
        any
      >;
    };
    queries: {
      getCart: FunctionReference<
        "query",
        "public",
        { guestSessionId?: string; userId?: string },
        any
      >;
    };
  };
  checkouts: {
    mutations: {
      ensureDefaultCheckout: FunctionReference<
        "mutation",
        "public",
        { organizationId?: string },
        string
      >;
    };
    queries: {
      getCheckoutConfigById: FunctionReference<
        "query",
        "public",
        { id: string; organizationId?: string },
        null | {
          design: string;
          isDefault: boolean;
          postId: string;
          predefinedProductPostIds: Array<string>;
          slug: string;
          title?: string;
        }
      >;
      getCheckoutConfigBySlug: FunctionReference<
        "query",
        "public",
        { organizationId?: string; slug: string },
        null | {
          design: string;
          isDefault: boolean;
          postId: string;
          predefinedProductPostIds: Array<string>;
          slug: string;
          title?: string;
        }
      >;
      getDefaultCheckoutConfig: FunctionReference<
        "query",
        "public",
        { organizationId?: string },
        null | {
          design: string;
          isDefault: boolean;
          postId: string;
          predefinedProductPostIds: Array<string>;
          slug: string;
          title?: string;
        }
      >;
    };
  };
  posts: {
    mutations: {
      createPost: FunctionReference<
        "mutation",
        "public",
        {
          authorId?: string;
          category?: string;
          content?: string;
          createdAt?: number;
          excerpt?: string;
          featuredImage?: string;
          featuredImageUrl?: string;
          meta?: Record<string, string | number | boolean | null>;
          organizationId?: string;
          postTypeSlug: string;
          slug: string;
          status:
            | "published"
            | "draft"
            | "archived"
            | "unpaid"
            | "paid"
            | "failed";
          tags?: Array<string>;
          title: string;
          updatedAt?: number;
        },
        any
      >;
      deletePost: FunctionReference<"mutation", "public", { id: string }, any>;
      setPostMeta: FunctionReference<
        "mutation",
        "public",
        {
          key: string;
          postId: string;
          value?: string | number | boolean | null;
        },
        any
      >;
      updatePost: FunctionReference<
        "mutation",
        "public",
        {
          category?: string;
          content?: string;
          excerpt?: string;
          featuredImage?: string;
          featuredImageUrl?: string;
          id: string;
          meta?: Record<string, string | number | boolean | null>;
          organizationId?: string;
          patch?: any;
          slug?: string;
          status?:
            | "published"
            | "draft"
            | "archived"
            | "unpaid"
            | "paid"
            | "failed";
          tags?: Array<string>;
          title?: string;
        },
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
            status?:
              | "published"
              | "draft"
              | "archived"
              | "unpaid"
              | "paid"
              | "failed";
          };
          organizationId?: string;
        },
        any
      >;
      getPostById: FunctionReference<
        "query",
        "public",
        { id: string; organizationId?: string },
        null | any
      >;
      getPostBySlug: FunctionReference<
        "query",
        "public",
        { organizationId?: string; slug: string },
        null | any
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
