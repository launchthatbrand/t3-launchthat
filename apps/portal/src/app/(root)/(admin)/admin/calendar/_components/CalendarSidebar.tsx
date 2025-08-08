"use client";

import React from "react";

import { cn } from "@acme/ui";
import { Checkbox } from "@acme/ui/checkbox";
import { TimestampType, UserIdType } from "@acme/validators";

import { Doc, Id } from "../../../convex/_generated/dataModel";

interface CalendarSidebarProps {
  calendars: Doc<"calendars">[];
  selectedCalendarIds: Id<"calendars">[];
  onCalendarSelect: (ids: Id<"calendars">[]) => void;
}

export function CalendarSidebar({
  calendars,
  selectedCalendarIds,
  onCalendarSelect,
}: CalendarSidebarProps) {
  const handleCalendarToggle = (calendarId: Id<"calendars">) => {
    if (selectedCalendarIds.includes(calendarId)) {
      // Remove the calendar if it's already selected
      onCalendarSelect(selectedCalendarIds.filter((id) => id !== calendarId));
    } else {
      // Add the calendar if it's not selected
      onCalendarSelect([...selectedCalendarIds, calendarId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCalendarIds.length === calendars.length) {
      // Deselect all if all are currently selected
      onCalendarSelect([]);
    } else {
      // Select all if not all are selected
      onCalendarSelect(calendars.map((cal) => cal._id));
    }
  };

  if (calendars.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground">No calendars found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new calendar to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Checkbox
          id="select-all"
          checked={
            selectedCalendarIds.length > 0 &&
            selectedCalendarIds.length === calendars.length
          }
          onCheckedChange={handleSelectAll}
        />
        <label
          htmlFor="select-all"
          className="ml-2 cursor-pointer text-sm font-medium"
        >
          Select All
        </label>
      </div>

      <div className="space-y-2">
        {calendars.map((calendar) => (
          <div key={calendar._id} className="flex items-center">
            <Checkbox
              id={`calendar-${calendar._id}`}
              checked={selectedCalendarIds.includes(calendar._id)}
              onCheckedChange={() => handleCalendarToggle(calendar._id)}
            />
            <div
              className={cn(
                "ml-2 h-3 w-3 rounded-full",
                calendar.color ? `bg-[${calendar.color}]` : "bg-blue-500", // Default color
              )}
            />
            <label
              htmlFor={`calendar-${calendar._id}`}
              className="ml-2 cursor-pointer text-sm font-medium"
            >
              {calendar.name}
              {calendar.isDefault && (
                <span className="ml-1 text-xs text-muted-foreground">
                  (Default)
                </span>
              )}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
