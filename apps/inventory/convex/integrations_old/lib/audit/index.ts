/**
 * Audit logging system for the integrations module
 *
 * This file provides functions for logging security-related events
 * and tracking access to sensitive resources.
 */
import { v } from "convex/values";

import { Id } from "../../../_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  MutationCtx,
} from "../../../_generated/server";
import { getOptionalUserId } from "../auth";

/**
 * Audit event types
 */
export enum AuditEventType {
  // Access events
  RESOURCE_ACCESS = "resource_access",
  ACCESS_DENIED = "access_denied",
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILURE = "login_failure",
  LOGOUT = "logout",

  // Credential events
  CREDENTIAL_CREATE = "credential_create",
  CREDENTIAL_UPDATE = "credential_update",
  CREDENTIAL_DELETE = "credential_delete",
  CREDENTIAL_ROTATION = "credential_rotation",
  CREDENTIAL_VALIDATION = "credential_validation",
  CREDENTIAL_READ = "credential_read",

  // Integration events
  CONNECTION_CREATE = "connection_create",
  CONNECTION_UPDATE = "connection_update",
  CONNECTION_DELETE = "connection_delete",
  CONNECTION_TEST = "connection_test",

  // Scenario events
  SCENARIO_CREATE = "scenario_create",
  SCENARIO_UPDATE = "scenario_update",
  SCENARIO_DELETE = "scenario_delete",
  SCENARIO_EXECUTE = "scenario_execute",
  SCENARIO_PAUSE = "scenario_pause",
  SCENARIO_RESUME = "scenario_resume",

  // Security events
  KEY_ROTATION = "key_rotation",
  PERMISSION_GRANT = "permission_grant",
  PERMISSION_REVOKE = "permission_revoke",
  SYSTEM_CONFIG_CHANGE = "system_config_change",
}

/**
 * Audit event status
 */
export enum AuditEventStatus {
  SUCCESS = "success",
  FAILURE = "failure",
  WARNING = "warning",
  INFO = "info",
}

/**
 * Audit event severity
 */
export enum AuditEventSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Audit event data structure
 */
export interface AuditEvent {
  type: AuditEventType;
  status: AuditEventStatus;
  severity: AuditEventSeverity;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  details: Record<string, any>;
}

/**
 * Type-safe audit event creator for credential events
 */
export function createCredentialAuditEvent(params: {
  type:
    | AuditEventType.CREDENTIAL_CREATE
    | AuditEventType.CREDENTIAL_UPDATE
    | AuditEventType.CREDENTIAL_DELETE
    | AuditEventType.CREDENTIAL_ROTATION
    | AuditEventType.CREDENTIAL_VALIDATION;
  status: AuditEventStatus;
  userId?: string;
  connectionId: Id<"connections">;
  appId?: Id<"apps">;
  hasCredentials?: boolean;
  source?: string;
  details?: Record<string, any>;
}): AuditEvent {
  const {
    type,
    status,
    userId,
    connectionId,
    appId,
    hasCredentials,
    source,
    details = {},
  } = params;

  // Determine severity based on event type and status
  let severity = AuditEventSeverity.LOW;
  if (status === AuditEventStatus.FAILURE) {
    severity = AuditEventSeverity.MEDIUM;
  }
  if (
    type === AuditEventType.CREDENTIAL_DELETE &&
    status === AuditEventStatus.SUCCESS
  ) {
    severity = AuditEventSeverity.MEDIUM;
  }

  return {
    type,
    status,
    severity,
    timestamp: Date.now(),
    userId,
    resourceType: "connection",
    resourceId: connectionId,
    details: {
      connectionId,
      appId,
      hasCredentials,
      source,
      ...details,
    },
  };
}

/**
 * Type-safe audit event creator for access events
 */
export function createAccessAuditEvent(params: {
  type: AuditEventType.RESOURCE_ACCESS | AuditEventType.ACCESS_DENIED;
  status: AuditEventStatus;
  severity?: AuditEventSeverity;
  userId?: string;
  resourceType: string;
  resourceId: string;
  permissionLevel?: string;
  action?: string;
  reason?: string;
  details?: Record<string, any>;
}): AuditEvent {
  const {
    type,
    status,
    severity = AuditEventSeverity.LOW,
    userId,
    resourceType,
    resourceId,
    permissionLevel,
    action,
    reason,
    details = {},
  } = params;

  // Adjust severity for access denied events
  let finalSeverity = severity;
  if (
    type === AuditEventType.ACCESS_DENIED &&
    status === AuditEventStatus.FAILURE
  ) {
    finalSeverity = AuditEventSeverity.MEDIUM;
  }

  return {
    type,
    status,
    severity: finalSeverity,
    timestamp: Date.now(),
    userId,
    resourceType,
    resourceId,
    details: {
      resourceType,
      resourceId,
      permissionLevel,
      action,
      reason,
      ...details,
    },
  };
}

/**
 * Type-safe audit event creator for security events
 */
