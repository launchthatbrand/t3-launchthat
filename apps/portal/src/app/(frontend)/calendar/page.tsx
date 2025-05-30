"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreateEventDialog } from "@/components/calendar/CreateEventDialog";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus } from "lucide-react";

import type { CalendarEvent, CalendarViewType } from "@acme/ui";
import { Calendar } from "@acme/ui";
import { EntityCalendar } from "@acme/ui/advanced/entity-calendar";
import { Button } from "@acme/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";

import { CalendarSidebar } from "~/app/(frontend)/calendar/_components/CalendarSidebar";

export default function CalendarPage() {
  const router = useRouter();
  const { user } = useUser();
  const [date, setDate] = useState<Date>(new Date());
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);
  const [view, setView] = useState<CalendarViewType>("week");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
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
  const calendarEvents = useQuery(
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
      setSelectedCalendarIds(calendars.map((calendar) => calendar._id));
    }
  }, [calendars, selectedCalendarIds.length]);

  // Transform events for the calendar component
  useEffect(() => {
    if (calendarEvents) {
      const transformedEvents: CalendarEvent[] = calendarEvents.map((event) => {
        return {
          id: event._id,
          title: event.title,
          description: event.description,
          startDate: new Date(event.startTime),
          endDate: new Date(event.endTime),
          allDay: event.allDay,
          color: event.color,
        };
      });
      setEvents(transformedEvents);
    }
  }, [calendarEvents]);

  // Handle date navigation
  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
  };

  // Handle view change
  const handleViewChange = (newView: CalendarViewType) => {
    setView(newView);
  };

  // Handle date selection for event creation
  const handleDateSelect = (startDate: Date) => {
    setDate(startDate);
    setIsCreateEventDialogOpen(true);
  };

  // Handle event click to navigate to event details
  const handleEventClick = (event: CalendarEvent) => {
    router.push(`/calendar/events/${event.id}`);
  };

  // Handle calendar selection change
  const handleCalendarSelectionChange = (selectedIds: Id<"calendars">[]) => {
    setSelectedCalendarIds(selectedIds);
  };

  return (
    <div className="flex h-[calc(100vh-65px)] flex-col">
      <div className="flex flex-1 overflow-hidden">
        <CalendarSidebar
          calendars={(calendars ?? []).filter(Boolean)}
          publicCalendars={(publicCalendars ?? []).filter(Boolean)}
          selectedCalendarIds={selectedCalendarIds}
          onSelectionChange={handleCalendarSelectionChange}
          isAdmin={false}
        />
        <div className="flex-1 overflow-auto p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold">Calendar</h1>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="ml-2">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && handleDateChange(newDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setIsCreateEventDialogOpen(true)}
                className="ml-auto"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Event
              </Button>
            </div>
          </div>

          <EntityCalendar
            events={events}
            onDateSelect={handleDateSelect}
            onEventClick={handleEventClick}
            onViewChange={handleViewChange}
            defaultView={view}
          />
        </div>
      </div>

      {isCreateEventDialogOpen && (
        <CreateEventDialog
          open={isCreateEventDialogOpen}
          onOpenChange={setIsCreateEventDialogOpen}
          defaultDate={date}
          calendars={(calendars ?? []).filter(Boolean)}
          userId={user?.id ?? ""}
        />
      )}
    </div>
  );
}

// Helper function to calculate date range based on view
function getDateRangeFromView(
  view: CalendarViewType,
  date: Date,
): { startDate: Date; endDate: Date } {
  const startDate = new Date(date);
  const endDate = new Date(date);

  switch (view) {
    case "day":
      // Just the single day
      endDate.setHours(23, 59, 59, 999);
      break;
    case "week":
      // Start from Sunday of the week
      const day = date.getDay();
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
  }

  return { startDate, endDate };
}
