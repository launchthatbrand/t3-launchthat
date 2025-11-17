"use client";

import { Bell, Calendar, FileText, ShoppingCart, Users } from "lucide-react";
import type {
  NotificationCardProps,
  NotificationCategory,
  NotificationType,
} from "./types";
import { format, formatDistanceToNow } from "date-fns";

import { NOTIFICATION_CATEGORIES } from "./types";
import { forwardRef } from "react";
import { useRouter } from "next/navigation";

// Define the notification types with their respective icons
export const NOTIFICATION_CATEGORY_ICONS = {
  activity: FileText,
  group: Users,
  system: Bell,
  event: Calendar,
  ecommerce: ShoppingCart,
  all: Bell,
};

export const NotificationCard = forwardRef<
  HTMLDivElement,
  NotificationCardProps
>(({ notification, onClick, className = "" }, ref) => {
  const router = useRouter();

  // Get the notification category based on the type
  const getCategory = (type: NotificationType): NotificationCategory => {
    // Check each category to find which one includes this notification type
    for (const [category, types] of Object.entries(NOTIFICATION_CATEGORIES)) {
      if (category === "all") continue; // Skip the "all" category
      if (types.includes(type)) {
        return category as NotificationCategory;
      }
    }
    return "activity"; // Default category
  };

  // Get the appropriate icon based on notification category
  const category = getCategory(notification.type);
  // Bell is the default/fallback icon
  const NotificationIcon = NOTIFICATION_CATEGORY_ICONS[category];

  // Format the notification time
  const formattedTime = formatDistanceToNow(
    new Date(notification._creationTime),
    { addSuffix: true },
  );

  // Format the tooltip time (full date and time)
  const tooltipTime = format(new Date(notification._creationTime), "PPpp");

  // Handle card click
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <div
      ref={ref}
      className={`flex cursor-pointer items-start gap-3 rounded-md p-3 hover:bg-accent ${
        notification.read ? "opacity-70" : "bg-accent/50"
      } ${className}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={notification.title}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
        <NotificationIcon className="h-4 w-4" />
      </div>

      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{notification.title}</p>
        {notification.content && (
          <p className="text-xs text-muted-foreground">
            {notification.content}
          </p>
        )}
        <p className="text-xs text-muted-foreground" title={tooltipTime}>
          {formattedTime}
        </p>
      </div>

      {!notification.read && (
        <div className="h-2 w-2 rounded-full bg-primary" />
      )}
    </div>
  );
});

NotificationCard.displayName = "NotificationCard";
