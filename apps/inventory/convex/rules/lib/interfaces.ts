/**
 * Core Rules Engine Interfaces
 *
 * This module defines the core interfaces for the rules engine framework.
 * These interfaces are designed to be integration-agnostic, allowing different
 * integration types to implement their own specific rule components.
 */

// Import the specific table names
import { Id } from "../../_generated/dataModel";

/**
 * Base event interface for rules engine events
 */
export interface RuleEvent {
  type: string;
  source?: string;
  timestamp: number;
  triggeredBy?: string;
  [key: string]: unknown;
}

/**
 * Factory interface for creating rule execution contexts
 */
export interface RuleContextFactory {
  // Different factories will implement these methods according to their needs
  createFromWebhook?: (
    event: any,
    ruleId: string,
    integrationId: string,
  ) => RuleContext;
  createFromManualTrigger?: (
    data: any,
    ruleId: string,
    integrationId: string,
    userId?: string,
  ) => RuleContext;
  createFromScheduledTrigger?: (
    data: any,
    ruleId: string,
    integrationId: string,
  ) => RuleContext;
}

/**
 * Rule interface representing a rule in the system
 */
export interface Rule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  integrationId: string;
  integrationName: string;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  conditions: ConditionConfig[];
  actions: ActionConfig[];
  cooldownMs?: number;
  lastExecuted?: number;
  executionCount?: number;
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Rule Document interface extending Rule with Convex document fields
 */
export interface RuleDocument extends Rule {
  _id: Id<"rules">;
  _creationTime: number;
}

/**
 * Configuration for a condition
 */
export interface ConditionConfig {
  type: string;
  config: Record<string, unknown>;
}

/**
 * Configuration for an action
 */
export interface ActionConfig {
  type: string;
  config: Record<string, unknown>;
}

/**
 * Execution context for rule components
 */
export interface RuleContext {
  // Rule being executed
  ruleId: string;

  // Integration that owns the rule
  integrationId: string;
  integrationType: string;

  // Event data that triggered the rule
  event?: RuleEvent;

  // Additional data available to the rule
  data?: Record<string, unknown>;

  // User context (if applicable)
  user?: {
    id: string;
    [key: string]: unknown;
  };

  // Session data
  session?: Record<string, unknown>;

  // Timestamp of execution
  timestamp: number;

  // Variables for storing intermediate results
  variables: Record<string, unknown>;
}

/**
 * Trigger component for the rules engine
 */
export interface Trigger {
  // Type identifier for the trigger
  type: string;

  /**
   * Evaluates whether the trigger should fire
   * @param context The execution context
   * @returns A promise that resolves to true if the trigger should fire
   */
  evaluate(context: RuleContext): Promise<boolean>;
}

/**
 * Factory function type for creating triggers
 */
export type TriggerFactory = (config: Record<string, unknown>) => Trigger;

/**
 * Condition component for the rules engine
 */
export interface Condition {
  // Type identifier for the condition
  type: string;

  /**
   * Evaluates whether the condition is satisfied
   * @param context The execution context
   * @returns A promise that resolves to true if the condition is satisfied
   */
  evaluate(context: RuleContext): Promise<boolean>;
}

/**
 * Factory function type for creating conditions
 */
export type ConditionFactory = (config: Record<string, unknown>) => Condition;

/**
 * Action component for the rules engine
 */
export interface Action {
  // Type identifier for the action
  type: string;

  /**
   * Executes the action
   * @param context The execution context
   * @returns A promise that resolves to the result of the action
   */
  execute(context: RuleContext): Promise<Record<string, unknown>>;
}

/**
 * Factory function type for creating actions
 */
export type ActionFactory = (config: Record<string, unknown>) => Action;

/**
 * Context for rule execution
 */
export interface RuleExecutionContext {
  rule: Rule;
  triggerData: Record<string, unknown>;
  integrationData: Record<string, unknown>;
  startTime: number;
  timestamp: Date;
  logger: RuleLogger;
}

/**
 * Result of rule execution
 */
export interface RuleExecutionResult {
  ruleId: string;
  status: RuleExecutionStatus;
  details: Record<string, unknown>;
  error?: string;
  timeTaken: number;
  actionsExecuted: number;
  actionResults: ActionResult[];
}

/**
 * Result of rule evaluation (before executing actions)
 */
export interface RuleEvaluationResult {
  ruleId: string;
  triggered: boolean;
  conditionsMet: boolean;
  details: Record<string, unknown>;
  error?: string;
  timeTaken: number;
}

/**
 * Result of action execution
 */
export interface ActionResult {
  actionType: string;
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
  timeTaken: number;
}

/**
 * Status of rule execution
 */
