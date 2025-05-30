# Database Query and Indexing Optimization Guide

This document outlines optimization strategies and performance improvements for Convex queries and indexing in the Portal application.

## Identified Performance Issues

Based on analysis of the codebase, the following performance-critical areas have been identified:

1. Inefficient data fetching patterns in the Calendar module when retrieving events across multiple calendars
2. Missing or suboptimal indexes for common notification queries
3. Inefficient use of `.collect()` for counting operations
4. Absence of pagination in large dataset queries
5. Limited use of Convex's search indexes for text search operations

## Recommended Optimizations

### 1. Calendar Event Queries

#### Current Issues:

- The `getEventsInDateRange` query performs multiple nested database operations:
  - First fetches accessible calendars
  - Then queries calendar events for each calendar
  - Finally fetches individual events

#### Optimizations:

- Add a composite index on `calendarEvents` that includes both calendar and event date ranges
- Implement batch fetching using `ctx.db.get` for multiple IDs
- Implement proper pagination for event lists

```typescript
// Add this index to calendarEvents table
.index("by_calendar_date", ["calendarId", "startTime", "endTime"])

// Optimize fetching by using a single query with the new index
const events = await ctx.db
  .query("events")
  .withIndex("by_timeRange", (q) =>
    q.gte("startTime", args.startDate).lte("endTime", args.endDate)
  )
  .filter((q) =>
    q.or(
      accessibleCalendarIds.map(calendarId =>
        q.equals(q.field("calendarId"), calendarId)
      )
    )
  )
  .paginate({ numItems: 50, cursor: args.cursor });
```

### 2. Notification Query Optimizations

#### Current Issues:

- The `countUnreadNotifications` query uses `.collect()` followed by `.length`, which is inefficient for counting
- Multiple filters are applied sequentially, which can be slow for large datasets

#### Optimizations:

- Use the `aggregate` function for count operations
- Optimize indexing for common notification filter combinations

```typescript
// Optimize count query
export const countUnreadNotifications = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    // Use Convex's count operation instead of collecting all documents
    const count = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", args.userId).eq("read", false),
      )
      .count();

    return count;
  },
});
```

### 3. Add Additional Indexes

Add the following indexes to improve query performance:

#### Notifications Table

```typescript
// Add a composite index for filtered notification queries
.index("by_user_type_read", ["userId", "type", "read"])
```

#### Events Table

```typescript
// Add a composite index for date range queries with visibility
.index("by_timeRange_visibility", ["startTime", "endTime", "visibility"])
```

### 4. Implement Pagination for All List Queries

Ensure all queries that may return large result sets use pagination:

```typescript
// Example pagination pattern
export const listItems = query({
  args: {
    paginationOpts: paginationOptsValidator,
    filters: v.optional(
      v.object({
        /* filter fields */
      }),
    ),
  },
  returns: v.object({
    items: v.array(/* item schema */),
    hasMore: v.boolean(),
    cursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    let itemsQuery = ctx.db.query("items");

    // Apply filters
    if (args.filters) {
      // Apply filters to query
    }

    // Get paginated results
    const paginationResult = await itemsQuery.paginate(args.paginationOpts);

    return {
      items: paginationResult.page,
      hasMore: !paginationResult.isDone,
      cursor: paginationResult.continueCursor,
    };
  },
});
```

### 5. Use Search Indexes for Text Search

Implement search indexes for text search operations:

```typescript
// Add to relevant tables
.searchIndex("search_content", {
  searchField: "content",
  filterFields: ["type", "visibility"],
})

// Use in queries
const results = await ctx.db
  .query("items")
  .withSearchIndex("search_content", (q) =>
    q.search("content", searchTerm).eq("visibility", "public")
  )
  .take(10);
```

### 6. Batch Database Operations

Replace multiple individual database operations with batch operations:

```typescript
// Instead of:
for (const id of ids) {
  await ctx.db.get(id);
}

// Use:
const items = await Promise.all(ids.map((id) => ctx.db.get(id)));
```

### 7. Caching Strategy for Frequently Accessed Data

Implement caching for frequently accessed, rarely changing data:

```typescript
// Caching implementation for user preferences
const cachedPreferences = new Map();

export const getUserPreferences = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Check cache first
    const cachedValue = cachedPreferences.get(args.userId);
    if (cachedValue && Date.now() - cachedValue.timestamp < CACHE_TTL) {
      return cachedValue.data;
    }

    // If not in cache, fetch from database
    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    // Store in cache
    cachedPreferences.set(args.userId, {
      data: preferences,
      timestamp: Date.now(),
    });

    return preferences;
  },
});
```

## Query Performance Monitoring

Implement query performance monitoring using the `queryAnalyzer.ts` utility:

```typescript
import { measureQueryPerformance } from "../lib/queryAnalyzer";

export const listItems = query({
  // ... args and returns ...
  handler: async (ctx, args) => {
    const { result, executionTime } = await measureQueryPerformance(
      "listItems",
      async () => {
        // Original query implementation
        // ...
      },
    );

    // Log if execution time exceeds threshold
    if (executionTime > 500) {
      // 500ms threshold
      console.warn(`Slow query detected: listItems took ${executionTime}ms`);
    }

    return result;
  },
});
```

## Next Steps

1. Identify the top 5 slowest queries using the query analyzer
2. Apply the optimization techniques outlined in this document
3. Measure performance before and after optimization
4. Document optimization results
5. Implement ongoing performance monitoring
