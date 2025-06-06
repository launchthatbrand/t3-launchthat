/**
 * Integration Plugins Registration
 *
 * This module registers all available integration plugins with the rule engine.
 * Each integration plugin implements the IntegrationPlugin interface and provides
 * specific triggers, conditions, and actions for that integration type.
 */

import { RuleEngineRegistry } from "../registry";
import { MondayIntegrationPlugin } from "./adapters/monday";
import { IntegrationRegistry } from "./registry";

/**
 * Registers all available integration plugins with the integration registry
 * @param registry The integration registry to register the plugins with
 */
export function registerIntegrationPlugins(
  registry: IntegrationRegistry,
): void {
  // Register the Monday.com integration plugin
  const mondayPlugin = new MondayIntegrationPlugin();
  registry.registerPlugin(mondayPlugin);

  // Add additional integration plugins here as they are developed
  // e.g., registry.registerPlugin(new SlackIntegrationPlugin());
}

/**
 * Creates and returns a fully initialized integration registry with all plugins registered
 * @returns An integration registry with all plugins registered
 */
export function createPluginRegistry(): IntegrationRegistry {
  const ruleRegistry = new RuleEngineRegistry();
  const registry = new IntegrationRegistry(ruleRegistry);
  registerIntegrationPlugins(registry);
  return registry;
}
