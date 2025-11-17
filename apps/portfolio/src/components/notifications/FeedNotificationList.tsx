"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";

import { ScrollArea } from "@acme/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type { Notification } from "./types";
// Local helper to avoid importing server-only convex code from client
import { FeedNotificationCard } from "./FeedNotificationCard";

const groupNotificationsByType = (notifications: Notification[]) =>
  notifications.reduce(
    (acc, n) => {
      const t = n.type as string;
      (acc[t] ||= []).push(n);
      return acc;
    },
    {} as Record<string, Notification[]>,
  );

interface FeedNotificationListProps {
  notifications: Notification[];
  maxHeight?: string;
  showTabs?: boolean;
}

export function FeedNotificationList({
  notifications,
  maxHeight = "350px",
  showTabs = true,
}: FeedNotificationListProps) {
  // Mutation to mark a notification as read
  const markAsRead = useMutation(
    api.notifications.mutations.markNotificationAsRead,
  );

  // Filter for only feed-related notifications
  const feedNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      return [
        "reaction",
        "comment",
        "commentReply",
        "mention",
        "share",
        "newFollowedUserPost",
      ].includes(notification.type as string);
    });
  }, [notifications]);

  // Group notifications by type for better organization
  const groupedNotifications = useMemo(() => {
    // Using type casting to handle API compatibility
    return groupNotificationsByType(feedNotifications as any);
  }, [feedNotifications]);

  // Handler for marking a notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead({
        notificationId: notificationId as Id<"notifications">,
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Count notifications by type
  const counts = useMemo(() => {
    return {
      all: feedNotifications.length,
      reactions: (groupedNotifications.reaction ?? []).length,
      comments:
        (groupedNotifications.comment ?? []).length +
        (groupedNotifications.commentReply ?? []).length,
      mentions: (groupedNotifications.mention ?? []).length,
      shares: (groupedNotifications.share ?? []).length,
      posts: (groupedNotifications.newFollowedUserPost ?? []).length,
    };
  }, [feedNotifications, groupedNotifications]);

  // If no notifications, show message
  if (feedNotifications.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No feed notifications yet
      </div>
    );
  }

  // Render function for notifications
  const renderNotifications = (notifications: Notification[]) => {
    return notifications.map((notification) => (
      <FeedNotificationCard
        key={notification._id}
        id={notification._id}
        type={notification.type}
        title={notification.title}
        content={notification.content ?? ""}
        createdAt={notification._creationTime}
        sourceUser={
          notification.sourceUserId
            ? {
                id: notification.sourceUserId,
                name: notification.title.split(" ")[0] ?? "User", // Add fallback
              }
            : undefined
        }
        actionUrl={notification.actionUrl ?? "/social"}
        read={notification.read}
        onMarkAsRead={handleMarkAsRead}
      />
    ));
  };

  return (
    <div className="w-full">
      {showTabs ? (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="text-xs">
              All ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="reactions" className="text-xs">
              Likes ({counts.reactions})
            </TabsTrigger>
            <TabsTrigger value="comments" className="text-xs">
              Comments ({counts.comments})
            </TabsTrigger>
            <TabsTrigger value="mentions" className="text-xs">
              Mentions ({counts.mentions})
            </TabsTrigger>
            <TabsTrigger value="shares" className="text-xs">
              Shares ({counts.shares})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className={`max-h-[${maxHeight}]`}>
            <TabsContent value="all" className="space-y-2 p-2">
              {renderNotifications(feedNotifications)}
            </TabsContent>

            <TabsContent value="reactions" className="space-y-2 p-2">
              {groupedNotifications.reaction ? (
                renderNotifications(
                  groupedNotifications.reaction as Notification[],
                )
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No reaction notifications
                </div>
              )}
            </TabsContent>

            <TabsContent value="comments" className="space-y-2 p-2">
              {[
                ...(groupedNotifications.comment ?? []),
                ...(groupedNotifications.commentReply ?? []),
              ].length > 0 ? (
                renderNotifications([
                  ...(groupedNotifications.comment ?? []),
                  ...(groupedNotifications.commentReply ?? []),
                ] as Notification[])
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No comment notifications
                </div>
              )}
            </TabsContent>

            <TabsContent value="mentions" className="space-y-2 p-2">
              {groupedNotifications.mention ? (
                renderNotifications(
                  groupedNotifications.mention as Notification[],
                )
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No mention notifications
                </div>
              )}
            </TabsContent>

            <TabsContent value="shares" className="space-y-2 p-2">
              {groupedNotifications.share ? (
                renderNotifications(
                  groupedNotifications.share as Notification[],
                )
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No share notifications
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      ) : (
        <ScrollArea className={`max-h-[${maxHeight}]`}>
          <div className="space-y-2 p-2">
            {renderNotifications(feedNotifications)}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
