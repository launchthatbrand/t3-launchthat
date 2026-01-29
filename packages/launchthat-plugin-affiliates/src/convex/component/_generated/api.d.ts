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
import type * as index from "../index.js";
import type * as profiles from "../profiles.js";
import type * as rewards_index from "../rewards/index.js";
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
  index: typeof index;
  profiles: typeof profiles;
  "rewards/index": typeof rewards_index;
  tracking: typeof tracking;
}>;
export type Mounts = {
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
  profiles: {
    createOrGetMyAffiliateProfile: FunctionReference<
      "mutation",
      "public",
      { userId: string },
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
  };
  rewards: {
    index: {
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
