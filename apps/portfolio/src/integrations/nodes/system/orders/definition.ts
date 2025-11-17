import { z } from "zod";

import type { IntegrationNodeDefinition } from "@acme/integration-sdk";

const orderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().min(0),
  quantity: z.number().int().min(1),
  sku: z.string().optional(),
});

const orderSchema = z.object({
  orderId: z.string(),
  customerEmail: z.string().email(),
  items: z.array(orderItemSchema),
  total: z.number().min(0),
  currency: z.string().default("USD"),
  status: z.enum([
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});

const ordersSettingsSchema = z.object({
  action: z.enum(["create", "update", "get", "list", "cancel"]),
  autoGenerateId: z.boolean().default(true),
});

// Simple in-memory store for demo
const orderStore = new Map<string, z.infer<typeof orderSchema>>();

function generateOrderId(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export const ordersNodeDefinition: IntegrationNodeDefinition = {
  metadata: {
    id: "system.orders",
    name: "Orders",
    description: "Manage e-commerce orders with validation and status tracking",
    type: "system",
    category: "ecommerce",
    version: "1.0.0",
    icon: "ShoppingCart",
    color: "#10B981",
  },

  configSchema: {
    input: {
      schema: z.object({
        order: orderSchema.optional(),
        orderId: z.string().optional(),
        updates: z.record(z.any()).optional(),
      }),
      description: "Order data, order ID, or updates",
    },
    output: {
      schema: z.object({
        success: z.boolean(),
        order: orderSchema.optional(),
        orders: z.array(orderSchema).optional(),
        orderId: z.string().optional(),
        message: z.string().optional(),
      }),
      description: "Order operation result",
    },
    settings: {
      schema: ordersSettingsSchema,
      description: "Order management configuration",
    },
  },

  processor: {
    async execute(context) {
      const { settings, inputData } = context;
      const orderSettings = settings as z.infer<typeof ordersSettingsSchema>;
      const input = inputData as any;

      try {
        switch (orderSettings.action) {
          case "create": {
            if (!input?.order) {
              return {
                success: false,
                error: "Order data is required for create action",
              };
            }

            let orderData = input.order;

            if (orderSettings.autoGenerateId && !orderData.orderId) {
              orderData.orderId = generateOrderId();
            }

            orderStore.set(orderData.orderId, orderData);

            return {
              success: true,
              data: {
                success: true,
                order: orderData,
                orderId: orderData.orderId,
                message: `Order ${orderData.orderId} created successfully`,
              },
              logs: [`Order created: ${orderData.orderId}`],
            };
          }

          case "get": {
            const orderId = input?.orderId;
            if (!orderId) {
              return {
                success: false,
                error: "Order ID is required for get action",
              };
            }

            const order = orderStore.get(orderId);
            if (!order) {
              return {
                success: false,
                error: `Order ${orderId} not found`,
              };
            }

            return {
              success: true,
              data: {
                success: true,
                order,
                orderId,
                message: `Order ${orderId} retrieved successfully`,
              },
              logs: [`Order retrieved: ${orderId}`],
            };
          }

          case "list": {
            const orders = Array.from(orderStore.values());
            return {
              success: true,
              data: {
                success: true,
                orders,
                message: `Retrieved ${orders.length} orders`,
              },
              logs: [`Listed ${orders.length} orders`],
            };
          }

          default:
            return {
              success: false,
              error: `Unknown action: ${orderSettings.action}`,
            };
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },

    async validate(settings) {
      try {
        ordersSettingsSchema.parse(settings);
        return true;
      } catch {
        return false;
      }
    },
  },
};
