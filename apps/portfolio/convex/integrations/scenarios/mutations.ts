import type { Id } from "../../_generated/dataModel";
import { mutation } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Create a new integration scenario
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    ownerId: v.id("users"),
    status: v.optional(v.string()),
    schedule: v.optional(v.string()),
    // New: scenario classification and optional slug for addressable flows
    scenarioType: v.optional(
      v.union(v.literal("general"), v.literal("checkout")),
    ),
    slug: v.optional(v.string()),
  },
  returns: v.id("scenarios"),
  handler: async (ctx, args) => {
    // Verify the owner exists
    const owner = await ctx.db.get(args.ownerId);
    if (!owner) {
      throw new Error(`User with ID ${args.ownerId} not found`);
    }

    const now = Date.now();

    const scenarioType = args.scenarioType ?? "general";

    // For checkout scenarios, slug is required and must be unique
    if (scenarioType === "checkout") {
      const slug = (args.slug ?? "").trim();
      if (slug.length === 0) {
        throw new Error("Slug is required for checkout scenarios");
      }
      const existing = await ctx.db
        .query("scenarios")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();
      if (existing) {
        throw new Error("A scenario with this slug already exists");
      }
    }

    // Create the scenario with initial draft configuration
    const defaultDraftConfig = {
      triggerKey: "manual", // Default trigger key
      triggerConfig: {},
      enabled: false, // Start disabled
      schedule: args.schedule,
      metadata: {},
    };

    const scenarioId = await ctx.db.insert("scenarios", {
      name: args.name,
      description: args.description,
      status: args.status ?? "draft",
      draftConfig: defaultDraftConfig,
      publishedConfig: undefined, // No published version initially
      version: 1, // Start at version 1
      enabled: false, // Start disabled
      schedule: args.schedule,
      ownerId: args.ownerId,
      scenarioType,
      slug: args.slug,
      createdAt: now,
      updatedAt: now,
    });

    // Seed required nodes for checkout scenarios
    if (scenarioType === "checkout") {
      const checkoutNodeId = await ctx.db.insert("nodes", {
        scenarioId,
        type: "checkout",
        label: "Checkout",
        config: JSON.stringify({}),
        position: JSON.stringify({ x: 100, y: 100 }),
        order: 1,
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      });

      const confirmationNodeId = await ctx.db.insert("nodes", {
        scenarioId,
        type: "order_confirmation",
        label: "Order Confirmation",
        config: JSON.stringify({}),
        position: JSON.stringify({ x: 400, y: 100 }),
        order: 2,
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("nodeConnections", {
        scenarioId,
        sourceNodeId: checkoutNodeId,
        targetNodeId: confirmationNodeId,
        mapping: undefined,
        label: "to_confirmation",
        order: 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    return scenarioId;
  },
});

// Define an interface for the update fields
interface ScenarioUpdate {
  name?: string;
  description?: string;
  status?: string;
  schedule?: string;
  updatedAt: number;
}

/**
 * Update an existing scenario
 */
export const update = mutation({
  args: {
    id: v.id("scenarios"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    schedule: v.optional(v.string()),
  },
  returns: v.id("scenarios"),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Make sure the scenario exists
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error(`Scenario with ID ${id} not found`);
    }

    const now = Date.now();

    // Prepare the update with timestamp
    const updatedFields: ScenarioUpdate = {
      ...updates,
      updatedAt: now,
    };

    // Patch the document with all fields
    await ctx.db.patch(id, updatedFields);
    return id;
  },
});

/**
 * Delete a scenario and all its nodes and connections
 */
export const remove = mutation({
  args: {
    id: v.id("scenarios"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Make sure the scenario exists
    const scenario = await ctx.db.get(args.id);
    if (!scenario) {
      throw new Error(`Scenario with ID ${args.id} not found`);
    }

    // Get all nodes for this scenario
    const nodes = await ctx.db
      .query("nodes")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.id))
      .collect();

    // Get all connections for this scenario
    const connections = await ctx.db
      .query("nodeConnections")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.id))
      .collect();

    // Delete all connections first (to maintain referential integrity)
    for (const connection of connections) {
      await ctx.db.delete(connection._id);
    }

    // Delete all nodes
    for (const node of nodes) {
      await ctx.db.delete(node._id);
    }

    // Finally, delete the scenario
    await ctx.db.delete(args.id);

    return true;
  },
});

