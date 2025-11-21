"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@acme/ui/card";
import { CheckIcon, HashIcon, PlusIcon } from "lucide-react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import type { Id } from "../../../convex/_generated/dataModel";
import { Skeleton } from "@acme/ui/skeleton";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useConvexUser } from "../../hooks/useConvexUser";
import { useState } from "react";

interface TopicCardProps {
  topicId: Id<"hashtags">;
  onToggleFollow?: (following: boolean) => void;
}

export function TopicCard({ topicId, onToggleFollow }: TopicCardProps) {
  const { userId } = useAuth();
  const { convexId } = useConvexUser();
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get topic details
  const topic = useQuery(api.socialfeed.queries.getTopic, {
    topicId,
  });

  // Check if user is following this topic
  const followStatus = useQuery(
    api.socialfeed.queries.checkTopicFollow,
    convexId
      ? {
          userId: convexId,
          topicId,
        }
      : "skip",
  );

  // Follow/unfollow mutations
  const follow = useMutation(api.socialfeed.mutations.followTopic);
  const unfollow = useMutation(api.socialfeed.mutations.unfollowTopic);

  // Update local state when query resolves
  if (followStatus !== undefined && isFollowing === null) {
    setIsFollowing(followStatus);
  }

  // Handle follow/unfollow
  const handleToggleFollow = async () => {
    if (!convexId) return;

    setIsUpdating(true);
    try {
      const newState = !isFollowing;
      if (newState) {
        await follow({
          userId: convexId,
          topicId,
        });
      } else {
        await unfollow({
          userId: convexId,
          topicId,
        });
      }
      setIsFollowing(newState);
      if (onToggleFollow) onToggleFollow(newState);
    } catch (error) {
      console.error("Error toggling topic follow:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Loading state
  if (topic === undefined) {
    return <TopicCardSkeleton />;
  }

  // Topic not found
  if (topic === null) {
    return null;
  }

  return (
    <Card className="h-full overflow-hidden">
      {/* Topic cover image if available */}
      {topic.coverImage ? (
        <div className="relative h-24 w-full overflow-hidden">
          <img
            src={topic.coverImage}
            alt={`#${topic.tag}`}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-24 w-full items-center justify-center bg-muted">
          <HashIcon className="h-10 w-10 text-muted-foreground" />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HashIcon className="h-4 w-4" />
            <h3 className="text-lg font-semibold">{topic.tag}</h3>
          </div>
          {topic.category && (
            <span className="text-xs text-muted-foreground">
              {topic.category}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        {topic.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {topic.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Trending topic with {topic.usageCount.toLocaleString()} posts
          </p>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">
            {(topic.followerCount ?? 0).toLocaleString()}
          </span>{" "}
          followers
        </div>

        {convexId && (
          <Button
            variant={isFollowing ? "outline" : "primary"}
            size="sm"
            onClick={handleToggleFollow}
            disabled={isUpdating}
          >
            {isFollowing ? (
              <>
                <CheckIcon className="mr-1 h-3 w-3" />
                Following
              </>
            ) : (
              <>
                <PlusIcon className="mr-1 h-3 w-3" />
                Follow
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export function TopicCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <Skeleton className="h-24 w-full" />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <Skeleton className="mb-1 h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-20" />
      </CardFooter>
    </Card>
  );
}
