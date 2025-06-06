import { v } from "convex/values";

import { mutation, query } from "../../_generated/server";

/**
 * Simplified WordPress integration functions
 *
 * These functions are meant to test the schema registration in isolation.
 */

/**
 * Query WordPress integrations by type
 */
export const getWordPressApps = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("apps"),
      name: v.string(),
      type: v.string(),
    }),
  ),
  handler: async (ctx) => {
    try {
      // Attempt to query the apps table using the by_type index
      const apps = await ctx.db
        .query("apps")
        .withIndex("by_type", (q) => q.eq("type", "wordpress"))
        .collect();

      return apps.map((app) => ({
        _id: app._id,
        name: app.name,
        type: app.type,
      }));
    } catch (error) {
      console.error("Error querying WordPress apps:", error);
      return [];
    }
  },
});

/**
 * Register a WordPress app type
 */
export const registerWordPressApp = mutation({
  args: {},
  returns: v.id("apps"),
  handler: async (ctx) => {
    // Create a complete WordPress app definition matching the schema
    const wordpressApp = {
      name: "WordPress Test",
      description: "WordPress integration for testing",
      type: "wordpress",
      iconUrl: "/images/integrations/wordpress-logo.png",
      authType: "apiKey" as const,
      authConfig: {
        apiKeyName: "wp_api_key",
        apiKeyLocation: "header" as const,
        baseUrl: "https://example.com/wp-json/",
      },
      triggers: [
        {
          id: "postPublished",
          name: "Post Published",
          description: "Triggered when a post is published",
          inputSchema: {},
          outputSchema: {},
        },
      ],
      actions: [
        {
          id: "createPost",
          name: "Create Post",
          description: "Create a new WordPress post",
          inputSchema: {},
          outputSchema: {},
        },
      ],
    };

    // Insert the app into the database
    return await ctx.db.insert("apps", wordpressApp);
  },
});

/**
 * Test WordPress connection query
 */
export const testSimpleQuery = query({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return "WordPress integration test successful!";
  },
});
