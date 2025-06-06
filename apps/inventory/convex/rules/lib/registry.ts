/**
 * Rule Engine Registry
 *
 * This module provides a registry for managing triggers, conditions, and actions
 * in the rules engine.
 */

import {
  Action,
  ActionFactory,
  Condition,
  ConditionFactory,
  Trigger,
  TriggerFactory,
} from "./interfaces";

/**
 * Registry for the rules engine
 */
export class RuleEngineRegistry {
  private triggers: Map<string, Map<string, TriggerFactory>>;
  private conditions: Map<string, Map<string, ConditionFactory>>;
  private actions: Map<string, Map<string, ActionFactory>>;

  /**
   * Creates a new instance of RuleEngineRegistry
   */
  constructor() {
    this.triggers = new Map<string, Map<string, TriggerFactory>>();
    this.conditions = new Map<string, Map<string, ConditionFactory>>();
    this.actions = new Map<string, Map<string, ActionFactory>>();
  }

  /**
   * Registers an integration with the registry
   * @param integrationId The ID of the integration
   */
  registerIntegration(integrationId: string): void {
    if (!this.triggers.has(integrationId)) {
      this.triggers.set(integrationId, new Map<string, TriggerFactory>());
    }
    if (!this.conditions.has(integrationId)) {
      this.conditions.set(integrationId, new Map<string, ConditionFactory>());
    }
    if (!this.actions.has(integrationId)) {
      this.actions.set(integrationId, new Map<string, ActionFactory>());
    }
  }

  /**
   * Registers a trigger factory with the registry
   * @param integrationId The ID of the integration
   * @param triggerType The type of the trigger
   * @param factory The factory function for creating triggers
   */
  registerTrigger(
    integrationId: string,
    triggerType: string,
    factory: TriggerFactory,
  ): void {
    this.registerIntegration(integrationId);
    const triggerMap = this.triggers.get(integrationId);
    if (triggerMap) {
      triggerMap.set(triggerType, factory);
    }
  }

  /**
   * Registers a condition factory with the registry
   * @param integrationId The ID of the integration
   * @param conditionType The type of the condition
   * @param factory The factory function for creating conditions
   */
  registerCondition(
    integrationId: string,
    conditionType: string,
    factory: ConditionFactory,
  ): void {
    this.registerIntegration(integrationId);
    const conditionMap = this.conditions.get(integrationId);
    if (conditionMap) {
      conditionMap.set(conditionType, factory);
    }
  }

  /**
   * Registers an action factory with the registry
   * @param integrationId The ID of the integration
   * @param actionType The type of the action
   * @param factory The factory function for creating actions
   */
  registerAction(
    integrationId: string,
    actionType: string,
    factory: ActionFactory,
  ): void {
    this.registerIntegration(integrationId);
    const actionMap = this.actions.get(integrationId);
    if (actionMap) {
      actionMap.set(actionType, factory);
    }
  }

  /**
   * Creates a trigger instance
   * @param integrationId The ID of the integration
   * @param triggerType The type of the trigger
   * @param config The configuration for the trigger
   * @returns A new trigger instance
   */
  createTrigger(
    integrationId: string,
    triggerType: string,
    config: Record<string, unknown>,
  ): Trigger {
    const integrationTriggers = this.triggers.get(integrationId);
    if (!integrationTriggers) {
      throw new Error(`Integration ${integrationId} not registered`);
    }

    const factory = integrationTriggers.get(triggerType);
    if (!factory) {
      throw new Error(
        `Trigger type ${triggerType} not registered for integration ${integrationId}`,
      );
    }

    return factory(config);
  }

  /**
   * Creates a condition instance
   * @param integrationId The ID of the integration
   * @param conditionType The type of the condition
   * @param config The configuration for the condition
   * @returns A new condition instance
   */
  createCondition(
    integrationId: string,
    conditionType: string,
    config: Record<string, unknown>,
  ): Condition {
    const integrationConditions = this.conditions.get(integrationId);
    if (!integrationConditions) {
      throw new Error(`Integration ${integrationId} not registered`);
    }

    const factory = integrationConditions.get(conditionType);
    if (!factory) {
      throw new Error(
        `Condition type ${conditionType} not registered for integration ${integrationId}`,
      );
    }

    return factory(config);
  }

  /**
   * Creates an action instance
   * @param integrationId The ID of the integration
   * @param actionType The type of the action
   * @param config The configuration for the action
   * @returns A new action instance
   */
  createAction(
    integrationId: string,
    actionType: string,
    config: Record<string, unknown>,
  ): Action {
    const integrationActions = this.actions.get(integrationId);
    if (!integrationActions) {
      throw new Error(`Integration ${integrationId} not registered`);
    }

    const factory = integrationActions.get(actionType);
    if (!factory) {
      throw new Error(
        `Action type ${actionType} not registered for integration ${integrationId}`,
      );
    }

    return factory(config);
  }

  /**
   * Gets all registered triggers for an integration
   * @param integrationId The ID of the integration
   * @returns A map of trigger types to factories
   */
  getTriggers(integrationId: string): Map<string, TriggerFactory> | undefined {
    return this.triggers.get(integrationId);
  }

  /**
   * Gets all registered conditions for an integration
   * @param integrationId The ID of the integration
   * @returns A map of condition types to factories
   */
  getConditions(
    integrationId: string,
  ): Map<string, ConditionFactory> | undefined {
    return this.conditions.get(integrationId);
  }

  /**
   * Gets all registered actions for an integration
   * @param integrationId The ID of the integration
   * @returns A map of action types to factories
   */
  getActions(integrationId: string): Map<string, ActionFactory> | undefined {
    return this.actions.get(integrationId);
  }

  /**
   * Checks if an integration is registered
   * @param integrationId The ID of the integration
   * @returns True if the integration is registered, false otherwise
   */
  hasIntegration(integrationId: string): boolean {
    return this.triggers.has(integrationId);
  }

  /**
   * Gets all registered integration IDs
   * @returns An array of integration IDs
   */
  getIntegrationIds(): string[] {
    return Array.from(this.triggers.keys());
  }
}
