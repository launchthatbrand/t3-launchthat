import { v } from "convex/values";

import { api } from "../_generated/api";
import { internalAction } from "../_generated/server";

/**
 * Import-based Integration Seeding
 *
 * This approach imports TypeScript integration definitions directly
 * from the src/integrations directory and converts them to database seeds.
 *
 * This is superior to file scanning because:
 * - Uses existing TypeScript definitions
 * - Maintains type safety
 * - No file system access needed
 * - Leverages existing connection definitions
 */

// WordPress Integration Definition (imported structure)
const WordPressIntegration = {
  metadata: {
    id: "wordpress",
    name: "WordPress",
    description: "Interact with WordPress sites via REST API",
    version: "1.0.0",
    type: "external" as const,
    category: "cms",
    icon: "FileText",
    color: "#21759B",
    author: "Integration Team",
    keywords: ["wordpress", "cms", "blog", "content"],
    tags: ["popular", "cms"],
  },
  connections: [
    {
      id: "wordpress-basic-auth",
      name: "WordPress (Basic Auth)",
      type: "basic_auth",
      authSchema: {
        type: "object",
        properties: {
          baseUrl: {
            type: "string",
            format: "uri",
            description: "WordPress site URL (e.g., https://example.com)",
          },
          username: {
            type: "string",
            description: "WordPress username",
          },
          password: {
            type: "string",
            description: "WordPress application password",
          },
        },
        required: ["baseUrl", "username", "password"],
      },
    },
  ],
  nodes: [
    {
      id: "create_post",
      name: "Create WordPress Post",
      description: "Create a new post in WordPress",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Post title" },
          content: { type: "string", description: "Post content (HTML)" },
          status: {
            type: "string",
            enum: ["draft", "publish", "private"],
            default: "draft",
            description: "Post status",
          },
          excerpt: { type: "string", description: "Post excerpt" },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Post tags",
          },
          categories: {
            type: "array",
            items: { type: "string" },
            description: "Post categories",
          },
        },
        required: ["title", "content"],
      },
      outputSchema: {
        type: "object",
        properties: {
          id: { type: "number", description: "WordPress post ID" },
          link: { type: "string", description: "Post URL" },
          status: { type: "string", description: "Post status" },
          title: { type: "string", description: "Post title" },
          date: { type: "string", description: "Publication date" },
        },
      },
      configSchema: {
        type: "object",
        properties: {
          connectionId: {
            type: "string",
            description: "WordPress connection to use",
          },
          defaultStatus: {
            type: "string",
            enum: ["draft", "publish"],
            default: "draft",
            description: "Default post status",
          },
        },
        required: ["connectionId"],
      },
    },
    {
      id: "get_posts",
      name: "Get WordPress Posts",
      description: "Retrieve posts from WordPress",
      inputSchema: {
        type: "object",
        properties: {
          per_page: {
            type: "number",
            default: 10,
            minimum: 1,
            maximum: 100,
            description: "Number of posts to retrieve",
          },
          page: {
            type: "number",
            default: 1,
            minimum: 1,
            description: "Page number",
          },
          status: {
            type: "string",
            enum: ["publish", "draft", "private", "any"],
            default: "publish",
            description: "Post status filter",
          },
          search: {
            type: "string",
            description: "Search term",
          },
          author: {
            type: "number",
            description: "Author ID filter",
          },
          categories: {
            type: "array",
            items: { type: "number" },
            description: "Category ID filters",
          },
          tags: {
            type: "array",
            items: { type: "number" },
            description: "Tag ID filters",
          },
        },
      },
      outputSchema: {
        type: "object",
        properties: {
          posts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                title: { type: "string" },
                content: { type: "string" },
                excerpt: { type: "string" },
                status: { type: "string" },
                date: { type: "string" },
                link: { type: "string" },
                author: { type: "number" },
                categories: { type: "array", items: { type: "number" } },
                tags: { type: "array", items: { type: "number" } },
              },
            },
          },
          totalPages: { type: "number" },
          totalPosts: { type: "number" },
        },
      },
      configSchema: {
        type: "object",
        properties: {
          connectionId: {
            type: "string",
            description: "WordPress connection to use",
          },
        },
        required: ["connectionId"],
      },
    },
  ],
};

