/**
 * Type definitions for the integration system module
 */
import type { Id } from "../../_generated/dataModel";

/**
 * Authentication types for apps
 */
export type AuthType = "oauth2" | "apiKey" | "basic" | "none";

/**
 * Node operation types
 */
export type NodeType = "trigger" | "action" | "transformer" | "condition";

/**
 * Status types for scenarios
 */
export type ScenarioStatus = "active" | "draft" | "paused" | "error";

/**
 * Status types for connections
 */
export type ConnectionStatus =
  | "active"
  | "error"
  | "disconnected"
  | "configured"
  | "incomplete";

/**
 * Status types for scenario executions
 */
export type ExecutionStatus = "running" | "completed" | "failed";

/**
 * Status types for node executions
 */
export type NodeExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

/**
 * Event log level types
 */
export type EventLogLevel = "debug" | "info" | "warning" | "error" | "critical";

/**
 * Schema definition (serialized Zod schema)
 */
export type SchemaDefinition = Record<string, unknown>;

/**
 * Generic configuration type
 */
export type ConfigObject = Record<string, unknown>;

/**
 * Trigger definition
 */
export interface TriggerDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: SchemaDefinition;
  outputSchema: SchemaDefinition;
}

/**
 * Action definition
 */
export interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: SchemaDefinition;
  outputSchema: SchemaDefinition;
}

/**
 * App record
 */
export interface App {
  _id: Id<"apps">;
  _creationTime: number;
  name: string;
  description: string;
  iconUrl: string;
  authType: AuthType;
  authConfig: ConfigObject; // Varies based on authType
  triggers: TriggerDefinition[];
  actions: ActionDefinition[];
}

/**
 * Connection record
 */
export interface Connection {
  _id: Id<"connections">;
  _creationTime: number;
  appId: Id<"apps">;
  userId: Id<"users">;
  name: string;
  status: ConnectionStatus;
  credentials: ConfigObject; // Encrypted, varies by app
  updatedAt: number;
  lastUsed: number;
  metadata: ConfigObject; // App-specific connection data
  lastError?: string; // Error information if status is "error"
}

/**
 * Scenario model (stored in 'scenarios' table)
 */
export interface Scenario {
  _id: Id<"scenarios">;
  _creationTime: number;
  name: string;
  description?: string;
  nodes: Id<"nodes">[];
  createdBy: Id<"users">;
  updatedBy?: Id<"users">;
  updatedAt?: number;
  version?: number;
  status: ScenarioStatus;
  statusDetails?: ConfigObject;
  isTemplate?: boolean;
  tags?: string[];
  isPublic?: boolean;
  config?: ConfigObject;
  executionCount?: number;
  lastExecutionId?: Id<"scenario_executions">;
  lastExecutionTime?: number;
  lastExecutionStatus?: ExecutionStatus;
  errorHandling?: {
    // Retry configuration
    retryEnabled: boolean;
    retryConfig?: {
      strategy: string; // "exponential_backoff", "fixed_interval", "progressive"
      maxAttempts: number;
      initialDelayMs: number;
      maxDelayMs: number;
      backoffFactor?: number;
      retryableErrors?: string[]; // Error categories to retry
      nonRetryableErrors?: string[]; // Error categories to not retry
    };
    // Circuit breaker configuration
    circuitBreakerEnabled?: boolean;
    circuitBreakerConfig?: {
      failureThreshold: number;
      resetTimeoutMs: number;
      halfOpenSuccessThreshold?: number;
    };
    // Notification configuration
    notifyOnError?: boolean;
    notificationConfig?: {
      channels: string[]; // "in_app", "email", etc.
      minSeverity: string; // "info", "warning", "error", "critical"
      throttleIntervalMs?: number; // How often to send notifications
    };
    // Recovery configuration
    checkpointingEnabled?: boolean;
    checkpointingInterval?: number; // After how many nodes to save checkpoint
    autoRecoveryEnabled?: boolean;
    skipFailedNodesOnRecovery?: boolean;
    // Fallback configuration
    fallbackValues?: Record<string, unknown>; // Node ID -> fallback value
    timeoutMs?: number; // Global timeout for the scenario execution
  };
}

/**
 * Condition definition for node logic
 */
