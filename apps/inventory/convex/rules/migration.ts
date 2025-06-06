/**
 * Rules Migration API
 *
 * This module provides API functions for migrating existing rules from the
 * old integration-specific format to the new generic rules engine format.
 */

import { v } from "convex/values";

import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { migrateAllMondayRules, migrateMondayRule } from "./lib/migration";

/**
 * Migrate a specific Monday rule to the new format
 *
 * @param mondayRuleId The ID of the Monday rule to migrate
 * @param integrationId The ID of the Monday integration in the new system
 * @returns The ID of the newly created rule
 */
export const migrateMondayRuleById = mutation({
  args: {
    mondayRuleId: v.id("mondaySyncRules"),
    integrationId: v.id("integrations"),
    integrationName: v.optional(v.string()),
  },
  returns: v.id("rules"),
  handler: async (ctx, args) => {
    // Get the Monday rule
    const mondayRule = await ctx.db.get(args.mondayRuleId);
    if (!mondayRule) {
      throw new Error(`Monday rule with ID ${args.mondayRuleId} not found`);
    }

    // Get the integration to verify it exists
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) {
      throw new Error(`Integration with ID ${args.integrationId} not found`);
    }

    // Migrate the rule
    const rule = migrateMondayRule(
      mondayRule,
      args.integrationName ?? integration.name,
    );

    // Override the integrationId with the one provided
    rule.integrationId = args.integrationId as unknown as string;

    // Create the new rule
    const ruleId = await ctx.db.insert("rules", {
      name: rule.name,
      description: rule.description,
      enabled: rule.enabled,
      priority: rule.priority,
      integrationId: args.integrationId,
      integrationName: args.integrationName ?? integration.name,
      triggerType: rule.triggerType,
      triggerConfig: rule.triggerConfig,
      conditions: rule.conditions,
      actions: rule.actions,
      cooldownMs: rule.cooldownMs,
      lastExecuted: rule.lastExecuted,
      executionCount: rule.executionCount,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
      createdBy: rule.createdBy,
      metadata: {
        ...rule.metadata,
        originalMondayRuleId: args.mondayRuleId,
        migrationDate: Date.now(),
      },
    });

    // Return the ID of the new rule
    return ruleId;
  },
});

/**
 * Migrate all Monday rules to the new format
 *
 * @param integrationId The ID of the Monday integration in the new system
 * @returns The number of rules migrated
 */
export const migrateAllMondayRulesToNewFormat = mutation({
  args: {
    integrationId: v.id("integrations"),
    integrationName: v.optional(v.string()),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    // Get the integration to verify it exists and get its name
    const integration = await ctx.db.get(args.integrationId);
    if (!integration) {
      throw new Error(`Integration with ID ${args.integrationId} not found`);
    }

    // Get all Monday sync rules
    const mondayRules = await ctx.db.query("mondaySyncRules").collect();

    let migrationCount = 0;

    // Migrate each rule
    for (const mondayRule of mondayRules) {
      try {
        // Migrate the rule
        const rule = migrateMondayRule(
          mondayRule,
          args.integrationName ?? integration.name,
        );

        // Override the integrationId with the one provided
        rule.integrationId = args.integrationId as unknown as string;

        // Create the new rule
        await ctx.db.insert("rules", {
          name: rule.name,
          description: rule.description,
          enabled: rule.enabled,
          priority: rule.priority,
          integrationId: args.integrationId,
          integrationName: args.integrationName ?? integration.name,
          triggerType: rule.triggerType,
          triggerConfig: rule.triggerConfig,
          conditions: rule.conditions,
          actions: rule.actions,
          cooldownMs: rule.cooldownMs,
          lastExecuted: rule.lastExecuted,
          executionCount: rule.executionCount,
          createdAt: rule.createdAt,
          updatedAt: rule.updatedAt,
          createdBy: rule.createdBy,
          metadata: {
            ...rule.metadata,
            originalMondayRuleId: mondayRule._id,
            migrationDate: Date.now(),
          },
        });

        migrationCount++;
      } catch (error) {
        // Log the error but continue with other rules
        console.error(`Error migrating Monday rule ${mondayRule._id}:`, error);
      }
    }

    // Return the number of rules migrated
    return migrationCount;
  },
});

/**
 * Get migration status - how many rules have been migrated vs. total
 *
 * @returns An object with the total number of Monday rules and the number that have been migrated
 */
export const getMigrationStatus = query({
  args: {},
  returns: v.object({
    totalRules: v.number(),
    migratedRules: v.number(),
    pendingRules: v.number(),
  }),
  handler: async (ctx) => {
    // Get total count of Monday rules
    const totalRules = await ctx.db.query("mondaySyncRules").count();

    // Get count of migrated rules by checking metadata.originalMondayRuleId
    const migratedRulesIds = new Set<string>();

    // Query for rules that have originalMondayRuleId in metadata
    const migratedRules = await ctx.db.query("rules").collect();

    // Count unique originalMondayRuleId values
    for (const rule of migratedRules) {
      if (rule.metadata?.originalMondayRuleId) {
        migratedRulesIds.add(rule.metadata.originalMondayRuleId as string);
      }
    }

    const migratedCount = migratedRulesIds.size;
    const pendingCount = totalRules - migratedCount;

    return {
      totalRules,
      migratedRules: migratedCount,
      pendingRules: pendingCount,
    };
  },
});
