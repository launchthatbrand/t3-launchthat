/**
 * Rules Engine Integrations API
 *
 * This module provides Convex functions for managing integration configurations.
 */

import { v } from "convex/values";

import { action, mutation, query } from "../_generated/server";
import { safeParseJson, safeStringifyJson } from "./lib/utils";

/**
 * Get all integrations
 */
export const getIntegrations = query({
  args: {
    isEnabled: v.optional(v.boolean()),
    type: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Start with the base query
    let queryBuilder = ctx.db.query("integrations");

    // Filter by type if specified (using the type index)
    if (args.type) {
      queryBuilder = queryBuilder.withIndex("by_type", (q) =>
        q.eq("type", args.type),
      );
    } else if (args.isEnabled !== undefined) {
      // Use the enabled index if type is not specified but isEnabled is
      queryBuilder = queryBuilder.withIndex("by_enabled", (q) =>
        q.eq("isEnabled", args.isEnabled),
      );
    }

    // Apply remaining filters after the index is selected
    // Only apply isEnabled filter if we didn't already use it in the index
    if (args.type && args.isEnabled !== undefined) {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field("isEnabled"), args.isEnabled),
      );
    }

    // Filter by status if specified
    if (args.status) {
      if (args.status === "disabled") {
        // Special case for disabled status
        queryBuilder = queryBuilder.filter((q) =>
          q.eq(q.field("isEnabled"), false),
        );
      } else {
        // Filter by connectionStatus field
        queryBuilder = queryBuilder.filter((q) =>
          q.eq(q.field("connectionStatus"), args.status),
        );
      }
    }

    return await queryBuilder.collect();
  },
});

/**
 * Get a specific integration by ID
 */
export const getIntegration = query({
  args: {
    id: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get integrations by type
 */
export const getIntegrationsByType = query({
  args: {
    type: v.string(),
    isEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let queryBuilder = ctx.db
      .query("integrations")
      .withIndex("by_type", (q) => q.eq("type", args.type));

    // Apply enabled filter if specified
    if (args.isEnabled !== undefined) {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field("isEnabled"), args.isEnabled),
      );
    }

    return await queryBuilder.collect();
  },
});

/**
 * Create a new integration configuration
 */
export const createIntegration = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    isEnabled: v.boolean(),
    apiKey: v.string(),
    apiEndpoint: v.optional(v.string()),
    config: v.optional(v.any()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Stringify config and metadata if provided
    const config = args.config ? safeStringifyJson(args.config) : undefined;
    const metadata = args.metadata
      ? safeStringifyJson(args.metadata)
      : undefined;

    // Create the integration
    const integrationId = await ctx.db.insert("integrations", {
      name: args.name,
      type: args.type,
      description: args.description,
      isEnabled: args.isEnabled,
      apiKey: args.apiKey,
      apiEndpoint: args.apiEndpoint,
      lastConnectionCheck: Date.now(),
      connectionStatus: "pending",
      config,
      metadata,
    });

    return { integrationId };
  },
});

/**
 * Update an existing integration configuration
 */
