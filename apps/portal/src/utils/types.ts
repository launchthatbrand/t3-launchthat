/**
 * Types for social feed components
 */

// Notification types
export interface NotificationData {
  _id: string;
  type: string;
  title: string;
  content: string;
  read: boolean;
  sourceUserId?: string;
  actionUrl?: string;
  createdAt: number;
}

// Mention and hashtag types
export interface TextPart {
  type: "text" | "mention" | "hashtag";
  content: string;
  value?: string;
}

// User suggestion for mentions
export interface UserSuggestion {
  _id: string;
  name: string;
  username: string;
  image?: string;
}

// Hashtag suggestion
export interface HashtagSuggestion {
  _id: string;
  tag: string;
  usageCount: number;
  lastUsed: number;
  category?: string;
}
