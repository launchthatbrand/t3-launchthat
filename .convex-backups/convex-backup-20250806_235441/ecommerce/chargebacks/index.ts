import { v } from "convex/values";

import { mutation, query } from "../../_generated/server";

// Get all chargebacks with optional filtering
export const getChargebacks = query({
  args: {
    status: v.optional(v.string()),
    orderId: v.optional(v.id("orders")),
    processorName: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("chargebacks"),
      _creationTime: v.number(),
      chargebackId: v.string(),
      orderId: v.id("orders"),
      transactionId: v.optional(v.string()),
      amount: v.number(),
      currency: v.string(),
      reasonCode: v.string(),
      reasonDescription: v.string(),
      status: v.union(
        v.literal("received"),
        v.literal("under_review"),
        v.literal("accepted"),
        v.literal("disputed"),
        v.literal("won"),
        v.literal("lost"),
        v.literal("expired"),
      ),
      disputeDeadline: v.optional(v.number()),
      evidenceSubmitted: v.optional(v.boolean()),
      evidenceDetails: v.optional(v.string()),
      caseId: v.optional(v.string()),
      processorName: v.string(),
      chargebackFee: v.optional(v.number()),
      refundAmount: v.optional(v.number()),
      customerInfo: v.object({
        email: v.string(),
        name: v.string(),
        customerId: v.optional(v.string()),
      }),
      chargebackDate: v.number(),
      receivedDate: v.number(),
      resolvedDate: v.optional(v.number()),
      internalNotes: v.optional(v.string()),
      customerCommunication: v.optional(v.string()),
      riskScore: v.optional(v.number()),
      previousChargebacks: v.optional(v.number()),
      metadata: v.optional(v.any()),
    }),
  ),
  handler: async (ctx, args) => {
    // Start with a base query and apply filters conditionally
    if (args.status) {
      const validStatus = args.status as
        | "received"
        | "under_review"
        | "accepted"
        | "disputed"
        | "won"
        | "lost"
        | "expired";
      return await ctx.db
        .query("chargebacks")
        .withIndex("by_status", (q) => q.eq("status", validStatus))
        .order("desc")
        .collect();
    }

    if (args.orderId) {
      return await ctx.db
        .query("chargebacks")
        .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId!)) // Use non-null assertion since we checked above
        .order("desc")
        .collect();
    }

    if (args.processorName) {
      return await ctx.db
        .query("chargebacks")
        .withIndex(
          "by_processorName",
          (q) => q.eq("processorName", args.processorName!), // Use non-null assertion since we checked above
        )
        .order("desc")
        .collect();
    }

    // Default: return all chargebacks
    return await ctx.db.query("chargebacks").order("desc").collect();
  },
});

// Get a single chargeback by ID
export const getChargeback = query({
  args: { chargebackId: v.id("chargebacks") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("chargebacks"),
      _creationTime: v.number(),
      chargebackId: v.string(),
      orderId: v.id("orders"),
      transactionId: v.optional(v.string()),
      amount: v.number(),
      currency: v.string(),
      reasonCode: v.string(),
      reasonDescription: v.string(),
      status: v.union(
        v.literal("received"),
        v.literal("under_review"),
        v.literal("accepted"),
        v.literal("disputed"),
        v.literal("won"),
        v.literal("lost"),
        v.literal("expired"),
      ),
      disputeDeadline: v.optional(v.number()),
      evidenceSubmitted: v.optional(v.boolean()),
      evidenceDetails: v.optional(v.string()),
      caseId: v.optional(v.string()),
      processorName: v.string(),
      chargebackFee: v.optional(v.number()),
      refundAmount: v.optional(v.number()),
      customerInfo: v.object({
        email: v.string(),
        name: v.string(),
        customerId: v.optional(v.string()),
      }),
      chargebackDate: v.number(),
      receivedDate: v.number(),
      resolvedDate: v.optional(v.number()),
      internalNotes: v.optional(v.string()),
      customerCommunication: v.optional(v.string()),
      riskScore: v.optional(v.number()),
      previousChargebacks: v.optional(v.number()),
      metadata: v.optional(v.any()),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chargebackId);
  },
});

