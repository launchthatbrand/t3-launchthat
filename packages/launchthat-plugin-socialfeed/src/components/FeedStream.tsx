"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Flag, Heart, MessageCircle, Share } from "lucide-react";
import { useInView } from "react-intersection-observer";

import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "@acme/ui/entity-list/types";
import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Button } from "@acme/ui/button";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Spinner } from "@acme/ui/spinner";

import type { Id } from "../lib/types";
import {
  useSocialFeedApi,
  useSocialFeedClient,
  useSocialFeedQuery,
} from "../context/SocialFeedClientProvider";
import { EmptyFeedState } from "./EmptyFeedState";
import { FeedItem } from "./FeedItem";
import { PostCardSkeleton } from "./PostCardSkeleton";

export type FeedType = "universal" | "personalized" | "group" | "profile";

export interface FeedStreamProps {
  feedType: FeedType;
  targetId?: Id<"groups"> | Id<"users"> | Id<"posts">;
  limit?: number;
  filters?: Record<string, unknown>;
  className?: string;
}

// Define the feed item interface based on the expected return type
interface FeedItemType extends Record<string, unknown> {
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
}

/**
 * FeedStream - A reusable component for displaying social feed content with EntityList
 */
export function FeedStream({
  feedType,
  targetId,
  limit = 10,
  filters = {},
  className = "",
}: FeedStreamProps) {
  const { api } = useSocialFeedClient();
  const socialfeedApi = useSocialFeedApi();
  // Track loaded feed items
  const [feedItems, setFeedItems] = useState<FeedItemType[]>([]);

  // Track pagination cursor
  const [cursor, setCursor] = useState<string | null>(null);

  // Track error state
  const [error, setError] = useState<string | null>(null);

  // Track if we've reached the end of the feed
  const [hasMore, setHasMore] = useState(true);

  // Track if we're doing an initial load or a pagination load
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Pagination state for EntityList
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: limit,
    pageCount: 1,
  });

  // Active filters
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // Use intersection observer for infinite scrolling for legacy support
  const { ref: bottomRef, inView } = useInView({
    threshold: 0.1, // Trigger when 10% of the element is visible
    delay: 100, // Small delay to avoid rapid triggers
  });

  // Prepare pagination options
  const paginationOpts = cursor
    ? { cursor, numItems: limit }
    : { numItems: limit, cursor: null as string | null };

  // Determine which query to use based on feedType
  let queryArgs: any = { paginationOpts };
  let queryFn: any;

  switch (feedType) {
    case "universal":
      queryFn = socialfeedApi.queries?.getUniversalFeed;
      break;
    case "personalized":
      queryFn = socialfeedApi.queries?.getPersonalizedFeed;
      queryArgs.userId = filters.userId as Id<"users">;
      break;
    case "group":
      queryFn = socialfeedApi.queries?.getGroupFeed;
      if (targetId) {
        queryArgs.groupId = targetId as Id<"posts">;
      }
      break;
    case "profile":
      queryFn = socialfeedApi.queries?.getUserProfileFeed;
      queryArgs.profileId = targetId as Id<"users">;
      queryArgs.viewerId = filters.userId as Id<"users">;
      break;
    default:
      queryFn = socialfeedApi.queries?.getUniversalFeed;
  }

  // Execute the query with the appropriate arguments
  const queryResult = useSocialFeedQuery(queryFn, queryArgs);

  // Process query results when they arrive
  useEffect(() => {
    if (queryResult === undefined) {
      // Query is still loading, do nothing
      return;
    }

    try {
      // Handle different types of responses based on feed type
      const newItems = Array.isArray(queryResult)
        ? (queryResult as FeedItemType[])
        : [];

      // For EntityList, we replace the entire dataset
      setFeedItems(newItems);

      // Check if we have more items to fetch
      setHasMore(newItems.length >= limit);

      // Update cursor for next page
      if (newItems.length > 0 && newItems.length >= limit) {
        const lastItem = newItems[newItems.length - 1];
        if (lastItem) {
          setCursor(lastItem._id);
        }
      } else {
        setHasMore(false);
      }

      // Clear initial loading state
      setIsInitialLoad(false);

      // Update pagination state
      setPagination((prev) => ({
        ...prev,
        pageCount: Math.ceil(newItems.length / limit) + (hasMore ? 1 : 0),
      }));
    } catch (err) {
      console.error("Error processing feed data:", err);
      setError("Failed to process feed data");
      setIsInitialLoad(false);
    }
  }, [queryResult, limit, hasMore]);

  // Define column configurations for EntityList
  const columns: ColumnDefinition<FeedItemType>[] = useMemo(
    () => [
      {
        id: "post",
        header: "Post",
        cell: (item: FeedItemType) => (
          <FeedItem item={item} onDelete={() => handleItemDelete(item._id)} />
        ),
      },
    ],
    [],
  );

  // Define filter configurations for EntityList
  const filterConfigs: FilterConfig<FeedItemType>[] = useMemo(
    () => [
      {
        id: "visibility",
        label: "Visibility",
        type: "select",
        options: [
          { label: "Public", value: "public" },
          { label: "Private", value: "private" },
          { label: "Group", value: "group" },
        ],
        field: "visibility",
      },
      {
        id: "contentType",
        label: "Content Type",
        type: "select",
        options: [
          { label: "Post", value: "post" },
          { label: "Share", value: "share" },
          { label: "Comment", value: "comment" },
        ],
        field: "contentType",
      },
    ],
    [],
  );

  // Define entity actions for the feed items
  const entityActions: EntityAction<FeedItemType>[] = useMemo(
    () => [
      {
        id: "like",
        label: "Like",
        icon: <Heart className="h-4 w-4" />,
        onClick: (item) => {
          console.log("Like post:", item);
        },
      },
      {
        id: "comment",
        label: "Comment",
        icon: <MessageCircle className="h-4 w-4" />,
        onClick: (item) => {
          console.log("Comment on post:", item);
        },
      },
      {
        id: "share",
        label: "Share",
        icon: <Share className="h-4 w-4" />,
        onClick: (item) => {
          console.log("Share post:", item);
        },
      },
      {
        id: "report",
        label: "Report",
        icon: <Flag className="h-4 w-4" />,
        variant: "destructive",
        onClick: (item) => {
          console.log("Report post:", item);
        },
      },
    ],
    [],
  );

  // Handle errors
  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Handle initial loading state
  if (isInitialLoad && !feedItems.length) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: 3 }).map((_, index) => (
          <PostCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Handle item deletion
  const handleItemDelete = (itemId: Id<"feedItems">) => {
    setFeedItems((prev) => prev.filter((item) => item._id !== itemId));
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: newPage,
    }));

    // Load next page of data
    // Note: This would normally trigger a new query, but we're keeping the current cursor-based
    // approach for compatibility
  };

  // Handle filter change
  const handleFilterChange = (newFilters: Record<string, any>) => {
    setActiveFilters(newFilters);
    // In a real implementation, these filters would be passed to the backend
    // For now, we'll just update the UI state
  };

  return (
    <div className={className}>
      <EntityList
        data={feedItems}
        columns={columns}
        filters={filterConfigs}
        isLoading={isInitialLoad || queryResult === undefined}
        error={error}
        title={
          feedType === "universal"
            ? "Universal Feed"
            : feedType === "personalized"
              ? "Your Feed"
              : feedType === "group"
                ? "Group Feed"
                : "Profile Feed"
        }
        viewModes={["list"]} // Social feeds typically only use list view
        defaultViewMode="list"
        pagination={{
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          pageCount: pagination.pageCount,
          onPageChange: handlePageChange,
        }}
        entityActions={entityActions}
        initialFilters={activeFilters}
        onFiltersChange={handleFilterChange}
        emptyState={<EmptyFeedState feedType={feedType} />}
        // Customize the empty state display
      />

      {/* Loading indicator for infinite scroll (legacy support) */}
      <div ref={bottomRef} className="py-4 text-center">
        {hasMore ? (
          <Spinner className="mx-auto" />
        ) : (
          <p className="text-muted-foreground text-sm">End of feed</p>
        )}
      </div>
    </div>
  );
}