/**
 * Execute a scenario
 */
export const execute = mutation({
  args: {
    id: v.id("scenarios"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Make sure the scenario exists
    const scenario = await ctx.db.get(args.id);
    if (!scenario) {
      throw new Error(`Scenario with ID ${args.id} not found`);
    }

    // In a real implementation, this would execute the scenario
    // For now, we'll just simulate a successful execution
    const now = Date.now();

    // Update the scenario execution status
    await ctx.db.patch(args.id, {
      lastExecutedAt: now,
      lastExecutionResult: "success",
      lastExecutionError: undefined,
      updatedAt: now,
    });

    return {
      success: true,
      message: "Scenario executed successfully",
    };
  },
});

/**
 * Update just the status of a scenario
 */
export const updateStatus = mutation({
  args: {
    id: v.id("scenarios"),
    status: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Make sure the scenario exists
    const scenario = await ctx.db.get(args.id);
    if (!scenario) {
      throw new Error(`Scenario with ID ${args.id} not found`);
    }

    const now = Date.now();

    // Update the scenario status
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: now,
    });

    return {
      success: true,
      message: `Scenario status updated to ${args.status}`,
    };
  },
});

/**
 * Publish a scenario's draft configuration
 * Atomically swaps the draft to published and increments the version
 */
export const publishScenario = mutation({
  args: {
    id: v.id("scenarios"),
    publishedBy: v.optional(v.id("users")),
  },
  returns: v.object({
    success: v.boolean(),
    version: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const scenario = await ctx.db.get(args.id);
    if (!scenario) {
      throw new Error(`Scenario ${args.id} not found`);
    }

    // Note: draftConfig is always defined in schema, so this check is technically redundant
    // but kept for defensive programming

    const now = Date.now();
    const newVersion = scenario.version + 1;

    // Atomically update the scenario with the published config
    await ctx.db.patch(args.id, {
      publishedConfig: scenario.draftConfig,
      version: newVersion,
      status: "active", // Set to active when published
      enabled: scenario.draftConfig.enabled ?? true,
      updatedAt: now,
    });

    return {
      success: true,
      version: newVersion,
      message: `Scenario published successfully as version ${newVersion}`,
    };
  },
});

/**
 * Create a new draft version by copying from published configuration
 * Useful for making edits to published scenarios
 */
export const createDraftFromPublished = mutation({
  args: {
    id: v.id("scenarios"),
    copyFromPublished: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const scenario = await ctx.db.get(args.id);
    if (!scenario) {
      throw new Error(`Scenario ${args.id} not found`);
    }

    const now = Date.now();

    if (args.copyFromPublished && scenario.publishedConfig) {
      // Copy published config to draft for editing
      await ctx.db.patch(args.id, {
        draftConfig: scenario.publishedConfig,
        updatedAt: now,
      });

      return {
        success: true,
        message: "Draft created from published configuration",
      };
    }

    return {
      success: true,
      message: "Draft configuration is ready for editing",
    };
  },
});

/**
 * Update the draft configuration of a scenario
 */
export const updateDraftConfig = mutation({
  args: {
    id: v.id("scenarios"),
    draftConfig: v.object({
      triggerKey: v.string(),
      triggerConfig: v.any(),
      enabled: v.optional(v.boolean()),
      schedule: v.optional(v.string()),
      metadata: v.optional(v.any()),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const scenario = await ctx.db.get(args.id);
    if (!scenario) {
      throw new Error(`Scenario ${args.id} not found`);
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      draftConfig: args.draftConfig,
      updatedAt: now,
    });

    return {
      success: true,
      message: "Draft configuration updated successfully",
    };
  },
});

/**
 * Discard draft changes and revert to published configuration
 */
export const discardDraft = mutation({
  args: {
    id: v.id("scenarios"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const scenario = await ctx.db.get(args.id);
    if (!scenario) {
      throw new Error(`Scenario ${args.id} not found`);
    }

    if (!scenario.publishedConfig) {
      throw new Error("No published configuration to revert to");
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      draftConfig: scenario.publishedConfig,
      updatedAt: now,
    });

    return {
      success: true,
      message: "Draft changes discarded, reverted to published configuration",
    };
  },
});

/**
 * Get the diff between draft and published configurations
 */
export const getDraftDiff = mutation({
  args: {
    id: v.id("scenarios"),
  },
  returns: v.object({
    hasDiff: v.boolean(),
    draftConfig: v.any(),
    publishedConfig: v.any(),
    version: v.number(),
  }),
  handler: async (ctx, args) => {
    const scenario = await ctx.db.get(args.id);
    if (!scenario) {
      throw new Error(`Scenario ${args.id} not found`);
    }

    const hasDiff =
      JSON.stringify(scenario.draftConfig) !==
      JSON.stringify(scenario.publishedConfig);

    return {
      hasDiff,
      draftConfig: scenario.draftConfig,
      publishedConfig: scenario.publishedConfig,
      version: scenario.version,
    };
  },
});

/**
 * Clone an existing scenario
 * Creates a copy of the scenario with a new name and all associated nodes and connections
 */
export const cloneScenario = mutation({
  args: {
    sourceId: v.id("scenarios"),
    name: v.string(),
    description: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
  },
  returns: v.object({
    scenarioId: v.id("scenarios"),
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get the source scenario
    const sourceScenario = await ctx.db.get(args.sourceId);
    if (!sourceScenario) {
      throw new Error(`Source scenario ${args.sourceId} not found`);
    }

    const now = Date.now();
    const targetOwnerId = args.ownerId ?? sourceScenario.ownerId;

    // Create the cloned scenario with a fresh draft config
    const clonedScenarioId = await ctx.db.insert("scenarios", {
      name: args.name,
      description: args.description ?? `Clone of ${sourceScenario.name}`,
      status: "draft", // Always start as draft
      draftConfig: sourceScenario.draftConfig,
      publishedConfig: undefined, // No published version for clone
      version: 1, // Reset version to 1
      enabled: false, // Start disabled
      schedule: sourceScenario.schedule, // Copy the legacy schedule field
      ownerId: targetOwnerId,
      scenarioType: sourceScenario.scenarioType,
      slug: undefined, // Don't copy slug to avoid conflicts
      createdAt: now,
      updatedAt: now,
    });

    // Get all nodes from the source scenario
    const sourceNodes = await ctx.db
      .query("nodes")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.sourceId))
      .collect();

    // Get all connections from the source scenario
    const sourceConnections = await ctx.db
      .query("nodeConnections")
      .withIndex("by_scenario", (q) => q.eq("scenarioId", args.sourceId))
      .collect();

    // Map old node IDs to new node IDs for updating connections
    const nodeIdMap = new Map<Id<"nodes">, Id<"nodes">>();

    // Clone all nodes
    for (const sourceNode of sourceNodes) {
      const clonedNodeId = await ctx.db.insert("nodes", {
        scenarioId: clonedScenarioId,
        type: sourceNode.type,
        label: sourceNode.label,
        config: sourceNode.config,
        outputSchema: sourceNode.outputSchema,
        inputMapping: sourceNode.inputMapping,
        sampleData: sourceNode.sampleData,
        position: sourceNode.position,
        order: sourceNode.order,
        isSystem: sourceNode.isSystem,
        lockedProperties: sourceNode.lockedProperties,
        createdAt: now,
        updatedAt: now,
      });

      // Store the mapping for connection updates
      nodeIdMap.set(sourceNode._id, clonedNodeId);
    }

    // Clone all connections with updated node references
    for (const sourceConnection of sourceConnections) {
      const newSourceNodeId = nodeIdMap.get(sourceConnection.sourceNodeId);
      const newTargetNodeId = nodeIdMap.get(sourceConnection.targetNodeId);

      if (newSourceNodeId && newTargetNodeId) {
        await ctx.db.insert("nodeConnections", {
          scenarioId: clonedScenarioId,
          sourceNodeId: newSourceNodeId,
          targetNodeId: newTargetNodeId,
          mapping: sourceConnection.mapping,
          label: sourceConnection.label,
          branch: sourceConnection.branch,
          order: sourceConnection.order,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return {
      scenarioId: clonedScenarioId,
      success: true,
      message: `Scenario cloned successfully. Created ${sourceNodes.length} nodes and ${sourceConnections.length} connections.`,
    };
  },
});
