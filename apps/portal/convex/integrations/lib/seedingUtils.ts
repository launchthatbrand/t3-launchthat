/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

/**
 * Integration node data structure for seeding
 */
export interface IntegrationNodeSeed {
  identifier: string;
  name: string;
  category: "action" | "trigger" | "transformer" | "system";
  integrationType: string;
  description: string;
  inputSchema: string;
  outputSchema: string;
  configSchema: string;
  uiConfig?: string;
  version: string;
  deprecated?: boolean;
  tags?: string[];
}

/**
 * Validation schema for integration node seeds
 */
export const integrationNodeSeedValidator = v.object({
  identifier: v.string(),
  name: v.string(),
  category: v.string(),
  integrationType: v.string(),
  description: v.string(),
  inputSchema: v.string(),
  outputSchema: v.string(),
  configSchema: v.string(),
  uiConfig: v.optional(v.string()),
  version: v.string(),
  deprecated: v.optional(v.boolean()),
  tags: v.optional(v.array(v.string())),
});

/**
 * Check if an integration node already exists
 */
export async function integrationNodeExists(
  ctx: any,
  identifier: string,
  version?: string,
): Promise<boolean> {
  try {
    if (version) {
      const existing = await ctx.db
        .query("integrationNodes")
        .withIndex("by_version", (q: any) =>
          q.eq("identifier", identifier).eq("version", version),
        )
        .first();
      return !!existing;
    } else {
      const existing = await ctx.db
        .query("integrationNodes")
        .withIndex("by_identifier", (q: any) => q.eq("identifier", identifier))
        .first();
      return !!existing;
    }
  } catch (error) {
    console.warn(
      `Warning: Could not check if integration node exists: ${identifier}`,
      error,
    );
    return false;
  }
}

/**
 * Create or update an integration node
 */
export async function upsertIntegrationNode(
  ctx: any,
  nodeData: IntegrationNodeSeed,
  forceUpdate = false,
): Promise<{ action: "created" | "updated" | "skipped"; id?: string }> {
  try {
    const now = Date.now();

    // Check if node already exists
    const existing = await ctx.db
      .query("integrationNodes")
      .withIndex("by_version", (q: any) =>
        q.eq("identifier", nodeData.identifier).eq("version", nodeData.version),
      )
      .first();

    if (existing) {
      if (forceUpdate) {
        // Update existing node
        await ctx.db.patch(existing._id, {
          name: nodeData.name,
          category: nodeData.category,
          integrationType: nodeData.integrationType,
          description: nodeData.description,
          inputSchema: nodeData.inputSchema,
          outputSchema: nodeData.outputSchema,
          configSchema: nodeData.configSchema,
          uiConfig: nodeData.uiConfig,
          deprecated: nodeData.deprecated,
          tags: nodeData.tags,
          updatedAt: now,
        });
        return { action: "updated", id: existing._id };
      } else {
        return { action: "skipped", id: existing._id };
      }
    } else {
      // Create new node
      const id = await ctx.db.insert("integrationNodes", {
        ...nodeData,
        createdAt: now,
        updatedAt: now,
      });
      return { action: "created", id };
    }
  } catch (error) {
    console.error(
      `Error upserting integration node ${nodeData.identifier}:`,
      error,
    );
    throw error;
  }
}

/**
 * Batch upsert multiple integration nodes
 */
export async function batchUpsertIntegrationNodes(
  ctx: any,
  nodes: IntegrationNodeSeed[],
  forceUpdate = false,
): Promise<{
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}> {
  const result = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const node of nodes) {
    try {
      const upsertResult = await upsertIntegrationNode(ctx, node, forceUpdate);

      switch (upsertResult.action) {
        case "created":
          result.created++;
          break;
        case "updated":
          result.updated++;
          break;
        case "skipped":
          result.skipped++;
          break;
      }

      console.log(`✓ ${upsertResult.action}: ${node.identifier}`);
    } catch (error) {
      const errorMessage = `Failed to upsert ${node.identifier}: ${
        error instanceof Error ? error.message : String(error)
      }`;
      result.errors.push(errorMessage);
      console.error(errorMessage);
    }
  }

  return result;
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig(environment: string): {
  allowedIntegrations: string[];
  blockedIntegrations: string[];
  featureFlags: Record<string, boolean>;
} {
  const configs = {
    development: {
      allowedIntegrations: ["*"],
      blockedIntegrations: [],
      featureFlags: { experimentalFeatures: true },
    },
    staging: {
      allowedIntegrations: ["wordpress", "stripe", "monday", "system"],
      blockedIntegrations: ["experimental-*"],
      featureFlags: { experimentalFeatures: false },
    },
    production: {
      allowedIntegrations: ["wordpress", "stripe"],
      blockedIntegrations: ["beta-*", "experimental-*"],
      featureFlags: { experimentalFeatures: false },
    },
  };

  return configs[environment as keyof typeof configs] || configs.development;
}

/**
 * Filter integration nodes based on environment configuration
 */
export function filterNodesForEnvironment(
  nodes: IntegrationNodeSeed[],
  environment: string,
): IntegrationNodeSeed[] {
  const config = getEnvironmentConfig(environment);

  return nodes.filter((node) => {
    // Check if integration type is allowed
    if (
      !config.allowedIntegrations.includes("*") &&
      !config.allowedIntegrations.includes(node.integrationType)
    ) {
      return false;
    }

    // Check if integration type is blocked
    for (const blocked of config.blockedIntegrations) {
      if (blocked.endsWith("*")) {
        const prefix = blocked.slice(0, -1);
        if (node.integrationType.startsWith(prefix)) {
          return false;
        }
      } else if (node.integrationType === blocked) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Validate integration node data
 */
export function validateIntegrationNode(
  node: any,
): node is IntegrationNodeSeed {
  try {
    integrationNodeSeedValidator.parse(node);
    return true;
  } catch (error) {
    console.error(`Invalid integration node data:`, error);
    return false;
  }
}

/**
 * Performance timer utility
 */
export class PerformanceTimer {
  private startTime: number;
  private marks: Map<string, number> = new Map();

  constructor() {
    this.startTime = Date.now();
  }

  mark(label: string): void {
    this.marks.set(label, Date.now());
  }

  getDuration(label?: string): number {
    if (label && this.marks.has(label)) {
      return this.marks.get(label)! - this.startTime;
    }
    return Date.now() - this.startTime;
  }

  getElapsedSinceMark(label: string): number {
    const markTime = this.marks.get(label);
    if (!markTime) {
      throw new Error(`Mark '${label}' not found`);
    }
    return Date.now() - markTime;
  }

  report(): string {
    const total = this.getDuration();
    let report = `Total time: ${total}ms\n`;

    for (const [label, time] of this.marks) {
      const duration = time - this.startTime;
      report += `  ${label}: ${duration}ms\n`;
    }

    return report;
  }
}
