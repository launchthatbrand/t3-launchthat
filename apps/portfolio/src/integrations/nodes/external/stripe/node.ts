import { z } from "zod";

import type {
  ConnectionDefinition,
  IntegrationNodeDefinition,
  NodeExecutionContext,
  NodeExecutionResult,
} from "@acme/integration-sdk";

// ==================== SCHEMAS ====================

export const StripeInputSchema = z.object({
  action: z.enum([
    "create_customer",
    "update_customer",
    "get_customer",
    "create_payment_intent",
    "confirm_payment_intent",
    "create_subscription",
    "update_subscription",
    "cancel_subscription",
    "create_price",
    "create_product",
    "get_payment_methods",
  ]),
  // Customer operations
  customerData: z
    .object({
      email: z.string().email("Valid email is required"),
      name: z.string().optional(),
      phone: z.string().optional(),
      description: z.string().optional(),
      metadata: z.record(z.string(), z.string()).optional(),
      address: z
        .object({
          line1: z.string(),
          line2: z.string().optional(),
          city: z.string(),
          state: z.string().optional(),
          postal_code: z.string(),
          country: z.string(),
        })
        .optional(),
    })
    .optional(),
  customerId: z.string().optional(),
  // Payment operations
  paymentData: z
    .object({
      amount: z.number().min(1, "Amount must be greater than 0"),
      currency: z.string().min(3, "Currency code is required"),
      customer: z.string().optional(),
      payment_method: z.string().optional(),
      confirmation_method: z.enum(["automatic", "manual"]).default("automatic"),
      description: z.string().optional(),
      metadata: z.record(z.string(), z.string()).optional(),
      receipt_email: z.string().email().optional(),
    })
    .optional(),
  paymentIntentId: z.string().optional(),
  // Subscription operations
  subscriptionData: z
    .object({
      customer: z.string().min(1, "Customer ID is required"),
      items: z
        .array(
          z.object({
            price: z.string().min(1, "Price ID is required"),
            quantity: z.number().min(1).default(1),
          }),
        )
        .min(1, "At least one item is required"),
      trial_period_days: z.number().optional(),
      metadata: z.record(z.string(), z.string()).optional(),
      payment_behavior: z
        .enum(["allow_incomplete", "default_incomplete", "error_if_incomplete"])
        .default("default_incomplete"),
    })
    .optional(),
  subscriptionId: z.string().optional(),
  // Product and pricing operations
  productData: z
    .object({
      name: z.string().min(1, "Product name is required"),
      description: z.string().optional(),
      metadata: z.record(z.string(), z.string()).optional(),
      active: z.boolean().default(true),
    })
    .optional(),
  priceData: z
    .object({
      product: z.string().min(1, "Product ID is required"),
      unit_amount: z.number().min(1, "Unit amount is required"),
      currency: z.string().min(3, "Currency code is required"),
      recurring: z
        .object({
          interval: z.enum(["day", "week", "month", "year"]),
          interval_count: z.number().min(1).default(1),
        })
        .optional(),
      metadata: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
});

export const StripeOutputSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      customer: z
        .object({
          id: z.string(),
          email: z.string(),
          name: z.string().nullable(),
          created: z.number(),
          metadata: z.record(z.string(), z.string()),
        })
        .optional(),
      payment_intent: z
        .object({
          id: z.string(),
          amount: z.number(),
          currency: z.string(),
          status: z.string(),
          customer: z.string().nullable(),
          client_secret: z.string(),
          created: z.number(),
        })
        .optional(),
      subscription: z
        .object({
          id: z.string(),
          customer: z.string(),
          status: z.string(),
          current_period_start: z.number(),
          current_period_end: z.number(),
          created: z.number(),
          items: z.array(
            z.object({
              id: z.string(),
              price: z.object({
                id: z.string(),
                unit_amount: z.number(),
                currency: z.string(),
              }),
              quantity: z.number(),
            }),
          ),
        })
        .optional(),
      product: z
        .object({
          id: z.string(),
          name: z.string(),
          description: z.string().nullable(),
          created: z.number(),
          active: z.boolean(),
        })
        .optional(),
      price: z
        .object({
          id: z.string(),
          product: z.string(),
          unit_amount: z.number(),
          currency: z.string(),
          recurring: z
            .object({
              interval: z.string(),
              interval_count: z.number(),
            })
            .nullable(),
          created: z.number(),
        })
        .optional(),
      payment_methods: z
        .array(
          z.object({
            id: z.string(),
            type: z.string(),
            card: z
              .object({
                brand: z.string(),
                last4: z.string(),
                exp_month: z.number(),
                exp_year: z.number(),
              })
              .optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  error: z.string().optional(),
});

// ==================== CONNECTION DEFINITION ====================

export const StripeConnectionDefinition: ConnectionDefinition = {
  id: "stripe",
  name: "Stripe",
  type: "api_key",
  authSchema: z.object({
    secretKey: z.string().min(1, "Secret key is required"),
    publishableKey: z.string().min(1, "Publishable key is required"),
    webhookSecret: z.string().optional(),
  }),

  async testConnection(auth) {
    try {
      const authData = auth as {
        secretKey: string;
        publishableKey: string;
        webhookSecret?: string;
      };

      const response = await fetch("https://api.stripe.com/v1/balance", {
        headers: {
          Authorization: `Bearer ${authData.secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  },
};

// ==================== STRIPE NODE FUNCTIONS ====================

async function makeStripeRequest(
  auth: { secretKey: string },
  endpoint: string,
  method: string = "GET",
  data?: Record<string, any>,
): Promise<any> {
  const url = `https://api.stripe.com/v1${endpoint}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${auth.secretKey}`,
    "Stripe-Version": "2023-10-16",
  };

  let body: string | undefined;
  if (data && (method === "POST" || method === "PUT")) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(flattenObject(data)).toString();
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Stripe API error (${response.status}): ${errorData.error?.message || response.statusText}`,
    );
  }

  return response.json();
}

// Helper function to flatten nested objects for Stripe's API format
function flattenObject(obj: any, prefix = ""): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const key in obj) {
    if (obj[key] === null || obj[key] === undefined) {
      continue;
    }

    const newKey = prefix ? `${prefix}[${key}]` : key;

    if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      Object.assign(flattened, flattenObject(obj[key], newKey));
    } else if (Array.isArray(obj[key])) {
      obj[key].forEach((item: any, index: number) => {
        if (typeof item === "object") {
          Object.assign(flattened, flattenObject(item, `${newKey}[${index}]`));
        } else {
          flattened[`${newKey}[${index}]`] = String(item);
        }
      });
    } else {
      flattened[newKey] = String(obj[key]);
    }
  }

  return flattened;
}

async function createCustomer(
  auth: { secretKey: string },
  customerData: any,
): Promise<NodeExecutionResult> {
  const data = await makeStripeRequest(
    auth,
    "/customers",
    "POST",
    customerData,
  );

  return {
    success: true,
    data: {
      customer: {
        id: data.id,
        email: data.email,
        name: data.name,
        created: data.created,
        metadata: data.metadata,
      },
    },
    logs: [`Created Stripe customer: ${data.email}`, `Customer ID: ${data.id}`],
  };
}

async function updateCustomer(
  auth: { secretKey: string },
  customerId: string,
  customerData: any,
): Promise<NodeExecutionResult> {
  const data = await makeStripeRequest(
    auth,
    `/customers/${customerId}`,
    "POST",
    customerData,
  );

  return {
    success: true,
    data: {
      customer: {
        id: data.id,
        email: data.email,
        name: data.name,
        created: data.created,
        metadata: data.metadata,
      },
    },
    logs: [`Updated Stripe customer: ${data.email}`, `Customer ID: ${data.id}`],
  };
}

async function getCustomer(
  auth: { secretKey: string },
  customerId: string,
): Promise<NodeExecutionResult> {
  const data = await makeStripeRequest(auth, `/customers/${customerId}`);

  return {
    success: true,
    data: {
      customer: {
        id: data.id,
        email: data.email,
        name: data.name,
        created: data.created,
        metadata: data.metadata,
      },
    },
    logs: [
      `Retrieved Stripe customer: ${data.email}`,
      `Customer ID: ${data.id}`,
    ],
  };
}

async function createPaymentIntent(
  auth: { secretKey: string },
  paymentData: any,
): Promise<NodeExecutionResult> {
  const data = await makeStripeRequest(
    auth,
    "/payment_intents",
    "POST",
    paymentData,
  );

  return {
    success: true,
    data: {
      payment_intent: {
        id: data.id,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        customer: data.customer,
        client_secret: data.client_secret,
        created: data.created,
      },
    },
    logs: [
      `Created Stripe payment intent: ${data.id}`,
      `Amount: ${data.amount} ${data.currency.toUpperCase()}`,
      `Status: ${data.status}`,
    ],
  };
}

async function confirmPaymentIntent(
  auth: { secretKey: string },
  paymentIntentId: string,
): Promise<NodeExecutionResult> {
  const data = await makeStripeRequest(
    auth,
    `/payment_intents/${paymentIntentId}/confirm`,
    "POST",
  );

  return {
    success: true,
    data: {
      payment_intent: {
        id: data.id,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        customer: data.customer,
        client_secret: data.client_secret,
        created: data.created,
      },
    },
    logs: [
      `Confirmed Stripe payment intent: ${data.id}`,
      `Status: ${data.status}`,
    ],
  };
}

async function createSubscription(
  auth: { secretKey: string },
  subscriptionData: any,
): Promise<NodeExecutionResult> {
  const data = await makeStripeRequest(
    auth,
    "/subscriptions",
    "POST",
    subscriptionData,
  );

  return {
    success: true,
    data: {
      subscription: {
        id: data.id,
        customer: data.customer,
        status: data.status,
        current_period_start: data.current_period_start,
        current_period_end: data.current_period_end,
        created: data.created,
        items: data.items.data.map((item: any) => ({
          id: item.id,
          price: {
            id: item.price.id,
            unit_amount: item.price.unit_amount,
            currency: item.price.currency,
          },
          quantity: item.quantity,
        })),
      },
    },
    logs: [
      `Created Stripe subscription: ${data.id}`,
      `Customer: ${data.customer}`,
      `Status: ${data.status}`,
    ],
  };
}

async function updateSubscription(
  auth: { secretKey: string },
  subscriptionId: string,
  subscriptionData: any,
): Promise<NodeExecutionResult> {
  const data = await makeStripeRequest(
    auth,
    `/subscriptions/${subscriptionId}`,
    "POST",
    subscriptionData,
  );

  return {
    success: true,
    data: {
      subscription: {
        id: data.id,
        customer: data.customer,
        status: data.status,
        current_period_start: data.current_period_start,
        current_period_end: data.current_period_end,
        created: data.created,
        items: data.items.data.map((item: any) => ({
          id: item.id,
          price: {
            id: item.price.id,
            unit_amount: item.price.unit_amount,
            currency: item.price.currency,
          },
          quantity: item.quantity,
        })),
      },
    },
    logs: [`Updated Stripe subscription: ${data.id}`, `Status: ${data.status}`],
  };
}

async function cancelSubscription(
  auth: { secretKey: string },
  subscriptionId: string,
): Promise<NodeExecutionResult> {
  const data = await makeStripeRequest(
    auth,
    `/subscriptions/${subscriptionId}`,
    "DELETE",
  );

  return {
    success: true,
    data: {
      subscription: {
        id: data.id,
        customer: data.customer,
        status: data.status,
        current_period_start: data.current_period_start,
        current_period_end: data.current_period_end,
        created: data.created,
        items: data.items.data.map((item: any) => ({
          id: item.id,
          price: {
            id: item.price.id,
            unit_amount: item.price.unit_amount,
            currency: item.price.currency,
          },
          quantity: item.quantity,
        })),
      },
    },
    logs: [
      `Cancelled Stripe subscription: ${data.id}`,
      `Status: ${data.status}`,
    ],
  };
}

async function createProduct(
  auth: { secretKey: string },
  productData: any,
): Promise<NodeExecutionResult> {
  const data = await makeStripeRequest(auth, "/products", "POST", productData);

  return {
    success: true,
    data: {
      product: {
        id: data.id,
        name: data.name,
        description: data.description,
        created: data.created,
        active: data.active,
      },
    },
    logs: [`Created Stripe product: ${data.name}`, `Product ID: ${data.id}`],
  };
}

async function createPrice(
  auth: { secretKey: string },
  priceData: any,
): Promise<NodeExecutionResult> {
  const data = await makeStripeRequest(auth, "/prices", "POST", priceData);

  return {
    success: true,
    data: {
      price: {
        id: data.id,
        product: data.product,
        unit_amount: data.unit_amount,
        currency: data.currency,
        recurring: data.recurring,
        created: data.created,
      },
    },
    logs: [
      `Created Stripe price: ${data.id}`,
      `Amount: ${data.unit_amount} ${data.currency.toUpperCase()}`,
      data.recurring
        ? `Recurring: ${data.recurring.interval}`
        : "One-time payment",
    ].filter(Boolean),
  };
}

async function getPaymentMethods(
  auth: { secretKey: string },
  customerId: string,
): Promise<NodeExecutionResult> {
  const data = await makeStripeRequest(
    auth,
    `/payment_methods?customer=${customerId}&type=card`,
  );

  return {
    success: true,
    data: {
      payment_methods: data.data.map((pm: any) => ({
        id: pm.id,
        type: pm.type,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              exp_month: pm.card.exp_month,
              exp_year: pm.card.exp_year,
            }
          : undefined,
      })),
    },
    logs: [
      `Retrieved ${data.data.length} payment methods for customer: ${customerId}`,
    ],
  };
}

// ==================== NODE DEFINITION ====================

export const StripeNodeDefinition: IntegrationNodeDefinition = {
  metadata: {
    id: "external.stripe",
    name: "Stripe",
    description:
      "Handle payments, subscriptions, and customer management with Stripe",
    type: "external",
    category: "payment",
    version: "1.0.0",
    icon: "CreditCard",
    color: "#635BFF",
  },

  configSchema: {
    input: z.object({
      action: z.enum([
        "create_customer",
        "update_customer",
        "get_customer",
        "create_payment_intent",
        "confirm_payment_intent",
        "create_subscription",
        "update_subscription",
        "cancel_subscription",
        "create_price",
        "create_product",
        "get_payment_methods",
      ]),
      customerData: z.any().optional(),
      customerId: z.string().optional(),
      paymentData: z.any().optional(),
      paymentIntentId: z.string().optional(),
      subscriptionData: z.any().optional(),
      subscriptionId: z.string().optional(),
      productData: z.any().optional(),
      priceData: z.any().optional(),
    }),
    output: z.object({
      success: z.boolean(),
      data: z.any().optional(),
      error: z.string().optional(),
    }),
    settings: z.object({
      defaultCurrency: z.string().default("usd"),
      testMode: z.boolean().default(true),
      webhookEndpoint: z.string().optional(),
    }),
  },

  connections: [StripeConnectionDefinition],

  execute: async (
    context: NodeExecutionContext,
  ): Promise<NodeExecutionResult> => {
    try {
      const input = StripeInputSchema.parse(context.inputData);
      const connection = StripeConnectionDefinition.authSchema.parse(
        context.connections.stripe,
      );

      const {
        action,
        customerData,
        customerId,
        paymentData,
        paymentIntentId,
        subscriptionData,
        subscriptionId,
        productData,
        priceData,
      } = input;
      const auth = { secretKey: connection.secretKey };

      switch (action) {
        case "create_customer":
          if (!customerData) {
            throw new Error(
              "Customer data is required for creating a customer",
            );
          }
          return await createCustomer(auth, customerData);

        case "update_customer":
          if (!customerId || !customerData) {
            throw new Error(
              "Customer ID and customer data are required for updating a customer",
            );
          }
          return await updateCustomer(auth, customerId, customerData);

        case "get_customer":
          if (!customerId) {
            throw new Error("Customer ID is required for getting a customer");
          }
          return await getCustomer(auth, customerId);

        case "create_payment_intent":
          if (!paymentData) {
            throw new Error(
              "Payment data is required for creating a payment intent",
            );
          }
          return await createPaymentIntent(auth, paymentData);

        case "confirm_payment_intent":
          if (!paymentIntentId) {
            throw new Error(
              "Payment intent ID is required for confirming a payment",
            );
          }
          return await confirmPaymentIntent(auth, paymentIntentId);

        case "create_subscription":
          if (!subscriptionData) {
            throw new Error(
              "Subscription data is required for creating a subscription",
            );
          }
          return await createSubscription(auth, subscriptionData);

        case "update_subscription":
          if (!subscriptionId || !subscriptionData) {
            throw new Error(
              "Subscription ID and subscription data are required for updating a subscription",
            );
          }
          return await updateSubscription(
            auth,
            subscriptionId,
            subscriptionData,
          );

        case "cancel_subscription":
          if (!subscriptionId) {
            throw new Error(
              "Subscription ID is required for cancelling a subscription",
            );
          }
          return await cancelSubscription(auth, subscriptionId);

        case "create_product":
          if (!productData) {
            throw new Error("Product data is required for creating a product");
          }
          return await createProduct(auth, productData);

        case "create_price":
          if (!priceData) {
            throw new Error("Price data is required for creating a price");
          }
          return await createPrice(auth, priceData);

        case "get_payment_methods":
          if (!customerId) {
            throw new Error(
              "Customer ID is required for getting payment methods",
            );
          }
          return await getPaymentMethods(auth, customerId);

        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        logs: [
          `Stripe operation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
      };
    }
  },

  async validate(settings: unknown): Promise<boolean> {
    try {
      StripeInputSchema.parse(settings);
      return true;
    } catch {
      return false;
    }
  },
};
