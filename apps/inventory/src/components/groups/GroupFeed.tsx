"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@acme/ui/alert";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Spinner } from "@acme/ui/spinner";

import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { FeedStream } from "../social/FeedStream";
import { PostCreator } from "../social/PostCreator";

interface GroupFeedProps {
  groupId: Id<"groups">;
}

export function GroupFeed({ groupId }: GroupFeedProps) {
  const [showPostForm, setShowPostForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get group details
  const group = useQuery(api.groups.queries.getGroupById, {
    groupId,
  });

  if (group === undefined) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6 text-center">
          <Spinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  const userMembership = group.userMembership;
  const canPost =
    userMembership?.status === "active" &&
    (userMembership.role !== "member" ||
      (group.settings && group.settings.allowMemberPosts !== false));

  // Show error if there was a problem loading posts
  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Handle successful post creation
  const handlePostSuccess = () => {
    setShowPostForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Post creation section - only for members */}
      {canPost && (
        <Card>
          <CardHeader>
            <CardTitle>Group Discussion</CardTitle>
            <CardDescription>
              Share updates, questions, and content with other group members
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showPostForm ? (
              <PostCreator
                groupId={groupId}
                onSuccess={handlePostSuccess}
                onCancel={() => setShowPostForm(false)}
              />
            ) : (
              <Button onClick={() => setShowPostForm(true)}>
                Create New Post
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info for non-members */}
      {!canPost && group.privacy !== "public" && (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground">
              Join this group to participate in discussions
            </p>
          </CardContent>
        </Card>
      )}

      {/* Social Feed Stream */}
      <FeedStream
        feedType="group"
        targetId={groupId}
        limit={10}
        className="mt-4"
      />
    </div>
  );
}
