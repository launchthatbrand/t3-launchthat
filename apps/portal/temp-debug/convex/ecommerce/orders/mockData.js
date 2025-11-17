import { v } from "convex/values";

import { api, internal } from "../../_generated/api";
import { mutation } from "../../_generated/server";

// Helper function to create a single mock order
export const createMockOrder = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    orderId: v.optional(v.string()),
    orderDbId: v.optional(v.id("orders")), // Add the Convex database ID
    orderAmount: v.number(),
  }),
  handler: async (ctx) => {
    try {
      // Mock user details
      const mockUserData = {
        email: "mockuser@launchthat.app",
        name: "MOCK USER",
        firstName: "MOCK",
        lastName: "USER",
        phone: "+1-555-MOCK",
      };
      // Mock address
      const mockAddress = {
        fullName: "MOCK USER",
        addressLine1: "123 Mock Street",
        addressLine2: "Suite 100",
        city: "Mock City",
        stateOrProvince: "CA",
        postalCode: "12345",
        country: "US",
        phoneNumber: "+1-555-MOCK",
      };
      // Mock product details
      const mockProductData = {
        name: "MOCK PRODUCT",
        description: "This is a mock product for testing purposes",
        price: 1000, // $10.00 in cents
      };
      // Create or get mock user using centralized function
      const mockUserResult = await ctx.runMutation(
        api.core.users.mockData.createMockUser,
        {},
      );
      if (!mockUserResult.success || !mockUserResult.userId) {
        throw new Error("Failed to create or retrieve mock user");
      }
      const mockUser = await ctx.db.get(mockUserResult.userId);
      if (!mockUser) {
        throw new Error("Mock user could not be created or retrieved");
      }
      // Check if mock product exists
      let mockProduct = await ctx.db
        .query("products")
        .filter((q) => q.eq(q.field("name"), mockProductData.name))
        .first();
      if (!mockProduct) {
        // First, we need to create a mock product category if it doesn't exist
        let mockCategory = await ctx.db
          .query("productCategories")
          .filter((q) => q.eq(q.field("name"), "Mock Category"))
          .first();
        if (!mockCategory) {
          const mockCategoryId = await ctx.db.insert("productCategories", {
            name: "Mock Category",
            description: "Category for mock test data",
            slug: "mock-category",
            // Required hierarchical fields
            parentId: undefined, // Root category
            level: 0, // Root level
            path: [], // Empty path for root category
            // Required boolean fields
            isActive: true,
            isVisible: true,
            // Optional display fields
            displayOrder: 999,
            // Optional SEO fields
            metaTitle: "Mock Category",
            metaDescription: "Category for mock test data",
            // Required timestamps
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          mockCategory = await ctx.db.get(mockCategoryId);
        }
        if (!mockCategory) {
          throw new Error("Failed to create mock category");
        }
        // Create mock product with all required fields
        const now = Date.now();
        const mockProductId = await ctx.db.insert("products", {
          name: mockProductData.name,
          description: mockProductData.description,
          slug: "mock-product",
          shortDescription: "Mock product for testing",
          // Required category fields
          primaryCategoryId: mockCategory._id,
          categoryIds: [mockCategory._id],
          // Required pricing fields
          price: mockProductData.price / 100, // Convert cents to dollars
          priceInCents: mockProductData.price,
          // Required inventory fields
          sku: `MOCK-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          stockStatus: "in_stock",
          stockQuantity: 1000,
          // Required boolean fields
          isDigital: false,
          hasVariants: false,
          isFeatured: false,
          taxable: true,
          isVisible: true,
          isPublished: true,
          // Required status
          status: "published",
          // Optional fields with defaults
          weight: 1.0,
          dimensions: {
            length: 10,
            width: 10,
            height: 5,
            unit: "cm",
          },
          images: [],
          tags: ["mock", "test-data"],
          // Required timestamps
          createdAt: now,
          updatedAt: now,
        });
        mockProduct = await ctx.db.get(mockProductId);
      }
      if (!mockProduct) {
        throw new Error("Mock product could not be created or retrieved");
      }
      // Order statuses with realistic distribution
      const orderStatuses = [
        { status: "completed", weight: 40 },
        { status: "processing", weight: 20 },
        { status: "shipped", weight: 15 },
        { status: "delivered", weight: 10 },
        { status: "pending", weight: 8 },
        { status: "cancelled", weight: 4 },
        { status: "refunded", weight: 3 },
      ];
      // Payment statuses with realistic distribution
      const paymentStatuses = [
        { status: "paid", weight: 70 },
        { status: "pending", weight: 15 },
        { status: "processing", weight: 8 },
        { status: "failed", weight: 4 },
        { status: "refunded", weight: 3 },
      ];
      // Payment methods
      const paymentMethods = [
        { method: "credit_card", weight: 60 },
        { method: "paypal", weight: 25 },
        { method: "apple_pay", weight: 8 },
        { method: "google_pay", weight: 5 },
        { method: "bank_transfer", weight: 2 },
      ];
      // Helper function to select based on weight
      const selectByWeight = (items) => {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        for (const item of items) {
          random -= item.weight;
          if (random <= 0) return item;
        }
        return items[0]; // fallback
      };
      // Vary the quantity of the mock product (1-10 items)
      const itemQuantity = Math.floor(Math.random() * 10) + 1;
      const lineTotal = mockProduct.price * itemQuantity;
      const selectedItems = [
        {
          productId: mockProduct._id,
          productSnapshot: {
            name: mockProduct.name,
            description:
              mockProduct.description ||
              "This is a mock product for testing purposes", // Required by orders schema
            price: mockProduct.price,
            imageUrl: undefined, // Optional field
          },
          quantity: itemQuantity,
          lineTotal,
        },
      ];
      // Calculate totals
      const subtotal = lineTotal;
      const tax = Math.round(subtotal * 0.08); // 8% tax
      const shipping = subtotal > 5000 ? 0 : 500; // Free shipping over $50
      const total = subtotal + tax + shipping;
      // Generate random dates (last 30 days)
      const createdAt =
        Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
      const updatedAt =
        createdAt + Math.floor(Math.random() * 24 * 60 * 60 * 1000); // Updated sometime after creation
      // Generate random payment method using weighted selection
      const selectedPaymentMethod = selectByWeight(paymentMethods);
      const paymentMethod = selectedPaymentMethod.method;
      // Select statuses using the weighted selection
      const selectedOrderStatus = selectByWeight(orderStatuses);
      const selectedPaymentStatus = selectByWeight(paymentStatuses);
      const status = selectedOrderStatus.status;
      const paymentStatus = selectedPaymentStatus.status;
      // Create order ID
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      // Extract firstName and lastName from user.name since the schema doesn't have separate fields
      const nameParts = mockUser.name?.split(" ") || ["MOCK", "USER"];
      const firstName = nameParts[0] || "MOCK";
      const lastName = nameParts.slice(1).join(" ") || "USER";
      // Order data
      const orderData = {
        orderId,
        email: mockUser.email, // Email is a separate field, not in customerInfo
        customerInfo: {
          firstName,
          lastName,
          phone: "+1-555-MOCK",
          // company is optional, so we don't include it
        },
        items: selectedItems,
        status,
        paymentStatus,
        paymentMethod, // REQUIRED: Add payment method
        subtotal, // REQUIRED: Add subtotal
        tax,
        shipping,
        total,
        shippingAddress: mockUser.addresses?.[0], // Use the mock user's address
        billingAddress: mockUser.addresses?.[0], // Same address for billing
        createdAt, // REQUIRED: Add creation timestamp
        updatedAt, // REQUIRED: Add update timestamp
      };
      // Insert the order
      const newOrderId = await ctx.db.insert("orders", orderData);
      // Trigger order created webhook events (fire and forget)
      ctx.scheduler.runAfter(
        0,
        internal.integrations.triggers.orderEvents.triggerOrderCreated,
        {
          orderId: newOrderId,
          orderData: { ...orderData, _id: newOrderId },
        },
      );
      return {
        success: true,
        orderId: orderId, // Return the human-readable orderId, not the Convex _id
        orderDbId: newOrderId, // Add the Convex database ID for other functions to use
        orderAmount: total,
      };
    } catch (error) {
      console.error("Error creating mock order:", error);
      return {
        success: false,
        orderId: undefined,
        orderAmount: 0,
      };
    }
  },
});
// Mock data mutation to create multiple sample orders
export const createMockOrders = mutation({
  args: {
    quantity: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    count: v.number(),
    orderIds: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const quantity = Math.min(Math.max(args.quantity, 1), 100); // Limit between 1-100
    const createdOrderIds = [];
    for (let i = 0; i < quantity; i++) {
      try {
        const orderResult = await ctx.runMutation(createMockOrder, {});
        if (orderResult.success && orderResult.orderId) {
          createdOrderIds.push(orderResult.orderId);
        }
      } catch (error) {
        console.error(`Error creating mock order ${i}:`, error);
        // Continue with next order instead of failing completely
      }
    }
    return {
      success: true,
      count: createdOrderIds.length,
      orderIds: createdOrderIds,
    };
  },
});
/*
// Migration function to fix existing mock orders that are missing email in customerInfo
export const fixMockOrdersEmail = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    fixedOrders: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get all orders where the customerInfo doesn't have email but does have firstName/lastName as MOCK/USER
      const orders = await ctx.db.query("orders").collect();
      
      let fixedOrders = 0;
      const errors: string[] = [];

      for (const order of orders) {
        // Check if this is a mock order without email
        if (
          order.customerInfo &&
          order.customerInfo.firstName === "MOCK" &&
          order.customerInfo.lastName === "USER" &&
          !order.customerInfo.email
        ) {
          try {
            // Update the order to include the email
            await ctx.db.patch(order._id, {
              customerInfo: {
                ...order.customerInfo,
                email: "mockuser@launchthat.app", // Add the missing email
              },
            });
            fixedOrders++;
          } catch (error) {
            errors.push(`Failed to fix order ${order._id}: ${String(error)}`);
          }
        }
      }

      return {
        success: true,
        fixedOrders,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        fixedOrders: 0,
        errors: [String(error)],
      };
    }
  },
});
*/
