"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Bell } from "lucide-react";

import { Button } from "@acme/ui/button";

import { NotificationDropdown } from "./NotificationDropdown";

// Define the notification type
interface Notification {
  _id: string;
  read: boolean;
  title: string;
  content?: string;
  type: string;
  createdAt: number;
}

export function NotificationIcon() {
  const { user } = useClerk();
  const clerkId = user?.id;
  const [isOpen, setIsOpen] = useState(false);

  // Get notifications from Convex using Clerk ID
  const notificationsResult = useQuery(
    api.notifications.queries.listNotificationsByClerkId,
    clerkId ? { clerkId } : "skip",
  );

  // Count unread notifications
  const unreadCount = Array.isArray(notificationsResult)
    ? notificationsResult.filter((n: Notification) => !n.read).length
    : 0;

  // Handle errors in the UI rather than in the query
  // This is a more React-friendly approach
  if (notificationsResult instanceof Error) {
    console.error("Error fetching notifications:", notificationsResult);
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && clerkId && (
        <NotificationDropdown
          onClose={() => setIsOpen(false)}
          clerkId={clerkId}
          error={
            notificationsResult instanceof Error
              ? "Unable to load notifications"
              : null
          }
        />
      )}
    </div>
  );
}