// Stripe Integration Definition (placeholder for future expansion)
const StripeIntegration = {
  metadata: {
    id: "stripe",
    name: "Stripe",
    description: "Process payments and manage customers with Stripe",
    version: "1.0.0",
    type: "external" as const,
    category: "payment",
    icon: "CreditCard",
    color: "#635BFF",
    author: "Integration Team",
    keywords: ["stripe", "payment", "billing", "subscriptions"],
    tags: ["popular", "payment"],
  },
  connections: [
    {
      id: "stripe-api-key",
      name: "Stripe API Key",
      type: "api_key",
      authSchema: {
        type: "object",
        properties: {
          apiKey: {
            type: "string",
            description: "Stripe secret key (starts with sk_)",
          },
          publishableKey: {
            type: "string",
            description: "Stripe publishable key (starts with pk_)",
          },
        },
        required: ["apiKey"],
      },
    },
  ],
  nodes: [
    {
      id: "create_customer",
      name: "Create Stripe Customer",
      description: "Create a new customer in Stripe",
      inputSchema: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          name: { type: "string" },
          phone: { type: "string" },
          description: { type: "string" },
          metadata: { type: "object" },
        },
        required: ["email"],
      },
      outputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string" },
          name: { type: "string" },
          created: { type: "number" },
        },
      },
      configSchema: {
        type: "object",
        properties: {
          connectionId: { type: "string" },
        },
        required: ["connectionId"],
      },
    },
    {
      id: "create_payment_intent",
      name: "Create Payment Intent",
      description: "Create a payment intent in Stripe",
      inputSchema: {
        type: "object",
        properties: {
          amount: { type: "number", minimum: 1 },
          currency: { type: "string", default: "usd" },
          customer: { type: "string" },
          description: { type: "string" },
          metadata: { type: "object" },
        },
        required: ["amount"],
      },
      outputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          client_secret: { type: "string" },
          amount: { type: "number" },
          currency: { type: "string" },
          status: { type: "string" },
        },
      },
      configSchema: {
        type: "object",
        properties: {
          connectionId: { type: "string" },
        },
        required: ["connectionId"],
      },
    },
  ],
};

// Available integrations registry
const AVAILABLE_INTEGRATIONS = [WordPressIntegration, StripeIntegration];

/**
 * Convert integration definition to integration node seeds
 */
function convertIntegrationToSeeds(integration: typeof WordPressIntegration) {
  return integration.nodes.map((node) => ({
    identifier: `external.${integration.metadata.id}.${node.id}`,
    name: node.name,
    category: integration.metadata.category,
    integrationType: integration.metadata.type,
    description: node.description,
    inputSchema: JSON.stringify(node.inputSchema),
    outputSchema: JSON.stringify(node.outputSchema),
    configSchema: JSON.stringify(node.configSchema),
    uiConfig: JSON.stringify({
      icon: integration.metadata.icon,
      color: integration.metadata.color,
      category: integration.metadata.category,
    }),
    version: integration.metadata.version,
    deprecated: false,
    tags: integration.metadata.tags,
  }));
}

/**
 * Seed integration nodes from TypeScript definitions
 */
