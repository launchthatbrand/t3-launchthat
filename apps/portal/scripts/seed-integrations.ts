#!/usr/bin/env tsx

/**
 * Integration Seeding CLI Script
 *
 * This script provides a convenient command-line interface for running
 * the integration seeding system with various options.
 */
import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api";

// Get Convex URL from environment
const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

// Create client only when needed (not for help)
let client: ConvexHttpClient;

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    environment: "development",
    forceReseed: false,
    dryRun: false,
    integrationIds: undefined as string[] | undefined,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--environment":
      case "-e":
        options.environment = args[++i];
        break;
      case "--force":
      case "-f":
        options.forceReseed = true;
        break;
      case "--dry-run":
      case "-d":
        options.dryRun = true;
        break;
      case "--integrations":
      case "-i":
        options.integrationIds = args[++i]?.split(",");
        break;
      default:
        console.error(`❌ Unknown argument: ${arg}`);
        process.exit(1);
    }
  }

  return options;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
🌱 Integration Seeding CLI

Usage: tsx scripts/seed-integrations.ts [options]

Options:
  -h, --help                     Show this help message
  -e, --environment <env>        Set environment (development, staging, production)
  -f, --force                    Force reseed even if integrations exist
  -d, --dry-run                  Perform a dry run (no actual changes)
  -i, --integrations <ids>       Comma-separated list of integration IDs to seed

Examples:
  tsx scripts/seed-integrations.ts --dry-run
  tsx scripts/seed-integrations.ts --environment staging --force
  tsx scripts/seed-integrations.ts --integrations wordpress_create_post,stripe_create_charge
  tsx scripts/seed-integrations.ts --environment production --dry-run

Environment Variables:
  CONVEX_URL                     Required: URL to your Convex deployment
  NEXT_PUBLIC_CONVEX_URL         Alternative to CONVEX_URL
`);
}

/**
 * Format duration in a human-readable way
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Main execution function
 */
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  // Check for Convex URL after help check
  if (!CONVEX_URL) {
    console.error("❌ Error: CONVEX_URL environment variable is required");
    process.exit(1);
  }

  // Initialize client
  client = new ConvexHttpClient(CONVEX_URL!);

  console.log("🌱 Integration Seeding CLI");
  console.log("==========================\n");

  const startTime = Date.now();

  try {
    console.log("📋 Configuration:");
    console.log(`   Environment: ${options.environment}`);
    console.log(`   Force Reseed: ${options.forceReseed}`);
    console.log(`   Dry Run: ${options.dryRun}`);
    console.log(
      `   Integration IDs: ${options.integrationIds?.join(", ") || "all"}`,
    );
    console.log(`   Convex URL: ${CONVEX_URL}\n`);

    console.log("🚀 Starting seeding process...\n");

    // Call the seeding function
    const result = await client.mutation(
      api.integrations.init.seedIntegrations,
      {
        environment: options.environment,
        forceReseed: options.forceReseed,
        dryRun: options.dryRun,
        integrationIds: options.integrationIds,
      },
    );

    const duration = Date.now() - startTime;

    console.log("\n" + "=".repeat(50));
    console.log("📊 SEEDING COMPLETED");
    console.log("=".repeat(50));

    console.log(`\n📈 Results:`);
    console.log(`   Mode: ${result.dryRun ? "DRY RUN" : "ACTUAL"}`);
    console.log(`   Environment: ${result.environment}`);
    console.log(
      `   Status: ${result.errors.length > 0 ? "❌ FAILED" : "✅ SUCCESS"}`,
    );
    console.log(`   Total Duration: ${formatDuration(duration)}`);
    console.log(`   Server Duration: ${formatDuration(result.duration)}`);

    console.log(`\n📦 Items Processed:`);
    console.log(`   Integration Nodes: ${result.integrationNodesCreated}`);
    console.log(`   Actions: ${result.actionsCreated}`);
    console.log(`   Triggers: ${result.triggersCreated}`);
    console.log(`   Connections: ${result.connectionsCreated}`);

    if (result.errors.length > 0) {
      console.log(`\n❌ Errors (${result.errors.length}):`);
      result.errors.forEach((error: string, index: number) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      process.exit(1);
    } else {
      console.log(`\n🎉 Seeding completed successfully!`);

      if (result.dryRun) {
        console.log(
          `\n💡 This was a dry run. To actually perform the seeding, run without --dry-run`,
        );
      }
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ Seeding failed after ${formatDuration(duration)}`);
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );

    if (error instanceof Error && error.stack) {
      console.error(`\nStack trace:`);
      console.error(error.stack);
    }

    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
}

export { main };
