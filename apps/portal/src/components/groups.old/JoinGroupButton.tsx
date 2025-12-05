"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { LogIn, UserPlus } from "lucide-react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import type { ButtonProps } from "@acme/ui/button";
import type { Id } from "../../../convex/_generated/dataModel";
import { Textarea } from "@acme/ui/textarea";
import { api } from "../../../convex/_generated/api";
import { cn } from "@acme/ui";
import { toast } from "sonner";
import { useState } from "react";

interface JoinGroupButtonProps extends ButtonProps {
  groupId: Id<"groups">;
  privacyType?: "public" | "private" | "restricted";
  size?: "sm" | "default" | "lg" | "icon";
  onJoined?: () => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  className?: string;
}

export function JoinGroupButton({
  groupId,
  privacyType,
  size = "default",
  onJoined,
  variant = "default",
  className,
  ...buttonProps
}: JoinGroupButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get group details if privacy type is not provided
  const groupDetails = useQuery(
    api.groups.queries.getGroupById,
    privacyType ? { groupId } : undefined,
  );

  // Use provided privacy type or get it from the group details
  const privacy = privacyType || groupDetails?.privacy;

  // Mutation to request to join a group
  const requestToJoin = useMutation(api.groups.mutations.joinGroup);

  const handleJoinClick = async () => {
    if (privacy === "private") {
      toast.error("This group is private and requires an invitation to join.");
      return;
    }

    if (privacy === "restricted") {
      // For restricted groups, show the request dialog
      setIsDialogOpen(true);
      return;
    }

    // For public groups, directly join
    handleJoinSubmit();
  };

  const handleJoinSubmit = async () => {
    setIsLoading(true);

    try {
      const result = await requestToJoin({
        groupId,
        message: message.trim() || undefined,
      });

      setIsDialogOpen(false);
      setMessage("");

      if (result.autoJoined) {
        toast.success("You have successfully joined the group.");
      } else {
        toast.success(
          "Your request to join the group has been sent. You'll be notified when it's approved.",
        );
      }

      if (onJoined) {
        onJoined();
      }
    } catch (error) {
      console.error("Failed to join group:", error);
      toast.error(
        (error as Error).message || "Failed to join group. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // If we're waiting for privacy type data, show loading state
  if (!privacy && !privacyType) {
    return (
      <Button
        size={size}
        variant={variant}
        disabled
        className={className}
        {...buttonProps}
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Join
      </Button>
    );
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        onClick={handleJoinClick}
        className={cn("", className)}
        {...buttonProps}
      >
        {size !== "icon" && (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            {privacy === "restricted" ? "Request to Join" : "Join Group"}
          </>
        )}
        {size === "icon" && <LogIn className="h-4 w-4" />}
      </Button>

      {/* Dialog for join request */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request to Join Group</DialogTitle>
            <DialogDescription>
              This group requires approval to join. You can include a message
              with your request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Why do you want to join this group? (Optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleJoinSubmit} disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
