import { integrationsAppsSchema } from "./apps/schema";
import { integrationsConnectionsSchema } from "./connections/schema";
import { integrationsNodesSchema } from "./nodes/schema";
import { integrationsScenarioLogsSchema } from "./scenarioLogs/schema";
import { integrationsScenarioRunsSchema } from "./scenarioRuns/schema";
import { integrationsScenariosSchema } from "./scenarios/schema";

/**
 * Export the complete integrations schema
 */
export const integrationsSchema = {
  ...integrationsScenariosSchema,
  ...integrationsNodesSchema,
  ...integrationsAppsSchema,
  ...integrationsConnectionsSchema,
  ...integrationsScenarioRunsSchema,
  ...integrationsScenarioLogsSchema,
};
