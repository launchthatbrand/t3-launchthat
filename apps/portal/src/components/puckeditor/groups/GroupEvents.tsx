"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React, { useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, PlusCircle, Users } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Progress } from "@acme/ui/progress";

interface GroupEventsProps {
  title?: string;
  groupId?: Id<"groups">;
  maxEvents?: number;
  showAttendees?: boolean;
  showAddButton?: boolean;
}

export function GroupEvents({
  title = "Upcoming Events",
  groupId,
  maxEvents = 3,
  showAttendees = true,
  showAddButton = true,
}: GroupEventsProps) {
  // Query upcoming events
  const upcomingEvents =
    useQuery(
      api.groups.queries.getUpcomingGroupEvents,
      groupId
        ? {
            groupId,
            limit: maxEvents,
          }
        : "skip",
    ) ?? [];

  // If no group is selected, show placeholder
  if (!groupId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Please select a group in edit mode.
        </CardContent>
      </Card>
    );
  }

  // If no events are available yet, show appropriate message
  if (!upcomingEvents || upcomingEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium">No upcoming events</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Plan a new event to bring the group together
          </p>
        </CardContent>
        {showAddButton && (
          <CardFooter>
            <Button className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {upcomingEvents.map((event) => (
            <div key={event._id} className="space-y-2">
              <div className="text-lg font-medium">{event.title}</div>
              <div className="flex flex-wrap gap-y-2 text-sm text-muted-foreground">
                <div className="flex w-full items-center md:w-1/2">
                  <Calendar className="mr-2 h-4 w-4" />
                  {format(new Date(event.startTime), "EEE, MMM d, yyyy")}
                </div>
                <div className="flex w-full items-center md:w-1/2">
                  <Clock className="mr-2 h-4 w-4" />
                  {format(new Date(event.startTime), "h:mm a")}
                </div>
                {event.location && (
                  <div className="flex w-full items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    {event.location}
                  </div>
                )}
              </div>
              {showAttendees && (
                <div className="mt-2">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <Users className="mr-2 h-4 w-4" />
                      <span>
                        {event.attendeeCount ?? 0} of {event.capacity ?? "∞"}
                      </span>
                    </div>
                    <Badge
                      variant={
                        event.attendeeCount >= (event.capacity ?? Infinity)
                          ? "destructive"
                          : event.attendeeCount >=
                              (event.capacity ?? Infinity) * 0.75
                            ? "warning"
                            : "success"
                      }
                      className="text-xs"
                    >
                      {event.attendeeCount >= (event.capacity ?? Infinity)
                        ? "Full"
                        : event.attendeeCount >=
                            (event.capacity ?? Infinity) * 0.75
                          ? "Filling Up"
                          : "Open"}
                    </Badge>
                  </div>
                  {event.capacity && (
                    <Progress
                      value={(event.attendeeCount / event.capacity) * 100}
                      className="h-1"
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      {showAddButton && (
        <CardFooter>
          <Button className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
