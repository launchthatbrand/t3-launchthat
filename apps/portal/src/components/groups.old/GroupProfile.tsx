"use client";

import type { GroupWithDetails } from "@/types/groups";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import {
  Calendar,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";

import {
  AdminOnly,
  ModeratorOnly,
  PermissionGuard,
} from "@acme/ui/advanced/permission-guard";
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type { Id } from "../../../convex/_generated/dataModel";
import type {
  CarouselItemTemplate,
  TextAlignmentOption,
} from "./GroupHeaderCarousel";
import { api } from "../../../convex/_generated/api";
import useCarouselStore from "../../store/useCarouselStore";
import { GroupFeed } from "./GroupFeed";
import { GroupHeaderCarousel } from "./GroupHeaderCarousel";
import { GroupHeaderEditor } from "./GroupHeaderEditor";
import { GroupInvitations } from "./GroupInvitations";
import { GroupJoinRequests } from "./GroupJoinRequests";
import { GroupMembersDisplay } from "./GroupMembersDisplay";
import { InviteGroupMembers } from "./InviteGroupMembers";
import { JoinGroupButton } from "./JoinGroupButton";

interface GroupProfileProps {
  groupId: string;
}

export function GroupProfile({ groupId }: GroupProfileProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("about");
  const { setItems } = useCarouselStore();

  // Use a ref to track if items have been initialized
  const itemsInitialized = useRef(false);

  // Use the imported API reference with proper typing
  const groupQuery = useQuery(api.groups.queries.getGroupById, {
    groupId: groupId as Id<"groups">,
  });

  const isLoading = groupQuery === undefined;

  // More detailed debugging information
  console.log("Raw group data:", groupQuery);

  // Updated initialization with better variable naming and avoiding optional chaining
  // Initialize carousel items in store when group data changes
  useEffect(() => {
    // Skip if already initialized or we don't have the data
    if (itemsInitialized.current || !groupQuery) return;

    // Safely access properties
    const headerItems = groupQuery.headerItems ?? [
      // Default item if no headerItems
      groupQuery.coverImage
        ? {
            id: "default",
            imageUrl: groupQuery.coverImage,
            template: "overlay" as const,
            textAlign: "left" as const,
          }
        : {
            id: "default",
            imageUrl: "https://placehold.co/1200x400/png",
            template: "overlay" as const,
            textAlign: "left" as const,
          },
    ];

    setItems(headerItems);
    itemsInitialized.current = true;
  }, [groupQuery, setItems]);

  // Update to access userMembership with proper typing
  const userMembership = !groupQuery ? null : groupQuery.userMembership;
  console.log("userMembership:", userMembership);
  console.log("user role:", userMembership?.role);

  const currentUserRole = useMemo(
    () => userMembership?.role,
    [userMembership?.role],
  );
  console.log("currentUserRole", currentUserRole);

  const isMember = useMemo(() => !!userMembership, [userMembership]);

  // Mutations for joining and leaving the group
  const leaveGroup = useMutation(api.groups.mutations.leaveGroup);
  const updateGroup = useMutation(api.groups.mutations.updateGroup);

  const handleLeaveGroup = async () => {
    if (!groupQuery) return;

    try {
      await leaveGroup({
        groupId: groupQuery._id,
      });
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

  // Determine the join button based on group privacy and user membership
  const renderJoinButton = () => {
    if (!groupQuery) return null;

    if (isMember) {
      return (
        <Button variant="outline" onClick={handleLeaveGroup}>
          Leave Group
        </Button>
      );
    }

    // Use the JoinGroupButton component that handles different privacy types
    return (
      <JoinGroupButton
        groupId={groupQuery._id}
        privacyType={groupQuery.privacy}
        onJoined={() => {
          // Refresh the group data after joining
          router.refresh();
        }}
      />
    );
  };

  // Change how we render content based on loading state
  const renderContent = () => {
    if (isLoading) {
      return <div className="p-8 text-center">Loading group...</div>;
    }

    return (
      <div className="space-y-6">
        {/* Group Header with Carousel */}
        <div className="relative">
          <GroupHeaderCarousel
            items={
              groupQuery.headerItems ?? [
                // Default item if no headerItems
                groupQuery.coverImage
                  ? {
                      id: "default",
                      imageUrl: groupQuery.coverImage,
                      template: "overlay",
                      textAlign: "left",
                    }
                  : {
                      id: "default",
                      imageUrl: "https://placehold.co/1200x400/png",
                      template: "overlay",
                      textAlign: "left",
                    },
              ]
            }
          />

          {/* Editor button for admins and moderators */}
          {(currentUserRole === "admin" || currentUserRole === "moderator") && (
            <GroupHeaderEditor
              groupId={groupQuery._id}
              onSave={async (items) => {
                try {
                  await updateGroup({
                    groupId: groupQuery._id,
                    headerItems: items,
                  });
                  // Could add a toast notification here
                } catch (error) {
                  console.error("Failed to update header:", error);
                }
              }}
            />
          )}
        </div>

        {/* Group Header */}
        <div className="flex flex-col items-start justify-between gap-4 px-4 md:flex-row md:items-center md:px-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-background">
              <AvatarImage src={groupQuery.avatar} alt={groupQuery.name} />
              <AvatarFallback>{groupQuery.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{groupQuery.name}</h1>
                <Badge
                  variant={
                    groupQuery.privacy === "public"
                      ? "default"
                      : groupQuery.privacy === "restricted"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {groupQuery.privacy.charAt(0).toUpperCase() +
                    groupQuery.privacy.slice(1)}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {groupQuery.memberCount}{" "}
                {groupQuery.memberCount === 1 ? "member" : "members"}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {renderJoinButton()}

            <PermissionGuard
              userRole={currentUserRole}
              requiredRole="moderator"
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <AdminOnly userRole={currentUserRole}>
                    <DropdownMenuItem
                      onClick={() => router.push(`/groups/${groupId}/settings`)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Group Settings
                    </DropdownMenuItem>
                  </AdminOnly>
                  <ModeratorOnly userRole={currentUserRole}>
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/groups/${groupId}/members/manage`)
                      }
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Manage Members
                    </DropdownMenuItem>
                  </ModeratorOnly>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <InviteGroupMembers
                      groupId={groupQuery._id}
                      trigger={
                        <button className="flex w-full items-center px-2 py-1.5 text-sm">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Invite Members
                        </button>
                      }
                    />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </PermissionGuard>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="px-4 md:px-6"
        >
          <TabsList>
            <TabsTrigger value="dashboard">
              <FileText className="mr-2 h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="about">
              <FileText className="mr-2 h-4 w-4" />
              About
            </TabsTrigger>
            <TabsTrigger value="discussion">
              <MessageSquare className="mr-2 h-4 w-4" />
              Discussion
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="mr-2 h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="mr-2 h-4 w-4" />
              Events
            </TabsTrigger>

            {/* Only show these tabs to admins/moderators */}
            <PermissionGuard
              userRole={currentUserRole}
              requiredRole="moderator"
            >
              <TabsTrigger value="invitations">
                <UserPlus className="mr-2 h-4 w-4" />
                Invitations
              </TabsTrigger>
              <TabsTrigger value="requests">
                <UserPlus className="mr-2 h-4 w-4" />
                Join Requests
              </TabsTrigger>
            </PermissionGuard>
          </TabsList>

          <TabsContent value="dashboard" className="py-4"></TabsContent>

          <TabsContent value="about" className="py-4">
            <Card>
              <CardHeader>
                <CardTitle>About {groupQuery.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose dark:prose-invert max-w-none">
                  {groupQuery.description}
                </div>

                {groupQuery.categoryTags &&
                  groupQuery.categoryTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {groupQuery.categoryTags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                <div className="pt-2 text-sm text-muted-foreground">
                  Created by {groupQuery.creator?.name ?? "Unknown"}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="py-4">
            <GroupMembersDisplay
              groupId={groupQuery._id}
              currentUserRole={currentUserRole}
            />
          </TabsContent>

          <TabsContent value="discussion" className="py-4">
            <GroupFeed groupId={groupId as Id<"groups">} />
          </TabsContent>

          <TabsContent value="events" className="py-4">
            <Card>
              <CardHeader>
                <CardTitle>Group Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Calendar functionality coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invitations" className="border-none p-0">
            <Card>
              <CardHeader>
                <CardTitle>Group Invitations</CardTitle>
              </CardHeader>
              <CardContent>
                <GroupInvitations
                  groupId={groupQuery._id}
                  status="pending"
                  maxHeight="600px"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="border-none p-0">
            <Card>
              <CardHeader>
                <CardTitle>Join Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <GroupJoinRequests
                  groupId={groupQuery._id}
                  status="pending"
                  maxHeight="600px"
                  onRequestHandled={() => {
                    // Refresh the data when a request is handled
                    router.refresh();
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Return the rendered content
  return renderContent();
}
