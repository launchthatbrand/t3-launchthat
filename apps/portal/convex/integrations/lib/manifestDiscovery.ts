/* eslint-disable @typescript-eslint/no-explicit-any */
"use node";

import { promises as fs } from "fs";
import path from "path";

import type { IntegrationManifest } from "./manifestTypes";
import {
  manifestToSeed,
  validateManifest,
  validateManifestWithErrors,
} from "./manifestTypes";

/**
 * Manifest Discovery System
 *
 * This module provides functions to discover, validate, and load integration
 * manifests from the file system. It supports recursive directory scanning
 * and comprehensive validation.
 */

// Discovery configuration
export interface DiscoveryConfig {
  directories: string[];
  filePattern?: RegExp;
  recursive?: boolean;
  maxDepth?: number;
  excludePatterns?: RegExp[];
  includeMetadata?: boolean;
  validateStrictly?: boolean;
}

// Discovery result interface
export interface DiscoveryResult {
  manifests: IntegrationManifest[];
  errors: {
    filePath: string;
    error: string;
    details?: string[];
  }[];
  stats: {
    totalFiles: number;
    validManifests: number;
    invalidManifests: number;
    skippedFiles: number;
    scanDuration: number;
  };
}

// File metadata interface
export interface ManifestFileInfo {
  path: string;
  size: number;
  modified: Date;
  manifest: IntegrationManifest;
}

/**
 * Default discovery configuration
 */
export const DEFAULT_DISCOVERY_CONFIG: DiscoveryConfig = {
  directories: ["./src/integrations/manifests"],
  filePattern: /\.manifest\.json$/,
  recursive: true,
  maxDepth: 5,
  excludePatterns: [/node_modules/, /\.git/, /dist/, /build/, /\.next/],
  includeMetadata: false,
  validateStrictly: true,
};

/**
 * Discover integration manifests from the file system
 */
