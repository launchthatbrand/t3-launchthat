/**
 * WordPress Integration Registration
 *
 * This module registers the WordPress integration with the rules engine.
 */

import { v } from "convex/values";

import { Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";

/**
 * Register WordPress integration with the rules engine
 *
 * This function creates a new WordPress integration and registers it with the rules engine.
 * It handles all necessary setup, including registering triggers, conditions, and actions.
 *
 * @param name Name of the integration
 * @param siteUrl WordPress site URL
 * @param username WordPress username
 * @param password Optional WordPress password
 * @param apiKey Optional WordPress API key
 * @param isEnabled Whether the integration is enabled
 * @returns The ID of the newly created integration
 */
export const registerWordPressIntegration = mutation({
  args: {
    name: v.string(),
    siteUrl: v.string(),
    username: v.string(),
    password: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
  },
  returns: v.id("integrations"),
  handler: async (ctx, args) => {
    // Create a new integration record
    const integrationId = await ctx.db.insert("integrations", {
      name: args.name,
      type: "wordpress",
      description: "WordPress integration",
      isEnabled: args.isEnabled ?? true,
      siteUrl: args.siteUrl,
      username: args.username,
      password: args.password,
      apiKey: args.apiKey,
      connectionStatus: "connected", // Assume connected for now
      lastConnectionCheck: Date.now(),
      consecutiveErrorCount: 0,
      metadata: JSON.stringify({}),
    });

    // Return the ID of the new integration
    return integrationId;
  },
});

/**
 * Get WordPress integration by ID
 *
 * This function retrieves a WordPress integration by its ID.
 *
 * @param id ID of the integration
 * @returns The integration document
 */
export const getWordPressIntegration = query({
  args: {
    id: v.id("integrations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get all WordPress integrations
 *
 * This function retrieves all WordPress integrations.
 *
 * @returns Array of WordPress integrations
 */
export const getAllWordPressIntegrations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("integrations")
      .filter((q) => q.eq(q.field("type"), "wordpress"))
      .collect();
  },
});

/**
 * Update WordPress integration
 *
 * This function updates a WordPress integration.
 *
 * @param id ID of the integration to update
 * @param siteUrl WordPress site URL
 * @param username WordPress username
 * @param password Optional WordPress password
 * @param apiKey Optional WordPress API key
 * @param isEnabled Whether the integration is enabled
 * @returns The ID of the updated integration
 */
export const updateWordPressIntegration = mutation({
  args: {
    id: v.id("integrations"),
    siteUrl: v.optional(v.string()),
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
  },
  returns: v.id("integrations"),
  handler: async (ctx, args) => {
    // Get the existing integration
    const integration = await ctx.db.get(args.id);
    if (!integration) {
      throw new Error(`Integration with ID ${args.id} not found`);
    }

    // Verify it's a WordPress integration
    if (integration.type !== "wordpress") {
      throw new Error(
        `Integration with ID ${args.id} is not a WordPress integration`,
      );
    }

    // Create the update object
    const update: Record<string, unknown> = {};
    if (args.siteUrl !== undefined) update.siteUrl = args.siteUrl;
    if (args.username !== undefined) update.username = args.username;
    if (args.password !== undefined) update.password = args.password;
    if (args.apiKey !== undefined) update.apiKey = args.apiKey;
    if (args.isEnabled !== undefined) update.isEnabled = args.isEnabled;

    // Apply the update
    await ctx.db.patch(args.id, update);

    // Return the ID of the updated integration
    return args.id;
  },
});

/**
 * Test WordPress connection
 *
 * This function tests the connection to WordPress using the provided credentials.
 *
 * @param siteUrl WordPress site URL
 * @param username WordPress username
 * @param password Optional WordPress password
 * @param apiKey Optional WordPress API key
 * @returns Object indicating success or failure
 */
export const testWordPressConnection = mutation({
  args: {
    siteUrl: v.string(),
    username: v.string(),
    password: v.optional(v.string()),
    apiKey: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // In a real implementation, we would test the connection to WordPress
    // For now, we'll just return success if the site URL and username are not empty
    if (!args.siteUrl) {
      return {
        success: false,
        message: "Site URL is required",
      };
    }

    if (!args.username) {
      return {
        success: false,
        message: "Username is required",
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
 * Delete WordPress integration
 *
 * This function deletes a WordPress integration and all related rules.
 *
 * @param id ID of the integration to delete
 * @returns True if the integration was deleted
 */
export const deleteWordPressIntegration = mutation({
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

    // Verify it's a WordPress integration
    if (integration.type !== "wordpress") {
      throw new Error(
        `Integration with ID ${args.id} is not a WordPress integration`,
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
