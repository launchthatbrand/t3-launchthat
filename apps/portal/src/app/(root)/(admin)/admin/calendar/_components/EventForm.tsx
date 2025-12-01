"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RecurrenceSelector } from "@/components/calendar/RecurrenceSelector";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Calendar } from "@acme/ui";
import { Button } from "@acme/ui/button";
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
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  startTime: z.string(),
  endTime: z.string(),
  allDay: z.boolean().default(false),
  type: z.enum([
    "meeting",
    "webinar",
    "workshop",
    "class",
    "conference",
    "social",
    "deadline",
    "reminder",
    "other",
  ]),
  calendarId: z.string().min(1, { message: "Calendar is required" }),
  visibility: z.enum(["public", "private", "restricted"]).default("private"),
  location: z
    .object({
      type: z.enum(["virtual", "physical", "hybrid"]),
      address: z.string().optional(),
      url: z.string().optional(),
    })
    .optional(),
  recurrence: z
    .object({
      enabled: z.boolean().default(false),
      frequency: z
        .enum(["daily", "weekly", "monthly", "yearly"])
        .default("weekly"),
      interval: z.number().min(1).default(1),
      endType: z.enum(["never", "after", "on"]).default("never"),
      count: z.number().min(1).default(10),
      until: z.date().optional(),
      byDay: z
        .array(z.enum(["MO", "TU", "WE", "TH", "FR", "SA", "SU"]))
        .optional(),
    })
    .optional(),
});

export type EventFormValues = z.infer<typeof formSchema>;

interface EventFormProps {
  initialData?: Partial<EventFormValues>;
  defaultDate?: Date;
  calendars: Doc<"calendars">[];
  userId: string;
  onSubmitSuccess?: (eventId: Id<"events">) => void;
  submitButtonText?: string;
  isEdit?: boolean;
  eventId?: Id<"events">;
}

export default function EventForm({
  initialData,
  defaultDate = new Date(),
  calendars,
  userId,
  onSubmitSuccess,
  submitButtonText = "Save Event",
  isEdit = false,
  eventId,
}: EventFormProps) {
  const router = useRouter();
  const createEvent = useMutation(api.plugins.calendar.crud.createEvent);
  const updateEvent = useMutation(api.plugins.calendar.crud.updateEvent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialCalendarId =
    initialData?.calendarId ||
    (calendars.length > 0 && calendars[0] ? calendars[0]._id : "");

  const form = useForm<EventFormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      startDate: initialData?.startDate || defaultDate,
      endDate: initialData?.endDate || defaultDate,
      startTime: initialData?.startTime || "09:00",
      endTime: initialData?.endTime || "10:00",
      allDay: initialData?.allDay || false,
      type: initialData?.type || "meeting",
      calendarId: initialCalendarId,
      visibility: initialData?.visibility || "private",
      location: initialData?.location || {
        type: "virtual",
        address: "",
        url: "",
      },
      recurrence: initialData?.recurrence || {
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

  const onSubmit = async (values: EventFormValues) => {
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

      const eventData = {
        title: values.title,
        description: values.description,
        startTime: startDateTime.getTime(),
        endTime: endDateTime.getTime(),
        allDay: values.allDay,
        type: values.type,
        visibility: values.visibility,
        calendarId: values.calendarId as Id<"calendars">,
        location: values.location,
        createdBy: userId,
        recurrence,
      };

      let result: Id<"events">;

      if (isEdit && eventId) {
        // Update existing event
        result = await updateEvent({
          eventId,
          ...eventData,
        });
        toast.success("Event updated successfully");
      } else {
        // Create new event
        result = await createEvent(eventData);
        toast.success("Event created successfully");
      }

      if (onSubmitSuccess) {
        onSubmitSuccess(result);
      } else {
        router.push(`/admin/calendar/events/${result}`);
      }
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error(
        isEdit
          ? "Failed to update event. Please try again."
          : "Failed to create event. Ensure a calendar is selected.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder="Event name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
          name="allDay"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>All-day event</FormLabel>
                <FormDescription>
                  Event will not have specific start and end times
                </FormDescription>
              </div>
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
                  placeholder="Event details"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="calendarId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Calendar</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={calendars.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a calendar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {calendars.map((calendar) => (
                      <SelectItem key={calendar._id} value={calendar._id}>
                        <div className="flex items-center">
                          <div
                            className="mr-2 h-3 w-3 rounded-full"
                            style={{
                              backgroundColor: calendar.color || "#0ea5e9",
                            }}
                          />
                          {calendar.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {calendars.length === 0 && (
                    <span className="text-yellow-600">
                      You need to create a calendar first
                    </span>
                  )}
                </FormDescription>
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="class">Class</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="visibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Visibility</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Controls who can see this event in the calendar
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location.type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location Type</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("location.address", "");
                  form.setValue("location.url", "");
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="virtual">Virtual</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {(form.watch("location.type") === "physical" ||
          form.watch("location.type") === "hybrid") && (
          <FormField
            control={form.control}
            name="location.address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(form.watch("location.type") === "virtual" ||
          form.watch("location.type") === "hybrid") && (
          <FormField
            control={form.control}
            name="location.url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Virtual Meeting URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <RecurrenceSelector form={form} />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitButtonText}
        </Button>
      </form>
    </Form>
  );
}
