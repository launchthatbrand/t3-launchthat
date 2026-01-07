import { ConvexHttpClient } from "convex/browser";

import { internal } from "../convex/_generated/api";
import { createMediaItem } from "../src/integrations/nodes/external/wordpress/actions/createMediaItem";
// Import your integration node definitions
import { createPost } from "../src/integrations/nodes/external/wordpress/actions/createPost";

// You'll add more imports as you create them
// import { stripeCreateCharge } from "../src/integrations/nodes/external/stripe/actions/createCharge";
// import { systemOrders } from "../src/integrations/nodes/system/orders";

// Configuration
const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error("CONVEX_URL environment variable is required");
}

// Function to convert your action definitions to database format
function convertActionToNodeDefinition(
  action: any,
  integrationType: string,
  category = "action",
) {
  return {
    identifier: `${integrationType}_${action.id}`,
    name: action.name,
    category,
    integrationType,
    description: action.description,
    inputSchema: JSON.stringify(action.inputSchema),
    outputSchema: JSON.stringify(action.outputSchema),
    configSchema: JSON.stringify({}), // Add config schema if needed
    uiConfig: action.ui ? JSON.stringify(action.ui) : undefined,
    version: "1.0.0", // You can make this dynamic
    deprecated: false,
    tags: [integrationType, category],
  };
}

// Define your node definitions
const nodeDefinitions = [
  // WordPress Actions
  convertActionToNodeDefinition(createPost, "wordpress", "action"),
  convertActionToNodeDefinition(createMediaItem, "wordpress", "action"),

  // Add more as you create them:
  // convertActionToNodeDefinition(stripeCreateCharge, "stripe", "action"),
  // convertActionToNodeDefinition(systemOrders, "system", "transformer"),
];

async function seedNodes() {
  const client = new ConvexHttpClient(CONVEX_URL);

  console.log("🌱 Seeding integration nodes...");
  console.log(`Found ${nodeDefinitions.length} node definitions`);

  try {
    const result = await client.mutation(
      internal.integrations.nodes.seed.seedIntegrationNodes,
      {
        nodes: nodeDefinitions,
      },
    );

    console.log("✅ Seeding completed:");
    console.log(`  - Created: ${result.created} nodes`);
    console.log(`  - Updated: ${result.updated} nodes`);

    if (result.errors.length > 0) {
      console.log("❌ Errors:");
      result.errors.forEach((error) => console.log(`  - ${error}`));
    }

    return result;
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedNodes()
    .then(() => {
      console.log("🎉 Seeding completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}

export { seedNodes };
