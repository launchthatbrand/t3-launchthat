import { v } from "convex/values";

import { mutation } from "../../_generated/server";

/**
 * Create a new integration app
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    authType: v.string(),
    configTemplate: v.string(),
    iconUrl: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
  },
  returns: v.id("apps"),
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("apps", {
      name: args.name,
      description: args.description,
      authType: args.authType,
      configTemplate: args.configTemplate,
      iconUrl: args.iconUrl,
      isEnabled: args.isEnabled ?? true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update an existing integration app
 */
export const update = mutation({
  args: {
    id: v.id("apps"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    authType: v.optional(v.string()),
    configTemplate: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    isEnabled: v.optional(v.boolean()),
  },
  returns: v.id("apps"),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Make sure the app exists
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error(`App with ID ${id} not found`);
    }

    // Build a typed update payload explicitly
    const payload: {
      name?: string;
      description?: string;
      authType?: string;
      configTemplate?: string;
      iconUrl?: string;
      isEnabled?: boolean;
      updatedAt: number;
    } = { updatedAt: Date.now() };

    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined)
      payload.description = updates.description;
    if (updates.authType !== undefined) payload.authType = updates.authType;
    if (updates.configTemplate !== undefined)
      payload.configTemplate = updates.configTemplate;
    if (updates.iconUrl !== undefined) payload.iconUrl = updates.iconUrl;
    if (updates.isEnabled !== undefined) payload.isEnabled = updates.isEnabled;

    await ctx.db.patch(id, payload);
    return id;
  },
});

/**
 * Delete an integration app
 */
export const remove = mutation({
  args: {
    id: v.id("apps"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Check if there are any connections using this app
    const connections = await ctx.db
      .query("connections")
      .withIndex("by_app_id", (qi) => qi.eq("appId", args.id))
      .collect();

    if (connections.length > 0) {
      throw new Error("Cannot delete app that has active connections");
    }

    await ctx.db.delete(args.id);
    return true;
  },
});

/**
 * Get or create the WordPress app
 * This ensures WordPress app exists in the database
 */
export const getOrCreateWordPressApp = mutation({
  args: {},
  returns: v.id("apps"),
  handler: async (ctx) => {
    // Try to find WordPress app by querying all apps (simplified approach)
    const apps = await ctx.db.query("apps").collect();

    for (const a of apps) {
      if (a.name.toLowerCase() === "wordpress") {
        return a._id;
      }
    }

    // WordPress app doesn't exist, create it
    const now = Date.now();

    return await ctx.db.insert("apps", {
      name: "WordPress",
      description:
        "Connect to WordPress sites to import posts, users, and more.",
      authType: "apiKey",
      configTemplate: JSON.stringify({
        siteUrl: { type: "string", label: "Site URL", required: true },
        apiUsername: { type: "string", label: "API Username", required: true },
        apiKey: {
          type: "string",
          label: "API Key",
          required: true,
          secret: true,
        },
      }),
      isEnabled: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});
