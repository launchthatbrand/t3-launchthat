import { ConvexError } from "convex/values";

import type { Doc, Id } from "../../_generated/dataModel";

/**
 * Calendar specific date utilities
 * These functions extend the shared date utilities with calendar-specific functionality
 */

/**
 * Validate event date range
 * @param startTime - Event start time in milliseconds
 * @param endTime - Event end time in milliseconds
 * @throws ConvexError if the date range is invalid
 */
export const validateEventDateRange = (
  startTime: number,
  endTime: number,
): void => {
  if (startTime >= endTime) {
    throw new ConvexError({
      message: "Event end time must be after start time",
      code: "INVALID_DATE_RANGE",
    });
  }
};

/**
 * Get recurring event instances in a date range
 * @param event - The event with recurrence rules
 * @param startDate - Start of the date range to search
 * @param endDate - End of the date range to search
 * @returns Array of event instances with calculated start/end times
 */
export const getRecurringEventInstances = (
  event: {
    _id: Id<"events">;
    title: string;
    startTime: number;
    endTime: number;
    recurrence?: {
      frequency: "daily" | "weekly" | "monthly" | "yearly";
      interval?: number;
      count?: number;
      until?: number;
      byDay?: string[];
      byMonthDay?: number[];
      byMonth?: number[];
    };
  },
  startDate: number,
  endDate: number,
) => {
  if (!event.recurrence) {
    return [event]; // Not a recurring event
  }

  const {
    frequency,
    interval = 1,
    count,
    until,
    byDay,
    byMonthDay,
    byMonth,
  } = event.recurrence;
  const eventDuration = event.endTime - event.startTime;
  const instances = [];

  // Calculate the cutoff date (earliest of until or count limit)
  const cutoffDate = until ?? Number.MAX_SAFE_INTEGER;

  // Convert dates to Date objects for easier manipulation
  const start = new Date(event.startTime);
  const rangeStart = new Date(startDate);
  const rangeEnd = new Date(endDate);

  // Helper functions
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const addWeeks = (date: Date, weeks: number) => {
    return addDays(date, weeks * 7);
  };

  const addMonths = (date: Date, months: number) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  };

  const addYears = (date: Date, years: number) => {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  };

  const matchesDay = (date: Date, byDay: string[] | undefined) => {
    if (!byDay || byDay.length === 0) return true;

    const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
    const dayName = days[date.getDay()];
    return byDay.includes(dayName);
  };

  const matchesMonthDay = (date: Date, byMonthDay: number[] | undefined) => {
    if (!byMonthDay || byMonthDay.length === 0) return true;
    return byMonthDay.includes(date.getDate());
  };

  const matchesMonth = (date: Date, byMonth: number[] | undefined) => {
    if (!byMonth || byMonth.length === 0) return true;
    return byMonth.includes(date.getMonth() + 1); // JavaScript months are 0-based
  };

  // Calculate recurrence
  let current = new Date(start);
  let instanceCount = 0;

  while (
    current.getTime() <= cutoffDate &&
    instanceCount < (count ?? Number.MAX_SAFE_INTEGER)
  ) {
    // If we're already past the range end, stop
    if (current.getTime() > rangeEnd.getTime()) {
      break;
    }

    // Check if this instance falls within the requested range
    const instanceEnd = new Date(current.getTime() + eventDuration);

    if (instanceEnd.getTime() >= rangeStart.getTime()) {
      // Check if this instance matches the byDay, byMonthDay, and byMonth rules
      if (
        matchesDay(current, byDay) &&
        matchesMonthDay(current, byMonthDay) &&
        matchesMonth(current, byMonth)
      ) {
        instances.push({
          ...event,
          startTime: current.getTime(),
          endTime: instanceEnd.getTime(),
          isRecurringInstance: true,
          originalEventId: event._id,
        });
      }
    }

    // Increment to the next potential instance based on frequency
    switch (frequency) {
      case "daily":
        current = addDays(current, interval);
        break;
      case "weekly":
        current = addWeeks(current, interval);
        break;
      case "monthly":
        current = addMonths(current, interval);
        break;
      case "yearly":
        current = addYears(current, interval);
        break;
    }

    instanceCount++;
  }

  return instances;
};

/**
 * Get date range for a calendar view
 * @param viewDate - The date in the view
 * @param viewType - The type of view (day, week, month, year)
 * @returns Start and end timestamps for the view
 */
export const getCalendarViewDateRange = (
  viewDate: Date,
  viewType: "day" | "week" | "month" | "year",
): { start: number; end: number } => {
  const result = { start: 0, end: 0 };

  // Create new date objects to avoid modifying the input
  const startDate = new Date(viewDate);
  const endDate = new Date(viewDate);

  // Reset time to start of day
  startDate.setHours(0, 0, 0, 0);

  switch (viewType) {
    case "day":
      // For day view, start at beginning of day, end at end of day
      endDate.setHours(23, 59, 59, 999);
      break;

    case "week":
      // For week view, start at beginning of week (Sunday), end at end of week (Saturday)
      const dayOfWeek = startDate.getDay(); // 0 = Sunday, 6 = Saturday
      startDate.setDate(startDate.getDate() - dayOfWeek); // Move to beginning of week (Sunday)
      endDate.setDate(startDate.getDate() + 6); // Move to end of week (Saturday)
      endDate.setHours(23, 59, 59, 999);
      break;

    case "month":
      // For month view, start at beginning of month, end at end of month
      startDate.setDate(1); // First day of month
      endDate.setMonth(endDate.getMonth() + 1); // Move to next month
      endDate.setDate(0); // Last day of current month
      endDate.setHours(23, 59, 59, 999);
      break;

    case "year":
      // For year view, start at beginning of year, end at end of year
      startDate.setMonth(0, 1); // January 1
      endDate.setMonth(11, 31); // December 31
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  // Convert to timestamps
  result.start = startDate.getTime();
  result.end = endDate.getTime();

  return result;
};

/**
 * Format a date range for display
 * @param startTime - Start time in milliseconds
 * @param endTime - End time in milliseconds
 * @param allDay - Whether the event is all day
 * @returns Formatted date range string
 */
export const formatDateRange = (
  startTime: number,
  endTime: number,
  allDay?: boolean,
): string => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (allDay) {
    // For all-day events, show just the dates
    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    } else {
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
  } else {
    // For timed events
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
    };

    if (start.toDateString() === end.toDateString()) {
      // Same day events
      return `${start.toLocaleDateString()} ${start.toLocaleTimeString(undefined, timeOptions)} - ${end.toLocaleTimeString(undefined, timeOptions)}`;
    } else {
      // Multi-day events
      return `${start.toLocaleDateString()} ${start.toLocaleTimeString(undefined, timeOptions)} - ${end.toLocaleDateString()} ${end.toLocaleTimeString(undefined, timeOptions)}`;
    }
  }
};

/**
 * Count events that occur within a time range, considering recurring events
 */
export const countEventsInTimeRange = (
  events: Doc<"events">[],
  startDate: number,
  endDate: number,
  includeRecurrences = true,
): number => {
  if (!events.length) return 0;

  // Count regular events first
  const regularEvents = events.filter(
    (event) => event.startTime <= endDate && event.endTime >= startDate,
  );

  if (!includeRecurrences) {
    return regularEvents.length;
  }

  // Count recurring event instances
  const allInstances = regularEvents.flatMap((event) => {
    if (!event.recurrence) {
      return [event]; // Just count the event itself
    }

    // Use getRecurringEventInstances to get all instances
    return getRecurringEventInstances(event, startDate, endDate);
  });

  return allInstances.length;
};
