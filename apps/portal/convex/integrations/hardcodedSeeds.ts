import { v } from "convex/values";

import type { IntegrationNodeSeed } from "./lib/seedingUtils";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { internalMutation } from "../_generated/server";

/**
 * Hard-coded integration node definitions
 *
 * These definitions are extracted from the existing node structure in
 * apps/portal/src/integrations/nodes and represent the current state
 * of our integration catalog.
 */

// WordPress Integration Nodes
const wordpressCreatePostNode: IntegrationNodeSeed = {
  identifier: "external.wordpress.create_post",
  name: "WordPress - Create Post",
  category: "action",
  integrationType: "wordpress",
  description:
    "Create a new post in WordPress via REST API with support for content, categories, and tags",
  inputSchema: JSON.stringify({
    type: "object",
    properties: {
      postData: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          status: { type: "string", enum: ["publish", "draft", "private"] },
        },
        required: ["title"],
      },
    },
  }),
  outputSchema: JSON.stringify({
    type: "object",
    properties: {
      success: { type: "boolean" },
      postId: { type: "number" },
      postUrl: { type: "string" },
      error: { type: "string" },
    },
    required: ["success"],
  }),
  configSchema: JSON.stringify({
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["create_post", "update_post", "get_posts"],
      },
      title: { type: "string", minLength: 1 },
      content: { type: "string" },
      status: {
        type: "string",
        enum: ["publish", "draft", "private"],
        default: "draft",
      },
      categories: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
    required: ["action", "title"],
  }),
  uiConfig: JSON.stringify({
    icon: "FileText",
    color: "#21759B",
    connectionType: "basic_auth",
    requiredFields: ["title"],
    optionalFields: ["content", "status", "categories", "tags"],
  }),
  version: "1.0.0",
  tags: ["cms", "content", "publishing"],
};

const wordpressGetPostsNode: IntegrationNodeSeed = {
  identifier: "external.wordpress.get_posts",
  name: "WordPress - Get Posts",
  category: "action",
  integrationType: "wordpress",
  description: "Retrieve posts from WordPress with filtering options",
  inputSchema: JSON.stringify({
    type: "object",
    properties: {
      filters: {
        type: "object",
        properties: {
          status: { type: "string" },
          author: { type: "string" },
          categories: { type: "array", items: { type: "string" } },
          per_page: { type: "number", default: 10 },
        },
      },
    },
  }),
  outputSchema: JSON.stringify({
    type: "object",
    properties: {
      success: { type: "boolean" },
      posts: { type: "array", items: { type: "object" } },
      totalPosts: { type: "number" },
      error: { type: "string" },
    },
    required: ["success"],
  }),
  configSchema: JSON.stringify({
    type: "object",
    properties: {
      action: { type: "string", enum: ["get_posts"] },
      per_page: { type: "number", default: 10, minimum: 1, maximum: 100 },
      status: {
        type: "string",
        enum: ["publish", "draft", "private", "any"],
        default: "publish",
      },
    },
    required: ["action"],
  }),
  uiConfig: JSON.stringify({
    icon: "FileText",
    color: "#21759B",
    connectionType: "basic_auth",
  }),
  version: "1.0.0",
  tags: ["cms", "content", "retrieval"],
};

// Stripe Integration Nodes
const stripeCreateCustomerNode: IntegrationNodeSeed = {
  identifier: "external.stripe.create_customer",
  name: "Stripe - Create Customer",
  category: "action",
  integrationType: "stripe",
  description:
    "Create a new customer in Stripe with email, name, and optional address information",
  inputSchema: JSON.stringify({
    type: "object",
    properties: {
      customerData: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          name: { type: "string" },
          phone: { type: "string" },
          description: { type: "string" },
          metadata: { type: "object" },
          address: {
            type: "object",
            properties: {
              line1: { type: "string" },
              line2: { type: "string" },
              city: { type: "string" },
              state: { type: "string" },
              postal_code: { type: "string" },
              country: { type: "string" },
            },
            required: ["line1", "city", "postal_code", "country"],
          },
        },
        required: ["email"],
      },
    },
    required: ["customerData"],
  }),
  outputSchema: JSON.stringify({
    type: "object",
    properties: {
      success: { type: "boolean" },
      customerId: { type: "string" },
      customerObject: { type: "object" },
      error: { type: "string" },
    },
    required: ["success"],
  }),
  configSchema: JSON.stringify({
    type: "object",
    properties: {
      action: { type: "string", enum: ["create_customer"] },
      defaultMetadata: { type: "object" },
    },
    required: ["action"],
  }),
  uiConfig: JSON.stringify({
    icon: "CreditCard",
    color: "#635BFF",
    connectionType: "api_key",
  }),
  version: "1.0.0",
  tags: ["payment", "customer", "stripe"],
};

