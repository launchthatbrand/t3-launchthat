import type { NodeMetadata } from "@acme/integration-sdk";

/**
 * WordPress Node Metadata
 *
 * This file defines the basic metadata for the WordPress CMS integration.
 * WordPress is a popular content management system with a robust REST API.
 */
export const WordPressMetadata: NodeMetadata = {
  // Unique identifier for this node
  id: "external.wordpress",

  // Display name shown in the UI
  name: "WordPress",

  // Brief description of what this integration does
  description:
    "Integration with WordPress CMS for managing posts, pages, and content via the REST API",

  // Type is always "external" for external integrations
  type: "external",

  // Category helps organize nodes in the UI
  category: "cms",

  // Current version of this integration
  version: "1.0.0",

  // Optional icon for the UI (can be a URL or icon name)
  icon: "wordpress",

  // Optional color for the UI theme
  color: "#21759B",
};
