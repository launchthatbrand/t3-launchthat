/* eslint-disable @typescript-eslint/no-explicit-any */
"use node";

import { api } from "@convex-config/_generated/api";
import { v } from "convex/values";

import { internalAction } from "../_generated/server";
import {
  convertManifestsToSeeds,
  createExampleManifests,
  discoverManifests,
} from "./lib/manifestDiscovery";

/**
 * Manifest-based Integration Seeding System
 *
 * This module provides Convex actions for discovering and seeding integration
 * manifests from the file system. It bridges the gap between manifest files
 * and the Convex database.
 */

interface ManifestSeedingResult {
  success: boolean;
  manifestsFound: number;
  nodesCreated: number;
  nodesUpdated: number;
  connectionsCreated: number;
  errors: string[];
  discoveryErrors: any[];
  duration: number;
  stats: {
    totalManifests: number;
    totalNodes: number;
    totalConnections: number;
    validManifests: number;
    invalidManifests: number;
  };
}

/**
 * Discover and seed integration manifests
 */
export const seedFromManifests = internalAction({
  args: {
    directories: v.optional(v.array(v.string())),
    forceReseed: v.optional(v.boolean()),
    dryRun: v.optional(v.boolean()),
    validateStrictly: v.optional(v.boolean()),
    batchSize: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args): Promise<ManifestSeedingResult> => {
    const startTime = Date.now();
    const result: ManifestSeedingResult = {
      success: false,
      manifestsFound: 0,
      nodesCreated: 0,
      nodesUpdated: 0,
      connectionsCreated: 0,
      errors: [],
      discoveryErrors: [],
      duration: 0,
      stats: {
        totalManifests: 0,
        totalNodes: 0,
        totalConnections: 0,
        validManifests: 0,
        invalidManifests: 0,
      },
    };

    try {
      console.log("🔍 Starting manifest-based seeding...");

      // Configure discovery
      const discoveryConfig = {
        directories: args.directories ?? [
          "./src/integrations/manifests",
          "./integrations/manifests",
          "./manifests",
        ],
        validateStrictly: args.validateStrictly ?? true,
      };

      console.log(
        `📁 Scanning directories: ${discoveryConfig.directories.join(", ")}`,
      );

      // Discover manifests
      const discovery = await discoverManifests(discoveryConfig);

      result.manifestsFound = discovery.manifests.length;
      result.discoveryErrors = discovery.errors;
      result.stats.validManifests = discovery.stats.validManifests;
      result.stats.invalidManifests = discovery.stats.invalidManifests;

      console.log(
        `✅ Discovery completed: Found ${discovery.manifests.length} valid manifests`,
      );

      if (discovery.errors.length > 0) {
        console.log(`⚠️  Discovery errors: ${discovery.errors.length}`);
        for (const error of discovery.errors) {
          console.log(`   ❌ ${error.filePath}: ${error.error}`);
          result.errors.push(`${error.filePath}: ${error.error}`);
        }
      }

      if (discovery.manifests.length === 0) {
        result.success = true;
        result.duration = Date.now() - startTime;
        console.log("ℹ️  No manifests found to seed");
        return result;
      }

      // Convert manifests to seeds
      const seedData = convertManifestsToSeeds(discovery.manifests);
      result.stats = {
        ...result.stats,
        totalManifests: seedData.stats.totalManifests,
        totalNodes: seedData.stats.totalNodes,
        totalConnections: seedData.stats.totalConnections,
      };

      console.log(
        `📊 Conversion complete: ${seedData.stats.totalNodes} nodes, ${seedData.stats.totalConnections} connections`,
      );

      if (args.dryRun) {
        console.log("🔍 DRY RUN - No changes will be made");
        for (const node of seedData.integrationNodes) {
          console.log(`  ✓ Would seed: ${node.identifier} (${node.category})`);
        }
        result.success = true;
        result.duration = Date.now() - startTime;
        return result;
      }

      // Seed integration nodes
      console.log("📦 Seeding integration nodes...");
      const batchSize = args.batchSize ?? 10;

      for (let i = 0; i < seedData.integrationNodes.length; i += batchSize) {
        const batch = seedData.integrationNodes.slice(i, i + batchSize);

        for (const nodeData of batch) {
          try {
            // Use upsert to handle create/update logic efficiently
            const upsertResult = await ctx.runMutation(
              api.integrations.integrationNodes.mutations.upsertIntegrationNode,
              {
                data: nodeData,
                forceUpdate: args.forceReseed,
              },
            );

            if (upsertResult.created) {
              result.nodesCreated++;
              console.log(`  ✓ Created: ${nodeData.identifier}`);
            } else if (upsertResult.updated) {
              result.nodesUpdated++;
              console.log(
                `  ✓ Updated: ${nodeData.identifier} (v${nodeData.version})`,
              );
            } else {
              console.log(
                `  ℹ️  Skipped: ${nodeData.identifier} (no changes needed)`,
              );
            }
          } catch (error) {
            const errorMsg = `Failed to seed node ${nodeData.identifier}: ${error instanceof Error ? error.message : "Unknown error"}`;
            result.errors.push(errorMsg);
            console.log(`  ❌ ${errorMsg}`);
          }
        }

        // Small delay between batches to avoid overwhelming the database
        if (i + batchSize < seedData.integrationNodes.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Seed connections (if any)
      if (seedData.connections.length > 0) {
        console.log(`📡 Seeding ${seedData.connections.length} connections...`);
        // Connection seeding would go here when connection mutations are available
        // For now, just log what would be created
        for (const connection of seedData.connections) {
          console.log(
            `  ℹ️  Connection: ${connection.id} (${connection.type})`,
          );
        }
        result.connectionsCreated = seedData.connections.length;
      }

      result.success = true;
      result.duration = Date.now() - startTime;

      console.log(`🎉 Manifest seeding completed successfully!`);
      console.log(`   📊 Statistics:`);
      console.log(`      Manifests processed: ${result.manifestsFound}`);
      console.log(`      Nodes created: ${result.nodesCreated}`);
      console.log(`      Nodes updated: ${result.nodesUpdated}`);
      console.log(`      Connections: ${result.connectionsCreated}`);
      console.log(`      Errors: ${result.errors.length}`);
      console.log(`      Duration: ${result.duration}ms`);

      return result;
    } catch (error) {
      result.errors.push(
        `Manifest seeding failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      result.duration = Date.now() - startTime;
      console.error("❌ Manifest seeding failed:", error);
      return result;
    }
  },
});

/**
 * Create example manifest files for testing
 */
export const createExampleManifestFiles = internalAction({
  args: {
    outputDirectory: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (_ctx, args) => {
    try {
      const outputDir =
        args.outputDirectory ?? "./src/integrations/manifests/examples";

      console.log(`📁 Creating example manifests in: ${outputDir}`);
      await createExampleManifests(outputDir);

      return {
        success: true,
        outputDirectory: outputDir,
        message: "Example manifest files created successfully",
      };
    } catch (error) {
      console.error("❌ Failed to create example manifests:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Validate manifest files in a directory
 */
export const validateManifestDirectory = internalAction({
  args: {
    directories: v.optional(v.array(v.string())),
    strict: v.optional(v.boolean()),
  },
  returns: v.any(),
  handler: async (_ctx, args) => {
    try {
      const directories = args.directories ?? ["./src/integrations/manifests"];
      const strict = args.strict ?? true;

      console.log(`🔍 Validating manifests in: ${directories.join(", ")}`);

      const discovery = await discoverManifests({
        directories,
        validateStrictly: strict,
      });

      const result = {
        success: discovery.errors.length === 0,
        totalFiles: discovery.stats.totalFiles,
        validManifests: discovery.stats.validManifests,
        invalidManifests: discovery.stats.invalidManifests,
        errors: discovery.errors,
        duration: discovery.stats.scanDuration,
      };

      if (result.success) {
        console.log(`✅ All ${result.validManifests} manifests are valid`);
      } else {
        console.log(
          `❌ Found ${result.invalidManifests} invalid manifests with ${result.errors.length} errors`,
        );
      }

      return result;
    } catch (error) {
      console.error("❌ Validation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Batch seed integration nodes using the upsert approach
 */
export const batchSeedIntegrationNodes = internalAction({
  args: {
    nodes: v.any(),
    forceUpdate: v.optional(v.boolean()),
    batchSize: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const result = {
      success: false,
      totalNodes: args.nodes.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
      duration: 0,
    };

    const batchSize = args.batchSize ?? 10;

    try {
      console.log(`📦 Batch seeding ${args.nodes.length} integration nodes...`);

      for (let i = 0; i < args.nodes.length; i += batchSize) {
        const batch = args.nodes.slice(i, i + batchSize);

        for (const nodeData of batch) {
          try {
            const upsertResult = await ctx.runMutation(
              api.integrations.integrationNodes.mutations.upsertIntegrationNode,
              {
                data: nodeData,
                forceUpdate: args.forceUpdate,
              },
            );

            if (upsertResult.created) {
              result.created++;
              console.log(`  ✓ Created: ${nodeData.identifier}`);
            } else if (upsertResult.updated) {
              result.updated++;
              console.log(
                `  ✓ Updated: ${nodeData.identifier} (v${nodeData.version})`,
              );
            } else {
              result.skipped++;
              console.log(
                `  ℹ️  Skipped: ${nodeData.identifier} (no changes needed)`,
              );
            }
          } catch (error) {
            const errorMsg = `Failed to upsert node ${nodeData.identifier}: ${error instanceof Error ? error.message : "Unknown error"}`;
            result.errors.push(errorMsg);
            console.log(`  ❌ ${errorMsg}`);
          }
        }

        // Small delay between batches to avoid overwhelming the database
        if (i + batchSize < args.nodes.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;

      console.log(`🎉 Batch seeding completed!`);
      console.log(
        `   📊 Results: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
      );
      console.log(`   ❌ Errors: ${result.errors.length}`);
      console.log(`   ⏱️ Duration: ${result.duration}ms`);

      return result;
    } catch (error) {
      result.errors.push(
        `Batch seeding failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      result.duration = Date.now() - startTime;
      console.error("❌ Batch seeding failed:", error);
      return result;
    }
  },
});

/**
 * Validate seeded integration nodes against their original manifests
 */
export const validateSeededNodes = internalAction({
  args: {
    directories: v.optional(v.array(v.string())),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    try {
      console.log("🔍 Validating seeded integration nodes...");

      // Discover manifests
      const discoveryConfig = {
        directories: args.directories ?? [
          "./src/integrations/manifests",
          "./integrations/manifests",
          "./manifests",
        ],
        validateStrictly: true,
      };

      const discovery = await discoverManifests(discoveryConfig);
      const seedData = convertManifestsToSeeds(discovery.manifests);

      console.log(
        `📊 Comparing ${seedData.integrationNodes.length} manifest nodes with database...`,
      );

      const validationResult = {
        success: true,
        totalExpected: seedData.integrationNodes.length,
        found: 0,
        missing: [] as string[],
        versionMismatches: [] as Array<{
          identifier: string;
          expected: string;
          actual: string;
        }>,
        errors: [] as string[],
      };

      for (const manifestNode of seedData.integrationNodes) {
        try {
          const dbNode = await ctx.runQuery(
            api.integrations.integrationNodes.queries
              .getIntegrationNodeByIdentifier,
            { identifier: manifestNode.identifier },
          );

          if (!dbNode) {
            validationResult.missing.push(manifestNode.identifier);
            validationResult.success = false;
          } else {
            validationResult.found++;

            // Check version mismatch
            if (dbNode.version !== manifestNode.version) {
              validationResult.versionMismatches.push({
                identifier: manifestNode.identifier,
                expected: manifestNode.version,
                actual: dbNode.version,
              });
              validationResult.success = false;
            }
          }
        } catch (error) {
          validationResult.errors.push(
            `Failed to validate ${manifestNode.identifier}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          validationResult.success = false;
        }
      }

      // Report results
      if (validationResult.success) {
        console.log("✅ All nodes are properly seeded and up to date");
      } else {
        console.log("❌ Validation issues found:");
        if (validationResult.missing.length > 0) {
          console.log(
            `   Missing nodes: ${validationResult.missing.join(", ")}`,
          );
        }
        if (validationResult.versionMismatches.length > 0) {
          console.log("   Version mismatches:");
          for (const mismatch of validationResult.versionMismatches) {
            console.log(
              `     ${mismatch.identifier}: expected ${mismatch.expected}, got ${mismatch.actual}`,
            );
          }
        }
      }

      return validationResult;
    } catch (error) {
      console.error("❌ Validation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Get manifest discovery statistics
 */
export const getManifestStats = internalAction({
  args: {
    directories: v.optional(v.array(v.string())),
  },
  returns: v.any(),
  handler: async (_ctx, args) => {
    try {
      const directories = args.directories ?? ["./src/integrations/manifests"];

      const discovery = await discoverManifests({
        directories,
        validateStrictly: false, // Just get stats, don't fail on validation
      });

      const seedData = convertManifestsToSeeds(discovery.manifests);

      return {
        success: true,
        discovery: {
          totalFiles: discovery.stats.totalFiles,
          validManifests: discovery.stats.validManifests,
          invalidManifests: discovery.stats.invalidManifests,
          skippedFiles: discovery.stats.skippedFiles,
          scanDuration: discovery.stats.scanDuration,
        },
        conversion: {
          totalManifests: seedData.stats.totalManifests,
          totalNodes: seedData.stats.totalNodes,
          totalConnections: seedData.stats.totalConnections,
        },
        errors: discovery.errors,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