const stripeCreatePaymentIntentNode: IntegrationNodeSeed = {
  identifier: "external.stripe.create_payment_intent",
  name: "Stripe - Create Payment Intent",
  category: "action",
  integrationType: "stripe",
  description: "Create a payment intent for processing payments with Stripe",
  inputSchema: JSON.stringify({
    type: "object",
    properties: {
      paymentData: {
        type: "object",
        properties: {
          amount: { type: "number", minimum: 1 },
          currency: { type: "string", default: "usd" },
          customerId: { type: "string" },
          description: { type: "string" },
          metadata: { type: "object" },
        },
        required: ["amount", "currency"],
      },
    },
    required: ["paymentData"],
  }),
  outputSchema: JSON.stringify({
    type: "object",
    properties: {
      success: { type: "boolean" },
      paymentIntentId: { type: "string" },
      clientSecret: { type: "string" },
      status: { type: "string" },
      error: { type: "string" },
    },
    required: ["success"],
  }),
  configSchema: JSON.stringify({
    type: "object",
    properties: {
      action: { type: "string", enum: ["create_payment_intent"] },
      defaultCurrency: { type: "string", default: "usd" },
      automaticPaymentMethods: { type: "boolean", default: true },
    },
    required: ["action"],
  }),
  uiConfig: JSON.stringify({
    icon: "CreditCard",
    color: "#635BFF",
    connectionType: "api_key",
  }),
  version: "1.0.0",
  tags: ["payment", "intent", "stripe"],
};

// System Integration Nodes
const systemWebhookNode: IntegrationNodeSeed = {
  identifier: "system.webhook",
  name: "Webhook Trigger",
  category: "trigger",
  integrationType: "system",
  description:
    "Receive HTTP webhooks from external services to trigger automation scenarios",
  inputSchema: JSON.stringify({
    type: "object",
    properties: {
      headers: { type: "object" },
      body: { type: "object" },
      query: { type: "object" },
      method: { type: "string" },
    },
  }),
  outputSchema: JSON.stringify({
    type: "object",
    properties: {
      success: { type: "boolean" },
      webhookId: { type: "string" },
      data: { type: "object" },
      timestamp: { type: "number" },
    },
    required: ["success"],
  }),
  configSchema: JSON.stringify({
    type: "object",
    properties: {
      webhookUrl: { type: "string" },
      method: {
        type: "string",
        enum: ["POST", "GET", "PUT", "PATCH"],
        default: "POST",
      },
      authentication: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["none", "token", "signature"] },
          secret: { type: "string" },
        },
      },
    },
    required: ["method"],
  }),
  uiConfig: JSON.stringify({
    icon: "Webhook",
    color: "#10B981",
    connectionType: "none",
  }),
  version: "1.0.0",
  tags: ["trigger", "webhook", "http"],
};

const systemOrdersNode: IntegrationNodeSeed = {
  identifier: "system.orders",
  name: "Orders Processor",
  category: "transformer",
  integrationType: "system",
  description: "Process and validate order data with built-in business logic",
  inputSchema: JSON.stringify({
    type: "object",
    properties: {
      orderData: {
        type: "object",
        properties: {
          items: { type: "array", items: { type: "object" } },
          customerId: { type: "string" },
          totalAmount: { type: "number" },
          currency: { type: "string" },
          metadata: { type: "object" },
        },
        required: ["items", "totalAmount"],
      },
    },
    required: ["orderData"],
  }),
  outputSchema: JSON.stringify({
    type: "object",
    properties: {
      success: { type: "boolean" },
      orderId: { type: "string" },
      processedOrder: { type: "object" },
      validationResults: { type: "object" },
      error: { type: "string" },
    },
    required: ["success"],
  }),
  configSchema: JSON.stringify({
    type: "object",
    properties: {
      validation: {
        type: "object",
        properties: {
          requireCustomer: { type: "boolean", default: true },
          minAmount: { type: "number", default: 0 },
          allowedCurrencies: { type: "array", items: { type: "string" } },
        },
      },
      processing: {
        type: "object",
        properties: {
          calculateTax: { type: "boolean", default: false },
          applyDiscounts: { type: "boolean", default: false },
        },
      },
    },
  }),
  uiConfig: JSON.stringify({
    icon: "ShoppingCart",
    color: "#F59E0B",
    connectionType: "none",
  }),
  version: "1.0.0",
  tags: ["order", "processing", "ecommerce"],
};

