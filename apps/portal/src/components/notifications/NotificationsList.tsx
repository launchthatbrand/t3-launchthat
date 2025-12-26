"use client";

import { useEffect, useMemo, useState } from "react";
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
  clerkId?: string;
  orgId?: string;
}

export function NotificationsList({ clerkId, orgId }: NotificationsListProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null);
  const [items, setItems] = useState<Array<any>>([]);

  const convexUser = useQuery(
    api.core.users.queries.getUserByClerkId,
    clerkId ? { clerkId } : "skip",
  );

  // Query for notifications
  const notificationsResult = useQuery(
    api.notifications.queries.paginateByClerkIdAndOrgId,
    clerkId && orgId
      ? {
          clerkId,
          orgId: orgId as any,
          filters:
            activeFilter !== "all" ? { eventKey: activeFilter } : undefined,
          paginationOpts: {
            numItems: 20,
            cursor: paginationCursor ?? null,
          },
        }
      : "skip",
  );

  // Mutations for marking notifications as read
  const markAsRead = useMutation(
    api.notifications.mutations.markNotificationAsRead,
  );
  const markAllAsRead = useMutation(
    api.notifications.mutations.markAllNotificationsAsRead,
  );

  const cursorKey = useMemo(
    () => `${activeFilter}:${paginationCursor ?? "null"}`,
    [activeFilter, paginationCursor],
  );

  useEffect(() => {
    if (!notificationsResult) return;
    const page = notificationsResult.page ?? [];

    setItems((prev) => {
      const byId = new Map<string, any>();
      // Reset on first page for this filter
      const base = paginationCursor ? prev : [];
      for (const n of base) byId.set(n._id, n);
      for (const n of page) byId.set(n._id, n);
      return Array.from(byId.values());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursorKey, notificationsResult]);

  // Handle marking a notification as read
  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.isRead) return;

    try {
      await markAsRead({
        notificationId: notification._id,
      });
      setItems((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n)),
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast.error("Failed to update notification. Please try again.");
    }
  };

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!convexUser || !orgId) return;

    try {
      await markAllAsRead({
        userId: convexUser._id as any,
        orgId: orgId as any,
      });
      toast.success("All notifications marked as read");
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      toast.error("Failed to update notifications. Please try again.");
    }
  };

  // Handle loading more notifications
  const handleLoadMore = () => {
    if (notificationsResult?.continueCursor) {
      setPaginationCursor(notificationsResult.continueCursor);
    }
  };

  if (!clerkId || !orgId) {
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

  const notifications = items;
  const hasMore =
    !!notificationsResult &&
    !notificationsResult.isDone &&
    !!notificationsResult.continueCursor;

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
              notifications.every((n: any) => n.read)
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
          {notifications.map((notification: any) => (
            <NotificationCard
              key={notification._id}
              notification={{
                _id: notification._id,
                title: notification.title,
                content: notification.content,
                createdAt: notification.createdAt,
                actionUrl: notification.actionUrl,
                type: notification.eventKey,
                isRead: notification.read,
              }}
              onClick={() =>
                handleMarkAsRead({
                  _id: notification._id,
                  title: notification.title,
                  content: notification.content,
                  createdAt: notification.createdAt,
                  actionUrl: notification.actionUrl,
                  type: notification.eventKey,
                  isRead: notification.read,
                } as Notification)
              }
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
