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

import type { CalendarEvent, CalendarViewType } from "@acme/ui";
import { Calendar } from "@acme/ui";
import { EntityCalendar } from "@acme/ui/advanced/entity-calendar";
import { Button } from "@acme/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import { toast } from "@acme/ui/toast";

import { CalendarSidebar } from "~/app/(frontend)/calendar/_components/CalendarSidebar";

export default function CalendarDashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();
  const ensureUser = useMutation(api.users.createOrGetUser);

  // Early return if auth is loading or user is not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error("You must be logged in to access this page.");
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="container p-8">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Authenticating...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // This state should ideally be brief due to the useEffect redirect,
    // but it's a safeguard.
    return (
      <div className="container p-8">
        <p className="text-center text-muted-foreground">
          Redirecting to login...
        </p>
      </div>
    );
  }

  // At this point, isAuthenticated is true and authLoading is false.
  // We can now safely call hooks that depend on authentication.
  return <AuthenticatedDashboard ensureUser={ensureUser} router={router} />;
}

function AuthenticatedDashboard({
  ensureUser,
  router,
}: {
  ensureUser: ReturnType<typeof useMutation<typeof api.users.createOrGetUser>>;
  router: ReturnType<typeof useRouter>;
}) {
  const isAdminResult = useQuery(api.accessControl.checkIsAdmin);
  const { user } = useUser();

  useEffect(() => {
    void ensureUser().catch((error) => {
      console.error("Failed to ensure user exists:", error);
      toast.error("Error verifying user session. Please try logging in again.");
    });
  }, [ensureUser]);

  useEffect(() => {
    if (isAdminResult === false) {
      toast.error("You are not authorized to view this page.");
      router.push("/dashboard");
    }
  }, [isAdminResult, router]);

  if (isAdminResult === undefined) {
    return (
      <div className="container p-8">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Verifying admin status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAdminResult === false) {
    return (
      <div className="container p-8">
        <p className="text-center text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  // At this point, isAdminResult is true.
  return <CalendarContent userId={user?.id} />;
}

function CalendarContent({ userId }: { userId?: string }) {
  const router = useRouter();
  const [date, setDate] = useState<Date>(new Date());
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
    userId ? { userId } : "skip",
  );

  // Get public calendars
  const publicCalendars = useQuery(api.calendar.queries.getPublicCalendars, {});

  // Get events for the selected calendars
  const calendarEvents = useQuery(
    api.calendar.queries.getAllEvents,
    userId && calendars && calendars.length > 0
      ? {
          userId,
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
    router.push(`/admin/calendar/event/create`);
  };

  // Handle event click to navigate to event details
  const handleEventClick = (event: CalendarEvent) => {
    router.push(`/admin/calendar/events/${event.id}`);
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
          isAdmin={true}
        />
        <div className="flex-1 overflow-auto p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold">Calendar Management</h1>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="ml-2">
                    <CalendarDays className="mr-2 h-4 w-4" />
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/calendar/create">
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      Create Calendar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/calendar/category">
                      <Tag className="mr-2 h-4 w-4" />
                      Manage Categories
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={() => router.push("/admin/calendar/event/create")}
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

  // Pre-declare the day variable to avoid lexical declaration in case block
  let day: number;

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
  }

  return { startDate, endDate };
}
