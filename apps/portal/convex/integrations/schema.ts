import { integrationsConnectionsSchema } from "./connections/schema";
import { integrationsNodesSchema } from "./integrationNodes/schema";

/**
 * Export the complete integrations schema
 */
export const integrationsSchema = {
  ...integrationsNodesSchema, // This now includes both integrationNodes and scenarioNodes
  ...integrationsConnectionsSchema,
};