const systemPassthroughNode: IntegrationNodeSeed = {
  identifier: "system.passthrough",
  name: "Data Passthrough",
  category: "transformer",
  integrationType: "system",
  description: "Pass data through with optional filtering and transformation",
  inputSchema: JSON.stringify({
    type: "object",
    properties: {
      data: { type: "object" },
    },
    required: ["data"],
  }),
  outputSchema: JSON.stringify({
    type: "object",
    properties: {
      success: { type: "boolean" },
      data: { type: "object" },
      transformedData: { type: "object" },
      error: { type: "string" },
    },
    required: ["success"],
  }),
  configSchema: JSON.stringify({
    type: "object",
    properties: {
      filters: {
        type: "object",
        properties: {
          allowedFields: { type: "array", items: { type: "string" } },
          blockedFields: { type: "array", items: { type: "string" } },
        },
      },
      transformations: {
        type: "object",
        properties: {
          fieldMappings: { type: "object" },
          defaultValues: { type: "object" },
        },
      },
    },
  }),
  uiConfig: JSON.stringify({
    icon: "ArrowRight",
    color: "#6B7280",
    connectionType: "none",
  }),
  version: "1.0.0",
  tags: ["passthrough", "transformation", "utility"],
};

// Hard-coded integration nodes array
export const HARDCODED_INTEGRATION_NODES: IntegrationNodeSeed[] = [
  // WordPress nodes
  wordpressCreatePostNode,
  wordpressGetPostsNode,

  // Stripe nodes
  stripeCreateCustomerNode,
  stripeCreatePaymentIntentNode,

  // System nodes
  systemWebhookNode,
  systemOrdersNode,
  systemPassthroughNode,
];

/**
 * Seed hard-coded integrations into the database
 *
 * This function implements the hard-coded seeding phase of our integration
 * seeding strategy. It creates integration nodes based on our current
 * codebase definitions.
 */
export const seedHardcodedIntegrations = internalMutation({
  args: {
    forceReseed: v.optional(v.boolean()),
    environment: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    integrationNodesCreated: v.number(),
    integrationNodesUpdated: v.number(),
    errors: v.array(v.string()),
    summary: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const forceReseed = args.forceReseed ?? false;
    const environment = args.environment ?? "development";
    const batchSize = args.batchSize ?? 10;
    const startTime = Date.now();

    console.log(
      `🌱 Starting hard-coded integration seeding for environment: ${environment}`,
    );

    const result = {
      integrationNodesCreated: 0,
      integrationNodesUpdated: 0,
      errors: [] as string[],
      summary: [] as string[],
    };

    try {
      // Process nodes in batches
      for (let i = 0; i < HARDCODED_INTEGRATION_NODES.length; i += batchSize) {
        const batch = HARDCODED_INTEGRATION_NODES.slice(i, i + batchSize);

        for (const nodeData of batch) {
          try {
            // Check if node already exists
            const existing = await ctx.db
              .query("integrationNodes")
              .withIndex("by_identifier", (q: any) =>
                q.eq("identifier", nodeData.identifier),
              )
              .first();

            if (existing && !forceReseed) {
              result.summary.push(
                `⏭️  Skipped existing node: ${nodeData.identifier}`,
              );
              continue;
            }

            // Prepare node data for insertion
            const nodeRecord = {
              identifier: nodeData.identifier,
              name: nodeData.name,
              category: nodeData.category,
              integrationType: nodeData.integrationType,
              description: nodeData.description,
              inputSchema: nodeData.inputSchema,
              outputSchema: nodeData.outputSchema,
              configSchema: nodeData.configSchema,
              uiConfig: nodeData.uiConfig,
              version: nodeData.version,
              deprecated: nodeData.deprecated ?? false,
              tags: nodeData.tags ?? [],
            };

            if (existing) {
              // Update existing node
              await ctx.db.patch(existing._id, nodeRecord);
              result.integrationNodesUpdated++;
              result.summary.push(
                `🔄 Updated node: ${nodeData.identifier} (v${nodeData.version})`,
              );
            } else {
              // Create new node
              await ctx.db.insert("integrationNodes", nodeRecord);
              result.integrationNodesCreated++;
              result.summary.push(
                `✅ Created node: ${nodeData.identifier} (v${nodeData.version})`,
              );
            }
          } catch (error) {
            const errorMsg = `Failed to process node ${nodeData.identifier}: ${error instanceof Error ? error.message : String(error)}`;
            result.errors.push(errorMsg);
            console.error(errorMsg);
          }
        }
      }

      const duration = Date.now() - startTime;
      const totalProcessed =
        result.integrationNodesCreated + result.integrationNodesUpdated;

      console.log(
        `✅ Hard-coded integration seeding completed in ${duration}ms`,
      );
      console.log(
        `📊 Results: ${result.integrationNodesCreated} created, ${result.integrationNodesUpdated} updated, ${result.errors.length} errors`,
      );

      result.summary.unshift(
        `🎉 Hard-coded seeding completed in ${duration}ms`,
        `📊 Processed ${totalProcessed} integration nodes`,
        `🆕 Created: ${result.integrationNodesCreated}`,
        `🔄 Updated: ${result.integrationNodesUpdated}`,
        `❌ Errors: ${result.errors.length}`,
        "",
      );

      return result;
    } catch (error) {
      const errorMsg = `Hard-coded seeding failed: ${error instanceof Error ? error.message : String(error)}`;
      result.errors.push(errorMsg);
      console.error(errorMsg);

      return result;
    }
  },
});
