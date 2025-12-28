"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Bell } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@acme/ui/drawer";
import { useMediaQuery } from "@acme/ui/hooks/use-media-query";

import { useTenant } from "~/context/TenantContext";
import { NotificationDropdown } from "./NotificationDropdown";

export function NotificationIcon() {
  const { user } = useClerk();
  const clerkId = user?.id;
  const tenant = useTenant();
  const orgId = tenant?._id;
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const unreadCount = useQuery(
    api.notifications.queries.getUnreadCountByClerkIdAndOrgId,
    clerkId && orgId ? { clerkId, orgId } : "skip",
  );

  const triggerButton = (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={`Notifications${(unreadCount ?? 0) > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      <Bell className="h-5 w-5" />
      {(unreadCount ?? 0) > 0 && (
        <span className="bg-destructive absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white">
          {(unreadCount ?? 0) > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent className="p-0">
          {clerkId && orgId ? (
            <NotificationDropdown
              onClose={() => setIsOpen(false)}
              clerkId={clerkId}
              orgId={orgId}
              error={null}
              variant="drawer"
            />
          ) : (
            <div className="p-4 text-sm">Sign in to view notifications.</div>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        aria-label={`Notifications${(unreadCount ?? 0) > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {(unreadCount ?? 0) > 0 && (
          <span className="bg-destructive absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white">
            {(unreadCount ?? 0) > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && clerkId && orgId && (
        <NotificationDropdown
          onClose={() => setIsOpen(false)}
          clerkId={clerkId}
          orgId={orgId}
          error={null}
          variant="dropdown"
        />
      )}
    </div>
  );
}
