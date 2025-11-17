"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React, { useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Activity, Calendar, MessageSquare } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Progress } from "@acme/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

interface GroupActivityProps {
  title?: string;
  groupId?: Id<"groups">;
  showStats?: boolean;
  showTrends?: boolean;
}

export function GroupActivity({
  title = "Group Activity",
  groupId,
  showStats = true,
  showTrends = true,
}: GroupActivityProps) {
  // Query group stats
  const stats = useQuery(
    api.groups.queries.getGroupStats,
    groupId ? { groupId } : "skip",
  ) ?? {
    memberCount: 0,
    postCount: 0,
    eventCount: 0,
    activeMembers: 0,
  };

  // Query latest posts for activity feed
  const latestPosts =
    useQuery(
      api.groups.queries.getLatestGroupPosts,
      groupId
        ? {
            groupId,
            paginationOpts: {
              numItems: 5,
              cursor: null,
            },
          }
        : "skip",
    ) ?? [];

  // If no group is selected, show placeholder
  if (!groupId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Please select a group in edit mode.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showStats && (
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Posts</span>
                <span className="text-xl font-bold">{stats.postCount}</span>
              </div>
              <Progress value={(stats.postCount / 100) * 100} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Events</span>
                <span className="text-xl font-bold">{stats.eventCount}</span>
              </div>
              <Progress value={(stats.eventCount / 20) * 100} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Members</span>
                <span className="text-xl font-bold">{stats.memberCount}</span>
              </div>
              <Progress
                value={(stats.memberCount / 50) * 100}
                className="h-2"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Members</span>
                <span className="text-xl font-bold">{stats.activeMembers}</span>
              </div>
              <Progress
                value={(stats.activeMembers / (stats.memberCount || 1)) * 100}
                className="h-2"
              />
            </div>
          </div>
        )}

        <Tabs defaultValue="posts">
          <TabsList className="w-full">
            <TabsTrigger value="posts" className="flex-1">
              <MessageSquare className="mr-2 h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-1">
              <Calendar className="mr-2 h-4 w-4" />
              Events
            </TabsTrigger>
          </TabsList>
          <TabsContent value="posts" className="mt-4">
            {latestPosts && latestPosts.length > 0 ? (
              <div className="space-y-4">
                {latestPosts.map((post) => (
                  <div key={post._id} className="border-b pb-3">
                    <div className="font-medium">
                      {post.title || "Untitled Post"}
                    </div>
                    <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {post.content || "No content"}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {formatDistanceToNow(post._creationTime)} ago
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                No recent posts
              </div>
            )}
          </TabsContent>
          <TabsContent value="events" className="mt-4">
            <div className="py-4 text-center text-muted-foreground">
              No upcoming events
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
