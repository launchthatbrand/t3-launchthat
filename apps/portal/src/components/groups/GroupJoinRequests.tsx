"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Check, Clock, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { EmptyState } from "@acme/ui/entity-list/EmptyState";
import { Skeleton } from "@acme/ui/skeleton";

import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

// Type definitions for join requests
interface JoinRequest {
  _id: string;
  groupId: string;
  userId: string;
  message?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
  respondedAt?: number;
  respondedBy?: string;
  group: {
    id: string;
    name: string;
    privacy: string;
    avatar?: string;
  };
  user: {
    id: string;
    name: string;
    avatar?: string;
  } | null;
  responder?: {
    id: string;
    name: string;
    avatar?: string;
  } | null;
}

interface GroupJoinRequestsProps {
  groupId: Id<"groups">;
  status?: "pending" | "approved" | "rejected";
  showEmpty?: boolean;
  maxHeight?: string;
  onRequestHandled?: () => void;
}

export function GroupJoinRequests({
  groupId,
  status = "pending",
  showEmpty = true,
  maxHeight,
  onRequestHandled,
}: GroupJoinRequestsProps) {
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null);

  // Query for join requests
  const requestsResult = useQuery(api.groups.listGroupJoinRequests, {
    groupId,
    status,
    paginationOpts: paginationCursor
      ? { cursor: paginationCursor, numItems: 10 }
      : { numItems: 10 },
  });

  // Mutations to respond to requests
  const respondToRequest = useMutation(api.groups.respondToGroupRequest);

  // Handler for approving a request
  const handleApprove = async (requestId: Id<"groupJoinRequests">) => {
    try {
      await respondToRequest({
        requestId,
        approved: true,
      });

      if (onRequestHandled) {
        onRequestHandled();
      }
    } catch (error) {
      console.error("Failed to approve request:", error);
    }
  };

  // Handler for rejecting a request
  const handleReject = async (requestId: Id<"groupJoinRequests">) => {
    try {
      await respondToRequest({
        requestId,
        approved: false,
      });

      if (onRequestHandled) {
        onRequestHandled();
      }
    } catch (error) {
      console.error("Failed to reject request:", error);
    }
  };

  // Handle "Load more" button click
  const handleLoadMore = () => {
    if (requestsResult?.cursor) {
      setPaginationCursor(requestsResult.cursor);
    }
  };

  // If there's an error or no requests, show appropriate UI
  if (requestsResult === undefined) {
    return <RequestsSkeleton count={3} />;
  }

  const { requests, hasMore } = requestsResult;

  if (requests.length === 0 && showEmpty) {
    return (
      <EmptyState
        icon={<Clock className="text-muted-foreground h-10 w-10" />}
        title="No join requests"
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
              <CardTitle className="flex items-center text-lg">
                <Avatar className="mr-2 h-6 w-6">
                  <AvatarImage src={request.user?.avatar} />
                  <AvatarFallback>
                    {request.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {request.user?.name || "Unknown User"}
              </CardTitle>
              <div className="text-muted-foreground flex items-center text-sm">
                <Clock className="mr-1 h-3 w-3" />
                {new Date(request.createdAt).toLocaleDateString()}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            {request.message ? (
              <p className="text-sm italic">"{request.message}"</p>
            ) : (
              <p className="text-muted-foreground text-sm">
                This user didn't provide a message with their request.
              </p>
            )}
          </CardContent>
          {status === "pending" && (
            <CardFooter className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleReject(request._id as Id<"groupJoinRequests">)
                }
              >
                <X className="mr-1 h-3 w-3" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  handleApprove(request._id as Id<"groupJoinRequests">)
                }
              >
                <Check className="mr-1 h-3 w-3" />
                Approve
              </Button>
            </CardFooter>
          )}
          {status !== "pending" && (
            <CardFooter className="pt-2">
              <div className="text-muted-foreground text-sm">
                {status === "approved" && "Request was approved"}
                {status === "rejected" && "Request was rejected"}
                {request.respondedAt && (
                  <span className="ml-1">
                    on {new Date(request.respondedAt).toLocaleDateString()}
                  </span>
                )}
                {request.responder && (
                  <span className="ml-1">by {request.responder.name}</span>
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
              <div className="flex items-center">
                <Skeleton className="mr-2 h-6 w-6 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
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
