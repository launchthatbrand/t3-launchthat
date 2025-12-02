"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { enUS } from "date-fns/locale";
import { useTheme } from "next-themes";
import {
  Calendar,
  dateFnsLocalizer,
  DayLayoutAlgorithm,
  View,
  Views,
} from "react-big-calendar";

// Date-fns localizer setup
const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Event interface
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: unknown;
  color?: string;
}

// Props interface
export interface BigCalendarProps {
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
  onSelectSlot?: (slotInfo: {
    start: Date;
    end: Date;
    slots: Date[];
    action: "select" | "click" | "doubleClick";
  }) => void;
  defaultView?: View;
  defaultDate?: Date;
  onNavigate?: (newDate: Date) => void;
  onView?: (view: View) => void;
  className?: string;
}

const BigCalendar: React.FC<BigCalendarProps> = ({
  events,
  onSelectEvent,
  onSelectSlot,
  defaultView = Views.WEEK,
  defaultDate = new Date(),
  onNavigate,
  onView,
  className,
}) => {
  const { theme } = useTheme();

  // Track current view internally - ensure it's initialized with the correct type
  const [currentView, setCurrentView] = useState<View>(defaultView);

  // Handle view changes with appropriate typing
  const handleViewChange = useCallback(
    (newView: View) => {
      console.log("BigCalendar: handleViewChange called with:", newView);
      setCurrentView(newView);
      if (onView) {
        onView(newView);
      }
    },
    [onView],
  );

  // Update internal state if defaultView prop changes
  useEffect(() => {
    console.log("BigCalendar: defaultView changed to:", defaultView);
    setCurrentView(defaultView);
  }, [defaultView]);

  // Event style customization
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const backgroundColor = event.color ?? "#3182ce";
    const style = {
      backgroundColor,
      borderRadius: "4px",
      opacity: 0.8,
      color: "#fff",
      border: "0px",
      display: "block",
    };
    return {
      style,
    };
  }, []);

  console.log("BigCalendar rendering with view:", currentView);

  // Convert calendar props to what react-big-calendar expects
  const calendarProps = useMemo(
    () => ({
      localizer,
      events,
      view: currentView, // Control the view directly
      defaultDate,
      onSelectEvent,
      onSelectSlot,
      selectable: true,
      onNavigate,
      onView: handleViewChange, // Our custom handler
      eventPropGetter: eventStyleGetter,
      // Define views with explicit booleans
      views: {
        month: true,
        week: true,
        day: true,
        agenda: true,
      },
      popup: true,
      dayLayoutAlgorithm: "no-overlap" as DayLayoutAlgorithm,
      // Set height dynamically
      style: { height: "calc(100vh - 200px)" },
      className: `rounded-md ${theme === "dark" ? "react-big-calendar-dark" : ""} ${className ?? ""}`,
    }),
    [
      events,
      currentView,
      defaultDate,
      onSelectEvent,
      onSelectSlot,
      onNavigate,
      handleViewChange,
      eventStyleGetter,
      theme,
      className,
    ],
  );

  return (
    <div className="overflow-hidden rounded-md border">
      <Calendar {...calendarProps} />
    </div>
  );
};

export default BigCalendar;
