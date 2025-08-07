# Notifications Module

This module provides a comprehensive system for managing in-app notifications, email notifications, and notification preferences within the application.

## Structure

- `index.ts` - Main entry point that re-exports all functionality
- `queries.ts` - Query operations for notifications (listing, filtering)
- `mutations.ts` - Mutation operations for notifications (creating, updating)
- `preferences.ts` - Functions for managing notification preferences
- `schema/` - Contains schema definitions
  - `index.ts` - Re-exports schema components
  - `notificationsSchema.ts` - Defines the notifications and notificationPreferences tables
- `lib/` - Utility functions and helpers
  - `index.ts` - Re-exports library components
  - `formatters.ts` - Utility functions for formatting notifications
  - `preferences.ts` - Helper functions for notification preferences

## Usage

The notifications module can be accessed through the Convex API using the following patterns:

```typescript
// Queries
api.notifications.getNotifications(...)
api.notifications.getUnreadNotificationsCount(...)
api.notifications.getRecentNotifications(...)

// Mutations
api.notifications.createNotification(...)
api.notifications.markAsRead(...)
api.notifications.batchCreateNotifications(...)

// Preferences
api.notifications.preferences.getPreferences(...)
api.notifications.preferences.updatePreferences(...)

// Utilities
api.notifications.lib.formatters.formatNotificationForDisplay(...)
```

## Adding New Notification Types

To add a new notification type:

1. Add the literal to the type union in `schema/notificationsSchema.ts`
2. Update formatters in `lib/formatters.ts` to handle the new type
3. Update default preferences in `lib/preferences.ts`

## Testing Notifications

Notifications can be tested using the createNotification mutation:

```typescript
await convex.mutation("notifications:createNotification", {
  userId: "user_id",
  type: "systemAnnouncement",
  title: "Test Notification",
  content: "This is a test notification",
});
```