export interface ConditionConfig {
  field: string;
  operator: string;
  value: unknown;
  combinator?: "and" | "or";
}

/**
 * Node record
 */
export interface Node {
  _id: Id<"nodes">;
  _creationTime: number;
  scenarioId: Id<"scenarios">;
  type: NodeType;
  position: number; // Order in the scenario
  appId: Id<"apps"> | null; // Null for transformers
  connectionId: Id<"connections"> | null; // Null for transformers
  operation: string; // ID of the trigger/action within the app
  config: ConfigObject; // Node-specific configuration
  inputMappings: Record<string, string>; // Field mappings from previous node
  outputMappings: Record<string, string>; // Field mappings to next node
  conditions: ConditionConfig[] | null; // For conditional execution
}

/**
 * Node execution result
 */
export interface NodeExecutionResult {
  nodeId: Id<"nodes">;
  startTime: number;
  endTime: number | null;
  status: NodeExecutionStatus;
  input: ConfigObject;
  output: ConfigObject | null;
  error: ConfigObject | null;
}

/**
 * Execution event record
 */
export interface ExecutionEvent {
  _id: Id<"execution_events">;
  _creationTime: number;
  executionId: Id<"scenario_executions">;
  eventType: string;
  nodeId?: Id<"nodes">;
  timestamp: number;
  details: Record<string, unknown>;
  level?: EventLogLevel;
}

/**
 * Execution checkpoint record
 */
export interface ExecutionCheckpoint {
  _id: Id<"execution_checkpoints">;
  _creationTime: number;
  executionId: Id<"scenario_executions">;
  scenarioId: Id<"scenarios">;
  checkpoint: {
    completedNodes: Id<"nodes">[];
    currentNodeId?: Id<"nodes">;
    nodeOutputs: Record<string, unknown>;
    timestamp: number;
    metadata?: Record<string, unknown>;
  };
  createdAt: number;
}

/**
 * Scenario execution record
 */
export interface ScenarioExecution {
  _id: Id<"scenario_executions">;
  _creationTime: number;
  scenarioId: Id<"scenarios">;
  startTime: number;
  endTime: number | null;
  status: ExecutionStatus;
  trigger: ConfigObject; // Data that triggered the execution
  nodeResults: NodeExecutionResult[];
  // Monitoring fields
  progress?: number;
  currentNodeId?: Id<"nodes">;
  estimatedTimeRemaining?: number;
  metrics?: Record<string, unknown>;
  lastUpdated?: number;
  // Recovery and checkpoint related fields
  lastCheckpointId?: Id<"execution_checkpoints">;
  recoveryExecutionId?: Id<"scenario_executions">;
  originalExecutionId?: Id<"scenario_executions">;
  recoveryData?: {
    originalExecutionId: Id<"scenario_executions">;
    completedNodeIds: Id<"nodes">[];
    preservedNodeOutputs: Record<string, unknown>;
    startNodeId?: Id<"nodes">;
    isRecovery: boolean;
  };
  error?: string;
  failedNodeId?: Id<"nodes">;
  // Retry related fields
  retryCount?: number;
  maxRetries?: number;
  lastRetryTime?: number;
  // Benchmark metrics
  benchmarkMetrics?: {
    enabled: boolean;
    iterations: number;
    results?: {
      totalDuration?: number;
      nodeMetrics?: {
        nodeId: Id<"nodes">;
        type: string;
        startTime: number;
        endTime: number;
        duration: number;
        preparationTime: number;
        executionTime: number;
        recordingTime: number;
      }[];
      dbOperations?: number;
      apiCalls?: number;
    };
    completedAt?: number;
  };
}

/**
 * API response for app with stripped auth config
 */
export interface AppResponse extends Omit<App, "authConfig"> {
  authConfigFields: string[]; // Just the field names without values
}

/**
 * API response for connection with stripped credentials
 */
export interface ConnectionResponse extends Omit<Connection, "credentials"> {
  hasValidCredentials: boolean;
}

/**
 * Execution summary for scenario status
 */
export interface ExecutionSummary {
  status: ExecutionStatus;
  startTime: number;
  endTime: number | null;
}

/**
 * Scenario with execution status
 */
export interface ScenarioWithStatus extends Scenario {
  lastExecution: ExecutionSummary | null;
}
