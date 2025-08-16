import { z } from "zod";

// =====================================================
// CORE NODE TYPES FOR MODULAR STRUCTURE
// =====================================================

// Base metadata for all nodes (internal and external)
export interface NodeMetadata {
  id: string;
  name: string;
  description: string;
  type: "internal" | "external";
  category: string;
  version: string;
  icon?: string;
  color?: string;
}

// =====================================================
// ACTION TYPES
// =====================================================

// Execution context passed to actions
export interface ActionExecutionContext {
  nodeId: string;
  scenarioId: string;
  inputData: unknown;
  settings?: unknown;
  connections: Record<string, any>; // External connections
  convex?: any; // Convex API for internal nodes
  environment: "development" | "production" | "staging";
  userId?: string;
  organizationId?: string;
}

// Result returned from action execution
export interface ActionExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  logs?: string[];
  metadata?: Record<string, unknown>;
}

// Action definition
export interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: z.ZodSchema<any>;
  outputSchema: z.ZodSchema<any>;
  settingsSchema?: z.ZodSchema<any>;
  execute: (context: ActionExecutionContext) => Promise<ActionExecutionResult>;
  validate?: (settings: unknown) => Promise<boolean>;

  // UI configuration
  ui?: {
    category?: string;
    featured?: boolean;
    examples?: Array<{
      name: string;
      description: string;
      input: unknown;
    }>;
    documentation?: {
      description?: string;
      usage?: string;
      notes?: string[];
    };
  };
}

// =====================================================
// TRIGGER TYPES
// =====================================================

// Context for setting up triggers
export interface TriggerSetupContext {
  triggerId: string;
  scenarioId: string;
  connection?: any; // External connection for external triggers
  convex?: any; // Convex API for internal triggers
  settings?: unknown;
  webhookUrl?: string; // Webhook URL for this trigger
  baseUrl: string; // Platform base URL
  environment: "development" | "production" | "staging";
  userId?: string;
  organizationId?: string;
}

// Context for tearing down triggers
export interface TriggerTeardownContext {
  triggerId: string;
  scenarioId: string;
  connection?: any;
  convex?: any;
  settings?: unknown;
  environment: "development" | "production" | "staging";
  userId?: string;
  organizationId?: string;
}

// Result from trigger execution (when trigger fires)
export interface TriggerExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  logs?: string[];
  metadata?: Record<string, unknown>;
}

// Trigger definition
export interface TriggerDefinition {
  id: string;
  name: string;
  description: string;
  outputSchema: z.ZodSchema<any>;
  settingsSchema?: z.ZodSchema<any>;

  // Trigger lifecycle
  setup: (context: TriggerSetupContext) => Promise<void>;
  teardown: (context: TriggerTeardownContext) => Promise<void>;
  validate?: (settings: unknown) => Promise<boolean>;

  // Trigger configuration
  type: "webhook" | "polling" | "event" | "schedule";
  pollInterval?: number; // For polling triggers (in milliseconds)

  // UI configuration
  ui?: {
    category?: string;
    featured?: boolean;
    examples?: Array<{
      name: string;
      description: string;
      settings: unknown;
    }>;
    documentation?: {
      description?: string;
      setup?: string;
      notes?: string[];
    };
  };
}

// =====================================================
// CONNECTION TYPES (External nodes only)
// =====================================================

// Connection definition for external services
export interface ConnectionDefinition {
  id: string;
  name: string;
  type: "oauth2" | "api_key" | "basic_auth" | "bearer_token" | "custom";
  authSchema: z.ZodSchema<any>;
  testConnection?: (auth: unknown) => Promise<boolean>;

  // OAuth2 specific configuration
  oauth2Config?: {
    authorizationUrl: string;
    tokenUrl: string;
    scopes?: string[];
    additionalParams?: Record<string, string>;
  };

  // UI configuration
  ui?: {
    description?: string;
    instructions?: string;
    fields?: Array<{
      key: string;
      label: string;
      type: "text" | "password" | "url" | "textarea" | "select";
      description?: string;
      required?: boolean;
      placeholder?: string;
      options?: Array<{ value: string; label: string }>;
    }>;
  };
}

// =====================================================
// COMPLETE NODE DEFINITION
// =====================================================

// Complete node definition combining all parts
export interface NodeDefinition {
  metadata: NodeMetadata;
  actions: Record<string, ActionDefinition>;
  triggers: Record<string, TriggerDefinition>;
  connection?: ConnectionDefinition; // Only for external nodes

  // Node-level configuration
  settings?: {
    schema: z.ZodSchema<any>;
    ui?: {
      title?: string;
      description?: string;
      sections?: Array<{
        title: string;
        fields: string[];
      }>;
    };
  };

  // Lifecycle hooks
  onInstall?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
}

// =====================================================
// REGISTRY TYPES
// =====================================================

// Node registry interface
export interface NodeRegistry {
  register(node: NodeDefinition): void;
  unregister(nodeId: string): void;
  get(nodeId: string): NodeDefinition | undefined;
  getAll(): NodeDefinition[];
  getByType(type: "internal" | "external"): NodeDefinition[];
  getByCategory(category: string): NodeDefinition[];
  getAction(nodeId: string, actionId: string): ActionDefinition | undefined;
  getTrigger(nodeId: string, triggerId: string): TriggerDefinition | undefined;
}

// Connection registry interface
export interface ConnectionRegistry {
  register(connection: ConnectionDefinition): void;
  unregister(connectionId: string): void;
  get(connectionId: string): ConnectionDefinition | undefined;
  getAll(): ConnectionDefinition[];
}

// =====================================================
// UTILITY TYPES
// =====================================================