export type RuleExecutionStatus = "success" | "error" | "skipped";

/**
 * Logger interface for rule execution
 */
export interface RuleLogger {
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error: Error, data?: Record<string, unknown>): void;
  startTimer(label: string): void;
  endTimer(label: string): number;
  getEntries(): LogEntry[];
}

/**
 * Log entry
 */
export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  error?: Error;
}

/**
 * Log level
 */
export type LogLevel = "info" | "warn" | "error";

/**
 * Trigger event that can trigger rules
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
 * Integration interface for database documents
 */
export interface IntegrationDocument {
  _id: Id<"integrations">;
  _creationTime: number;
  name: string;
  type: string;
  description?: string;
  isEnabled: boolean;
  apiKey: string;
  apiEndpoint?: string;
  refreshToken?: string;
  lastConnectionCheck?: number;
  connectionStatus?: string;
  lastError?: string;
  consecutiveErrorCount?: number;
  config?: string;
  metadata?: string;
  autoSync?: boolean;
  processSubitems?: boolean;
}

/**
 * Rule Execution interface for database documents
 */
export interface RuleExecutionDocument {
  _id: Id<"ruleExecutions">;
  _creationTime: number;
  ruleId: Id<"rules">;
  integrationId: Id<"integrations">;
  executedAt: number;
  status: "success" | "error" | "skipped";
  triggered: boolean;
  conditionsMet: boolean;
  triggerData: string;
  actionsExecuted: number;
  actionsSucceeded: number;
  actionsFailed: number;
  startTime: number;
  endTime: number;
  error?: string;
  details: string;
  timeTaken: number;
}

/**
 * Rule Execution Log interface for database documents
 */
export interface RuleExecutionLogDocument {
  _id: Id<"ruleExecutionLogs">;
  _creationTime: number;
  executionId: Id<"ruleExecutions">;
  timestamp: number;
  level: "info" | "warn" | "error";
  message: string;
  data?: string;
  component: string;
  componentId?: string;
}

/**
 * Action Result interface for database documents
 */
export interface ActionResultDocument {
  _id: Id<"actionResults">;
  _creationTime: number;
  executionId: Id<"ruleExecutions">;
  ruleId: Id<"rules">;
  integrationId: Id<"integrations">;
  actionType: string;
  actionConfig: string;
  executedAt: number;
  success: boolean;
  result: string;
  error?: string;
  timeTaken: number;
}
/*
 * Core Rules Engine Interfaces
 *
 * This module defines the core interfaces for the rules engine framework.
 * These interfaces are designed to be integration-agnostic, allowing different
 * integration types to implement their own specific rule components.
 */

// Import the specific table names
import { Id } from "../../_generated/dataModel";

/**
 * Base event interface for rules engine events
 */
export interface RuleEvent {
  type: string;
  source?: string;
  timestamp: number;
  triggeredBy?: string;
  [key: string]: unknown;
}

/**
 * Factory interface for creating rule execution contexts
 */
export interface RuleContextFactory {
  // Different factories will implement these methods according to their needs
  createFromWebhook?: (
    event: any,
    ruleId: string,
    integrationId: string,
  ) => RuleContext;
  createFromManualTrigger?: (
    data: any,
    ruleId: string,
    integrationId: string,
    userId?: string,
  ) => RuleContext;
  createFromScheduledTrigger?: (
    data: any,
    ruleId: string,
    integrationId: string,
  ) => RuleContext;
}

/**
 * Rule interface representing a rule in the system
 */
export interface Rule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  integrationId: string;
  integrationName: string;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  conditions: ConditionConfig[];
  actions: ActionConfig[];
  cooldownMs?: number;
  lastExecuted?: number;
  executionCount?: number;
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Rule Document interface extending Rule with Convex document fields
 */
export interface RuleDocument extends Rule {
  _id: Id<"rules">;
  _creationTime: number;
}

/**
 * Configuration for a condition
 */
export interface ConditionConfig {
  type: string;
  config: Record<string, unknown>;
}

/**
 * Configuration for an action
 */
export interface ActionConfig {
  type: string;
  config: Record<string, unknown>;
}

/**
 * Execution context for rule components
 */
export interface RuleContext {
  // Rule being executed
  ruleId: string;

  // Integration that owns the rule
  integrationId: string;
  integrationType: string;

  // Event data that triggered the rule
  event?: RuleEvent;

  // Additional data available to the rule
  data?: Record<string, unknown>;

  // User context (if applicable)
  user?: {
    id: string;
    [key: string]: unknown;
  };

  // Session data
  session?: Record<string, unknown>;

  // Timestamp of execution
  timestamp: number;

  // Variables for storing intermediate results
  variables: Record<string, unknown>;
}

