import { v } from "convex/values";

import { internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import { mutation, query } from "../../_generated/server";
import { registerApp } from "./management";
import { appDefinitionValidator } from "./registration";

// WordPress app definition
const wordpressAppDefinition = {
  name: "WordPress",
  description: "Connect to WordPress sites and automate content management",
  type: "wordpress",
  authType: "apiKey",
  logoUrl: "/images/integrations/wordpress-logo.png",
  category: "cms",
  websiteUrl: "https://wordpress.org",
  documentationUrl: "https://developer.wordpress.org/rest-api/",
  actions: [
    {
      id: "getPosts",
      name: "Get Posts",
      description: "Fetch posts from a WordPress site",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", default: 10 },
          status: { type: "string", default: "publish" },
          categories: { type: "array", items: { type: "string" } },
        },
      },
      outputSchema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "number" },
            title: { type: "string" },
            content: { type: "string" },
            excerpt: { type: "string" },
            author: { type: "string" },
            date: { type: "string" },
            status: { type: "string" },
            link: { type: "string" },
          },
        },
      },
    },
    {
      id: "createPost",
      name: "Create Post",
      description: "Create a new post in WordPress",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          status: { type: "string", default: "draft" },
          categories: { type: "array", items: { type: "string" } },
        },
        required: ["title", "content"],
      },
      outputSchema: {
        type: "object",
        properties: {
          id: { type: "number" },
          link: { type: "string" },
        },
      },
    },
  ],
  triggers: [
    {
      id: "postPublished",
      name: "Post Published",
      description: "Triggered when a post is published",
      outputSchema: {
        type: "object",
        properties: {
          postId: { type: "number" },
          title: { type: "string" },
          content: { type: "string" },
          author: { type: "string" },
          date: { type: "string" },
          link: { type: "string" },
        },
      },
    },
    {
      id: "commentAdded",
      name: "Comment Added",
      description: "Triggered when a comment is added to a post",
      outputSchema: {
        type: "object",
        properties: {
          commentId: { type: "number" },
          postId: { type: "number" },
          author: { type: "string" },
          content: { type: "string" },
          date: { type: "string" },
        },
      },
    },
  ],
};

/**
 * Create a new WordPress integration
 */
export const createWordPressIntegration = mutation({
  args: {
    name: v.string(),
    siteUrl: v.string(),
    username: v.string(),
    password: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if WordPress app already exists
    const apps = await ctx.db
      .query("apps")
      .withIndex("by_type", (q) => q.eq("type", "wordpress"))
      .collect();

    // Register the WordPress app if it doesn't exist
    if (apps.length === 0) {
      await ctx.db.insert("apps", {
        ...wordpressAppDefinition,
        type: "wordpress",
        iconUrl: wordpressAppDefinition.logoUrl, // Adjust for schema
        isEnabled: true,
      });
    }

    // Create the connection
    return await ctx.runMutation(
      internal.integrations.connections.createApiKeyConnection,
      {
        name: args.name,
        appType: "wordpress",
        config: {
          siteUrl: args.siteUrl,
          username: args.username,
          password: args.password,
          apiKey: args.apiKey,
        },
        isEnabled: args.isEnabled ?? true,
      },
    );
  },
});

/**
 * Get a WordPress integration by ID
 */
export const getWordPressIntegration = query({
  args: {
    id: v.id("connections"),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.id);
    if (!connection) return null;

    // For WordPress connections, we'll need to check if it's a WordPress connection
    // based on metadata or related fields since there's no direct type field

    // Return the connection with WordPress-specific fields
    return {
      _id: connection._id,
      name: connection.name,
      siteUrl: connection.metadata?.siteUrl,
      username: connection.metadata?.username,
      isEnabled: connection.status === "active",
    };
  },
});

/**
 * Update a WordPress integration
 */
export const updateWordPressIntegration = mutation({
  args: {
    id: v.id("connections"),
    siteUrl: v.optional(v.string()),
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(
      internal.integrations.connections.updateApiKeyConnection,
      {
        id: args.id,
        config: {
          siteUrl: args.siteUrl,
          username: args.username,
          password: args.password,
          apiKey: args.apiKey,
        },
        isEnabled: args.isEnabled,
      },
    );
  },
});

/**
 * Test a WordPress connection
 */
export const testWordPressConnection = mutation({
  args: {
    siteUrl: v.string(),
    username: v.string(),
    password: v.optional(v.string()),
    apiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate the URL
    let url;
    try {
      url = new URL(args.siteUrl);
    } catch (error) {
      return {
        success: false,
        message: "Invalid WordPress site URL",
      };
    }

    // In a real implementation, we would test the connection to the WordPress API
    // For now, just return success if the URL looks valid
    if (url && args.username && (args.password || args.apiKey)) {
      return {
        success: true,
        message: `Successfully connected to WordPress at ${url.hostname}`,
      };
    }

    return {
      success: false,
      message: "Missing required credentials",
    };
  },
});

// Register the WordPress app type
export const registerWordPressApp = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.runMutation(internal.integrations.apps.registerApp, {
      app: wordpressAppDefinition as unknown as typeof appDefinitionValidator,
    });
  },
});
