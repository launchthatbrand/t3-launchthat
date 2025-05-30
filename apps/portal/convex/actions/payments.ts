"use node";

import { APIContracts, APIControllers } from "authorizenet";
import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

// Note: Environment variables accessed via process.env in actions
// Ensure AUTHORIZENET_API_LOGIN_ID and AUTHORIZENET_TRANSACTION_KEY are set in Convex dashboard

// Define endpoint URLs directly
const SANDBOX_URL = "https://apitest.authorize.net/xml/v1/request.api";
const PRODUCTION_URL = "https://api.authorize.net/xml/v1/request.api";

// --- Minimal types for AuthNet errors/messages ---
// Copied from payments.ts - keep in sync or share types if possible
interface AuthNetError {
  getErrorCode: () => string;
  getErrorText: () => string;
}

interface AuthNetMessage {
  getCode: () => string;
  getText: () => string;
}

// --- Define lineItem validator (copy from schema/mutation for use in action args) ---
const lineItemValidator = v.object({
  productId: v.string(),
  productName: v.string(),
  quantity: v.number(),
  unitPrice: v.number(),
  totalPrice: v.number(),
});

/**
 * Return type for the internalCreateAuthNetTransaction action handler.
 */
type CreateTransactionResult =
  | {
      success: true;
      transactionId: string | null;
      dbTransactionId: Id<"transactions"> | null;
    }
  | {
      success: false;
      message: string;
      dbTransactionId: Id<"transactions"> | null;
    };

/**
 * Internal Convex action to process an Authorize.Net payment using opaque data.
 * This action runs in a Node.js environment and requires Authorize.Net API
 * credentials (AUTHORIZENET_API_LOGIN_ID, AUTHORIZENET_TRANSACTION_KEY)
 * to be set as environment variables in the Convex dashboard.
 *
 * @param ctx - Convex action context.
 * @param args - Arguments containing opaque payment data and transaction details.
 * @param args.opaqueDataDescriptor - The data descriptor from Authorize.Net Accept.js.
 * @param args.opaqueDataValue - The data value (token) from Authorize.Net Accept.js.
 * @param args.amount - The total transaction amount in cents.
 * @param args.paymentMethod - The payment method used (e.g., 'credit-card', 'sezzle').
 * @param args.userId - Optional ID of the user making the purchase.
 * @param args.orderId - Optional ID of the associated order.
 * @param args.lineItems - Array of items included in the transaction.
 * @returns On success, an object containing `{ success: true, transactionId: string | null, dbTransactionId: Id<"transactions"> }`.
 * @returns On failure, an object containing `{ success: false, message: string, dbTransactionId: Id<"transactions"> | null }`.
 * @throws Throws an Error only for critical server/credential issues *before* attempting transaction save.
 */
