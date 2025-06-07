"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { GroupInvitations } from "@/components/groups/GroupInvitations";
import { GroupMembershipRequests } from "@/components/groups/GroupMembershipRequests";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Spinner } from "@acme/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

export function RequestsContent({ groupId }: { groupId: string }) {
  const router = useRouter();
  // Using _ prefix to indicate unused variable (for Clerk auth context)
  const { user: _user } = useUser();

  const group = useQuery(api.groups.queries.getGroupById, {
    groupId: groupId as Id<"groups">,
  });

  // Get user membership
  const userMembership = group?.userMembership;

  // Check if user is admin or moderator
  const isAdminOrModerator =
    userMembership?.role === "admin" || userMembership?.role === "moderator";

  // Show loading state
  if (!group) {
    return (
      <TabsContent value="requests" className="outline-none">
        <h2 className="text-xl font-semibold">Membership Requests</h2>
        <div className="mt-6 flex h-40 w-full items-center justify-center">
          <Spinner size="lg" />
        </div>
      </TabsContent>
    );
  }

  if (!isAdminOrModerator) {
    return (
      <TabsContent value="requests" className="outline-none">
        <h2 className="text-xl font-semibold">Membership Requests</h2>
        <div className="mt-6 space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to view this page. Only group
              administrators and moderators can manage membership requests.
            </AlertDescription>
          </Alert>
          <Button onClick={() => router.push(`/groups/${groupId}`)}>
            Return to Group
          </Button>
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="requests" className="outline-none">
      <h2 className="text-xl font-semibold">Membership Requests</h2>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Membership Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="requests" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="requests">Join Requests</TabsTrigger>
                <TabsTrigger value="invitations">
                  Pending Invitations
                </TabsTrigger>
              </TabsList>
              <TabsContent value="requests">
                <GroupMembershipRequests groupId={groupId} />
              </TabsContent>
              <TabsContent value="invitations">
                <GroupInvitations
                  groupId={group._id}
                  status="pending"
                  maxHeight="600px"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
