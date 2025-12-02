"use client";

import type { Doc, Id } from "@convex-config/_generated/dataModel";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@portal/convexspec";
import { useMutation } from "convex/react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Calendar } from "@acme/ui";
import { Button } from "@acme/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Textarea } from "@acme/ui/textarea";

import { eventFormSchema, EventFormValues, EventType } from "./formSchema";
import { RecurrenceSelector } from "./RecurrenceSelector";

const formSchema = eventFormSchema;
type FormValues = EventFormValues;

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

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: Date;
  calendars: Doc<"posts">[];
  userId: string;
}

export function CreateEventDialog({
  open,
  onOpenChange,
  defaultDate,
  calendars,
  userId,
}: CreateEventDialogProps) {
  const router = useRouter();
  const createEvent = useMutation(api.plugins.calendar.events.crud.createEvent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialCalendarId =
    calendars.length > 0 && calendars[0] ? calendars[0]._id : "";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      startDate: defaultDate,
      endDate: defaultDate,
      startTime: "09:00",
      endTime: "10:00",
      allDay: false,
      type: "meeting",
      calendarId: initialCalendarId,
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
        byDay: ["MO"], // Default to Monday
      },
    },
  });

  useEffect(() => {
    const firstAvailableCalendarId =
      calendars.length > 0 && calendars[0] ? calendars[0]._id : undefined;
    const currentCalendarIdInForm = form.getValues("calendarId");

    if (firstAvailableCalendarId) {
      const isCurrentIdValidInNewList = calendars.some(
        (c) => c._id === currentCalendarIdInForm,
      );

      if (!currentCalendarIdInForm || !isCurrentIdValidInNewList) {
        form.setValue("calendarId", firstAvailableCalendarId, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    } else {
      if (currentCalendarIdInForm) {
        form.setValue("calendarId", "", {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  }, [calendars, form]);

  const onSubmit = async (values: FormValues) => {
    if (!userId) {
      toast.error("You must be logged in to create an event");
      return;
    }

    if (!values.calendarId || calendars.length === 0) {
      toast.error("Please select a valid calendar or create one first.");
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

      const result = await createEvent({
        title: values.title,
        description: values.description,
        startTime: startDateTime.getTime(),
        endTime: endDateTime.getTime(),
        allDay: values.allDay,
        type: values.type,
        visibility: values.visibility,
        calendarId: values.calendarId as Id<"posts">,
        location: values.location,
        recurrence,
      });

      toast.success("Event created successfully");
      onOpenChange(false);
      form.reset();
      router.push(`/calendar/events/${result}`);
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event. Ensure a calendar is selected.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>
            Add a new event to your selected calendar
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  form.reset();
                }}
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
                {isSubmitting ? "Creating..." : "Create Event"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