export const seedFromTypeScriptDefinitions = internalAction({
  args: {
    integrationIds: v.optional(v.array(v.string())),
    forceUpdate: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    totalIntegrations: v.number(),
    totalNodes: v.number(),
    created: v.number(),
    updated: v.number(),
    skipped: v.number(),
    errors: v.array(v.string()),
    duration: v.number(),
  }),
  handler: async (ctx, args) => {
    const startTime = Date.now();
    console.log("🔄 Starting import-based integration seeding...");

    const result = {
      success: false,
      totalIntegrations: 0,
      totalNodes: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
      duration: 0,
    };

    try {
      // Filter integrations if specific IDs are requested
      const integrationsToProcess = args.integrationIds
        ? AVAILABLE_INTEGRATIONS.filter((integration) =>
            args.integrationIds!.includes(integration.metadata.id),
          )
        : AVAILABLE_INTEGRATIONS;

      result.totalIntegrations = integrationsToProcess.length;

      for (const integration of integrationsToProcess) {
        console.log(`📦 Processing integration: ${integration.metadata.name}`);

        try {
          const nodeSeeds = convertIntegrationToSeeds(integration);
          result.totalNodes += nodeSeeds.length;

          for (const nodeSeed of nodeSeeds) {
            try {
              // Check if node already exists
              const existing = await ctx.runQuery(
                api.integrations.integrationNodes.queries
                  .getIntegrationNodeByIdentifier,
                { identifier: nodeSeed.identifier },
              );

              if (existing && !args.forceUpdate) {
                // Skip if exists and no force update
                result.skipped++;
                console.log(
                  `  ⏭️  Skipped: ${nodeSeed.identifier} (already exists)`,
                );
              } else if (existing && args.forceUpdate) {
                // Update existing node
                await ctx.runMutation(
                  api.integrations.integrationNodes.mutations
                    .updateIntegrationNode,
                  {
                    id: existing._id,
                    data: {
                      ...nodeSeed,
                      createdAt: existing.createdAt,
                      updatedAt: Date.now(),
                    },
                  },
                );
                result.updated++;
                console.log(`  ✅ Updated: ${nodeSeed.identifier}`);
              } else {
                // Create new node
                const now = Date.now();
                await ctx.runMutation(
                  api.integrations.integrationNodes.mutations
                    .createIntegrationNode,
                  {
                    data: {
                      ...nodeSeed,
                      createdAt: now,
                      updatedAt: now,
                    },
                  },
                );
                result.created++;
                console.log(`  ✅ Created: ${nodeSeed.identifier}`);
              }
            } catch (error) {
              const errorMessage = `Failed to process node ${nodeSeed.identifier}: ${
                error instanceof Error ? error.message : String(error)
              }`;
              result.errors.push(errorMessage);
              console.error(`  ❌ ${errorMessage}`);
            }
          }
        } catch (error) {
          const errorMessage = `Failed to process integration ${integration.metadata.id}: ${
            error instanceof Error ? error.message : String(error)
          }`;
          result.errors.push(errorMessage);
          console.error(`❌ ${errorMessage}`);
        }
      }

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;

      console.log(`✅ Import-based seeding completed in ${result.duration}ms`);
      console.log(
        `📊 Results: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
      );

      if (result.errors.length > 0) {
        console.log(`⚠️  Errors encountered: ${result.errors.length}`);
      }

      return result;
    } catch (error) {
      result.duration = Date.now() - startTime;
      result.success = false;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      console.error(`❌ Import-based seeding failed: ${errorMessage}`);
      return result;
    }
  },
});

/**
 * Get available integrations for import
 */
export const getAvailableIntegrations = internalAction({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      description: v.string(),
      version: v.string(),
      type: v.string(),
      category: v.string(),
      nodeCount: v.number(),
      tags: v.array(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    return AVAILABLE_INTEGRATIONS.map((integration) => ({
      id: integration.metadata.id,
      name: integration.metadata.name,
      description: integration.metadata.description,
      version: integration.metadata.version,
      type: integration.metadata.type,
      category: integration.metadata.category,
      nodeCount: integration.nodes.length,
      tags: integration.metadata.tags || [],
    }));
  },
});

/**
 * Preview what would be imported without actually importing
 */
export const previewImport = internalAction({
  args: {
    integrationIds: v.optional(v.array(v.string())),
  },
  returns: v.array(
    v.object({
      identifier: v.string(),
      name: v.string(),
      category: v.string(),
      integrationType: v.string(),
      description: v.string(),
      version: v.string(),
      tags: v.array(v.string()),
      existsInDatabase: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const integrationsToProcess = args.integrationIds
      ? AVAILABLE_INTEGRATIONS.filter((integration) =>
          args.integrationIds!.includes(integration.metadata.id),
        )
      : AVAILABLE_INTEGRATIONS;

    const preview = [];

    for (const integration of integrationsToProcess) {
      const nodeSeeds = convertIntegrationToSeeds(integration);

      for (const nodeSeed of nodeSeeds) {
        // Check if exists in database
        const existing = await ctx.runQuery(
          api.integrations.integrationNodes.queries
            .getIntegrationNodeByIdentifier,
          { identifier: nodeSeed.identifier },
        );

        preview.push({
          identifier: nodeSeed.identifier,
          name: nodeSeed.name,
          category: nodeSeed.category,
          integrationType: nodeSeed.integrationType,
          description: nodeSeed.description,
          version: nodeSeed.version,
          tags: nodeSeed.tags || [],
          existsInDatabase: !!existing,
        });
      }
    }

    return preview;
  },
});
