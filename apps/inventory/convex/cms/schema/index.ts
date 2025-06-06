// Combine schemas into a unified CMS schema
import { defineSchema } from "convex/server";

import {
  contentTypeFieldsTable,
  contentTypesTable,
} from "./contentTypesSchema";
import { postsTable } from "./postsSchema";

/**
 * CMS Schema Exports
 *
 * This module exports all CMS-related schema definitions.
 */

// Re-export all schema components
export * from "./postsSchema";
export * from "./contentTypesSchema";

// Export combined schema as the default
export default defineSchema({
  // Posts
  posts: postsTable,

  // Content Type System
  contentTypes: contentTypesTable,
  contentTypeFields: contentTypeFieldsTable,
});
