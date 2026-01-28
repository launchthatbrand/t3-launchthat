"use client";

import * as React from "react";

import { Bell } from "lucide-react";
import { useSession } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { api } from "@convex-config/_generated/api";
import {
  NotificationsDropdown,
  type NotificationsAdapter,
  type NotificationTabDefinition,
} from "launchthat-plugin-notifications/frontend";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useHostContext } from "~/context/HostContext";

const tabs: NotificationTabDefinition[] = [
  { id: "all", label: "All" },
  { id: "system", label: "System", tabKey: "system" },
  { id: "organizations", label: "Organizations", tabKey: "organization" },
  { id: "news", label: "News", tabKey: "news" },
];

export function TraderLaunchpadNotificationsMenu() {
  const host = useHostContext();
  // Tenant/custom hosts don't run Clerk; avoid calling Clerk hooks outside <ClerkProvider>.
  if (!host.isAuthHost) return null;

  const { session } = useSession();
  const clerkId = session?.user?.id ?? null;

  // Ensure a core tenant user row exists once signed in.
  const ensureUser = useMutation(api.coreTenant.mutations.createOrGetUser as any);

  React.useEffect(() => {
    if (!clerkId) return;
    void ensureUser({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkId]);

  const unreadCount = useQuery(
    api.notifications.queries.getUnreadCountByClerkIdAcrossOrgs,
    clerkId ? { clerkId } : "skip",
  );

  const adapter: NotificationsAdapter = React.useMemo(
    () => ({
      inboxMode: "allOrgs",
      tabs,
      api: {
        queries: {
          paginate: api.notifications.queries.paginateByClerkIdAcrossOrgs,
          unreadCount: api.notifications.queries.getUnreadCountByClerkIdAcrossOrgs,
        },
        mutations: {
          markAsRead: api.notifications.mutations.markNotificationAsRead,
          markAllAsRead: api.notifications.mutations.markAllNotificationsAsReadByClerkId,
        },
      },
      buildPaginateArgs: ({
        clerkId,
        tabKey,
        cursor,
        numItems,
      }: {
        clerkId?: string | null;
        tabKey?: string;
        cursor: string | null;
        numItems: number;
      }) => {
        if (!clerkId) return "skip";
        return {
          clerkId,
          filters: tabKey ? { tabKey } : undefined,
          paginationOpts: { numItems, cursor },
        };
      },
      buildMarkAllArgs: ({ clerkId }: { clerkId?: string | null }) => {
        if (!clerkId) return null;
        return { clerkId };
      },
    }),
    [],
  );

  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="relative h-9 w-9 rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
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
          clerkId={clerkId}
          orgId={null}
          onClose={() => setOpen(false)}
          variant="dropdown"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

