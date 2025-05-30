"use client";

import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { AlertCircle, UserMinus } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Label } from "@acme/ui/label";
import { RadioGroup, RadioGroupItem } from "@acme/ui/radio-group";
import { Textarea } from "@acme/ui/textarea";

import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";

export type BlockLevel = "soft" | "full" | "report";

export interface BlockUserDialogProps {
  userId: Id<"users">;
  userName: string;
  userImage?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function BlockUserDialog({
  userId,
  userName,
  userImage,
  trigger,
  onSuccess,
}: BlockUserDialogProps) {
  const { userId: currentUserId } = useAuth();
  const [open, setOpen] = useState(false);
  const [blockLevel, setBlockLevel] = useState<BlockLevel>("soft");
  const [reason, setReason] = useState("");
  const [reportToAdmin, setReportToAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Replace with actual block user mutation when available
  // Currently a placeholder
  const blockUser = useMutation(api.socialfeed.mutations.addComment);

  const handleSubmit = async () => {
    if (!currentUserId) {
      toast.error("You must be signed in to block users");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // In a real implementation, this would call a dedicated user block API
      // This is just a placeholder that uses the comment system
      await blockUser({
        userId: currentUserId as Id<"users">,
        feedItemId: "placeholder" as Id<"feedItems">,
        content: `BLOCK_USER: ${userId} level=${blockLevel} report=${reportToAdmin} reason=${reason}`,
      });

      // Store locally for immediate UI feedback
      const blockedUsers = JSON.parse(
        localStorage.getItem("blockedUsers") || "{}",
      );
      blockedUsers[userId] = { level: blockLevel, timestamp: Date.now() };
      localStorage.setItem("blockedUsers", JSON.stringify(blockedUsers));

      // Display success message based on block level
      if (blockLevel === "full") {
        toast.success(`You won't see any content from ${userName} anymore`);
      } else if (blockLevel === "soft") {
        toast.success(`You won't receive notifications from ${userName}`);
      } else {
        toast.success(`You've reported and blocked ${userName}`);
      }

      setOpen(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error blocking user:", err);
      setError(err instanceof Error ? err.message : "Failed to block user");
      toast.error("Failed to block user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-destructive"
          >
            <UserMinus className="h-4 w-4" />
            <span>Block User</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Block {userName}</DialogTitle>
          <DialogDescription>
            Choose how you want to restrict interactions with this user.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="my-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 py-4">
          <RadioGroup
            value={blockLevel}
            onValueChange={(value) => setBlockLevel(value as BlockLevel)}
            className="space-y-3"
          >
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="soft" id="r1" className="mt-1" />
              <div className="grid gap-1.5">
                <Label htmlFor="r1" className="font-medium">
                  Limit interactions
                </Label>
                <p className="text-sm text-muted-foreground">
                  You won't receive notifications or direct messages from this
                  user, but you may still see their content.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="full" id="r2" className="mt-1" />
              <div className="grid gap-1.5">
                <Label htmlFor="r2" className="font-medium">
                  Full block
                </Label>
                <p className="text-sm text-muted-foreground">
                  You won't see any content from this user, and they won't be
                  able to see your profile or content.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="report" id="r3" className="mt-1" />
              <div className="grid gap-1.5">
                <Label htmlFor="r3" className="font-medium">
                  Report and block
                </Label>
                <p className="text-sm text-muted-foreground">
                  Block this user and report them to site moderators for
                  violating community guidelines.
                </p>
              </div>
            </div>
          </RadioGroup>

          <div className="grid gap-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Why are you blocking this user?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {blockLevel !== "report" && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="report-admin"
                checked={reportToAdmin}
                onCheckedChange={(checked) =>
                  setReportToAdmin(checked === true)
                }
              />
              <Label htmlFor="report-admin" className="text-sm">
                Also report this user to site administrators
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Block User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
