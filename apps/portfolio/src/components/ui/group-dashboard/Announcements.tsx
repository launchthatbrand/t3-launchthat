import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, Bell } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

export interface Post {
  _id: string;
  _creationTime: number;
  title?: string;
  content: string;
  author?: {
    name?: string;
    profileImageUrl: string | null;
  } | null;
}

export interface AnnouncementsProps {
  title?: string;
  description?: string;
  latestPosts: Post[];
  groupId: string;
  isLoading?: boolean;
}

export function Announcements({
  title = "Announcements",
  description = "Important group updates",
  latestPosts = [],
  groupId,
  isLoading = false,
}: AnnouncementsProps) {
  return (
    <Card>
      <CardHeader className="bg-primary/5">
        <AlertCircle className="h-5 w-5 text-primary" />
        <CardTitle className="mt-2">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Loading announcements...
            </p>
          </div>
        ) : latestPosts.length > 0 ? (
          <div className="space-y-4">
            {latestPosts.slice(0, 1).map((post) => (
              <div key={post._id} className="space-y-2">
                <div className="font-medium">
                  {post.title ?? "Announcement"}
                </div>
                <div className="line-clamp-2 text-sm text-muted-foreground">
                  {post.content}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(post._creationTime)} ago
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="h-8 w-8 text-muted-foreground opacity-50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No announcements yet
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm" asChild className="w-full">
          <Link href={`/groups/${groupId}/discussion`}>
            View All Announcements
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
