// Export monitoring functions (excluding default export)
import * as monitoring from "./monitoring";

/**
 * Connection management for the integrations module
 *
 * This module provides functions to manage connections to third-party services.
 */

// Export credential management functions
export * from "./credentials";

// Export OAuth authentication functions
export * from "./oauth";

// Export API Key authentication functions
export * from "./apikey";

// Export Basic Auth authentication functions
export * from "./basic";

// Export common connection management functions
export * from "./management";

// Export WordPress-specific functions
export * from "./wordpress";

export { monitoring };
