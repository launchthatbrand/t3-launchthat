/**
 * Integration Registry
 *
 * This module provides a registry for managing integration plugins
 * in the rules engine.
 */

import { JSONSchema7 } from "json-schema";

import { ActionFactory, ConditionFactory, TriggerFactory } from "../interfaces";
import { RuleEngineRegistry } from "../registry";
import { IntegrationPlugin } from "./plugin";

/**
 * Definition of a trigger
 */
export interface TriggerDefinition {
  type: string;
  name: string;
  description: string;
  configSchema: JSONSchema7;
  factory: TriggerFactory;
}

/**
 * Definition of a condition
 */
export interface ConditionDefinition {
  type: string;
  name: string;
  description: string;
  configSchema: JSONSchema7;
  factory: ConditionFactory;
}

/**
 * Definition of an action
 */
export interface ActionDefinition {
  type: string;
  name: string;
  description: string;
  configSchema: JSONSchema7;
  factory: ActionFactory;
}

/**
 * Definition of an integration
 */
export interface IntegrationDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  triggers: TriggerDefinition[];
  conditions: ConditionDefinition[];
  actions: ActionDefinition[];
  metadata?: {
    configSchema?: JSONSchema7;
    [key: string]: unknown;
  };
}

/**
 * Registry for managing integration plugins
 */
export class IntegrationRegistry {
  private registry: RuleEngineRegistry;
  private definitions: Map<string, IntegrationDefinition>;

  /**
   * Creates a new instance of IntegrationRegistry
   * @param registry The rule engine registry to use
   */
  constructor(registry: RuleEngineRegistry) {
    this.registry = registry;
    this.definitions = new Map<string, IntegrationDefinition>();
  }

  /**
   * Registers an integration plugin
   * @param plugin The integration plugin to register
   */
  registerPlugin(plugin: IntegrationPlugin): void {
    // Get the integration definition from the plugin
    const definition = plugin.getDefinition();
    const integrationId = definition.id;

    // Store the definition
    this.definitions.set(integrationId, definition);

    // Register the integration with the rule engine registry
    this.registry.registerIntegration(integrationId);

    // Register all triggers
    for (const trigger of definition.triggers) {
      this.registry.registerTrigger(
        integrationId,
        trigger.type,
        trigger.factory,
      );
    }

    // Register all conditions
    for (const condition of definition.conditions) {
      this.registry.registerCondition(
        integrationId,
        condition.type,
        condition.factory,
      );
    }

    // Register all actions
    for (const action of definition.actions) {
      this.registry.registerAction(integrationId, action.type, action.factory);
    }
  }

  /**
   * Gets an integration definition by ID
   * @param integrationId The ID of the integration
   * @returns The integration definition, or undefined if not found
   */
  getIntegrationDefinition(
    integrationId: string,
  ): IntegrationDefinition | undefined {
    return this.definitions.get(integrationId);
  }

  /**
   * Gets all registered integration definitions
   * @returns An array of integration definitions
   */
  getAllIntegrationDefinitions(): IntegrationDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Gets all registered integration IDs
   * @returns An array of integration IDs
   */
  getIntegrationIds(): string[] {
    return Array.from(this.definitions.keys());
  }

  /**
   * Checks if an integration is registered
   * @param integrationId The ID of the integration
   * @returns True if the integration is registered, false otherwise
   */
  hasIntegration(integrationId: string): boolean {
    return this.definitions.has(integrationId);
  }
}
