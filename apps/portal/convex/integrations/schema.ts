import { integrationsNodesSchema } from "./nodes/schema";
import { integrationsScenariosSchema } from "./scenarios/schema";

/**
 * Export the complete integrations schema
 */
export const integrationsSchema = {
  ...integrationsScenariosSchema,
  ...integrationsNodesSchema,
};
