"use client";

import type { GroupWithDetails } from "@convex-config/groups/schema/types";
import type { Data as PuckData } from "@measured/puck";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { api } from "@convex-config/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  Calendar,
  Edit,
  FileText,
  MessageSquare,
  Users,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

// Dynamically import the PuckRenderer to avoid server/client mismatch
const PuckRenderer = dynamic(
  () =>
    import("@/components/ui/group-dashboard/PuckRenderer").then(
      (mod) => mod.PuckRenderer,
    ),
  { ssr: false },
);

interface DashboardContentProps {
  group: GroupWithDetails;
  hasCustomDashboard?: boolean;
  pageIdentifier: string;
}

export function DashboardContent({
  group,
  hasCustomDashboard = false,
  pageIdentifier,
}: DashboardContentProps) {
  const { user } = useUser();
  const router = useRouter();
  const joinGroup = useMutation(api.groups.mutations.joinGroup);

  // Query dashboard data from the puckEditor table with type safety
  const dashboardDataResult = useQuery(api.puckEditor.queries.getData, {
    pageIdentifier,
  });

  // Query additional group data
  const membersData = useQuery(api.groups.queries.getGroupMembers, {
    groupId: group._id,
    paginationOpts: {
      numItems: 5,
      cursor: null,
    },
  });

  const postsData = useQuery(api.groups.queries.getLatestGroupPosts, {
    groupId: group._id,
    paginationOpts: {
      numItems: 5,
      cursor: null,
    },
  });

  const isUserGroupMember = group.userMembership?.status === "active";
  const isUserGroupAdmin = group.userMembership?.role === "admin";

  const handleJoinGroup = async () => {
    if (!user) {
      // Redirect to sign in if not authenticated
      router.push("/sign-in");
      return;
    }

    try {
      await joinGroup({
        groupId: group._id,
      });

      // Refresh the page to show updated membership status
      router.refresh();
    } catch (error) {
      console.error("Failed to join group:", error);
    }
  };

  if (hasCustomDashboard && dashboardDataResult) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <p className="text-muted-foreground">
              Group created {formatDistanceToNow(group._creationTime)} ago
            </p>
          </div>
          <div className="flex gap-2">
            {!isUserGroupMember && (
              <Button onClick={handleJoinGroup}>Join Group</Button>
            )}
            {isUserGroupAdmin && (
              <Link
                href={`/admin/groups/${group._id}?editor=true`}
                className="inline-flex"
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Parse the JSON string from dashboardData safely */}
        {typeof dashboardDataResult === "string" && (
          <PuckRenderer
            data={JSON.parse(dashboardDataResult) as PuckData}
            groupId={group._id}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <p className="text-muted-foreground">
            Group created {formatDistanceToNow(group._creationTime)} ago
          </p>
        </div>
        <div className="flex gap-2">
          {!isUserGroupMember && (
            <Button onClick={handleJoinGroup}>Join Group</Button>
          )}
          {isUserGroupAdmin && (
            <Link href={`/admin/groups/${group._id}?editor=true`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                Create Custom Dashboard
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{group.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {group.categoryTags?.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{group.memberCount || 0}</div>
            <div className="mt-2">
              {membersData?.members && membersData.members.length > 0 ? (
                <div className="flex flex-col space-y-1">
                  {membersData.members.slice(0, 3).map((member) => (
                    <div key={member._id} className="text-sm">
                      {member.user?.name ?? "Anonymous"}
                      {member.role === "admin" && (
                        <Badge className="ml-2" variant="outline">
                          Admin
                        </Badge>
                      )}
                    </div>
                  ))}
                  {group.memberCount > 3 && (
                    <div className="text-xs text-muted-foreground">
                      And {group.memberCount - 3} more members
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No members yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-2xl font-bold">
                  {postsData?.length ?? 0}
                </div>
                <div className="text-xs text-muted-foreground">Posts</div>
              </div>
              <div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground">Events</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="discussions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="discussions">
            <MessageSquare className="mr-2 h-4 w-4" />
            Discussions
          </TabsTrigger>
          <TabsTrigger value="events">
            <Calendar className="mr-2 h-4 w-4" />
            Events
          </TabsTrigger>
        </TabsList>
        <TabsContent value="discussions" className="mt-4 space-y-4">
          {postsData && postsData.length > 0 ? (
            <div className="space-y-4">
              {postsData.map((post) => (
                <Card key={post._id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between">
                      <div className="font-medium">
                        {post.title ?? "Untitled Post"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(post._creationTime)} ago
                      </div>
                    </div>
                    <p className="mt-2 text-sm">{post.content}</p>
                    <div className="mt-4 text-sm text-muted-foreground">
                      Posted by {post.author?.name ?? "Anonymous"}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No discussions yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="events" className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No upcoming events
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
