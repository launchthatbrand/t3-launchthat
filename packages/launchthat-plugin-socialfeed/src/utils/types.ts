"use client";

export type TextPartType = "text" | "mention" | "hashtag" | "link";

export interface TextPart {
  type: TextPartType;
  content: string;
  value?: string;
  href?: string;
}

export interface HashtagSuggestion {
  _id: string;
  tag: string;
  usageCount: number;
}

// User suggestion for mentions
export interface UserSuggestion {
  _id: string;
  name: string;
  username: string;
  image?: string;
}
