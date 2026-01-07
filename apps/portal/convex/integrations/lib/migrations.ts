import { ErrorCode, createError } from "./errors";

import type { ActionContext } from "./registries";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import { nodeRegistry } from "./registries";

/**
 * Result of a node migration operation
 */
export interface MigrationResult {
  success: boolean;
  nodeId: Id<"nodes">;
  error?: {
    code: string;
    message: string;
  };
  oldType?: string;
  newType?: string;
  configChanged?: boolean;
}

/**
 * Batch migration result for multiple nodes
 */
export interface BatchMigrationResult {
  successCount: number;
  failureCount: number;
  results: MigrationResult[];
  errors: { nodeId: Id<"nodes">; error: string }[];
}

/**
 * Options for migration operations
 */
export interface MigrationOptions {
  dryRun?: boolean; // If true, validate but don't apply changes
  continueOnError?: boolean; // If true, continue migrating other nodes even if some fail
  backupConfig?: boolean; // If true, store the old config as backup
}

/**
 * Migrates a single node configuration when the node type changes or evolves
 *
 * This function handles:
 * 1. Type validation and compatibility checking
 * 2. Configuration migration using the node's migrate function
 * 3. Schema validation of the migrated configuration
 * 4. Atomic update of the node record
 *
 * @param ctx Action context for database operations
 * @param nodeId ID of the node to migrate
 * @param newNodeType New node type to migrate to (optional, uses current type if not provided)
 * @param options Migration options
 * @returns Promise resolving to migration result
 */
