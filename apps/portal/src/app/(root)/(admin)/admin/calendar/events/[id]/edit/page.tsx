"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import EventForm, { EventFormValues } from "../../../_components/EventForm";
import { useParams, useRouter } from "next/navigation";

import { ArrowLeft } from "lucide-react";
import { Button } from "@acme/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { LoadingSpinner } from "../../../_components/LoadingSpinner";
import React from "react";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";

// Define valid day types
type DayOfWeek = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user } = useUser();

  // Extract id directly from params
  const eventId = params.id as Id<"events">;

  // Get user ID
  const userId = user?.id;

  // Get event details
  const event = useQuery(api.calendar.queries.getEventById, {
    eventId,
  });

  // Get all user calendars
  const calendars = useQuery(
    api.calendar.queries.getCalendars,
    userId ? { userId } : "skip",
  );

  // Get the calendar this event belongs to
  const calendarEvents = useQuery(
    api.calendar.queries.getCalendarForEvent,
    event ? { eventId: event._id } : "skip",
  );

  // Filter and prepare calendars
  const filteredCalendars =
    calendars?.filter((calendar) => calendar !== null) ?? [];

  if (!userId) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Sign in to edit event</h2>
          <p className="mt-2 text-muted-foreground">
            You need to be signed in to edit calendar events
          </p>
        </div>
      </div>
    );
  }

  const isLoading =
    event === undefined ||
    calendars === undefined ||
    calendarEvents === undefined;

  // Prepare form initial data from event if available
  const prepareInitialData = (): Partial<EventFormValues> => {
    if (!event || !calendarEvents || calendarEvents.length === 0) {
      return {};
    }

    const calendarId = calendarEvents[0]?.calendarId;

    // Format dates for the form
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);

    // Format times
    const startTime = format(startDate, "HH:mm");
    const endTime = format(endDate, "HH:mm");

    // Determine recurrence end type safely
    let endType: "never" | "after" | "on" = "never";
    if (event.recurrence) {
      if (event.recurrence.count) {
        endType = "after";
      } else if (event.recurrence.until) {
        endType = "on";
      }
    }

    // Validate byDay values to ensure they're all valid day codes
    const validateByDay = (days: string[] | undefined): DayOfWeek[] => {
      const validDays: DayOfWeek[] = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

      if (!days) return ["MO"];

      return days.filter((day): day is DayOfWeek =>
        validDays.includes(day as DayOfWeek),
      );
    };

    // Parse recurrence if it exists
    const recurrence = event.recurrence
      ? {
          enabled: true,
          frequency: event.recurrence.frequency,
          interval: event.recurrence.interval ?? 1,
          endType,
          count: event.recurrence.count ?? 10,
          until: event.recurrence.until
            ? new Date(event.recurrence.until)
            : undefined,
          byDay: validateByDay(event.recurrence.byDay),
        }
      : undefined;

    return {
      title: event.title,
      description: event.description,
      startDate,
      endDate,
      startTime,
      endTime,
      allDay: event.allDay ?? false,
      type: event.type,
      calendarId,
      visibility: event.visibility,
      location: event.location,
      recurrence,
    };
  };

  const initialData = prepareInitialData();

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          onClick={() => router.push(`/admin/calendar/events/${eventId}`)}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Event
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Event</h1>
          <p className="text-muted-foreground">
            Update details for {event?.title ?? "this event"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[400px] items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : event === null ? (
        <Card>
          <CardHeader>
            <CardTitle>Event Not Found</CardTitle>
            <CardDescription>
              The event you're trying to edit could not be found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              The event may have been deleted or you don't have permission to
              access it.
            </p>
            <Button onClick={() => router.push("/admin/calendar")}>
              Back to Calendar
            </Button>
          </CardContent>
        </Card>
      ) : filteredCalendars.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Calendars Available</CardTitle>
            <CardDescription>
              You need a calendar to edit this event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              You don't have any calendars. Create a calendar first to continue.
            </p>
            <Button onClick={() => router.push("/admin/calendar/new")}>
              Create Calendar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Edit Event Details</CardTitle>
            <CardDescription>Update the details for this event</CardDescription>
          </CardHeader>
          <CardContent>
            <EventForm
              initialData={initialData}
              calendars={filteredCalendars}
              userId={userId}
              submitButtonText="Update Event"
              isEdit={true}
              eventId={eventId}
              onSubmitSuccess={(updatedEventId) => {
                router.push(`/admin/calendar/events/${updatedEventId}`);
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
