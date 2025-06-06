/**
 * Monday.com Integration Types
 *
 * This module contains type definitions for the Monday.com integration.
 */

import { Id } from "../../_generated/dataModel";

/**
 * Monday.com API Response Wrapper
 */
export interface MondayApiResponse<T> {
  data: T;
  errors?: {
    message: string;
    locations?: {
      line: number;
      column: number;
    }[];
  }[];
}

/**
 * Monday.com Workspace
 */
export interface MondayWorkspace {
  id: string;
  name: string;
}

/**
 * Monday.com Board
 */
export interface MondayBoard {
  id: string;
  name: string;
  description?: string;
}

/**
 * Monday.com Column
 */
export interface MondayColumn {
  id: string;
  title: string;
  type: string;
  settings_str?: string;
}

/**
 * Monday.com Item
 */
export interface MondayItem {
  id: string;
  name: string;
  column_values: {
    id: string;
    text: string;
    value?: string;
    type: string;
  }[];
  subitems?: MondayItem[];
}

/**
 * Monday.com User
 */
export interface MondayUser {
  id: string;
  name: string;
  email: string;
}

/**
 * Monday.com Integration Configuration
 */
export interface MondayIntegration {
  _id: Id<"mondayIntegration">;
  _creationTime: number;
  apiKey: string;
  workspaceId: string;
  workspaceName: string;
  isEnabled: boolean;
  lastSyncTimestamp?: number;
  lastConnectionCheck?: number;
  connectionStatus?: string;
  refreshToken?: string;
  lastError?: string;
  consecutiveErrorCount?: number;
  autoSyncIntervalMinutes?: number;
  webhookEnabled?: boolean;
  webhookUrl?: string;
  pushEnabled?: boolean;
  pullEnabled?: boolean;
  // Performance optimization settings
  preferredPageSize?: number;
  maxConcurrentRequests?: number;
  rateLimitThreshold?: number;
  batchSizeOverride?: number;
  optimizationStrategy?: string; // "speed", "memory", "balanced"
}

/**
 * Monday.com Board Mapping
 */
export interface MondayBoardMapping {
  _id: Id<"mondayBoardMappings">;
  _creationTime: number;
  mondayBoardId: string;
  mondayBoardName: string;
  convexTableName: string;
  convexTableDisplayName?: string;
  integrationId: Id<"mondayIntegration">;
  isEnabled: boolean;
  syncDirection: SyncDirection;
  syncStatus?: string;
  lastSyncTimestamp?: number;
  supportsSubitems?: boolean;
  syncSettings?: string;
  parentMappingId?: Id<"mondayBoardMappings">;
  parentField?: string;
}

/**
 * Monday.com Column Mapping
 */
export interface MondayColumnMapping {
  _id: Id<"mondayColumnMappings">;
  _creationTime: number;
  boardMappingId: Id<"mondayBoardMappings">;
  mondayColumnId: string;
  mondayColumnTitle: string;
  mondayColumnType: string;
  convexField: string;
  convexFieldType: string;
  isRequired: boolean;
  isEnabled: boolean;
  isPrimaryKey: boolean;
  defaultValue?: string;
  transformationRule?: string;
  mappingConfig?: string;
  formatConfig?: string;
}

/**
 * Monday.com Item Mapping
 */
export interface MondayItemMapping {
  _id: Id<"mondayItemMappings">;
  _creationTime: number;
  convexId: string;
  convexTable: string;
  mondayBoardId: string;
  mondayItemId: string;
  boardMappingId: Id<"mondayBoardMappings">;
  lastSyncTimestamp: number;
  syncStatus: string;
  isSubitem: boolean;
  parentItemId?: string;
}

/**
 * Monday.com Sync Log
 */
export interface MondaySyncLog {
  _id: Id<"mondaySyncLogs">;
  _creationTime: number;
  operation: SyncOperationType;
  status: string;
  startTimestamp: number;
  endTimestamp: number;
  boardMappingId?: Id<"mondayBoardMappings">;
  convexTable?: string;
  mondayBoardId?: string;
  recordsProcessed?: number;
  recordsCreated?: number;
  recordsUpdated?: number;
  recordsFailed?: number;
  error?: string;
  errorDetails?: string;
  details?: string;
  initiatedBy?: string;
  timeTaken?: number;
  successRate?: number;
  throughput?: number;
  currentPhase?: string | null;
  // JSON string fields
  recordChanges?: string;
  errors?: string;
  performanceMetrics?: string;
  messages?: string;
  phases?: string;
  metrics?: string;
}

/**
 * Order Line Item
 *
 * Represents a line item in an order as defined in ordersSchema.ts
 */
export interface OrderLineItem {
  productId: Id<"products">;
  productSnapshot: {
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
  };
  quantity: number;
  variantId?: Id<"productVariants">;
  variantSnapshot?: {
    name: string;
    attributes: Record<string, unknown>;
    price: number;
  };
  lineTotal: number;
  mondayItemId?: string;
  mondayLastSynced?: number;
}

/**
 * Sync Direction Type
 */
export type SyncDirection = "push" | "pull" | "bidirectional";

/**
 * Column Type Enum
 */
export type ColumnType =
  | "text"
  | "number"
  | "date"
  | "status"
  | "dropdown"
  | "people"
  | "file"
  | "long_text"
  | "link"
  | "checkbox"
  | "timeline"
  | "tag"
  | "hour"
  | "email"
  | "phone"
  | "rating"
  | "formula"
  | "location"
  | "world_clock"
  | "country"
  | "board_relation"
  | "mirror"
  | "color_picker"
  | "subtasks"
  | "dependency"
  | "vote"
  | "time_tracking";

/**
 * Sync Status Type
 */
