"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { RefreshCw, Sparkles } from "lucide-react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import type { Id } from "../../../convex/_generated/dataModel";
import { RecommendedContentCard } from "./RecommendedContentCard";
import { Skeleton } from "@acme/ui/skeleton";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useConvexUser } from "../../hooks/useConvexUser";
import { useState } from "react";

// Define pagination response type
interface PaginationResponse<T> {
  page: T[];
  continueCursor?: string;
  isDone?: boolean;
}

interface RecommendedContentSectionProps {
  showHeader?: boolean;
  limit?: number;
  className?: string;
}

export function RecommendedContentSection({
  showHeader = true,
  limit = 8,
  className = "",
}: RecommendedContentSectionProps) {
  const { userId } = useAuth();
  const { convexId } = useConvexUser();
  const [cursor, setCursor] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [removedContentIds, setRemovedContentIds] = useState<Set<string>>(
    new Set(),
  );

  // Get recommended content
  const recommendedContent = useQuery(
    api.socialfeed.queries.getRecommendedContent,
    convexId
      ? {
          userId: convexId,
          paginationOpts: { numItems: limit, cursor },
        }
      : "skip",
  );

  // Mutation to generate recommendations
  const generateRecommendations = useMutation(
    api.socialfeed.mutations.generateUserRecommendations,
  );

  // Handle generating recommendations
  const handleGenerateRecommendations = async () => {
    if (!convexId) return;

    setIsGenerating(true);
    try {
      await generateRecommendations({
        userId: convexId,
        limit,
      });
    } catch (error) {
      console.error("Failed to generate recommendations:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle removal of recommendation
  const handleRemoveRecommendation = (contentId: Id<"feedItems">) => {
    setRemovedContentIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(contentId.toString());
      return newSet;
    });
  };

  // Helper function to get continue cursor safely
  const getContinueCursor = (): string | null => {
    if (
      recommendedContent &&
      "continueCursor" in recommendedContent &&
      typeof recommendedContent.continueCursor === "string"
    ) {
      return recommendedContent.continueCursor;
    }
    return null;
  };

  // Helper function to check if pagination is done
  const isPaginationDone = (): boolean => {
    if (recommendedContent && "isDone" in recommendedContent) {
      return Boolean(recommendedContent.isDone);
    }
    return false;
  };

  // Render loading state
  if (recommendedContent === undefined) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Recommended For You
            </CardTitle>
          </CardHeader>
        )}

        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Recommended For You
          </CardTitle>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1"
            onClick={handleGenerateRecommendations}
            disabled={!convexId || isGenerating}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardHeader>
      )}

      <CardContent>
        {Array.isArray(recommendedContent) &&
        recommendedContent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-center text-muted-foreground">
              No recommendations found. Try refreshing or engaging with more
              content.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleGenerateRecommendations}
              disabled={isGenerating}
            >
              Generate Recommendations
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.isArray(recommendedContent) &&
                recommendedContent.map((recommendation) => (
                  <RecommendedContentCard
                    key={recommendation._id.toString()}
                    recommendation={recommendation}
                    onRemove={handleRemoveRecommendation}
                  />
                ))}
            </div>

            {!isPaginationDone() && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCursor(getContinueCursor())}
                  disabled={!getContinueCursor()}
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
