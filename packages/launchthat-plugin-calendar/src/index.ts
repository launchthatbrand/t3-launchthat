import { calendarPlugin } from "./plugin";

export { PLUGIN_ID, createCalendarPluginDefinition, calendarPlugin } from "./plugin";

export { CalendarSidebar } from "./components/CalendarSidebar";
export type { CalendarSidebarCalendar } from "./components/CalendarSidebar";

export { LoadingSpinner } from "./components/LoadingSpinner";
export { ColorPicker } from "./components/ColorPicker";
export { AttendeesList } from "./components/event/AttendeesList";
export { default as BigCalendar } from "./components/event/BigCalendar";
export { CreateEventDialog } from "./components/event/CreateEventDialog";
export { EditEventDialog } from "./components/event/EditEventDialog";
export { RecurrenceSelector } from "./components/event/RecurrenceSelector";
export { ReminderSettings } from "./components/event/ReminderSettings";
export { RSVPButtons } from "./components/event/RSVPButtons";
export { eventFormSchema } from "./components/event/formSchema";
export type {
  EventFormValues,
  RecurrenceFormValues,
  DayString,
} from "./components/event/formSchema";

export { CalendarMonthViewTab } from "./tabs/CalendarMonthViewTab";

export default calendarPlugin;


