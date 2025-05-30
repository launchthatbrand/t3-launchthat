"use client";

import * as React from "react";

import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "../avatar";
import { Bell, Check, ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Tabs, TabsList, TabsTrigger } from "../tabs";
import { format, formatDistanceToNow } from "date-fns";

import { Badge } from "../badge";
import { Button } from "../button";
import { ScrollArea } from "../scroll-area";
import { cn } from "@acme/ui";
import { cva } from "class-variance-authority";
import { toast } from "../toast";

// Notification types
export interface Notification {
  id: string;
  title: string;
  description?: string;
  timestamp: Date;
  read: boolean;
  type: NotificationType;
  href?: string;
  actionLabel?: string;
  entityId?: string;
  entityType?: "user" | "group" | "product" | "download" | "contact" | "event";
  image?: string;
}

export type NotificationType =
  | "system"
  | "mention"
  | "message"
  | "like"
  | "comment"
  | "follow"
  | "invite"
  | "update"
  | "reminder";

// Context for notification management
type NotificationsContextType = {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
};

const NotificationsContext = React.createContext<
  NotificationsContextType | undefined
>(undefined);

// Provider component
export function NotificationsProvider({
  children,
  initialNotifications = [],
  maxNotifications = 100,
  showToasts = true,
}: {
  children: React.ReactNode;
  initialNotifications?: Notification[];
  maxNotifications?: number;
  showToasts?: boolean;
}) {
  const [notifications, setNotifications] =
    React.useState<Notification[]>(initialNotifications);

  // Calculate unread count
  const unreadCount = React.useMemo(() => {
    return notifications.filter((notification) => !notification.read).length;
  }, [notifications]);

  // Add a new notification
  const addNotification = React.useCallback(
    (newNotification: Omit<Notification, "id" | "timestamp" | "read">) => {
      const notification: Notification = {
        ...newNotification,
        id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => {
        // Ensure we don't exceed the max number of notifications
        const updatedNotifications = [notification, ...prev];
        if (updatedNotifications.length > maxNotifications) {
          return updatedNotifications.slice(0, maxNotifications);
        }
        return updatedNotifications;
      });

      // Optionally show a toast
      if (showToasts) {
        toast({
          title: notification.title,
          description: notification.description,
          duration: 5000,
        });
      }
    },
    [maxNotifications, showToasts],
  );

  // Mark a notification as read
  const markAsRead = React.useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = React.useCallback(() => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true })),
    );
  }, []);

  // Remove a notification
  const removeNotification = React.useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  }, []);

  // Clear all notifications
  const clearAllNotifications = React.useCallback(() => {
    setNotifications([]);
  }, []);

  const value = React.useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAllNotifications,
    }),
    [
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAllNotifications,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

// Hook to use notifications
export const useNotifications = () => {
  const context = React.useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }
  return context;
};

// Notification Badge component
export function NotificationBadge({
  className,
  showZero = false,
  variant = "default",
  size = "default",
}: {
  className?: string;
  showZero?: boolean;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
}) {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0 && !showZero) {
    return null;
  }

  const sizeClasses = {
    sm: "h-4 min-w-4 text-[10px]",
    default: "h-5 min-w-5 text-xs",
    lg: "h-6 min-w-6 text-sm",
  };

  return (
    <Badge
      variant={variant === "outline" ? "outline" : "default"}
      className={cn(
        "flex items-center justify-center rounded-full px-1",
        sizeClasses[size],
        className,
      )}
    >
      {unreadCount}
    </Badge>
  );
}

// Icon to show based on notification type
function NotificationIcon({
  type,
  className,
}: {
  type: NotificationType;
  className?: string;
}) {
  const iconMap: Record<NotificationType, React.ReactNode> = {
    system: <Bell className={cn("h-4 w-4", className)} />,
    mention: <span className={cn("text-sm font-semibold", className)}>@</span>,
    message: <span className={cn("text-sm", className)}>💬</span>,
    like: <span className={cn("text-sm", className)}>❤️</span>,
    comment: <span className={cn("text-sm", className)}>💬</span>,
    follow: <span className={cn("text-sm", className)}>👤</span>,
    invite: <span className={cn("text-sm", className)}>📩</span>,
    update: <span className={cn("text-sm", className)}>🔄</span>,
    reminder: <span className={cn("text-sm", className)}>⏰</span>,
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      {iconMap[type]}
    </div>
  );
}

