"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@acme/ui/alert-dialog";
import { Calendar, Globe, MapPin, Tag, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Doc, Id } from "@/convex/_generated/dataModel";
import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
// Import local loading spinner component
import { LoadingSpinner } from "../../_components/LoadingSpinner";
import { Separator } from "@acme/ui/separator";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

export default function EventDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useUser();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extract the ID directly from params
  const eventId = params.id as string as Id<"events">;

  // Get event details
  const event = useQuery(api.calendar.queries.getEventById, {
    eventId,
  });

  // Get event attendees
  const attendees = useQuery(api.calendar.queries.getEventAttendees, {
    eventId,
  });

  // Get calendar details
  const calendarEvents = useQuery(
    api.calendar.queries.getCalendarForEvent,
    event ? { eventId: event._id } : "skip",
  );

  const calendarId = calendarEvents?.[0]?.calendarId;
  const calendar = useQuery(
    api.calendar.queries.getCalendarById,
    calendarId ? { calendarId } : "skip",
  );

  // Delete event mutation
  const deleteEvent = useMutation(api.calendar.events.crud.deleteEvent);

  const handleDeleteEvent = async () => {
    if (!event) return;

    setIsDeleting(true);

    try {
      await deleteEvent({ eventId: event._id });
      toast.success("Event deleted successfully");
      router.push("/admin/calendar");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Sign in to view event details</h2>
          <p className="mt-2 text-muted-foreground">
            You need to be signed in to view and manage events
          </p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex h-[50vh] items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return format(date, "PPP 'at' p");
  };

  const isOrganizer = event.createdBy === user.id;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            className="mb-4"
            onClick={() => router.push("/admin/calendar")}
          >
            &larr; Back to Calendar
          </Button>
          <h1 className="text-3xl font-bold">{event.title}</h1>
          {calendar && (
            <div className="mt-1 flex items-center">
              <div
                className="mr-2 h-3 w-3 rounded-full"
                style={{ backgroundColor: calendar.color ?? "#0ea5e9" }}
              />
              <p className="text-muted-foreground">{calendar.name} Calendar</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {isOrganizer && (
            <>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/admin/calendar/events/${event._id}/edit`)
                }
              >
                Edit Event
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete Event
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Date and Time</p>
                  <p className="text-muted-foreground">
                    {formatDateTime(event.startTime)}
                    {event.startTime !== event.endTime && (
                      <> to {formatDateTime(event.endTime)}</>
                    )}
                    {event.allDay && <> (All day)</>}
                  </p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-muted-foreground">
                      {event.location.type === "virtual" ? (
                        <>
                          Virtual: {event.location.url ?? "Online meeting"}
                          {event.location.meetingId && (
                            <div className="mt-1 text-sm">
                              Meeting ID: {event.location.meetingId}
                            </div>
                          )}
                        </>
                      ) : (
                        event.location.address
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Globe className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Visibility</p>
                  <p className="text-muted-foreground">
                    {event.visibility.charAt(0).toUpperCase() +
                      event.visibility.slice(1)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Event Type</p>
                  <p className="text-muted-foreground">
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </p>
                </div>
              </div>

              <Separator />

              {event.description && (
                <div className="space-y-2">
                  <h3 className="font-medium">Description</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {event.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Attendees
              </CardTitle>
              <CardDescription>
                {attendees
                  ? `${attendees.length} people attending`
                  : "Loading attendees..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!attendees ? (
                <div className="flex h-20 items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : attendees.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-muted-foreground">No attendees yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attendees.map((attendee: Doc<"eventAttendees">) => (
                    <div
                      key={attendee._id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          {attendee.externalName
                            ? attendee.externalName.charAt(0)
                            : "U"}
                        </div>
                        <div>
                          <p className="font-medium">
                            {attendee.externalName ?? "User"}
                            {attendee.userId === event.createdBy && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                (Organizer)
                              </span>
                            )}
                          </p>
                          {attendee.externalEmail && (
                            <p className="text-xs text-muted-foreground">
                              {attendee.externalEmail}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={
                          attendee.status === "accepted"
                            ? "default"
                            : attendee.status === "declined"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {attendee.status.charAt(0).toUpperCase() +
                          attendee.status.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent><div></div>
            <CardFooter>
              <Button className="w-full" variant="outline">
                Invite More People
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete this event and cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground"
            >
              {isDeleting ? <LoadingSpinner /> : "Delete Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
