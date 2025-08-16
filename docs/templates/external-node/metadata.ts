import type { NodeMetadata } from "../../../packages/integration-sdk/src/node-types.js";

/**
 * External Node Metadata Template
 *
 * This file defines the basic metadata for an external service integration.
 * Update the values below to match your specific service.
 */
export const ServiceNameMetadata: NodeMetadata = {
  // Unique identifier for this node
  // Format: "external.{service-name}"
  id: "external.service-name",

  // Display name shown in the UI
  name: "Service Name",

  // Brief description of what this integration does
  description:
    "Integration with Service Name API for [brief description of capabilities]",

  // Type is always "external" for external integrations
  type: "external",

  // Category helps organize nodes in the UI
  // Common categories: "communication", "cms", "crm", "payment", "social", "storage", "productivity"
  category: "communication",

  // Semantic version of this integration
  version: "1.0.0",

  // Icon name (optional) - use Lucide icon names
  // Common icons: "MessageSquare", "FileText", "Users", "CreditCard", "Share2", "Database"
  icon: "MessageSquare",

  // Brand color (optional) - hex color code
  color: "#0066CC",
};

// Export metadata with a descriptive name
export default ServiceNameMetadata;
