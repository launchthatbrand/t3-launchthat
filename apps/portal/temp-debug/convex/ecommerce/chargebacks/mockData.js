import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { mutation } from "../../_generated/server";
// Create a mock chargeback (creates order first, then chargeback)
export const createMockChargeback = mutation({
    args: {},
    returns: v.object({
        success: v.boolean(),
        orderId: v.optional(v.string()),
        chargebackId: v.optional(v.string()),
        error: v.optional(v.string()),
    }),
    handler: async (ctx, _args) => {
        console.log("createMockChargeback");
        try {
            // First, create a mock order using the existing mock order function
            const mockOrderResult = await ctx.runMutation(internal.ecommerce.orders.mockData.createMockOrder, {});
            console.log("mockOrderResult", mockOrderResult);
            if (!mockOrderResult.success || !mockOrderResult.orderDbId) {
                return {
                    success: false,
                    error: `Failed to create mock order: ${mockOrderResult.error}`,
                };
            }
            // Now create a chargeback using the orderChargeback function
            const chargebackResult = await ctx.runMutation(internal.ecommerce.chargebacks.index.orderChargeback, {
                orderId: mockOrderResult.orderDbId, // Use the database ID
                reasonCode: "4855", // Most common reason code
                reasonDescription: "Goods or Services Not Provided",
                chargebackAmount: Math.floor(Math.random() * 50000) + 1000, // Random amount $10-$500
                processorName: "Stripe",
                chargebackFee: 1500, // $15 fee
                internalNotes: "Mock chargeback created for testing purposes",
            });
            console.log("chargebackResult", chargebackResult);
            // orderChargeback returns a success object with chargebackId
            if (!chargebackResult.success) {
                return {
                    success: false,
                    error: `Failed to create chargeback: ${chargebackResult.error}`,
                };
            }
            return {
                success: true,
                orderId: mockOrderResult.orderId, // Human-readable order ID
                chargebackId: chargebackResult.chargebackId, // Chargeback ID from result
            };
        }
        catch (error) {
            console.error("Error creating mock chargeback:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    },
});
