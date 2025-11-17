import React, { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Check, HelpCircle, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Card } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Textarea } from "@acme/ui/textarea";

interface RSVPButtonsProps {
  eventId: Id<"events">;
  userId: Id<"users">;
  currentStatus?: string;
  showLabels?: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function RSVPButtons({
  eventId,
  userId,
  currentStatus,
  showLabels = true,
  size = "default",
  className,
}: RSVPButtonsProps) {
  const [status, setStatus] = useState<string | undefined>(currentStatus);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<
    "accepted" | "declined" | "tentative"
  >("accepted");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const respondToInvitation = useMutation(
    api.calendar.invitations.respondToEventInvitation,
  );

  const handleStatusClick = (
    newStatus: "accepted" | "declined" | "tentative",
  ) => {
    setSelectedStatus(newStatus);
    setIsResponseDialogOpen(true);
  };

  const handleSubmitResponse = async () => {
    try {
      setIsSubmitting(true);
      await respondToInvitation({
        eventId,
        userId,
        status: selectedStatus,
        responseComment: comment.trim() || undefined,
      });

      // Update local state
      setStatus(selectedStatus);
      setIsResponseDialogOpen(false);

      // Show success message
      const messages = {
        accepted: "You're going to this event!",
        declined: "You've declined this event",
        tentative: "You've marked this event as maybe",
      };
      toast.success(messages[selectedStatus]);
    } catch (error) {
      console.error("Error responding to invitation:", error);
      toast.error("Failed to update response");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get button size classes
  const sizeClasses = {
    sm: "h-8 px-3 text-xs",
    default: "h-10 px-4 py-2",
    lg: "h-12 px-5 py-3 text-lg",
  };

  // Get variant based on current status
  const getVariant = (buttonStatus: string) => {
    return status === buttonStatus ? "default" : "outline";
  };

  return (
    <>
      <Card className={cn("flex flex-row gap-2 p-2", className)}>
        <Button
          variant={getVariant("accepted")}
          size={size}
          className={cn(sizeClasses[size], "gap-1")}
          onClick={() => handleStatusClick("accepted")}
        >
          <Check className={cn("h-4 w-4", size === "lg" && "h-5 w-5")} />
          {showLabels && "Yes"}
        </Button>

        <Button
          variant={getVariant("tentative")}
          size={size}
          className={cn(sizeClasses[size], "gap-1")}
          onClick={() => handleStatusClick("tentative")}
        >
          <HelpCircle className={cn("h-4 w-4", size === "lg" && "h-5 w-5")} />
          {showLabels && "Maybe"}
        </Button>

        <Button
          variant={getVariant("declined")}
          size={size}
          className={cn(sizeClasses[size], "gap-1")}
          onClick={() => handleStatusClick("declined")}
        >
          <X className={cn("h-4 w-4", size === "lg" && "h-5 w-5")} />
          {showLabels && "No"}
        </Button>
      </Card>

      <Dialog
        open={isResponseDialogOpen}
        onOpenChange={setIsResponseDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedStatus === "accepted" && "Confirm attendance"}
              {selectedStatus === "tentative" && "Respond as maybe"}
              {selectedStatus === "declined" && "Decline event"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <label className="mb-2 block text-sm font-medium">
              Add a comment (optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a note..."
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResponseDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitResponse} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Response"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
