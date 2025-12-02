"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Check, Clock, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { EmptyState } from "@acme/ui/entity-list/EmptyState";
import { ScrollArea } from "@acme/ui/scroll-area";
import { Skeleton } from "@acme/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type {
  NotificationCategory,
  NotificationDropdownProps,
  NotificationFilters,
} from "./types";
import { NotificationCard } from "./NotificationCard";
import { NOTIFICATION_CATEGORIES } from "./types";

export function NotificationDropdown({
  clerkId,
  onClose,
  error,
}: NotificationDropdownProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NotificationCategory>("all");
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null);

  // Get convex user by clerkId
  const convexUser = useQuery(
    api.core.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip",
  );

  // Function to map category to notification types for filtering
  const getFilterTypes = (
    category: NotificationCategory,
  ): Record<string, any> => {
    if (category === "all") return {};

    // Get the first type in the category array (API expects a single type)
    const categoryTypes = NOTIFICATION_CATEGORIES[category];
    if (categoryTypes.length > 0) {
      return { type: categoryTypes[0] };
    }

    return {};
  };

  // Query for notifications
  const notificationsResult = useQuery(
    api.notifications.queries.getNotificationsByClerkId,
    clerkId
      ? {
          clerkId,
          filters: getFilterTypes(activeTab),
          paginationOpts: {
            numItems: 10,
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

  // Handle marking a notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead({
        notificationId: notificationId as any,
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast.error("Failed to update notification. Please try again.");
    }
  };

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!convexUser) return;

    try {
      await markAllAsRead({
        userId: convexUser._id as any,
      });
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      toast.error("Failed to update notifications. Please try again.");
    }
  };

  // Handle notification click
  const handleNotificationClick = (
    notificationId: string,
    actionUrl?: string,
  ) => {
    // Mark as read
    void handleMarkAsRead(notificationId);

    // Navigate if there's an action URL
    if (actionUrl) {
      onClose(); // Close dropdown
      router.push(actionUrl);
    }
  };

  // Render notification list or loading state
  const renderNotificationContent = () => {
    if (error) {
      return (
        <EmptyState
          icon={<Clock className="text-destructive h-10 w-10" />}
          title="Error loading notifications"
          description={error || "Something went wrong. Please try again later."}
        />
      );
    }

    if (!clerkId) {
      return (
        <EmptyState
          icon={<Clock className="text-muted-foreground h-10 w-10" />}
          title="Sign in to view notifications"
          description="You need to be signed in to view your notifications."
        />
      );
    }

    if (notificationsResult === undefined) {
      return <NotificationSkeleton count={5} />;
    }

    if (!notificationsResult || notificationsResult.length === 0) {
      return (
        <EmptyState
          icon={<Clock className="text-muted-foreground h-10 w-10" />}
          title="No notifications"
          description={
            activeTab === "all"
              ? "You don't have any notifications yet."
              : `You don't have any ${activeTab} notifications.`
          }
        />
      );
    }

    const notifications = notificationsResult;
    const hasMore = notifications.length === 10; // We fetched 10, so if we have 10, there might be more

    return (
      <>
        <div className="space-y-1 p-1">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onClick={() =>
                handleNotificationClick(
                  notification._id,
                  notification.actionUrl,
                )
              }
            />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (notifications.length > 0) {
                  const lastNotification =
                    notifications[notifications.length - 1];
                  if (
                    lastNotification &&
                    lastNotification._creationTime !== undefined
                  ) {
                    setPaginationCursor(
                      lastNotification._creationTime.toString(),
                    );
                  }
                }
              }}
              className="w-full"
            >
              Load more
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="bg-background absolute top-full right-0 z-50 mt-1 w-[380px] rounded-md border shadow-md sm:w-[440px]">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h2 className="text-sm font-semibold">Notifications</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={!convexUser}
          >
            <Check className="mr-1 h-3 w-3" />
            Mark all as read
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push("/notifications")}>
                View all notifications
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/settings/notifications")}
              >
                Notification settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as NotificationCategory);
          setPaginationCursor(null);
        }}
        className="w-full"
      >
        <div className="border-b px-4">
          <TabsList className="h-10 w-full justify-start rounded-none border-b-0 bg-transparent p-0">
            <TabsTrigger
              value="all"
              className="data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="group"
              className="data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Groups
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              System
            </TabsTrigger>
          </TabsList>
        </div>
        <ScrollArea className="h-[350px]">
          <TabsContent value={activeTab} className="m-0">
            {renderNotificationContent()}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function NotificationSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
