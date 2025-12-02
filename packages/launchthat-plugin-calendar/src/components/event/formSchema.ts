"use client";

import { z } from "zod";

export const dayOfWeekEnum = z.enum(["MO", "TU", "WE", "TH", "FR", "SA", "SU"]);
export type DayString = z.infer<typeof dayOfWeekEnum>;
export const eventTypeEnum = z.enum([
  "meeting",
  "webinar",
  "workshop",
  "class",
  "conference",
  "social",
  "deadline",
  "reminder",
  "other",
]);
export type EventType = z.infer<typeof eventTypeEnum>;

const recurrenceSchema = z.object({
  enabled: z.boolean().default(false),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]).default("weekly"),
  interval: z.number().min(1).default(1),
  endType: z.enum(["never", "after", "on"]).default("never"),
  count: z.number().min(1).default(10),
  until: z.date().optional().nullable(),
  byDay: z.array(dayOfWeekEnum).optional(),
});

export const eventFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  startTime: z.string(),
  endTime: z.string(),
  allDay: z.boolean().default(false),
  type: eventTypeEnum.default("meeting"),
  calendarId: z.string().min(1, "Please select a calendar."),
  visibility: z.enum(["private", "public", "restricted"]).default("private"),
  location: z.object({
    type: z.enum(["virtual", "physical", "hybrid"]).default("virtual"),
    address: z.string().optional(),
    url: z.string().optional(),
  }),
  recurrence: recurrenceSchema,
});

export type EventFormValues = z.infer<typeof eventFormSchema>;
export type RecurrenceFormValues = z.infer<typeof recurrenceSchema>;