export type SyncStatus =
  | "pending"
  | "syncing"
  | "synced"
  | "error"
  | "partial"
  | "not_synced";

/**
 * Sync Operation Type
 */
export type SyncOperationType =
  | "push"
  | "pull"
  | "manual_sync"
  | "auto_sync"
  | "initial_sync"
  | "incremental_sync"
  | "full_sync"
  | "conflict_resolution"
  | "connection_test"
  | "reset_sync"
  | "schema_sync";

/**
 * Sync Log Level
 */
export type SyncLogLevel = "debug" | "info" | "warning" | "error" | "critical";

/**
 * Exported Constants
 */
export const SYNC_DIRECTIONS = ["push", "pull", "bidirectional"] as const;
export const COLUMN_TYPES = [
  "text",
  "number",
  "date",
  "status",
  "dropdown",
  "people",
  "file",
  "long_text",
  "link",
  "checkbox",
] as const;
export const SYNC_STATUS = [
  "pending",
  "syncing",
  "synced",
  "error",
  "partial",
  "not_synced",
] as const;

export const SYNC_OPERATION_TYPES = [
  "push",
  "pull",
  "manual_sync",
  "auto_sync",
  "initial_sync",
  "incremental_sync",
  "full_sync",
  "conflict_resolution",
  "connection_test",
  "reset_sync",
  "schema_sync",
] as const;

export const SYNC_LOG_LEVELS = [
  "debug",
  "info",
  "warning",
  "error",
  "critical",
] as const;

/**
 * Test Result
 */
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  workspaces?: MondayWorkspace[];
}

/**
 * Monday.com Sync Rule Trigger Types
 */
export type TriggerType =
  | "onCreate" // When a new item is created in Convex
  | "onUpdate" // When an item is updated in Convex
  | "onStatusChange" // When a status field changes
  | "onFieldValue" // When a specific field matches a value
  | "onCheckout" // When a product is checked out
  | "onSchedule" // Run on a schedule
  | "onManualTrigger"; // Manually triggered

/**
 * Monday.com Sync Rule Action Types
 */
export type ActionType =
  | "push" // Push to Monday.com
  | "pull" // Pull from Monday.com
  | "updateField" // Update a field in Convex
  | "createItem" // Create a new item in Monday.com
  | "updateItem" // Update an item in Monday.com
  | "createRelated"; // Create a related item in Monday.com

/**
 * Monday.com Sync Rule Execution Status
 */
export type RuleExecutionStatus = "success" | "error" | "skipped";

/**
 * Monday.com Sync Rule
 */
export interface MondaySyncRule {
  _id: Id<"mondaySyncRules">;
  _creationTime: number;
  name: string;
  description?: string;
  isEnabled: boolean;
  integrationId: Id<"mondayIntegration">;
  boardMappingId: Id<"mondayBoardMappings">;

  // Trigger configuration
  triggerType: TriggerType;
  triggerTable: string;
  triggerField?: string;
  triggerValue?: string;
  triggerCondition?: string;

  // Action configuration
  actionType: ActionType;
  actionConfig: string;

  // Additional settings
  priority: number;
  cooldownMs?: number;
  lastExecuted?: number;
  executionCount?: number;
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
}

/**
 * Monday.com Sync Rule Execution Log
 */
export interface MondaySyncRuleExecution {
  _id: Id<"mondaySyncRuleExecutions">;
  _creationTime: number;
  ruleId: Id<"mondaySyncRules">;
  executedAt: number;
  status: RuleExecutionStatus;
  triggerDetails: string; // JSON string
  executionDetails: string; // JSON string
  error?: string;
  timeTaken: number;
}

/**
 * Field Condition for Rule Triggers
 */
export interface FieldCondition {
  field: string;
  operator:
    | "eq"
    | "ne"
    | "gt"
    | "lt"
    | "gte"
    | "lte"
    | "contains"
    | "startsWith"
    | "endsWith"
    | "exists"
    | "changed";
  value?: unknown;
}

/**
 * Complex Condition (can be nested)
 */
export interface ComplexCondition {
  operator: "and" | "or" | "not";
  conditions: (FieldCondition | ComplexCondition)[];
}

/**
 * Trigger Details based on type
 */
export interface TriggerConfig {
  type: TriggerType;
  table: string;

  // For field-based triggers
  field?: string;
  value?: unknown;

  // For complex conditions
  condition?: FieldCondition | ComplexCondition;

  // For scheduled triggers
  schedule?: {
    interval?: number; // in milliseconds
    cron?: string;
  };
}

/**
 * Action Details based on type
 */
export interface ActionConfig {
  type: ActionType;

  // For push/pull actions
  boardMappingId?: Id<"mondayBoardMappings">;

  // For field update actions
  table?: string;
  field?: string;
  value?: unknown;
  valueType?: "static" | "dynamic" | "expression";
  valueExpression?: string;

  // For create/update item actions
  targetBoardId?: string;
  itemTemplate?: Record<string, unknown>;
  mappingField?: string; // Field to use for linking related items

  // For conditional actions
  condition?: FieldCondition | ComplexCondition;
}

/**
 * Trigger Event Data
 */
export interface TriggerEvent {
  table: string;
  documentId: string;
  operation: "create" | "update" | "delete";
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  changes?: Record<
    string,
    {
      before: unknown;
      after: unknown;
    }
  >;
  timestamp: number;
}

/**
 * Rule Execution Context
 */
export interface RuleExecutionContext {
  rule: MondaySyncRule;
  event: TriggerEvent;
  integration: MondayIntegration;
  boardMapping: MondayBoardMapping;
  startTime: number;
}

/**
 * Rule Execution Result
 */
export interface RuleExecutionResult {
  status: RuleExecutionStatus;
  details: Record<string, unknown>;
  error?: string;
  timeTaken: number;
}
