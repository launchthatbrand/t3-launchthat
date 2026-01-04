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
import type * as funnelSteps_mutations from "../funnelSteps/mutations.js";
import type * as funnelSteps_queries from "../funnelSteps/queries.js";
import type * as funnels_mutations from "../funnels/mutations.js";
import type * as funnels_queries from "../funnels/queries.js";
import type * as index from "../index.js";
import type * as plans_mutations from "../plans/mutations.js";
import type * as plans_queries from "../plans/queries.js";
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
  "funnelSteps/mutations": typeof funnelSteps_mutations;
  "funnelSteps/queries": typeof funnelSteps_queries;
  "funnels/mutations": typeof funnels_mutations;
  "funnels/queries": typeof funnels_queries;
  index: typeof index;
  "plans/mutations": typeof plans_mutations;
  "plans/queries": typeof plans_queries;
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
  funnelSteps: {
    mutations: {
      addFunnelStep: FunctionReference<
        "mutation",
        "public",
        {
          funnelId: string;
          kind: "checkout" | "upsell" | "thankYou";
          order?: number;
          organizationId?: string;
          slug?: string;
          title?: string;
        },
        string
      >;
      backfillFunnelStepRoutingMeta: FunctionReference<
        "mutation",
        "public",
        { organizationId?: string },
        { scanned: number; skipped: number; updated: number }
      >;
      ensureBaselineStepsForFunnel: FunctionReference<
        "mutation",
        "public",
        { funnelId: string; organizationId?: string },
        null
      >;
      ensureDefaultFunnelSteps: FunctionReference<
        "mutation",
        "public",
        { organizationId?: string },
        null
      >;
      ensureFunnelStepRoutingMeta: FunctionReference<
        "mutation",
        "public",
        { organizationId?: string; stepId: string },
        null
      >;
    };
    queries: {
      getFunnelStepById: FunctionReference<
        "query",
        "public",
        { organizationId?: string; stepId: string },
        null | {
          checkout?: {
            design: string;
            predefinedProductPostIds: Array<string>;
          };
          funnelId: string;
          funnelSlug: string;
          isDefaultFunnel: boolean;
          kind: string;
          order: number;
          stepId: string;
          stepSlug: string;
          stepTitle?: string;
        }
      >;
      getFunnelStepBySlug: FunctionReference<
        "query",
        "public",
        { funnelSlug: string; organizationId?: string; stepSlug: string },
        null | {
          checkout?: {
            design: string;
            predefinedProductPostIds: Array<string>;
          };
          funnelId: string;
          funnelSlug: string;
          isDefaultFunnel: boolean;
          kind: string;
          order: number;
          stepId: string;
          stepSlug: string;
          stepTitle?: string;
        }
      >;
      getFunnelStepsForFunnel: FunctionReference<
        "query",
        "public",
        { funnelId: string; organizationId?: string },
        Array<{
          id: string;
          kind: string;
          order: number;
          slug: string;
          title?: string;
        }>
      >;
    };
  };
  funnels: {
    mutations: {
      ensureDefaultFunnel: FunctionReference<
        "mutation",
        "public",
        { organizationId?: string },
        string
      >;
    };
    queries: {
      getDefaultFunnel: FunctionReference<
        "query",
        "public",
        { organizationId?: string },
        null | { id: string; isDefault: boolean; slug: string; title?: string }
      >;
      getFunnelBySlug: FunctionReference<
        "query",
        "public",
        { organizationId?: string; slug: string },
        null | { id: string; isDefault: boolean; slug: string; title?: string }
      >;
    };
  };
  plans: {
    mutations: {
      seedPlans: FunctionReference<"mutation", "public", {}, Array<string>>;
      updatePlan: FunctionReference<
        "mutation",
        "public",
        {
          description?: string;
          displayName?: string;
          features?: Array<string>;
          isActive?: boolean;
          maxOrganizations?: number;
          planId: string;
          priceMonthly?: number;
          priceYearly?: number;
          sortOrder?: number;
        },
        null
      >;
    };
    queries: {
      getPlanById: FunctionReference<
        "query",
        "public",
        { planId: string },
        null | {
          _creationTime: number;
          _id: string;
          description: string;
          displayName: string;
          features?: Array<string>;
          isActive: boolean;
          maxOrganizations: number;
          name: "free" | "starter" | "business" | "agency";
          priceMonthly: number;
          priceYearly?: number;
          sortOrder: number;
          updatedAt: number;
        }
      >;
      getPlanByName: FunctionReference<
        "query",
        "public",
        { name: "free" | "starter" | "business" | "agency" },
        null | {
          _creationTime: number;
          _id: string;
          description: string;
          displayName: string;
          features?: Array<string>;
          isActive: boolean;
          maxOrganizations: number;
          name: "free" | "starter" | "business" | "agency";
          priceMonthly: number;
          priceYearly?: number;
          sortOrder: number;
          updatedAt: number;
        }
      >;
      getPlans: FunctionReference<
        "query",
        "public",
        { isActive?: boolean },
        Array<{
          _creationTime: number;
          _id: string;
          description: string;
          displayName: string;
          features?: Array<string>;
          isActive: boolean;
          maxOrganizations: number;
          name: "free" | "starter" | "business" | "agency";
          priceMonthly: number;
          priceYearly?: number;
          sortOrder: number;
          updatedAt: number;
        }>
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
      findFirstPostIdByMetaKeyValue: FunctionReference<
        "query",
        "public",
        {
          key: string;
          organizationId?: string;
          postTypeSlug?: string;
          value: string;
        },
        null | string
      >;
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
      listPostIdsByMetaKeyValue: FunctionReference<
        "query",
        "public",
        {
          key: string;
          limit?: number;
          organizationId?: string;
          postTypeSlug?: string;
          value: string;
        },
        Array<string>
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
