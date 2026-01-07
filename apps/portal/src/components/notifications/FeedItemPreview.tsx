"use client";

import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Image, Link } from "lucide-react";

import { Skeleton } from "@acme/ui/skeleton";

interface FeedItemPreviewProps {
  feedItemId: string;
  maxLength?: number;
}

export function FeedItemPreview({
  feedItemId,
  maxLength = 100,
}: FeedItemPreviewProps) {
  const [truncatedContent, setTruncatedContent] = useState<string>("");

  // Fetch the feed item
  const feedItem = useQuery(api.plugins.socialfeed.queries.getFeedItem, {
    feedItemId: feedItemId as Id<"feedItems">,
  });

  // Process and truncate the content when it loads
  useEffect(() => {
    if (feedItem?.content) {
      if (feedItem.content.length > maxLength) {
        setTruncatedContent(`${feedItem.content.substring(0, maxLength)}...`);
      } else {
        setTruncatedContent(feedItem.content);
      }
    }
  }, [feedItem, maxLength]);

  // Show loading state
  if (!feedItem) {
    return <PreviewSkeleton />;
  }

  return (
    <div className="mt-2 rounded-md bg-muted/30 p-3 text-sm">
      {/* Content preview */}
      <div className="mb-1 line-clamp-3">{truncatedContent}</div>

      {/* Media indicator */}
      {feedItem.mediaUrls && feedItem.mediaUrls.length > 0 && (
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Image className="h-3 w-3" />
          <span>
            {feedItem.mediaUrls.length}{" "}
            {feedItem.mediaUrls.length === 1 ? "image" : "images"}
          </span>
        </div>
      )}

      {/* Original content indicator (for shares) */}
      {feedItem.contentType === "share" && feedItem.originalContentId && (
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Link className="h-3 w-3" />
          <span>Shared post</span>
        </div>
      )}
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div className="mt-2 rounded-md bg-muted/30 p-3">
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}
