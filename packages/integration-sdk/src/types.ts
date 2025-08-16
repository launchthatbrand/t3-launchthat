import { z } from "zod";

// Core integration node types
export type NodeType = "system" | "external";

export interface NodeMetadata {
  id: string;
  name: string;
  description: string;
  type: NodeType;
  category: string;
  version: string;
  icon?: string;
  color?: string;
}

// Enhanced I/O definition for nodes
export interface IODefinition {
  schema: z.ZodSchema<any>;
  description?: string;
  examples?: unknown[];
  required?: boolean;
}

// Configuration field definition for dynamic forms
export interface ConfigFieldDefinition {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "boolean" | "select" | "password";
  description?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: Array<{ value: string; label: string }>;
  validation?: z.ZodSchema<any>;
}

// Enhanced authentication configuration
export interface AuthConfiguration {
  type: "none" | "api_key" | "oauth2" | "basic_auth" | "bearer_token";
  fields: ConfigFieldDefinition[];
  testEndpoint?: string;
  scopes?: string[];
}

// Node processor interface - handles the actual execution logic
export interface NodeProcessor {
  execute: (context: NodeExecutionContext) => Promise<NodeExecutionResult>;
  validate?: (settings: unknown) => Promise<boolean> | boolean;
  setup?: () => Promise<void> | void;
  teardown?: () => Promise<void> | void;
}

// Configuration schema validation
export interface NodeConfigSchema {
  input: z.ZodSchema<any>;
  output: z.ZodSchema<any>;
  settings: z.ZodSchema<any>;
}

// Execution context for nodes
export interface NodeExecutionContext {
  nodeId: string;
  scenarioId: string;
  inputData: unknown;
  settings: unknown;
  connections: Record<string, any>;
  environment: "development" | "production" | "staging";
}

// Node execution result
export interface NodeExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  logs?: string[];
  metadata?: Record<string, unknown>;
}

// Integration node definition
export interface IntegrationNodeDefinition {
  metadata: NodeMetadata;
  configSchema: {
    input: IODefinition;
    output: IODefinition;
    settings: IODefinition;
  };
  processor: NodeProcessor;
  auth?: AuthConfiguration;
  configFields?: ConfigFieldDefinition[];
  onInstall?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
}

// Connection types for external integrations
export interface ConnectionDefinition {
  id: string;
  name: string;
  type: "oauth2" | "api_key" | "basic_auth" | "custom";
  authSchema: z.ZodSchema<any>;
  testConnection?: (auth: unknown) => Promise<boolean>;
}

// Registry types
export interface NodeRegistryEntry {
  definition: IntegrationNodeDefinition;
  connections?: ConnectionDefinition[];
  isEnabled: boolean;
  installedAt: Date;
}

export interface IntegrationRegistry {
  nodes: Map<string, NodeRegistryEntry>;
  getNode: (id: string) => NodeRegistryEntry | undefined;
  registerNode: (
    definition: IntegrationNodeDefinition,
    connections?: ConnectionDefinition[],
  ) => void;
  unregisterNode: (id: string) => void;
  listNodes: (filter?: {
    type?: NodeType;
    category?: string;
  }) => NodeRegistryEntry[];
}

// React Flow integration types
export interface ReactFlowNodeData {
  nodeId: string;
  nodeType: string;
  label: string;
  settings: unknown;
  connectionId?: string;
  isConfigured: boolean;
  hasError: boolean;
  lastExecution?: {
    timestamp: Date;
    success: boolean;
    duration: number;
  };
}

// Form generation types for dynamic configuration
export interface FormFieldDefinition {
  name: string;
  type: "text" | "number" | "boolean" | "select" | "textarea" | "password";
  label: string;
  description?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: z.ZodSchema<any>;
  defaultValue?: unknown;
  placeholder?: string;
  group?: string;
}

export interface DynamicFormSchema {
  fields: FormFieldDefinition[];
  groups?: Array<{ id: string; label: string; description?: string }>;
}

// Discovery and auto-loading types
export interface NodeDiscoveryResult {
  discovered: NodeRegistryEntry[];
  errors: NodeDiscoveryError[];
  totalScanned: number;
  duration: number;
}

export interface NodeDiscoveryError {
  path: string;
  error: string;
  severity: "warning" | "error";
}

export interface NodeLoader {
  scanDirectory: (basePath: string) => Promise<NodeDiscoveryResult>;
  loadNodeDefinition: (filePath: string) => Promise<IntegrationNodeDefinition>;
  validateNode: (definition: IntegrationNodeDefinition) => boolean;
}

// Enhanced registry with discovery capabilities
export interface EnhancedIntegrationRegistry extends IntegrationRegistry {
  discover: (basePath: string) => Promise<NodeDiscoveryResult>;
  autoRegisterFromDirectory: (basePath: string) => Promise<void>;
  getDiscoveryErrors: () => NodeDiscoveryError[];
  reload: () => Promise<void>;
}
