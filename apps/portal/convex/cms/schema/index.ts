/**
 * CMS Schema Exports
 *
 * This module exports all CMS-related schema definitions.
 */

// Re-export all schema components
export * from "./postsSchema";

// Export the main postsSchema as the default
export { postsSchema as default } from "./postsSchema";
