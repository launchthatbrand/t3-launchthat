import type { IntegrationNodeDefinition } from "../../../packages/integration-sdk/src/node-types.js";
import { ServiceNameActions } from "./actions.js";
import { ServiceNameConnection } from "./connection.js";
import { ServiceNameMetadata } from "./metadata.js";
import { ServiceNameTriggers } from "./triggers.js";

/**
 * External Node Main Definition
 *
 * This file combines metadata, actions, triggers, and connection definitions
 * into a complete node that can be registered with the integration system.
 */

// =====================================================
// COMPLETE NODE DEFINITION
// =====================================================

export const ServiceNameNodeDefinition: IntegrationNodeDefinition = {
  // Basic metadata from metadata.ts
  metadata: ServiceNameMetadata,

  // All available actions from actions.ts
  actions: ServiceNameActions,

  // All available triggers from triggers.ts
  triggers: ServiceNameTriggers,

  // Connection configuration from connection.ts
  connections: [ServiceNameConnection],

  // Optional: Node-level settings that apply to all actions/triggers
  settings: {
    // Global rate limiting for this entire node
    rateLimit: {
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
      strategy: "sliding-window",
    },

    // Default timeout for all API calls
    timeout: 30000, // 30 seconds

    // Retry configuration
    retry: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      exponentialBackoff: true,
    },

    // Error handling preferences
    errorHandling: {
      logLevel: "error",
      includeStackTrace: false,
      sanitizeErrors: true,
    },
  },

  // Optional: UI configuration for the node
  ui: {
    // Category for organizing in the UI
    category: "External Services",

    // Tags for filtering and search
    tags: ["api", "integration", "external"],

    // Whether this node should be featured in listings
    featured: false,

    // Documentation links
    documentation: {
      overview: "https://docs.servicename.com/integration-overview",
      apiReference: "https://docs.servicename.com/api-reference",
      examples: "https://docs.servicename.com/integration-examples",
      troubleshooting: "https://docs.servicename.com/troubleshooting",
    },

    // Visual configuration
    appearance: {
      iconUrl: "https://cdn.servicename.com/assets/icon.svg",
      colorPrimary: "#007bff",
      colorSecondary: "#6c757d",
    },
  },

  // Optional: Validation rules that apply across the node
  validation: {
    // Validate connection before allowing actions/triggers
    requireValidConnection: true,

    // Custom validation function (optional)
    async validateNode(context): Promise<boolean> {
      // Add any custom validation logic here
      // For example, check API version compatibility
      try {
        const connection = context.connection;
        if (!connection) return false;

        // Check if the service API version is supported
        const response = await fetch(`${connection.baseUrl}/api/version`);
        if (!response.ok) return true; // Skip if endpoint doesn't exist

        const versionData = await response.json();
        const supportedVersions = ["v1", "v2"];

        return supportedVersions.includes(versionData.version);
      } catch (error) {
        // If version check fails, allow the node to proceed
        console.warn("Could not validate API version:", error);
        return true;
      }
    },
  },

  // Optional: Health check configuration
  healthCheck: {
    // How often to check the health of this integration
    interval: 5 * 60 * 1000, // 5 minutes

    // Health check function
    async check(context): Promise<boolean> {
      try {
        const connection = context.connection;
        if (!connection) return false;

        // Simple health check - verify we can reach the API
        const response = await fetch(`${connection.baseUrl}/api/health`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${connection.apiKey}`,
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        return response.ok;
      } catch (error) {
        console.error("Health check failed for ServiceName:", error);
        return false;
      }
    },
  },
};

// =====================================================
// CONVENIENCE EXPORTS
// =====================================================

// Export individual components for flexibility
export { ServiceNameMetadata } from "./metadata.js";
export { ServiceNameActions } from "./actions.js";
export { ServiceNameTriggers } from "./triggers.js";
export { ServiceNameConnection } from "./connection.js";

// Export specific actions and triggers for direct import
export {
  CreateResourceAction,
  GetResourceAction,
  ListResourcesAction,
} from "./actions.js";

export {
  ResourceCreatedTrigger,
  ResourceUpdatedTrigger,
  PeriodicSyncTrigger,
} from "./triggers.js";

// Default export is the complete node definition
export default ServiceNameNodeDefinition;
