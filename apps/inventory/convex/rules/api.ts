/**
 * Rules API
 *
 * This module provides the public API for the rules engine.
 */

import { v } from "convex/values";

import { Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import {
  convertDocToRule,
  convertRuleToDoc,
  safeParseJson,
  safeStringifyJson,
} from "./lib/utils";

/**
 * Get integration configuration with parsed config
 */
export const getIntegrationConfig = query({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    // Convert string ID to a typed ID
    const integrationId = args.id as Id<"integrations">;
    const integration = await ctx.db.get(integrationId);

    if (!integration) {
      return null;
    }

    // Parse config if it exists
    let configObject = {};
    if (integration.config) {
      configObject = safeParseJson(integration.config, {});
    }

    return {
      id: integration._id,
      name: integration.name,
      type: integration.type,
      isEnabled: integration.isEnabled,
      config: configObject,
    };
  },
});

/**
 * Update integration configuration
 */
export const updateIntegration = mutation({
  args: {
    id: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
    apiKey: v.optional(v.string()),
    apiEndpoint: v.optional(v.string()),
    config: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Convert string ID to a typed ID
    const integrationId = args.id as Id<"integrations">;

    // Create a copy of args without the id
    const { id, config, ...updates } = args;

    // Process config if provided
    if (config !== undefined) {
      updates.config = safeStringifyJson(config);
    }

    // Update the integration
    await ctx.db.patch(integrationId, updates);

    return { success: true };
  },
});

/**
 * Get all available integrations (predefined types)
 */
export const getAvailableIntegrationTypes = query({
  args: {},
  handler: async () => {
    // This is a placeholder function to list all available integration types
    // In a real implementation, this would return the list of integration types
    // registered with the system
    return [
      {
        id: "monday",
        name: "Monday.com",
        description: "Integrate with Monday.com boards and items",
        version: "1.0.0",
      },
      {
        id: "slack",
        name: "Slack",
        description: "Integrate with Slack channels and messages",
        version: "1.0.0",
      },
      {
        id: "zapier",
        name: "Zapier",
        description: "Connect with thousands of apps via Zapier",
        version: "1.0.0",
      },
    ];
  },
});

/**
 * Get all integrations in the system
 */
export const getIntegrations = query({
  args: {
    isEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let queryBuilder = ctx.db.query("integrations");

    // Filter by enabled status if specified
    if (args.isEnabled !== undefined) {
      queryBuilder = queryBuilder.withIndex("by_enabled", (q) =>
        q.eq("isEnabled", args.isEnabled),
      );
    }

    return await queryBuilder.collect();
  },
});

/**
 * Get available trigger types for an integration
 */
export const getAvailableTriggers = query({
  args: {
    integrationType: v.string(),
  },
  handler: async (ctx, args) => {
    // This is a placeholder function to list available triggers for an integration
    // In a real implementation, this would query the integration registry

    // Sample data for Monday.com integration
    if (args.integrationType === "monday") {
      return [
        {
          type: "item_created",
          name: "Item Created",
          description: "Triggered when a new item is created in a board",
        },
        {
          type: "item_updated",
          name: "Item Updated",
          description: "Triggered when an item is updated in a board",
        },
        {
          type: "status_changed",
          name: "Status Changed",
          description: "Triggered when an item's status column changes",
        },
      ];
    }

    return [];
  },
});

/**
 * Get rules for an integration
 */
export const getRulesForIntegration = query({
  args: {
    integrationId: v.string(),
    isEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Convert string ID to a typed ID
    const typedIntegrationId = args.integrationId as Id<"integrations">;

    let queryBuilder = ctx.db
      .query("rules")
      .withIndex("by_integration", (q) =>
        q.eq("integrationId", typedIntegrationId),
      );

    if (args.isEnabled !== undefined) {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field("isEnabled"), args.isEnabled),
      );
    }

    return await queryBuilder.collect();
  },
});

// Rule Queries

/**
 * Get all rules
 */
