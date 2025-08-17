#!/usr/bin/env tsx

/**
 * Test Manifest Discovery System
 *
 * This script tests the manifest discovery functionality without requiring
 * Convex deployment. It's useful for development and debugging.
 */
import { promises as fs } from "fs";
import path from "path";

// Simulated manifest discovery (simplified version for testing)
interface MockDiscoveryConfig {
  directories: string[];
  filePattern: RegExp;
}

interface MockDiscoveryResult {
  manifests: any[];
  errors: any[];
  stats: {
    totalFiles: number;
    validManifests: number;
    invalidManifests: number;
    scanDuration: number;
  };
}

/**
 * Simple manifest discovery for testing
 */
async function testDiscoverManifests(
  config: MockDiscoveryConfig,
): Promise<MockDiscoveryResult> {
  const startTime = Date.now();
  const result: MockDiscoveryResult = {
    manifests: [],
    errors: [],
    stats: {
      totalFiles: 0,
      validManifests: 0,
      invalidManifests: 0,
      scanDuration: 0,
    },
  };

  for (const directory of config.directories) {
    try {
      console.log(`🔍 Scanning directory: ${directory}`);

      // Check if directory exists
      try {
        await fs.access(directory);
      } catch {
        console.log(`   ⚠️  Directory not found: ${directory}`);
        continue;
      }

      const files = await fs.readdir(directory);

      for (const file of files) {
        if (config.filePattern.test(file)) {
          result.stats.totalFiles++;
          const filePath = path.join(directory, file);

          try {
            console.log(`   📄 Processing: ${file}`);
            const content = await fs.readFile(filePath, "utf8");
            const manifest = JSON.parse(content);

            // Basic validation - check for required fields
            if (manifest.metadata?.id && manifest.metadata?.name) {
              result.manifests.push(manifest);
              result.stats.validManifests++;
              console.log(`   ✅ Valid: ${manifest.metadata.name}`);
            } else {
              result.errors.push({
                filePath,
                error: "Missing required metadata fields (id, name)",
              });
              result.stats.invalidManifests++;
              console.log(`   ❌ Invalid: Missing metadata`);
            }
          } catch (error) {
            result.errors.push({
              filePath,
              error: `Parse error: ${error instanceof Error ? error.message : "Unknown"}`,
            });
            result.stats.invalidManifests++;
            console.log(`   ❌ Parse error: ${file}`);
          }
        }
      }
    } catch (error) {
      result.errors.push({
        filePath: directory,
        error: `Directory scan failed: ${error instanceof Error ? error.message : "Unknown"}`,
      });
    }
  }

  result.stats.scanDuration = Date.now() - startTime;
  return result;
}

/**
 * Create test manifest files
 */
async function createTestManifests(): Promise<void> {
  const testDir = "./test-manifests";

  try {
    await fs.mkdir(testDir, { recursive: true });
    console.log(`📁 Created test directory: ${testDir}`);

    // Valid WordPress manifest
    const wordpressManifest = {
      metadata: {
        id: "wordpress-test",
        name: "WordPress Test",
        description: "Test WordPress integration",
        version: "1.0.0",
        type: "external",
        category: "cms",
      },
      actions: [
        {
          id: "create_post",
          name: "Create Post",
          description: "Create a new post",
          configSchema: {
            input: {
              schema: JSON.stringify({
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                },
              }),
            },
            output: {
              schema: JSON.stringify({
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  postId: { type: "number" },
                },
              }),
            },
            settings: {
              schema: JSON.stringify({
                type: "object",
                properties: {
                  defaultStatus: { type: "string" },
                },
              }),
            },
          },
        },
      ],
    };

    await fs.writeFile(
      path.join(testDir, "wordpress.manifest.json"),
      JSON.stringify(wordpressManifest, null, 2),
    );

    // Invalid manifest (missing required fields)
    const invalidManifest = {
      metadata: {
        // Missing 'id' field
        name: "Invalid Test",
      },
    };

    await fs.writeFile(
      path.join(testDir, "invalid.manifest.json"),
      JSON.stringify(invalidManifest, null, 2),
    );

    // Malformed JSON
    await fs.writeFile(
      path.join(testDir, "malformed.manifest.json"),
      '{ "metadata": { "id": "test", invalid json }',
    );

    console.log("✅ Created test manifest files");
  } catch (error) {
    console.error("❌ Failed to create test manifests:", error);
  }
}

/**
 * Clean up test files
 */
async function cleanup(): Promise<void> {
  try {
    await fs.rm("./test-manifests", { recursive: true, force: true });
    console.log("🧹 Cleaned up test files");
  } catch (error) {
    console.error("⚠️  Cleanup failed:", error);
  }
}

/**
 * Main test function
 */
async function main(): Promise<void> {
  console.log("🧪 Testing Manifest Discovery System");
  console.log("===================================\n");

  try {
    // Create test files
    await createTestManifests();
    console.log();

    // Test discovery
    const config: MockDiscoveryConfig = {
      directories: [
        "./test-manifests",
        "./src/integrations/manifests",
        "./manifests",
      ],
      filePattern: /\.manifest\.json$/,
    };

    const result = await testDiscoverManifests(config);

    console.log("\n📊 Discovery Results:");
    console.log("===================");
    console.log(`Total files scanned: ${result.stats.totalFiles}`);
    console.log(`Valid manifests: ${result.stats.validManifests}`);
    console.log(`Invalid manifests: ${result.stats.invalidManifests}`);
    console.log(`Errors: ${result.errors.length}`);
    console.log(`Duration: ${result.stats.scanDuration}ms`);

    if (result.errors.length > 0) {
      console.log("\n❌ Errors Found:");
      for (const error of result.errors) {
        console.log(`   ${error.filePath}: ${error.error}`);
      }
    }

    if (result.manifests.length > 0) {
      console.log("\n✅ Valid Manifests:");
      for (const manifest of result.manifests) {
        const actions = manifest.actions?.length ?? 0;
        const triggers = manifest.triggers?.length ?? 0;
        console.log(
          `   ${manifest.metadata.name} (${actions} actions, ${triggers} triggers)`,
        );
      }
    }

    console.log("\n🎉 Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    // Clean up
    await cleanup();
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  });
}
