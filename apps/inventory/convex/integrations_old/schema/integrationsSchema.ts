import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Apps table for third-party service definitions
export const appsTable = defineTable({
  name: v.string(),
  description: v.string(),
  iconUrl: v.string(),
  type: v.string(),
  authType: v.union(
    v.literal("oauth2"),
    v.literal("apiKey"),
    v.literal("basic"),
    v.literal("none"),
  ),
  authConfig: v.object({
    // OAuth2 fields
    clientId: v.optional(v.string()),
    clientSecret: v.optional(v.string()),
    tokenUrl: v.optional(v.string()),
    authUrl: v.optional(v.string()),
    refreshUrl: v.optional(v.string()),
    scope: v.optional(v.string()),
    // API Key fields
    apiKeyName: v.optional(v.string()),
    apiKeyLocation: v.optional(
      v.union(v.literal("header"), v.literal("query"), v.literal("body")),
    ),
    // Basic auth fields
    usernameField: v.optional(v.string()),
    passwordField: v.optional(v.string()),
    // Common fields
    additionalHeaders: v.optional(v.record(v.string(), v.string())),
    baseUrl: v.optional(v.string()),
  }),
  triggers: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      description: v.string(),
      inputSchema: v.object({}), // Serialized Zod schema
      outputSchema: v.object({}), // Serialized Zod schema
    }),
  ),
  actions: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      description: v.string(),
      inputSchema: v.object({}), // Serialized Zod schema
      outputSchema: v.object({}), // Serialized Zod schema
    }),
  ),
})
  .index("by_name", ["name"])
  .index("by_type", ["type"])
  .searchIndex("search_apps", {
    searchField: "name",
    filterFields: [],
  });

// Connections table for authenticated instances of apps
export const connectionsTable = defineTable({
  appId: v.id("apps"),
  userId: v.id("users"),
  name: v.string(),
  status: v.union(
    v.literal("active"),
    v.literal("error"),
    v.literal("disconnected"),
    v.literal("configured"),
    v.literal("incomplete"),
  ),
  credentials: v.object({}), // Encrypted, varies by app
  updatedAt: v.number(),
  lastUsed: v.number(),
  metadata: v.object({}), // App-specific connection data
  lastError: v.optional(v.string()),
})
  .index("by_app", ["appId"])
  .index("by_user", ["userId"])
  .index("by_user_app", ["userId", "appId"])
  .index("by_status", ["status"]);

// Audit logs table for tracking sensitive operations
export const auditLogsTable = defineTable({
  action: v.string(), // The action performed (e.g., "store_credentials", "update_connection")
  resourceType: v.string(), // The type of resource (e.g., "connection", "app")
  resourceId: v.id("any"), // The ID of the resource
  userId: v.optional(v.id("users")), // The user who performed the action
  timestamp: v.number(), // When the action occurred
  metadata: v.object({}), // Additional context (without sensitive data)
  ipAddress: v.optional(v.string()), // IP address of the client (if available)
  userAgent: v.optional(v.string()), // User agent of the client (if available)
})
  .index("by_resource", ["resourceType", "resourceId"])
  .index("by_user", ["userId"])
  .index("by_action", ["action"])
  .index("by_timestamp", ["timestamp"]);

// Temporary OAuth states table for CSRF protection
export const tempOAuthStatesTable = defineTable({
  appId: v.id("apps"),
  state: v.string(), // Random state parameter for CSRF protection
  redirectUri: v.string(), // Where to redirect after auth
  expiresAt: v.number(), // When this state expires
  createdAt: v.number(), // When this state was created
})
  .index("by_state", ["state"])
  .index("by_expiration", ["expiresAt"]);

// Scenarios table for integration workflows
export const scenariosTable = defineTable({
  name: v.string(),
  description: v.string(),
  status: v.union(
    v.literal("active"),
    v.literal("draft"),
    v.literal("paused"),
    v.literal("error"),
  ),
  createdBy: v.id("users"),
  updatedAt: v.number(),
  lastRun: v.optional(v.number()),
  schedule: v.optional(
    v.object({
      frequency: v.union(
        v.literal("minutes"),
        v.literal("hourly"),
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly"),
      ),
      interval: v.number(), // e.g., every 5 minutes, every 2 hours
      startTime: v.optional(v.number()),
      timezone: v.optional(v.string()),
      dayOfWeek: v.optional(v.number()), // 0-6, Sunday to Saturday
      dayOfMonth: v.optional(v.number()), // 1-31
    }),
  ),
  errorHandling: v.object({
    retryCount: v.number(),
    notifyOnError: v.boolean(),
  }),
})
  .index("by_user", ["createdBy"])
  .index("by_status", ["status"])
  .searchIndex("search_scenarios", {
    searchField: "name",
    filterFields: ["status", "createdBy"],
  });

// Nodes table for steps within scenarios
export const nodesTable = defineTable({
  scenarioId: v.id("scenarios"),
  type: v.union(
    v.literal("trigger"),
    v.literal("action"),
    v.literal("transformer"),
    v.literal("condition"),
  ),
  position: v.number(), // Order in the scenario
  appId: v.optional(v.id("apps")), // Null for transformers
  connectionId: v.optional(v.id("connections")), // Null for transformers
  operation: v.string(), // ID of the trigger/action within the app
  config: v.object({}), // Node-specific configuration
  inputMappings: v.record(v.string(), v.string()), // Field mappings from previous node
  outputMappings: v.record(v.string(), v.string()), // Field mappings to next node
  conditions: v.optional(
    v.array(
      v.object({
        field: v.string(),
        operator: v.string(),
        value: v.object({}), // Can be any type of value
        combinator: v.optional(v.union(v.literal("and"), v.literal("or"))),
      }),
    ),
  ), // For conditional execution
})
  .index("by_scenario", ["scenarioId"])
  .index("by_scenario_position", ["scenarioId", "position"])
  .index("by_connection", ["connectionId"]);

