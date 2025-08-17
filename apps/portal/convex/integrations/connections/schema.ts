import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Schema definition for the Connections table
 *
 * This table stores instances of connected third-party applications.
 * Each connection represents a specific instance of an app (e.g., a specific WordPress site)
 * with its own credentials and configuration.
 */
export const connectionsTable = defineTable({
  // Type of integration node this connection is for (e.g., "wordpress", "monday", "stripe")
  nodeType: v.optional(v.string()),

  // User-friendly name for this connection (e.g., "Company Blog WordPress")
  name: v.string(),

  // Deprecated: raw credentials string; kept for backward compatibility only
  credentials: v.optional(v.string()),

  // Non-sensitive metadata visible to public queries
  metadata: v.optional(
    v.object({
      lastUsed: v.optional(v.number()),
      errorMessage: v.optional(v.string()),
      maskedCredentials: v.optional(v.record(v.string(), v.string())),
    }),
  ),

  // Sensitive data only accessible via internal actions
  secrets: v.optional(
    v.object({
      // Legacy plaintext structure (will be removed after migration)
      credentials: v.optional(v.record(v.string(), v.string())),
      // New encrypted payload
      ciphertext: v.optional(v.bytes()),
      expiresAt: v.optional(v.number()),
    }),
  ),

  // Connection status: "connected", "error", "disconnected"
  status: v.string(),

  // Configuration specific to this connection instance (should not include secrets)
  config: v.optional(v.string()),

  // Timestamp of last connection test/check
  lastCheckedAt: v.optional(v.number()),

  // Error message if status is "error"
  lastError: v.optional(v.string()),

  // User ID who created this connection (can be an actual user ID or "system")
  ownerId: v.union(v.id("users"), v.string()),

  // Creation timestamp
  createdAt: v.number(),

  // Last update timestamp
  updatedAt: v.number(),
})
  // Index for looking up connections by node type
  .index("by_node_type", ["nodeType"])
  // Index for looking up connections by status
  .index("by_status", ["status"])
  // Index for looking up connections by owner
  .index("by_owner", ["ownerId"])
  // Index for looking up connections by node type and owner
  .index("by_node_type_and_owner", ["nodeType", "ownerId"])
  // Index for looking up connections by node type and status
  .index("by_node_type_and_status", ["nodeType", "status"]);

/**
 * Export the connections schema
 */
export const integrationsConnectionsSchema = {
  connections: connectionsTable,
};
