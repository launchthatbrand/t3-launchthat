/**
 * Monday Context Factory
 *
 * Creates rule execution contexts specifically for Monday.com integrations.
 * This factory is responsible for preparing the context object used during
 * rule execution for Monday-specific triggers, conditions, and actions.
 */

import { RuleContext, RuleContextFactory, RuleEvent } from "../../interfaces";

/**
 * Supported Monday.com event types
 */
export type MondayEventType =
  | "create_item"
  | "update_item"
  | "update_column_value"
  | "create_update";

/**
 * Monday.com webhook event structure
 */
export interface MondayEvent extends RuleEvent {
  type: "monday_webhook";
  action: MondayEventType;
  boardId: string;
  itemId?: string;
  columnId?: string;
  columnType?: string;
  value?: unknown;
  userId?: string;
  webhookId: string;
  originalPayload: Record<string, unknown>;
}

/**
 * Monday.com data structure for rule execution
 */
export interface MondayRuleData {
  boardId?: string;
  itemId?: string;
  columnId?: string;
  value?: unknown;
  item?: {
    name?: string;
    groupId?: string;
    columnValues?: Record<string, unknown>;
  };
  user?: {
    id?: string;
    email?: string;
    name?: string;
  };
  [key: string]: unknown;
}

/**
 * Factory for creating Monday.com rule execution contexts
 */
export class MondayContextFactory implements RuleContextFactory {
  /**
   * Create a rule execution context for a Monday.com webhook event
   *
   * @param event The Monday.com webhook event
   * @param ruleId The ID of the rule being executed
   * @param integrationId The ID of the Monday.com integration
   * @returns A rule execution context
   */
  createFromWebhook(
    event: MondayEvent,
    ruleId: string,
    integrationId: string,
  ): RuleContext {
    // Extract relevant data from the webhook event
    const data: MondayRuleData = {
      boardId: event.boardId,
      itemId: event.itemId,
      columnId: event.columnId,
      value: event.value,
    };

    // If there's additional item data in the original payload, extract it
    if (event.originalPayload.item) {
      const item = event.originalPayload.item as Record<string, unknown>;
      data.item = {
        name: item.name as string,
        groupId: item.group_id as string,
        columnValues: item.column_values as Record<string, unknown>,
      };
    }

    // If there's user data in the original payload, extract it
    if (event.originalPayload.user) {
      const user = event.originalPayload.user as Record<string, unknown>;
      data.user = {
        id: user.id as string,
        email: user.email as string,
        name: user.name as string,
      };
    }

    // Create and return the rule context
    return {
      ruleId,
      integrationId,
      integrationType: "monday",
      event,
      data,
      timestamp: Date.now(),
      variables: {},
    };
  }

  /**
   * Create a rule execution context for a manual trigger
   *
   * @param data The Monday.com data for the rule
   * @param ruleId The ID of the rule being executed
   * @param integrationId The ID of the Monday.com integration
   * @param userId Optional ID of the user triggering the rule
   * @returns A rule execution context
   */
  createFromManualTrigger(
    data: MondayRuleData,
    ruleId: string,
    integrationId: string,
    userId?: string,
  ): RuleContext {
    // Create a manual trigger event
    const event: RuleEvent = {
      type: "manual_trigger",
      source: "monday",
      triggeredBy: userId,
      timestamp: Date.now(),
    };

    // Create and return the rule context
    return {
      ruleId,
      integrationId,
      integrationType: "monday",
      event,
      data,
      timestamp: Date.now(),
      variables: {},
    };
  }

  /**
   * Create a rule execution context for a scheduled trigger
   *
   * @param data The Monday.com data for the rule
   * @param ruleId The ID of the rule being executed
   * @param integrationId The ID of the Monday.com integration
   * @returns A rule execution context
   */
  createFromScheduledTrigger(
    data: MondayRuleData,
    ruleId: string,
    integrationId: string,
  ): RuleContext {
    // Create a scheduled trigger event
    const event: RuleEvent = {
      type: "scheduled_trigger",
      source: "monday",
      timestamp: Date.now(),
    };

    // Create and return the rule context
    return {
      ruleId,
      integrationId,
      integrationType: "monday",
      event,
      data,
      timestamp: Date.now(),
      variables: {},
    };
  }
}
