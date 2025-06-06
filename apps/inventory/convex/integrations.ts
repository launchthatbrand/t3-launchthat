/**
 * Integrations module exports
 *
 * This file exposes the integrations module to the Convex API.
 */

// Export WordPress integration functions
export * as wordpress from "./integrations_old/apps/wordpress";

// Export other integration modules as needed
// export * as slack from "./integrations/apps/slack";
// export * as zapier from "./integrations/apps/zapier";

// Export connection utilities
export {
  // Connection management
  listConnections,
  getConnection,
  deleteConnection,
  testConnection,
} from "./integrations_old/connections/management";

// Export app management functions
export {
  getAppTemplates,
  testConnection as testAppConnection,
} from "./integrations_old/apps/management";

// Export scenarios and transformations
export * as scenarios from "./integrations_old/scenarios";
export * as transformations from "./integrations_old/transformations";
