"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

import { useNotificationPreferences } from "../../hooks/useNotificationPreferences";
import { NotificationDeliveryService } from "../../lib/notifications/NotificationDeliveryService";
import { useFeedContext } from "../social/FeedContext";
import { Notification } from "./types";

/**
 * This component handles the integration between the feed system and notification infrastructure.
 * It doesn't render any UI but rather manages the background processes connecting the two systems.
 */
export function FeedNotificationIntegration() {
  const { user } = useUser();
  const userId = user?.id;
  const { lastInteraction } = useFeedContext();
  const { preferences, isLoading } = useNotificationPreferences(userId);

  // Load notification service
  const notificationService = NotificationDeliveryService.getInstance();

  // Subscribe to feed activity notifications
  useEffect(() => {
    if (!userId || isLoading) return;

    // Setup listener for new feed notifications
    const unsubscribe = notificationService.subscribeToChannel(
      "feed-activity",
      (notification) => {
        // Check if user has enabled this notification type
        if (!shouldDeliverNotification(notification.type, preferences)) {
          return;
        }

        // Process notification based on type
        switch (notification.type) {
          case "reaction":
          case "comment":
          case "commentReply":
          case "mention":
          case "share":
          case "newFollowedUserPost":
            // Deliver through appropriate channels
            deliverNotification(notification, preferences);
            break;
          default:
            // Ignore non-feed notifications
            break;
        }
      },
    );

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [userId, preferences, isLoading]);

  // Re-check for missed notifications when the user interacts with the feed
  useEffect(() => {
    if (!userId || !lastInteraction) return;

    // Fetch recent notifications that might have been missed
    const fetchMissedNotifications = async () => {
      try {
        // Implementation depends on specific notification API structure
        const missedNotifications =
          await notificationService.checkMissedNotifications(
            userId,
            lastInteraction.timestamp,
            [
              "reaction",
              "comment",
              "commentReply",
              "mention",
              "share",
              "newFollowedUserPost",
            ],
          );

        // Process any found notifications
        if (missedNotifications && missedNotifications.length > 0) {
          missedNotifications.forEach((notification) => {
            if (shouldDeliverNotification(notification.type, preferences)) {
              deliverNotification(notification, preferences);
            }
          });
        }
      } catch (error) {
        console.error("Failed to fetch missed notifications:", error);
      }
    };

    // Explicitly void the promise to prevent ESLint warning
    void fetchMissedNotifications();
  }, [userId, lastInteraction]);

  // Helper function to check if notification should be delivered based on user preferences
  const shouldDeliverNotification = (
    type: string,
    userPreferences: NotificationPreference | null,
  ): boolean => {
    // Default to showing if preferences not loaded
    if (!userPreferences || !userPreferences.inApp) return true;

    // Map notification types to preference settings
    const preferenceMap: Record<string, string> = {
      reaction: "feedReactions",
      comment: "feedComments",
      commentReply: "feedComments",
      mention: "feedMentions",
      share: "feedShares",
      newFollowedUserPost: "newFollowedPosts",
    };

    const preferenceSetting = preferenceMap[type];

    if (!preferenceSetting) return true; // Unknown type, default to showing

    // Check each delivery channel (inApp is always checked, others depend on context)
    return userPreferences.inApp[preferenceSetting] === true;
  };

  // Helper function to deliver notification through appropriate channels
  const deliverNotification = (
    notification: Notification,
    userPreferences: NotificationPreference | null,
  ) => {
    if (
      !userPreferences ||
      !userPreferences.inApp ||
      !userPreferences.email ||
      !userPreferences.push
    )
      return;

    // Map notification types to preference settings
    const preferenceMap: Record<string, string> = {
      reaction: "feedReactions",
      comment: "feedComments",
      commentReply: "feedComments",
      mention: "feedMentions",
      share: "feedShares",
      newFollowedUserPost: "newFollowedPosts",
    };

    const preferenceSetting =
      preferenceMap[notification.type as string] ?? "activity";

    // Check which channels to deliver through
    const deliveryChannels = {
      inApp: userPreferences.inApp[preferenceSetting] === true,
      email: userPreferences.email[preferenceSetting] === true,
      push: userPreferences.push[preferenceSetting] === true,
    };

    // Deliver through each enabled channel
    if (deliveryChannels.inApp) {
      void notificationService.deliverInApp(notification);
    }

    if (deliveryChannels.email) {
      void notificationService.deliverEmail(notification);
    }

    if (deliveryChannels.push) {
      void notificationService.deliverPush(notification);
    }
  };

  // This is a background integration component, so it doesn't render anything
  return null;
}

// Helper type for the component
interface NotificationPreference {
  inApp: Record<string, boolean>;
  email: Record<string, boolean>;
  push: Record<string, boolean>;
  pushEnabled?: boolean;
}
