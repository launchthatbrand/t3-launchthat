// Re-export functions from execution.ts with namespace to avoid conflicts
import * as executionFunctions from "./execution";
// Re-export functions from triggers.ts with namespace to avoid conflicts
import * as triggerFunctions from "./triggers";

/**
 * Scenarios module for the integrations system
 *
 * This module provides functions for managing scenarios and nodes
 * in the integrations module.
 */

// Re-export all functions from management.ts
export * from "./management";

// Re-export all functions from nodes.ts
export * from "./nodes";

export const triggers = triggerFunctions;

export const execution = executionFunctions;
