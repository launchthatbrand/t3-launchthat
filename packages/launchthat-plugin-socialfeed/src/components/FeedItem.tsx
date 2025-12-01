"use client";

import type { Id } from "../lib/types";
import { PostCard } from "./PostCard";

export interface FeedItemProps {
  item: {
    _id: Id<"feedItems">;
    _creationTime: number;
    contentType: "post" | "share" | "comment";
    content: string;
    creatorId: Id<"users">;
    visibility: "public" | "private" | "group";
    mediaUrls?: string[];
    originalContentId?: Id<"feedItems">;
    moduleType?: "blog" | "course" | "group" | "event";
    moduleId?: string;
    reactionsCount: number;
    commentsCount: number;
    isPinned?: boolean;
    creator: {
      _id: Id<"users">;
      name: string;
      image?: string;
    };
  };
  onDelete?: () => void;
  className?: string;
}

export function FeedItem({ item, onDelete, className }: FeedItemProps) {
  return <PostCard post={item} onDelete={onDelete} className={className} />;
}
