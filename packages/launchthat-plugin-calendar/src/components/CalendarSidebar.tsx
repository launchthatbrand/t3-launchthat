"use client";

import type { GenericId as Id } from "convex/values";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Checkbox } from "@acme/ui/checkbox";
import { Label } from "@acme/ui/label";

export interface CalendarSidebarCalendar {
  _id: Id<"calendars">;
  name: string;
  color?: string | null;
}

export interface CalendarSidebarProps {
  calendars: CalendarSidebarCalendar[];
  publicCalendars?: CalendarSidebarCalendar[];
  selectedCalendarIds: Id<"calendars">[];
  onSelectionChange: (selectedIds: Id<"calendars">[]) => void;
  isAdmin?: boolean;
}

export function CalendarSidebar({
  calendars,
  publicCalendars = [],
  selectedCalendarIds,
  onSelectionChange,
}: CalendarSidebarProps) {
  const handleCalendarToggle = (calendarId: Id<"calendars">) => {
    if (selectedCalendarIds.includes(calendarId)) {
      onSelectionChange(selectedCalendarIds.filter((id) => id !== calendarId));
    } else {
      onSelectionChange([...selectedCalendarIds, calendarId]);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">My Calendars</CardTitle>
        </CardHeader>
        <CardContent>
          {calendars.length > 0 ? (
            <div className="space-y-2">
              {calendars.map((calendar) => (
                <div key={calendar._id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`calendar-${calendar._id}`}
                    checked={selectedCalendarIds.includes(calendar._id)}
                    onCheckedChange={() => handleCalendarToggle(calendar._id)}
                    style={{
                      borderColor: calendar.color ?? "#4f46e5",
                      backgroundColor: selectedCalendarIds.includes(
                        calendar._id,
                      )
                        ? (calendar.color ?? "#4f46e5")
                        : "transparent",
                    }}
                  />
                  <Label
                    htmlFor={`calendar-${calendar._id}`}
                    className="cursor-pointer text-sm font-normal"
                  >
                    {calendar.name}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No calendars found</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Public Calendars</CardTitle>
        </CardHeader>
        <CardContent>
          {publicCalendars.length > 0 ? (
            <div className="space-y-2">
              {publicCalendars.map((calendar) => (
                <div key={calendar._id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`calendar-${calendar._id}`}
                    checked={selectedCalendarIds.includes(calendar._id)}
                    onCheckedChange={() => handleCalendarToggle(calendar._id)}
                    style={{
                      borderColor: calendar.color ?? "#4f46e5",
                      backgroundColor: selectedCalendarIds.includes(
                        calendar._id,
                      )
                        ? (calendar.color ?? "#4f46e5")
                        : "transparent",
                    }}
                  />
                  <Label
                    htmlFor={`calendar-${calendar._id}`}
                    className="cursor-pointer text-sm font-normal"
                  >
                    {calendar.name}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No public calendars available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
