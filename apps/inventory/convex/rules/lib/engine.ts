/**
 * Rule Execution Engine
 *
 * This module provides the core rule execution engine that processes
 * rules based on triggers, evaluates conditions, and executes actions.
 */

import { mutation } from "convex/server";

import { Id } from "../../_generated/dataModel";
import {
  Action,
  ActionConfig,
  ActionResult,
  Condition,
  ConditionConfig,
  Rule,
  RuleContext,
  RuleExecutionResult,
  RuleLogger,
  Trigger,
} from "./interfaces";
import { RuleExecutionLogger } from "./logger";
import { RuleEngineRegistry } from "./registry";

/**
 * Result of rule execution with timing information
 */
interface ExecutionResult {
  success: boolean;
  triggered?: boolean;
  conditionsMet?: boolean;
  actionsExecuted?: boolean;
  allActionsSuccessful?: boolean;
  actionResults?: Record<string, unknown>[];
  error?: string;
}

/**
 * Core rule execution engine
 */
export class RuleExecutionEngine {
  /**
   * Creates a new instance of RuleExecutionEngine
   * @param registry Registry containing trigger, condition, and action factories
   * @param db Database client for reading and writing data
   * @param logger Logger for recording execution information
   */
  constructor(
    private registry: RuleEngineRegistry,
    private db: any, // Using 'any' for db to avoid Convex type issues
    private logger: RuleLogger,
  ) {}

