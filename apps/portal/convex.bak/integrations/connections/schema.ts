import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Schema definition for the Connections table
 *
 * This table stores instances of connected third-party applications.
 * Each connection represents a specific instance of an app (e.g., a specific WordPress site)
 * with its own credentials and configuration.
 */
export const connectionsTable = defineTable({
  // Reference to the app this connection is for
  appId: v.id("apps"),

  // User-friendly name for this connection (e.g., "Company Blog WordPress")
  name: v.string(),

  // Encrypted credentials (format depends on authType of the app)
  credentials: v.string(),

  // Connection status: "connected", "error", "disconnected"
  status: v.string(),

  // Configuration specific to this connection instance
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
  // Index for looking up connections by app
  .index("by_app_id", ["appId"])
  // Index for looking up connections by status
  .index("by_status", ["status"])
  // Index for looking up connections by owner
  .index("by_owner", ["ownerId"])
  // Index for looking up connections by app and owner
  .index("by_app_and_owner", ["appId", "ownerId"]);

/**
 * Export the connections schema
 */
export const integrationsConnectionsSchema = defineSchema({
  connections: connectionsTable,
});
