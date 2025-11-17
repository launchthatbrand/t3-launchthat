"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  AtSign,
  Bell,
  CheckCircle,
  Heart,
  MessageSquare,
  Repeat,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardFooter } from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

import { api } from "../../../convex/_generated/api";
import { NotificationData } from "../../utils/types";

interface FeedNotificationCardProps {
  notification: NotificationData;
  onMarkAsRead?: (id: string) => void;
}

export function FeedNotificationCard({
  notification,
  onMarkAsRead,
}: FeedNotificationCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  // Get source user information
  const sourceUser = useQuery(
    api.core.users.queries.getUserById,
    notification.sourceUserId ? { userId: notification.sourceUserId } : "skip",
  );

  // Determine icon based on notification type
  const renderIcon = () => {
    switch (notification.type) {
      case "reaction":
        return <Heart className="h-5 w-5 text-red-500" />;
      case "comment":
      case "commentReply":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case "share":
        return <Repeat className="h-5 w-5 text-green-500" />;
      case "mention":
        return <AtSign className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Handle click on notification
  const handleClick = () => {
    // Mark as read
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification._id);
    }

    // Navigate to relevant page if actionUrl is available
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <Card
      className={`mb-2 cursor-pointer transition-colors ${
        notification.read ? "bg-background" : "bg-accent/5"
      } ${isHovered ? "bg-accent/10" : ""}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="flex items-start gap-3 p-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background">
          {sourceUser ? (
            <Avatar>
              <AvatarImage
                src={sourceUser.image}
                alt={sourceUser.name || "User"}
              />
              <AvatarFallback>
                {sourceUser.name?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              {renderIcon()}
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">{notification.title}</h4>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {notification.content}
          </p>
        </div>
      </CardContent>
      {!notification.read && onMarkAsRead && (
        <CardFooter className="justify-end p-2 pt-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification._id);
            }}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Mark as read</span>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// Skeleton loader for notifications
export function FeedNotificationCardSkeleton() {
  return (
    <Card className="mb-2 p-3">
      <div className="flex items-start gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </Card>
  );
}
