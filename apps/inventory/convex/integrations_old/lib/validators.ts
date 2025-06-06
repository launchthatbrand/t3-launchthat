/**
 * Shared validators for the integrations module
 */ import { Infer, v } from "convex/values";

// Auth type validator
export const authTypeValidator = v.union(
  v.literal("oauth2"),
  v.literal("apiKey"),
  v.literal("basic"),
  v.literal("none"),
);
export type AuthType = Infer<typeof authTypeValidator>;

// Node type validator
export const nodeTypeValidator = v.union(
  v.literal("trigger"),
  v.literal("action"),
  v.literal("transformer"),
  v.literal("condition"),
);
export type NodeType = Infer<typeof nodeTypeValidator>;

// Scenario status validator
export const scenarioStatusValidator = v.union(
  v.literal("active"),
  v.literal("draft"),
  v.literal("paused"),
  v.literal("error"),
);
export type ScenarioStatus = Infer<typeof scenarioStatusValidator>;

// Connection status values as a constant to use in code
export const CONNECTION_STATUS = {
  ACTIVE: "active",
  ERROR: "error",
  DISCONNECTED: "disconnected",
  CONFIGURED: "configured",
  INCOMPLETE: "incomplete",
} as const;

// Connection status validator
export const connectionStatusValidator = v.union(
  v.literal(CONNECTION_STATUS.ACTIVE),
  v.literal(CONNECTION_STATUS.ERROR),
  v.literal(CONNECTION_STATUS.DISCONNECTED),
  v.literal(CONNECTION_STATUS.CONFIGURED),
  v.literal(CONNECTION_STATUS.INCOMPLETE),
);
export type ConnectionStatus = Infer<typeof connectionStatusValidator>;

// Execution status validator
export const executionStatusValidator = v.union(
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
);
export type ExecutionStatus = Infer<typeof executionStatusValidator>;

// Node execution status validator
export const nodeExecutionStatusValidator = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("skipped"),
);
export type NodeExecutionStatus = Infer<typeof nodeExecutionStatusValidator>;

// Schedule frequency validator
export const scheduleFrequencyValidator = v.union(
  v.literal("minutes"),
  v.literal("hourly"),
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("monthly"),
);
export type ScheduleFrequency = Infer<typeof scheduleFrequencyValidator>;

// Trigger definition validator
export const triggerDefinitionValidator = v.object({
  id: v.string(),
  name: v.string(),
  description: v.string(),
  inputSchema: v.any(), // Would be a more specific validator in real impl
  outputSchema: v.any(), // Would be a more specific validator in real impl
});
export type TriggerDefinition = Infer<typeof triggerDefinitionValidator>;

// Action definition validator
export const actionDefinitionValidator = v.object({
  id: v.string(),
  name: v.string(),
  description: v.string(),
  inputSchema: v.any(), // Would be a more specific validator in real impl
  outputSchema: v.any(), // Would be a more specific validator in real impl
});
export type ActionDefinition = Infer<typeof actionDefinitionValidator>;

// Transformer definition validator
export const transformerDefinitionValidator = v.object({
  id: v.string(),
  name: v.string(),
  description: v.string(),
  inputSchema: v.any(), // Would be a more specific validator in real impl
  outputSchema: v.any(), // Would be a more specific validator in real impl
  transform: v.string(), // A function body as a string to be evaluated
});
export type TransformerDefinition = Infer<
  typeof transformerDefinitionValidator
>;

// Condition definition validator
export const conditionDefinitionValidator = v.object({
  id: v.string(),
  name: v.string(),
  description: v.string(),
  inputSchema: v.any(), // Would be a more specific validator in real impl
  condition: v.string(), // A function body as a string to be evaluated
});
export type ConditionDefinition = Infer<typeof conditionDefinitionValidator>;

// Error handling config validator
export const errorHandlingValidator = v.object({
  retryCount: v.number(),
  notifyOnError: v.boolean(),
});
export type ErrorHandling = Infer<typeof errorHandlingValidator>;

// Schedule configuration validator
export const scheduleConfigValidator = v.object({
  frequency: scheduleFrequencyValidator,
  interval: v.number(),
  startTime: v.optional(v.number()),
  timezone: v.optional(v.string()),
  dayOfWeek: v.optional(v.number()),
  dayOfMonth: v.optional(v.number()),
});
export type ScheduleConfig = Infer<typeof scheduleConfigValidator>;

// Condition validator
export const conditionValidator = v.object({
  field: v.string(),
  operator: v.string(),
  value: v.object({}),
  combinator: v.optional(v.union(v.literal("and"), v.literal("or"))),
});
export type Condition = Infer<typeof conditionValidator>;

// Node execution result validator
export const nodeExecutionResultValidator = v.object({
  nodeId: v.id("nodes"),
  startTime: v.number(),
  endTime: v.optional(v.number()),
  status: nodeExecutionStatusValidator,
  input: v.object({}),
  output: v.optional(v.object({})),
  error: v.optional(v.object({})),
});
export type NodeExecutionResult = Infer<typeof nodeExecutionResultValidator>;

// Pagination options validator (for queries that return lists)
export const paginationOptsValidator = v.object({
  numItems: v.number(),
  cursor: v.union(v.string(), v.null()),
});
export type PaginationOpts = Infer<typeof paginationOptsValidator>;
