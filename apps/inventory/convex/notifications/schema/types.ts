/**
 * Type definitions for the notifications module
 */

// Notification types
export type NotificationType =
  | "friendRequest"
  | "friendAccepted"
  | "message"
  | "mention"
  | "groupInvite"
  | "groupJoinRequest"
  | "groupJoinApproved"
  | "groupJoinRejected"
  | "groupInvitation"
  | "invitationAccepted"
  | "invitationDeclined"
  | "groupPost"
  | "groupComment"
  | "eventInvite"
  | "eventReminder"
  | "eventUpdate"
  | "newDownload"
  | "courseUpdate"
  | "orderConfirmation"
  | "paymentSuccess"
  | "paymentFailed"
  | "productUpdate"
  | "systemAnnouncement";

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

// Notification data payload interface
export interface NotificationData {
  sourceUserId?: string;
  sourceGroupId?: string;
  sourceEventId?: string;
  sourceDownloadId?: string;
  sourceOrderId?: string;
  additionalData?: Record<string, unknown>;
}
