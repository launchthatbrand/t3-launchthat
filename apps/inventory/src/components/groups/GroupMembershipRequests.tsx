"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle, UserPlus, Users, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

import { useGroupNotifications } from "./utils/notificationHelpers";

interface GroupMembershipRequestsProps {
  groupId: string;
  status?: "pending" | "approved" | "rejected";
  showEmpty?: boolean;
  maxHeight?: string;
}

export function GroupMembershipRequests({
  groupId,
  status = "pending",
  showEmpty = true,
  maxHeight,
}: GroupMembershipRequestsProps) {
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null);
  const notifications = useGroupNotifications();

  // Query for join requests
  const joinRequestsResult = useQuery(
    api.groups.queries.listGroupJoinRequests as any,
    {
      groupId: groupId as Id<"groups">,
      status,
      paginationOpts: paginationCursor
        ? { cursor: paginationCursor, numItems: 10 }
        : { numItems: 10 },
    },
  );

  // Get the group info
  const group = useQuery(api.groups.queries.getGroupById, {
    groupId: groupId as Id<"groups">,
  });

  // Mutations to respond to join requests
  const respondToJoinRequest = useMutation(
    api.groups.respondToJoinRequest as any,
  );

  // Handler for approving a join request
  const handleApprove = async (
    requestId: string,
    userId: string,
    userName: string,
  ) => {
    try {
      await respondToJoinRequest({
        requestId: requestId as Id<"groupJoinRequests">,
        approved: true,
      });

      // Send notification to the user that their request was approved
      if (group) {
        await notifications.createJoinRequestApprovedNotification({
          userId: userId as Id<"users">,
          adminId: "system" as any, // Ideally this would be the current user's ID
          adminName: "Group Admin",
          groupId: groupId as Id<"groups">,
          groupName: group.name,
          joinRequestId: requestId as Id<"groupJoinRequests">,
        });
      }

      toast.success("Request approved", {
        description: `${userName} has been added to the group`,
      });
    } catch (error) {
      console.error("Failed to approve join request:", error);
      toast.error("Failed to approve join request. Please try again later.");
    }
  };

  // Handler for rejecting a join request
  const handleReject = async (
    requestId: string,
    userId: string,
    userName: string,
  ) => {
    try {
      await respondToJoinRequest({
        requestId: requestId as Id<"groupJoinRequests">,
        approved: false,
      });

      // Send notification to the user that their request was rejected
      if (group) {
        await notifications.createJoinRequestRejectedNotification({
          userId: userId as Id<"users">,
          adminId: "system" as any, // Ideally this would be the current user's ID
          adminName: "Group Admin",
          groupId: groupId as Id<"groups">,
          groupName: group.name,
          joinRequestId: requestId as Id<"groupJoinRequests">,
        });
      }

      toast.success("Request rejected", {
        description: `${userName}'s request to join the group has been rejected`,
      });
    } catch (error) {
      console.error("Failed to reject join request:", error);
      toast.error("Failed to reject join request. Please try again later.");
    }
  };

  // Handle "Load more" button click
  const handleLoadMore = () => {
    if (joinRequestsResult?.cursor) {
      setPaginationCursor(joinRequestsResult.cursor);
    }
  };

  // If there's an error or no requests, show appropriate UI
  if (joinRequestsResult === undefined) {
    return <RequestsSkeleton count={3} />;
  }

  const { requests, hasMore } = joinRequestsResult;

  if (requests.length === 0 && showEmpty) {
    return (
      <EmptyState
        icon={<Users className="h-10 w-10 text-muted-foreground" />}
        title="No requests"
        description={
          status === "pending"
            ? "There are no pending requests to join this group."
            : "There are no requests with this status."
        }
      />
    );
  }

  return (
    <div
      className="space-y-4"
      style={{ maxHeight, overflowY: maxHeight ? "auto" : "visible" }}
    >
      {requests.map((request) => (
        <Card key={request._id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {request.user?.name ?? "Unknown User"}
              </CardTitle>
              <div className="flex items-center text-sm text-muted-foreground">
                <UserPlus className="mr-1 h-3 w-3" />
                {new Date(request.createdAt).toLocaleDateString()}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={request.user?.avatar} />
                <AvatarFallback>
                  {(request.user?.name?.[0] ?? "U").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">
                    {request.user?.name ?? "Someone"}
                  </span>{" "}
                  requested to join this group
                </p>
                {request.message && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    "{request.message}"
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          {status === "pending" && (
            <CardFooter className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleReject(
                    request._id,
                    request.userId as string,
                    request.user?.name ?? "Unknown User",
                  )
                }
              >
                <XCircle className="mr-1 h-3 w-3" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  handleApprove(
                    request._id,
                    request.userId as string,
                    request.user?.name ?? "Unknown User",
                  )
                }
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Approve
              </Button>
            </CardFooter>
          )}
          {status !== "pending" && (
            <CardFooter className="pt-2">
              <div className="text-sm text-muted-foreground">
                {status === "approved" && "You approved this request"}
                {status === "rejected" && "You rejected this request"}
                {request.respondedAt && (
                  <span className="ml-1">
                    on {new Date(request.respondedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </CardFooter>
          )}
        </Card>
      ))}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={handleLoadMore}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

// Loading skeleton for requests
function RequestsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 pt-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
