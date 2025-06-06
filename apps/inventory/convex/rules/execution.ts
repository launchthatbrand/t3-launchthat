/**
 * Rule Execution API
 *
 * This module provides API endpoints for executing rules.
 */

import { v } from "convex/values";

import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { action, mutation, query } from "../_generated/server";
import { RuleExecutionEngine } from "./lib/engine";
import { registerIntegrationPlugins } from "./lib/integration/plugins";
import { RuleExecutionLogger } from "./lib/logger";
import { RuleEngineRegistry } from "./lib/registry";
import { safeParseJson, safeStringifyJson } from "./lib/utils";

/**
 * Get a rule engine registry with all registered integrations
 * @param ctx Convex context
 * @returns A promise that resolves to a rule engine registry
 */
async function getRuleEngineRegistry(ctx: any): Promise<RuleEngineRegistry> {
  // Create a new registry
  const registry = new RuleEngineRegistry();

  try {
    // Get all registered integrations
    const integrations = await ctx.db
      .query("integrations")
      .withIndex("by_enabled", (q) => q.eq("isEnabled", true))
      .collect();

    // Register each integration
    for (const integration of integrations) {
      registry.registerIntegration(integration.type);
    }

    // Register all integration plugins
    registerIntegrationPlugins(registry);

    return registry;
  } catch (error) {
    ctx.log.error("Error getting rule engine registry", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Process a trigger event
 *
 * This function is called when a trigger event occurs, such as a webhook
 * from an integration, a scheduled event, or a manual trigger.
 */
export const processTrigger = mutation({
  args: {
    integrationId: v.id("integrations"),
    triggerType: v.string(),
    triggerData: v.any(),
  },
  handler: async (ctx, args) => {
    const { integrationId, triggerType, triggerData } = args;

    try {
      // Get integration
      const integration = await ctx.db.get(integrationId);
      if (!integration) {
        throw new Error(`Integration ${integrationId} not found`);
      }

      if (!integration.isEnabled) {
        throw new Error(`Integration ${integrationId} is not enabled`);
      }

      // Create rule engine registry
      const registry = await getRuleEngineRegistry(ctx);

      // Create logger
      const logger = new RuleExecutionLogger();

      // Create rule engine
      const engine = new RuleExecutionEngine(registry, ctx.db, logger);

      // Process the trigger
      await engine.processTrigger(
        integration.type,
        triggerType,
        triggerData || {},
      );

      return { success: true };
    } catch (error) {
      ctx.log.error("Error processing trigger", {
        integrationId,
        triggerType,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Execute a rule manually
 *
 * This function is called when a rule is executed manually, such as from
 * the admin UI or a test.
 */
export const executeRule = mutation({
  args: {
    ruleId: v.id("rules"),
    triggerData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { ruleId, triggerData } = args;

    try {
      // Get rule
      const rule = await ctx.db.get(ruleId);
      if (!rule) {
        throw new Error(`Rule ${ruleId} not found`);
      }

      // Get integration
      const integration = await ctx.db.get(rule.integrationId);
      if (!integration) {
        throw new Error(`Integration ${rule.integrationId} not found`);
      }

      if (!integration.isEnabled) {
        throw new Error(`Integration ${rule.integrationId} is not enabled`);
      }

      // Create rule engine registry
      const registry = await getRuleEngineRegistry(ctx);

      // Create logger
      const logger = new RuleExecutionLogger();

      // Create rule engine
      const engine = new RuleExecutionEngine(registry, ctx.db, logger);

      // Convert Convex document to Rule interface
      const parsedRule = {
        id: rule._id,
        name: rule.name,
        description: rule.description,
        enabled: rule.isEnabled,
        priority: rule.priority,
        integrationId: rule.integrationId,
        integrationName: integration.name,
        triggerType: rule.triggerType,
        triggerConfig: JSON.parse(rule.triggerConfig),
        conditions: JSON.parse(rule.conditions),
        actions: JSON.parse(rule.actions),
        cooldownMs: rule.cooldownMs,
        lastExecuted: rule.lastTriggered,
        executionCount: rule.executionCount || 0,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
        createdBy: rule.createdBy,
        metadata: rule.metadata ? JSON.parse(rule.metadata) : undefined,
      };

      // Execute the rule
      const result = await engine.executeRule(parsedRule, triggerData || {});

      // Return the result
      return {
        success: true,
        result,
      };
    } catch (error) {
      ctx.log.error("Error executing rule", {
        ruleId,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Get rule execution history
 */
export const getRuleExecutions = query({
  args: {
    ruleId: v.optional(v.id("rules")),
    integrationId: v.optional(v.id("integrations")),
    limit: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("success"), v.literal("error"), v.literal("skipped")),
    ),
  },
  handler: async (ctx, args) => {
    const { ruleId, integrationId, limit = 50, status } = args;

    // Build query
    let query = ctx.db.query("ruleExecutions");

    // Filter by rule ID
    if (ruleId) {
      query = query.withIndex("by_rule", (q) => q.eq("ruleId", ruleId));
    }
    // Filter by integration ID
    else if (integrationId) {
      query = query.withIndex("by_integration", (q) =>
        q.eq("integrationId", integrationId),
      );
    }

    // Filter by status
    if (status) {
      query = query.filter((q) => q.eq(q.field("status"), status));
    }

    // Order by execution time descending and limit results
    const executions = await query.order("desc").take(limit);

    return executions;
  },
});

/**
 * Get rule execution logs
 */
export const getRuleExecutionLogs = query({
  args: {
    executionId: v.id("ruleExecutions"),
    level: v.optional(
      v.union(v.literal("info"), v.literal("warn"), v.literal("error")),
    ),
    component: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { executionId, level, component, limit = 100 } = args;

    // Build query
    let query = ctx.db
      .query("ruleExecutionLogs")
      .withIndex("by_execution", (q) => q.eq("executionId", executionId));

    // Filter by level
    if (level) {
      query = query.filter((q) => q.eq(q.field("level"), level));
    }

    // Filter by component
    if (component) {
      query = query.filter((q) => q.eq(q.field("component"), component));
    }

    // Order by timestamp ascending and limit results
    const logs = await query.order("asc").take(limit);

    return logs;
  },
});

/**
 * Clean up old rule execution logs
 */
export const cleanupExecutionLogs = action({
  args: {
    olderThan: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { olderThan = 30 * 24 * 60 * 60 * 1000, limit = 1000 } = args;
    const cutoffTime = Date.now() - olderThan;

    // Execute a query to get old execution logs
    const oldExecutions = await ctx.runQuery(api.rules.getOldExecutionLogs, {
      olderThan: cutoffTime,
      limit,
    });

    if (oldExecutions.length === 0) {
      return { deleted: 0 };
    }

    // Delete old execution logs
    let deleted = 0;
    for (const execution of oldExecutions) {
      try {
        // Delete all logs for this execution
        const logs = await ctx.runQuery(api.rules.getRuleExecutionLogs, {
          executionId: execution._id,
          limit: 1000,
        });

        for (const log of logs) {
          await ctx.runMutation(api.rules.deleteExecutionLog, {
            id: log._id,
          });
          deleted++;
        }

        // Delete action results
        const actionResults = await ctx.runQuery(api.rules.getActionResults, {
          executionId: execution._id,
        });

        for (const result of actionResults) {
          await ctx.runMutation(api.rules.deleteActionResult, {
            id: result._id,
          });
        }

        // Delete the execution itself
        await ctx.runMutation(api.rules.deleteExecution, {
          id: execution._id,
        });
      } catch (error) {
        ctx.log.error("Error deleting execution logs", {
          executionId: execution._id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { deleted };
  },
});

/**
 * Get old rule execution logs for cleanup
 */
export const getOldExecutionLogs = query({
  args: {
    olderThan: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { olderThan, limit = 100 } = args;

    // Build query to find executions older than the cutoff time
    const oldExecutions = await ctx.db
      .query("ruleExecutions")
      .withIndex("by_time", (q) => q.lt("executedAt", olderThan))
      .take(limit);

    return oldExecutions;
  },
});

/**
 * Delete a rule execution
 */
export const deleteExecution = mutation({
  args: {
    id: v.id("ruleExecutions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Delete a rule execution log
 */
export const deleteExecutionLog = mutation({
  args: {
    id: v.id("ruleExecutionLogs"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Get action results for an execution
 */
export const getActionResults = query({
  args: {
    executionId: v.id("ruleExecutions"),
  },
  handler: async (ctx, args) => {
    const { executionId } = args;

    // Build query
    const results = await ctx.db
      .query("actionResults")
      .withIndex("by_execution", (q) => q.eq("executionId", executionId))
      .collect();

    return results;
  },
});

/**
 * Delete an action result
 */
export const deleteActionResult = mutation({
  args: {
    id: v.id("actionResults"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
