import type { NodeMetadata } from "../../../packages/integration-sdk/src/node-types.js";

/**
 * Internal Node Metadata Template
 *
 * This file defines the basic metadata for an internal service/function.
 * Internal nodes typically interact with your own database, services, or business logic.
 */
export const InternalServiceMetadata: NodeMetadata = {
  // Unique identifier for this node
  // Format: "internal.{category}.{service-name}"
  id: "internal.database.user-management",

  // Display name shown in the UI
  name: "User Management",

  // Brief description of what this internal service does
  description:
    "Internal service for managing user accounts, profiles, and authentication",

  // Type is always "internal" for internal services
  type: "internal",

  // Category helps organize nodes in the UI
  // Common internal categories: "database", "auth", "file", "email", "notification", "analytics"
  category: "database",

  // Semantic version of this node implementation
  version: "1.0.0",

  // Optional: Icon identifier (could be an emoji, icon name, or URL)
  icon: "👤",

  // Optional: Color for UI theming (hex color)
  color: "#4f46e5",
};

// Default export for convenience
export default InternalServiceMetadata;
