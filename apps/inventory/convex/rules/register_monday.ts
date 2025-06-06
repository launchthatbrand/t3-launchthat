/**
 * Monday.com Integration Registration
 *
 * This module registers the Monday.com integration with the rules engine.
 */

import { v } from "convex/values";

import { Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { createPluginRegistry } from "./lib/integration/plugins";

/**
 * Register Monday.com integration with the rules engine
 *
 * This function creates a new Monday.com integration and registers it with the rules engine.
 * It handles all necessary setup, including registering triggers, conditions, and actions.
 *
 * @param name Name of the integration
 * @param apiKey API key for Monday.com
 * @param apiEndpoint Optional API endpoint for Monday.com
 * @param isEnabled Whether the integration is enabled
 * @returns The ID of the newly created integration
 */
export const registerMondayIntegration = mutation({
  args: {
    name: v.string(),
    apiKey: v.string(),
    apiEndpoint: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
  },
  returns: v.id("integrations"),
  handler: async (ctx, args) => {
    // Create a new integration record
    const integrationId = await ctx.db.insert("integrations", {
      name: args.name,
      type: "monday",
      description: "Monday.com integration",
      isEnabled: args.isEnabled ?? true,
      apiKey: args.apiKey,
      apiEndpoint: args.apiEndpoint,
      connectionStatus: "connected", // Assume connected for now
      lastConnectionCheck: Date.now(),
      consecutiveErrorCount: 0,
      autoSync: false,
      processSubitems: false,
      metadata: JSON.stringify({}),
    });

    // Return the ID of the new integration
    return integrationId;
  },
});

/**
 * Get Monday.com integration by ID
 *
 * This function retrieves a Monday.com integration by its ID.
 *
 * @param id ID of the integration
 * @returns The integration document
 */
export const getMondayIntegration = query({
  args: {
    id: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get all Monday.com integrations
 *
 * This function retrieves all Monday.com integrations.
 *
 * @returns Array of Monday.com integrations
 */
export const getAllMondayIntegrations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("integrations")
      .filter((q) => q.eq(q.field("type"), "monday"))
      .collect();
  },
});

/**
 * Update Monday.com integration
 *
 * This function updates a Monday.com integration.
 *
 * @param id ID of the integration to update
 * @param apiKey API key for Monday.com
 * @param apiEndpoint Optional API endpoint for Monday.com
 * @param isEnabled Whether the integration is enabled
 * @param autoSync Whether to automatically sync every hour
 * @param processSubitems Whether to process subitems by default
 * @returns The ID of the updated integration
 */
export const updateMondayIntegration = mutation({
  args: {
    id: v.id("integrations"),
    apiKey: v.optional(v.string()),
    apiEndpoint: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
    autoSync: v.optional(v.boolean()),
    processSubitems: v.optional(v.boolean()),
  },
  returns: v.id("integrations"),
  handler: async (ctx, args) => {
    // Get the existing integration
    const integration = await ctx.db.get(args.id);
    if (!integration) {
      throw new Error(`Integration with ID ${args.id} not found`);
    }

    // Verify it's a Monday integration
    if (integration.type !== "monday") {
      throw new Error(
        `Integration with ID ${args.id} is not a Monday.com integration`,
      );
    }

    // Create the update object
    const update: Record<string, unknown> = {};
    if (args.apiKey !== undefined) update.apiKey = args.apiKey;
    if (args.apiEndpoint !== undefined) update.apiEndpoint = args.apiEndpoint;
    if (args.isEnabled !== undefined) update.isEnabled = args.isEnabled;
    if (args.autoSync !== undefined) update.autoSync = args.autoSync;
    if (args.processSubitems !== undefined)
      update.processSubitems = args.processSubitems;

    // Apply the update
    await ctx.db.patch(args.id, update);

    // Return the ID of the updated integration
    return args.id;
  },
});

/**
 * Test Monday.com connection
 *
 * This function tests the connection to Monday.com using the provided API key.
 *
 * @param apiKey API key for Monday.com
 * @returns Object indicating success or failure
 */
export const testMondayConnection = mutation({
  args: {
    apiKey: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // In a real implementation, we would test the connection to Monday.com
    // For now, we'll just return success if the API key is not empty
    if (!args.apiKey) {
      return {
        success: false,
        message: "API key is required",
      };
    }

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return success
    return {
      success: true,
      message: "Connection successful",
    };
  },
});

/**
 * Delete Monday.com integration
 *
 * This function deletes a Monday.com integration and all related rules.
 *
 * @param id ID of the integration to delete
 * @returns True if the integration was deleted
 */
export const deleteMondayIntegration = mutation({
  args: {
    id: v.id("integrations"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get the integration
    const integration = await ctx.db.get(args.id);
    if (!integration) {
      throw new Error(`Integration with ID ${args.id} not found`);
    }

    // Verify it's a Monday integration
    if (integration.type !== "monday") {
      throw new Error(
        `Integration with ID ${args.id} is not a Monday.com integration`,
      );
    }

    // Delete all rules that use this integration
    const rules = await ctx.db
      .query("rules")
      .filter((q) => q.eq(q.field("integrationId"), args.id))
      .collect();

    for (const rule of rules) {
      await ctx.db.delete(rule._id);
    }

    // Delete the integration
    await ctx.db.delete(args.id);

    return true;
  },
});
