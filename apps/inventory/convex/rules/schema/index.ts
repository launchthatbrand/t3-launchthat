import { defineTable } from "convex/server";
import { v } from "convex/values";

// Import sub-schemas
import rulesSchema from "./rules";

// Define the integrations table
const integrationsTable = defineTable({
  name: v.string(),
  type: v.string(), // e.g., "monday", "wordpress"
  description: v.string(),
  isEnabled: v.boolean(),
  // API credentials
  apiKey: v.optional(v.string()),
  apiEndpoint: v.optional(v.string()),
  siteUrl: v.optional(v.string()),
  username: v.optional(v.string()),
  password: v.optional(v.string()),
  // Connection status
  connectionStatus: v.string(), // "connected", "disconnected", "error"
  lastConnectionCheck: v.number(),
  consecutiveErrorCount: v.number(),
  // Settings
  autoSync: v.optional(v.boolean()),
  processSubitems: v.optional(v.boolean()),
  // Additional metadata as JSON string
  metadata: v.string(),
})
  .index("by_type", ["type"])
  .index("by_isEnabled", ["isEnabled"]);

// Create the combined schema with tables from both modules
const rulesEngineSchema = {
  tables: {
    integrations: integrationsTable,
    ...rulesSchema.tables,
  },
};

// Export default for consistency with other schema modules
export default rulesEngineSchema;