/**
 * Trigger component for the rules engine
 */
export interface Trigger {
  // Type identifier for the trigger
  type: string;

  /**
   * Evaluates whether the trigger should fire
   * @param context The execution context
   * @returns A promise that resolves to true if the trigger should fire
   */
  evaluate(context: RuleContext): Promise<boolean>;
}

/**
 * Factory function type for creating triggers
 */
export type TriggerFactory = (config: Record<string, unknown>) => Trigger;

/**
 * Condition component for the rules engine
 */
export interface Condition {
  // Type identifier for the condition
  type: string;

  /**
   * Evaluates whether the condition is satisfied
   * @param context The execution context
   * @returns A promise that resolves to true if the condition is satisfied
   */
  evaluate(context: RuleContext): Promise<boolean>;
}

/**
 * Factory function type for creating conditions
 */
export type ConditionFactory = (config: Record<string, unknown>) => Condition;

/**
 * Action component for the rules engine
 */
export interface Action {
  // Type identifier for the action
  type: string;

  /**
   * Executes the action
   * @param context The execution context
   * @returns A promise that resolves to the result of the action
   */
  execute(context: RuleContext): Promise<Record<string, unknown>>;
}

/**
 * Factory function type for creating actions
 */
export type ActionFactory = (config: Record<string, unknown>) => Action;

/**
 * Context for rule execution
 */
export interface RuleExecutionContext {
  rule: Rule;
  triggerData: Record<string, unknown>;
  integrationData: Record<string, unknown>;
  startTime: number;
  timestamp: Date;
  logger: RuleLogger;
}

/**
 * Result of rule execution
 */
export interface RuleExecutionResult {
  ruleId: string;
  status: RuleExecutionStatus;
  details: Record<string, unknown>;
  error?: string;
  timeTaken: number;
  actionsExecuted: number;
  actionResults: ActionResult[];
}

/**
 * Result of rule evaluation (before executing actions)
 */
export interface RuleEvaluationResult {
  ruleId: string;
  triggered: boolean;
  conditionsMet: boolean;
  details: Record<string, unknown>;
  error?: string;
  timeTaken: number;
}

/**
 * Result of action execution
 */
export interface ActionResult {
  actionType: string;
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
  timeTaken: number;
}

/**
 * Status of rule execution
 */
export type RuleExecutionStatus = "success" | "error" | "skipped";

/**
 * Logger interface for rule execution
 */
export interface RuleLogger {
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, error: Error, data?: Record<string, unknown>): void;
  startTimer(label: string): void;
  endTimer(label: string): number;
  getEntries(): LogEntry[];
}

/**
 * Log entry
 */
export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  error?: Error;
}

/**
 * Log level
 */
export type LogLevel = "info" | "warn" | "error";

/**
 * Trigger event that can trigger rules
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
 * Integration interface for database documents
 */
export interface IntegrationDocument {
  _id: Id<"integrations">;
  _creationTime: number;
  name: string;
  type: string;
  description?: string;
  isEnabled: boolean;
  apiKey: string;
  apiEndpoint?: string;
  refreshToken?: string;
  lastConnectionCheck?: number;
  connectionStatus?: string;
  lastError?: string;
  consecutiveErrorCount?: number;
  config?: string;
  metadata?: string;
  autoSync?: boolean;
  processSubitems?: boolean;
}

/**
 * Rule Execution interface for database documents
 */
export interface RuleExecutionDocument {
  _id: Id<"ruleExecutions">;
  _creationTime: number;
  ruleId: Id<"rules">;
  integrationId: Id<"integrations">;
  executedAt: number;
  status: "success" | "error" | "skipped";
  triggered: boolean;
  conditionsMet: boolean;
  triggerData: string;
  actionsExecuted: number;
  actionsSucceeded: number;
  actionsFailed: number;
  startTime: number;
  endTime: number;
  error?: string;
  details: string;
  timeTaken: number;
}

/**
 * Rule Execution Log interface for database documents
 */
export interface RuleExecutionLogDocument {
  _id: Id<"ruleExecutionLogs">;
  _creationTime: number;
  executionId: Id<"ruleExecutions">;
  timestamp: number;
  level: "info" | "warn" | "error";
  message: string;
  data?: string;
  component: string;
  componentId?: string;
}

/**
 * Action Result interface for database documents
 */
export interface ActionResultDocument {
  _id: Id<"actionResults">;
  _creationTime: number;
  executionId: Id<"ruleExecutions">;
  ruleId: Id<"rules">;
  integrationId: Id<"integrations">;
  actionType: string;
  actionConfig: string;
  executedAt: number;
  success: boolean;
  result: string;
  error?: string;
  timeTaken: number;
}
