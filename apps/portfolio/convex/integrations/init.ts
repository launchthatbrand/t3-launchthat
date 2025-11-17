/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/require-await */
import { v } from "convex/values";

import type { MutationCtx } from "../_generated/server";
import { internalMutation } from "../_generated/server";
import { HARDCODED_INTEGRATION_NODES } from "./hardcodedSeeds";

/**
 * Result interface for seeding operations
 */
export interface SeedingResult {
  integrationNodesCreated: number;
  actionsCreated: number;
  triggersCreated: number;
  connectionsCreated: number;
  errors: string[];
  duration: number;
  environment: string;
  timestamp: number;
}

/**
 * Seeding configuration interface
 */
export interface SeedingConfig {
  environment?: string;
  forceReseed?: boolean;
  integrationIds?: string[];
  dryRun?: boolean;
  batchSize?: number;
}

/**
 * Core seeding function using Convex internalMutation pattern
 *
 * This function implements the foundation for reliable, type-safe integration seeding:
 * - Idempotent operations (safe to run multiple times)
 * - Comprehensive error handling and logging
 * - Type-safe operations against Convex schema
 * - Performance monitoring and metrics
 * - Environment-aware seeding strategies
 */
export const seedIntegrations = internalMutation({
  args: {
    environment: v.optional(v.string()),
    forceReseed: v.optional(v.boolean()),
    integrationIds: v.optional(v.array(v.string())),
    dryRun: v.optional(v.boolean()),
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    integrationNodesCreated: v.number(),
    actionsCreated: v.number(),
    triggersCreated: v.number(),
    connectionsCreated: v.number(),
    errors: v.array(v.string()),
    duration: v.number(),
    environment: v.string(),
    timestamp: v.number(),
    dryRun: v.boolean(),
    summary: v.string(),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<SeedingResult & { dryRun: boolean; summary: string }> => {
    const startTime = Date.now();
    const timestamp = Date.now();
    const environment = args.environment ?? "development";
    const forceReseed = args.forceReseed ?? false;
    const dryRun = args.dryRun ?? false;
    const batchSize = args.batchSize ?? 10;

    console.log(
      `🌱 Starting integration seeding - Environment: ${environment}, Force: ${forceReseed}, DryRun: ${dryRun}`,
    );

    const result: SeedingResult = {
      integrationNodesCreated: 0,
      actionsCreated: 0,
      triggersCreated: 0,
      connectionsCreated: 0,
      errors: [],
      duration: 0,
      environment,
      timestamp,
    };

    try {
      // Step 1: Validate environment and configuration
      await validateSeedingEnvironment(ctx, environment, result);

      // Step 2: Check if seeding is needed (unless forced)
      if (!forceReseed && !dryRun) {
        const seedingNeeded = await checkIfSeedingNeeded(
          ctx,
          args.integrationIds,
        );
        if (!seedingNeeded) {
          console.log("✅ Seeding not needed - integrations already exist");
          result.duration = Date.now() - startTime;
          return {
            ...result,
            dryRun,
            summary:
              "Seeding skipped - integrations already exist. Use forceReseed=true to override.",
          };
        }
      }

      // Step 3: Initialize seeding log entry
      const seedingLogId = await initializeSeedingLog(ctx, environment, dryRun);

      // Step 4: Perform the actual seeding
      if (dryRun) {
        await performDryRunSeeding(ctx, args, result);
      } else {
        await performActualSeeding(ctx, args, result, batchSize);
      }

      // Step 5: Finalize seeding log
      await finalizeSeedingLog(ctx, seedingLogId, result, "completed");

      console.log(`✅ Seeding completed successfully in ${result.duration}ms`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      result.errors.push(errorMessage);
      console.error(`❌ Seeding failed: ${errorMessage}`);

      // Log the error for debugging
      console.error("Full error details:", error);
    } finally {
      result.duration = Date.now() - startTime;
    }

    const summary = generateSeedingSummary(result, dryRun);
    console.log(summary);

    return {
      ...result,
      dryRun,
      summary,
    };
  },
});

/**
 * Validate the seeding environment and configuration
 */
function validateSeedingEnvironment(
  _ctx: MutationCtx,
  environment: string,
  result: SeedingResult,
): void {
  const validEnvironments = ["development", "staging", "production"];

  if (!validEnvironments.includes(environment)) {
    const error = `Invalid environment: ${environment}. Must be one of: ${validEnvironments.join(", ")}`;
    result.errors.push(error);
    throw new Error(error);
  }

  console.log(`✓ Environment validated: ${environment}`);
}

/**
 * Check if seeding is needed by looking for existing integration nodes
 */
async function checkIfSeedingNeeded(
  ctx: any,
  specificIds?: string[],
): Promise<boolean> {
  try {
    if (specificIds && specificIds.length > 0) {
      // Check if specific integrations exist
      for (const id of specificIds) {
        const existing = await ctx.db
          .query("integrationNodes")
          .withIndex("by_identifier", (q: any) => q.eq("identifier", id))
          .first();
        if (!existing) {
          return true; // At least one doesn't exist, seeding needed
        }
      }
      return false; // All specified integrations exist
    } else {
      // Check if any integration nodes exist
      const existing = await ctx.db.query("integrationNodes").first();
      return !existing; // Seeding needed if no nodes exist
    }
  } catch (error) {
    console.warn(
      "Warning: Could not check existing integrations, proceeding with seeding",
    );
    return true;
  }
}

/**
 * Initialize a seeding log entry for audit trail
 */
async function initializeSeedingLog(
  ctx: any,
  environment: string,
  dryRun: boolean,
): Promise<string> {
  try {
    // For now, we'll just log to console since we may not have a seeding_logs table yet
    const logId = `seed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(
      `📝 Seeding log initialized: ${logId} (Environment: ${environment}, DryRun: ${dryRun})`,
    );
    return logId;
  } catch (error) {
    console.warn("Warning: Could not initialize seeding log:", error);
    return "unknown";
  }
}

/**
 * Perform a dry run of the seeding process
 */
async function performDryRunSeeding(
  ctx: any,
  args: any,
  result: SeedingResult,
): Promise<void> {
  console.log("🏃 Performing dry run seeding...");

  // In a dry run, we simulate what would be created without actually creating it
  for (const nodeData of HARDCODED_INTEGRATION_NODES) {
    if (
      !args.integrationIds ||
      args.integrationIds.includes(nodeData.identifier)
    ) {
      result.integrationNodesCreated++;
      if (nodeData.category === "action") {
        result.actionsCreated++;
      } else if (nodeData.category === "trigger") {
        result.triggersCreated++;
      }
      console.log(
        `  ✓ Would create: ${nodeData.identifier} (${nodeData.category})`,
      );
    }
  }

  console.log(
    `🔍 Dry run complete - Would create ${result.integrationNodesCreated} integration nodes`,
  );
}

/**
 * Perform the actual seeding process
 */
async function performActualSeeding(
  ctx: any,
  args: any,
  result: SeedingResult,
  batchSize: number,
): Promise<void> {
  console.log("🚀 Performing actual seeding...");

  // For now, this is a placeholder implementation
  // In Task 2, we'll implement the actual hard-coded integration seeding

  try {
    // Phase 1: Hard-coded integration seeding
    console.log("📦 Seeding hard-coded integrations...");

    let nodesCreated = 0;
    let nodesUpdated = 0;

    // Process hard-coded nodes in batches
    for (let i = 0; i < HARDCODED_INTEGRATION_NODES.length; i += batchSize) {
      const batch = HARDCODED_INTEGRATION_NODES.slice(i, i + batchSize);

      for (const nodeData of batch) {
        try {
          // Check if node already exists
          const existing = await ctx.db
            .query("integrationNodes")
            .withIndex("by_identifier", (q: any) =>
              q.eq("identifier", nodeData.identifier),
            )
            .first();

          if (existing && !args.forceReseed) {
            continue; // Skip existing nodes unless forcing
          }

          // Prepare node record
          const now = Date.now();
          const nodeRecord = {
            identifier: nodeData.identifier,
            name: nodeData.name,
            category: nodeData.category,
            integrationType: nodeData.integrationType,
            description: nodeData.description,
            inputSchema: nodeData.inputSchema,
            outputSchema: nodeData.outputSchema,
            configSchema: nodeData.configSchema,
            uiConfig: nodeData.uiConfig,
            version: nodeData.version,
            deprecated: nodeData.deprecated ?? false,
            tags: nodeData.tags ?? [],
            createdAt: now,
            updatedAt: now,
          };

          if (existing) {
            // For updates, preserve createdAt but update updatedAt
            const updateRecord = {
              ...nodeRecord,
              createdAt: existing.createdAt,
            };
            await ctx.db.patch(existing._id, updateRecord);
            nodesUpdated++;
          } else {
            await ctx.db.insert("integrationNodes", nodeRecord);
            nodesCreated++;
          }
        } catch (error) {
          const errorMsg = `Failed to process node ${nodeData.identifier}: ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    }

    // Update results
    result.integrationNodesCreated += nodesCreated;
    result.actionsCreated += nodesUpdated; // Count updates as actions for now

    console.log(
      `✅ Hard-coded seeding completed: ${nodesCreated} created, ${nodesUpdated} updated`,
    );
  } catch (error) {
    const errorMessage = `Seeding failed: ${error instanceof Error ? error.message : String(error)}`;
    result.errors.push(errorMessage);
    throw error;
  }
}

/**
 * Finalize the seeding log entry
 */
async function finalizeSeedingLog(
  ctx: any,
  logId: string,
  result: SeedingResult,
  status: "completed" | "failed",
): Promise<void> {
  try {
    console.log(`📋 Finalizing seeding log ${logId} with status: ${status}`);
    console.log(`   - Integration Nodes: ${result.integrationNodesCreated}`);
    console.log(`   - Actions: ${result.actionsCreated}`);
    console.log(`   - Triggers: ${result.triggersCreated}`);
    console.log(`   - Connections: ${result.connectionsCreated}`);
    console.log(`   - Errors: ${result.errors.length}`);
    console.log(`   - Duration: ${result.duration}ms`);
  } catch (error) {
    console.warn("Warning: Could not finalize seeding log:", error);
  }
}

/**
 * Generate a human-readable summary of the seeding results
 */
function generateSeedingSummary(
  result: SeedingResult,
  dryRun: boolean,
): string {
  const mode = dryRun ? "DRY RUN" : "ACTUAL";
  const status = result.errors.length > 0 ? "FAILED" : "SUCCESS";

  let summary = `\n🌱 SEEDING ${mode} - ${status}\n`;
  summary += `Environment: ${result.environment}\n`;
  summary += `Duration: ${result.duration}ms\n`;
  summary += `Timestamp: ${new Date(result.timestamp).toISOString()}\n\n`;

  summary += `📊 Results:\n`;
  summary += `  • Integration Nodes: ${result.integrationNodesCreated}\n`;
  summary += `  • Actions: ${result.actionsCreated}\n`;
  summary += `  • Triggers: ${result.triggersCreated}\n`;
  summary += `  • Connections: ${result.connectionsCreated}\n`;

  if (result.errors.length > 0) {
    summary += `\n❌ Errors (${result.errors.length}):\n`;
    result.errors.forEach((error, index) => {
      summary += `  ${index + 1}. ${error}\n`;
    });
  }

  summary += `\n`;

  return summary;
}

/**
 * Utility function to safely get environment from various sources
 */
export function getEnvironment(): string {
  // In a real implementation, this might check:
  // - Environment variables
  // - Convex deployment metadata
  // - Configuration files
  return process.env.NODE_ENV || "development";
}

/**
 * Utility function for batch processing to avoid overwhelming the database
 */
export async function processBatch<T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await processor(batch);

    // Small delay between batches to avoid overwhelming the system
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

/**
 * Export as default for easy CLI access via `convex run integrations/init`
 */
export default seedIntegrations;