// Helper type to extract action IDs from a node
export type NodeActionIds<T extends NodeDefinition> = keyof T["actions"];

// Helper type to extract trigger IDs from a node
export type NodeTriggerIds<T extends NodeDefinition> = keyof T["triggers"];

// Helper type for action input based on schema
export type ActionInput<T extends ActionDefinition> = z.infer<T["inputSchema"]>;

// Helper type for action output based on schema
export type ActionOutput<T extends ActionDefinition> = z.infer<
  T["outputSchema"]
>;

// Helper type for trigger output based on schema
export type TriggerOutput<T extends TriggerDefinition> = z.infer<
  T["outputSchema"]
>;

// =====================================================
// VALIDATION HELPERS
// =====================================================

// Validate node definition structure
export function validateNodeDefinition(node: unknown): node is NodeDefinition {
  try {
    const n = node as NodeDefinition;

    // Check required properties
    if (!n.metadata || !n.actions || !n.triggers) {
      return false;
    }

    // Validate metadata
    if (!n.metadata.id || !n.metadata.name || !n.metadata.type) {
      return false;
    }

    // Validate type is correct
    if (n.metadata.type !== "internal" && n.metadata.type !== "external") {
      return false;
    }

    // External nodes must have connection
    if (n.metadata.type === "external" && !n.connection) {
      return false;
    }

    // Internal nodes should not have connection
    if (n.metadata.type === "internal" && n.connection) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Validate action definition
export function validateActionDefinition(
  action: unknown,
): action is ActionDefinition {
  try {
    const a = action as ActionDefinition;

    return !!(
      a.id &&
      a.name &&
      a.description &&
      a.inputSchema &&
      a.outputSchema &&
      a.execute &&
      typeof a.execute === "function"
    );
  } catch {
    return false;
  }
}

// Validate trigger definition
export function validateTriggerDefinition(
  trigger: unknown,
): trigger is TriggerDefinition {
  try {
    const t = trigger as TriggerDefinition;

    return !!(
      t.id &&
      t.name &&
      t.description &&
      t.outputSchema &&
      t.setup &&
      t.teardown &&
      t.type &&
      typeof t.setup === "function" &&
      typeof t.teardown === "function"
    );
  } catch {
    return false;
  }
}

// =====================================================
// EXECUTION HELPERS
// =====================================================

// Execute an action with proper error handling
export async function executeAction(
  action: ActionDefinition,
  context: ActionExecutionContext,
): Promise<ActionExecutionResult> {
  try {
    // Validate input against schema
    const validatedInput = action.inputSchema.parse(context.inputData);

    // Execute with validated input
    const result = await action.execute({
      ...context,
      inputData: validatedInput,
    });

    // Validate output against schema
    action.outputSchema.parse(result.data);

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      logs: [`Action execution failed: ${error}`],
    };
  }
}

// Setup a trigger with proper error handling
export async function setupTrigger(
  trigger: TriggerDefinition,
  context: TriggerSetupContext,
): Promise<{ success: boolean; error?: string }> {
  try {
    await trigger.setup(context);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Teardown a trigger with proper error handling
export async function teardownTrigger(
  trigger: TriggerDefinition,
  context: TriggerTeardownContext,
): Promise<{ success: boolean; error?: string }> {
  try {
    await trigger.teardown(context);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// BUILDER HELPERS
// =====================================================

// Helper to create action definitions with type safety
export function createAction<
  Input extends z.ZodSchema<any>,
  Output extends z.ZodSchema<any>,
  Settings extends z.ZodSchema<any> = z.ZodVoid,
>(config: {
  id: string;
  name: string;
  description: string;
  inputSchema: Input;
  outputSchema: Output;
  settingsSchema?: Settings;
  execute: (context: ActionExecutionContext) => Promise<ActionExecutionResult>;
  validate?: (settings: z.infer<Settings>) => Promise<boolean>;
  ui?: ActionDefinition["ui"];
}): ActionDefinition {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    inputSchema: config.inputSchema,
    outputSchema: config.outputSchema,
    settingsSchema: config.settingsSchema,
    execute: config.execute,
    validate: config.validate,
    ui: config.ui,
  };
}

// Helper to create trigger definitions with type safety
export function createTrigger<
  Output extends z.ZodSchema<any>,
  Settings extends z.ZodSchema<any> = z.ZodVoid,
>(config: {
  id: string;
  name: string;
  description: string;
  outputSchema: Output;
  settingsSchema?: Settings;
  type: TriggerDefinition["type"];
  pollInterval?: number;
  setup: (context: TriggerSetupContext) => Promise<void>;
  teardown: (context: TriggerTeardownContext) => Promise<void>;
  validate?: (settings: z.infer<Settings>) => Promise<boolean>;
  ui?: TriggerDefinition["ui"];
}): TriggerDefinition {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    outputSchema: config.outputSchema,
    settingsSchema: config.settingsSchema,
    type: config.type,
    pollInterval: config.pollInterval,
    setup: config.setup,
    teardown: config.teardown,
    validate: config.validate,
    ui: config.ui,
  };
}

// Helper to create node definitions with type safety
export function createNode(config: {
  metadata: NodeMetadata;
  actions: Record<string, ActionDefinition>;
  triggers: Record<string, TriggerDefinition>;
  connection?: ConnectionDefinition;
  settings?: NodeDefinition["settings"];
  onInstall?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
}): NodeDefinition {
  return {
    metadata: config.metadata,
    actions: config.actions,
    triggers: config.triggers,
    connection: config.connection,
    settings: config.settings,
    onInstall: config.onInstall,
    onUninstall: config.onUninstall,
  };
}
