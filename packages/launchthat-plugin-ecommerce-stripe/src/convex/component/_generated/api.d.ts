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
import type * as internal_ from "../internal.js";
import type * as payouts from "../payouts.js";
import type * as webhooks from "../webhooks.js";

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
  internal: typeof internal_;
  payouts: typeof payouts;
  webhooks: typeof webhooks;
}>;
export type Mounts = {
  payouts: {
    applyCustomerBalanceCredit: FunctionReference<
      "action",
      "public",
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
      "public",
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
      "public",
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
      "public",
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
      "public",
      { connectAccountId: string; stripeSecretKey: string },
      { deleted: boolean; ok: boolean }
    >;
    getUpcomingSubscriptionDueCentsForUser: FunctionReference<
      "action",
      "public",
      { currency?: string; stripeSecretKey: string; userId: string },
      { dueCents: number; ok: boolean }
    >;
  };
  webhooks: {
    processEvent: FunctionReference<
      "action",
      "public",
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
