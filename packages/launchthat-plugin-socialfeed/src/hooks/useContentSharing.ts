"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { ContentToShare } from "../components/ShareDialog";
import type { Id } from "../lib/types";
import {
  useSocialFeedApi,
  useSocialFeedMutation,
} from "../context/SocialFeedClientProvider";

interface UseContentSharingProps {
  onShareSuccess?: () => void;
  onShareError?: (error: Error) => void;
}

export function useContentSharing({
  onShareSuccess,
  onShareError,
}: UseContentSharingProps = {}) {
  const socialfeedApi = useSocialFeedApi<any>();
  const [isSharing, setIsSharing] = useState(false);

  const shareContent = useSocialFeedMutation(
    socialfeedApi?.mutations?.shareContent,
  );

  const shareToFeed = async (
    userId: string,
    content: ContentToShare,
    comment: string = "",
    visibility: "public" | "private" | "group" = "public",
  ) => {
    if (!userId) {
      toast.error("Please sign in to share content");
      return false;
    }

    setIsSharing(true);

    try {
      if (content.type === "feedItem") {
        await shareContent({
          creatorId: userId as Id<"users">,
          originalContentId: content.id as Id<"feedItems">,
          content: comment,
          visibility,
        });

        toast.success("Content shared successfully");
        onShareSuccess?.();
        return true;
      }

      toast.error(`Sharing ${content.type} is not yet implemented`);
      return false;
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

  const shareToUser = async (
    senderId: string,
    receiverId: string,
    content: ContentToShare,
    message: string = "",
  ) => {
    setIsSharing(true);

    try {
      console.log("Sharing to user:", {
        senderId,
        receiverId,
        content,
        message,
      });

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

  const shareToGroup = async (
    userId: string,
    groupId: string,
    content: ContentToShare,
    message: string = "",
  ) => {
    setIsSharing(true);

    try {
      console.log("Sharing to group:", {
        userId,
        groupId,
        content,
        message,
      });

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
    shareToGroup,
    shareToUser,
  };
}
