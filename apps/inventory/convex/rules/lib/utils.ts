/**
 * Rules Engine Utilities
 *
 * This module provides utility functions for the rules engine.
 */

import { ActionConfig, ConditionConfig, Rule } from "./interfaces";

/**
 * Utility functions for the rules engine
 */

/**
 * Parse a JSON string safely
 * @param jsonString The JSON string to parse
 * @param defaultValue The default value to return if parsing fails
 * @returns The parsed JSON object or the default value
 */
export function safeParseJson<T>(
  jsonString: string | undefined | null,
  defaultValue: T,
): T {
  if (!jsonString) {
    return defaultValue;
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return defaultValue;
  }
}

/**
 * Stringify an object to JSON safely
 * @param data The data to stringify
 * @param defaultValue The default value to return if stringification fails
 * @returns The JSON string or the default value
 */
export function safeStringifyJson<T>(data: T, defaultValue = "{}"): string {
  if (data === undefined || data === null) {
    return defaultValue;
  }

  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error("Error stringifying JSON:", error);
    return defaultValue;
  }
}

/**
 * Validates a configuration object against a set of required fields
 * @param config The configuration object to validate
 * @param requiredFields The required fields
 * @throws Error if any required field is missing
 */
export function validateRequiredFields(
  config: Record<string, unknown>,
  requiredFields: string[],
): void {
  for (const field of requiredFields) {
    if (config[field] === undefined) {
      throw new Error(`Required field '${field}' is missing`);
    }
  }
}

/**
 * Generates a unique ID with a specified prefix
 * @param prefix The prefix for the ID
 * @returns A unique ID
 */
export function generateId(prefix = "rule"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Checks if a value is a non-empty string
 * @param value The value to check
 * @returns True if the value is a non-empty string, false otherwise
 */
export function isNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim() !== "";
}

/**
 * Checks if a value is a valid URL
 * @param value The value to check
 * @returns True if the value is a valid URL, false otherwise
 */
export function isValidUrl(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Interface for rule document from database
 */
export interface RuleDbDoc {
  _id: string;
  _creationTime: number;
  name: string;
  description?: string;
  isEnabled: boolean;
  integrationId: string;
  integrationName: string;
  triggerType: string;
  triggerConfig: string;
  conditions: string;
  actions: string;
  priority: number;
  cooldownMs?: number;
  lastExecuted?: number;
  executionCount?: number;
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
  metadata?: string;
}

/**
 * Converts a database rule document to a rule object
 * @param doc The database document
 * @returns The rule object
 */
export function convertDocToRule(doc: any): Rule {
  return {
    id: doc._id,
    name: doc.name,
    description: doc.description,
    enabled: doc.isEnabled,
    priority: doc.priority,
    integrationId: doc.integrationId,
    integrationName: doc.integrationName,
    triggerType: doc.triggerType,
    triggerConfig: safeParseJson(doc.triggerConfig, {}),
    conditions: safeParseJson(doc.conditions, []),
    actions: safeParseJson(doc.actions, []),
    cooldownMs: doc.cooldownMs,
    lastExecuted: doc.lastTriggered,
    executionCount: doc.executionCount,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    createdBy: doc.createdBy,
    metadata: doc.metadata ? safeParseJson(doc.metadata, {}) : undefined,
  };
}

/**
 * Converts a rule object to a database document
 * @param rule The rule object
 * @returns The database document
 */
export function convertRuleToDoc(rule: Rule): Record<string, any> {
  return {
    name: rule.name,
    description: rule.description,
    isEnabled: rule.enabled,
    integrationId: rule.integrationId,
    integrationName: rule.integrationName,
    triggerType: rule.triggerType,
    triggerConfig: safeStringifyJson(rule.triggerConfig),
    conditions: safeStringifyJson(rule.conditions),
    actions: safeStringifyJson(rule.actions),
    priority: rule.priority,
    cooldownMs: rule.cooldownMs,
    lastTriggered: rule.lastExecuted,
    executionCount: rule.executionCount,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
    createdBy: rule.createdBy,
    metadata: rule.metadata ? safeStringifyJson(rule.metadata) : undefined,
  };
}
