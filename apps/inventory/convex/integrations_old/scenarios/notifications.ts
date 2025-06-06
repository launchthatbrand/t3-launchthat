/**
 * Scenario Execution Notifications System
 *
 * This file provides functionality for generating and sending notifications
 * for scenario execution events, especially errors and failures.
 */

import { Infer, v } from "convex/values";

import { internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import { ErrorCategory, ErrorSeverity } from "../lib/errorHandling";

// Notification types
export enum NotificationType {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

// Notification channels
export enum NotificationChannel {
  IN_APP = "in_app",
  EMAIL = "email",
  WEBHOOK = "webhook",
  SMS = "sms",
}

// Notification configuration
export interface NotificationConfig {
  enabled: boolean;
  channels: NotificationChannel[];
  minSeverity: NotificationType;
  throttleInterval?: number; // In milliseconds
}

// Default notification configuration
export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  enabled: true,
  channels: [NotificationChannel.IN_APP],
  minSeverity: NotificationType.ERROR,
  throttleInterval: 5 * 60 * 1000, // 5 minutes
};

// Last notification time tracking (to prevent notification storms)
const lastNotificationTime: Map<string, number> = new Map();

/**
 * Create a notification key for throttling
 */
function createNotificationKey(
  userId: string,
  scenarioId: string,
  type: string,
): string {
  return `${userId}:${scenarioId}:${type}`;
}

/**
 * Check if a notification should be throttled
 */
function shouldThrottleNotification(
  userId: string,
  scenarioId: string,
  type: string,
  config: NotificationConfig,
): boolean {
  // If throttling is disabled, never throttle
  if (!config.throttleInterval) {
    return false;
  }

  const key = createNotificationKey(userId, scenarioId, type);
  const lastTime = lastNotificationTime.get(key);

  // If we've never sent this notification before, don't throttle
  if (lastTime === undefined) {
    return false;
  }

  // Check if enough time has passed since the last notification
  const now = Date.now();
  return now - lastTime < config.throttleInterval;
}

/**
 * Record that a notification was sent
 */
function recordNotificationSent(
  userId: string,
  scenarioId: string,
  type: string,
): void {
  const key = createNotificationKey(userId, scenarioId, type);
  lastNotificationTime.set(key, Date.now());
}

/**
 * Map error severity to notification type
 */
function mapErrorSeverityToNotificationType(
  severity: ErrorSeverity,
): NotificationType {
  switch (severity) {
    case ErrorSeverity.LOW:
      return NotificationType.INFO;
    case ErrorSeverity.MEDIUM:
      return NotificationType.WARNING;
    case ErrorSeverity.HIGH:
      return NotificationType.ERROR;
    case ErrorSeverity.CRITICAL:
      return NotificationType.CRITICAL;
    default:
      return NotificationType.WARNING;
  }
}

/**
 * Send a notification to a user
 */
export async function sendNotification(
  ctx: any,
  args: {
    userId: Id<"users">;
    type: NotificationType;
    title: string;
    message: string;
    details?: Record<string, unknown>;
    scenarioId?: Id<"scenarios">;
    executionId?: Id<"scenario_executions">;
    channels?: NotificationChannel[];
  },
  config: NotificationConfig = DEFAULT_NOTIFICATION_CONFIG,
): Promise<boolean> {
  // Check if notifications are enabled
  if (!config.enabled) {
    return false;
  }

  // Check if the notification meets the minimum severity
  const severityLevels = [
    NotificationType.INFO,
    NotificationType.WARNING,
    NotificationType.ERROR,
    NotificationType.CRITICAL,
  ];

  const notificationLevel = severityLevels.indexOf(args.type);
  const minLevel = severityLevels.indexOf(config.minSeverity);

  if (notificationLevel < minLevel) {
    return false;
  }

  // Check if we should throttle this notification
  if (
    args.scenarioId &&
    shouldThrottleNotification(
      args.userId.toString(),
      args.scenarioId.toString(),
      args.type,
      config,
    )
  ) {
    return false;
  }

  // Determine which channels to use
  const channels = args.channels || config.channels;

  // Send to each enabled channel
  const results = await Promise.all(
    channels.map(async (channel) => {
      try {
        switch (channel) {
          case NotificationChannel.IN_APP:
            // Create an in-app notification
            await ctx.runMutation(internal.notifications.createNotification, {
              userId: args.userId,
              type: args.type,
              title: args.title,
              message: args.message,
              metadata: {
                ...args.details,
                scenarioId: args.scenarioId,
                executionId: args.executionId,
                source: "scenario_execution",
              },
            });
            return true;

          case NotificationChannel.EMAIL:
            // Send an email notification (implementation would depend on email provider)
            console.log(
              `[EMAIL NOTIFICATION] To: ${args.userId}, Title: ${args.title}, Message: ${args.message}`,
            );
            // TODO: Implement actual email sending
            return true;

          case NotificationChannel.WEBHOOK:
            // Send a webhook notification (implementation would depend on webhook configuration)
            console.log(
              `[WEBHOOK NOTIFICATION] Title: ${args.title}, Message: ${args.message}`,
            );
            // TODO: Implement actual webhook notification
            return true;

          case NotificationChannel.SMS:
            // Send an SMS notification (implementation would depend on SMS provider)
            console.log(
              `[SMS NOTIFICATION] To: ${args.userId}, Message: ${args.title}`,
            );
            // TODO: Implement actual SMS sending
            return true;

          default:
            return false;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
        return false;
      }
    }),
  );

  // Record that we sent this notification
  if (args.scenarioId) {
    recordNotificationSent(
      args.userId.toString(),
      args.scenarioId.toString(),
      args.type,
    );
  }

  // Return true if at least one channel succeeded
  return results.some(Boolean);
}

/**
 * Send an execution error notification
 */
export async function sendExecutionErrorNotification(
  ctx: any,
  args: {
    userId: Id<"users">;
    scenarioId: Id<"scenarios">;
    executionId: Id<"scenario_executions">;
    scenarioName: string;
    error: unknown;
    errorCategory: ErrorCategory;
    errorSeverity: ErrorSeverity;
  },
  config?: NotificationConfig,
): Promise<boolean> {
  // Map error severity to notification type
  const notificationType = mapErrorSeverityToNotificationType(
    args.errorSeverity,
  );

  // Create error message
  const errorMessage =
    args.error instanceof Error ? args.error.message : String(args.error);

  // Send the notification
  return await sendNotification(
    ctx,
    {
      userId: args.userId,
      type: notificationType,
      title: `Scenario Execution Failed: ${args.scenarioName}`,
      message: `Execution failed with error: ${errorMessage}`,
      details: {
        errorCategory: args.errorCategory,
        errorSeverity: args.errorSeverity,
        errorMessage,
      },
      scenarioId: args.scenarioId,
      executionId: args.executionId,
    },
    config,
  );
}

/**
 * Send a node error notification
 */
export async function sendNodeErrorNotification(
  ctx: any,
  args: {
    userId: Id<"users">;
    scenarioId: Id<"scenarios">;
    executionId: Id<"scenario_executions">;
    nodeId: Id<"nodes">;
    nodeName: string;
    scenarioName: string;
    error: unknown;
    errorCategory: ErrorCategory;
    errorSeverity: ErrorSeverity;
    retryScheduled?: boolean;
    retryAttempt?: number;
    maxRetries?: number;
  },
  config?: NotificationConfig,
): Promise<boolean> {
  // Map error severity to notification type
  const notificationType = mapErrorSeverityToNotificationType(
    args.errorSeverity,
  );

  // Create error message
  const errorMessage =
    args.error instanceof Error ? args.error.message : String(args.error);

  // Add retry information to the message if applicable
  let message = `Node "${args.nodeName}" failed with error: ${errorMessage}`;

  if (args.retryScheduled) {
    message += ` Retry scheduled (attempt ${args.retryAttempt} of ${args.maxRetries}).`;
  } else if (args.retryAttempt && args.retryAttempt > 0) {
    message += ` All retry attempts exhausted (${args.retryAttempt}/${args.maxRetries}).`;
  }

  // Send the notification
  return await sendNotification(
    ctx,
    {
      userId: args.userId,
      type: notificationType,
      title: `Node Execution Failed: ${args.scenarioName}`,
      message,
      details: {
        nodeName: args.nodeName,
        nodeId: args.nodeId,
        errorCategory: args.errorCategory,
        errorSeverity: args.errorSeverity,
        errorMessage,
        retryScheduled: args.retryScheduled,
        retryAttempt: args.retryAttempt,
        maxRetries: args.maxRetries,
      },
      scenarioId: args.scenarioId,
      executionId: args.executionId,
    },
    config,
  );
}

// Notification preferences validator
export const notificationPreferencesValidator = v.object({
  enabled: v.boolean(),
  channels: v.array(
    v.union(
      v.literal(NotificationChannel.IN_APP),
      v.literal(NotificationChannel.EMAIL),
      v.literal(NotificationChannel.WEBHOOK),
      v.literal(NotificationChannel.SMS),
    ),
  ),
  minSeverity: v.union(
    v.literal(NotificationType.INFO),
    v.literal(NotificationType.WARNING),
    v.literal(NotificationType.ERROR),
    v.literal(NotificationType.CRITICAL),
  ),
  throttleInterval: v.optional(v.number()),
});

export type NotificationPreferences = Infer<
  typeof notificationPreferencesValidator
>;
