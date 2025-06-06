/**
 * Helper functions for the integrations module
 */
import { ConvexError } from "convex/values";

import { ConnectionStatus } from "./validators";

/**
 * Strip sensitive information from credentials for API responses
 * @param credentials Raw credentials object
 * @returns Object with field names but no values
 */
export function sanitizeCredentials(
  credentials: Record<string, unknown>,
): string[] {
  return Object.keys(credentials);
}

/**
 * Format timestamp for display in UI
 * @param timestamp Unix timestamp (milliseconds)
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Get status color for UI display
 * @param status Connection or execution status
 * @returns Color code for UI
 */
export function getStatusColor(
  status:
    | ConnectionStatus
    | "running"
    | "completed"
    | "failed"
    | "pending"
    | "skipped",
): string {
  switch (status) {
    case "active":
    case "completed":
      return "green";
    case "error":
    case "failed":
      return "red";
    case "disconnected":
      return "gray";
    case "running":
    case "pending":
      return "blue";
    case "skipped":
      return "yellow";
    default:
      return "gray";
  }
}

/**
 * Generate a unique operation ID for nodes
 * @param type Node type
 * @param appId App ID
 * @param operationId Operation ID within the app
 * @returns Globally unique operation identifier
 */
export function generateOperationId(
  type: "trigger" | "action",
  appId: string,
  operationId: string,
): string {
  return `${type}:${appId}:${operationId}`;
}

/**
 * Parse an operation ID to extract its components
 * @param operationId Operation ID to parse
 * @returns Object with type, appId, and operationId
 */
export function parseOperationId(operationId: string): {
  type: "trigger" | "action";
  appId: string;
  operationId: string;
} {
  const [type, appId, opId] = operationId.split(":");

  if (!type || !appId || !opId) {
    throw new ConvexError("Invalid operation ID format");
  }

  if (type !== "trigger" && type !== "action") {
    throw new ConvexError(`Invalid operation type: ${type}`);
  }

  return {
    type: type === "trigger" ? "trigger" : "action",
    appId,
    operationId: opId,
  };
}
