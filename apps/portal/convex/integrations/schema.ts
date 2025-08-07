/**
 * Combined schema definition for the Integrations module
 */
import { defineSchema } from "convex/server";

import {
  appsTable,
  automationLogsTable,
  connectionsTable,
  nodeConnectionsTable,
  nodesTable,
  scenariosTable,
} from "./schema/index";

/**
 * Export the complete integrations schema
 */
export default defineSchema({
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
});
