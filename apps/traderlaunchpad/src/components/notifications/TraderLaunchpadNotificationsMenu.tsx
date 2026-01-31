"use client";

import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type {
  NotificationTabDefinition,
  NotificationsAdapter,
} from "launchthat-plugin-notifications/frontend";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { Bell } from "lucide-react";
import { Button } from "@acme/ui/button";
import { NotificationsDropdown } from "launchthat-plugin-notifications/frontend";
import { api } from "@convex-config/_generated/api";

const tabs: NotificationTabDefinition[] = [
  { id: "all", label: "All" },
  { id: "system", label: "System", tabKey: "system" },
  { id: "organizations", label: "Organizations", tabKey: "organization" },
  { id: "news", label: "News", tabKey: "news" },
];

export function TraderLaunchpadNotificationsMenu() {
  const { isAuthenticated } = useConvexAuth();

  const ensureUser = useMutation(api.coreTenant.mutations.createOrGetUser);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    void ensureUser({});
  }, [ensureUser, isAuthenticated]);

  const unreadCount = useQuery(
    api.notifications.queries.getUnreadCountForViewer,
    isAuthenticated ? {} : "skip",
  );

  const adapter: NotificationsAdapter = React.useMemo(
    () => ({
      inboxMode: "allOrgs",
      tabs,
      api: {
        queries: {
          paginate: (
            api.notifications.queries as unknown as {
              paginateForViewer: typeof api.notifications.queries.paginateByClerkIdAcrossOrgs;
            }
          ).paginateForViewer,
          unreadCount: (
            api.notifications.queries as unknown as {
              getUnreadCountForViewer: typeof api.notifications.queries.getUnreadCountByClerkIdAcrossOrgs;
            }
          ).getUnreadCountForViewer,
        },
        mutations: {
          markAsRead: api.notifications.mutations.markNotificationAsRead,
          markAllAsRead: (
            api.notifications.mutations as unknown as {
              markAllNotificationsAsReadForViewer: typeof api.notifications.mutations.markAllNotificationsAsReadByClerkId;
            }
          ).markAllNotificationsAsReadForViewer,
        },
      },
      buildPaginateArgs: ({
        tabKey,
        cursor,
        numItems,
      }: {
        tabKey?: string;
        cursor: string | null;
        numItems: number;
      }) => ({
        filters: tabKey ? { tabKey } : undefined,
        paginationOpts: { numItems, cursor },
      }),
      buildMarkAllArgs: () => ({}),
    }),
    [],
  );

  const [open, setOpen] = React.useState(false);

  if (!isAuthenticated) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="relative h-9 w-9 rounded-xl text-foreground/80 hover:bg-background/10 hover:text-foreground"
          aria-label={`Notifications${(unreadCount ?? 0) > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {(unreadCount ?? 0) > 0 && (
            <span className="bg-destructive absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white animate-[tlp-unread-badge-pulse_3s_ease-in-out_infinite]">
              {(unreadCount ?? 0) > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[420px] border-white/10 bg-black/70 p-3 text-white backdrop-blur-md"
      >
        <NotificationsDropdown
          adapter={adapter}
          clerkId={null}
          orgId={null}
          onClose={() => setOpen(false)}
          variant="dropdown"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

