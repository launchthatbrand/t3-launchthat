import Link from "next/link";
import { Calendar } from "lucide-react";

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

export interface GroupEvent {
  _id: string;
  title: string;
  startTime: number;
}

export interface GroupMember {
  _id: string;
  name?: string;
  profileImageUrl: string | null;
  role: "admin" | "moderator" | "member";
}

export interface UpcomingEventsMembersProps {
  title?: string;
  description?: string;
  upcomingEvents: GroupEvent[];
  activeMembers: GroupMember[];
  groupId: string;
  isLoading?: boolean;
}

export function UpcomingEventsMembers({
  title = "Coming Up",
  description = "Events and active members",
  upcomingEvents = [],
  activeMembers = [],
  groupId,
  isLoading = false,
}: UpcomingEventsMembersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upcoming Events */}
        <div>
          <h4 className="mb-3 text-sm font-medium">Upcoming Events</h4>
          {isLoading ? (
            <div className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
              Loading events...
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event._id}
                  className="flex items-center space-x-3 rounded-md border p-2"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10 text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.startTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
              No upcoming events scheduled
            </div>
          )}
        </div>

        {/* Active Members */}
        <div>
          <h4 className="mb-3 text-sm font-medium">Active Members</h4>
          {isLoading ? (
            <div className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
              Loading members...
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeMembers.map((member) => (
                <Avatar
                  key={member._id}
                  className="h-8 w-8 border-2 border-background"
                >
                  <AvatarImage
                    src={member.profileImageUrl ?? undefined}
                    alt={member.name ?? "Member"}
                  />
                  <AvatarFallback>
                    {member.name?.charAt(0) ?? "M"}
                  </AvatarFallback>
                </Avatar>
              ))}
              {activeMembers.length === 0 && (
                <div className="w-full rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
                  No active members yet
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button variant="ghost" size="sm" asChild className="w-full">
          <Link href={`/groups/${groupId}/events`}>View All Events</Link>
        </Button>
        <Button variant="ghost" size="sm" asChild className="w-full">
          <Link href={`/groups/${groupId}/members`}>View All Members</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
