/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as conversions from "../conversions.js";
import type * as credit_actions from "../credit/actions.js";
import type * as credit_queries from "../credit/queries.js";
import type * as index from "../index.js";
import type * as logs from "../logs.js";
import type * as profiles from "../profiles.js";
import type * as referrals_queries from "../referrals/queries.js";
import type * as rewards_actions from "../rewards/actions.js";
import type * as rewards_queries from "../rewards/queries.js";
import type * as tracking from "../tracking.js";

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
  admin: typeof admin;
  conversions: typeof conversions;
  "credit/actions": typeof credit_actions;
  "credit/queries": typeof credit_queries;
  index: typeof index;
  logs: typeof logs;
  profiles: typeof profiles;
  "referrals/queries": typeof referrals_queries;
  "rewards/actions": typeof rewards_actions;
  "rewards/queries": typeof rewards_queries;
  tracking: typeof tracking;
}>;
export type Mounts = {
  admin: {
    getAffiliateProfileByUserId: FunctionReference<
      "query",
      "public",
      { userId: string },
      null | {
        acceptedTermsAt?: number;
        acceptedTermsVersion?: string;
        createdAt: number;
        referralCode: string;
        status: "active" | "disabled";
        updatedAt: number;
        userId: string;
      }
    >;
    listAffiliateConversions: FunctionReference<
      "query",
      "public",
      { fromMs?: number; limit?: number },
      Array<{
        amountCents: number;
        currency: string;
        externalId: string;
        kind: string;
        occurredAt: number;
        referredUserId: string;
        referrerUserId: string;
      }>
    >;
    listAffiliateCreditEventsForUser: FunctionReference<
      "query",
      "public",
      { limit?: number; userId: string },
      Array<{
        amountCents: number;
        conversionId?: string;
        createdAt: number;
        currency: string;
        externalEventId?: string;
        kind?: string;
        reason: string;
        referredUserId?: string;
      }>
    >;
    listAffiliateLogs: FunctionReference<
      "query",
      "public",
      { fromMs?: number; limit?: number },
      Array<{
        amountCents?: number;
        currency?: string;
        data?: any;
        externalId?: string;
        kind: string;
        message: string;
        ownerUserId: string;
        referralCode?: string;
        referredUserId?: string;
        ts: number;
        visitorId?: string;
      }>
    >;
    listAffiliateLogsForUser: FunctionReference<
      "query",
      "public",
      { fromMs?: number; limit?: number; ownerUserId: string },
      Array<{
        amountCents?: number;
        currency?: string;
        data?: any;
        externalId?: string;
        kind: string;
        message: string;
        ownerUserId: string;
        referralCode?: string;
        referredUserId?: string;
        ts: number;
        visitorId?: string;
      }>
    >;
    listAffiliateProfiles: FunctionReference<
      "query",
      "public",
      { limit?: number },
      Array<{
        acceptedTermsAt?: number;
        acceptedTermsVersion?: string;
        createdAt: number;
        referralCode: string;
        status: "active" | "disabled";
        updatedAt: number;
        userId: string;
      }>
    >;
    listReferredUsersForReferrer: FunctionReference<
      "query",
      "public",
      { limit?: number; referrerUserId: string },
      Array<{
        activatedAt?: number;
        attributedAt: number;
        firstPaidConversionAt?: number;
        referredUserId: string;
      }>
    >;
  };
  conversions: {
    recordPaidConversion: FunctionReference<
      "mutation",
      "public",
      {
        amountCents: number;
        currency: string;
        externalId: string;
        kind: "paid_subscription" | "paid_order";
        occurredAt?: number;
        proDiscountAmountOffCentsMonthly?: number;
        referredUserId: string;
        referrerIsPro?: boolean;
      },
      {
        created: boolean;
        discountGranted?: boolean;
        ok: boolean;
        referrerUserId: string | null;
      }
    >;
  };
  credit: {
    actions: {
      consumeForPayout: FunctionReference<
        "mutation",
        "public",
        {
          cashCents?: number;
          currency?: string;
          runId: string;
          source?: string;
          subscriptionCreditCents?: number;
          userId: string;
        },
        {
          balanceCents: number;
          consumedCashCents: number;
          consumedSubscriptionCreditCents: number;
          ok: boolean;
        }
      >;
      recordCommissionFromPayment: FunctionReference<
        "mutation",
        "public",
        {
          amountCents: number;
          commissionRateBps?: number;
          currency?: string;
          externalEventId: string;
          grossAmountCents: number;
          occurredAt?: number;
          paymentKind?: string;
          referredUserId: string;
          source?: string;
        },
        {
          amountCents: number;
          created: boolean;
          grossAmountCents: number;
          ok: boolean;
          referrerUserId: string | null;
        }
      >;
    };
    queries: {
      getCreditBalance: FunctionReference<
        "query",
        "public",
        { currency?: string; userId: string },
        { balanceCents: number; currency: string; userId: string }
      >;
    };
  };
  profiles: {
    createOrGetMyAffiliateProfile: FunctionReference<
      "mutation",
      "public",
      { acceptTerms?: boolean; termsVersion?: string; userId: string },
      { referralCode: string; status: "active" | "disabled"; userId: string }
    >;
    getAffiliateProfileByReferralCode: FunctionReference<
      "query",
      "public",
      { referralCode: string },
      null | {
        referralCode: string;
        status: "active" | "disabled";
        userId: string;
      }
    >;
    getAffiliateProfileByUserId: FunctionReference<
      "query",
      "public",
      { userId: string },
      null | {
        referralCode: string;
        status: "active" | "disabled";
        userId: string;
      }
    >;
    getMyAffiliateStats: FunctionReference<
      "query",
      "public",
      { nowMs?: number; userId: string },
      {
        activations30d: number;
        clicks30d: number;
        conversions30d: number;
        creditBalanceCents: number;
        referralCode: string | null;
        signups30d: number;
        userId: string;
      }
    >;
    setAffiliateProfileStatus: FunctionReference<
      "mutation",
      "public",
      { status: "active" | "disabled"; userId: string },
      { ok: boolean; status: "active" | "disabled"; userId: string }
    >;
  };
  referrals: {
    queries: {
      listMyReferredUsers: FunctionReference<
        "query",
        "public",
        { limit?: number; referrerUserId: string },
        Array<{
          activatedAt?: number;
          attributedAt: number;
          expiresAt: number;
          firstPaidConversionAt?: number;
          referredUserId: string;
          status: string;
        }>
      >;
    };
  };
  rewards: {
    actions: {
      evaluateRewardsForReferrer: FunctionReference<
        "mutation",
        "public",
        { referrerUserId: string },
        null
      >;
      grantSubscriptionDiscountBenefit: FunctionReference<
        "mutation",
        "public",
        { amountOffCentsMonthly?: number; userId: string },
        { created: boolean; ok: boolean }
      >;
      redeemCredit: FunctionReference<
        "mutation",
        "public",
        {
          amountCents: number;
          currency?: string;
          reason?: string;
          userId: string;
        },
        { balanceCents: number; ok: boolean }
      >;
    };
    queries: {
      listActiveBenefitsForUser: FunctionReference<
        "query",
        "public",
        { userId: string },
        Array<{
          endsAt?: number;
          kind: string;
          startsAt: number;
          status: string;
          value: any;
        }>
      >;
    };
  };
  tracking: {
    attributeSignup: FunctionReference<
      "mutation",
      "public",
      {
        attributionWindowDays?: number;
        nowMs?: number;
        referralCode?: string;
        referredUserId: string;
        visitorId?: string;
      },
      null | {
        expiresAt: number;
        referralCode: string;
        referredUserId: string;
        referrerUserId: string;
      }
    >;
    markActivated: FunctionReference<
      "mutation",
      "public",
      { referredUserId: string; source?: "email_verified" | "manual" },
      { activated: boolean; ok: boolean; referrerUserId: string | null }
    >;
    recordClick: FunctionReference<
      "mutation",
      "public",
      {
        ipHash?: string;
        landingPath?: string;
        referralCode: string;
        referrer?: string;
        uaHash?: string;
        visitorId: string;
      },
      null
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