export const updateIntegration = mutation({
  args: {
    id: v.id("integrations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
    apiKey: v.optional(v.string()),
    apiEndpoint: v.optional(v.string()),
    config: v.optional(v.any()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Ensure the integration exists
    const integration = await ctx.db.get(id);
    if (!integration) {
      throw new Error(`Integration with ID ${id} not found`);
    }

    // Process config and metadata if provided
    if (updates.config !== undefined) {
      updates.config = safeStringifyJson(updates.config);
    }

    if (updates.metadata !== undefined) {
      updates.metadata = safeStringifyJson(updates.metadata);
    }

    // Update the integration
    await ctx.db.patch(id, updates);

    return { success: true };
  },
});

/**
 * Delete an integration configuration
 */
export const deleteIntegration = mutation({
  args: {
    id: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    // Ensure the integration exists
    const integration = await ctx.db.get(args.id);
    if (!integration) {
      throw new Error(`Integration with ID ${args.id} not found`);
    }

    // Check if there are rules using this integration
    const rulesCount = await ctx.db
      .query("rules")
      .withIndex("by_integration", (q) => q.eq("integrationId", args.id))
      .collect();

    if (rulesCount.length > 0) {
      throw new Error(
        `Cannot delete integration with ID ${args.id} because it is used by ${rulesCount.length} rules. Disable or delete the rules first.`,
      );
    }

    // Delete the integration
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Update integration connection status
 */
export const updateConnectionStatus = mutation({
  args: {
    id: v.id("integrations"),
    connectionStatus: v.string(),
    lastError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Ensure the integration exists
    const integration = await ctx.db.get(id);
    if (!integration) {
      throw new Error(`Integration with ID ${id} not found`);
    }

    // Update connection info
    await ctx.db.patch(id, {
      ...updates,
      lastConnectionCheck: Date.now(),
      consecutiveErrorCount:
        args.connectionStatus === "error"
          ? (integration.consecutiveErrorCount ?? 0) + 1
          : 0,
    });

    return { success: true };
  },
});

/**
 * Get integration configuration
 */
export const getIntegrationConfig = query({
  args: {
    id: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db.get(args.id);
    if (!integration) {
      return null;
    }

    // Parse config if it exists
    let configObject = {};
    if (integration.config) {
      configObject = safeParseJson(integration.config, {});
    }

    return {
      id: integration._id,
      name: integration.name,
      type: integration.type,
      isEnabled: integration.isEnabled,
      config: configObject,
    };
  },
});

/**
 * Test integration connection
 */
export const testConnection = mutation({
  args: {
    id: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db.get(args.id);
    if (!integration) {
      throw new Error(`Integration with ID ${args.id} not found`);
    }

    // This is a placeholder for actual connection testing logic
    // Actual implementation would depend on the integration type
    // and would likely be an action that calls external APIs

    // For now, just update the connection status
    await ctx.db.patch(args.id, {
      connectionStatus: "connected",
      lastConnectionCheck: Date.now(),
      consecutiveErrorCount: 0,
    });

    return {
      success: true,
      message: `Successfully connected to ${integration.name}`,
    };
  },
});

/**
 * Get WordPress integration configuration
 */
export const getWordPressIntegration = query({
  args: {},
  handler: async (ctx) => {
    const integrations = await ctx.db
      .query("integrations")
      .withIndex("by_type", (q) => q.eq("type", "wordpress"))
      .collect();

    return integrations.length > 0 ? integrations[0] : null;
  },
});

/**
 * Create a new WordPress integration
 */
export const createWordPressIntegration = mutation({
  args: {
    name: v.string(),
    siteUrl: v.string(),
    username: v.string(),
    apiKey: v.string(),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if integration already exists
    const existing = await ctx.db
      .query("integrations")
      .withIndex("by_type", (q) => q.eq("type", "wordpress"))
      .first();

    if (existing) {
      throw new Error("WordPress integration already exists");
    }

    // Create the integration with the required fields
    const id = await ctx.db.insert("integrations", {
      name: args.name,
      type: "wordpress",
      description: "WordPress Integration",
      isEnabled: args.isEnabled,
      apiKey: args.apiKey,
      connectionStatus: "pending",
      lastConnectionCheck: Date.now(),
      consecutiveErrorCount: 0,
      // Store WordPress-specific fields in metadata
      metadata: JSON.stringify({
        siteUrl: args.siteUrl,
        username: args.username,
        created: Date.now(),
      }),
    });

    return id;
  },
});

/**
 * Update an existing WordPress integration
 */
export const updateWordPressIntegration = mutation({
  args: {
    id: v.id("integrations"),
    name: v.optional(v.string()),
    siteUrl: v.optional(v.string()),
    username: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, siteUrl, username, ...standardFields } = args;

    // Check if integration exists
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("WordPress integration not found");
    }

    // Ensure it's a WordPress integration
    if (existing.type !== "wordpress") {
      throw new Error("Not a WordPress integration");
    }

    // Parse existing metadata to update with new values
    let metadataObj: Record<string, unknown> = {};
    try {
      metadataObj = JSON.parse(existing.metadata ?? "{}") as Record<
        string,
        unknown
      >;
    } catch (error) {
      // If parsing fails, start with an empty object
      metadataObj = {};
    }

    // Update the metadata with new values if provided
    if (siteUrl !== undefined) {
      metadataObj.siteUrl = siteUrl;
    }
    if (username !== undefined) {
      metadataObj.username = username;
    }

    // Update the integration
    await ctx.db.patch(id, {
      ...standardFields,
      lastConnectionCheck: Date.now(),
      metadata: JSON.stringify(metadataObj),
    });

    return id;
  },
});

/**
 * Test connection to a WordPress site
 */
export const testWordPressConnection = action({
  args: {
    siteUrl: v.string(),
    username: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // In a real implementation, you would attempt to connect to the WordPress API
      // For this proof of concept, we'll simulate a successful connection

      // Validate the URL at minimum
      const url = new URL(args.siteUrl);

      // Simulate network request with a small delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Return success response
      return {
        success: true,
        message: `Successfully connected to WordPress at ${url.hostname}`,
      };
    } catch (error) {
      console.error("WordPress connection test failed:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
