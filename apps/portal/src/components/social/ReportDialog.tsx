"use client";

import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { AlertCircle, Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { Button } from "@acme/ui/button";
import type { Id } from "../../../convex/_generated/dataModel";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useState } from "react";

// Report categories for content moderation
const REPORT_CATEGORIES = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment or Bullying" },
  { value: "hate_speech", label: "Hate Speech" },
  { value: "false_information", label: "False Information" },
  { value: "sensitive_content", label: "Sensitive or Disturbing Content" },
  { value: "illegal_content", label: "Illegal Content" },
  { value: "intellectual_property", label: "Intellectual Property Violation" },
  { value: "other", label: "Other" },
];

export interface ReportDialogProps {
  contentId: Id<"feedItems"> | Id<"comments">;
  contentType: "post" | "comment";
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function ReportDialog({
  contentId,
  contentType,
  trigger,
  onSuccess,
}: ReportDialogProps) {
  const { userId } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Replace with actual report mutation when available
  // Currently a placeholder that will be replaced with a real mutation
  const reportContent = useMutation(api.socialfeed.mutations.addComment);

  const handleSubmit = async () => {
    if (!userId) {
      toast.error("You must be signed in to report content");
      return;
    }

    if (!category) {
      setError("Please select a category");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Rate limit check - prevent abuse of report feature
      const rateLimitKey = `report_${userId}_${Date.now()}`;
      sessionStorage.setItem(rateLimitKey, "true");

      // Count reports in the last hour
      const recentReports = Object.keys(sessionStorage).filter(
        (key) =>
          key.startsWith(`report_${userId}_`) &&
          parseInt(key.split("_")[2]) > Date.now() - 3600000,
      ).length;

      if (recentReports > 10) {
        throw new Error(
          "You've submitted too many reports recently. Please try again later.",
        );
      }

      // TODO: Replace with actual report mutation when implemented
      // This is a temporary placeholder that uses the comment system
      // In a real implementation, this would call a dedicated reporting API
      await reportContent({
        userId: userId as Id<"users">,
        feedItemId: contentId as Id<"feedItems">,
        content: `REPORT: ${category} - ${description}`,
      });

      toast.success("Report submitted successfully");
      setOpen(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error submitting report:", err);
      setError(err instanceof Error ? err.message : "Failed to submit report");
      toast.error("Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <Flag className="h-4 w-4" />
            <span>Report</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report {contentType}</DialogTitle>
          <DialogDescription>
            Report inappropriate content to moderators. Abuse of this feature
            may result in account restrictions.
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
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Please provide details about the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !category}>
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
