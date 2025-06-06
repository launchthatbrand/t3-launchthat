"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { ChevronLeft } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";
import { Skeleton } from "@acme/ui/skeleton";

import type { Id } from "../../../../../../../convex/_generated/dataModel";
import { CommentThread } from "~/components/social/CommentThread";
import { CommentThreadSkeleton } from "~/components/social/CommentThreadSkeleton";
import { PostCard } from "~/components/social/PostCard";
import { api } from "../../../../../../../convex/_generated/api";

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  // Fetch the post details
  const post = useQuery(api.socialfeed.queries.getFeedItem, {
    feedItemId: postId as unknown as Id<"feedItems">,
  });

  // Handle navigation back
  const handleBack = () => {
    router.back();
  };

  // Handle post deletion
  const handlePostDelete = () => {
    // After deletion, go back to feed
    router.push("/social/feed");
  };

  return (
    <div className="container mx-auto px-4 py-6 md:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Feed
          </Button>
        </div>

        {post ? (
          <>
            <PostCard post={post} onDelete={handlePostDelete} isDetailView />

            <div className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <CommentThread postId={post._id} initialExpanded={true} />
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="mt-1 h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-64 w-full rounded-md" />
                </div>
              </CardContent>
            </Card>

            <div className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <CommentThreadSkeleton />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
