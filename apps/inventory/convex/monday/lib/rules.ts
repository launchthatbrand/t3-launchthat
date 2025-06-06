/**
 * Monday.com Sync Rules Engine
 *
 * This module provides functions for defining, executing, and managing
 * event-based synchronization rules for the Monday.com integration.
 */

import {
  ActionConfig,
  ActionType,
  ComplexCondition,
  FieldCondition,
  MondayBoardMapping,
  MondayIntegration,
  MondaySyncRule,
  RuleExecutionContext,
  RuleExecutionResult,
  TriggerEvent,
  TriggerType,
} from "./types";
import { ConvexError, v } from "convex/values";
import { Doc, MutationCtx } from "convex/server";

import { Id } from "../../_generated/dataModel";
import { api } from "../../_generated/api";

/**
 * Parse a JSON string safely, returning null if invalid
 */
function safeParseJSON(str: string | undefined): unknown {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error("Error parsing JSON:", e);
    return null;
  }
}

/**
 * Evaluate a field condition against an object
 */
export function evaluateFieldCondition(
  condition: FieldCondition,
  data: Record<string, unknown>,
  prevData?: Record<string, unknown>,
): boolean {
  const { field, operator, value } = condition;
  const fieldValue = data[field];

  switch (operator) {
    case "eq":
      return fieldValue === value;
    case "ne":
      return fieldValue !== value;
    case "gt":
      return (
        typeof fieldValue === "number" &&
        typeof value === "number" &&
        fieldValue > value
      );
    case "lt":
      return (
        typeof fieldValue === "number" &&
        typeof value === "number" &&
        fieldValue < value
      );
    case "gte":
      return (
        typeof fieldValue === "number" &&
        typeof value === "number" &&
        fieldValue >= value
      );
    case "lte":
      return (
        typeof fieldValue === "number" &&
        typeof value === "number" &&
        fieldValue <= value
      );
    case "contains":
      return (
        typeof fieldValue === "string" &&
        typeof value === "string" &&
        fieldValue.includes(value)
      );
    case "startsWith":
      return (
        typeof fieldValue === "string" &&
        typeof value === "string" &&
        fieldValue.startsWith(value)
      );
    case "endsWith":
      return (
        typeof fieldValue === "string" &&
        typeof value === "string" &&
        fieldValue.endsWith(value)
      );
    case "exists":
      return fieldValue !== undefined && fieldValue !== null;
    case "changed":
      return prevData !== undefined && fieldValue !== prevData[field];
    default:
      return false;
  }
}

/**
 * Evaluate a complex condition against an object
 */
export function evaluateComplexCondition(
  condition: ComplexCondition,
  data: Record<string, unknown>,
  prevData?: Record<string, unknown>,
): boolean {
  const { operator, conditions } = condition;

  switch (operator) {
    case "and":
      return conditions.every((cond) =>
        "field" in cond
          ? evaluateFieldCondition(cond, data, prevData)
          : evaluateComplexCondition(cond, data, prevData),
      );
    case "or":
      return conditions.some((cond) =>
        "field" in cond
          ? evaluateFieldCondition(cond, data, prevData)
          : evaluateComplexCondition(cond, data, prevData),
      );
    case "not":
      return !conditions.some((cond) =>
        "field" in cond
          ? evaluateFieldCondition(cond, data, prevData)
          : evaluateComplexCondition(cond, data, prevData),
      );
    default:
      return false;
  }
}

/**
 * Check if a rule should be triggered based on an event
 */
export function shouldTriggerRule(
  rule: MondaySyncRule,
  event: TriggerEvent,
): boolean {
  // Check if rule is enabled
  if (!rule.isEnabled) {
    return false;
  }

  // Check if table matches
  if (rule.triggerTable !== event.table) {
    return false;
  }

  // Check if rule is on cooldown
  const now = Date.now();
  if (
    rule.lastExecuted &&
    rule.cooldownMs &&
    now - rule.lastExecuted < rule.cooldownMs
  ) {
    return false;
  }

  // Check trigger type
  switch (rule.triggerType) {
    case "onCreate":
      return event.operation === "create";

    case "onUpdate":
      return event.operation === "update";

    case "onStatusChange":
      if (
        event.operation !== "update" ||
        !rule.triggerField ||
        !event.changes
      ) {
        return false;
      }
      return rule.triggerField in event.changes;

    case "onFieldValue":
      if (!rule.triggerField || !event.after) {
        return false;
      }
      return event.after[rule.triggerField] === rule.triggerValue;

    case "onCheckout":
      // Special case for product checkout events
      return event.table === "orders" && event.operation === "create";

    case "onManualTrigger":
      // This is only triggered manually, not by events
      return false;

    case "onSchedule":
      // This is triggered by schedule, not by events
      return false;

    default:
      return false;
  }
}

/**
 * Apply a complex field condition (parsed from JSON)
 */