export const getAllRules = query({
  args: {},
  handler: async (ctx) => {
    const rulesDocuments = await ctx.db.query("rules").collect();
    return rulesDocuments.map(convertDocToRule);
  },
});

/**
 * Get rules by integration ID
 */
export const getRulesByIntegration = query({
  args: {
    integrationId: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    const rulesDocuments = await ctx.db
      .query("rules")
      .withIndex("by_integration", (q) =>
        q.eq("integrationId", args.integrationId),
      )
      .collect();
    return rulesDocuments.map(convertDocToRule);
  },
});

/**
 * Get enabled rules
 */
export const getEnabledRules = query({
  args: {},
  handler: async (ctx) => {
    const rulesDocuments = await ctx.db
      .query("rules")
      .withIndex("by_enabled", (q) => q.eq("isEnabled", true))
      .collect();
    return rulesDocuments.map(convertDocToRule);
  },
});

/**
 * Get rule by ID
 */
export const getRuleById = query({
  args: {
    id: v.id("rules"),
  },
  handler: async (ctx, args) => {
    const ruleDocument = await ctx.db.get(args.id);
    if (!ruleDocument) {
      return null;
    }
    return convertDocToRule(ruleDocument);
  },
});

// Rule Mutations

/**
 * Create a new rule
 */
export const createRule = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    integrationId: v.id("integrations"),
    integrationName: v.string(),
    triggerType: v.string(),
    triggerConfig: v.any(),
    conditions: v.array(
      v.object({
        type: v.string(),
        config: v.any(),
      }),
    ),
    actions: v.array(
      v.object({
        type: v.string(),
        config: v.any(),
      }),
    ),
    priority: v.optional(v.number()),
    cooldownMs: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Verify the integration exists
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) {
      throw new Error(`Integration with ID ${args.integrationId} not found`);
    }

    // Create rule document
    const ruleDoc = {
      name: args.name,
      description: args.description,
      isEnabled: true,
      integrationId: args.integrationId,
      integrationName: args.integrationName,
      triggerType: args.triggerType,
      triggerConfig: safeStringifyJson(args.triggerConfig),
      conditions: safeStringifyJson(args.conditions),
      actions: safeStringifyJson(args.actions),
      priority: args.priority ?? 5, // Default priority is 5 (medium)
      cooldownMs: args.cooldownMs,
      lastTriggered: null,
      executionCount: 0,
      tags: args.tags,
      createdAt: now,
      updatedAt: now,
      createdBy: ctx.auth.subject,
      metadata: args.metadata ? safeStringifyJson(args.metadata) : undefined,
    };

    // Insert the rule
    const ruleId = await ctx.db.insert("rules", ruleDoc);
    return ruleId;
  },
});

/**
 * Update an existing rule
 */
