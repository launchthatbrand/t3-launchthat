import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import { Post } from "./Announcements";

export interface DiscussionsProps {
  title?: string;
  description?: string;
  latestPosts: Post[];
  groupId: string;
  isLoading?: boolean;
  columnSpan?: "full" | "two-thirds";
}

export function Discussions({
  title = "Recent Discussions",
  description = "Latest conversations in the group",
  latestPosts = [],
  groupId,
  isLoading = false,
  columnSpan = "two-thirds",
}: DiscussionsProps) {
  const colSpanClass = columnSpan === "full" ? "" : "md:col-span-2";

  return (
    <Card className={colSpanClass}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Loading discussions...
            </p>
          </div>
        ) : latestPosts.length > 0 ? (
          <div className="space-y-4">
            {latestPosts.map((post) => (
              <div
                key={post._id}
                className="flex items-start space-x-4 rounded-lg border p-3"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={post.author?.profileImageUrl ?? undefined}
                    alt={post.author?.name ?? "Member"}
                  />
                  <AvatarFallback>
                    {post.author?.name?.charAt(0) ?? "M"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="font-medium">
                    {post.title ?? "Discussion post"}
                  </div>
                  <div className="line-clamp-2 text-sm text-muted-foreground">
                    {post.content}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{post.author?.name ?? "Group member"}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(post._creationTime)} ago</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground opacity-30" />
            <p className="mt-2 text-sm text-muted-foreground">
              No discussions have been started yet
            </p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href={`/groups/${groupId}/discussion`}>
                Start a Conversation
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm" asChild className="w-full">
          <Link href={`/groups/${groupId}/discussion`}>
            View All Discussions
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
