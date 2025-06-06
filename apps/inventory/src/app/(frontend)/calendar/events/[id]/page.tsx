"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AttendeesList } from "@/components/calendar/AttendeesList";
import { EditEventDialog } from "@/components/calendar/EditEventDialog";
import { ReminderSettings } from "@/components/calendar/ReminderSettings";
// Import the new components
import { RSVPButtons } from "@/components/calendar/RSVPButtons";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { UserIdType, TimestampType } from "../../../convex/shared/validators";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Globe,
  Lock,
  MapPin,
  Pencil,
  Repeat,
  Trash,
  Users,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";

export default function EventDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = useUser();
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOption, setDeleteOption] = useState<"all" | "this" | "future">(
    "all",
  );

  // Unwrap params using React.use()
  const unwrappedParams = React.use(params);
  const eventId = unwrappedParams.id as Id<"events">;
  const userId = user?.id;

  // Get event details
  const event = useQuery(api.calendar.queries.getEventById, {
    eventId,
  });

  // Get calendar for this event
  const calendarEntries = useQuery(api.calendar.queries.getCalendarForEvent, {
    eventId,
  });

  // Get all calendars for editing
  const calendars = useQuery(
    api.calendar.queries.getCalendars,
    userId ? { userId } : "skip",
  );

  // Get the calendar details
  const calendarId = calendarEntries?.[0]?.calendarId;
  const calendar = useQuery(
    api.calendar.queries.getCalendarById,
    calendarId ? { calendarId } : "skip",
  );

  // Delete mutation
  const deleteEvent = useMutation(api.calendar.crud.deleteEvent);

  // Handle event deletion
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteEvent({
        eventId,
        deleteOption,
      });
      toast.success("Event deleted successfully");
      setIsDeleteDialogOpen(false);
      router.push("/calendar");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading state
  if (!event || !calendar) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Format dates and times
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const formattedStartDate = format(startDate, "PPPP");
  const formattedEndDate = format(endDate, "PPPP");
  const formattedStartTime = format(startDate, "h:mm a");
  const formattedEndTime = format(endDate, "h:mm a");

  // Determine if it's a multi-day event
  const isMultiDay =
    startDate.toDateString() !== endDate.toDateString() && !event.allDay;

  // Format time display
  const timeDisplay = event.allDay
    ? "All day"
    : isMultiDay
      ? `${formattedStartDate} ${formattedStartTime} - ${formattedEndDate} ${formattedEndTime}`
      : `${formattedStartTime} - ${formattedEndTime}`;

  // Format recurrence display
  let recurrenceDisplay = "";
  if (event.recurrence) {
    const { frequency, interval = 1 } = event.recurrence;
    const intervalText = interval > 1 ? `${interval} ` : "";
    switch (frequency) {
      case "daily":
        recurrenceDisplay = `Repeats every ${intervalText}day`;
        break;
      case "weekly":
        recurrenceDisplay = `Repeats every ${intervalText}week`;
        break;
      case "monthly":
        recurrenceDisplay = `Repeats every ${intervalText}month`;
        break;
      case "yearly":
        recurrenceDisplay = `Repeats every ${intervalText}year`;
        break;
    }

    if (event.recurrence.until) {
      recurrenceDisplay += ` until ${format(
        new Date(event.recurrence.until),
        "PPP",
      )}`;
    } else if (event.recurrence.count) {
      recurrenceDisplay += ` for ${event.recurrence.count} occurrences`;
    }
  }

  // Location icon based on type
  const LocationIcon =
    event.location?.type === "virtual"
      ? Video
      : event.location?.type === "hybrid"
        ? Users
        : MapPin;

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.push("/calendar")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Calendar
      </Button>

      <Card className="mx-auto max-w-4xl">
        <CardHeader
          style={{
            borderLeft: `4px solid ${event.color ?? "#4f46e5"}`,
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{event.title}</CardTitle>
              <CardDescription className="mt-2 flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                {formattedStartDate}
                {isMultiDay && ` - ${formattedEndDate}`}
              </CardDescription>
              <CardDescription className="mt-1 flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                {timeDisplay}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.description && (
            <div className="mt-4">
              <h3 className="text-sm font-medium">Description</h3>
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                {event.description}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center">
              <div className="mr-2 h-3 w-3 rounded-full bg-primary" />
              <span className="text-sm font-medium">{calendar.name}</span>
            </div>

            {event.location && (
              <div className="flex items-center text-sm">
                <LocationIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>
                  {event.location.address ??
                    event.location.url ??
                    "Location not specified"}
                </span>
              </div>
            )}

            {event.recurrence && (
              <div className="flex items-center text-sm">
                <Repeat className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{recurrenceDisplay}</span>
              </div>
            )}

            <div className="flex items-center text-sm">
              {event.visibility === "private" ? (
                <>
                  <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Private</span>
                </>
              ) : event.visibility === "public" ? (
                <>
                  <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Restricted</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <div className="text-xs text-muted-foreground">
            Event type:{" "}
            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
          </div>
        </CardFooter>
      </Card>

      {/* Event Actions Section */}
      <div className="mx-auto mt-4 max-w-4xl space-y-4">
        {/* RSVP Section */}
        <div className="my-4">
          <h3 className="mb-2 text-lg font-medium">Will you attend?</h3>
          <RSVPButtons
            eventId={eventId}
            userId={userId as Id<"users">}
            className="max-w-md"
          />
        </div>

        {/* Reminder Settings */}
        <div className="my-4">
          <h3 className="mb-2 text-lg font-medium">Event Notifications</h3>
          <ReminderSettings
            eventId={eventId}
            userId={userId as Id<"users">}
            className="max-w-md"
          />
        </div>

        {/* Attendees List */}
        <div className="my-4">
          <AttendeesList
            eventId={eventId}
            isOrganizer={event.createdBy === userId}
          />
        </div>
      </div>

      {/* Edit Dialog */}
      {isEditDialogOpen && calendars && (
        <EditEventDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          eventId={eventId}
          calendars={calendars.filter(
            (cal): cal is Doc<"calendars"> => cal !== null,
          )}
          userId={userId ?? ""}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {event.recurrence && (
            <div className="space-y-4">
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Repeat className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">
                      This is a recurring event
                    </h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>
                        Please specify which occurrences of this event you want
                        to delete.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="deleteOption"
                    value="this"
                    checked={deleteOption === "this"}
                    onChange={() => setDeleteOption("this")}
                    className="h-4 w-4 rounded-full border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>Delete only this occurrence</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="deleteOption"
                    value="future"
                    checked={deleteOption === "future"}
                    onChange={() => setDeleteOption("future")}
                    className="h-4 w-4 rounded-full border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>Delete this and all future occurrences</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="deleteOption"
                    value="all"
                    checked={deleteOption === "all"}
                    onChange={() => setDeleteOption("all")}
                    className="h-4 w-4 rounded-full border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>Delete all occurrences</span>
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
