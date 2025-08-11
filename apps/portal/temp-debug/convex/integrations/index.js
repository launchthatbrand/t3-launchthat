// Export modules - using namespaced exports to avoid name conflicts
import * as AppsModule from "./apps";
import * as AutomationLogsModule from "./automationLogs";
import * as ConnectionsModule from "./connections";
import * as NodesModule from "./nodes";
import * as ScenariosModule from "./scenarios";
/**
 * Integrations module for Portal
 *
 * This module provides functionality for connecting to external services,
 * importing data, and creating automation scenarios.
 */
// Export schema
export * from "./schema";
export const apps = AppsModule;
export const automationLogs = AutomationLogsModule;
export const connections = ConnectionsModule;
export const scenarios = ScenariosModule;
export const nodes = NodesModule;