export const updateRule = mutation({
  args: {
    id: v.id("rules"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    triggerType: v.optional(v.string()),
    triggerConfig: v.optional(v.any()),
    conditions: v.optional(
      v.array(
        v.object({
          type: v.string(),
          config: v.any(),
        }),
      ),
    ),
    actions: v.optional(
      v.array(
        v.object({
          type: v.string(),
          config: v.any(),
        }),
      ),
    ),
    priority: v.optional(v.number()),
    cooldownMs: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Get the existing rule
    const existingRule = await ctx.db.get(args.id);
    if (!existingRule) {
      throw new Error(`Rule with ID ${args.id} not found`);
    }

    // Prepare update object
    const update: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    // Only update fields that are provided
    if (args.name !== undefined) update.name = args.name;
    if (args.description !== undefined) update.description = args.description;
    if (args.triggerType !== undefined) update.triggerType = args.triggerType;
    if (args.triggerConfig !== undefined) {
      update.triggerConfig = safeStringifyJson(args.triggerConfig);
    }
    if (args.conditions !== undefined) {
      update.conditions = safeStringifyJson(args.conditions);
    }
    if (args.actions !== undefined) {
      update.actions = safeStringifyJson(args.actions);
    }
    if (args.priority !== undefined) update.priority = args.priority;
    if (args.cooldownMs !== undefined) update.cooldownMs = args.cooldownMs;
    if (args.tags !== undefined) update.tags = args.tags;
    if (args.metadata !== undefined) {
      update.metadata = safeStringifyJson(args.metadata);
    }

    // Update the rule
    await ctx.db.patch(args.id, update);
    return args.id;
  },
});

/**
 * Delete a rule
 */
export const deleteRule = mutation({
  args: {
    id: v.id("rules"),
  },
  handler: async (ctx, args) => {
    // Verify the rule exists
    const rule = await ctx.db.get(args.id);
    if (!rule) {
      throw new Error(`Rule with ID ${args.id} not found`);
    }

    // Delete the rule
    await ctx.db.delete(args.id);
    return args.id;
  },
});

/**
 * Enable a rule
 */
export const enableRule = mutation({
  args: {
    id: v.id("rules"),
  },
  handler: async (ctx, args) => {
    // Verify the rule exists
    const rule = await ctx.db.get(args.id);
    if (!rule) {
      throw new Error(`Rule with ID ${args.id} not found`);
    }

    // Enable the rule
    await ctx.db.patch(args.id, {
      isEnabled: true,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

/**
 * Disable a rule
 */
export const disableRule = mutation({
  args: {
    id: v.id("rules"),
  },
  handler: async (ctx, args) => {
    // Verify the rule exists
    const rule = await ctx.db.get(args.id);
    if (!rule) {
      throw new Error(`Rule with ID ${args.id} not found`);
    }

    // Disable the rule
    await ctx.db.patch(args.id, {
      isEnabled: false,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

// Rule Execution Queries

/**
 * Get rule executions for a specific rule
 */
export const getRuleExecutions = query({
  args: {
    ruleId: v.id("rules"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("ruleExecutions")
      .withIndex("by_rule", (q) => q.eq("ruleId", args.ruleId))
      .order("desc");

    if (args.limit) {
      query = query.take(args.limit);
    } else {
      query = query.take(10); // Default to 10 executions
    }

    const executions = await query.collect();

    // Parse the JSON strings
    return executions.map((execution) => ({
      ...execution,
      triggerData: safeParseJson(execution.triggerData, {}),
      details: safeParseJson(execution.details, {}),
    }));
  },
});

/**
 * Get execution logs for a specific rule execution
 */
export const getExecutionLogs = query({
  args: {
    executionId: v.id("ruleExecutions"),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("ruleExecutionLogs")
      .withIndex("by_execution", (q) => q.eq("executionId", args.executionId))
      .order("asc")
      .collect();

    // Parse the JSON strings in the data field
    return logs.map((log) => ({
      ...log,
      data: log.data ? safeParseJson(log.data, {}) : undefined,
    }));
  },
});

/**
 * Get action results for a specific rule execution
 */
export const getActionResults = query({
  args: {
    executionId: v.id("ruleExecutions"),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("actionResults")
      .withIndex("by_execution", (q) => q.eq("executionId", args.executionId))
      .collect();

    // Parse the JSON strings
    return results.map((result) => ({
      ...result,
      actionConfig: safeParseJson(result.actionConfig, {}),
      result: safeParseJson(result.result, {}),
    }));
  },
});

// Migration utilities

/**
 * Migrate Monday rules to the generic rules schema
 * This is an example of how to migrate existing rules to the new schema
 */
export const migrateMondayRules = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if migration has already been completed
    const migrationCheck = await ctx.db
      .query("migrations")
      .withIndex("by_name", (q) => q.eq("name", "monday-rules-to-generic"))
      .unique();

    if (migrationCheck) {
      return { migrated: 0, message: "Migration already completed" };
    }

    // This is just a placeholder for actual migration logic
    // In a real implementation, you would fetch the old rules and convert them

    // Mark migration as complete
    await ctx.db.insert("migrations", {
      name: "monday-rules-to-generic",
      completedAt: Date.now(),
      details: safeStringifyJson({
        migratedRules: 0,
        errors: [],
      }),
    });

    return { migrated: 0, message: "Migration completed" };
  },
});
