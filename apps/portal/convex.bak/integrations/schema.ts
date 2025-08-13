import { appsTable } from "./apps/schema";
import { automationLogsTable } from "./automationLogs/schema";
import { connectionsTable } from "./connections/schema";
import { nodeConnectionsTable, nodesTable } from "./nodes/schema";
import { scenariosTable } from "./scenarios/schema";

/**
 * Export the complete integrations schema
 */
export const integrationsSchema = {
  tables: {
    // Apps table
    apps: appsTable,

    // Connections table
    connections: connectionsTable,

    // Scenarios table
    scenarios: scenariosTable,

    // Nodes tables
    nodes: nodesTable,
    nodeConnections: nodeConnectionsTable,

    // Automation logs table
    automationLogs: automationLogsTable,
  },
};
