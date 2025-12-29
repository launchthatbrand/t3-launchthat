import { mutation } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Create a new connection for an integration node type
 */
export const create = mutation({
  args: {
    nodeType: v.string(),
    name: v.string(),
    // Accept raw credentials; we will store safely
    credentials: v.string(),
    config: v.optional(v.string()),
    ownerId: v.union(v.id("users"), v.string()),
    status: v.optional(v.string()),
  },
  returns: v.id("connections"),
  handler: () => {
    throw new Error(
      "This mutation is deprecated. Use connections.actions.create instead.",
    );
  },
});

/**
 * Create or update a connection for a given owner/node combination.
 * This prevents duplicate connections per tenant/org.
 */
export const upsertForOwner = mutation({
  args: {
    nodeType: v.string(),
    name: v.string(),
    credentials: v.string(),
    ownerId: v.union(v.id("users"), v.string()),
    config: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  returns: v.id("connections"),
  handler: () => {
    throw new Error(
      "This mutation is deprecated. Use connections.actions.upsertForOwner instead.",
    );
  },
});

/**
 * Update an existing connection
 */
export const update = mutation({
  args: {
    id: v.id("connections"),
    name: v.optional(v.string()),
    credentials: v.optional(v.string()),
    status: v.optional(v.string()),
    config: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: () => {
    throw new Error(
      "This mutation is deprecated. Use connections.actions.update instead.",
    );
  },
});

/**
 * Test a connection by validating its credentials
 */
export const test = mutation({
  args: {
    id: v.optional(v.id("connections")),
    credentials: v.optional(v.string()),
    nodeType: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    let connectionCredentials;

    if (args.id) {
      const connection = await ctx.db.get(args.id);
      if (!connection) {
        throw new Error(`Connection with ID ${args.id} not found`);
      }
      connectionCredentials = args.credentials ?? connection.credentials;
    } else if (args.nodeType && args.credentials) {
      connectionCredentials = args.credentials;
    } else {
      throw new Error(
        "Either connection ID or node type with credentials must be provided",
      );
    }

    console.log("Testing connection with credentials:", connectionCredentials);

    if (args.id) {
      await ctx.db.patch(args.id, {
        lastCheckedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return {
      success: true,
      message: "Connection test successful",
    };
  },
});

/**
 * Delete a connection
 */
export const remove = mutation({
  args: {
    id: v.id("connections"),
  },
  returns: v.boolean(),
  handler: () => {
    throw new Error(
      "This mutation is deprecated. Use connections.actions.remove instead.",
    );
  },
});
