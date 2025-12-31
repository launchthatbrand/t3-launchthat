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
  };
};

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
