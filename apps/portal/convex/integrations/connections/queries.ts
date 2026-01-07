import { internalQuery, query } from "../../_generated/server";

import { api } from "../../_generated/api";
import { v } from "convex/values";

/**
 * List all connections, optionally filtered by node type or owner
 */
export const list = query({
  args: {
    nodeType: v.optional(v.string()),
    status: v.optional(v.string()),
    ownerId: v.optional(v.union(v.id("users"), v.string())),
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
    const { nodeType, status, ownerId } = args;

    let filteredConnections;

    if (nodeType !== undefined && ownerId !== undefined) {
      filteredConnections = await baseQuery
        .withIndex("by_node_type_and_owner", (q) =>
          q.eq("nodeType", nodeType).eq("ownerId", ownerId),
        )
        .collect();
    } else if (nodeType !== undefined && status !== undefined) {
      filteredConnections = await baseQuery
        .withIndex("by_node_type_and_status", (q) =>
          q.eq("nodeType", nodeType).eq("status", status),
        )
        .collect();
    } else if (ownerId !== undefined) {
      filteredConnections = await baseQuery
        .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
        .collect();
    } else if (nodeType !== undefined) {
      filteredConnections = await baseQuery
        .withIndex("by_node_type", (q) => q.eq("nodeType", nodeType))
        .collect();
    } else if (status !== undefined) {
      filteredConnections = await baseQuery
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect();
    } else {
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
 * Batch lookup connection status for many (nodeType, ownerId) pairs.
 * Public-safe: does not return secrets.
 */
export const listForOwners = query({
  args: {
    filters: v.array(
      v.object({
        nodeType: v.string(),
        ownerId: v.union(v.id("users"), v.string()),
      }),
    ),
  },
  returns: v.array(
    v.object({
      nodeType: v.string(),
      ownerId: v.union(v.id("users"), v.string()),
      status: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const results: {
      nodeType: string;
      ownerId: string;
      status: string | null;
    }[] = [];

    for (const filter of args.filters) {
      const conn = await ctx.db
        .query("connections")
        .withIndex("by_node_type_and_owner", (q) =>
          q.eq("nodeType", filter.nodeType).eq("ownerId", filter.ownerId),
        )
        .first();

      results.push({
        nodeType: filter.nodeType,
        ownerId: filter.ownerId as any,
        status: conn?.status ?? null,
      });
    }

    return results as any;
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
