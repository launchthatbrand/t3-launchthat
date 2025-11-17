"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Check, Clock, X } from "lucide-react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { EmptyState } from "@/components/EmptyState";
import type { Id } from "../../../convex/_generated/dataModel";
import { Skeleton } from "@acme/ui/skeleton";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";

// Type definitions for invitations - only for reference, not used in the component

interface GroupInvitationsProps {
  clerkId?: string; // Changed from userId to clerkId - represents Clerk user ID
  groupId?: string; // If provided, shows invitations for specific group
  status?: "pending" | "accepted" | "declined" | "expired";
  showEmpty?: boolean;
  maxHeight?: string;
}

export function GroupInvitations({
  clerkId,
  groupId,
  status = "pending",
  showEmpty = true,
  maxHeight,
}: GroupInvitationsProps) {
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null);

  // Query for invitations using the new function
  const invitationsResult = useQuery(api.groups.listGroupInvitationsByClerkId, {
    clerkId,
    groupId: groupId as Id<"groups"> | undefined,
    status,
    paginationOpts: paginationCursor
      ? { cursor: paginationCursor, numItems: 10 }
      : { numItems: 10 },
  });

  // Mutation to respond to invitations
  const respondToInvitation = useMutation(api.groups.respondToGroupInvitation);

  // Handler for accepting an invitation
  const handleAccept = async (invitationId: string) => {
    try {
      await respondToInvitation({
        invitationId: invitationId as Id<"groupInvitations">,
        accepted: true,
      });

      toast.success("Invitation accepted", {
        description: "You've successfully joined the group",
      });
    } catch (error) {
      console.error("Failed to accept invitation:", error);
      toast.error("Failed to accept invitation. Please try again later.");
    }
  };

  // Handler for declining an invitation
  const handleDecline = async (invitationId: string) => {
    try {
      await respondToInvitation({
        invitationId: invitationId as Id<"groupInvitations">,
        accepted: false,
      });

      toast.success("Invitation declined", {
        description: "You've declined the invitation to join the group",
      });
    } catch (error) {
      console.error("Failed to decline invitation:", error);
      toast.error("Failed to decline invitation. Please try again later.");
    }
  };

  // Handle "Load more" button click
  const handleLoadMore = () => {
    if (invitationsResult?.cursor) {
      setPaginationCursor(invitationsResult.cursor);
    }
  };

  // If there's an error or no invitations, show appropriate UI
  if (invitationsResult === undefined) {
    return <InvitationsSkeleton count={3} />;
  }

  const { invitations, hasMore } = invitationsResult;

  if (invitations.length === 0 && showEmpty) {
    return (
      <EmptyState
        icon={<Clock className="h-10 w-10 text-muted-foreground" />}
        title="No invitations"
        description={
          status === "pending"
            ? "You don't have any pending group invitations."
            : "You don't have any invitations with this status."
        }
      />
    );
  }

  return (
    <div
      className="space-y-4"
      style={{ maxHeight, overflowY: maxHeight ? "auto" : "visible" }}
    >
      {invitations.map((invitation) => (
        <Card key={invitation._id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {invitation.group?.name ?? "Unknown Group"}
              </CardTitle>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-1 h-3 w-3" />
                {new Date(
                  invitation._creationTime ?? Date.now(),
                ).toLocaleDateString()}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={invitation.group?.avatar} />
                <AvatarFallback>
                  {invitation.group?.name[0] ?? "G"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">
                    {invitation.inviter?.name ?? "Someone"}
                  </span>{" "}
                  invited you to join this group
                </p>
                {invitation.message && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    "{invitation.message}"
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
                onClick={() => handleDecline(invitation._id)}
              >
                <X className="mr-1 h-3 w-3" />
                Decline
              </Button>
              <Button size="sm" onClick={() => handleAccept(invitation._id)}>
                <Check className="mr-1 h-3 w-3" />
                Accept
              </Button>
            </CardFooter>
          )}
          {status !== "pending" && (
            <CardFooter className="pt-2">
              <div className="text-sm text-muted-foreground">
                {status === "accepted" && "You accepted this invitation"}
                {status === "declined" && "You declined this invitation"}
                {status === "expired" && "This invitation has expired"}
                {invitation.respondedAt && (
                  <span className="ml-1">
                    on {new Date(invitation.respondedAt).toLocaleDateString()}
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

// Loading skeleton for invitations
function InvitationsSkeleton({ count = 3 }: { count?: number }) {
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
