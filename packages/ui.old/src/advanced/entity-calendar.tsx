"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "../avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../card";
import { ChevronDown, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { DayContentProps, DayProps } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { addDays, format, isSameDay, isSameMonth, startOfWeek } from "date-fns";

import { Badge } from "../badge";
import { Button } from "../button";
import { Calendar } from "../calendar";
import { ScrollArea } from "../scroll-area";
import { cn } from "@acme/ui";

// Event types for calendar
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  allDay?: boolean;
  location?: string;
  color?: string;
  url?: string;
  ownerName?: string;
  ownerAvatar?: string;
  attendeeCount?: number;
}

export interface EntityCalendarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  events: CalendarEvent[];
  onAddEvent?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDateSelect?: (date: Date) => void;
  onViewChange?: (view: CalendarViewType) => void;
  defaultView?: CalendarViewType;
  className?: string;
  isLoading?: boolean;
}

export type CalendarViewType = "month" | "week" | "day" | "agenda";

// Extend DayProps with optional activeModifiers for convenience
type CalendarDayProps = DayProps & {
  activeModifiers?: DayContentProps["activeModifiers"];
};

export function EntityCalendar({
  events = [],
  onAddEvent,
  onEventClick,
  onDateSelect,
  onViewChange,
  defaultView = "month",
  className,
  isLoading = false,
  ...props
}: EntityCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [view, setView] = React.useState<CalendarViewType>(defaultView);

  // Handle view change
  const handleViewChange = (newView: CalendarViewType) => {
    setView(newView);
    if (onViewChange) {
      onViewChange(newView);
    }
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // Handle date navigation
  const handlePrevious = () => {
    if (view === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
      );
    } else if (view === "week") {
      setCurrentDate(addDays(currentDate, -7));
    } else if (view === "day") {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (view === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
      );
    } else if (view === "week") {
      setCurrentDate(addDays(currentDate, 7));
    } else if (view === "day") {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper to check if a day has events
  const getDayEvents = (day: Date) => {
    return events.filter((event) => isSameDay(day, new Date(event.startDate)));
  };

  // Render month view (default)
  const renderMonthView = () => {
    return (
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && handleDateSelect(date)}
        month={currentDate}
        className="rounded-md border"
        components={{
          Day: ({
            date,
            displayMonth,
            activeModifiers = {},
            ...dayProps
          }: CalendarDayProps) => {
            const dayEvents = getDayEvents(date);
            const isCurrentMonth = isSameMonth(date, displayMonth);
            return (
              <Button
                variant="ghost"
                className={cn(
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                  activeModifiers?.selected &&
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  !isCurrentMonth && "text-muted-foreground opacity-50",
                  activeModifiers?.today && "bg-accent",
                )}
                {...dayProps}
              >
                <time dateTime={format(date, "yyyy-MM-dd")}>
                  {format(date, "d")}
                </time>
                {dayEvents.length > 0 && (
                  <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 transform gap-0.5">
                    {dayEvents.length <= 3 ? (
                      dayEvents.map((_, i) => (
                        <div
                          key={i}
                          className="h-1 w-1 rounded-full bg-primary"
                        />
                      ))
                    ) : (
                      <>
                        <div className="h-1 w-1 rounded-full bg-primary" />
                        <div className="h-1 w-1 rounded-full bg-primary" />
                        <div className="h-1 w-1 rounded-full bg-primary" />
                      </>
                    )}
                  </div>
                )}
              </Button>
            );
          },
        }}
      />
    );
  };

  // Render agenda view (list of events)
  const renderAgendaView = () => {
    // Filter events to show only those in the current month if in month view
    const filteredEvents =
      view === "month"
        ? events.filter((event) =>
            isSameMonth(new Date(event.startDate), currentDate),
          )
        : events;

    // Sort events by date
    const sortedEvents = [...filteredEvents].sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

    return (
      <ScrollArea className="h-[400px]">
        {sortedEvents.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-center">
            <div className="text-muted-foreground">
              No events scheduled
              {onAddEvent && (
                <Button
                  variant="link"
                  className="h-auto p-0 pl-1"
                  onClick={() => onAddEvent(selectedDate)}
                >
                  Add an event
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-2">
            {sortedEvents.map((event) => (
              <Card
                key={event.id}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-muted/50",
                  event.color && `border-l-4 border-l-[${event.color}]`,
                )}
                onClick={() => onEventClick && onEventClick(event)}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{event.title}</CardTitle>
                    {event.ownerAvatar && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={event.ownerAvatar}
                          alt={event.ownerName || ""}
                        />
                        <AvatarFallback>
                          {event.ownerName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    {format(new Date(event.startDate), "EEE, MMM d • h:mm a")}
                    {event.location && ` • ${event.location}`}
                  </CardDescription>
                </CardHeader>
                {event.description && (
                  <CardContent className="p-4 pt-0 text-sm">
                    <p className="line-clamp-2">{event.description}</p>
                  </CardContent>
                )}
                {(event.attendeeCount || event.attendeeCount === 0) && (
                  <CardFooter className="p-4 pt-0">
                    <Badge variant="outline" className="text-xs">
                      {event.attendeeCount}{" "}
                      {event.attendeeCount === 1 ? "attendee" : "attendees"}
                    </Badge>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    );
  };

  return (
    <div className={cn("space-y-4", className)} {...props}>
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <h2 className="text-lg font-semibold">
            {view === "month" && format(currentDate, "MMMM yyyy")}
            {view === "week" &&
              `Week of ${format(startOfWeek(currentDate), "MMM d, yyyy")}`}
            {view === "day" && format(currentDate, "EEEE, MMMM d, yyyy")}
            {view === "agenda" && "Agenda"}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          {/* View switcher */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                {view.charAt(0).toUpperCase() + view.slice(1)} View{" "}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="end">
              <Button
                variant={view === "month" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleViewChange("month")}
              >
                Month
              </Button>
              <Button
                variant={view === "week" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleViewChange("week")}
              >
                Week
              </Button>
              <Button
                variant={view === "day" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleViewChange("day")}
              >
                Day
              </Button>
              <Button
                variant={view === "agenda" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleViewChange("agenda")}
              >
                Agenda
              </Button>
            </PopoverContent>
          </Popover>

          {/* Add event button */}
          {onAddEvent && (
            <Button size="sm" onClick={() => onAddEvent(selectedDate)}>
              <Plus className="mr-1 h-4 w-4" /> Add Event
            </Button>
          )}
        </div>
      </div>

      {/* Calendar body */}
      {isLoading ? (
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-muted-foreground">Loading events...</div>
        </div>
      ) : (
        <>
          {/* Show month view or agenda view based on current selection */}
          {view === "month" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_300px]">
              <div>{renderMonthView()}</div>
              <div>
                <h3 className="mb-2 font-medium">
                  {getDayEvents(selectedDate).length
                    ? `Events on ${format(selectedDate, "MMMM d, yyyy")}`
                    : "No events selected"}
                </h3>
                <div className="rounded-md border">
                  <ScrollArea className="h-[350px]">
                    {getDayEvents(selectedDate).length === 0 ? (
                      <div className="flex h-[100px] items-center justify-center p-4 text-center">
                        <div className="text-sm text-muted-foreground">
                          No events scheduled for this day
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 p-2">
                        {getDayEvents(selectedDate).map((event) => (
                          <Card
                            key={event.id}
                            className={cn(
                              "cursor-pointer transition-colors hover:bg-muted/50",
                              event.color &&
                                `border-l-4 border-l-[${event.color}]`,
                            )}
                            onClick={() => onEventClick && onEventClick(event)}
                          >
                            <CardHeader className="p-3 pb-1">
                              <CardTitle className="text-sm">
                                {event.title}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {format(new Date(event.startDate), "h:mm a")}
                                {event.location && ` • ${event.location}`}
                              </CardDescription>
                            </CardHeader>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}

          {/* Agenda view */}
          {view === "agenda" && renderAgendaView()}

          {/* Week view - placeholder for future implementation */}
          {view === "week" && (
            <div className="flex h-[400px] items-center justify-center rounded-md border p-6">
              <p className="text-muted-foreground">Week view coming soon...</p>
            </div>
          )}

          {/* Day view - placeholder for future implementation */}
          {view === "day" && (
            <div className="flex h-[400px] items-center justify-center rounded-md border p-6">
              <p className="text-muted-foreground">Day view coming soon...</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
