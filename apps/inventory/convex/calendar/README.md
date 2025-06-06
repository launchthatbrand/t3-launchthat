# Calendar Module

This module provides calendar and event management functionality for the application. The code is organized in a hierarchical structure to improve maintainability and separation of concerns.

## Module Structure

### Core Files

- `index.ts` - Main entry point that re-exports all submodules
- `schema.ts` - Main schema definition for all calendar-related tables
- `queries.ts` - Core calendar queries (for calendars themselves)
- `crud.ts` - Create, update, delete operations for calendars
- `permissions.ts` - Access control functions for calendars

### Nested Modules

#### Events

The `events/` directory contains event-specific functionality:

- `events/index.ts` - Re-exports all event functionality
- `events/queries.ts` - Query operations for events (listing, filtering)
- `events/crud.ts` - Create, update, delete operations for events

#### Attendance

The `attendance/` directory handles event attendance tracking:

- `attendance/index.ts` - Re-exports attendance functionality
- `attendance/queries.ts` - Queries for attendance records
- `attendance/mutations.ts` - Mutations for updating attendance

#### Utilities

The `lib/` directory contains shared utilities:

- `lib/index.ts` - Re-exports all utilities
- `lib/dateUtils.ts` - Date manipulation functions specific to calendars
- `lib/authUtils.ts` - Authentication utilities for calendar permissions

#### Schema

The `schema/` directory contains schema components for more granular access:

- `schema/index.ts` - Re-exports all schema components
- `schema/calendarSchema.ts` - Detailed schema definitions

## Usage Examples

### Accessing Calendar Functionality

```typescript
import { api } from "../convex/_generated/api";
// Using utilities
import { formatDateRange } from "../convex/calendar/lib/dateUtils";

// Main calendar operations
const calendars = await convex.query(api.calendar.queries.getCalendars);

// Event operations
const events = await convex.query(
  api.calendar.events.queries.getCalendarEvents,
  {
    calendarId: "cal123",
    startDate: startOfMonth,
    endDate: endOfMonth,
  },
);

// Attendance tracking
const attendees = await convex.query(
  api.calendar.attendance.queries.getEventAttendance,
  {
    eventId: "evt123",
  },
);

const formattedDate = formatDateRange(
  event.startTime,
  event.endTime,
  event.allDay,
);
```

## Best Practices

1. Always check permissions before accessing calendar data
2. Use the appropriate index for efficient queries
3. Keep event, calendar, and attendance logic separated
4. Use the dateUtils for consistent date manipulation
5. Adhere to the schema definitions for all operations