// Notification item component
const notificationItemVariants = cva(
  "relative flex gap-3 rounded-md p-3 transition-colors",
  {
    variants: {
      read: {
        true: "bg-background hover:bg-muted/50",
        false: "bg-muted/20 hover:bg-muted/50",
      },
    },
    defaultVariants: {
      read: false,
    },
  },
);

function NotificationItem({
  notification,
  onMarkAsRead,
  onRemove,
  onClick,
}: {
  notification: Notification;
  onMarkAsRead: () => void;
  onRemove: () => void;
  onClick?: () => void;
}) {
  const handleClick = () => {
    onMarkAsRead();
    if (onClick) onClick();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={{ duration: 0.2 }}
      className={notificationItemVariants({ read: notification.read })}
      onClick={handleClick}
    >
      {!notification.read && (
        <div className="absolute left-0 top-0 h-full w-1 rounded-l-md bg-primary" />
      )}

      {notification.image ? (
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={notification.image} alt="" />
          <AvatarFallback>
            <NotificationIcon type={notification.type} />
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
          <NotificationIcon type={notification.type} />
        </div>
      )}

      <div className="flex-1">
        <div className="mb-1 text-sm font-medium">{notification.title}</div>
        {notification.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {notification.description}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
        </p>
      </div>

      <div className="flex items-start gap-1">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead();
            }}
          >
            <Check className="h-3 w-3" />
            <span className="sr-only">Mark as read</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Remove</span>
        </Button>
      </div>
    </motion.div>
  );
}

// Notification center component
export function NotificationCenter({
  triggerClassName,
  contentClassName,
  iconClassName,
  badgeClassName,
  showZero = false,
}: {
  triggerClassName?: string;
  contentClassName?: string;
  iconClassName?: string;
  badgeClassName?: string;
  showZero?: boolean;
}) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  } = useNotifications();
  const [filter, setFilter] = React.useState<"all" | "unread">("all");

  const filteredNotifications = React.useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((notification) => !notification.read);
    }
    return notifications;
  }, [notifications, filter]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", triggerClassName)}
        >
          <Bell className={cn("h-5 w-5", iconClassName)} />
          {(unreadCount > 0 || showZero) && (
            <NotificationBadge
              className={cn("absolute -right-1 -top-1", badgeClassName)}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-96 p-0", contentClassName)}
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b p-3">
          <div className="text-sm font-semibold">Notifications</div>
          <div className="flex items-center gap-2">
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as "all" | "unread")}
              className="mr-2"
            >
              <TabsList className="h-7">
                <TabsTrigger value="all" className="h-6 px-2 text-xs">
                  All
                </TabsTrigger>
                <TabsTrigger value="unread" className="h-6 px-2 text-xs">
                  Unread
                  {unreadCount > 0 && (
                    <Badge
                      className="ml-1 h-4 px-1 text-[10px]"
                      variant="secondary"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={markAllAsRead}
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>
        <AnimatePresence>
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Bell className="mb-2 h-10 w-10 text-muted-foreground/50" />
              <h3 className="text-sm font-medium">No Notifications</h3>
              <p className="text-xs text-muted-foreground">
                {filter === "all"
                  ? "You don't have any notifications yet."
                  : "You don't have any unread notifications."}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[420px]">
              <motion.div layout className="space-y-1 p-1">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={() => markAsRead(notification.id)}
                    onRemove={() => removeNotification(notification.id)}
                  />
                ))}
              </motion.div>
              {filteredNotifications.length > 0 && (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={clearAllNotifications}
                  >
                    Clear all notifications
                  </Button>
                </div>
              )}
            </ScrollArea>
          )}
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
}

// Toast Notification (for displaying a notification in a toast)
export function showNotificationToast(
  notification: Omit<Notification, "id" | "timestamp" | "read">,
) {
  toast({
    title: notification.title,
    description: notification.description,
    duration: 5000,
  });
}

// Inline Notification component (for displaying a single notification inline)
export function InlineNotification({
  notification,
  onAction,
  onDismiss,
  className,
}: {
  notification: Notification;
  onAction?: () => void;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex items-start gap-4 rounded-lg border bg-card p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
        <NotificationIcon type={notification.type} className="text-primary" />
      </div>
      <div className="flex-1">
        <div className="mb-1 font-medium">{notification.title}</div>
        {notification.description && (
          <p className="text-sm text-muted-foreground">
            {notification.description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
          </p>
          {notification.actionLabel && onAction && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={onAction}
            >
              {notification.actionLabel}
            </Button>
          )}
        </div>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onDismiss}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Dismiss</span>
        </Button>
      )}
    </div>
  );
}