// Execution events table for monitoring and auditing
export const executionEventsTable = defineTable({
  executionId: v.id("scenario_executions"),
  eventType: v.string(), // Enum: 'execution_started', 'execution_completed', 'execution_failed', 'node_started', 'node_completed', 'node_failed', 'retry_attempted', 'execution_resumed', etc.
  nodeId: v.optional(v.id("nodes")), // Which node the event is related to (if applicable)
  timestamp: v.number(), // When the event occurred
  details: v.any(), // Additional information about the event
  level: v.optional(
    v.union(
      v.literal("debug"),
      v.literal("info"),
      v.literal("warning"),
      v.literal("error"),
      v.literal("critical"),
    ),
  ),
})
  .index("by_execution", ["executionId"])
  .index("by_execution_time", ["executionId", "timestamp"])
  .index("by_node", ["nodeId"]);

// Execution checkpoints table for recovery purposes
export const executionCheckpointsTable = defineTable({
  executionId: v.id("scenario_executions"),
  scenarioId: v.id("scenarios"),
  checkpoint: v.object({
    completedNodes: v.array(v.id("nodes")),
    currentNodeId: v.optional(v.id("nodes")),
    nodeOutputs: v.object({}),
    timestamp: v.number(),
    metadata: v.optional(v.object({})),
  }),
  createdAt: v.number(),
})
  .index("by_execution", ["executionId"])
  .index("by_scenario", ["scenarioId"])
  .index("by_creation", ["createdAt"]);

// Scenario executions table for tracking execution history
export const scenarioExecutionsTable = defineTable({
  scenarioId: v.id("scenarios"),
  startTime: v.number(),
  endTime: v.optional(v.number()),
  status: v.union(
    v.literal("running"),
    v.literal("completed"),
    v.literal("failed"),
  ),
  trigger: v.any(),
  nodeResults: v.array(v.any()),
  // Monitoring fields
  progress: v.optional(v.number()),
  currentNodeId: v.optional(v.id("nodes")),
  estimatedTimeRemaining: v.optional(v.number()),
  metrics: v.optional(v.any()),
  lastUpdated: v.optional(v.number()),
  // Error handling fields
  error: v.optional(v.string()),
  failedNodeId: v.optional(v.id("nodes")),
  // Recovery related fields
  lastCheckpointId: v.optional(v.id("execution_checkpoints")),
  recoveryExecutionId: v.optional(v.id("scenario_executions")),
  originalExecutionId: v.optional(v.id("scenario_executions")),
  recoveryData: v.optional(
    v.object({
      originalExecutionId: v.id("scenario_executions"),
      completedNodeIds: v.array(v.id("nodes")),
      preservedNodeOutputs: v.any(),
      startNodeId: v.optional(v.id("nodes")),
      isRecovery: v.boolean(),
    }),
  ),
  // Retry related fields
  retryCount: v.optional(v.number()),
  maxRetries: v.optional(v.number()),
  lastRetryTime: v.optional(v.number()),
  // Benchmark metrics for performance analysis
  benchmarkMetrics: v.optional(
    v.object({
      enabled: v.boolean(),
      iterations: v.number(),
      results: v.optional(v.any()),
      completedAt: v.optional(v.number()),
    }),
  ),
})
  .index("by_scenario", ["scenarioId"])
  .index("by_status", ["status"])
  .index("by_start_time", ["startTime"]);

// Data schemas table for transformation system
export const dataSchemasTable = defineTable({
  id: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  fields: v.array(v.any()), // Schema fields with potentially nested structure
  createdBy: v.optional(v.id("users")),
  updatedAt: v.number(),
  isSystem: v.optional(v.boolean()),
  category: v.optional(v.string()),
  appId: v.optional(v.id("apps")),
})
  .index("by_schema_id", ["id"])
  .index("by_app", ["appId"])
  .index("by_category", ["category"])
  .searchIndex("search_schemas", {
    searchField: "name",
    filterFields: ["category", "isSystem"],
  });

// Mapping configurations table for data transformations
export const mappingConfigurationsTable = defineTable({
  id: v.string(),
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  sourceSchema: v.string(), // Reference to a schema ID
  targetSchema: v.string(), // Reference to a schema ID
  mappings: v.array(v.any()), // Field mappings with transformations
  customJsTransform: v.optional(v.string()),
  createdBy: v.optional(v.id("users")),
  updatedAt: v.number(),
  isSystem: v.optional(v.boolean()),
  appId: v.optional(v.id("apps")),
})
  .index("by_mapping_id", ["id"])
  .index("by_source_schema", ["sourceSchema"])
  .index("by_target_schema", ["targetSchema"])
  .index("by_app", ["appId"])
  .searchIndex("search_mappings", {
    searchField: "name",
    filterFields: ["sourceSchema", "targetSchema", "isSystem"],
  });

// Export the schema with all tables
export const integrationsSchema = defineSchema({
  apps: appsTable,
  connections: connectionsTable,
  scenarios: scenariosTable,
  nodes: nodesTable,
  scenario_executions: scenarioExecutionsTable,
  execution_events: executionEventsTable,
  execution_checkpoints: executionCheckpointsTable,
  audit_logs: auditLogsTable,
  temp_oauth_states: tempOAuthStatesTable,
  data_schemas: dataSchemasTable,
  mapping_configurations: mappingConfigurationsTable,
});
