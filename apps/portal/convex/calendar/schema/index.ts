import { defineSchema } from "convex/server";

import { calendarEventsTable } from "./calendarEvents";
import { calendarPermissionsTable } from "./calendarPermissions";
import { calendarsTable } from "./calendars";
import { eventAttendeesTable } from "./eventAttendees";
import { eventCategoriesTable } from "./eventCategories";
import { eventsTable } from "./events";

export default defineSchema({
  events: eventsTable,
  eventAttendees: eventAttendeesTable,
  calendars: calendarsTable,
  calendarEvents: calendarEventsTable,
  calendarPermissions: calendarPermissionsTable,
  eventCategories: eventCategoriesTable,
});
