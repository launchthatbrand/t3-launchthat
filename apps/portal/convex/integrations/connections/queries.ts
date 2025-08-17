import { v } from "convex/values";

import { api } from "../../_generated/api";
import { internalQuery, query } from "../../_generated/server";

/**
 * List all connections, optionally filtered by node type or owner
 */
export const list = query({
  args: {
    nodeType: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("connections"),
      _creationTime: v.number(),
      nodeType: v.string(),
      name: v.string(),
      status: v.string(),
      // Never expose secrets on public queries
      metadata: v.optional(
        v.object({
          lastUsed: v.optional(v.number()),
          errorMessage: v.optional(v.string()),
          maskedCredentials: v.optional(v.record(v.string(), v.string())),
        }),
      ),
      config: v.optional(v.string()),
      lastCheckedAt: v.optional(v.number()),
      lastError: v.optional(v.string()),
      ownerId: v.union(v.id("users"), v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // Start with a base query
    const baseQuery = ctx.db.query("connections");

    // Apply filters based on provided arguments using proper indexes
    let filteredConnections;

    if (args.nodeType !== undefined && args.status !== undefined) {
      // Both nodeType and status provided - use composite index
      filteredConnections = await baseQuery
        .withIndex("by_node_type_and_status", (q) =>
          q.eq("nodeType", args.nodeType!).eq("status", args.status!),
        )
        .collect();
    } else if (args.nodeType !== undefined) {
      // Only nodeType provided - use existing index
      filteredConnections = await baseQuery
        .withIndex("by_node_type", (q) => q.eq("nodeType", args.nodeType!))
        .collect();
    } else if (args.status !== undefined) {
      // Only status provided - use existing index
      filteredConnections = await baseQuery
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      // No filters provided
      filteredConnections = await baseQuery.collect();
    }

    // Return the connections without secrets
    return filteredConnections.map((conn) => {
      const maskedFromLegacy = conn.credentials
        ? { token: `****${conn.credentials.slice(-4)}` }
        : undefined;

      return {
        _id: conn._id,
        _creationTime: conn._creationTime,
        nodeType: conn.nodeType,
        name: conn.name,
        status: conn.status,
        metadata: {
          ...conn.metadata,
          maskedCredentials:
            conn.metadata?.maskedCredentials ?? maskedFromLegacy,
        },
        config: conn.config,
        lastCheckedAt: conn.lastCheckedAt,
        lastError: conn.lastError,
        ownerId: conn.ownerId,
        createdAt: conn.createdAt,
        updatedAt: conn.updatedAt,
      };
    });
  },
});

/**
 * Get a specific connection by ID
 */
export const get = query({
  args: {
    id: v.id("connections"),
  },
  returns: v.union(
    v.object({
      _id: v.id("connections"),
      _creationTime: v.number(),
      nodeType: v.string(),
      name: v.string(),
      status: v.string(),
      metadata: v.optional(
        v.object({
          lastUsed: v.optional(v.number()),
          errorMessage: v.optional(v.string()),
          maskedCredentials: v.optional(v.record(v.string(), v.string())),
        }),
      ),
      config: v.optional(v.string()),
      lastCheckedAt: v.optional(v.number()),
      lastError: v.optional(v.string()),
      ownerId: v.union(v.id("users"), v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.id);

    if (!connection) {
      return null;
    }

    const maskedFromLegacy = connection.credentials
      ? { token: `****${connection.credentials.slice(-4)}` }
      : undefined;

    return {
      _id: connection._id,
      _creationTime: connection._creationTime,
      nodeType: connection.nodeType,
      name: connection.name,
      status: connection.status,
      metadata: {
        ...connection.metadata,
        maskedCredentials:
          connection.metadata?.maskedCredentials ?? maskedFromLegacy,
      },
      config: connection.config,
      lastCheckedAt: connection.lastCheckedAt,
      lastError: connection.lastError,
      ownerId: connection.ownerId,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };
  },
});

export const getConnectionByNodeTypeAndOwner = internalQuery({
  args: {
    nodeType: v.string(),
    ownerId: v.union(v.id("users"), v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("connections")
      .withIndex("by_node_type_and_owner", (q) =>
        q.eq("nodeType", args.nodeType).eq("ownerId", args.ownerId),
      )
      .unique();
  },
});

/**
 * List connections with automatic inclusion of internal node type connections
 * This ensures internal node types show up with their default connections
 */
export const listWithInternalNodeTypes = query({
  args: {
    nodeType: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("connections"),
      _creationTime: v.number(),
      nodeType: v.string(),
      name: v.string(),
      status: v.string(),
      metadata: v.optional(
        v.object({
          lastUsed: v.optional(v.number()),
          errorMessage: v.optional(v.string()),
          maskedCredentials: v.optional(v.record(v.string(), v.string())),
        }),
      ),
      config: v.optional(v.string()),
      lastCheckedAt: v.optional(v.number()),
      lastError: v.optional(v.string()),
      ownerId: v.union(v.id("users"), v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // Get all connections using the existing logic
    const regularConnections = await ctx.runQuery(
      api.integrations.connections.queries.list,
      args,
    );

    // Define internal node types that should have default connections
    const internalNodeTypes = ["webhook", "orders", "passthrough"];

    const result = [...regularConnections];

    // For each internal node type, ensure it has a connection in the result
    for (const nodeType of internalNodeTypes) {
      // Skip if we already have a connection for this node type in the results
      const hasConnection = result.some((conn) => conn.nodeType === nodeType);

      if (!hasConnection) {
        // Create a synthetic connection for display purposes
        const syntheticConnection = {
          _id: `${nodeType}_default` as any, // Synthetic ID
          _creationTime: Date.now(),
          nodeType: nodeType,
          name: `${nodeType} (Default)`,
          status: "connected",
          metadata: {
            maskedCredentials: { token: "****internal" },
          },
          config: JSON.stringify({ isDefault: true }),
          ownerId: "system",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        result.push(syntheticConnection as any);
      }
    }

    return result;
  },
});
