"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { CalendarDays, CalendarPlus, Plus, Settings, Tag } from "lucide-react";

import type { CalendarEvent } from "@acme/ui/calendar/utils/data";
import { Button } from "@acme/ui/button";
import { Calendar as DatePicker } from "@acme/ui/calendar";
// Import the FullCalendar component and type directly from their specific paths
import { default as FullCalendar } from "@acme/ui/calendar/components/calendar";
import { EventsProvider } from "@acme/ui/calendar/context/events-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import { toast } from "@acme/ui/toast";

import { CalendarSidebar } from "~/app/(frontend)/calendar/_components/CalendarSidebar";

// Define the View type to include all possible calendar views
type View = "day" | "week" | "month" | "agenda";

export default function CalendarPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();
  const { user } = useUser();
  const ensureUser = useMutation(api.users.createOrGetUser);

  // State
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<View>("week");
  console.log("Current view state:", view);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<
    Id<"calendars">[]
  >([]);

  // Calculate date range based on current view and date
  const { startDate, endDate } = getDateRangeFromView(view, date);

  // Get user calendars
  const calendars = useQuery(
    api.calendar.queries.getCalendars,
    user?.id
      ? {
          userId: user.id,
        }
      : "skip",
  );

  // Get public calendars
  const publicCalendars = useQuery(api.calendar.queries.getPublicCalendars, {});

  // Get events for the selected calendars
  const events = useQuery(
    api.calendar.queries.getAllEvents,
    user?.id && calendars && calendars.length > 0
      ? {
          userId: user.id,
          startDate: startDate.getTime(),
          endDate: endDate.getTime(),
          calendarIds:
            selectedCalendarIds.length > 0 ? selectedCalendarIds : undefined,
        }
      : "skip",
  );

  // Initialize selected calendars once calendars are loaded
  useEffect(() => {
    if (calendars && calendars.length > 0 && selectedCalendarIds.length === 0) {
      // Select all calendars by default
      setSelectedCalendarIds(
        calendars
          .filter(
            (calendar): calendar is NonNullable<typeof calendar> =>
              calendar !== null,
          )
          .map((calendar) => calendar._id),
      );
    }
  }, [calendars, selectedCalendarIds.length]);

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/admin/calendar");
    } else {
      // Use void to explicitly ignore the promise
      void ensureUser().catch((error) => {
        console.error("Failed to ensure user exists:", error);
        toast.error(
          "Error verifying user session. Please try logging in again.",
        );
      });
    }
  }, [authLoading, isAuthenticated, router, ensureUser]);

  // Transform events for the calendar component
  useEffect(() => {
    if (events) {
      const transformedEvents: CalendarEvent[] = events.map((event) => {
        return {
          id: event._id,
          title: event.title,
          start: new Date(event.startTime),
          end: new Date(event.endTime),
          description: event.description ?? "",
          backgroundColor: event.color ?? "#AEC6E4",
        };
      });
      setCalendarEvents(transformedEvents);
    }
  }, [events]);

  // Handle date navigation
  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
  };

  // Handle view change
  const handleViewChange = (newView: View) => {
    console.log("Admin calendar: View changed to:", newView);
    setView(newView);
  };

  // Handle event click to navigate to event details
  const handleEventClick = (event: CalendarEvent) => {
    router.push(`/admin/calendar/events/${event.id}`);
  };

  // Handle calendar selection change
  const handleCalendarSelectionChange = (selectedIds: Id<"calendars">[]) => {
    setSelectedCalendarIds(selectedIds);
  };

  // Handle slot selection (creating a new event)
  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    // Navigate to the event creation page with the selected date
    router.push(
      `/admin/calendar/event/create?start=${slotInfo.start.toISOString()}&end=${slotInfo.end.toISOString()}`,
    );
  };

  // Map the view type from react-big-calendar to FullCalendar
  const getFullCalendarView = () => {
    switch (view) {
      case "day":
        return "timeGridDay";
      case "week":
        return "timeGridWeek";
      case "month":
        return "dayGridMonth";
      case "agenda":
        return "listWeek";
      default:
        return "timeGridWeek";
    }
  };

  // Filter out null values from calendars
  const filteredCalendars = (calendars ?? []).filter(
    (calendar): calendar is NonNullable<typeof calendar> => calendar !== null,
  );
  const filteredPublicCalendars = (publicCalendars ?? []).filter(
    Boolean,
  ) as NonNullable<typeof publicCalendars>[number][];

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Calendar Admin</h1>
          <p className="text-muted-foreground">
            Manage calendars, events, and categories
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/calendar/create">
              <CalendarPlus className="mr-2 h-4 w-4" />
              New Calendar
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/calendar/event/create">
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/calendar/category">
              <Tag className="mr-2 h-4 w-4" />
              Categories
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/calendar/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[250px_1fr]">
        <div className="w-full">
          <CalendarSidebar
            calendars={filteredCalendars}
            publicCalendars={filteredPublicCalendars}
            selectedCalendarIds={selectedCalendarIds}
            onSelectionChange={handleCalendarSelectionChange}
            isAdmin={true}
          />
        </div>

        <div>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Calendar Events</CardTitle>
                <div className="flex items-center gap-2">
                  {/* Debug controls */}
                  <div className="mr-2 flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewChange("month")}
                    >
                      Month
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewChange("week")}
                    >
                      Week
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewChange("day")}
                    >
                      Day
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewChange("agenda")}
                    >
                      Agenda
                    </Button>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {format(date, "MMMM d, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <DatePicker
                        mode="single"
                        selected={date}
                        onSelect={(newDate) =>
                          newDate && handleDateChange(newDate)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <CardDescription>
                View and manage all calendar events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventsProvider>
                <FullCalendar
                  externalEvents={calendarEvents}
                  onEventClick={handleEventClick}
                  onSlotSelect={handleSelectSlot}
                  defaultView={getFullCalendarView()}
                  showAddEventButton={false}
                />
              </EventsProvider>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate date range based on view
function getDateRangeFromView(
  view: string,
  date: Date,
): { startDate: Date; endDate: Date } {
  const startDate = new Date(date);
  const endDate = new Date(date);

  // Variables need to be declared outside switch statements to avoid lexical declaration errors
  let day: number;
  let defaultDay: number;

  switch (view) {
    case "day":
      // Just the single day
      endDate.setHours(23, 59, 59, 999);
      break;
    case "week":
      // Start from Sunday of the week
      day = date.getDay();
      startDate.setDate(date.getDate() - day);
      // End on Saturday
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "month":
      // Start from the 1st of the month
      startDate.setDate(1);
      // End on the last day of the month
      endDate.setMonth(date.getMonth() + 1);
      endDate.setDate(0); // Last day of previous month
      endDate.setHours(23, 59, 59, 999);
      break;
    case "agenda":
      // For agenda view, show 30 days forward from current date
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(startDate.getDate() + 30);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      // Default to week view range
      defaultDay = date.getDay();
      startDate.setDate(date.getDate() - defaultDay);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
}
