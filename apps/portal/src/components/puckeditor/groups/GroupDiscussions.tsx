"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React, { useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, MessageSquare, PlusCircle } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

interface GroupDiscussionsProps {
  title?: string;
  groupId?: Id<"groups">;
  maxPosts?: number;
  showAuthors?: boolean;
  showAddButton?: boolean;
}

export function GroupDiscussions({
  title = "Discussions",
  groupId,
  maxPosts = 5,
  showAuthors = true,
  showAddButton = true,
}: GroupDiscussionsProps) {
  // Query latest posts
  const latestPosts = useQuery(
    api.groups.queries.getLatestGroupPosts,
    groupId
      ? {
          groupId,
          paginationOpts: {
            numItems: maxPosts,
            cursor: null,
          },
        }
      : "skip",
  );

  // If no group is selected, show placeholder
  if (!groupId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Please select a group in edit mode.
        </CardContent>
      </Card>
    );
  }

  // If no posts are available yet, show appropriate message
  if (!latestPosts || latestPosts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium">No discussions yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Start a conversation to get things going
          </p>
        </CardContent>
        {showAddButton && (
          <CardFooter>
            <Button className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Discussion
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {latestPosts.map((post) => (
            <div key={post._id} className="border-b pb-4 last:border-0">
              {showAuthors && post.author && (
                <div className="mb-2 flex items-center">
                  <Avatar className="mr-2 h-6 w-6">
                    {post.author.image && (
                      <AvatarImage
                        src={post.author.image}
                        alt={post.author.name || "User"}
                      />
                    )}
                    <AvatarFallback>
                      {post.author.name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {post.author.name}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDistanceToNow(post._creationTime)} ago
                  </span>
                </div>
              )}
              <div className="font-medium">{post.title || "Untitled Post"}</div>
              <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {post.content || "No content"}
              </div>
              <div className="mt-2 flex gap-2">
                {post.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              {!showAuthors && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {formatDistanceToNow(post._creationTime)} ago
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      {showAddButton && (
        <CardFooter>
          <Button className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Discussion
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
