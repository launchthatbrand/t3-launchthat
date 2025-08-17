import { integrationsConnectionsSchema } from "./connections/schema";
import { integrationsNodesSchema } from "./integrationNodes/schema";
import { integrationsScenariosSchema } from "./scenarios/schema";

/**
 * Export the complete integrations schema
 */
export const integrationsSchema = {
  ...integrationsScenariosSchema,
  ...integrationsNodesSchema, // This now includes both integrationNodes and scenarioNodes
  ...integrationsConnectionsSchema,
};
