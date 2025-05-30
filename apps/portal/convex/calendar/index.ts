// Re-export all calendar functions in an organized way

// Core calendar functionality
export * as queries from "./queries";
export * as crud from "./crud";
export * as permissions from "./permissions";

// Event-related functionality
export * as events from "./events";
export * as attendees from "./attendees";
export * as invitations from "./invitations";
export * as reminders from "./reminders";
export * as attendance from "./attendance";

// Utilities and helpers
export * as lib from "./lib";

// Schema exports - provides both the main schema and detailed schema components
export { default as schema } from "./schema";
export * as schemaModules from "./schema";

// Access to sub-schemas for more detailed schema operations
export * as schemaComponents from "./schema";

// This organization makes it clear how to access functions:
// - api.calendar.events.getEventCount() - for event count
// - api.calendar.attendance.getAttendanceStats() - for attendance statistics
// - api.calendar.lib.dateUtils - for date utilities
// - api.calendar.queries.getCalendars() - for main calendar queries
// - api.calendar.schemaComponents.calendarSchema - for accessing schema components
