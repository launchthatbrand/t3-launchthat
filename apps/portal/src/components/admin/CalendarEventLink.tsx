"use client";

import type { Doc, Id } from "@convex-config/_generated/dataModel";
import React, { useState } from "react";
import { api } from "@convex-config/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { Calendar, Link, Plus, Search, Unlink, X } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import { cn } from "~/lib/utils";

interface CalendarEventLinkProps {
  orderId: Id<"orders">;
  currentEventId?: Id<"events">;
  onEventLinked: (eventId: Id<"events">) => void;
  onEventUnlinked: () => void;
}

export function CalendarEventLink({
  orderId,
  currentEventId,
  onEventLinked,
  onEventUnlinked,
  className,
}: CalendarEventLinkProps) {
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Get current linked event details
  const currentEvent = useQuery(
    api.calendar.events.queries.getEvent,
    currentEventId ? { eventId: currentEventId } : "skip",
  );

  // Search for existing events
  const searchResults = useQuery(
    api.calendar.events.queries.searchEvents,
    searchTerm.length > 2
      ? {
          searchTerm,
          limit: 10,
        }
      : "skip",
  );

  // Get user's calendars for creating new events
  const userCalendars = useQuery(api.calendar.queries.getUserCalendars, {});

  // Mutations
  const linkOrderToEvent = useMutation(
    api.calendar.events.orders.linkCalendarEvent,
  );
  const unlinkOrderFromEvent = useMutation(
    api.calendar.events.orders.unlinkCalendarEvent,
  );
  const createEvent = useMutation(api.calendar.events.crud.createEvent);

  const handleLinkEvent = async (eventId: Id<"events">) => {
    try {
      await linkOrderToEvent({ orderId, eventId });
      onEventLinked(eventId);
      setIsSearchDialogOpen(false);
      setSearchTerm("");
    } catch (error) {
      console.error("Error linking event:", error);
      toast.error("Failed to link calendar event");
    }
  };

  const handleUnlinkEvent = async () => {
    try {
      await unlinkOrderFromEvent({ orderId });
      onEventUnlinked();
    } catch (error) {
      console.error("Error unlinking event:", error);
      toast.error("Failed to unlink calendar event");
    }
  };

  const handleCreateAndLinkEvent = async (eventData: {
    title: string;
    description?: string;
    calendarId: Id<"calendars">;
    startTime: number;
    endTime: number;
    allDay?: boolean;
  }) => {
    try {
      const eventId = await createEvent({
        title: eventData.title,
        description: eventData.description,
        calendarId: eventData.calendarId,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        allDay: eventData.allDay ?? false,
        type: "meeting",
        visibility: "private",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      await linkOrderToEvent({ orderId, eventId });
      onEventLinked(eventId);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating and linking event:", error);
      toast.error("Failed to create and link calendar event");
    }
  };

  return (
    <Card className={className}>
      <CardHeader className={cn("", className)}>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Calendar Event
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-3", className)}>
        {currentEventId && currentEvent ? (
          <div className="space-y-3">
            <div className="rounded-lg border p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {currentEvent.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(currentEvent.startTime), "MMM dd, yyyy")}
                    {currentEvent.startTime !== currentEvent.endTime && (
                      <>
                        {" "}
                        -{" "}
                        {format(new Date(currentEvent.endTime), "MMM dd, yyyy")}
                      </>
                    )}
                  </div>
                  {currentEvent.description && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {currentEvent.description}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUnlinkEvent}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSearchDialogOpen(true)}
              className="w-full"
            >
              <Link className="mr-2 h-3 w-3" />
              Change Event
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              No calendar event linked
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSearchDialogOpen(true)}
                className="flex-1"
              >
                <Search className="mr-2 h-3 w-3" />
                Link Event
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
                className="flex-1"
              >
                <Plus className="mr-2 h-3 w-3" />
                Create
              </Button>
            </div>
          </div>
        )}

        {/* Search Dialog */}
        <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Link Calendar Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">Search Events</Label>
                <Input
                  id="search"
                  placeholder="Search by event title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {searchResults && searchResults.length > 0 && (
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {searchResults.map((event) => (
                    <div
                      key={event._id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">{event.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(event.startTime), "MMM dd, yyyy")}
                          {event.startTime !== event.endTime && (
                            <>
                              {" "}
                              -{" "}
                              {format(new Date(event.endTime), "MMM dd, yyyy")}
                            </>
                          )}
                        </div>
                        {event.description && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {event.description}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleLinkEvent(event._id)}
                      >
                        Link
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {searchTerm.length > 2 &&
                (!searchResults || searchResults.length === 0) && (
                  <div className="py-8 text-center text-muted-foreground">
                    No events found matching "{searchTerm}"
                  </div>
                )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Event Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Calendar Event</DialogTitle>
            </DialogHeader>
            <CreateEventForm
              calendars={userCalendars ?? []}
              onSubmit={handleCreateAndLinkEvent}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Create Event Form Component
interface CreateEventFormProps {
  calendars: Doc<"calendars">[];
  onSubmit: (eventData: {
    title: string;
    description?: string;
    calendarId: Id<"calendars">;
    startTime: number;
    endTime: number;
    allDay?: boolean;
  }) => void;
  onCancel: () => void;
}

function CreateEventForm({
  calendars,
  onSubmit,
  onCancel,
}: CreateEventFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    calendarId: "" as Id<"calendars">,
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    allDay: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.calendarId || !formData.startDate) {
      toast.error("Please fill in required fields");
      return;
    }

    let startTime: number;
    let endTime: number;

    if (formData.allDay) {
      // For all-day events, set start to beginning of day and end to end of day
      startTime = new Date(formData.startDate + "T00:00:00").getTime();
      endTime = new Date(
        (formData.endDate || formData.startDate) + "T23:59:59",
      ).getTime();
    } else {
      if (!formData.startTime) {
        toast.error("Please set a start time");
        return;
      }
      startTime = new Date(
        formData.startDate + "T" + formData.startTime,
      ).getTime();
      endTime =
        formData.endDate && formData.endTime
          ? new Date(formData.endDate + "T" + formData.endTime).getTime()
          : startTime + 60 * 60 * 1000; // Default to 1 hour duration
    }

    onSubmit({
      title: formData.title,
      description: formData.description || undefined,
      calendarId: formData.calendarId,
      startTime,
      endTime,
      allDay: formData.allDay,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="event-title">Event Title *</Label>
        <Input
          id="event-title"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Event title"
          required
        />
      </div>

      <div>
        <Label htmlFor="event-calendar">Calendar *</Label>
        <Select
          value={formData.calendarId}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              calendarId: value as Id<"calendars">,
            }))
          }
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a calendar" />
          </SelectTrigger>
          <SelectContent>
            {calendars.map((calendar) => (
              <SelectItem key={calendar._id} value={calendar._id}>
                {calendar.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="event-description">Description</Label>
        <Textarea
          id="event-description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Optional description"
          className="min-h-[60px]"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="all-day"
          checked={formData.allDay}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, allDay: e.target.checked }))
          }
          className="rounded"
        />
        <Label htmlFor="all-day">All day event</Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start-date">Start Date *</Label>
          <Input
            id="start-date"
            type="date"
            value={formData.startDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, startDate: e.target.value }))
            }
            required
          />
        </div>
        {!formData.allDay && (
          <div>
            <Label htmlFor="start-time">Start Time *</Label>
            <Input
              id="start-time"
              type="time"
              value={formData.startTime}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, startTime: e.target.value }))
              }
              required={!formData.allDay}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="end-date">End Date</Label>
          <Input
            id="end-date"
            type="date"
            value={formData.endDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, endDate: e.target.value }))
            }
            min={formData.startDate}
          />
        </div>
        {!formData.allDay && (
          <div>
            <Label htmlFor="end-time">End Time</Label>
            <Input
              id="end-time"
              type="time"
              value={formData.endTime}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, endTime: e.target.value }))
              }
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create & Link Event</Button>
      </div>
    </form>
  );
}
