import {
  checkMigrationCompatibility,
  getAvailableMigrationPaths,
  migrateNodeConfig,
  migrateScenarioNodes,
} from "../lib/migrations";

import type { MigrationOptions } from "../lib/migrations";
import { action } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Migrates a single node configuration
 */
export const migrateNode = action({
  args: {
    nodeId: v.id("nodes"),
    newNodeType: v.optional(v.string()),
    dryRun: v.optional(v.boolean()),
    continueOnError: v.optional(v.boolean()),
    backupConfig: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    nodeId: v.id("nodes"),
    error: v.optional(
      v.object({
        code: v.string(),
        message: v.string(),
      }),
    ),
    oldType: v.optional(v.string()),
    newType: v.optional(v.string()),
    configChanged: v.optional(v.boolean()),
  }),
  handler: async (ctx, args) => {
    const options: MigrationOptions = {
      dryRun: args.dryRun,
      continueOnError: args.continueOnError,
      backupConfig: args.backupConfig,
    };

    // Create action context with correlation ID
    const actionContext = {
      ...ctx,
      correlationId: `migration_${args.nodeId}_${Date.now()}`,
    };

    return await migrateNodeConfig(
      actionContext,
      args.nodeId,
      args.newNodeType,
      options,
    );
  },
});

/**
 * Migrates all nodes in a scenario
 */
export const migrateScenario = action({
  args: {
    scenarioId: v.id("scenarios"),
    nodeTypeMappings: v.optional(v.any()), // Record<string, string> but v.record doesn't work well
    dryRun: v.optional(v.boolean()),
    continueOnError: v.optional(v.boolean()),
    backupConfig: v.optional(v.boolean()),
  },
  returns: v.object({
    successCount: v.number(),
    failureCount: v.number(),
    results: v.array(
      v.object({
        success: v.boolean(),
        nodeId: v.id("nodes"),
        error: v.optional(
          v.object({
            code: v.string(),
            message: v.string(),
          }),
        ),
        oldType: v.optional(v.string()),
        newType: v.optional(v.string()),
        configChanged: v.optional(v.boolean()),
      }),
    ),
    errors: v.array(
      v.object({
        nodeId: v.id("nodes"),
        error: v.string(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const options: MigrationOptions = {
      dryRun: args.dryRun,
      continueOnError: args.continueOnError,
      backupConfig: args.backupConfig,
    };

    // Create action context with correlation ID
    const actionContext = {
      ...ctx,
      correlationId: `scenario_migration_${args.scenarioId}_${Date.now()}`,
    };

    const nodeTypeMappings: Record<string, string> = args.nodeTypeMappings
      ? (args.nodeTypeMappings as Record<string, string>)
      : {};

    return await migrateScenarioNodes(
      actionContext,
      args.scenarioId,
      nodeTypeMappings,
      options,
    );
  },
});

/**
 * Checks migration compatibility for a node configuration
 */
export const checkCompatibility = action({
  args: {
    currentConfig: v.any(),
    targetType: v.string(),
  },
  returns: v.object({
    compatible: v.boolean(),
    issues: v.array(v.string()),
    canMigrate: v.boolean(),
  }),
  handler: async (_ctx, args) => {
    return await checkMigrationCompatibility(
      args.currentConfig,
      args.targetType,
    );
  },
});

/**
 * Gets available migration paths for a node type
 */
export const getAvailablePaths = action({
  args: {
    currentType: v.string(),
  },
  returns: v.array(v.string()),
  handler: (_ctx, args) => {
    return getAvailableMigrationPaths(args.currentType);
  },
});
