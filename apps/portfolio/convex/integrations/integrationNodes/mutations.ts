import { v } from "convex/values";

import { internalMutation } from "../../_generated/server";
import { integrationNodeSeedValidator } from "../lib/seedingUtils";

/**
 * Create a new integration node
 */
export const createIntegrationNode = internalMutation({
  args: {
    data: integrationNodeSeedValidator,
  },
  returns: v.id("integrationNodes"),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if a node with the same identifier already exists
    const existing = await ctx.db
      .query("integrationNodes")
      .withIndex("by_identifier", (q) =>
        q.eq("identifier", args.data.identifier),
      )
      .first();

    if (existing) {
      throw new Error(
        `Integration node with identifier '${args.data.identifier}' already exists`,
      );
    }

    const id = await ctx.db.insert("integrationNodes", {
      ...args.data,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

/**
 * Update an existing integration node
 */
export const updateIntegrationNode = internalMutation({
  args: {
    id: v.id("integrationNodes"),
    data: integrationNodeSeedValidator,
  },
  returns: v.id("integrationNodes"),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Verify the node exists
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error(`Integration node with ID ${args.id} not found`);
    }

    // Update the node with new data
    await ctx.db.patch(args.id, {
      ...args.data,
      updatedAt: now,
    });

    return args.id;
  },
});

/**
 * Upsert an integration node (create if not exists, update if exists)
 */
export const upsertIntegrationNode = internalMutation({
  args: {
    data: integrationNodeSeedValidator,
    forceUpdate: v.optional(v.boolean()),
  },
  returns: v.object({
    id: v.id("integrationNodes"),
    created: v.boolean(),
    updated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if node already exists
    const existing = await ctx.db
      .query("integrationNodes")
      .withIndex("by_identifier", (q) =>
        q.eq("identifier", args.data.identifier),
      )
      .first();

    if (existing) {
      // Only update if version is different or force update is enabled
      const shouldUpdate =
        (args.forceUpdate ?? false) || existing.version !== args.data.version;

      if (shouldUpdate) {
        await ctx.db.patch(existing._id, {
          ...args.data,
          updatedAt: now,
        });

        return {
          id: existing._id,
          created: false,
          updated: true,
        };
      } else {
        // No update needed
        return {
          id: existing._id,
          created: false,
          updated: false,
        };
      }
    } else {
      // Create new node
      const id = await ctx.db.insert("integrationNodes", {
        ...args.data,
        createdAt: now,
        updatedAt: now,
      });

      return {
        id,
        created: true,
        updated: false,
      };
    }
  },
});

/**
 * Delete an integration node
 */
export const deleteIntegrationNode = internalMutation({
  args: {
    id: v.id("integrationNodes"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Verify the node exists
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error(`Integration node with ID ${args.id} not found`);
    }

    // TODO: Check for dependent scenario nodes before deletion
    // This would prevent deletion of integration nodes that are still in use

    await ctx.db.delete(args.id);
    return true;
  },
});

/**
 * Soft delete an integration node by marking it as deprecated
 */
export const deprecateIntegrationNode = internalMutation({
  args: {
    id: v.id("integrationNodes"),
    deprecated: v.optional(v.boolean()),
  },
  returns: v.id("integrationNodes"),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Verify the node exists
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error(`Integration node with ID ${args.id} not found`);
    }

    await ctx.db.patch(args.id, {
      deprecated: args.deprecated ?? true,
      updatedAt: now,
    });

    return args.id;
  },
});
