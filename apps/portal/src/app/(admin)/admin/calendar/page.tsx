"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { CalendarPlus, Plus, Users } from "lucide-react";

import type { CalendarEvent, CalendarViewType } from "@acme/ui";
import { EntityCalendar } from "@acme/ui";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { CalendarSidebar } from "./_components/CalendarSidebar";
import { LoadingSpinner } from "./components/LoadingSpinner";

// Helper function to filter out null calendars
const filterCalendars = (
  calendars: (Doc<"calendars"> | null)[] | undefined,
): Doc<"calendars">[] => {
  if (!calendars) return [];
  return calendars.filter(
    (calendar): calendar is Doc<"calendars"> => calendar !== null,
  );
};

export default function CalendarPage() {
  const { user } = useUser();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<CalendarViewType>("month");
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<
    Id<"calendars">[]
  >([]);

  // Use the first day of the current month for our date range query
  const startDate = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1,
  );
  // Use the last day of the current month
  const endDate = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0,
  );

  // Get all user calendars
  const userId = user?.id;
  const calendars = useQuery(
    api.calendar.queries.getCalendars,
    userId ? { userId } : "skip",
  );

  // Get public calendars
  const publicCalendars = useQuery(api.calendar.queries.getPublicCalendars, {});

  // Get events for the selected calendars and date range
  const events = useQuery(
    api.calendar.queries.getAllEvents,
    userId
      ? {
          userId,
          startDate: startDate.getTime(),
          endDate: endDate.getTime(),
          calendarIds:
            selectedCalendarIds.length > 0 ? selectedCalendarIds : undefined,
        }
      : "skip",
  );

  // Convert Convex events to CalendarEvent format
  const calendarEvents: CalendarEvent[] = React.useMemo(() => {
    if (!events) return [];

    return events.map((event) => ({
      id: event._id,
      title: event.title,
      description: event.description,
      startDate: new Date(event.startTime),
      endDate: new Date(event.endTime),
      allDay: event.allDay ?? false,
      location: event.location?.address,
      color: event.color ?? "#0ea5e9",
      ownerName: "You",
    }));
  }, [events]);

  const handleAddEvent = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      // Navigate to create event page with the selected date
      router.push(`/admin/calendar/create?date=${date.toISOString()}`);
    },
    [router],
  );

  const handleEventClick = useCallback(
    (event: CalendarEvent) => {
      // Navigate to event details page
      router.push(`/admin/calendar/events/${event.id}`);
    },
    [router],
  );

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleViewChange = useCallback((newView: CalendarViewType) => {
    setView(newView);
  }, []);

  if (!userId) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Sign in to view your calendars</h2>
          <p className="mt-2 text-muted-foreground">
            You need to be signed in to view and manage your calendars
          </p>
        </div>
      </div>
    );
  }

  // Filter and prepare calendars
  const filteredCalendars = filterCalendars(calendars);
  const filteredPublicCalendars = filterCalendars(publicCalendars);
  const isLoading = calendars === undefined || events === undefined;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            Manage your events and schedules
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push("/admin/calendar/new")}
            variant="outline"
          >
            <CalendarPlus className="mr-2 h-4 w-4" /> New Calendar
          </Button>
          <Button onClick={() => router.push("/admin/calendar/create")}>
            <Plus className="mr-2 h-4 w-4" /> Create Event
          </Button>
        </div>
      </div>

      <Tabs defaultValue="personal" className="mb-8">
        <TabsList>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="public">Public</TabsTrigger>
          <TabsTrigger value="groups">
            <Users className="mr-2 h-4 w-4" /> Groups
          </TabsTrigger>
        </TabsList>
        <TabsContent value="personal" className="mt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Your Calendars</CardTitle>
                <CardDescription>
                  Select which calendars to display
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <CalendarSidebar
                    calendars={filteredCalendars}
                    selectedCalendarIds={selectedCalendarIds}
                    onCalendarSelect={setSelectedCalendarIds}
                  />
                )}
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="flex h-[400px] items-center justify-center">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <EntityCalendar
                    events={calendarEvents}
                    onAddEvent={handleAddEvent}
                    onEventClick={handleEventClick}
                    onDateSelect={handleDateSelect}
                    onViewChange={handleViewChange}
                    defaultView={view}
                    isLoading={isLoading}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="public" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Public Calendars</CardTitle>
              <CardDescription>
                View and subscribe to public calendars
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingSpinner />
              ) : filteredPublicCalendars.length > 0 ? (
                <div className="space-y-4">
                  {filteredPublicCalendars.map((calendar) => (
                    <div
                      key={calendar._id}
                      className="flex items-center justify-between rounded-md border p-4"
                    >
                      <div>
                        <h3 className="font-medium">{calendar.name}</h3>
                        {calendar.description && (
                          <p className="text-sm text-muted-foreground">
                            {calendar.description}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        Subscribe
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No public calendars found
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="groups" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Group Calendars</CardTitle>
              <CardDescription>
                Calendars shared with your groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  You are not a member of any groups with shared calendars
                </p>
                <Button className="mt-4" variant="outline" size="sm">
                  Browse Groups
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
