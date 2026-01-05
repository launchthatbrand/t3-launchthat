/**
 * Type definitions for the notifications module
 */

// Plugin-agnostic event key
export type NotificationEventKey = string;

// Notification preference interface
export interface NotificationPreference {
  emailEnabled: boolean;
  appEnabled: boolean;
  pushEnabled?: boolean;
}

// Notification content interface
export interface NotificationContent {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

// Notification payload (opaque). Plugins can provide their own shape.
export type NotificationData = Record<string, unknown>;
