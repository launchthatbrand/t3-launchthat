import { v } from "convex/values";

import { internalMutation } from "../../_generated/server";

const lineItemValidator = v.object({
  productId: v.string(),
  productName: v.string(),
  quantity: v.number(),
  unitPrice: v.number(),
  totalPrice: v.number(),
});

/**
 * Internal mutation to save transaction details to the database.
 *
 * @param ctx - Convex mutation context.
 * @param args - Transaction details to save.
 * @returns The Id of the newly created transaction document.
 */
export const saveTransaction = internalMutation({
  args: {
    status: v.union(
      v.literal("pending"),
      v.literal("succeeded"),
      v.literal("failed"),
    ),
    amount: v.number(),
    paymentMethod: v.string(),
    authNetTransactionId: v.optional(v.string()),
    opaqueDataDescriptor: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    orderId: v.optional(v.id("orders")),
    lineItems: v.array(lineItemValidator),
  },
  handler: async (ctx, args) => {
    const transactionId = await ctx.db.insert("transactions", {
      status: args.status,
      amount: args.amount,
      paymentMethod: args.paymentMethod,
      authNetTransactionId: args.authNetTransactionId,
      opaqueDataDescriptor: args.opaqueDataDescriptor,
      errorMessage: args.errorMessage,
      userId: args.userId,
      orderId: args.orderId,
      lineItems: args.lineItems,
    });

    console.log(
      `Transaction ${transactionId} saved with status: ${args.status}`,
    );

    if (args.status === "failed") {
      console.error(
        `Transaction failed. Error: ${args.errorMessage ?? "Unknown error"}`,
      );
    }

    return transactionId;
  },
});