  /**
   * Processes a trigger event for a specific integration
   * @param integrationId ID of the integration
   * @param triggerType Type of the trigger
   * @param triggerData Data associated with the trigger
   * @returns Promise that resolves when processing is complete
   */
  async processTrigger(
    integrationId: string,
    triggerType: string,
    triggerData: Record<string, unknown>,
  ): Promise<void> {
    try {
      // Find all rules that match this trigger type and integration
      const rules = await this.db
        .query("rules")
        .withIndex("by_integration", (q: any) =>
          q.eq("integrationId", integrationId as unknown as Id<"integrations">),
        )
        .filter(
          (q: any) =>
            q.eq(q.field("triggerType"), triggerType) &&
            q.eq(q.field("isEnabled"), true),
        )
        .collect();

      if (rules.length === 0) {
        this.logger.info(
          `No matching rules found for trigger ${triggerType} in integration ${integrationId}`,
        );
        return;
      }

      this.logger.info(
        `Processing ${rules.length} rules for trigger ${triggerType} in integration ${integrationId}`,
      );

      // Process each matching rule
      for (const rule of rules) {
        try {
          const parsedRule: Rule = {
            id: rule._id,
            name: rule.name,
            description: rule.description,
            enabled: rule.isEnabled,
            priority: rule.priority,
            integrationId: rule.integrationId,
            integrationName: rule.integrationName,
            triggerType: rule.triggerType,
            triggerConfig: JSON.parse(rule.triggerConfig),
            conditions: JSON.parse(rule.conditions) as ConditionConfig[],
            actions: JSON.parse(rule.actions) as ActionConfig[],
            cooldownMs: rule.cooldownMs,
            lastExecuted: rule.lastTriggered,
            executionCount: rule.executionCount || 0,
            createdAt: rule.createdAt,
            updatedAt: rule.updatedAt,
            createdBy: rule.createdBy,
            metadata: rule.metadata ? JSON.parse(rule.metadata) : undefined,
          };

          // Check if rule is on cooldown
          if (
            parsedRule.cooldownMs &&
            parsedRule.lastExecuted &&
            Date.now() - parsedRule.lastExecuted < parsedRule.cooldownMs
          ) {
            this.logger.info(`Rule ${rule._id} is on cooldown, skipping`);
            continue;
          }

          await this.executeRule(parsedRule, triggerData);
        } catch (error) {
          this.logger.error(
            `Error processing rule ${rule._id}`,
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error processing trigger ${triggerType} for integration ${integrationId}`,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Executes a single rule
   * @param rule Rule to execute
   * @param triggerData Data associated with the trigger
   * @returns Result of rule execution
   */
  async executeRule(
    rule: Rule,
    triggerData: Record<string, unknown>,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Create execution record
    const executionId = await this.db.insert("ruleExecutions", {
      ruleId: rule.id as unknown as Id<"rules">,
      integrationId: rule.integrationId as unknown as Id<"integrations">,
      executedAt: startTime,
      status: "skipped",
      triggered: false,
      conditionsMet: false,
      triggerData: JSON.stringify(triggerData),
      actionsExecuted: 0,
      actionsSucceeded: 0,
      actionsFailed: 0,
      startTime,
      endTime: 0,
      details: JSON.stringify({}),
      timeTaken: 0,
    });

    // Create logger for this execution
    const executionLogger = new RuleExecutionLogger();

    try {
      // Log start of execution
      executionLogger.info("Starting rule execution", {
        ruleName: rule.name,
        ruleId: rule.id,
        integrationId: rule.integrationId,
      });

      // Create execution context
      const context = await this.createExecutionContext(
        rule,
        triggerData,
        executionLogger,
      );

      // Evaluate trigger
      executionLogger.info("Evaluating trigger", {
        triggerType: rule.triggerType,
        component: "trigger",
      });

      const triggered = await this.evaluateTrigger(rule, context);

      // Update execution record with trigger result
      await this.db.patch(executionId, { triggered });

      if (!triggered) {
        executionLogger.info(
          "Trigger conditions not met, skipping rule execution",
          {
            component: "trigger",
          },
        );

        // Complete execution
        const endTime = Date.now();
        await this.db.patch(executionId, {
          status: "skipped",
          endTime,
          timeTaken: endTime - startTime,
          details: JSON.stringify({
            message: "Trigger conditions not met",
          }),
        });

        // Store logs
        await this.storeExecutionLogs(executionId, executionLogger);

        return {
          success: true,
          triggered: false,
        };
      }

      // Evaluate conditions
      executionLogger.info("Evaluating conditions", {
        conditionCount: rule.conditions.length,
        component: "conditions",
      });

      const conditionResults = await this.evaluateConditions(rule, context);
      const conditionsMet = conditionResults.every((result) => result.result);

      // Update execution record with conditions result
      await this.db.patch(executionId, { conditionsMet });

      if (!conditionsMet) {
        executionLogger.info("Conditions not met, skipping actions", {
          component: "conditions",
        });

        // Complete execution
        const endTime = Date.now();
        await this.db.patch(executionId, {
          status: "skipped",
          endTime,
          timeTaken: endTime - startTime,
          details: JSON.stringify({
            conditionResults,
            message: "Conditions not met",
          }),
        });

        // Store logs
        await this.storeExecutionLogs(executionId, executionLogger);

        return {
          success: true,
          triggered: true,
          conditionsMet: false,
        };
      }

      // Execute actions
      executionLogger.info("Executing actions", {
        actionCount: rule.actions.length,
        component: "actions",
      });

      const actionResults = await this.executeActions(rule, context);
      const actionsSucceeded = actionResults.filter(
        (result) => result.success,
      ).length;
      const actionsFailed = actionResults.length - actionsSucceeded;
      const allActionsSuccessful = actionsFailed === 0;

      // Update rule with execution information
      await this.db.patch(rule.id as unknown as Id<"rules">, {
        lastTriggered: startTime,
        executionCount: (rule.executionCount || 0) + 1,
        lastError: allActionsSuccessful ? undefined : "Some actions failed",
      });

      // Complete execution
      const endTime = Date.now();
      await this.db.patch(executionId, {
        status: allActionsSuccessful ? "success" : "error",
        actionsExecuted: actionResults.length,
        actionsSucceeded,
        actionsFailed,
        endTime,
        timeTaken: endTime - startTime,
        details: JSON.stringify({
          actionResults,
          message: allActionsSuccessful
            ? "Rule executed successfully"
            : "Some actions failed",
        }),
      });

      // Store action results
      for (let i = 0; i < actionResults.length; i++) {
        const result = actionResults[i];
        const action = rule.actions[i];
        await this.db.insert("actionResults", {
          executionId,
          ruleId: rule.id as unknown as Id<"rules">,
          integrationId: rule.integrationId as unknown as Id<"integrations">,
          actionType: action.type,
          actionConfig: JSON.stringify(action.config),
          executedAt: endTime,
          success: result.success,
          result: JSON.stringify(result.data || {}),
          error: result.error,
          timeTaken: result.timeTaken || 0,
        });
      }

      // Store logs
      await this.storeExecutionLogs(executionId, executionLogger);

      return {
        success: true,
        triggered: true,
        conditionsMet: true,
        actionsExecuted: true,
        allActionsSuccessful,
        actionResults: actionResults.map((r) => ({ ...r, data: r.data || {} })),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      executionLogger.error(
        "Rule execution failed",
        error instanceof Error ? error : new Error(errorMessage),
      );

      // Update execution record with error
      const endTime = Date.now();
      await this.db.patch(executionId, {
        status: "error",
        endTime,
        timeTaken: endTime - startTime,
        error: errorMessage,
        details: JSON.stringify({
          message: "Rule execution failed with error",
          error: errorMessage,
        }),
      });

      // Store logs
      await this.storeExecutionLogs(executionId, executionLogger);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Creates an execution context for rule evaluation
   * @param rule Rule being executed
   * @param triggerData Data associated with the trigger
   * @param logger Logger for execution
   * @returns Rule execution context
   */
  private async createExecutionContext(
    rule: Rule,
    triggerData: Record<string, unknown>,
    logger: RuleLogger,
  ): Promise<RuleContext> {
    // Get integration details
    const integration = await this.db.get(
      rule.integrationId as unknown as Id<"integrations">,
    );
    if (!integration) {
      throw new Error(`Integration ${rule.integrationId} not found`);
    }

    return {
      ruleId: rule.id,
      integrationId: rule.integrationId,
      integrationType: integration.type,
      data: triggerData,
      timestamp: Date.now(),
      variables: {},
    };
  }

  /**
   * Evaluates a rule's trigger
   * @param rule Rule to evaluate
   * @param context Execution context
   * @returns Whether the trigger condition was met
   */
  private async evaluateTrigger(
    rule: Rule,
    context: RuleContext,
  ): Promise<boolean> {
    try {
      // Create trigger from registry
      const trigger = this.registry.createTrigger(
        rule.integrationId,
        rule.triggerType,
        rule.triggerConfig,
      );

      // Evaluate trigger
      return await trigger.evaluate(context);
    } catch (error) {
      this.logger.error(
        `Error evaluating trigger for rule ${rule.id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      return false;
    }
  }

  /**
   * Evaluates a rule's conditions
   * @param rule Rule to evaluate
   * @param context Execution context
   * @returns Results of condition evaluations
   */
  private async evaluateConditions(
    rule: Rule,
    context: RuleContext,
  ): Promise<Array<{ conditionType: string; result: boolean }>> {
    const results: Array<{ conditionType: string; result: boolean }> = [];

    // If no conditions, return true
    if (!rule.conditions || rule.conditions.length === 0) {
      return [];
    }

    // Evaluate each condition
    for (const condition of rule.conditions) {
      try {
        // Create condition from registry
        const conditionInstance = this.registry.createCondition(
          rule.integrationId,
          condition.type,
          condition.config,
        );

        // Evaluate condition
        const result = await conditionInstance.evaluate(context);
        results.push({
          conditionType: condition.type,
          result,
        });

        // Short-circuit if condition fails
        if (!result) {
          break;
        }
      } catch (error) {
        this.logger.error(
          `Error evaluating condition ${condition.type} for rule ${rule.id}`,
          error instanceof Error ? error : new Error(String(error)),
        );
        results.push({
          conditionType: condition.type,
          result: false,
        });
        break;
      }
    }

    return results;
  }

  /**
   * Executes a rule's actions
   * @param rule Rule to execute
   * @param context Execution context
   * @returns Results of action executions
   */
  private async executeActions(
    rule: Rule,
    context: RuleContext,
  ): Promise<
    Array<{
      actionType: string;
      success: boolean;
      data?: Record<string, unknown>;
      error?: string;
      timeTaken?: number;
    }>
  > {
    const results: Array<{
      actionType: string;
      success: boolean;
      data?: Record<string, unknown>;
      error?: string;
      timeTaken?: number;
    }> = [];

    // If no actions, return empty array
    if (!rule.actions || rule.actions.length === 0) {
      return [];
    }

    // Execute each action
    for (const action of rule.actions) {
      const startTime = Date.now();
      try {
        // Create action from registry
        const actionInstance = this.registry.createAction(
          rule.integrationId,
          action.type,
          action.config,
        );

        // Execute action
        const result = await actionInstance.execute(context);
        const endTime = Date.now();

        results.push({
          actionType: action.type,
          success: true,
          data: result,
          timeTaken: endTime - startTime,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const endTime = Date.now();

        this.logger.error(
          `Error executing action ${action.type} for rule ${rule.id}`,
          error instanceof Error ? error : new Error(errorMessage),
        );

        results.push({
          actionType: action.type,
          success: false,
          error: errorMessage,
          timeTaken: endTime - startTime,
        });
      }
    }

    return results;
  }

  /**
   * Stores execution logs in the database
   * @param executionId ID of the rule execution
   * @param logger Logger containing log entries
   */
  private async storeExecutionLogs(
    executionId: Id<"ruleExecutions">,
    logger: RuleExecutionLogger,
  ): Promise<void> {
    const entries = logger.getEntries();
    for (const entry of entries) {
      await this.db.insert("ruleExecutionLogs", {
        executionId,
        timestamp: entry.timestamp,
        level: entry.level,
        message: entry.message,
        data: entry.data ? JSON.stringify(entry.data) : undefined,
        component: (entry.data?.component as string) || "engine",
        componentId: entry.data?.componentId as string,
      });
    }
  }
}
