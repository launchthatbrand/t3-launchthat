"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Check, Clock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@acme/ui/empty";
import { EmptyState } from "@acme/ui/entity-list/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import type { Notification } from "./NotificationCard";
import { NotificationCard } from "./NotificationCard";

interface NotificationsListProps {
  userId?: string;
}

export function NotificationsList({ userId }: NotificationsListProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null);

  // Query for notifications
  const notificationsResult = useQuery(
    api.notifications.listNotifications,
    userId
      ? {
          userId: userId as Id<"users">,
          filters: { type: activeFilter !== "all" ? activeFilter : undefined },
          paginationOpts: paginationCursor
            ? { cursor: paginationCursor, numItems: 20 }
            : { numItems: 20 },
        }
      : null,
  );

  // Mutations for marking notifications as read
  const markAsRead = useMutation(api.notifications.markNotificationAsRead);
  const markAllAsRead = useMutation(
    api.notifications.markAllNotificationsAsRead,
  );

  // Handle marking a notification as read
  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.isRead) return;

    try {
      await markAsRead({
        notificationId: notification._id,
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast.error("Failed to update notification. Please try again.");
    }
  };

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!userId) return;

    try {
      await markAllAsRead({
        userId: userId as Id<"users">,
      });
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      toast.error("Failed to update notifications. Please try again.");
    }
  };

  // Handle loading more notifications
  const handleLoadMore = () => {
    if (notificationsResult?.cursor) {
      setPaginationCursor(notificationsResult.cursor);
    }
  };

  if (!userId) {
    return (
      <Empty>
        <EmptyMedia variant="icon">
          <Clock className="text-muted-foreground h-12 w-12" />
        </EmptyMedia>
        <EmptyContent>
          <EmptyTitle>Sign in to view notifications</EmptyTitle>
          <EmptyDescription>
            You need to be signed in to view your notifications.
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    );
  }

  // Handle loading state
  if (notificationsResult === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
          <div className="flex items-center gap-2">
            <Select disabled value="all">
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" disabled>
              <Check className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-muted h-20 animate-pulse rounded-lg"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  const { notifications, hasMore } = notificationsResult;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
        <div className="flex items-center gap-2">
          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="activity">Activity</SelectItem>
              <SelectItem value="group">Groups</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="event">Events</SelectItem>
              <SelectItem value="e-commerce">E-commerce</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={
              notifications.length === 0 ||
              notifications.every((n: Notification) => n.isRead)
            }
          >
            <Check className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Clock className="text-muted-foreground h-12 w-12" />}
          title="No notifications"
          description={
            activeFilter === "all"
              ? "You don't have any notifications yet."
              : `You don't have any ${activeFilter} notifications.`
          }
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification: Notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onClick={() => handleMarkAsRead(notification)}
              className="border"
            />
          ))}

          {hasMore && (
            <div className="pt-4 text-center">
              <Button variant="outline" onClick={handleLoadMore}>
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