export async function discoverManifests(
  config: Partial<DiscoveryConfig> = {},
): Promise<DiscoveryResult> {
  const startTime = Date.now();
  const fullConfig = { ...DEFAULT_DISCOVERY_CONFIG, ...config };

  const result: DiscoveryResult = {
    manifests: [],
    errors: [],
    stats: {
      totalFiles: 0,
      validManifests: 0,
      invalidManifests: 0,
      skippedFiles: 0,
      scanDuration: 0,
    },
  };

  console.log("🔍 Starting manifest discovery...");
  console.log(`📁 Scanning directories: ${fullConfig.directories.join(", ")}`);

  try {
    // Scan each directory
    for (const directory of fullConfig.directories) {
      try {
        await scanDirectory(directory, fullConfig, result, 0);
      } catch (error) {
        result.errors.push({
          filePath: directory,
          error: `Failed to scan directory: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }

    result.stats.scanDuration = Date.now() - startTime;

    console.log(
      `✅ Discovery complete: Found ${result.stats.validManifests} valid manifests`,
    );
    console.log(
      `⚠️  Errors: ${result.stats.invalidManifests} invalid, ${result.errors.length} errors`,
    );
    console.log(`⏱️  Duration: ${result.stats.scanDuration}ms`);

    return result;
  } catch (error) {
    result.errors.push({
      filePath: "root",
      error: `Discovery failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
    result.stats.scanDuration = Date.now() - startTime;
    return result;
  }
}

/**
 * Recursively scan a directory for manifest files
 */
async function scanDirectory(
  directory: string,
  config: DiscoveryConfig,
  result: DiscoveryResult,
  depth: number,
): Promise<void> {
  // Check depth limit
  if (config.maxDepth && depth > config.maxDepth) {
    return;
  }

  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      // Check exclude patterns
      if (config.excludePatterns?.some((pattern) => pattern.test(fullPath))) {
        result.stats.skippedFiles++;
        continue;
      }

      if (entry.isDirectory() && config.recursive) {
        // Recursively scan subdirectories
        await scanDirectory(fullPath, config, result, depth + 1);
      } else if (entry.isFile()) {
        // Check if file matches pattern
        if (config.filePattern?.test(entry.name)) {
          result.stats.totalFiles++;
          await processManifestFile(fullPath, config, result);
        } else {
          result.stats.skippedFiles++;
        }
      }
    }
  } catch (error) {
    result.errors.push({
      filePath: directory,
      error: `Failed to read directory: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

/**
 * Process a single manifest file
 */
async function processManifestFile(
  filePath: string,
  config: DiscoveryConfig,
  result: DiscoveryResult,
): Promise<void> {
  try {
    console.log(`📄 Processing: ${filePath}`);

    // Read file content
    const content = await fs.readFile(filePath, "utf8");

    // Parse JSON
    let manifestData: any;
    try {
      manifestData = JSON.parse(content);
    } catch (parseError) {
      result.errors.push({
        filePath,
        error: `Invalid JSON: ${parseError instanceof Error ? parseError.message : "Parse error"}`,
      });
      result.stats.invalidManifests++;
      return;
    }

    // Validate manifest
    if (config.validateStrictly) {
      const validation = validateManifestWithErrors(manifestData);
      if (!validation.valid) {
        result.errors.push({
          filePath,
          error: "Manifest validation failed",
          details: validation.errors,
        });
        result.stats.invalidManifests++;
        return;
      }
      result.manifests.push(validation.manifest!);
    } else {
      // Basic validation
      if (validateManifest(manifestData)) {
        result.manifests.push(manifestData);
      } else {
        result.errors.push({
          filePath,
          error: "Basic manifest validation failed",
        });
        result.stats.invalidManifests++;
        return;
      }
    }

    result.stats.validManifests++;
    console.log(
      `✅ Valid manifest: ${manifestData.metadata?.name || "Unknown"}`,
    );
  } catch (error) {
    result.errors.push({
      filePath,
      error: `Failed to process file: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
    result.stats.invalidManifests++;
  }
}

/**
 * Discover manifests from specific directories with detailed file info
 */
export async function discoverManifestsWithMetadata(
  config: Partial<DiscoveryConfig> = {},
): Promise<{
  manifests: ManifestFileInfo[];
  errors: DiscoveryResult["errors"];
  stats: DiscoveryResult["stats"];
}> {
  const discovery = await discoverManifests({
    ...config,
    includeMetadata: true,
  });

  // Get file metadata for each manifest
  const manifestsWithMetadata: ManifestFileInfo[] = [];

  for (const manifest of discovery.manifests) {
    try {
      // Find the file path for this manifest (this is a simplified approach)
      // In a real implementation, you'd track file paths during discovery
      const manifestPath = `unknown_${manifest.metadata.id}.manifest.json`;
      const stats = await fs.stat(manifestPath).catch(() => null);

      manifestsWithMetadata.push({
        path: manifestPath,
        size: stats?.size ?? 0,
        modified: stats?.mtime ?? new Date(),
        manifest,
      });
    } catch (error) {
      // Skip metadata if we can't get it
      manifestsWithMetadata.push({
        path: `unknown_${manifest.metadata.id}.manifest.json`,
        size: 0,
        modified: new Date(),
        manifest,
      });
    }
  }

  return {
    manifests: manifestsWithMetadata,
    errors: discovery.errors,
    stats: discovery.stats,
  };
}

/**
 * Watch directory for manifest changes (basic implementation)
 */
export class ManifestWatcher {
  private watchers: fs.FSWatcher[] = [];
  private config: DiscoveryConfig;
  private lastDiscovery?: DiscoveryResult;

  constructor(config: Partial<DiscoveryConfig> = {}) {
    this.config = { ...DEFAULT_DISCOVERY_CONFIG, ...config };
  }

  async start(
    onChange?: (result: DiscoveryResult) => void | Promise<void>,
  ): Promise<void> {
    console.log("👀 Starting manifest watcher...");

    for (const directory of this.config.directories) {
      try {
        const watcher = fs.watch(
          directory,
          { recursive: true },
          async (eventType, filename) => {
            if (filename && this.config.filePattern?.test(filename)) {
              console.log(`📝 Manifest file changed: ${filename}`);

              // Re-discover manifests
              const result = await discoverManifests(this.config);
              this.lastDiscovery = result;

              if (onChange) {
                await onChange(result);
              }
            }
          },
        );

        this.watchers.push(watcher);
        console.log(`👀 Watching: ${directory}`);
      } catch (error) {
        console.error(`Failed to watch directory ${directory}:`, error);
      }
    }

    // Initial discovery
    this.lastDiscovery = await discoverManifests(this.config);
    if (onChange) {
      await onChange(this.lastDiscovery);
    }
  }

  stop(): void {
    console.log("🛑 Stopping manifest watcher...");
    this.watchers.forEach((watcher) => watcher.close());
    this.watchers = [];
  }

  getLastResult(): DiscoveryResult | undefined {
    return this.lastDiscovery;
  }
}

/**
 * Utility function to convert discovered manifests to seeding format
 */
export function convertManifestsToSeeds(manifests: IntegrationManifest[]): {
  integrationNodes: any[];
  connections: any[];
  stats: {
    totalManifests: number;
    totalNodes: number;
    totalConnections: number;
  };
} {
  const allNodes: any[] = [];
  const allConnections: any[] = [];

  for (const manifest of manifests) {
    const { integrationNodes, connections } = manifestToSeed(manifest);
    allNodes.push(...integrationNodes);
    allConnections.push(...connections);
  }

  return {
    integrationNodes: allNodes,
    connections: allConnections,
    stats: {
      totalManifests: manifests.length,
      totalNodes: allNodes.length,
      totalConnections: allConnections.length,
    },
  };
}

/**
 * Validate a single manifest file
 */
export async function validateManifestFile(filePath: string): Promise<{
  valid: boolean;
  manifest?: IntegrationManifest;
  errors: string[];
}> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const manifestData = JSON.parse(content);
    return validateManifestWithErrors(manifestData);
  } catch (error) {
    return {
      valid: false,
      errors: [
        `File error: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
    };
  }
}

/**
 * Create example manifest files for testing/documentation
 */
export async function createExampleManifests(outputDir: string): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });

  // WordPress example manifest
  const wordpressManifest: IntegrationManifest = {
    metadata: {
      id: "wordpress",
      name: "WordPress",
      description: "WordPress content management system integration",
      version: "1.0.0",
      type: "external",
      category: "cms",
      icon: "FileText",
      color: "#21759B",
      author: "Integration Team",
      keywords: ["wordpress", "cms", "blog", "content"],
      tags: ["popular", "cms"],
    },
    connections: [
      {
        id: "wordpress-basic",
        name: "WordPress Basic Auth",
        type: "basic_auth",
        authSchema: JSON.stringify({
          type: "object",
          properties: {
            baseUrl: { type: "string", format: "uri" },
            username: { type: "string" },
            password: { type: "string" },
          },
          required: ["baseUrl", "username", "password"],
        }),
        testEndpoint: "/wp-json/wp/v2/users/me",
        description:
          "Connect using WordPress username and application password",
      },
    ],
    actions: [
      {
        id: "create_post",
        name: "Create Post",
        description: "Create a new WordPress post",
        category: "content",
        configSchema: {
          input: {
            schema: JSON.stringify({
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" },
                status: {
                  type: "string",
                  enum: ["publish", "draft", "private"],
                },
              },
            }),
            description: "Post data to create",
          },
          output: {
            schema: JSON.stringify({
              type: "object",
              properties: {
                success: { type: "boolean" },
                postId: { type: "number" },
                postUrl: { type: "string" },
              },
            }),
            description: "Result of post creation",
          },
          settings: {
            schema: JSON.stringify({
              type: "object",
              properties: {
                defaultStatus: { type: "string", default: "draft" },
                categories: { type: "array", items: { type: "string" } },
              },
            }),
            description: "Configuration settings for post creation",
          },
        },
        endpoint: "/wp-json/wp/v2/posts",
        method: "POST",
        bodyTemplate: `{
        "title": "{{input.title}}",
        "content": "{{input.content}}",
        "status": "{{input.status || settings.defaultStatus}}"
      }`,
      },
    ],
  };

  await fs.writeFile(
    path.join(outputDir, "wordpress.manifest.json"),
    JSON.stringify(wordpressManifest, null, 2),
  );

  // Slack example manifest
  const slackManifest: IntegrationManifest = {
    metadata: {
      id: "slack",
      name: "Slack",
      description: "Team communication platform integration",
      version: "1.0.0",
      type: "external",
      category: "communication",
      icon: "MessageSquare",
      color: "#4A154B",
      author: "Integration Team",
      keywords: ["slack", "messaging", "team", "communication"],
      tags: ["popular", "messaging"],
    },
    connections: [
      {
        id: "slack-oauth2",
        name: "Slack OAuth2",
        type: "oauth2",
        authSchema: JSON.stringify({
          type: "object",
          properties: {
            access_token: { type: "string" },
            team_id: { type: "string" },
            user_id: { type: "string" },
          },
          required: ["access_token"],
        }),
        testEndpoint: "/api/auth.test",
        description: "Connect using Slack OAuth2 flow",
      },
    ],
    actions: [
      {
        id: "send_message",
        name: "Send Message",
        description: "Send a message to a Slack channel",
        category: "messaging",
        configSchema: {
          input: {
            schema: JSON.stringify({
              type: "object",
              properties: {
                channel: { type: "string" },
                text: { type: "string" },
                attachments: { type: "array" },
              },
              required: ["channel", "text"],
            }),
            description: "Message data to send",
          },
          output: {
            schema: JSON.stringify({
              type: "object",
              properties: {
                success: { type: "boolean" },
                messageId: { type: "string" },
                timestamp: { type: "string" },
              },
            }),
            description: "Result of message sending",
          },
          settings: {
            schema: JSON.stringify({
              type: "object",
              properties: {
                defaultChannel: { type: "string" },
                username: { type: "string" },
                iconEmoji: { type: "string" },
              },
            }),
            description: "Default message settings",
          },
        },
        endpoint: "/api/chat.postMessage",
        method: "POST",
      },
    ],
    triggers: [
      {
        id: "message_received",
        name: "Message Received",
        description: "Triggered when a new message is received in a channel",
        category: "messaging",
        type: "webhook",
        configSchema: {
          input: {
            schema: JSON.stringify({ type: "object" }),
            description: "Webhook payload from Slack",
          },
          output: {
            schema: JSON.stringify({
              type: "object",
              properties: {
                channel: { type: "string" },
                user: { type: "string" },
                text: { type: "string" },
                timestamp: { type: "string" },
              },
            }),
            description: "Processed message data",
          },
          settings: {
            schema: JSON.stringify({
              type: "object",
              properties: {
                channels: { type: "array", items: { type: "string" } },
                keywords: { type: "array", items: { type: "string" } },
              },
            }),
            description: "Trigger configuration",
          },
        },
        webhookPath: "/webhooks/slack/message",
      },
    ],
  };

  await fs.writeFile(
    path.join(outputDir, "slack.manifest.json"),
    JSON.stringify(slackManifest, null, 2),
  );

  console.log(`📁 Created example manifests in: ${outputDir}`);
}
