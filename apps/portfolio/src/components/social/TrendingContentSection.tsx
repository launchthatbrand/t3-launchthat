"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { TrendingUp } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { PostCard } from "./PostCard";

// Define a pagination response type
interface PaginationResponse<T> {
  page: T[];
  continueCursor?: string;
  isDone?: boolean;
}

interface TrendingContentSectionProps {
  showHeader?: boolean;
  limit?: number;
  className?: string;
}

export function TrendingContentSection({
  showHeader = true,
  limit = 5,
  className = "",
}: TrendingContentSectionProps) {
  const [selectedTopic, setSelectedTopic] = useState<Id<"hashtags"> | null>(
    null,
  );
  const [cursor, setCursor] = useState<string | null>(null);

  // Get popular topics for tabs
  const popularTopics = useQuery(api.socialfeed.queries.getTopics, {
    paginationOpts: { numItems: 5, cursor: null },
  });

  // Get trending content
  const trendingContent = useQuery(api.socialfeed.queries.getTrendingContent, {
    paginationOpts: { numItems: limit, cursor },
    topicId: selectedTopic ?? undefined,
  });

  // Handle tab change
  const handleTabChange = (value: string) => {
    setCursor(null);
    if (value === "all") {
      setSelectedTopic(null);
    } else {
      setSelectedTopic(value as Id<"hashtags">);
    }
  };

  // Load more content
  const handleLoadMore = () => {
    if (
      trendingContent &&
      typeof trendingContent === "object" &&
      "continueCursor" in trendingContent &&
      typeof trendingContent.continueCursor === "string"
    ) {
      setCursor(trendingContent.continueCursor);
    }
  };

  // Check if loading
  const isLoading =
    trendingContent === undefined || popularTopics === undefined;

  // Get the content to display
  const contentToDisplay =
    trendingContent && Array.isArray(trendingContent) ? trendingContent : [];

  // Helper to check if pagination has more results
  const hasContinueCursor = (): boolean => {
    return !!(
      trendingContent &&
      typeof trendingContent === "object" &&
      "continueCursor" in trendingContent &&
      trendingContent.continueCursor
    );
  };

  // Helper to check if pagination is done
  const isPaginationDone = (): boolean => {
    return !!(
      trendingContent &&
      typeof trendingContent === "object" &&
      "isDone" in trendingContent &&
      trendingContent.isDone
    );
  };

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Content
          </CardTitle>
        </CardHeader>
      )}

      <CardContent>
        {/* Topic tabs */}
        <Tabs
          defaultValue="all"
          value={selectedTopic ? selectedTopic.toString() : "all"}
          onValueChange={handleTabChange}
          className="mb-4"
        >
          <TabsList className="mb-4 w-full max-w-full overflow-x-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            {!isLoading &&
              popularTopics?.map((topic) => (
                <TabsTrigger
                  key={topic._id.toString()}
                  value={topic._id.toString()}
                >
                  #{topic.tag}
                </TabsTrigger>
              ))}
          </TabsList>

          <TabsContent
            value={selectedTopic?.toString() ?? "all"}
            className="mt-0"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <TrendingUp className="mx-auto h-10 w-10 animate-pulse text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading trending content...
                  </p>
                </div>
              </div>
            ) : contentToDisplay.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No trending content found
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {contentToDisplay.map((post) => (
                  <PostCard key={post._id.toString()} post={post} />
                ))}

                {/* Load more button */}
                {hasContinueCursor() && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={isPaginationDone()}
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
