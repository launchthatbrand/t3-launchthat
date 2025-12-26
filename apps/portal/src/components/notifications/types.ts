import { Id } from "@/convex/_generated/dataModel";

// Base notification type for notifications in the system
export interface Notification {
  _id: string;
  _creationTime: number;
  type: NotificationType;
  title: string;
  content?: string;
  userId: Id<"users">;
  sourceUserId?: Id<"users">;
  sourceType?: string;
  sourceId?: string;
  actionUrl?: string;
  read: boolean;
  channel?: "inApp" | "email" | "push";
}

// Notification types enum - all possible notification types in the system
export type NotificationType =
  // Feed-related notifications
  | "reaction"
  | "comment"
  | "commentReply"
  | "mention"
  | "share"
  | "newFollowedUserPost"

  // General notifications
  | "friendRequest"
  | "friendAccepted"
  | "message"

  // Group notifications
  | "groupInvite"
  | "groupJoinRequest"
  | "groupJoinApproved"
  | "groupJoinRejected"
  | "groupPost"
  | "groupComment"
  | "groupInvitation"
  | "invitationAccepted"
  | "invitationDeclined"

  // Event notifications
  | "eventReminder"
  | "eventUpdate"
  | "eventInvite"

  // Course/LMS notifications
  | "courseEnrollment"
  | "courseCompletion"
  | "newCourseContent"
  | "assignmentDue"
  | "assignmentGraded"
  | "courseUpdate"

  // E-commerce notifications
  | "orderStatus"
  | "productUpdate"
  | "shipmentUpdate"
  | "orderConfirmation"
  | "paymentSuccess"
  | "paymentFailed"

  // System notifications
  | "systemUpdate"
  | "systemAnnouncement"
  | "accountSecurity"
  | "newDownload";

// Map to categorize notification types
export const NOTIFICATION_CATEGORIES: Record<
  NotificationCategory,
  NotificationType[]
> = {
  all: [], // Empty array for "all" - special case handled in filters
  activity: [
    "friendRequest",
    "friendAccepted",
    "message",
    "mention",
    "groupPost",
    "groupComment",
    // Add social feed notification types to activity category
    "reaction",
    "comment",
    "commentReply",
    "share",
    "newFollowedUserPost",
  ],
  group: [
    "groupInvite",
    "groupJoinRequest",
    "groupJoinApproved",
    "groupJoinRejected",
    "groupInvitation",
    "invitationAccepted",
    "invitationDeclined",
  ],
  event: ["eventInvite", "eventReminder", "eventUpdate"],
  system: ["systemAnnouncement", "courseUpdate", "newDownload"],
  ecommerce: [
    "orderConfirmation",
    "paymentSuccess",
    "paymentFailed",
    "productUpdate",
  ],
};

// Define the UI categories
export type NotificationCategory =
  | "all"
  | "activity"
  | "group"
  | "system"
  | "event"
  | "ecommerce";

// Define icons for notification categories
export const NOTIFICATION_CATEGORY_ICON = {
  activity: "FileText",
  group: "Users",
  system: "Bell",
  event: "Calendar",
  ecommerce: "ShoppingCart",
  all: "Bell",
} as const;

// Interface for notification filters
export interface NotificationFilters {
  type?: NotificationType;
  read?: boolean;
}

// Helper type for notification preferences
export interface NotificationPreferences {
  email: Record<string, boolean>;
  inApp: Record<string, boolean>;
  push: Record<string, boolean>;
  pushEnabled?: boolean;
}

// Feed-specific notification types
export type FeedNotificationType =
  | "reaction"
  | "comment"
  | "commentReply"
  | "mention"
  | "share"
  | "newFollowedUserPost";

// For notification cards and displays
export interface NotificationCardProps {
  id: string;
  type: NotificationType;
  title: string;
  content?: string;
  createdAt: number;
  sourceUser?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  actionUrl?: string;
  read: boolean;
  onMarkAsRead: (id: string) => void;
}

// Define props for the notification dropdown component
export interface NotificationDropdownProps {
  clerkId: string;
  orgId: string;
  onClose: () => void;
  error?: string | null;
}
