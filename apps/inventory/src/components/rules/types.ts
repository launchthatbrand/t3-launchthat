import { GenericId } from "convex/values";
import { JSONSchema7 } from "json-schema";

// Use GenericId instead of specific table names
export type DocId = GenericId<string>;

export interface Rule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  integrationId: string;
  integrationName: string;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  conditions: ConditionConfig[];
  actions: ActionConfig[];
  priority: number;
  cooldownMs?: number;
  lastExecuted?: number;
  executionCount?: number;
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  metadata?: Record<string, unknown>;
  _id?: DocId;
}

export interface ConditionConfig {
  type: string;
  config: Record<string, unknown>;
}

export interface ActionConfig {
  type: string;
  config: Record<string, unknown>;
}

export interface RuleExecution {
  _id: DocId;
  _creationTime: number;
  ruleId: DocId;
  integrationId: DocId;
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

export interface Integration {
  _id: DocId;
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

export interface TriggerDefinition {
  type: string;
  name: string;
  description: string;
  configSchema: JSONSchema7;
}

export interface ConditionDefinition {
  type: string;
  name: string;
  description: string;
  configSchema: JSONSchema7;
}

export interface ActionDefinition {
  type: string;
  name: string;
  description: string;
  configSchema: JSONSchema7;
}

export interface RuleComponentsMap {
  triggers: TriggerDefinition[];
  conditions: ConditionDefinition[];
  actions: ActionDefinition[];
}
