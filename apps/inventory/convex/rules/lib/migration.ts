/**
 * Rules Migration Utilities
 *
 * This module provides utilities for migrating existing rules to the new
 * generic rules engine format.
 */

import { Id } from "../../_generated/dataModel";
import { Rule } from "./interfaces";

/**
 * Type definition for old Monday sync rule
 */
export interface OldMondaySyncRule {
  _id: Id<"mondaySyncRules">;
  _creationTime: number;
  name: string;
  description?: string;
  isEnabled: boolean;
  integrationId: Id<"mondayIntegration">;
  triggerTable: string;
  triggerType: string;
  triggerField?: string;
  triggerValue?: unknown;
  conditions?: string; // JSON string containing conditions
  actions?: string; // JSON string containing actions
  lastExecuted?: number;
  executionCount?: number;
  cooldownMs?: number;
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
  metadata?: string; // JSON string containing metadata
}

/**
 * Maps the old Monday trigger type to the new format
 * @param triggerType Old trigger type
 * @returns New trigger type
 */
function mapOldTriggerType(triggerType: string): string {
  switch (triggerType) {
    case "onCreate":
      return "monday_item_created";
    case "onUpdate":
      return "monday_item_updated";
    case "onStatusChange":
      return "monday_status_changed";
    case "onFieldValue":
      return "monday_field_value_is";
    case "onCheckout":
      return "monday_checkout";
    case "onManualTrigger":
      return "monday_manual_trigger";
    case "onSchedule":
      return "monday_scheduled";
    default:
      return `monday_${triggerType}`;
  }
}

/**
 * Maps the old Monday trigger config to the new format
 * @param oldRule Old Monday rule
 * @returns New trigger config
 */
function mapOldTriggerConfig(
  oldRule: OldMondaySyncRule,
): Record<string, unknown> {
  switch (oldRule.triggerType) {
    case "onCreate":
    case "onUpdate":
      return {
        boardId: oldRule.triggerField ?? undefined,
      };
    case "onStatusChange":
      return {
        boardId: oldRule.triggerField ?? undefined,
        toStatus: oldRule.triggerValue ?? undefined,
      };
    case "onFieldValue":
      return {
        boardId: undefined,
        fieldId: oldRule.triggerField ?? undefined,
        value: oldRule.triggerValue ?? undefined,
      };
    case "onSchedule":
      return {
        interval: oldRule.triggerValue ?? "daily",
      };
    default:
      return {};
  }
}

/**
 * Maps the old Monday condition type to the new format
 * @param oldType Old condition type
 * @returns New condition type
 */
function mapOldConditionType(oldType: string): string {
  switch (oldType) {
    case "board":
      return "monday_board_is";
    case "columnValue":
      return "monday_column_value_is";
    case "group":
      return "monday_group_is";
    default:
      return `monday_${oldType}`;
  }
}

/**
 * Maps the old Monday condition config to the new format
 * @param oldCondition Old condition
 * @returns New condition config
 */
function mapOldConditionConfig(
  oldCondition: Record<string, unknown>,
): Record<string, unknown> {
  switch (oldCondition.type) {
    case "board":
      return {
        boardId: oldCondition.boardId ?? undefined,
      };
    case "columnValue":
      return {
        columnId: oldCondition.columnId ?? undefined,
        value: oldCondition.value ?? undefined,
      };
    case "group":
      return {
        groupId: oldCondition.groupId ?? undefined,
      };
    default:
      return {};
  }
}

/**
 * Maps the old Monday action type to the new format
 * @param oldType Old action type
 * @returns New action type
 */
function mapOldActionType(oldType: string): string {
  switch (oldType) {
    case "createItem":
      return "monday_create_item";
    case "updateItem":
      return "monday_update_item";
    case "changeStatus":
      return "monday_change_status";
    default:
      return `monday_${oldType}`;
  }
}

/**
 * Maps the old Monday action config to the new format
 * @param oldAction Old action
 * @returns New action config
 */
