import type { IntegrationNodeDefinition } from "../../../packages/integration-sdk/src/node-types.js";
import { InternalServiceActions } from "./actions.js";
import { InternalServiceMetadata } from "./metadata.js";
import { InternalServiceTriggers } from "./triggers.js";

/**
 * Internal Node Main Definition
 *
 * This file combines metadata, actions, and triggers into a complete internal node
 * that can be registered with the integration system.
 *
 * Internal nodes don't require external connections since they operate on internal
 * services like databases, file systems, and internal APIs.
 */

// =====================================================
// COMPLETE INTERNAL NODE DEFINITION
// =====================================================

export const InternalServiceNodeDefinition: IntegrationNodeDefinition = {
  // Basic metadata from metadata.ts
  metadata: InternalServiceMetadata,

  // All available actions from actions.ts
  actions: InternalServiceActions,

  // All available triggers from triggers.ts
  triggers: InternalServiceTriggers,

  // Internal nodes typically don't need external connections
  // They connect to your internal database, file system, etc.
  connections: [],

  // Optional: Node-level settings that apply to all actions/triggers
  settings: {
    // Database connection settings (example)
    database: {
      connectionTimeout: 30000, // 30 seconds
      queryTimeout: 15000, // 15 seconds
      retryAttempts: 3,
      poolSize: 10,
    },

    // File system settings (example)
    fileSystem: {
      basePath: "/app/data",
      permissions: "0755",
      encoding: "utf8",
    },

    // Logging configuration
    logging: {
      level: "info",
      includeStackTrace: true,
      logSensitiveData: false,
    },

    // Error handling preferences
    errorHandling: {
      retryOnFailure: true,
      maxRetryAttempts: 3,
      retryDelay: 1000,
      exponentialBackoff: true,
    },
  },

  // Optional: UI configuration for the node
  ui: {
    // Category for organizing in the UI
    category: "Internal Services",

    // Tags for filtering and search
    tags: ["database", "internal", "user-management"],

    // Whether this node should be featured in listings
    featured: true,

    // Documentation links (internal docs)
    documentation: {
      overview: "/docs/internal/user-management-overview",
      apiReference: "/docs/internal/user-management-api",
      examples: "/docs/internal/user-management-examples",
      troubleshooting: "/docs/internal/user-management-troubleshooting",
    },

    // Visual configuration
    appearance: {
      iconUrl: "/assets/icons/user-management.svg",
      colorPrimary: "#4f46e5",
      colorSecondary: "#6b7280",
    },
  },

  // Optional: Validation rules that apply across the node
  validation: {
    // Internal nodes might not need connection validation
    requireValidConnection: false,

    // Custom validation function (optional)
    async validateNode(context): Promise<boolean> {
      // Add any custom validation logic here
      // For example, check database connectivity
      try {
        // Check if database is accessible
        // await db.raw('SELECT 1');

        // Check if required tables exist
        // const tableExists = await checkTableExists('users');
        // if (!tableExists) {
        //   console.error('Required table "users" does not exist');
        //   return false;
        // }

        // Check file system permissions
        // await fs.access('/app/data', fs.constants.R_OK | fs.constants.W_OK);

        return true;
      } catch (error) {
        console.error("Internal service validation failed:", error);
        return false;
      }
    },
  },

  // Optional: Health check configuration
  healthCheck: {
    // How often to check the health of this internal service
    interval: 2 * 60 * 1000, // 2 minutes

    // Health check function
    async check(context): Promise<boolean> {
      try {
        // Check database health
        // await db.raw('SELECT 1');

        // Check critical file system paths
        // await fs.access('/app/data', fs.constants.R_OK | fs.constants.W_OK);

        // Check memory usage
        const memUsage = process.memoryUsage();
        const memUsageMB = memUsage.heapUsed / 1024 / 1024;
        if (memUsageMB > 1000) {
          // 1GB limit
          console.warn(`High memory usage: ${memUsageMB.toFixed(2)}MB`);
        }

        // Check if required services are running
        // const serviceStatus = await checkInternalServices();
        // if (!serviceStatus.allHealthy) {
        //   return false;
        // }

        return true;
      } catch (error) {
        console.error("Health check failed for Internal Service:", error);
        return false;
      }
    },
  },

  // Optional: Initialization and cleanup
  lifecycle: {
    // Called when the node is first loaded
    async initialize(context): Promise<void> {
      console.log("Initializing Internal Service Node...");

      // Setup database connections
      // await initializeDatabase();

      // Create required directories
      // await fs.mkdir('/app/data/uploads', { recursive: true });

      // Setup internal event listeners
      // setupInternalEventListeners();

      console.log("Internal Service Node initialized successfully");
    },

    // Called when the node is being shut down
    async destroy(context): Promise<void> {
      console.log("Shutting down Internal Service Node...");

      // Close database connections
      // await closeDatabase();

      // Clean up temporary files
      // await cleanupTempFiles();

      // Remove event listeners
      // removeInternalEventListeners();

      console.log("Internal Service Node shut down successfully");
    },
  },
};

// =====================================================
// CONVENIENCE EXPORTS
// =====================================================

// Export individual components for flexibility
export { InternalServiceMetadata } from "./metadata.js";
export { InternalServiceActions } from "./actions.js";
export { InternalServiceTriggers } from "./triggers.js";

// Export specific actions and triggers for direct import
export {
  CreateUserAction,
  GetUserAction,
  UpdateUserAction,
  DeleteUserAction,
} from "./actions.js";

export {
  UserCreatedTrigger,
  UserUpdatedTrigger,
  UserDeletedTrigger,
  ScheduledReportTrigger,
  FileSystemWatcherTrigger,
} from "./triggers.js";

// Default export is the complete node definition
export default InternalServiceNodeDefinition;
