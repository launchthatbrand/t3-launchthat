"use client";

import type { Doc, Id } from "@convex-config/_generated/dataModel";
import React from "react";
import { useParams } from "next/navigation";

import type { CalendarEvent } from "@acme/ui/calendar/utils/data";
import Calendar from "@acme/ui/calendar/components/calendar";
import { EventsProvider } from "@acme/ui/calendar/context/events-context";

import { getTaskQueries } from "../api/tasks";
import { useTasksApi, useTasksQuery } from "../context/TasksClientProvider";

export default function CalendarPage() {
  const params = useParams<{ boardId?: string }>();
  const boardId = params?.boardId;
  const tasksApi = useTasksApi<any>();
  const taskQueries = getTaskQueries(tasksApi);
  const tasks = useTasksQuery<Doc<"tasks">[]>(
    taskQueries?.listTasksByBoard,
    boardId ? { boardId: boardId as Id<"taskBoards"> } : "skip",
  );

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
