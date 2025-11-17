// Import the createMockOrder function (we'll create this)
import { v } from "convex/values";

import { api } from "../../_generated/api";
import { mutation } from "../../_generated/server";

// Mock data mutation to create a sample transfer with associated orders
export const createMockTransfer = mutation({
  args: {
    orderCount: v.optional(v.number()), // Number of orders to create for this transfer (default: 3)
  },
  returns: v.object({
    success: v.boolean(),
    transferId: v.string(),
    orderIds: v.array(v.string()),
    totalAmount: v.number(),
  }),
  handler: async (ctx, args) => {
    const orderCount = args.orderCount ?? 3; // Default to 3 orders
    try {
      // First, ensure we have a mock user and mock bank account
      const mockUserData = {
        email: "mockuser@launchthat.app",
        name: "MOCK USER",
      };
      // Check if mock user exists
      let mockUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", mockUserData.email))
        .first();
      if (!mockUser) {
        // Create mock user using centralized function
        const mockUserResult = await ctx.runMutation(
          api.core.users.mockData.createMockUser,
          {},
        );
        if (!mockUserResult.success || !mockUserResult.userId) {
          throw new Error("Failed to create or retrieve mock user");
        }
        mockUser = await ctx.db.get(mockUserResult.userId);
      }
      // Check if mock bank account exists
      let mockBankAccount = await ctx.db
        .query("bankAccounts")
        .filter((q) => q.eq(q.field("accountName"), "MOCK BANK ACCOUNT"))
        .first();
      if (!mockBankAccount) {
        // Create mock bank account
        const mockBankAccountId = await ctx.db.insert("bankAccounts", {
          accountName: "MOCK BANK ACCOUNT",
          bankName: "Mock Bank",
          accountNumber: "****1234",
          routingNumber: "123456789",
          accountType: "checking",
          address: {
            street1: "123 Mock Street",
            street2: "Suite 100",
            city: "Mock City",
            state: "CA",
            postalCode: "12345",
            country: "US",
          },
          status: "verified",
          isDefault: true,
          paymentProcessor: "Stripe",
          createdBy: mockUser._id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        mockBankAccount = await ctx.db.get(mockBankAccountId);
      }
      if (!mockBankAccount) {
        throw new Error("Failed to create or retrieve mock bank account");
      }
      // Create the specified number of mock orders
      const orderIds = [];
      const orderDocs = [];
      let totalOrderAmount = 0;
      for (let i = 0; i < orderCount; i++) {
        const orderResult = await ctx.runMutation(
          api.ecommerce.orders.mockData.createMockOrder,
          {},
        );
        if (orderResult.success && orderResult.orderId) {
          orderIds.push(orderResult.orderId);
          // Get the actual order document to access its ID and amount
          const orderDoc = await ctx.db
            .query("orders")
            .filter((q) => q.eq(q.field("orderId"), orderResult.orderId))
            .first();
          if (orderDoc) {
            orderDocs.push(orderDoc);
            totalOrderAmount += orderResult.orderAmount;
          }
        }
      }
      if (orderDocs.length === 0) {
        throw new Error("Failed to create any mock orders for the transfer");
      }
      // Calculate transfer amount (sum of all order totals)
      const transferAmount = totalOrderAmount;
      const transferFees = Math.round(transferAmount * 0.005); // 0.5% transfer fee
      const netTransferAmount = transferAmount - transferFees;
      // Generate transfer details
      const transferId = `tr_mock_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const now = Date.now();
      // Random status for variety
      const statuses = ["pending", "in_transit", "completed", "failed"];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const expectedArrival = now + 3 * 24 * 60 * 60 * 1000; // 3 days from now
      const completedAt =
        status === "completed"
          ? now - Math.floor(Math.random() * 2 * 24 * 60 * 60 * 1000)
          : undefined;
      // Create the transfer
      const newTransferId = await ctx.db.insert("transfers", {
        transferId,
        amount: netTransferAmount,
        currency: "USD",
        bankAccountId: mockBankAccount._id,
        paymentProcessor: "Stripe",
        processorTransferId: `stripe_${transferId}`,
        status,
        initiatedAt: now - Math.floor(Math.random() * 24 * 60 * 60 * 1000), // Random time in last 24h
        expectedArrival:
          status === "pending" || status === "in_transit"
            ? expectedArrival
            : undefined,
        completedAt,
        fees: transferFees,
        description: `Mock transfer for ${orderCount} orders`,
        failureReason:
          status === "failed"
            ? "Insufficient funds in merchant account"
            : undefined,
        initiatedBy: mockUser._id,
        notes: `Mock transfer created with ${orderCount} associated orders`,
      });
      // Create the proper many-to-many relationships using the junction table
      for (const orderDoc of orderDocs) {
        await ctx.db.insert("transferOrders", {
          transferId: newTransferId,
          orderId: orderDoc._id,
          orderAmount: orderDoc.total,
          processedAt: now,
          notes: `Order ${orderDoc.orderId} included in mock transfer`,
        });
      }
      return {
        success: true,
        transferId: newTransferId,
        orderIds,
        totalAmount: transferAmount,
      };
    } catch (error) {
      console.error("Error creating mock transfer:", error);
      throw new Error(
        `Failed to create mock transfer: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  },
});
