"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Check, Clock, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { applyFilters } from "@acme/admin-runtime/hooks";

import { Button } from "@acme/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { DrawerClose } from "@acme/ui/drawer";
import { EmptyState } from "@acme/ui/entity-list/EmptyState";
import { ScrollArea } from "@acme/ui/scroll-area";
import { Skeleton } from "@acme/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type { NotificationDropdownProps, NotificationTabDefinition } from "./types";
import { NotificationCard } from "./NotificationCard";
import { FRONTEND_NOTIFICATIONS_TABS_FILTER } from "~/lib/plugins/hookSlots";
import { pluginDefinitions } from "~/lib/plugins/definitions";

type PluginOptionDoc = { metaKey?: unknown; metaValue?: unknown };

const getEnabledPluginIds = (args: {
  pluginOptions: PluginOptionDoc[] | undefined;
}): string[] => {
  const optionMap = new Map(
    (args.pluginOptions ?? []).map((o) => [String(o.metaKey ?? ""), Boolean(o.metaValue)]),
  );

  const enabledIds: string[] = [];
  for (const plugin of pluginDefinitions) {
    if (!plugin.activation) {
      enabledIds.push(plugin.id);
      continue;
    }
    const stored = optionMap.get(plugin.activation.optionKey);
    const isEnabled = stored ?? plugin.activation.defaultEnabled ?? false;
    if (isEnabled) enabledIds.push(plugin.id);
  }
  return enabledIds;
};

export function NotificationDropdown({
  clerkId,
  orgId,
  onClose,
  error,
  variant = "dropdown",
}: NotificationDropdownProps) {
  const router = useRouter();
  const [activeTabId, setActiveTabId] = useState<string>("all");
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null);

  const pluginOptions = useQuery(
    api.core.options.getByType,
    orgId ? ({ orgId: orgId as any, type: "site" } as const) : "skip",
  ) as PluginOptionDoc[] | undefined;
  const enabledPluginIds = getEnabledPluginIds({ pluginOptions });

  const baseTabs: NotificationTabDefinition[] = [
    { id: "all", label: "All" },
    { id: "system", label: "System", tabKey: "system" },
  ];
  const tabsRaw: unknown = applyFilters(
    FRONTEND_NOTIFICATIONS_TABS_FILTER,
    baseTabs,
    { enabledPluginIds, orgId },
  );
  const tabs: NotificationTabDefinition[] = Array.isArray(tabsRaw)
    ? (tabsRaw as NotificationTabDefinition[])
    : baseTabs;
  const activeTab =
    tabs.find((t) => t.id === activeTabId) ?? tabs[0] ?? baseTabs[0];

  // Get convex user by clerkId
  const convexUser = useQuery(
    api.core.users.getUserByClerkId,
    clerkId ? { clerkId } : "skip",
  );

  // Query for notifications
  const notificationsResult = useQuery(
    api.core.notifications.queries.paginateByClerkIdAndOrgId,
    clerkId
      ? {
          clerkId,
          orgId: orgId as any,
          filters: activeTab.tabKey ? { tabKey: activeTab.tabKey } : undefined,
          paginationOpts: {
            numItems: 10,
            cursor: paginationCursor ?? null,
          },
        }
      : "skip",
  );

  // Mutations for marking notifications as read
  const markAsRead = useMutation(
    api.core.notifications.mutations.markNotificationAsRead,
  );
  const markAllAsRead = useMutation(
    api.core.notifications.mutations.markAllNotificationsAsRead,
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
        orgId: orgId as any,
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

    if (!notificationsResult || notificationsResult.page.length === 0) {
      return (
        <EmptyState
          icon={<Clock className="text-muted-foreground h-10 w-10" />}
          title="No notifications"
          description={
            activeTab.id === "all"
              ? "You don't have any notifications yet."
              : `You don't have any ${activeTab.label} notifications.`
          }
        />
      );
    }

    const notifications = notificationsResult.page;
    const hasMore = !notificationsResult.isDone && !!notificationsResult.continueCursor;
    const visibleNotifications = activeTab.tabKey
      ? notifications.filter(
          (n: any) => typeof n?.tabKey === "string" && n.tabKey === activeTab.tabKey,
        )
      : notifications;

    return (
      <>
        <div className="space-y-1 p-1">
          {visibleNotifications.map((notification) => (
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
                setPaginationCursor(notificationsResult.continueCursor);
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

  const panel = (
    <div className="w-full">
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
          {variant === "drawer" ? (
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </DrawerClose>
          ) : null}
        </div>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTabId}
        onValueChange={(value) => {
          setActiveTabId(value);
          setPaginationCursor(null);
        }}
        className="w-full"
      >
        <div className="border-b px-4">
          <TabsList className="h-10 w-full justify-start rounded-none border-b-0 bg-transparent p-0">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className="data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <ScrollArea className="h-[350px]">
          <TabsContent value={activeTabId} className="m-0">
            {renderNotificationContent()}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );

  if (variant === "drawer") return panel;

  return (
    <div className="bg-background absolute top-full right-0 z-50 mt-1 w-[380px] rounded-md border shadow-md sm:w-[440px]">
      {panel}
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
