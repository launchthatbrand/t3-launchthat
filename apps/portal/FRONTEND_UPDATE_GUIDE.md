# Frontend Update Guide for Convex Function References

This document provides a guide for updating frontend code to match the new Convex backend structure. Use this as a reference while fixing TypeScript errors after the refactoring.

## Common Function Name Changes

Below is a mapping of old function names to new ones based on the standardized naming conventions in `apps/portal/convex/NAMING_CONVENTIONS.md`.

### Query Functions

| Old Function Name              | New Function Name                        |
| ------------------------------ | ---------------------------------------- |
| `getNotifications`             | `listNotifications`                      |
| `getUserNotifications`         | `listNotificationsByClerkId`             |
| `getNotificationsByType`       | `listNotificationsByType`                |
| `getRecentNotifications`       | `listRecentNotifications`                |
| `getUnreadCount`               | `countUnreadNotifications`               |
| `getUserPreferences`           | `getNotificationPreferences`             |
| `getEvents`                    | `calendar.queries.getCalendarEvents`     |
| `getEvent`                     | `calendar.queries.getEventById`          |
| `getCalendars`                 | `calendar.queries.listCalendars`         |
| `getPublicCalendars`           | `calendar.queries.getPublicCalendars`    |
| `getCalendarForEvent`          | `calendar.queries.getCalendarForEvent`   |
| `getEventById`                 | `calendar.queries.getEventById`          |
| `getEventAttendees`            | `calendar.invitations.getEventAttendees` |
| `getContact`                   | `contacts.queries.getContact`            |
| `getAllContacts`               | `contacts.queries.getContacts`           |
| `getTags`                      | `contacts.queries.getTags`               |
| `getContactCount`              | `contacts.queries.getContactCount`       |
| `exportContacts`               | `contacts.queries.exportContacts`        |
| `getDownloads`                 | `downloads.listDownloads`                |
| `getDownloadsByCategory`       | `downloads.listDownloadsByCategory`      |
| `getDownload`                  | `downloads.getDownload`                  |
| `getAllDownloads`              | `downloadsLibrary.listAllDownloads`      |
| `searchDownloads`              | `downloadsLibrary.searchAllDownloads`    |
| `getAllGroups`                 | `groups.listGroups`                      |
| `getGroupMembers`              | `groups.getGroupMembers`                 |
| `getGroupInvitationsByClerkId` | `groups.listGroupInvitationsByClerkId`   |
| `getGroupJoinRequests`         | `groups.listGroupJoinRequests`           |
| `getUser`                      | `users.getUserByClerkId`                 |
| `getUserById`                  | `users.getUserById`                      |
| `getAllUsers`                  | `users.listAllUsers`                     |
| `getAllProducts`               | `products.listProducts`                  |
| `getAllOrders`                 | `orders.listOrders`                      |
| `getOrderCount`                | `orders.getOrdersCount`                  |
| `getCustomers`                 | `orders.getRecentCustomers`              |
| `getAllCourses`                | `courses.listCourses`                    |
| `getPostComments`              | `groupPosts.listPostComments`            |

### Mutation Functions

| Old Function Name        | New Function Name                             |
| ------------------------ | --------------------------------------------- |
| `createContact`          | `contacts.crud.createContact`                 |
| `updateContact`          | `contacts.crud.updateContact`                 |
| `deleteContact`          | `contacts.crud.deleteContact`                 |
| `createEvent`            | `calendar.crud.createEvent`                   |
| `updateEvent`            | `calendar.crud.updateEvent`                   |
| `deleteEvent`            | `calendar.crud.deleteEvent`                   |
| `createCalendar`         | `calendar.crud.createCalendar`                |
| `createGroupPostComment` | `groupPosts.createComment`                    |
| `updateUserPreferences`  | `notifications.updateNotificationPreferences` |
| `resetUserPreferences`   | `notifications.resetNotificationPreferences`  |

## Module Structure Changes

Several modules have been restructured to follow a consistent pattern:

```
module-name/
  ├── index.ts                 # Main entry point exporting all public functions
  ├── queries.ts               # All query functions
  ├── mutations.ts             # All mutation functions
  ├── actions.ts               # All action functions (if any)
  ├── schema/
  │   ├── index.ts             # Re-exports from schema files
  │   └── types.ts             # TypeScript interfaces for module
  └── lib/
      ├── index.ts             # Re-exports from lib files
      └── helpers.ts           # Helper functions
```

When referencing functions from a module, follow these patterns:

1. Direct access: `api.moduleName.functionName`
2. Hierarchical access: `api.moduleName.queries.functionName` or `api.moduleName.crud.functionName`

## Common Type Changes

Some TypeScript interfaces may have changed. Here are common patterns:

1. Replace table references:

   - Change `Id<"groupPostsTable">` to `Id<"groupPosts">`
   - Change `Id<"groupCommentsTable">` to `Id<"groupComments">`

2. Use the shared validators for common types. Import them from:
   ```tsx
   import { TimestampType, UserIdType } from "../convex/shared/validators";
   ```

## Testing Changes

After updating references, test your changes by:

1. Running TypeScript checks: `pnpm --filter portal run typecheck`
2. Running the development server: `pnpm --filter portal run dev`
3. Testing the updated functionality in the browser

## Example: Updating a Component

Before:

```tsx
const comments = useQuery(api.groupPosts.getPostComments, { postId });
const createComment = useMutation(api.groupPosts.createGroupPostComment);
```

After:

```tsx
const comments = useQuery(api.groupPosts.listPostComments, { postId });
const createComment = useMutation(api.groupPosts.createComment);
```

## Automated Script

You can use the script at `scripts/update-frontend-convex-references.ts` to automatically update many common references:

```bash
pnpm --filter portal exec tsx ./scripts/update-frontend-convex-references.ts
```

The script will attempt to replace known function references, but manual updates may still be required for more complex cases.
