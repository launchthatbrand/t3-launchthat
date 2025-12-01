"use client";

import { useState } from "react";
import { HashIcon, SearchIcon, TrendingUp } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Skeleton } from "@acme/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type { Id } from "../lib/types";
import {
  useSocialFeedApi,
  useSocialFeedAuth,
  useSocialFeedQuery,
} from "../context/SocialFeedClientProvider";
import { TopicCard, TopicCardSkeleton } from "./TopicCard";

// Define the pagination response type
interface PaginationResponse<T> {
  page: T[];
  continueCursor?: string;
  isDone?: boolean;
}

interface TopicsBrowserProps {
  initialTab?: "popular" | "suggested" | "following";
  limit?: number;
  showSearch?: boolean;
  showHeader?: boolean;
}

export function TopicsBrowser({
  initialTab = "popular",
  limit = 12,
  showSearch = true,
  showHeader = true,
}: TopicsBrowserProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const { userId } = useSocialFeedAuth();
  const api = useSocialFeedApi<any>();
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [cursor, setCursor] = useState<string | null>(null);

  // Get popular topics
  const popularTopics = useSocialFeedQuery(
    api?.plugins?.socialfeed?.queries?.getTopics,
    {
      paginationOpts: { numItems: limit, cursor: cursor },
      query: searchQuery || undefined,
    },
  );

  // Get topics user is following
  const followedTopics = useSocialFeedQuery(
    api?.plugins?.socialfeed?.queries?.getUserFollowedTopics,
    userId
      ? {
          userId: userId as Id<"users">,
          paginationOpts: { numItems: limit, cursor: cursor },
        }
      : "skip",
  );

  // Get suggested topics for user
  const suggestedTopics = useSocialFeedQuery(
    api?.plugins?.socialfeed?.queries?.getTopicSuggestions,
    userId
      ? {
          userId: userId as Id<"users">,
          limit,
        }
      : "skip",
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCursor(null); // Reset pagination when search changes
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCursor(null); // Reset pagination when tab changes
  };

  // Determine which topics to display based on active tab
  const getTopicsForActiveTab = () => {
    switch (activeTab) {
      case "following":
        return followedTopics ?? [];
      case "suggested":
        return suggestedTopics ?? [];
      case "popular":
      default:
        return popularTopics ?? [];
    }
  };

  // Check if we're in a loading state
  const isLoading =
    (activeTab === "popular" && popularTopics === undefined) ||
    (activeTab === "following" && followedTopics === undefined) ||
    (activeTab === "suggested" && suggestedTopics === undefined);

  // Render loading state
  if (isLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HashIcon className="h-5 w-5" />
              Topics to Follow
            </CardTitle>

            {showSearch && (
              <div className="relative mt-2">
                <SearchIcon className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                <Skeleton className="h-9 w-full" />
              </div>
            )}
          </CardHeader>
        )}

        <CardContent>
          <Tabs defaultValue="popular">
            <TabsList className="mb-4 grid w-full grid-cols-3">
              <Skeleton className="h-9 w-full rounded-l-md" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full rounded-r-md" />
            </TabsList>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <TopicCardSkeleton key={i} />
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  // Get the topics to display
  const topicsToDisplay = getTopicsForActiveTab();

  // Helper to safely check if pagination has more results
  const hasContinueCursor = (tab: string): boolean => {
    if (
      tab === "following" &&
      followedTopics &&
      "continueCursor" in followedTopics
    ) {
      return !!followedTopics.continueCursor;
    }
    if (
      tab === "popular" &&
      popularTopics &&
      "continueCursor" in popularTopics
    ) {
      return !!popularTopics.continueCursor;
    }
    return false;
  };

  // Helper to safely check if pagination is done
  const isPaginationDone = (tab: string): boolean => {
    if (tab === "following" && followedTopics && "isDone" in followedTopics) {
      return !!followedTopics.isDone;
    }
    if (tab === "popular" && popularTopics && "isDone" in popularTopics) {
      return !!popularTopics.isDone;
    }
    return false;
  };

  // Helper to get the continue cursor safely
  const getContinueCursor = (tab: string): string | null => {
    if (
      tab === "following" &&
      followedTopics &&
      "continueCursor" in followedTopics
    ) {
      return typeof followedTopics.continueCursor === "string"
        ? followedTopics.continueCursor
        : null;
    }
    if (
      tab === "popular" &&
      popularTopics &&
      "continueCursor" in popularTopics
    ) {
      return typeof popularTopics.continueCursor === "string"
        ? popularTopics.continueCursor
        : null;
    }
    return null;
  };

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HashIcon className="h-5 w-5" />
            Topics to Follow
          </CardTitle>

          {showSearch && (
            <div className="relative mt-2">
              <SearchIcon className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
              <Input
                placeholder="Search topics..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-8"
              />
            </div>
          )}
        </CardHeader>
      )}

      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4 grid w-full grid-cols-3">
            <TabsTrigger value="popular" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Popular
            </TabsTrigger>
            {userId && (
              <>
                <TabsTrigger value="suggested">For You</TabsTrigger>
                <TabsTrigger value="following">Following</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {topicsToDisplay.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <HashIcon className="text-muted-foreground mb-2 h-10 w-10" />
                <h3 className="font-medium">No topics found</h3>
                <p className="text-muted-foreground text-center text-sm">
                  {activeTab === "following"
                    ? "You aren't following any topics yet."
                    : activeTab === "suggested"
                      ? "We don't have any topic suggestions for you yet."
                      : "No topics match your search criteria."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {topicsToDisplay.map((topic: { _id: Id<"hashtags"> }) => (
                  <TopicCard key={topic._id.toString()} topicId={topic._id} />
                ))}
              </div>
            )}

            {/* Load more button */}
            {topicsToDisplay.length >= limit &&
              activeTab !== "suggested" &&
              hasContinueCursor(activeTab) && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setCursor(getContinueCursor(activeTab))}
                    disabled={isPaginationDone(activeTab)}
                  >
                    Load More
                  </Button>
                </div>
              )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
