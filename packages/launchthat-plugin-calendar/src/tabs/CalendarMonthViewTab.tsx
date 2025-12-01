"use client";

// import "@fullcalendar/core/";
// import "@fullcalendar/daygrid/index.css";
import type { DatesSetArg, EventClickArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { PluginSingleViewComponentProps } from "launchthat-plugin-core";
import { useCallback, useMemo, useState } from "react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";
import { format, isSameMonth, startOfMonth } from "date-fns";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

import type { Id } from "../lib/convexId";

type CalendarEventRecord = {
  _id: Id<"posts">;
  title: string;
  startTime: number;
  endTime: number;
  description?: string;
  allDay?: boolean;
  color?: string;
};

const defaultEventColor = "hsl(var(--primary))";

const buildEventUrl = (eventId: string) =>
  `/admin/edit?post_type=events&post_id=${eventId}`;

const buildCreateEventUrl = ({
  calendarId,
  date,
}: {
  calendarId: string;
  date: string;
}) => `/calendar/new?calendarId=${calendarId}&date=${encodeURIComponent(date)}`;

export const CalendarMonthViewTab = ({
  postId,
}: PluginSingleViewComponentProps) => {
  const calendarId = postId ? (postId as Id<"posts">) : null;
  const [viewDate, setViewDate] = useState<Date>(() =>
    startOfMonth(new Date()),
  );

  const queryArgs = useMemo(() => {
    if (!calendarId) return "skip" as const;
    return {
      calendarIds: [calendarId],
      viewDate: viewDate.getTime(),
      viewType: "month" as const,
      includeRecurrences: true,
    };
  }, [calendarId, viewDate]);

  const events = useQuery(
    api.plugins.calendar.events.queries.getCalendarViewEvents,
    queryArgs,
  ) as CalendarEventRecord[] | undefined;

  const isLoading = events === undefined;
  const hasEvents = (events?.length ?? 0) > 0;

  const calendarEvents = useMemo(() => {
    if (!events) return [];
    return events.map((event) => ({
      id: event._id,
      title: event.title,
      start: new Date(event.startTime).toISOString(),
      end: new Date(event.endTime).toISOString(),
      allDay: event.allDay ?? false,
      backgroundColor: event.color ?? defaultEventColor,
      borderColor: event.color ?? defaultEventColor,
      extendedProps: {
        description: event.description,
      },
    }));
  }, [events]);

  const handleDatesSet = useCallback(
    (range: DatesSetArg) => {
      const monthStart = startOfMonth(range.start);
      if (!isSameMonth(monthStart, viewDate)) {
        setViewDate(monthStart);
      }
    },
    [viewDate],
  );

  const handleEventClick = useCallback((eventClick: EventClickArg) => {
    eventClick.jsEvent.preventDefault();
    const url = buildEventUrl(eventClick.event.id as string);
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const handleDateClick = useCallback(
    (arg: DateClickArg) => {
      if (!calendarId) return;
      const url = buildCreateEventUrl({
        calendarId,
        date: arg.dateStr,
      });
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [calendarId],
  );

  if (!calendarId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Save calendar first</CardTitle>
          <CardDescription>
            Monthly view is available after this calendar has been created.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Monthly schedule
          </h2>
          <p className="text-muted-foreground text-sm">
            Navigate between months to review scheduled events. Click on any day
            to add a new entry or select an event to edit it.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {format(viewDate, "MMMM yyyy")}
          </Badge>
          <Button
            variant="outline"
            onClick={() => {
              const url = buildCreateEventUrl({
                calendarId,
                date: format(viewDate, "yyyy-MM-dd"),
              });
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            New event
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <Skeleton className="h-[600px] w-full" />
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              height="auto"
              aspectRatio={1.6}
              events={calendarEvents}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "",
              }}
              fixedWeekCount
              showNonCurrentDates
              dayMaxEventRows={3}
              datesSet={handleDatesSet}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              eventDisplay="block"
            />
          )}
          {!isLoading && !hasEvents && (
            <div className="text-muted-foreground pt-6 text-center text-sm">
              No events found for this month. Use the calendar above to navigate
              and add events.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarMonthViewTab;
