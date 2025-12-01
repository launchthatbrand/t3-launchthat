import {
  AlarmClock,
  GraduationCap,
  Inbox,
  UserCircle,
  Users,
} from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import type { FeedType } from "./FeedStream";

interface EmptyFeedStateProps {
  feedType: FeedType;
  onAction?: () => void;
}

export function EmptyFeedState({ feedType, onAction }: EmptyFeedStateProps) {
  // Define configurations for different feed types
  const configs = {
    universal: {
      icon: <Inbox className="h-12 w-12 text-muted-foreground" />,
      title: "No Posts Yet",
      description: "Be the first to create a post in the community!",
      actionText: "Create a Post",
    },
    personalized: {
      icon: <UserCircle className="h-12 w-12 text-muted-foreground" />,
      title: "Your Feed is Empty",
      description:
        "Follow users, join groups, or engage with content to populate your feed.",
      actionText: "Discover Content",
    },
    group: {
      icon: <Users className="h-12 w-12 text-muted-foreground" />,
      title: "No Group Posts Yet",
      description: "Be the first to start a conversation in this group!",
      actionText: "Start Discussion",
    },
    profile: {
      icon: <GraduationCap className="h-12 w-12 text-muted-foreground" />,
      title: "No Activity Yet",
      description: "This user hasn't posted any content yet.",
      actionText: "Return to Feed",
    },
  };

  const config = configs[feedType];

  return (
    <Card className="text-center">
      <CardHeader>
        <div className="mb-2 flex justify-center">{config.icon}</div>
        <CardTitle>{config.title}</CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-4">
          <AlarmClock className="mr-2 h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">
            Check back later for new content
          </span>
        </div>
      </CardContent>
      {onAction && (
        <CardFooter className="flex justify-center pb-6">
          <Button onClick={onAction}>{config.actionText}</Button>
        </CardFooter>
      )}
    </Card>
  );
}
