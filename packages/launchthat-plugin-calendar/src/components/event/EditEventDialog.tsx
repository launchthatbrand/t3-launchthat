"use client";

import type { Doc, Id } from "@convex-config/_generated/dataModel";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { AlertTriangle, CalendarIcon, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Button } from "@acme/ui/button";
import { Calendar } from "@acme/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@acme/ui/popover";
import { RadioGroup, RadioGroupItem } from "@acme/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Textarea } from "@acme/ui/textarea";

import type { EventFormValues } from "./formSchema";
import { DayString, eventFormSchema, EventType } from "./formSchema";
import { RecurrenceSelector } from "./RecurrenceSelector";

type FormValues = EventFormValues & { applyToSeries: boolean };

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "meeting", label: "Meeting" },
  { value: "webinar", label: "Webinar" },
  { value: "workshop", label: "Workshop" },
  { value: "class", label: "Class" },
  { value: "conference", label: "Conference" },
  { value: "social", label: "Social" },
  { value: "deadline", label: "Deadline" },
  { value: "reminder", label: "Reminder" },
  { value: "other", label: "Other" },
];

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: Id<"posts">;
  calendars: Doc<"posts">[];
  userId: string;
}

export function EditEventDialog({
  open,
  onOpenChange,
  eventId,
  calendars,
  userId,
}: EditEventDialogProps) {
  const router = useRouter();
  const updateEvent = useMutation(api.plugins.calendar.events.crud.updateEvent);
  const deleteEvent = useMutation(api.plugins.calendar.events.crud.deleteEvent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch the event details
  const event = useQuery(api.plugins.calendar.queries.getEventById, {
    eventId,
  });

  // Fetch the calendar for this event
  const eventCalendars = useQuery(
    api.plugins.calendar.queries.getCalendarForEvent,
    {
      eventId,
    },
  );

  const calendarId = eventCalendars?.[0]?.calendarId;

  // Setup form with default values from the event
  const form = useForm<FormValues>({
    resolver: zodResolver(eventFormSchema as any),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      startTime: "09:00",
      endTime: "10:00",
      allDay: false,
      type: "meeting",
      calendarId: "",
      visibility: "private",
      location: {
        type: "virtual",
        address: "",
        url: "",
      },
      recurrence: {
        enabled: false,
        frequency: "weekly",
        interval: 1,
        endType: "never",
        count: 10,
        byDay: ["MO"],
      },
      applyToSeries: true,
    },
  });

  // Update form when event data is loaded
  useEffect(() => {
    if (event && calendarId) {
      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);

      // Format times as HH:MM
      const startHours = startDate.getHours().toString().padStart(2, "0");
      const startMinutes = startDate.getMinutes().toString().padStart(2, "0");
      const startTime = `${startHours}:${startMinutes}`;

      const endHours = endDate.getHours().toString().padStart(2, "0");
      const endMinutes = endDate.getMinutes().toString().padStart(2, "0");
      const endTime = `${endHours}:${endMinutes}`;

      // Reset hours/minutes to avoid time shifts when selecting dates
      const cleanStartDate = new Date(startDate);
      cleanStartDate.setHours(0, 0, 0, 0);

      const cleanEndDate = new Date(endDate);
      cleanEndDate.setHours(0, 0, 0, 0);

      // Prepare recurrence data if available
      const recurrence = event.recurrence
        ? {
            enabled: true,
            frequency: event.recurrence.frequency,
            interval: event.recurrence.interval ?? 1,
            endType: event.recurrence.until
              ? ("on" as const)
              : event.recurrence.count
                ? ("after" as const)
                : ("never" as const),
            count: event.recurrence.count ?? 10,
            until: event.recurrence.until
              ? new Date(event.recurrence.until)
              : undefined,
            byDay: (event.recurrence.byDay ?? ["MO"]) as DayString[],
          }
        : {
            enabled: false,
            frequency: "weekly" as const,
            interval: 1,
            endType: "never" as const,
            count: 10,
            byDay: ["MO" as const],
          };

      form.reset({
        title: event.title,
        description: event.description ?? "",
        startDate: cleanStartDate,
        endDate: cleanEndDate,
        startTime,
        endTime,
        allDay: event.allDay ?? false,
        type: (event.type as EventType | undefined) ?? "meeting",
        calendarId,
        visibility: event.visibility,
        location:
          event.location ??
          ({
            type: "virtual",
          } as FormValues["location"]),
        recurrence,
        applyToSeries: true,
      });
    }
  }, [event, calendarId, form]);

  const onSubmit = async (values: FormValues) => {
    if (!userId) {
      toast.error("You must be logged in to update an event");
      return;
    }

    if (!values.calendarId || calendars.length === 0) {
      toast.error("Please select a valid calendar");
      return;
    }

    try {
      setIsSubmitting(true);

      const startDateTime = new Date(values.startDate);
      const [startHours, startMinutes] = values.startTime
        .split(":")
        .map(Number);
      startDateTime.setHours(startHours ?? 0, startMinutes ?? 0, 0, 0);

      const endDateTime = new Date(values.endDate);
      const [endHours, endMinutes] = values.endTime.split(":").map(Number);
      endDateTime.setHours(endHours ?? 0, endMinutes ?? 0, 0, 0);

      // Prepare recurrence data if enabled
      const recurrence = values.recurrence?.enabled
        ? {
            frequency: values.recurrence.frequency,
            interval: values.recurrence.interval,
            ...(values.recurrence.endType === "after" && {
              count: values.recurrence.count,
            }),
            ...(values.recurrence.endType === "on" &&
              values.recurrence.until && {
                until: values.recurrence.until.getTime(),
              }),
            ...(values.recurrence.frequency === "weekly" &&
              values.recurrence.byDay && {
                byDay: values.recurrence.byDay,
              }),
          }
        : undefined;

      await updateEvent({
        eventId,
        title: values.title,
        description: values.description,
        startTime: startDateTime.getTime(),
        endTime: endDateTime.getTime(),
        allDay: values.allDay,
        type: values.type,
        visibility: values.visibility,
        location: values.location,
        recurrence,
      });

      toast.success("Event updated successfully");
      onOpenChange(false);
      form.reset();
      router.push(`/calendar`);
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteEvent({
        eventId,
      });
      toast.success("Event deleted successfully");
      onOpenChange(false);
      router.push(`/calendar`);
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    } finally {
      setIsDeleting(false);
    }
  };

  const isRecurringEvent = event?.recurrence !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update event details and preferences
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Event title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Event description (optional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="pl-3 text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(field.value, "PPP")}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <div className="flex items-center">
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          disabled={form.watch("allDay")}
                        />
                      </FormControl>
                      <Clock className="text-muted-foreground ml-2 h-4 w-4" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="pl-3 text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(field.value, "PPP")}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <div className="flex items-center">
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          disabled={form.watch("allDay")}
                        />
                      </FormControl>
                      <Clock className="text-muted-foreground ml-2 h-4 w-4" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="calendarId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calendar</FormLabel>
                  {calendars.length > 0 ? (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a calendar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {calendars.map((calendar) => (
                          <SelectItem key={calendar._id} value={calendar._id}>
                            {calendar.title ??
                              calendar.slug ??
                              "Untitled calendar"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
                      No calendars available. Please create a calendar first.
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value as EventType)
                    }
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EVENT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="private">
                        Private (Only you)
                      </SelectItem>
                      <SelectItem value="public">Public (Everyone)</SelectItem>
                      <SelectItem value="restricted">
                        Restricted (Specific people)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Who can see this event</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recurrence Selector */}
            <RecurrenceSelector />

            {/* Recurring Event Options */}
            {isRecurringEvent && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>This is a recurring event</AlertTitle>
                  <AlertDescription>
                    Choose whether to apply changes to this occurrence only or
                    to all occurrences in the series.
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="applyToSeries"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Apply changes to:</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) =>
                            field.onChange(value === "series")
                          }
                          defaultValue={field.value ? "series" : "single"}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-y-0 space-x-3">
                            <FormControl>
                              <RadioGroupItem value="single" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              This occurrence only
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-y-0 space-x-3">
                            <FormControl>
                              <RadioGroupItem value="series" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              All occurrences in this series
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter className="flex justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
              >
                {isDeleting ? "Deleting..." : "Delete Event"}
              </Button>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    calendars.length === 0 ||
                    !form.formState.isValid
                  }
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
