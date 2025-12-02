"use client";

import type { Doc } from "@convex-config/_generated/dataModel";
import React from "react";

import type { CalendarEvent } from "@acme/ui/calendar/utils/data";
import Calendar from "@acme/ui/calendar/components/calendar";
import { EventsProvider } from "@acme/ui/calendar/context/events-context";

import { useTasks } from "../api/tasks";

export default function CalendarPage() {
  const tasks = useTasks();

  console.log("[CalendarPage] tasks", tasks);
  // Map tasks with dueDate to calendar events
  const calendarEvents: CalendarEvent[] = React.useMemo(
    () =>
      (tasks ?? [])
        .filter(
          (task): task is Doc<"tasks"> =>
            typeof task.dueDate === "number" && !!task.dueDate,
        )
        .map((task) => ({
          id: task._id,
          title: task.title,
          description: task.description ?? "",
          start: new Date(task.dueDate!),
          end: new Date(task.dueDate!), // single-day event
        })),
    [tasks],
  );

  return (
    <div className="container py-4">
      <h1 className="mb-6 text-2xl font-bold">Task Calendar</h1>
      <EventsProvider>
        <Calendar
          externalEvents={calendarEvents}
          onEventClick={() => undefined}
          defaultView="dayGridMonth"
          showAddEventButton={false}
        />
      </EventsProvider>
    </div>
  );
}
