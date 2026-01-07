"use client";

import { useState } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { CheckIcon, HashIcon, PlusIcon } from "lucide-react";
import { useConvexUser } from "src/hooks/useConvexUser";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

import type { Id } from "../lib/types";

interface TopicCardProps {
  topicId: Id<"hashtags">;
  onToggleFollow?: (following: boolean) => void;
}

export function TopicCard({ topicId, onToggleFollow }: TopicCardProps) {
  const { convexId } = useConvexUser();
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get topic details
  const topic = useQuery(api.plugins.socialfeed.queries.getTopic, {
    topicId,
  });

  // Check if user is following this topic
  const followStatus = useQuery(
    api.plugins.socialfeed.queries.checkTopicFollow,
    convexId
      ? {
          userId: convexId as Id<"users">,
          topicId,
        }
      : "skip",
  );

  // Follow/unfollow mutations
  const follow = useMutation(api.plugins.socialfeed.mutations.followTopic);
  const unfollow = useMutation(api.plugins.socialfeed.mutations.unfollowTopic);

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
          userId: convexId as Id<"users">,
          topicId,
        });
      } else {
        await unfollow({
          userId: convexId as Id<"users">,
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
        <div className="bg-muted flex h-24 w-full items-center justify-center">
          <HashIcon className="text-muted-foreground h-10 w-10" />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HashIcon className="h-4 w-4" />
            <h3 className="text-lg font-semibold">{topic.tag}</h3>
          </div>
          {topic.category && (
            <span className="text-muted-foreground text-xs">
              {topic.category}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        {topic.description ? (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {topic.description}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Trending topic with {topic.usageCount.toLocaleString()} posts
          </p>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <div className="text-muted-foreground text-xs">
          <span className="font-medium">
            {(topic.followerCount ?? 0).toLocaleString()}
          </span>{" "}
          followers
        </div>

        {convexId && (
          <Button
            variant={isFollowing ? "outline" : "default"}
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
