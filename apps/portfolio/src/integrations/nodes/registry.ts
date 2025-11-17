import {
  registerExternalNode,
  registerSystemNode,
} from "@acme/integration-sdk";

// External nodes
import {
  wordpressConnectionDefinition,
  wordpressNodeDefinition,
} from "./external/wordpress/definition.js";
// System nodes
import { webhookNodeDefinition } from "./system/webhook/definition.js";

// Register all nodes
export function registerAllNodes() {
  // Register system nodes
  registerSystemNode(webhookNodeDefinition);

  // Register external nodes with their connections
  registerExternalNode(wordpressNodeDefinition, [
    wordpressConnectionDefinition,
  ]);

  console.log("All integration nodes registered successfully");
}

// Auto-register on import in development
if (process.env.NODE_ENV === "development") {
  registerAllNodes();
}
