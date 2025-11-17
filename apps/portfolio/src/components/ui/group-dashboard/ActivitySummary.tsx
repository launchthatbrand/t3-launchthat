import {
  Activity,
  Calendar,
  MessageSquare,
  Users as UsersIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

export interface ActivitySummaryProps {
  title?: string;
  description?: string;
  memberCount: number;
  postCount: number;
  eventCount: number;
  activeMembers: number;
  isLoading?: boolean;
}

export function ActivitySummary({
  title = "Activity Summary",
  description = "Group engagement metrics",
  memberCount,
  postCount,
  eventCount,
  activeMembers,
  isLoading = false,
}: ActivitySummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center justify-center rounded-lg border p-3">
            <UsersIcon className="mb-2 h-5 w-5 text-muted-foreground" />
            <div className="text-2xl font-bold">
              {isLoading ? "-" : memberCount}
            </div>
            <div className="text-xs text-muted-foreground">Members</div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg border p-3">
            <MessageSquare className="mb-2 h-5 w-5 text-muted-foreground" />
            <div className="text-2xl font-bold">
              {isLoading ? "-" : postCount}
            </div>
            <div className="text-xs text-muted-foreground">Posts</div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg border p-3">
            <Calendar className="mb-2 h-5 w-5 text-muted-foreground" />
            <div className="text-2xl font-bold">
              {isLoading ? "-" : eventCount}
            </div>
            <div className="text-xs text-muted-foreground">Events</div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg border p-3">
            <Activity className="mb-2 h-5 w-5 text-muted-foreground" />
            <div className="text-2xl font-bold">
              {isLoading ? "-" : activeMembers}
            </div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
