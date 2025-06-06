/**
 * Audit logging functionality for integrations
 *
 * This file contains functions for logging audit events in the integrations system.
 */
import { v } from "convex/values";

import { Id } from "../_generated/dataModel";
import { internalMutation } from "../_generated/server";

/**
 * Log an audit event for integrations activities
 */
export const logAuditEvent = internalMutation({
  args: {
    event: v.string(),
    userId: v.union(v.id("users"), v.null()),
    resourceType: v.string(),
    resourceId: v.union(
      v.id("nodes"),
      v.id("scenarios"),
      v.id("connections"),
      v.id("apps"),
      v.string(), // For cases where the ID might not be a document ID
    ),
    details: v.object({}),
  },
  returns: v.id("auditLogs"),
  handler: async (ctx, args) => {
    // Create an audit log entry
    return await ctx.db.insert("auditLogs", {
      event: args.event,
      userId: args.userId,
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      timestamp: Date.now(),
      details: args.details,
    });
  },
});