// Create a new chargeback
export const createChargeback = mutation({
  args: {
    chargebackId: v.string(),
    orderId: v.id("orders"),
    transactionId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    reasonCode: v.string(),
    reasonDescription: v.string(),
    status: v.union(
      v.literal("received"),
      v.literal("under_review"),
      v.literal("accepted"),
      v.literal("disputed"),
      v.literal("won"),
      v.literal("lost"),
      v.literal("expired"),
    ),
    disputeDeadline: v.optional(v.number()),
    evidenceSubmitted: v.optional(v.boolean()),
    evidenceDetails: v.optional(v.string()),
    caseId: v.optional(v.string()),
    processorName: v.string(),
    chargebackFee: v.optional(v.number()),
    refundAmount: v.optional(v.number()),
    customerInfo: v.object({
      email: v.string(),
      name: v.string(),
      customerId: v.optional(v.string()),
    }),
    chargebackDate: v.number(),
    receivedDate: v.number(),
    resolvedDate: v.optional(v.number()),
    internalNotes: v.optional(v.string()),
    customerCommunication: v.optional(v.string()),
    riskScore: v.optional(v.number()),
    previousChargebacks: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  returns: v.id("chargebacks"),
  handler: async (ctx, args) => {
    const chargebackId = await ctx.db.insert("chargebacks", args);
    return chargebackId;
  },
});

// Update an existing chargeback
export const updateChargeback = mutation({
  args: {
    id: v.id("chargebacks"),
    status: v.optional(
      v.union(
        v.literal("received"),
        v.literal("under_review"),
        v.literal("accepted"),
        v.literal("disputed"),
        v.literal("won"),
        v.literal("lost"),
        v.literal("expired"),
      ),
    ),
    disputeDeadline: v.optional(v.number()),
    evidenceSubmitted: v.optional(v.boolean()),
    evidenceDetails: v.optional(v.string()),
    chargebackFee: v.optional(v.number()),
    refundAmount: v.optional(v.number()),
    resolvedDate: v.optional(v.number()),
    internalNotes: v.optional(v.string()),
    customerCommunication: v.optional(v.string()),
    riskScore: v.optional(v.number()),
    previousChargebacks: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined),
    );

    await ctx.db.patch(id, filteredUpdates);
    return null;
  },
});

// Delete a chargeback
export const deleteChargeback = mutation({
  args: { id: v.id("chargebacks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

// Get chargebacks for a specific order
export const getChargebacksByOrder = query({
  args: { orderId: v.id("orders") },
  returns: v.array(
    v.object({
      _id: v.id("chargebacks"),
      _creationTime: v.number(),
      chargebackId: v.string(),
      amount: v.number(),
      currency: v.string(),
      reasonCode: v.string(),
      reasonDescription: v.string(),
      status: v.union(
        v.literal("received"),
        v.literal("under_review"),
        v.literal("accepted"),
        v.literal("disputed"),
        v.literal("won"),
        v.literal("lost"),
        v.literal("expired"),
      ),
      chargebackDate: v.number(),
      receivedDate: v.number(),
      resolvedDate: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const chargebacks = await ctx.db
      .query("chargebacks")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .order("desc")
      .collect();

    return chargebacks.map((chargeback) => ({
      _id: chargeback._id,
      _creationTime: chargeback._creationTime,
      chargebackId: chargeback.chargebackId,
      amount: chargeback.amount,
      currency: chargeback.currency,
      reasonCode: chargeback.reasonCode,
      reasonDescription: chargeback.reasonDescription,
      status: chargeback.status,
      chargebackDate: chargeback.chargebackDate,
      receivedDate: chargeback.receivedDate,
      resolvedDate: chargeback.resolvedDate,
    }));
  },
});

// Create chargeback from an existing order
export const orderChargeback = mutation({
  args: {
    orderId: v.id("orders"),
    reasonCode: v.string(),
    reasonDescription: v.string(),
    chargebackAmount: v.optional(v.number()), // If not provided, uses order total
    disputeDeadline: v.optional(v.number()),
    processorName: v.optional(v.string()),
    chargebackFee: v.optional(v.number()),
    internalNotes: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    chargebackId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get the order
      const order = await ctx.db.get(args.orderId);
      if (!order) {
        return { success: false, error: "Order not found" };
      }

      // Calculate chargeback amount (use provided or order total)
      const chargebackAmount = args.chargebackAmount || order.total;

      // Generate unique chargeback ID
      const chargebackId = `CHB-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      // Set dispute deadline (default to 14 days from now)
      const disputeDeadline =
        args.disputeDeadline || Date.now() + 14 * 24 * 60 * 60 * 1000;

      // Create chargeback record directly
      const newChargebackId = await ctx.db.insert("chargebacks", {
        chargebackId,
        orderId: args.orderId,
        transactionId: order.paymentMethod, // Use payment method as transaction reference
        amount: chargebackAmount,
        currency: "USD",
        reasonCode: args.reasonCode,
        reasonDescription: args.reasonDescription,
        status: "received",
        chargebackDate: Date.now(),
        receivedDate: Date.now(),
        disputeDeadline,
        customerInfo: {
          name: `${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
          email: order.email,
          customerId: undefined,
        },
        processorName: args.processorName || "Stripe",
        chargebackFee: args.chargebackFee || 1500, // Default $15 fee
        internalNotes:
          args.internalNotes ||
          `Chargeback initiated for order ${order.orderId}`,
        evidenceSubmitted: false,
        evidenceDetails: undefined,
        resolvedDate: undefined,
        metadata: undefined,
      });

      // Update the order status to "chargeback"
      await ctx.db.patch(args.orderId, {
        status: "chargeback",
        updatedAt: Date.now(),
      });

      return {
        success: true,
        chargebackId: newChargebackId,
      };
    } catch (error) {
      console.error("Error creating chargeback:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