function mapOldActionConfig(
  oldAction: Record<string, unknown>,
): Record<string, unknown> {
  switch (oldAction.type) {
    case "createItem":
      return {
        boardId: oldAction.boardId ?? undefined,
        groupId: oldAction.groupId ?? undefined,
        itemName: oldAction.itemName ?? undefined,
        columnValues: oldAction.columnValues ?? {},
      };
    case "updateItem":
      return {
        itemId: oldAction.itemId ?? undefined,
        columnValues: oldAction.columnValues ?? {},
      };
    case "changeStatus":
      return {
        itemId: oldAction.itemId ?? undefined,
        columnId: oldAction.columnId ?? undefined,
        status: oldAction.value ?? undefined,
      };
    default:
      return {};
  }
}

/**
 * Parse a JSON string safely
 * @param json JSON string
 * @param defaultValue Default value if JSON is invalid
 * @returns Parsed JSON or default value
 */
function safeParseJson<T>(json: string | undefined, defaultValue: T): T {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return defaultValue;
  }
}

/**
 * Migrate a Monday sync rule to the new format
 * @param oldRule Old Monday sync rule
 * @param integrationName Name of the Monday integration
 * @returns New rule in the generic format
 */
export function migrateMondayRule(
  oldRule: OldMondaySyncRule,
  integrationName = "Monday.com",
): Rule {
  // Map old trigger to new format
  const triggerType = mapOldTriggerType(oldRule.triggerType);
  const triggerConfig = mapOldTriggerConfig(oldRule);

  // Parse conditions from JSON string
  const oldConditions = safeParseJson<Record<string, unknown>[]>(
    oldRule.conditions ?? "[]",
    [],
  );

  // Map old conditions to new format
  const conditions = oldConditions.map((oldCondition) => ({
    type: mapOldConditionType(oldCondition.type as string),
    config: mapOldConditionConfig(oldCondition),
  }));

  // Parse actions from JSON string
  const oldActions = safeParseJson<Record<string, unknown>[]>(
    oldRule.actions ?? "[]",
    [],
  );

  // Map old actions to new format
  const actions = oldActions.map((oldAction) => ({
    type: mapOldActionType(oldAction.type as string),
    config: mapOldActionConfig(oldAction),
  }));

  // Parse metadata from JSON string
  const metadata = safeParseJson<Record<string, unknown>>(
    oldRule.metadata ?? "{}",
    {},
  );

  // Create new rule
  return {
    id: oldRule._id as unknown as string,
    name: oldRule.name,
    description: oldRule.description ?? "",
    enabled: oldRule.isEnabled,
    priority: 5, // Default priority
    integrationId: oldRule.integrationId as unknown as string,
    integrationName,
    triggerType,
    triggerConfig,
    conditions,
    actions,
    cooldownMs: oldRule.cooldownMs,
    lastExecuted: oldRule.lastExecuted,
    executionCount: oldRule.executionCount,
    createdAt: oldRule.createdAt ?? oldRule._creationTime,
    updatedAt: oldRule.updatedAt ?? oldRule._creationTime,
    createdBy: oldRule.createdBy,
    metadata: {
      ...metadata,
      originalMondayRuleId: oldRule._id,
      migrationDate: Date.now(),
    },
  };
}

/**
 * Interface describing the minimal structure we need from the database query
 * This avoids having to use "any" types with the db object
 */
interface DbReader {
  query: (tableName: string) => {
    collect: () => Promise<OldMondaySyncRule[]>;
  };
}

/**
 * Migrate all Monday sync rules
 * @param db Database reader
 * @param integrationId ID of the Monday integration in the new system
 * @param integrationName Name of the Monday integration
 * @returns Array of migrated rules
 */
export async function migrateAllMondayRules(
  db: DbReader,
  integrationId: string,
  integrationName = "Monday.com",
): Promise<Rule[]> {
  // This is a simplified example - in a real implementation, we would need to handle
  // the actual database query logic according to Convex patterns
  try {
    // Query the mondaySyncRules table
    const oldRules = await db.query("mondaySyncRules").collect();

    // Migrate each rule
    return oldRules.map((oldRule) => {
      const rule = migrateMondayRule(oldRule, integrationName);
      // Override the integrationId with the new one
      rule.integrationId = integrationId;
      return rule;
    });
  } catch (error) {
    console.error("Error migrating Monday rules:", error);
    return [];
  }
}
