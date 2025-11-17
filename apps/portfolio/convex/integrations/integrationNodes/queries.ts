import { v } from "convex/values";

import { query } from "../../_generated/server";

/**
 * Get an integration node by its identifier
 */
export const getIntegrationNodeByIdentifier = query({
  args: {
    identifier: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("integrationNodes"),
      _creationTime: v.number(),
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
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("integrationNodes")
      .withIndex("by_identifier", (q) => q.eq("identifier", args.identifier))
      .first();
  },
});

/**
 * Get all integration nodes
 */
export const getAllIntegrationNodes = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("integrationNodes"),
      _creationTime: v.number(),
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
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("integrationNodes").collect();
  },
});

/**
 * Get integration nodes by category
 */
export const getIntegrationNodesByCategory = query({
  args: {
    category: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("integrationNodes"),
      _creationTime: v.number(),
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
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("integrationNodes")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

/**
 * Get integration nodes by integration type
 */
export const getIntegrationNodesByType = query({
  args: {
    integrationType: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("integrationNodes"),
      _creationTime: v.number(),
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
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("integrationNodes")
      .withIndex("by_integration_type", (q) =>
        q.eq("integrationType", args.integrationType),
      )
      .collect();
  },
});

/**
 * Get non-deprecated integration nodes
 */
export const getActiveIntegrationNodes = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("integrationNodes"),
      _creationTime: v.number(),
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
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const nodes = await ctx.db.query("integrationNodes").collect();
    return nodes.filter((node) => !node.deprecated);
  },
});

/**
 * Get integration node by ID
 */
export const getIntegrationNode = query({
  args: {
    id: v.id("integrationNodes"),
  },
  returns: v.union(
    v.object({
      _id: v.id("integrationNodes"),
      _creationTime: v.number(),
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
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
