"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { Clock } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

// Import EntityList components
import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
  FilterValue,
} from "~/components/shared/EntityList/types";
import { EntityList } from "~/components/shared/EntityList/EntityList";

// Define types for invitations
interface GroupInvitation {
  _id: string;
  createdAt: number;
  respondedAt?: number;
  status: "pending" | "accepted" | "declined" | "expired";
  message?: string;
  group?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  inviter?: {
    _id: string;
    name: string;
  };
}

export function InvitationsPageClient() {
  const { user } = useUser();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [activeFilters, setActiveFilters] = useState<
    Record<string, FilterValue>
  >({});

  // Redirect if not authenticated
  if (!isAuthenticated && !isLoading) {
    router.push("/login");
  }

  // Mock data for demonstration purposes
  // In a real implementation, this would come from a Convex query
  const mockInvitations: Record<string, GroupInvitation[]> = {
    pending: [
      {
        _id: "invitation1",
        createdAt: Date.now() - 3600000, // 1 hour ago
        status: "pending",
        message: "Would you like to join our group?",
        group: {
          _id: "group1",
          name: "Marketing Team",
          avatar:
            "https://ui-avatars.com/api/?name=Marketing+Team&background=0D8ABC&color=fff",
        },
        inviter: {
          _id: "user1",
          name: "John Doe",
        },
      },
      {
        _id: "invitation2",
        createdAt: Date.now() - 86400000, // 1 day ago
        status: "pending",
        message: "Join us for the new project!",
        group: {
          _id: "group2",
          name: "Product Development",
          avatar:
            "https://ui-avatars.com/api/?name=Product+Development&background=27AE60&color=fff",
        },
        inviter: {
          _id: "user2",
          name: "Jane Smith",
        },
      },
    ],
    accepted: [
      {
        _id: "invitation3",
        createdAt: Date.now() - 604800000, // 1 week ago
        respondedAt: Date.now() - 518400000, // 6 days ago
        status: "accepted",
        group: {
          _id: "group3",
          name: "Design Team",
          avatar:
            "https://ui-avatars.com/api/?name=Design+Team&background=8E44AD&color=fff",
        },
        inviter: {
          _id: "user3",
          name: "Alice Johnson",
        },
      },
    ],
    declined: [
      {
        _id: "invitation4",
        createdAt: Date.now() - 1209600000, // 2 weeks ago
        respondedAt: Date.now() - 1123200000, // 13 days ago
        status: "declined",
        message: "Join our sales team!",
        group: {
          _id: "group4",
          name: "Sales",
          avatar:
            "https://ui-avatars.com/api/?name=Sales&background=E74C3C&color=fff",
        },
        inviter: {
          _id: "user4",
          name: "Bob Wilson",
        },
      },
    ],
    expired: [
      {
        _id: "invitation5",
        createdAt: Date.now() - 7776000000, // 90 days ago
        status: "expired",
        group: {
          _id: "group5",
          name: "Legacy Project",
          avatar:
            "https://ui-avatars.com/api/?name=Legacy+Project&background=7F8C8D&color=fff",
        },
        inviter: {
          _id: "user5",
          name: "Charlie Brown",
        },
      },
    ],
  };

  // Simulated invitation actions
  const handleAccept = async (invitationId: string) => {
    toast.success("Invitation accepted", {
      description: "You've successfully joined the group",
    });
  };

  const handleDecline = async (invitationId: string) => {
    toast.success("Invitation declined", {
      description: "You've declined the invitation to join the group",
    });
  };

  // Define columns for the EntityList
  const columns: ColumnDefinition<GroupInvitation>[] = [
    {
      id: "group",
      header: "Group",
      accessorKey: "group",
      sortable: true,
      cell: (invitation) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={invitation.group?.avatar} />
            <AvatarFallback>{invitation.group?.name[0] ?? "G"}</AvatarFallback>
          </Avatar>
          <span className="font-medium">
            {invitation.group?.name ?? "Unknown Group"}
          </span>
        </div>
      ),
    },
    {
      id: "inviter",
      header: "Invited By",
      accessorKey: "inviter",
      sortable: true,
      cell: (invitation) => invitation.inviter?.name ?? "Unknown",
    },
    {
      id: "message",
      header: "Message",
      accessorKey: "message",
      cell: (invitation) => invitation.message ?? "No message",
    },
    {
      id: "date",
      header: "Date",
      accessorKey: "createdAt",
      sortable: true,
      cell: (invitation) =>
        new Date(invitation._creationTime ?? Date.now()).toLocaleDateString(),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (invitation) => (
        <Badge
          variant={
            invitation.status === "pending"
              ? "outline"
              : invitation.status === "accepted"
                ? "default"
                : invitation.status === "declined"
                  ? "destructive"
                  : "secondary"
          }
        >
          {invitation.status}
        </Badge>
      ),
    },
  ];

  // Define filter configurations
  const filters: FilterConfig<GroupInvitation>[] = [
    {
      id: "group",
      label: "Group",
      type: "text",
      field: "group",
    },
    {
      id: "inviter",
      label: "Invited By",
      type: "text",
      field: "inviter",
    },
    {
      id: "date",
      label: "Date",
      type: "date",
      field: "createdAt",
    },
  ];

  // Define entity actions
  const entityActions: EntityAction<GroupInvitation>[] =
    activeTab === "pending"
      ? [
          {
            id: "accept",
            label: "Accept",
            onClick: (invitation) => {
              void handleAccept(invitation._id);
            },
            variant: "secondary",
          },
          {
            id: "decline",
            label: "Decline",
            onClick: (invitation) => {
              void handleDecline(invitation._id);
            },
            variant: "outline",
          },
        ]
      : [];

  // Handle filter changes
  const handleFilterChange = (newFilters: Record<string, FilterValue>) => {
    setActiveFilters(newFilters);
  };

  // Get current invitations based on active tab
  const currentInvitations =
    mockInvitations[activeTab as keyof typeof mockInvitations] || [];

  // Apply filters (this would be more sophisticated in a real implementation)
  const filteredInvitations = currentInvitations.filter((invitation) => {
    // Just a simple example of filtering
    if (activeFilters.group && typeof activeFilters.group === "string") {
      return invitation.group?.name
        .toLowerCase()
        .includes(activeFilters.group.toLowerCase());
    }
    return true;
  });

  // Render loading state
  if (isLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Invitations</h1>

      <Card>
        <CardHeader>
          <CardTitle>Group Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value)}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
              <TabsTrigger value="declined">Declined</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <EntityList<GroupInvitation>
                data={filteredInvitations}
                columns={columns}
                filters={filters}
                isLoading={false}
                title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Invitations`}
                description={
                  activeTab === "pending"
                    ? "Invitations waiting for your response"
                    : activeTab === "accepted"
                      ? "Invitations you've accepted"
                      : activeTab === "declined"
                        ? "Invitations you've declined"
                        : "Invitations that are no longer valid"
                }
                defaultViewMode="list"
                viewModes={["list"]}
                entityActions={entityActions}
                emptyState={
                  <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                    <Clock className="h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {activeTab === "pending"
                        ? "You don't have any pending invitations"
                        : `You don't have any ${activeTab} invitations`}
                    </p>
                  </div>
                }
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
