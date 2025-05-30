"use client";

import type { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertCircle,
  Bell,
  Calendar,
  FileText,
  MessageSquare,
  Users as UsersIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { TabsContent } from "@acme/ui/tabs";

interface GroupPost {
  _id: Id<"groupPosts">;
  _creationTime: number;
  title?: string;
  content: string;
  author?: {
    name?: string;
    profileImageUrl: string | null;
  } | null;
}

interface GroupEvent {
  _id: Id<"groupEvents">;
  title: string;
  startTime: number;
}

interface GroupMember {
  _id: Id<"users">;
  name?: string;
  profileImageUrl: string | null;
  role: "admin" | "moderator" | "member";
}

interface GroupStats {
  memberCount: number;
  postCount: number;
  eventCount: number;
  activeMembers: number;
}

interface DashboardContentProps {
  description: string;
  categoryTags?: string[];
  creationTime: number;
  groupId: Id<"groups">;
}

export function DashboardContent({
  description,
  categoryTags = [],
  creationTime,
  groupId,
}: DashboardContentProps) {
  // Fetch latest posts - handle errors gracefully
  const latestPostsResult = useQuery(api.groups.queries.getLatestPosts, {
    groupId,
    limit: 3,
  });
  const latestPosts = (
    Array.isArray(latestPostsResult) ? latestPostsResult : []
  ) as GroupPost[];

  // Fetch upcoming events - handle errors gracefully
  const upcomingEventsResult = useQuery(api.groups.queries.getUpcomingEvents, {
    groupId,
    limit: 3,
  });
  const upcomingEvents = (
    Array.isArray(upcomingEventsResult) ? upcomingEventsResult : []
  ) as GroupEvent[];

  // Fetch active members - handle errors gracefully
  const activeMembersResult = useQuery(api.groups.queries.getActiveMembers, {
    groupId,
    limit: 5,
  });
  const activeMembers = (
    Array.isArray(activeMembersResult) ? activeMembersResult : []
  ) as GroupMember[];

  // Fetch group stats - handle errors gracefully
  const stats = useQuery(api.groups.queries.getGroupStats, {
    groupId,
  }) as GroupStats | undefined;

  // Whether data is still loading or there was an error
  const isLoading =
    latestPostsResult === undefined ||
    upcomingEventsResult === undefined ||
    activeMembersResult === undefined ||
    stats === undefined;

  return (
    <TabsContent value="" className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Group Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Group Overview</CardTitle>
            <CardDescription>
              Group created {formatDistanceToNow(creationTime)} ago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm">{description}</div>
              {categoryTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {categoryTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block rounded-full bg-muted px-3 py-1 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              View Complete About
            </Button>
          </CardFooter>
        </Card>

        {/* Activity Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
            <CardDescription>Group engagement metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center rounded-lg border p-3">
                <UsersIcon className="mb-2 h-5 w-5 text-muted-foreground" />
                <div className="text-2xl font-bold">
                  {isLoading ? "-" : stats.memberCount}
                </div>
                <div className="text-xs text-muted-foreground">Members</div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border p-3">
                <MessageSquare className="mb-2 h-5 w-5 text-muted-foreground" />
                <div className="text-2xl font-bold">
                  {isLoading ? "-" : stats.postCount}
                </div>
                <div className="text-xs text-muted-foreground">Posts</div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border p-3">
                <Calendar className="mb-2 h-5 w-5 text-muted-foreground" />
                <div className="text-2xl font-bold">
                  {isLoading ? "-" : stats.eventCount}
                </div>
                <div className="text-xs text-muted-foreground">Events</div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border p-3">
                <Activity className="mb-2 h-5 w-5 text-muted-foreground" />
                <div className="text-2xl font-bold">
                  {isLoading ? "-" : stats.activeMembers}
                </div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Announcements Card */}
        <Card>
          <CardHeader className="bg-primary/5">
            <AlertCircle className="h-5 w-5 text-primary" />
            <CardTitle className="mt-2">Announcements</CardTitle>
            <CardDescription>Important group updates</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Loading announcements...
                </p>
              </div>
            ) : latestPosts.length > 0 ? (
              <div className="space-y-4">
                {latestPosts.slice(0, 1).map((post) => (
                  <div key={post._id} className="space-y-2">
                    <div className="font-medium">
                      {post.title ?? "Announcement"}
                    </div>
                    <div className="line-clamp-2 text-sm text-muted-foreground">
                      {post.content}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(post._creationTime)} ago
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground opacity-50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No announcements yet
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild className="w-full">
              <Link href={`/groups/${groupId}/discussion`}>
                View All Announcements
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Recent Discussions */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Discussions</CardTitle>
            <CardDescription>Latest conversations in the group</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Loading discussions...
                </p>
              </div>
            ) : latestPosts.length > 0 ? (
              <div className="space-y-4">
                {latestPosts.map((post) => (
                  <div
                    key={post._id}
                    className="flex items-start space-x-4 rounded-lg border p-3"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={post.author?.profileImageUrl ?? undefined}
                        alt={post.author?.name ?? "Member"}
                      />
                      <AvatarFallback>
                        {post.author?.name?.charAt(0) ?? "M"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {post.title ?? "Discussion post"}
                      </div>
                      <div className="line-clamp-2 text-sm text-muted-foreground">
                        {post.content}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{post.author?.name ?? "Group member"}</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(post._creationTime)} ago
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground opacity-30" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No discussions have been started yet
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href={`/groups/${groupId}/discussion`}>
                    Start a Conversation
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" asChild className="w-full">
              <Link href={`/groups/${groupId}/discussion`}>
                View All Discussions
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Upcoming Events + Active Members Combined */}
        <Card>
          <CardHeader>
            <CardTitle>Coming Up</CardTitle>
            <CardDescription>Events and active members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upcoming Events */}
            <div>
              <h4 className="mb-3 text-sm font-medium">Upcoming Events</h4>
              {isLoading ? (
                <div className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
                  Loading events...
                </div>
              ) : upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event._id}
                      className="flex items-center space-x-3 rounded-md border p-2"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10 text-primary">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.startTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
                  No upcoming events scheduled
                </div>
              )}
            </div>

            {/* Active Members */}
            <div>
              <h4 className="mb-3 text-sm font-medium">Active Members</h4>
              {isLoading ? (
                <div className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
                  Loading members...
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeMembers.map((member) => (
                    <Avatar
                      key={member._id}
                      className="h-8 w-8 border-2 border-background"
                    >
                      <AvatarImage
                        src={member.profileImageUrl ?? undefined}
                        alt={member.name ?? "Member"}
                      />
                      <AvatarFallback>
                        {member.name?.charAt(0) ?? "M"}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {activeMembers.length === 0 && (
                    <div className="w-full rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
                      No active members yet
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button variant="ghost" size="sm" asChild className="w-full">
              <Link href={`/groups/${groupId}/events`}>View All Events</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="w-full">
              <Link href={`/groups/${groupId}/members`}>View All Members</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </TabsContent>
  );
}
