"use client";

import type { GroupWithDetails } from "@/types/groups";
import type { Id } from "@convex-config/_generated/dataModel";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GroupHeaderCarousel } from "@/components/groups/GroupHeaderCarousel";
import { GroupHeaderEditor } from "@/components/groups/GroupHeaderEditor";
import { InviteGroupMembers } from "@/components/groups/InviteGroupMembers";
import { JoinGroupButton } from "@/components/groups/JoinGroupButton";
import useCarouselStore from "@/store/useCarouselStore";
import { api } from "@convex-config/_generated/api";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import {
  Calendar,
  LayoutDashboard,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@acme/ui/tabs";

// Define the tab structure
const tabs = [
  {
    name: "Dashboard",
    value: "",
    icon: LayoutDashboard,
    permission: null, // null means accessible to everyone
  },
  {
    name: "Members",
    value: "members",
    icon: Users,
    permission: null,
  },
  {
    name: "Discussion",
    value: "discussion",
    icon: MessageSquare,
    permission: null,
  },
  {
    name: "Events",
    value: "events",
    icon: Calendar,
    permission: null,
  },
  {
    name: "Requests",
    value: "requests",
    icon: UserPlus,
    permission: "moderator", // Only moderators and above can see this
  },
];

interface GroupProfileClientProps {
  children: ReactNode;
  groupData: GroupWithDetails;
  groupId: Id<"groups">;
}

export function GroupProfileClient({
  children,
  groupData,
  groupId,
}: GroupProfileClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { setItems } = useCarouselStore();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  // Get the current active tab from the URL path segments
  // The path will be like /groups/[id]/[tab]
  const pathSegments = pathname.split("/");
  const activeTab = pathSegments.length > 3 ? pathSegments[3] : "";

  // Use a ref to track if items have been initialized
  const itemsInitialized = useRef(false);

  // Add debugging info
  console.log("[GroupProfileClient] groupData:", groupData);
  console.log("[GroupProfileClient] isAuthenticated:", isAuthenticated);
  console.log("[GroupProfileClient] authLoading:", authLoading);

  // Initialize carousel items in store when group data changes
  useEffect(() => {
    // Skip if already initialized or we don't have the data
    if (itemsInitialized.current) return;

    // Safely access properties
    const headerItems = groupData.headerItems ?? [
      // Default item if no headerItems
      groupData.coverImage
        ? {
            id: "default",
            imageUrl: groupData.coverImage,
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
  }, [groupData, setItems]);

  // Prefetch all tab routes on component mount
  useEffect(() => {
    // Only prefetch tabs that don't require special permissions or that the user has access to
    const tabsToPrefetch = tabs.filter((tab) => {
      if (!tab.permission) return true; // No permission required

      // Check if user has the required role for permission-restricted tabs
      const userMembershipRole = groupData.userMembership?.role;
      if (!userMembershipRole) return false;

      if (tab.permission === "admin" && userMembershipRole === "admin")
        return true;
      if (
        tab.permission === "moderator" &&
        (userMembershipRole === "admin" || userMembershipRole === "moderator")
      )
        return true;

      return false;
    });

    // Prefetch each accessible tab
    for (const tab of tabsToPrefetch) {
      const route = tab.value
        ? `/groups/${groupId}/${tab.value}`
        : `/groups/${groupId}`;
      router.prefetch(route);
    }
  }, [groupId, groupData.userMembership?.role, router]);

  // Add direct membership query inside the component
  const directMembership = useQuery(
    api.groups.queries.getUserMembershipInGroup,
    isAuthenticated ? { groupId } : "skip",
  );
  console.log(
    "[GroupProfileClient] Direct membership query:",
    directMembership,
  );

  // Get user membership details - prioritize directly queried data if available
  const userMembership = directMembership ?? groupData.userMembership;
  console.log(
    "[GroupProfileClient] userMembership (with direct query):",
    userMembership,
  );

  const currentUserRole = useMemo(
    () => userMembership?.role,
    [userMembership?.role],
  );
  console.log("[GroupProfileClient] currentUserRole:", currentUserRole);

  // FIX: Ensure we correctly identify if the user is a member by checking if userMembership exists
  // AND that the status is 'active'
  const isMember = useMemo(
    () => !!userMembership && userMembership.status === "active",
    [userMembership],
  );
  console.log("[GroupProfileClient] isMember:", isMember);

  // Force a data refresh when the component mounts
  useEffect(() => {
    // Force refresh the data once on mount to ensure we have the latest membership status
    console.log("[GroupProfileClient] Initial data refresh");
    void router.refresh();
  }, [router]);

  // Mutations for joining and leaving the group
  const leaveGroup = useMutation(api.groups.mutations.leaveGroup);
  const updateGroup = useMutation(api.groups.mutations.updateGroup);

  // Refresh data after operations
  const refreshGroup = () => {
    void router.refresh();
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    const route =
      value === "" ? `/groups/${groupId}` : `/groups/${groupId}/${value}`;
    router.push(route, { scroll: false }); // Add scroll: false to prevent scrolling to top
  };

  const handleLeaveGroup = async () => {
    try {
      await leaveGroup({
        groupId: groupData._id,
      });
      // Refresh the data after leaving
      refreshGroup();
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

  // Determine the join button based on group privacy and user membership
  const renderJoinButton = () => {
    // Check for authentication first
    if (!isAuthenticated) {
      return (
        <JoinGroupButton
          groupId={groupData._id}
          privacyType={groupData.privacy}
          onJoined={refreshGroup}
        />
      );
    }

    // If user has membership data, handle based on status
    if (userMembership) {
      if (userMembership.status === "active") {
        return (
          <Button variant="outline" onClick={handleLeaveGroup}>
            Leave Group
          </Button>
        );
      } else if (userMembership.status === "pending") {
        return (
          <Button variant="outline" disabled>
            Request Pending
          </Button>
        );
      } else if (userMembership.status === "invited") {
        // Could add accept/decline invitation buttons here
        return (
          <Button variant="outline" disabled>
            Invited
          </Button>
        );
      }
    }

    // Default case: Not a member or special status
    return (
      <JoinGroupButton
        groupId={groupData._id}
        privacyType={groupData.privacy}
        onJoined={refreshGroup}
      />
    );
  };

  // Add a function to refetch group data when auth state changes
  useEffect(() => {
    // If auth state changes and we're authenticated, ensure we have the latest membership data
    if (isAuthenticated && !authLoading) {
      console.log(
        "[GroupProfileClient] Auth state changed, authenticated:",
        isAuthenticated,
      );
      // We could potentially refetch data here if needed
      void router.refresh();
    }
  }, [isAuthenticated, authLoading, router]);

  // Improve the currentUserRole handling with better logging
  useEffect(() => {
    console.log("[GroupProfileClient] Group membership with auth:", {
      groupId: groupData._id,
      userMembership: groupData.userMembership,
      role: groupData.userMembership?.role,
    });
  }, [groupData, isAuthenticated]);

  // Add extensive debug logging
  console.log("[GroupProfileClient] Debug state:", {
    isAuthenticated,
    authLoading,
    currentUserRole,
    isMember,
    groupData: {
      _id: groupData._id,
      name: groupData.name,
      memberCount: groupData.memberCount,
      userMembership: groupData.userMembership,
    },
    directMembership,
    shouldShowEditor:
      isAuthenticated &&
      (currentUserRole === "admin" || currentUserRole === "moderator"),
    headerCarouselItems: groupData.headerItems,
  });

  console.log("currentUserRole", currentUserRole);

  // Force the GroupHeaderEditor to be visible when the user is admin/moderator
  // This is a temporary solution to ensure the button appears
  const shouldShowEditor =
    isAuthenticated &&
    (currentUserRole === "admin" || currentUserRole === "moderator");

  return (
    <div className="space-y-6">
      {/* Group Header with Carousel */}
      <div className="relative">
        <GroupHeaderCarousel
          items={
            groupData.headerItems ?? [
              // Default item if no headerItems
              groupData.coverImage
                ? {
                    id: "default",
                    imageUrl: groupData.coverImage,
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

        {/* Editor button for admins and moderators - use the calculated value directly */}
        {shouldShowEditor && (
          <GroupHeaderEditor
            groupId={groupData._id}
            onSave={async (items) => {
              try {
                await updateGroup({
                  groupId: groupData._id,
                  headerItems: items,
                });
                refreshGroup();
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
            <AvatarImage src={groupData.avatar} alt={groupData.name} />
            <AvatarFallback>{groupData.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{groupData.name}</h1>
              <Badge
                variant={
                  groupData.privacy === "public"
                    ? "default"
                    : groupData.privacy === "restricted"
                      ? "secondary"
                      : "outline"
                }
              >
                {groupData.privacy.charAt(0).toUpperCase() +
                  groupData.privacy.slice(1)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {groupData.memberCount}{" "}
              {groupData.memberCount === 1 ? "member" : "members"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/groups/${groupId}?editor=true`)}
          >
            Edit Page
          </Button>
          {renderJoinButton()}

          <PermissionGuard userRole={currentUserRole} requiredRole="moderator">
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
                    groupId={groupData._id}
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

      {/* Tab Navigation with Shadcn Tabs */}
      <div className="px-4 md:px-6">
        <Tabs
          value={activeTab ?? ""}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="mb-4">
            {tabs.map((tab) => {
              // Skip tabs that require permissions the user doesn't have
              if (
                tab.permission &&
                (!currentUserRole ||
                  (tab.permission === "admin" && currentUserRole !== "admin") ||
                  (tab.permission === "moderator" &&
                    currentUserRole !== "admin" &&
                    currentUserRole !== "moderator"))
              ) {
                return null;
              }

              return (
                <TabsTrigger key={tab.value || "about"} value={tab.value}>
                  <tab.icon className="mr-2 h-4 w-4" />
                  {tab.name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Render the page component that contains TabsContent */}
          {children}
        </Tabs>
      </div>
    </div>
  );
}