export function applyComplexCondition(
  rule: MondaySyncRule,
  event: TriggerEvent,
): boolean {
  if (!rule.triggerCondition || !event.after) {
    return true;
  }

  try {
    const condition = JSON.parse(rule.triggerCondition) as ComplexCondition;
    return evaluateComplexCondition(condition, event.after, event.before);
  } catch (e) {
    console.error("Error parsing trigger condition:", e);
    return false;
  }
}

/**
 * Execute a rule action
 */
export async function executeRuleAction(
  ctx: MutationCtx,
  context: RuleExecutionContext,
): Promise<RuleExecutionResult> {
  const { rule, event, integration, boardMapping } = context;
  const startTime = context.startTime;

  try {
    let actionConfig: ActionConfig;
    try {
      actionConfig = JSON.parse(rule.actionConfig) as ActionConfig;
    } catch (e) {
      throw new Error(
        `Invalid action config: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    const result: RuleExecutionResult = {
      status: "success",
      details: {
        actionType: rule.actionType,
        config: actionConfig,
        documentId: event.documentId,
        table: event.table,
      },
      timeTaken: Date.now() - startTime,
    };

    // Execute the action based on type
    switch (rule.actionType) {
      case "push":
        // Push to Monday.com
        await ctx.runMutation(api.monday.mutations.pushToMonday, {
          integrationId: integration._id,
          boardMappingId: boardMapping._id,
          recordId: event.documentId,
        });
        break;

      case "pull":
        // Pull from Monday.com
        await ctx.runMutation(api.monday.mutations.pullFromMonday, {
          integrationId: integration._id,
          boardMappingId: boardMapping._id,
        });
        break;

      case "updateField":
        if (
          !actionConfig.table ||
          !actionConfig.field ||
          actionConfig.value === undefined
        ) {
          throw new Error("Missing required fields for updateField action");
        }

        // Update a field in Convex
        const doc = await ctx.db.get(
          ctx.db.normalizeId(actionConfig.table, event.documentId),
        );
        if (!doc) {
          throw new Error(`Document not found: ${event.documentId}`);
        }

        await ctx.db.patch(
          ctx.db.normalizeId(actionConfig.table, event.documentId),
          {
            [actionConfig.field]: actionConfig.value,
          },
        );

        result.details.fieldUpdated = actionConfig.field;
        result.details.newValue = actionConfig.value;
        break;

      case "createItem":
        // Create a new item in Monday.com based on the event data
        if (!actionConfig.targetBoardId || !actionConfig.itemTemplate) {
          throw new Error("Missing required fields for createItem action");
        }

        // This would call a specific function to create an item in Monday.com
        // TODO: Implement this based on your Monday.com API client
        // const newItemId = await createMondayItem(ctx, {...});

        result.details.mondayItemCreated = true;
        // result.details.mondayItemId = newItemId;
        break;

      case "updateItem":
        // Update an existing item in Monday.com
        if (!actionConfig.targetBoardId || !actionConfig.itemTemplate) {
          throw new Error("Missing required fields for updateItem action");
        }

        // TODO: Implement this based on your Monday.com API client
        // const updatedItemId = await updateMondayItem(ctx, {...});

        result.details.mondayItemUpdated = true;
        // result.details.mondayItemId = updatedItemId;
        break;

      case "createRelated":
        // Create a related item in Monday.com
        if (
          !actionConfig.targetBoardId ||
          !actionConfig.itemTemplate ||
          !actionConfig.mappingField
        ) {
          throw new Error("Missing required fields for createRelated action");
        }

        // TODO: Implement this based on your Monday.com API client
        // const relatedItemId = await createRelatedMondayItem(ctx, {...});

        result.details.relatedItemCreated = true;
        // result.details.relatedItemId = relatedItemId;
        break;

      default:
        throw new Error(`Unsupported action type: ${rule.actionType}`);
    }

    return result;
  } catch (e) {
    console.error("Error executing rule action:", e);
    return {
      status: "error",
      details: { error: e instanceof Error ? e.message : String(e) },
      error: e instanceof Error ? e.message : String(e),
      timeTaken: Date.now() - startTime,
    };
  }
}

/**
 * Process a trigger event against all applicable rules
 */
export async function processEvent(
  ctx: MutationCtx,
  event: TriggerEvent,
): Promise<{ executedRules: number; success: number; failed: number }> {
  // Get all enabled rules for this table
  const rules = await ctx.db
    .query("mondaySyncRules")
    .withIndex("by_trigger_table", (q) => q.eq("triggerTable", event.table))
    .filter((q) => q.eq(q.field("isEnabled"), true))
    .order("asc", (q) => q.field("priority"))
    .collect();

  let executedCount = 0;
  let successCount = 0;
  let failedCount = 0;

  // Process each rule
  for (const rule of rules) {
    // Check if rule should be triggered
    if (
      !shouldTriggerRule(rule, event) ||
      !applyComplexCondition(rule, event)
    ) {
      continue;
    }

    // Get the integration and board mapping
    const integration = await ctx.db.get(rule.integrationId);
    if (!integration || !integration.isEnabled) {
      continue;
    }

    const boardMapping = await ctx.db.get(rule.boardMappingId);
    if (!boardMapping || !boardMapping.isEnabled) {
      continue;
    }

    // Create execution context
    const executionContext: RuleExecutionContext = {
      rule,
      event,
      integration,
      boardMapping,
      startTime: Date.now(),
    };

    // Execute the rule
    const result = await executeRuleAction(ctx, executionContext);
    executedCount++;

    if (result.status === "success") {
      successCount++;
    } else {
      failedCount++;
    }

    // Log the execution
    await ctx.db.insert("mondaySyncRuleExecutions", {
      ruleId: rule._id,
      executedAt: Date.now(),
      status: result.status,
      triggerDetails: JSON.stringify(event),
      executionDetails: JSON.stringify(result.details),
      error: result.error,
      timeTaken: result.timeTaken,
    });

    // Update the rule's last execution time and count
    await ctx.db.patch(rule._id, {
      lastExecuted: Date.now(),
      executionCount: (rule.executionCount || 0) + 1,
    });
  }

  return {
    executedRules: executedCount,
    success: successCount,
    failed: failedCount,
  };
}

/**
 * Helper function to create a trigger event
 */
export function createTriggerEvent(
  table: string,
  documentId: string,
  operation: "create" | "update" | "delete",
  before?: Record<string, unknown>,
  after?: Record<string, unknown>,
): TriggerEvent {
  const changes: Record<string, { before: unknown; after: unknown }> = {};

  // Calculate changes if we have both before and after
  if (before && after) {
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      if (before[key] !== after[key]) {
        changes[key] = {
          before: before[key],
          after: after[key],
        };
      }
    }
  }

  return {
    table,
    documentId,
    operation,
    before,
    after,
    changes: Object.keys(changes).length > 0 ? changes : undefined,
    timestamp: Date.now(),
  };
}

/**
 * Hook function to be called after document creation
 */
export async function afterCreate(
  ctx: MutationCtx,
  table: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  const event = createTriggerEvent(table, id, "create", undefined, data);
  await processEvent(ctx, event);
}

/**
 * Hook function to be called after document update
 */
export async function afterUpdate(
  ctx: MutationCtx,
  table: string,
  id: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Promise<void> {
  const event = createTriggerEvent(table, id, "update", before, after);
  await processEvent(ctx, event);
}

/**
 * Hook function to be called after document deletion
 */
export async function afterDelete(
  ctx: MutationCtx,
  table: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  const event = createTriggerEvent(table, id, "delete", data, undefined);
  await processEvent(ctx, event);
}

/**
 * Manually trigger a rule
 */
export async function manuallyTriggerRule(
  ctx: MutationCtx,
  ruleId: Id<"mondaySyncRules">,
  documentId: string,
): Promise<RuleExecutionResult> {
  const rule = await ctx.db.get(ruleId);
  if (!rule) {
    throw new ConvexError(`Rule not found: ${ruleId}`);
  }

  if (
    rule.triggerType !== "onManualTrigger" &&
    rule.triggerType !== "onSchedule"
  ) {
    throw new ConvexError(
      `Rule cannot be triggered manually: ${rule.triggerType}`,
    );
  }

  // Get the document
  const doc = await ctx.db.get(
    ctx.db.normalizeId(rule.triggerTable, documentId),
  );
  if (!doc) {
    throw new ConvexError(`Document not found: ${documentId}`);
  }

  // Create a trigger event
  const event = createTriggerEvent(
    rule.triggerTable,
    documentId,
    "update",
    undefined,
    doc,
  );

  // Get the integration and board mapping
  const integration = await ctx.db.get(rule.integrationId);
  if (!integration) {
    throw new ConvexError(`Integration not found: ${rule.integrationId}`);
  }

  const boardMapping = await ctx.db.get(rule.boardMappingId);
  if (!boardMapping) {
    throw new ConvexError(`Board mapping not found: ${rule.boardMappingId}`);
  }

  // Create execution context
  const executionContext: RuleExecutionContext = {
    rule,
    event,
    integration,
    boardMapping,
    startTime: Date.now(),
  };

  // Execute the rule
  const result = await executeRuleAction(ctx, executionContext);

  // Log the execution
  await ctx.db.insert("mondaySyncRuleExecutions", {
    ruleId: rule._id,
    executedAt: Date.now(),
    status: result.status,
    triggerDetails: JSON.stringify(event),
    executionDetails: JSON.stringify(result.details),
    error: result.error,
    timeTaken: result.timeTaken,
  });

  // Update the rule's last execution time and count
  await ctx.db.patch(rule._id, {
    lastExecuted: Date.now(),
    executionCount: (rule.executionCount || 0) + 1,
  });

  return result;
}