export const internalCreateAuthNetTransaction = internalAction({
  args: {
    opaqueDataDescriptor: v.string(),
    opaqueDataValue: v.string(),
    amount: v.number(), // Expect amount in cents
    paymentMethod: v.string(),
    userId: v.optional(v.id("users")),
    orderId: v.optional(v.string()), // Or v.id("orders")
    lineItems: v.array(lineItemValidator), // Use the validator
  },
  // Add explicit return type annotation to handler
  handler: async (ctx, args): Promise<CreateTransactionResult> => {
    // Get Args
    const {
      opaqueDataDescriptor,
      opaqueDataValue,
      amount, // in cents
      paymentMethod,
      userId,
      orderId,
      lineItems,
    } = args;

    let authNetTransactionId: string | null = null;
    let transactionStatus: "succeeded" | "failed" | "pending" = "pending"; // Start as pending
    let transactionErrorMessage: string | undefined = undefined;
    let dbTransactionId: Id<"transactions"> | null = null; // Initialize as null

    // --- Get Env Vars ---
    // eslint-disable-next-line @typescript-eslint/no-restricted-imports, turbo/no-undeclared-env-vars -- Convex Node.js action requires process.env
    const apiLoginId = process.env.AUTHORIZENET_API_LOGIN_ID;
    // eslint-disable-next-line @typescript-eslint/no-restricted-imports, turbo/no-undeclared-env-vars -- Convex Node.js action requires process.env
    const transactionKey = process.env.AUTHORIZENET_TRANSACTION_KEY;
    // eslint-disable-next-line @typescript-eslint/no-restricted-imports, turbo/no-undeclared-env-vars -- Convex Node.js action requires process.env
    const nodeEnv = process.env.NODE_ENV ?? "development";

    if (!apiLoginId || !transactionKey) {
      transactionStatus = "failed";
      transactionErrorMessage =
        "Server configuration error: Missing AuthNet credentials.";
      console.error(transactionErrorMessage);
      // Save failed transaction attempt *before* returning error (if possible)
      try {
        // IMPORTANT: Ensure this path correctly resolves to the mutation
        dbTransactionId = await ctx.runMutation(
          internal.payments.saveTransaction,
          {
            status: transactionStatus,
            amount: amount,
            paymentMethod: paymentMethod,
            errorMessage: transactionErrorMessage,
            userId: userId,
            orderId: orderId,
            lineItems: lineItems,
            opaqueDataDescriptor: opaqueDataDescriptor, // Pass this through
          },
        );
      } catch (saveError: any) {
        console.error("Failed to save initial error transaction:", saveError);
        // If saving fails, return the original error without a db ID
        return {
          success: false,
          message: transactionErrorMessage,
          dbTransactionId: null,
        };
      }
      // Return failure object after attempting save
      return {
        success: false,
        message: transactionErrorMessage,
        dbTransactionId: dbTransactionId, // Include ID if save succeeded
      };
    }

    const environment = nodeEnv === "production" ? PRODUCTION_URL : SANDBOX_URL;

    try {
      // --- Configure AuthNet ---
      const merchantAuthenticationType =
        new APIContracts.MerchantAuthenticationType();
      merchantAuthenticationType.setName(apiLoginId);
      merchantAuthenticationType.setTransactionKey(transactionKey);

      const opaqueDataType = new APIContracts.OpaqueDataType();
      opaqueDataType.setDataDescriptor(opaqueDataDescriptor);
      opaqueDataType.setDataValue(opaqueDataValue);

      const paymentType = new APIContracts.PaymentType();
      paymentType.setOpaqueData(opaqueDataType);

      // --- Add Line Items to AuthNet Request (Optional but Recommended) ---
      const authNetLineItems: APIContracts.LineItemType[] = lineItems.map(
        (item) => {
          const lineItem = new APIContracts.LineItemType();
          lineItem.setItemId(item.productId);
          lineItem.setName(item.productName);
          lineItem.setQuantity(item.quantity.toString());
          lineItem.setUnitPrice((item.unitPrice / 100).toFixed(2));
          return lineItem;
        },
      );

      const transactionRequestType = new APIContracts.TransactionRequestType();
      transactionRequestType.setTransactionType(
        APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION,
      );
      transactionRequestType.setPayment(paymentType);
      const amountString = (amount / 100).toFixed(2);
      transactionRequestType.setAmount(amountString);
      if (authNetLineItems.length > 0) {
        const lineItemsType = new APIContracts.ArrayOfLineItem();
        lineItemsType.setLineItem(authNetLineItems);
        transactionRequestType.setLineItems(lineItemsType);
      }

      const createRequest = new APIContracts.CreateTransactionRequest();
      createRequest.setMerchantAuthentication(merchantAuthenticationType);
      createRequest.setTransactionRequest(transactionRequestType);

      // --- Execute AuthNet Request ---
      console.log(
        "Sending transaction request to Authorize.Net:",
        amountString,
      );
      const ctrl = new APIControllers.CreateTransactionController(
        createRequest.getJSON(),
      );
      ctrl.setEnvironment(environment);

      const apiResponse: any = await new Promise((resolve, reject) => {
        ctrl.execute(() => {
          const response = ctrl.getResponse();
          if (!response) {
            reject(new Error("Authorize.Net: No response received."));
            return;
          }
          resolve(response);
        });
      });

      // --- Process AuthNet Response ---
      const response = new APIContracts.CreateTransactionResponse(apiResponse);
      console.log("Authorize.Net Response Received:", JSON.stringify(response));

      if (
        response.getMessages().getResultCode() ===
        APIContracts.MessageTypeEnum.OK
      ) {
        const transactionResponse = response.getTransactionResponse();
        if (
          transactionResponse &&
          transactionResponse.getResponseCode() === "1"
        ) {
          transactionStatus = "succeeded";
          authNetTransactionId = transactionResponse.getTransId() ?? null;
          console.log(
            `Authorize.Net Transaction Approved: ID ${authNetTransactionId}`,
          );
        } else {
          transactionStatus = "failed";
          if (transactionResponse) {
            const errors = transactionResponse.getErrors();
            const messages = transactionResponse.getMessages();
            transactionErrorMessage = `AuthNet Error: Code ${transactionResponse.getResponseCode()}. `;
            if (errors && errors.getError().length > 0) {
              transactionErrorMessage += `Errors: ${errors
                .getError()
                .map(
                  (e: AuthNetError) =>
                    `${e.getErrorCode()}: ${e.getErrorText()}`,
                )
                .join(", ")}. `;
            }
            if (messages && messages.getMessage().length > 0) {
              transactionErrorMessage += `Messages: ${messages
                .getMessage()
                .map((m: AuthNetMessage) => `${m.getCode()}: ${m.getText()}`)
                .join(", ")}`;
            }
            console.error(
              `Authorize.Net Transaction Failed/Declined: ${transactionErrorMessage}`,
            );
          } else {
            transactionErrorMessage =
              "Authorize.Net: Transaction Response missing or invalid, but API call was OK.";
            console.error(transactionErrorMessage);
          }
        }
      } else {
        transactionStatus = "failed";
        const messages = response.getMessages();
        transactionErrorMessage = `Authorize.Net API Error: ${messages.getResultCode()}. `;
        if (messages.getMessage().length > 0) {
          transactionErrorMessage += messages
            .getMessage()
            .map((m: AuthNetMessage) => `${m.getCode()}: ${m.getText()}`)
            .join(", ");
        } else {
          transactionErrorMessage +=
            "No specific error message provided by API.";
        }
        console.error(
          `Authorize.Net API Call Failed: ${transactionErrorMessage}`,
        );
      }
    } catch (error: any) {
      transactionStatus = "failed";
      transactionErrorMessage = `Internal Server Error during AuthNet processing: ${error.message ?? String(error)}`;
      console.error(transactionErrorMessage, error);
    } finally {
      // --- Save Transaction Result to Database ---
      try {
        console.log(`Saving final transaction state: ${transactionStatus}`);
        // IMPORTANT: Ensure this path correctly resolves to the mutation
        dbTransactionId = await ctx.runMutation(
          internal.payments.saveTransaction,
          {
            status: transactionStatus,
            amount: amount,
            paymentMethod: paymentMethod,
            authNetTransactionId: authNetTransactionId ?? undefined,
            errorMessage: transactionErrorMessage,
            userId: userId,
            orderId: orderId,
            lineItems: lineItems,
            opaqueDataDescriptor: opaqueDataDescriptor, // Save descriptor
          },
        );
      } catch (saveError: any) {
        console.error(
          "CRITICAL ERROR: Failed to save final transaction state:",
          saveError,
        );
      }
    }

    // --- Return Result ---
    if (transactionStatus === "succeeded") {
      return {
        success: true,
        transactionId: authNetTransactionId,
        dbTransactionId: dbTransactionId,
      };
    } else {
      return {
        success: false,
        message:
          transactionErrorMessage ??
          "Transaction failed for an unknown reason.",
        dbTransactionId: dbTransactionId,
      };
    }
  },
});
