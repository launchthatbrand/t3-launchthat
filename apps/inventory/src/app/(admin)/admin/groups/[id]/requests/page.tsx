"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { GroupMembershipRequests } from "@/components/groups/GroupMembershipRequests";
import { PendingInvitations } from "@/components/groups/PendingInvitations";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Spinner } from "@acme/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

export default function GroupRequestsPage() {
  const { user } = useUser();
  // Parse the groupId from the current URL
  const groupId = window.location.pathname.split("/").slice(-2)[0];

  const group = useQuery(api.groups.queries.getGroupById, {
    groupId: groupId as Id<"groups">,
  });

  const membership = useQuery(
    api.groups.getUserMembership,
    user?.id
      ? {
          groupId: groupId as Id<"groups">,
          userId: user.id as Id<"users">,
        }
      : "skip",
  );

  // Show loading state
  if (!group || !membership) {
    return (
      <div className="flex h-40 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Check if user is admin or moderator
  const isAdminOrModerator =
    membership &&
    membership.role &&
    (membership.role === "admin" || membership.role === "moderator");

  if (!isAdminOrModerator) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to view this page. Only group
            administrators and moderators can manage membership requests.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Membership Requests</h2>

      <Card>
        <CardHeader>
          <CardTitle>Membership Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="requests" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="requests">Join Requests</TabsTrigger>
              <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>
            </TabsList>
            <TabsContent value="requests">
              <GroupMembershipRequests groupId={groupId} />
            </TabsContent>
            <TabsContent value="invitations">
              <PendingInvitations groupId={groupId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