export function createSecurityAuditEvent(params: {
  type:
    | AuditEventType.KEY_ROTATION
    | AuditEventType.PERMISSION_GRANT
    | AuditEventType.PERMISSION_REVOKE
    | AuditEventType.SYSTEM_CONFIG_CHANGE;
  status: AuditEventStatus;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  details: Record<string, any>;
}): AuditEvent {
  const { type, status, userId, resourceType, resourceId, details } = params;

  // Security events are generally higher severity
  let severity = AuditEventSeverity.MEDIUM;
  if (type === AuditEventType.KEY_ROTATION) {
    severity = AuditEventSeverity.HIGH;
  }
  if (status === AuditEventStatus.FAILURE) {
    severity = AuditEventSeverity.HIGH;
  }

  return {
    type,
    status,
    severity,
    timestamp: Date.now(),
    userId,
    resourceType,
    resourceId,
    details,
  };
}

/**
 * Log an audit event to the database
 */
export const logAuditEvent = async (
  ctx: MutationCtx,
  action: string,
  resourceType: string,
  resourceId:
    | Id<"audit_logs">
    | Id<"connections">
    | Id<"apps">
    | Id<"scenarios">,
  metadata: Record<string, unknown> = {},
): Promise<void> => {
  const userId = await getOptionalUserId(ctx);

  await ctx.db.insert("audit_logs", {
    action,
    resourceType,
    resourceId: resourceId as Id<"audit_logs">,
    userId,
    timestamp: Date.now(),
    metadata,
  });
};

/**
 * Sanitize an audit event to remove sensitive data
 *
 * @param event The audit event to sanitize
 * @returns Sanitized audit event
 */
function sanitizeAuditEvent(event: AuditEvent): AuditEvent {
  // Make a deep copy of the event
  const sanitized = JSON.parse(JSON.stringify(event)) as AuditEvent;

  // Remove sensitive fields from details
  if (sanitized.details) {
    // Remove credentials
    if ("credentials" in sanitized.details) {
      delete sanitized.details.credentials;
    }

    // Replace token values with "[REDACTED]"
    for (const key in sanitized.details) {
      if (
        typeof sanitized.details[key] === "string" &&
        (key.toLowerCase().includes("token") ||
          key.toLowerCase().includes("password") ||
          key.toLowerCase().includes("secret") ||
          key.toLowerCase().includes("key"))
      ) {
        sanitized.details[key] = "[REDACTED]";
      }
    }

    // Add a flag indicating data was sanitized
    sanitized.details._sanitized = true;
  }

  return sanitized;
}

/**
 * Query audit logs with filtering and pagination
 */
export const queryAuditLogs = internalQuery({
  args: {
    filters: v.optional(
      v.object({
        userId: v.optional(v.string()),
        resourceType: v.optional(v.string()),
        resourceId: v.optional(v.string()),
        type: v.optional(v.string()),
        status: v.optional(v.string()),
        severity: v.optional(v.string()),
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
      }),
    ),
    pagination: v.optional(
      v.object({
        cursor: v.optional(v.string()),
        limit: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { filters = {}, pagination = {} } = args;
    const { cursor, limit = 50 } = pagination;

    // Start building the query
    let query = ctx.db.query("audit_logs");

    // Apply filters
    if (filters.userId) {
      query = query.filter((q) => q.eq(q.field("userId"), filters.userId));
    }

    if (filters.resourceType) {
      query = query.filter((q) =>
        q.eq(q.field("resourceType"), filters.resourceType),
      );
    }

    if (filters.resourceId) {
      query = query.filter((q) =>
        q.eq(q.field("resourceId"), filters.resourceId),
      );
    }

    if (filters.type) {
      query = query.filter((q) => q.eq(q.field("type"), filters.type));
    }

    if (filters.status) {
      query = query.filter((q) => q.eq(q.field("status"), filters.status));
    }

    if (filters.severity) {
      query = query.filter((q) => q.eq(q.field("severity"), filters.severity));
    }

    if (filters.startTime && filters.endTime) {
      query = query.filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), filters.startTime!),
          q.lte(q.field("timestamp"), filters.endTime!),
        ),
      );
    } else if (filters.startTime) {
      query = query.filter((q) =>
        q.gte(q.field("timestamp"), filters.startTime!),
      );
    } else if (filters.endTime) {
      query = query.filter((q) =>
        q.lte(q.field("timestamp"), filters.endTime!),
      );
    }

    // Sort by timestamp in descending order (newest first)
    query = query.order("desc");

    // Apply pagination
    const paginationOpts = cursor
      ? { cursor, numItems: limit }
      : { numItems: limit };

    try {
      return await query.paginate(paginationOpts);
    } catch (error) {
      // If the audit_logs table doesn't exist, return empty results
      console.error("Failed to query audit logs:", error);
      return {
        page: [],
        isDone: true,
        continueCursor: null,
      };
    }
  },
});
