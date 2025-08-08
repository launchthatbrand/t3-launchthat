import { v } from "convex/values";

import { Doc } from "../../_generated/dataModel";
import { mutation } from "../../_generated/server";
import { requirePermission } from "../../lib/permissions/requirePermission";

/**
 * Update an existing order
 */
export const update = mutation({
  args: {
    id: v.id("orders"),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    differentShippingAddress: v.optional(v.boolean()),
    billingAddress: v.optional(
      v.object({
        fullName: v.string(),
        addressLine1: v.string(),
        addressLine2: v.string(),
        city: v.string(),
        stateOrProvince: v.string(),
        postalCode: v.string(),
        country: v.string(),
        phoneNumber: v.string(),
      }),
    ),
    shippingAddress: v.optional(
      v.object({
        fullName: v.string(),
        addressLine1: v.string(),
        addressLine2: v.string(),
        city: v.string(),
        stateOrProvince: v.string(),
        postalCode: v.string(),
        country: v.string(),
        phoneNumber: v.string(),
      }),
    ),
    paymentMethod: v.optional(v.string()),
    notes: v.optional(v.string()),

    // Date fields (as timestamps for Convex compatibility)
    createdAt: v.optional(v.number()),

    // Shipping details (separate from line items)
    shipping: v.optional(v.number()),
    shippingDetails: v.optional(
      v.union(
        v.object({
          method: v.string(),
          description: v.string(),
          cost: v.number(),
        }),
        v.null(), // Allow null to clear shipping details
      ),
    ),

    lineItems: v.optional(
      v.array(
        v.object({
          id: v.string(),
          // Only products in line items now, shipping is handled separately
          productId: v.id("products"),
          productSnapshot: v.object({
            name: v.string(),
            description: v.string(),
            price: v.number(),
            imageUrl: v.optional(v.string()),
          }),
          quantity: v.number(),
          price: v.number(),
          lineTotal: v.number(),

          // Display fields (sent by frontend but not stored in DB)
          displayName: v.optional(v.string()),
          displayDescription: v.optional(v.string()),
          displayImageUrl: v.optional(v.string()),

          // Legacy type field (may still be sent by frontend)
          type: v.optional(v.string()),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Require admin permission to update orders
    await requirePermission(ctx, "canManageOrders");

    // Get the existing order
    const existingOrder = await ctx.db.get(args.id);
    if (!existingOrder) {
      throw new Error(`Order with ID ${args.id} not found`);
    }

    // Prepare the update object with only the fields that were provided
    const updateData: Partial<Doc<"orders">> = {
      updatedAt: Date.now(),
    };

    // Update customer info if provided
    if (args.email !== undefined) {
      updateData.email = args.email;
    }

    if (args.firstName !== undefined || args.lastName !== undefined) {
      updateData.customerInfo = {
        ...existingOrder.customerInfo,
        firstName:
          args.firstName ?? existingOrder.customerInfo?.firstName ?? "",
        lastName: args.lastName ?? existingOrder.customerInfo?.lastName ?? "",
        phone: args.phone ?? existingOrder.customerInfo?.phone,
        company: args.company ?? existingOrder.customerInfo?.company,
      };
    }

    // Update addresses if provided
    if (args.billingAddress !== undefined) {
      updateData.billingAddress = args.billingAddress;
    }

    if (args.shippingAddress !== undefined) {
      updateData.shippingAddress = args.shippingAddress;
    }

    // Update payment method if provided
    if (args.paymentMethod !== undefined) {
      updateData.paymentMethod = args.paymentMethod;
    }

    // Update notes if provided
    if (args.notes !== undefined) {
      updateData.notes = args.notes;
    }

    // Update shipping details if provided
    if (args.shipping !== undefined) {
      updateData.shipping = args.shipping;
    }

    if (args.shippingDetails !== undefined) {
      // Handle null values to clear shipping details
      updateData.shippingDetails = args.shippingDetails;
    }

    // Update createdAt if provided
    if (args.createdAt !== undefined) {
      updateData.createdAt = args.createdAt;
    }

    // Update line items if provided
    if (args.lineItems !== undefined) {
      // Convert line items to the format expected by the order schema
      const convertedItems = args.lineItems.map((item) => ({
        productId: item.productId,
        productSnapshot: item.productSnapshot,
        quantity: item.quantity,
        variantId: undefined, // Not provided in form data
        variantSnapshot: undefined, // Not provided in form data
        lineTotal: item.lineTotal,
      }));

      updateData.items = convertedItems;

      // Recalculate totals based on line items
      const subtotal = args.lineItems.reduce(
        (sum, item) => sum + item.lineTotal,
        0,
      );
      updateData.subtotal = subtotal;

      // Calculate total with updated shipping amount
      const shippingAmount =
        args.shipping !== undefined
          ? args.shipping
          : existingOrder.shipping || 0;
      updateData.total =
        subtotal +
        (existingOrder.tax || 0) +
        shippingAmount -
        (existingOrder.discount || 0);
    }

    // Update the order
    await ctx.db.patch(args.id, updateData);

    return { success: true };
  },
});
