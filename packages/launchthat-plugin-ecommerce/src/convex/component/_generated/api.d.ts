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
import type * as discounts_mutations from "../discounts/mutations.js";
import type * as discounts_queries from "../discounts/queries.js";
import type * as funnelSteps_mutations from "../funnelSteps/mutations.js";
import type * as funnelSteps_queries from "../funnelSteps/queries.js";
import type * as funnels_mutations from "../funnels/mutations.js";
import type * as funnels_queries from "../funnels/queries.js";
import type * as index from "../index.js";
import type * as payouts_actions from "../payouts/actions.js";
import type * as payouts_internal from "../payouts/internal.js";
import type * as payouts_mutations from "../payouts/mutations.js";
import type * as payouts_paymentEvents from "../payouts/paymentEvents.js";
import type * as payouts_queries from "../payouts/queries.js";
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
  "discounts/mutations": typeof discounts_mutations;
  "discounts/queries": typeof discounts_queries;
  "funnelSteps/mutations": typeof funnelSteps_mutations;
  "funnelSteps/queries": typeof funnelSteps_queries;
  "funnels/mutations": typeof funnels_mutations;
  "funnels/queries": typeof funnels_queries;
  index: typeof index;
  "payouts/actions": typeof payouts_actions;
  "payouts/internal": typeof payouts_internal;
  "payouts/mutations": typeof payouts_mutations;
  "payouts/paymentEvents": typeof payouts_paymentEvents;
  "payouts/queries": typeof payouts_queries;
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
      mergeGuestCartIntoUserCart: FunctionReference<
        "mutation",
        "public",
        { guestSessionId: string; userId: string },
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
  discounts: {
    mutations: {
      createDiscountCode: FunctionReference<
        "mutation",
        "public",
        {
          active?: boolean;
          amount: number;
          code: string;
          kind: "percent" | "fixed";
          organizationId?: string;
        },
        string
      >;
      deleteDiscountCode: FunctionReference<
        "mutation",
        "public",
        { id: string },
        null
      >;
      updateDiscountCode: FunctionReference<
        "mutation",
        "public",
        {
          active?: boolean;
          amount?: number;
          code?: string;
          id: string;
          kind?: "percent" | "fixed";
        },
        null
      >;
      validateDiscountCode: FunctionReference<
        "mutation",
        "public",
        { code: string; organizationId?: string; subtotal: number },
        {
          amount?: number;
          appliedCode?: string;
          discountAmount: number;
          kind?: "percent" | "fixed";
          ok: boolean;
          reason?: string;
        }
      >;
    };
    queries: {
      getDiscountCodeByCode: FunctionReference<
        "query",
        "public",
        { code: string; organizationId?: string },
        null | any
      >;
      listDiscountCodes: FunctionReference<
        "query",
        "public",
        { organizationId?: string },
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
  payouts: {
    actions: {
      createStripeConnectOnboardingLinkForUser: FunctionReference<
        "action",
        "public",
        {
          businessType?: "individual" | "company";
          email?: string;
          fullName?: string;
          metadata?: any;
          productDescription?: string;
          refreshUrl: string;
          returnUrl: string;
          stripeSecretKey: string;
          supportEmail?: string;
          userId: string;
          websiteUrl?: string;
        },
        { connectAccountId: string; ok: boolean; url: string }
      >;
      disconnectStripePayoutAccountForUser: FunctionReference<
        "action",
        "public",
        { deleteRemote?: boolean; stripeSecretKey: string; userId: string },
        { deletedLocal: boolean; deletedRemote: boolean; ok: boolean }
      >;
      getUpcomingSubscriptionDueCentsForUser: FunctionReference<
        "action",
        "public",
        { currency?: string; stripeSecretKey: string; userId: string },
        { dueCents: number; ok: boolean }
      >;
      processStripeWebhook: FunctionReference<
        "action",
        "public",
        {
          rawBody: string;
          signature: string;
          stripeSecretKey: string;
          stripeWebhookSecret: string;
        },
        { handled: boolean; ok: boolean }
      >;
      runMonthly: FunctionReference<
        "action",
        "public",
        {
          dryRun?: boolean;
          periodEnd: number;
          periodStart: number;
          provider?: string;
          providerConfig?: any;
        },
        {
          errors: Array<string>;
          ok: boolean;
          processedUsers: number;
          runId: string | null;
          totalCashCents: number;
          totalSubscriptionCreditCents: number;
        }
      >;
    };
    mutations: {
      deletePayoutAccount: FunctionReference<
        "mutation",
        "public",
        { provider?: string; userId: string },
        { connectAccountId?: string; deleted: boolean; ok: boolean }
      >;
      setPayoutPreference: FunctionReference<
        "mutation",
        "public",
        {
          currency?: string;
          minPayoutCents?: number;
          policy: "payout_only" | "apply_to_subscription_then_payout";
          userId: string;
        },
        { ok: boolean }
      >;
      upsertPayoutAccount: FunctionReference<
        "mutation",
        "public",
        {
          connectAccountId: string;
          details?: any;
          provider?: string;
          status: string;
          userId: string;
        },
        { created: boolean; ok: boolean }
      >;
    };
    paymentEvents: {
      recordCommissionablePayment: FunctionReference<
        "mutation",
        "public",
        {
          amountCents: number;
          commissionRateBps?: number;
          currency?: string;
          externalEventId: string;
          kind: string;
          occurredAt?: number;
          referredUserId: string;
          source: string;
        },
        {
          commissionCents: number;
          created: boolean;
          ok: boolean;
          referrerUserId: string | null;
        }
      >;
    };
    queries: {
      getPayoutAccount: FunctionReference<
        "query",
        "public",
        { provider?: string; userId: string },
        null | {
          connectAccountId: string;
          createdAt: number;
          details?: any;
          provider: string;
          status: string;
          updatedAt: number;
          userId: string;
        }
      >;
      getPayoutPreference: FunctionReference<
        "query",
        "public",
        { userId: string },
        null | {
          createdAt: number;
          currency: string;
          minPayoutCents: number;
          policy: string;
          updatedAt: number;
          userId: string;
        }
      >;
      listPayoutTransfersForUser: FunctionReference<
        "query",
        "public",
        { limit?: number; userId: string },
        Array<{
          cashCents: number;
          createdAt: number;
          currency: string;
          error?: string;
          externalBalanceTxnId?: string;
          externalTransferId?: string;
          provider: string;
          runId: string;
          status: string;
          subscriptionCreditCents: number;
          updatedAt: number;
          userId: string;
        }>
      >;
    };
  };
  plans: {
    mutations: {
      deactivateProductPlan: FunctionReference<
        "mutation",
        "public",
        { productPostId: string },
        null
      >;
      seedPlans: FunctionReference<"mutation", "public", {}, Array<string>>;
      updatePlan: FunctionReference<
        "mutation",
        "public",
        {
          description?: string;
          displayName?: string;
          features?: Array<string>;
          isActive?: boolean;
          limits?: {
            crmMaxContacts?: number;
            discordAiDaily?: number;
            supportBubbleAiDaily?: number;
          };
          maxOrganizations?: number;
          planId: string;
          priceMonthly?: number;
          priceYearly?: number;
          sortOrder?: number;
        },
        null
      >;
      upsertProductPlan: FunctionReference<
        "mutation",
        "public",
        {
          description?: string;
          displayName?: string;
          features?: Array<string>;
          isActive: boolean;
          limits?: {
            crmMaxContacts?: number;
            discordAiDaily?: number;
            supportBubbleAiDaily?: number;
          };
          maxOrganizations?: number;
          priceMonthly?: number;
          priceYearly?: number;
          productPostId: string;
          sortOrder?: number;
        },
        string
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
          kind: "system" | "product";
          limits?: {
            crmMaxContacts?: number;
            discordAiDaily?: number;
            supportBubbleAiDaily?: number;
          };
          maxOrganizations: number;
          name: string;
          priceMonthly: number;
          priceYearly?: number;
          productPostId?: string;
          sortOrder: number;
          updatedAt: number;
        }
      >;
      getPlanByName: FunctionReference<
        "query",
        "public",
        { name: string },
        null | {
          _creationTime: number;
          _id: string;
          description: string;
          displayName: string;
          features?: Array<string>;
          isActive: boolean;
          kind: "system" | "product";
          limits?: {
            crmMaxContacts?: number;
            discordAiDaily?: number;
            supportBubbleAiDaily?: number;
          };
          maxOrganizations: number;
          name: string;
          priceMonthly: number;
          priceYearly?: number;
          productPostId?: string;
          sortOrder: number;
          updatedAt: number;
        }
      >;
      getPlanByProductPostId: FunctionReference<
        "query",
        "public",
        { productPostId: string },
        null | {
          _creationTime: number;
          _id: string;
          description: string;
          displayName: string;
          features?: Array<string>;
          isActive: boolean;
          kind: "system" | "product";
          limits?: {
            crmMaxContacts?: number;
            discordAiDaily?: number;
            supportBubbleAiDaily?: number;
          };
          maxOrganizations: number;
          name: string;
          priceMonthly: number;
          priceYearly?: number;
          productPostId?: string;
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
          kind: "system" | "product";
          limits?: {
            crmMaxContacts?: number;
            discordAiDaily?: number;
            supportBubbleAiDaily?: number;
          };
          maxOrganizations: number;
          name: string;
          priceMonthly: number;
          priceYearly?: number;
          productPostId?: string;
          sortOrder: number;
          updatedAt: number;
        }>
      >;
      listAssignableOrgPlans: FunctionReference<
        "query",
        "public",
        {},
        Array<{
          _creationTime: number;
          _id: string;
          description: string;
          displayName: string;
          features?: Array<string>;
          isActive: boolean;
          kind: "system" | "product";
          limits?: {
            crmMaxContacts?: number;
            discordAiDaily?: number;
            supportBubbleAiDaily?: number;
          };
          maxOrganizations: number;
          name: string;
          priceMonthly: number;
          priceYearly?: number;
          productPostId?: string;
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

export declare const components: {
  stripe: {
    payouts: {
      applyCustomerBalanceCredit: FunctionReference<
        "action",
        "internal",
        {
          amountCents: number;
          currency?: string;
          runId?: string;
          stripeSecretKey: string;
          userId: string;
        },
        { balanceTransactionId: string; ok: boolean }
      >;
      createConnectOnboardingLink: FunctionReference<
        "action",
        "internal",
        {
          connectAccountId: string;
          refreshUrl: string;
          returnUrl: string;
          stripeSecretKey: string;
        },
        { ok: boolean; url: string }
      >;
      createOrGetExpressConnectAccountForUser: FunctionReference<
        "action",
        "internal",
        {
          businessType?: "individual" | "company";
          email?: string;
          fullName?: string;
          metadata?: any;
          productDescription?: string;
          stripeSecretKey: string;
          supportEmail?: string;
          userId: string;
          websiteUrl?: string;
        },
        { connectAccountId: string; ok: boolean }
      >;
      createTransferToConnectedAccount: FunctionReference<
        "action",
        "internal",
        {
          amountCents: number;
          connectAccountId: string;
          currency?: string;
          runId?: string;
          stripeSecretKey: string;
          userId: string;
        },
        { ok: boolean; transferId: string }
      >;
      deleteExpressConnectAccount: FunctionReference<
        "action",
        "internal",
        { connectAccountId: string; stripeSecretKey: string },
        { deleted: boolean; ok: boolean }
      >;
      getUpcomingSubscriptionDueCentsForUser: FunctionReference<
        "action",
        "internal",
        { currency?: string; stripeSecretKey: string; userId: string },
        { dueCents: number; ok: boolean }
      >;
    };
    webhooks: {
      processEvent: FunctionReference<
        "action",
        "internal",
        {
          rawBody: string;
          signature: string;
          stripeSecretKey: string;
          stripeWebhookSecret: string;
        },
        {
          amountCents: number | null;
          currency: string | null;
          error: string | null;
          externalEventId: string | null;
          handled: boolean;
          kind: string | null;
          occurredAt: number | null;
          ok: boolean;
          userId: string | null;
        }
      >;
    };
  };
};
