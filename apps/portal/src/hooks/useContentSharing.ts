"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import type { Id } from "../../convex/_generated/dataModel";
import type { ContentToShare } from "../components/social/ShareDialog";
import { api } from "../../convex/_generated/api";

interface UseContentSharingProps {
  onShareSuccess?: () => void;
  onShareError?: (error: Error) => void;
}

export function useContentSharing({
  onShareSuccess,
  onShareError,
}: UseContentSharingProps = {}) {
  const [isSharing, setIsSharing] = useState(false);

  // Mutations
  const shareContent = useMutation(api.plugins.socialfeed.mutations.shareContent);

  /**
   * Share content to the user's feed
   */
  const shareToFeed = async (
    userId: string,
    content: ContentToShare,
    comment = "",
    visibility: "public" | "private" | "group" = "public",
  ) => {
    if (!userId) {
      toast.error("Please sign in to share content");
      return false;
    }

    setIsSharing(true);

    try {
      if (content.type === "feedItem") {
        // Share existing feed item
        await shareContent({
          creatorId: userId as Id<"users">,
          originalContentId: content.id as Id<"feedItems">,
          content: comment,
          visibility,
        });

        toast.success("Content shared successfully");
        onShareSuccess?.();
        return true;
      } else {
        // For future implementation of other content types
        toast.error(`Sharing ${content.type} is not yet implemented`);
        return false;
      }
    } catch (error) {
      console.error("Error sharing content:", error);
      toast.error("Failed to share content");
      onShareError?.(
        error instanceof Error ? error : new Error("Unknown error"),
      );
      return false;
    } finally {
      setIsSharing(false);
    }
  };

  /**
   * Share content directly to another user via direct message
   * (Implementation placeholder for Task 12)
   */
  const shareToUser = async (
    senderId: string,
    receiverId: string,
    content: ContentToShare,
    message = "",
  ) => {
    setIsSharing(true);

    try {
      // Placeholder for direct messaging implementation
      console.log("Sharing to user:", {
        senderId,
        receiverId,
        content,
        message,
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Message sent successfully");
      onShareSuccess?.();
      return true;
    } catch (error) {
      console.error("Error sending direct message:", error);
      toast.error("Failed to send message");
      onShareError?.(
        error instanceof Error ? error : new Error("Unknown error"),
      );
      return false;
    } finally {
      setIsSharing(false);
    }
  };

  /**
   * Share content to a group
   * (Implementation placeholder for Task 12)
   */
  const shareToGroup = async (
    userId: string,
    groupId: string,
    content: ContentToShare,
    message = "",
  ) => {
    setIsSharing(true);

    try {
      // Placeholder for group sharing implementation
      console.log("Sharing to group:", { userId, groupId, content, message });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Shared to group successfully");
      onShareSuccess?.();
      return true;
    } catch (error) {
      console.error("Error sharing to group:", error);
      toast.error("Failed to share to group");
      onShareError?.(
        error instanceof Error ? error : new Error("Unknown error"),
      );
      return false;
    } finally {
      setIsSharing(false);
    }
  };

  return {
    isSharing,
    shareToFeed,
    shareToUser,
    shareToGroup,
  };
}
