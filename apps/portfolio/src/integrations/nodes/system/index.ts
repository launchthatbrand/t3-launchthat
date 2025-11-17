import { ordersNodeDefinition } from "./orders/definition.js";
import { passthroughNodeDefinition } from "./passthrough/definition.js";
// Import for local usage
import { webhookNodeDefinition } from "./webhook/definition.js";

// System node definitions
export { webhookNodeDefinition } from "./webhook/definition.js";
export { ordersNodeDefinition } from "./orders/definition.js";
export { passthroughNodeDefinition } from "./passthrough/definition.js";

// Export all system nodes as an array for easy registration
export const systemNodes = [
  webhookNodeDefinition,
  ordersNodeDefinition,
  passthroughNodeDefinition,
];

// System node registry helper
export function registerSystemNodes() {
  // This would integrate with the main registry
  console.log(
    `Registering ${systemNodes.length} system nodes:`,
    systemNodes.map((node) => node.metadata.id),
  );

  return systemNodes;
}
