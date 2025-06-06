/**
 * Integrations module index
 *
 * This file re-exports all integrations module functionality.
 */

// Import schema and types - keep these imports as they're critical

// Import test WordPress module
import * as testWordPress from "./apps/test_wordpress";
import { integrationsSchema } from "./schema/integrationsSchema";
import * as schemaTypes from "./schema/types";

// Remove unused import
// import testSchema from "./schema/test_schema";

// Export schema - this is the critical part for type registration
export { integrationsSchema };
export { default as schema } from "./schema/test_schema";
export * from "./schema/types";

// Export test WordPress module
export { testWordPress };

// Comment out other exports to simplify debugging
/*
// Export WordPress-specific modules under a namespace
import * as wordpressApp from "./apps/wordpress";
import * as wordpressConn from "./connections/wordpress";
import * as scenariosModule from "./scenarios";

export * from "./connections/management";
export * from "./connections/oauth";
export * from "./connections/apikey";
export * from "./connections/basic";
// Export apps module without wordpress to avoid conflicts
export * from "./apps/management";
export * from "./apps/registration";
// Export lib with specific submodules, excluding validators to prevent conflicts
export * from "./lib/security";
export * from "./lib/testing";
export * from "./lib/helpers";

// Export validators under a namespace
export * as validators from "./lib/validators";

// Export connection management functions from the public API
export {
  // Connection management
  listConnections,
  getConnection,
  deleteConnection,
  testConnection,

  // OAuth authentication
  generateAuthUrl,
  handleOAuthCallback,

  // API Key authentication
  createApiKeyConnection,
  updateApiKeyConnection,

  // Basic authentication
  createBasicAuthConnection,
  updateBasicAuthConnection,
} from "./connections";

// Create a wordpress namespace with all wordpress-related functions
export const wordpress = {
  ...wordpressApp,
  ...wordpressConn,
};

// Export app management functions
export {
  getAppTemplates,
  testConnection as testAppConnection,
} from "./apps/management";

export const scenarios = scenariosModule;
*/

export const types = schemaTypes;

// Export audit functionality
// export * from "./audit";
