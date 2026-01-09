"use node";

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { api } from "../../../../_generated/api";
import { action } from "../../../../_generated/server";

interface AuthorizeNetConfig {
  apiLoginId?: string;
  transactionKey?: string;
  clientKey?: string;
  sandbox?: boolean;
  signatureKey?: string;
}

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const asBoolean = (value: unknown): boolean => value === true;

const pickConfig = (value: unknown): AuthorizeNetConfig => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const v = value as Record<string, unknown>;
  return {
    apiLoginId: asString(v.apiLoginId).trim() || undefined,
    transactionKey: asString(v.transactionKey).trim() || undefined,
    clientKey: asString(v.clientKey).trim() || undefined,
    sandbox: asBoolean(v.sandbox),
    signatureKey: asString(v.signatureKey).trim() || undefined,
  };
};

type CreateSubscriptionResult =
  | {
      success: true;
      customerProfileId: string;
      customerPaymentProfileId: string;
      subscriptionId: string;
      raw?: unknown;
    }
  | {
      success: false;
      errorMessage: string;
      errorCode?: string;
      raw?: unknown;
    };

const toIsoDate = (d: Date): string => {
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

export const createCimAndArbSubscription = action({
  args: {
    organizationId: v.optional(v.string()),
    opaqueData: v.object({
      dataDescriptor: v.string(),
      dataValue: v.string(),
    }),
    customer: v.object({
      email: v.string(),
      name: v.optional(v.string()),
      postcode: v.optional(v.string()),
    }),
    // Monthly amount in store currency (dollars).
    amountMonthly: v.number(),
    currency: v.optional(v.string()),
    // Date string `YYYY-MM-DD` (UTC) when recurring billing begins.
    startDate: v.optional(v.string()),
    totalOccurrences: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<CreateSubscriptionResult> => {
    const amountMonthly = Number.isFinite(args.amountMonthly) ? args.amountMonthly : 0;
    if (amountMonthly <= 0) {
      return { success: false, errorMessage: "Invalid monthly amount" };
    }

    const option: any = await ctx.runQuery(api.core.options.get as any, {
      metaKey: "plugin.ecommerce.authorizenet.settings",
      type: "site",
      orgId: args.organizationId ?? null,
    });
    const config = pickConfig(option?.metaValue);

    if (!config.apiLoginId || !config.transactionKey) {
      return {
        success: false,
        errorMessage:
          "Authorize.Net is not configured (missing API Login ID or Transaction Key).",
      };
    }

    const endpoint = config.sandbox
      ? "https://apitest.authorize.net/xml/v1/request.api"
      : "https://api.authorize.net/xml/v1/request.api";

    const name = asString(args.customer?.name).trim();
    const postcode = asString(args.customer?.postcode).trim();
    const firstLast = name.split(/\s+/).filter(Boolean);
    const firstName = firstLast[0] ?? "";
    const lastName = firstLast.slice(1).join(" ");

    // Step 1: Create CIM customer profile + payment profile from Accept.js opaqueData.
    const createProfilePayload = {
      createCustomerProfileRequest: {
        merchantAuthentication: {
          name: config.apiLoginId,
          transactionKey: config.transactionKey,
        },
        profile: {
          email: asString(args.customer.email).trim(),
          paymentProfiles: [
            {
              customerType: "individual",
              payment: {
                opaqueData: {
                  dataDescriptor: args.opaqueData.dataDescriptor,
                  dataValue: args.opaqueData.dataValue,
                },
              },
              billTo:
                firstName || lastName || postcode
                  ? {
                      ...(firstName ? { firstName } : {}),
                      ...(lastName ? { lastName } : {}),
                      ...(postcode ? { zip: postcode } : {}),
                    }
                  : undefined,
            },
          ],
        },
      },
    };

    let profileJson: any;
    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(createProfilePayload),
      });
      profileJson = await resp.json();
    } catch (err: unknown) {
      return {
        success: false,
        errorMessage:
          err instanceof Error ? err.message : "Authorize.Net request failed",
      };
    }

    const profileResultCode = asString(profileJson?.messages?.resultCode);
    const customerProfileId = asString(profileJson?.customerProfileId);
    const paymentProfileId =
      asString(profileJson?.customerPaymentProfileIdList?.[0]) ||
      asString(profileJson?.customerPaymentProfileId);

    if (profileResultCode.toLowerCase() !== "ok" || !customerProfileId || !paymentProfileId) {
      const errorText =
        asString(profileJson?.messages?.message?.[0]?.text) ||
        "Failed to create customer payment profile";
      const errorCode = asString(profileJson?.messages?.message?.[0]?.code) || undefined;
      return {
        success: false,
        errorMessage: errorText,
        errorCode,
        raw: profileJson,
      };
    }

    // Step 2: Create ARB subscription referencing the profile.
    const startDateRaw = asString(args.startDate).trim();
    const startDate = startDateRaw || toIsoDate(new Date());
    const totalOccurrences = Math.max(1, Math.floor(args.totalOccurrences ?? 9999));

    const arbPayload = {
      ARBCreateSubscriptionRequest: {
        merchantAuthentication: {
          name: config.apiLoginId,
          transactionKey: config.transactionKey,
        },
        subscription: {
          name: `LaunchThat subscription`,
          paymentSchedule: {
            interval: { length: 1, unit: "months" },
            startDate,
            totalOccurrences,
          },
          amount: amountMonthly.toFixed(2),
          profile: {
            customerProfileId,
            customerPaymentProfileId: paymentProfileId,
          },
        },
      },
    };

    let arbJson: any;
    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(arbPayload),
      });
      arbJson = await resp.json();
    } catch (err: unknown) {
      return {
        success: false,
        errorMessage:
          err instanceof Error ? err.message : "Authorize.Net request failed",
        raw: err,
      };
    }

    const arbResultCode = asString(arbJson?.messages?.resultCode);
    const subscriptionId = asString(arbJson?.subscriptionId);
    if (arbResultCode.toLowerCase() !== "ok" || !subscriptionId) {
      const errorText =
        asString(arbJson?.messages?.message?.[0]?.text) ||
        "Failed to create ARB subscription";
      const errorCode = asString(arbJson?.messages?.message?.[0]?.code) || undefined;
      return {
        success: false,
        errorMessage: errorText,
        errorCode,
        raw: arbJson,
      };
    }

    return {
      success: true,
      customerProfileId,
      customerPaymentProfileId: paymentProfileId,
      subscriptionId,
      raw: { profileJson, arbJson },
    };
  },
});

