# TypeScript and Convex Validator Standards

This document outlines the standards for TypeScript types and Convex validators that should be followed throughout the Portal application to ensure consistent, type-safe code.

## Table of Contents

1. [Core Principles](#core-principles)
2. [Shared Validators](#shared-validators)
3. [TypeScript Type Definitions](#typescript-type-definitions)
4. [Function Signatures](#function-signatures)
5. [Validation Patterns](#validation-patterns)
6. [Return Types](#return-types)
7. [Type Safety Best Practices](#type-safety-best-practices)
8. [Examples](#examples)

## Core Principles

- **DRY (Don't Repeat Yourself)**: Use shared validators from `shared/validators.ts` instead of defining the same validators in multiple places.
- **Type Safety**: Leverage TypeScript's static typing to catch errors at compile time rather than runtime.
- **Explicit Types**: Be explicit about types, especially for function arguments and return values.
- **Consistent Patterns**: Follow established patterns for common operations across the codebase.
- **Validator-Derived Types**: Use Convex's `Infer` type utility to derive TypeScript types from validators.

## Shared Validators

The file `shared/validators.ts` contains common validators that should be used throughout the codebase:

```typescript
// Import these from shared/validators.ts
// Also import the corresponding TypeScript types
import {
  EventType,
  eventTypeValidator,
  Location,
  locationValidator,
  NotificationType,
  notificationTypeValidator,
  PaginationOpts,
  paginationOptsValidator,
  Recurrence,
  RecurrenceFrequency,
  recurrenceFrequencyValidator,
  recurrenceValidator,
  Status,
  statusValidator,
  Timestamp,
  timestampValidator,
  UserId,
  userIdValidator,
  Visibility,
  visibilityValidator,
  Weekday,
  weekdayValidator,
} from "../shared/validators";
```

## TypeScript Type Definitions

- Import TypeScript types from `_generated/dataModel` for database-related types:

```typescript
import { Doc, Id } from "../_generated/dataModel";

// Use strong typing for IDs
function getUser(userId: Id<"users">) {
  // ...
}

// Use Doc type for document references
function processEvent(event: Doc<"events">) {
  // ...
}
```

## Function Signatures

- All Convex functions must specify both argument validators and return type validators:

```typescript
export const exampleQuery = query({
  args: {
    userId: userIdValidator,
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("notifications"),
      title: v.string(),
      content: v.optional(v.string()),
      read: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    // Implementation...
  },
});
```

## Validation Patterns

### Optional Values

- Use `v.optional()` for fields that might be undefined:

```typescript
{
  name: v.string(),
  description: v.optional(v.string()),
}
```

### Union Types

- Use `v.union()` for fields that can have multiple specific values:

```typescript
type: v.union(
  v.literal("meeting"),
  v.literal("webinar"),
  v.literal("workshop"),
);
```

### Arrays

- Validate array items:

```typescript
tags: v.array(v.string());
```

### Records / Objects

- Validate object structures:

```typescript
metadata: v.object({
  createdBy: userIdValidator,
  createdAt: timestampValidator,
  tags: v.optional(v.array(v.string())),
});
```

### Nullable Values

- Use `v.union(v.null(), ...)` for nullable fields:

```typescript
parentId: v.union(v.null(), v.id("categories"));
```

## Return Types

- Always specify return types for functions:

```typescript
// Query with explicit return type
export const exampleQuery = query({
  args: {
    /* ... */
  },
  returns: v.array(
    v.object({
      /* ... */
    }),
  ),
  handler: async (ctx, args) => {
    // ...
  },
});

// For returning nothing, use v.null()
export const performAction = mutation({
  args: {
    /* ... */
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Do something...
    return null;
  },
});
```

## Type Safety Best Practices

1. **Type Guards**: Use type guards to ensure type safety:

```typescript
// Type guard for checking if an event is valid
function isValidEvent(event: unknown): event is Doc<"events"> {
  return (
    !!event &&
    typeof (event as any).title === "string" &&
    typeof (event as any).startTime === "number"
  );
}
```

2. **Array Filtering with Type Predicates**:

```typescript
// Filter out null events and narrow the type
const validEvents = events.filter(
  (event): event is NonNullable<typeof event> =>
    event !== null &&
    event.startTime <= args.endDate &&
    event.endTime >= args.startDate,
);
```

3. **Type Assertions (Use Sparingly)**:

```typescript
// Only use when TypeScript can't infer types correctly
const prefs = preferencesDoc.appPreferences as Record<
  string,
  boolean | undefined
>;
```

4. **Generic Type Parameters**:

```typescript
// Using generics to create flexible, type-safe functions
function getDocumentById<T extends keyof ConvexTables>(
  table: T,
  id: Id<T>,
): Promise<Doc<T> | null> {
  // ...
}
```

## Examples

### Example 1: Defining a Query with Shared Validators

```typescript
import { v } from "convex/values";

import { query } from "../_generated/server";
import { timestampValidator, userIdValidator } from "../shared/validators";

export const getEventsForUser = query({
  args: {
    userId: userIdValidator,
    startDate: timestampValidator,
    endDate: timestampValidator,
  },
  returns: v.array(
    v.object({
      _id: v.id("events"),
      title: v.string(),
      startTime: timestampValidator,
      endTime: timestampValidator,
      description: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    // Implementation...
  },
});
```

### Example 2: Using Type Inference with Validators

```typescript
import { Infer, v } from "convex/values";

import { mutation } from "../_generated/server";
import { notificationTypeValidator } from "../shared/validators";

// Define a validator
const userProfileValidator = v.object({
  name: v.string(),
  email: v.string(),
  preferences: v.object({
    theme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
    notificationTypes: v.array(notificationTypeValidator),
  }),
});

// Infer the TypeScript type from the validator
type UserProfile = Infer<typeof userProfileValidator>;

// Use the inferred type in your function
export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    profile: userProfileValidator,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const profile: UserProfile = args.profile;
    // Implementation...
    return true;
  },
});
```

### Example 3: Properly Handling Null Values

```typescript
import { v } from "convex/values";

import { query } from "../_generated/server";

export const getUserOrDefault = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  returns: v.object({
    _id: v.id("users"),
    name: v.string(),
    email: v.string(),
  }),
  handler: async (ctx, args) => {
    if (args.userId) {
      const user = await ctx.db.get(args.userId);
      if (user) {
        return user;
      }
    }

    // Return a default user if none is found
    return {
      _id: "default_user_id" as Id<"users">, // Type assertion needed here
      name: "Default User",
      email: "default@example.com",
    };
  },
});
```

## Conclusion

Following these standards will ensure type safety, consistency, and maintainability across the Portal application. By leveraging TypeScript's static typing and Convex's validation system, we can catch errors early and provide a better developer experience.

When adding new validators or types, consider whether they should be added to `shared/validators.ts` to promote reuse. Always prioritize type safety and explicitness over brevity or convenience.