export async function migrateNodeConfig(
  ctx: ActionContext,
  nodeId: Id<"nodes">,
  newNodeType?: string,
  options: MigrationOptions = {},
): Promise<MigrationResult> {
  try {
    // Get the current node
    const node = await ctx.runQuery(
      internal.integrations.nodes.queries.getById,
      {
        id: nodeId,
      },
    );

    if (!node) {
      return {
        success: false,
        nodeId,
        error: {
          code: ErrorCode.NOT_FOUND,
          message: `Node ${nodeId} not found`,
        },
      };
    }

    const targetType = newNodeType || node.type;
    const oldType = node.type;

    // Get the node definition for the target type
    let nodeDefinition;
    try {
      nodeDefinition = nodeRegistry.get(targetType);
    } catch (error) {
      return {
        success: false,
        nodeId,
        oldType,
        newType: targetType,
        error: {
          code: ErrorCode.INVALID_CONFIG,
          message: `Node type '${targetType}' not found in registry`,
        },
      };
    }

    // Parse the current configuration
    let currentConfig;
    try {
      currentConfig =
        typeof node.config === "string" ? JSON.parse(node.config) : node.config;
    } catch (error) {
      return {
        success: false,
        nodeId,
        oldType,
        newType: targetType,
        error: {
          code: ErrorCode.INVALID_CONFIG,
          message: `Failed to parse current node configuration: ${error}`,
        },
      };
    }

    let migratedConfig = currentConfig;
    let configChanged = false;

    // If we're changing types or the node definition has a migrate function, apply migration
    if (oldType !== targetType || nodeDefinition.migrate) {
      if (!nodeDefinition.migrate) {
        return {
          success: false,
          nodeId,
          oldType,
          newType: targetType,
          error: {
            code: ErrorCode.MIGRATION_NOT_SUPPORTED,
            message: `Node type '${targetType}' does not support migration from '${oldType}'`,
          },
        };
      }

      try {
        migratedConfig = nodeDefinition.migrate(currentConfig);
        configChanged =
          JSON.stringify(currentConfig) !== JSON.stringify(migratedConfig);
      } catch (error) {
        return {
          success: false,
          nodeId,
          oldType,
          newType: targetType,
          error: {
            code: ErrorCode.MIGRATION_FAILED,
            message: `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        };
      }
    }

    // Validate the migrated config against the target schema
    try {
      nodeDefinition.configSchema.parse(migratedConfig);
    } catch (error) {
      return {
        success: false,
        nodeId,
        oldType,
        newType: targetType,
        configChanged,
        error: {
          code: ErrorCode.INVALID_CONFIG,
          message: `Migrated configuration failed validation: ${error instanceof Error ? error.message : String(error)}`,
        },
      };
    }

    // If this is a dry run, return success without applying changes
    if (options.dryRun) {
      return {
        success: true,
        nodeId,
        oldType,
        newType: targetType,
        configChanged,
      };
    }

    // Apply the migration by updating the node
    const updateData: {
      type?: string;
      config?: string;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (oldType !== targetType) {
      updateData.type = targetType;
    }

    if (configChanged) {
      updateData.config = JSON.stringify(migratedConfig);
    }

    // Only update if there are actual changes
    if (updateData.type || updateData.config) {
      await ctx.runMutation(internal.integrations.nodes.mutations.update, {
        id: nodeId,
        ...updateData,
      });
    }

    return {
      success: true,
      nodeId,
      oldType,
      newType: targetType,
      configChanged,
    };
  } catch (error) {
    return {
      success: false,
      nodeId,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: `Unexpected error during migration: ${error instanceof Error ? error.message : String(error)}`,
      },
    };
  }
}

/**
 * Migrates all nodes in a scenario
 *
 * Useful when updating a scenario's nodes to new types or versions
 *
 * @param ctx Action context
 * @param scenarioId ID of the scenario whose nodes to migrate
 * @param nodeTypeMappings Optional mapping of old type -> new type
 * @param options Migration options
 * @returns Promise resolving to batch migration result
 */
export async function migrateScenarioNodes(
  ctx: ActionContext,
  scenarioId: Id<"scenarios">,
  nodeTypeMappings: Record<string, string> = {},
  options: MigrationOptions = {},
): Promise<BatchMigrationResult> {
  try {
    // Get all nodes in the scenario
    const nodes = await ctx.runQuery(
      internal.integrations.nodes.queries.getByScenario,
      {
        scenarioId,
      },
    );

    const results: MigrationResult[] = [];
    const errors: { nodeId: Id<"nodes">; error: string }[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Migrate each node
    for (const node of nodes) {
      const newType = nodeTypeMappings[node.type] || undefined;

      try {
        const result = await migrateNodeConfig(ctx, node._id, newType, options);
        results.push(result);

        if (result.success) {
          successCount++;
        } else {
          failureCount++;
          errors.push({
            nodeId: node._id,
            error: result.error?.message || "Unknown error",
          });
        }
      } catch (error) {
        failureCount++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        errors.push({
          nodeId: node._id,
          error: errorMessage,
        });

        results.push({
          success: false,
          nodeId: node._id,
          error: {
            code: ErrorCode.INTERNAL_ERROR,
            message: errorMessage,
          },
        });
      }

      // If continueOnError is false and we hit an error, stop processing
      if (!options.continueOnError && failureCount > 0) {
        break;
      }
    }

    return {
      successCount,
      failureCount,
      results,
      errors,
    };
  } catch (error) {
    return {
      successCount: 0,
      failureCount: 1,
      results: [],
      errors: [
        {
          nodeId: scenarioId as unknown as Id<"nodes">, // Type hack for the error case
          error: `Failed to get scenario nodes: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}

/**
 * Checks if a node configuration is compatible with a target node type
 *
 * @param currentConfig Current node configuration
 * @param targetType Target node type
 * @returns Promise resolving to compatibility check result
 */
export async function checkMigrationCompatibility(
  currentConfig: unknown,
  targetType: string,
): Promise<{
  compatible: boolean;
  issues: string[];
  canMigrate: boolean;
}> {
  const issues: string[] = [];

  try {
    const nodeDefinition = nodeRegistry.get(targetType);

    // If there's no migrate function, we can only check direct compatibility
    if (!nodeDefinition.migrate) {
      try {
        nodeDefinition.configSchema.parse(currentConfig);
        return {
          compatible: true,
          issues: [],
          canMigrate: false,
        };
      } catch (error) {
        issues.push(`Configuration is not directly compatible: ${error}`);
        return {
          compatible: false,
          issues,
          canMigrate: false,
        };
      }
    }

    // Try the migration
    try {
      const migratedConfig = nodeDefinition.migrate(currentConfig);
      nodeDefinition.configSchema.parse(migratedConfig);

      return {
        compatible: true,
        issues: [],
        canMigrate: true,
      };
    } catch (error) {
      issues.push(`Migration would fail: ${error}`);
      return {
        compatible: false,
        issues,
        canMigrate: true,
      };
    }
  } catch (error) {
    issues.push(`Target node type '${targetType}' not found in registry`);
    return {
      compatible: false,
      issues,
      canMigrate: false,
    };
  }
}

/**
 * Gets available migration paths for a node type
 *
 * @param currentType Current node type
 * @returns List of node types that the current type can migrate to
 */
export function getAvailableMigrationPaths(currentType: string): string[] {
  const availablePaths: string[] = [];

  // Get all registered node types
  const allNodes = nodeRegistry.getAll();

  for (const nodeDefinition of allNodes) {
    // Skip the current type
    if (nodeDefinition.type === currentType) {
      continue;
    }

    // If the target has a migrate function, it might accept our config
    if (nodeDefinition.migrate) {
      availablePaths.push(nodeDefinition.type);
    }
  }

  return availablePaths;
}