type ChargeResult =
  | {
      success: true;
      transactionId: string;
      authCode?: string;
      responseCode?: string;
      raw?: unknown;
    }
  | {
      success: false;
      errorMessage: string;
      errorCode?: string;
      raw?: unknown;
    };

export const chargeWithOpaqueData = action({
  args: {
    organizationId: v.optional(v.string()),
    amount: v.number(),
    currency: v.optional(v.string()),
    opaqueData: v.object({
      dataDescriptor: v.string(),
      dataValue: v.string(),
    }),
    billing: v.optional(
      v.object({
        name: v.optional(v.string()),
        postcode: v.optional(v.string()),
      }),
    ),
    orderId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<ChargeResult> => {
    const amount = Number.isFinite(args.amount) ? args.amount : 0;
    if (amount <= 0) {
      return { success: false, errorMessage: "Invalid amount" };
    }

    const option: any = await ctx.runQuery(api.core.options.get as any, {
      metaKey: "plugin.ecommerce.authorizenet.settings",
      type: "site",
      orgId: args.organizationId ?? null,
    });
    const config = pickConfig(option?.metaValue);

    if (!config.apiLoginId || !config.transactionKey) {
      return {
        success: false,
        errorMessage:
          "Authorize.Net is not configured (missing API Login ID or Transaction Key).",
      };
    }

    const endpoint = config.sandbox
      ? "https://apitest.authorize.net/xml/v1/request.api"
      : "https://api.authorize.net/xml/v1/request.api";

    const name = asString(args.billing?.name).trim();
    const postcode = asString(args.billing?.postcode).trim();
    const firstLast = name.split(/\s+/).filter(Boolean);
    const firstName = firstLast[0] ?? "";
    const lastName = firstLast.slice(1).join(" ");

    const payload = {
      createTransactionRequest: {
        merchantAuthentication: {
          name: config.apiLoginId,
          transactionKey: config.transactionKey,
        },
        refId: args.orderId ? String(args.orderId).slice(0, 20) : undefined,
        transactionRequest: {
          transactionType: "authCaptureTransaction",
          amount: amount.toFixed(2),
          payment: {
            opaqueData: {
              dataDescriptor: args.opaqueData.dataDescriptor,
              dataValue: args.opaqueData.dataValue,
            },
          },
          billTo:
            firstName || lastName || postcode
              ? {
                  ...(firstName ? { firstName } : {}),
                  ...(lastName ? { lastName } : {}),
                  ...(postcode ? { zip: postcode } : {}),
                }
              : undefined,
        },
      },
    };

    let json: any;
    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      json = await resp.json();
    } catch (err: unknown) {
      return {
        success: false,
        errorMessage:
          err instanceof Error ? err.message : "Authorize.Net request failed",
      };
    }

    const resultCode = asString(json?.messages?.resultCode);
    const transactionResponse = json?.transactionResponse;
    const responseCode = asString(transactionResponse?.responseCode);
    const transId = asString(transactionResponse?.transId);
    const authCode = asString(transactionResponse?.authCode);

    if (resultCode.toLowerCase() === "ok" && transId) {
      return {
        success: true,
        transactionId: transId,
        authCode: authCode || undefined,
        responseCode: responseCode || undefined,
        raw: json,
      };
    }

    const errorText =
      asString(transactionResponse?.errors?.[0]?.errorText) ||
      asString(json?.messages?.message?.[0]?.text) ||
      "Payment was declined";
    const errorCode =
      asString(transactionResponse?.errors?.[0]?.errorCode) ||
      asString(json?.messages?.message?.[0]?.code) ||
      undefined;

    return {
      success: false,
      errorMessage: errorText,
      errorCode,
      raw: json,
    };
  },
});
