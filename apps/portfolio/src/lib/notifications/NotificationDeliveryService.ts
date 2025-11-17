/**
 * Notification Delivery Service
 *
 * This service handles the delivery of notifications through various channels:
 * - In-app notifications
 * - Email notifications
 * - Push notifications
 */

import type { Notification } from "@/components/notifications/types";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ConvexReactClient } from "convex/react";

export type NotificationChannel =
  | "feed-activity"
  | "system"
  | "group"
  | "event"
  | "ecommerce";

export type NotificationCallback = (notification: Notification) => void;

export class NotificationDeliveryService {
  private static instance: NotificationDeliveryService | null = null;
  private convexClient: ConvexReactClient | null = null;
  private channelListeners: Map<string, Set<NotificationCallback>>;
  private subscriptions: Map<string, () => void>;

  private constructor() {
    this.channelListeners = new Map();
    this.subscriptions = new Map();
  }

  /**
   * Get the singleton instance of the notification service
   */
  public static getInstance(): NotificationDeliveryService {
    if (!NotificationDeliveryService.instance) {
      NotificationDeliveryService.instance = new NotificationDeliveryService();
    }
    return NotificationDeliveryService.instance;
  }

  /**
   * Initialize the service with a Convex client
   */
  public initialize(client: ConvexReactClient): void {
    this.convexClient = client;
  }

  /**
   * Subscribe to notifications on a specific channel
   */
  public subscribeToChannel(
    channel: NotificationChannel,
    callback: NotificationCallback,
  ): () => void {
    // Initialize channel listeners if not exists
    if (!this.channelListeners.has(channel)) {
      this.channelListeners.set(channel, new Set());
      this.setupChannelSubscription(channel);
    }

    // Add the callback to the channel
    const listeners = this.channelListeners.get(channel);
    if (listeners) {
      listeners.add(callback);
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.channelListeners.get(channel);
      if (listeners) {
        listeners.delete(callback);

        // If no more listeners, unsubscribe from the channel
        if (listeners.size === 0) {
          this.teardownChannelSubscription(channel);
          this.channelListeners.delete(channel);
        }
      }
    };
  }

  /**
   * Check for notifications that might have been missed
   */
  public async checkMissedNotifications(
    userId: string,
    since: number,
    types: string[],
  ): Promise<Notification[]> {
    if (!this.convexClient) {
      console.error("Convex client not initialized");
      return [];
    }

    try {
      // Use the listNotifications query with filters instead of getMissedNotifications
      const missedNotifications = await this.convexClient.query(
        api.notifications.index.listNotifications,
        {
          userId: userId as Id<"users">,
          filters: {
            // Filter by notification types
            type: types.length === 1 ? types[0] : undefined,
            // Add timestamp filter if available in the API
          },
          paginationOpts: {
            numItems: 50,
            cursor: null,
          },
        },
      );

      // Filter client-side for notifications after the 'since' timestamp
      if (missedNotifications && missedNotifications.page) {
        return missedNotifications.page.filter(
          (n) => n._creationTime > since,
        ) as Notification[];
      }
      return [];
    } catch (error) {
      console.error("Error checking missed notifications:", error);
      return [];
    }
  }

  /**
   * Deliver a notification through the in-app channel
   */
  public async deliverInApp(notification: Notification): Promise<void> {
    if (!this.convexClient) {
      console.error("Convex client not initialized");
      return;
    }

    try {
      await this.convexClient.mutation(
        api.notifications.mutations.createNotification,
        {
          // Extract required fields for the API
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          content: notification.content,
          sourceUserId: notification.sourceUserId,
          sourceId: notification.sourceId,
          actionUrl: notification.actionUrl,
          channel: "inApp",
        },
      );
    } catch (error) {
      console.error("Error delivering in-app notification:", error);
    }
  }

  /**
   * Deliver a notification through email
   */
  public async deliverEmail(notification: Notification): Promise<void> {
    if (!this.convexClient) {
      console.error("Convex client not initialized");
      return;
    }

    try {
      // Since there's no direct email notification endpoint, create a notification and mark it for email delivery
      await this.convexClient.mutation(
        api.notifications.mutations.createNotification,
        {
          // Extract required fields for the API
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          content: notification.content,
          sourceUserId: notification.sourceUserId,
          sourceId: notification.sourceId,
          actionUrl: notification.actionUrl,
          channel: "email",
        },
      );
    } catch (error) {
      console.error("Error delivering email notification:", error);
    }
  }

  /**
   * Deliver a notification through push notification
   */
  public async deliverPush(notification: Notification): Promise<void> {
    if (!this.convexClient) {
      console.error("Convex client not initialized");
      return;
    }

    try {
      // Since there's no direct push notification endpoint, create a notification and mark it for push delivery
      await this.convexClient.mutation(
        api.notifications.mutations.createNotification,
        {
          // Extract required fields for the API
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          content: notification.content,
          sourceUserId: notification.sourceUserId,
          sourceId: notification.sourceId,
          actionUrl: notification.actionUrl,
          channel: "push",
        },
      );
    } catch (error) {
      console.error("Error delivering push notification:", error);
    }
  }

  /**
   * Setup subscription for a specific notification channel
   * Note: Using a subscription approach instead of onUpdate since onUpdate isn't available in standard ConvexReactClient
   */
  private setupChannelSubscription(channel: NotificationChannel): void {
    if (!this.convexClient) {
      console.error("Convex client not initialized");
      return;
    }

    // Use subscription instead of onUpdate
    const unsubscribe = this.convexClient.subscribe(
      api.notifications.index.listNotifications,
      {
        userId: "system" as Id<"users">, // This is a placeholder, should be replaced with actual user ID
        filters: {
          // Channel-specific filtering logic
        },
        paginationOpts: {
          numItems: 10,
          cursor: null,
        },
      },
      (notifications) => {
        if (!notifications?.page?.length) return;

        // Process notifications that match the channel
        const channelNotifications = notifications.page.filter(
          (notification) => {
            // Apply channel-specific filtering
            switch (channel) {
              case "feed-activity":
                return ["reaction", "comment", "mention", "share"].includes(
                  notification.type,
                );
              case "system":
                return notification.type.startsWith("system");
              // Add other channel filters as needed
              default:
                return false;
            }
          },
        ) as Notification[];

        // Notify all listeners for this channel about each relevant notification
        if (channelNotifications.length > 0) {
          const listeners = this.channelListeners.get(channel);
          if (listeners) {
            channelNotifications.forEach((notification) => {
              listeners.forEach((callback) => {
                try {
                  callback(notification);
                } catch (error) {
                  console.error(
                    `Error in notification listener for channel ${channel}:`,
                    error,
                  );
                }
              });
            });
          }
        }
      },
    );

    // Store the unsubscribe function
    this.subscriptions.set(channel, unsubscribe);
  }

  /**
   * Teardown subscription for a specific notification channel
   */
  private teardownChannelSubscription(channel: NotificationChannel): void {
    const unsubscribe = this.subscriptions.get(channel);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(channel);
    }
  }
}
