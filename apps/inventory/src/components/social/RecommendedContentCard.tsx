"use client";

import { useAuth } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { Info, ThumbsDown, ThumbsUp, XCircle } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@acme/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@acme/ui/tooltip";

import type { Id } from "../../../convex/_generated/dataModel";
import type { FeedItemWithCounts } from "./FeedList";
import { api } from "../../../convex/_generated/api";
import { useConvexUser } from "../../hooks/useConvexUser";
import { PostCard } from "./PostCard";

interface RecommendedContentCardProps {
  recommendation: FeedItemWithCounts & {
    recommendationReason?: string;
  };
  onRemove?: (contentId: Id<"feedItems">) => void;
}

export function RecommendedContentCard({
  recommendation,
  onRemove,
}: RecommendedContentCardProps) {
  const { userId } = useAuth();
  const { convexId } = useConvexUser();

  // Mark recommendation as interacted with
  const markInteracted = useMutation(
    api.socialfeed.mutations.markRecommendationAsInteracted,
  );

  // Mark as seen when the component mounts
  const markSeen = useMutation(
    api.socialfeed.mutations.markRecommendationAsSeen,
  );

  // Handler for feedback buttons
  const handleFeedback = async (reaction: "like" | "dislike" | "neutral") => {
    if (!convexId) return;

    try {
      await markInteracted({
        userId: convexId,
        contentId: recommendation._id,
        reaction,
      });

      if (reaction !== "like" && onRemove) {
        onRemove(recommendation._id);
      }
    } catch (error) {
      console.error("Error providing recommendation feedback:", error);
    }
  };

  // Mark as seen when rendered
  if (convexId) {
    // We use void to avoid waiting for the promise, since this is just tracking
    void markSeen({
      userId: convexId,
      contentId: recommendation._id,
    });
  }

  return (
    <Card className="mb-4 overflow-hidden">
      {/* Recommendation header */}
      {recommendation.recommendationReason && (
        <CardHeader className="border-b bg-muted/20 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="gap-1 px-2 py-0 text-xs">
                <Info className="h-3 w-3" />
                Recommended
              </Badge>
              <span>{recommendation.recommendationReason}</span>
            </div>

            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleFeedback("like")}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span className="sr-only">Like recommendation</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Show me more like this</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleFeedback("dislike")}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      <span className="sr-only">Dislike recommendation</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Show me less like this</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleFeedback("neutral")}
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="sr-only">Remove recommendation</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Hide this recommendation</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
      )}

      {/* The actual content */}
      <CardContent className="p-0">
        <PostCard
          post={recommendation}
          disableInteractions={false}
          className="rounded-none border-0 shadow-none"
        />
      </CardContent>
    </Card>
  );
}
