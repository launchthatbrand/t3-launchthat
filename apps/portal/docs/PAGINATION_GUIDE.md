# Implementing Pagination in Convex Queries

This guide demonstrates how to implement efficient pagination for large dataset queries in Convex.

## Why Pagination is Important

1. **Performance**: Fetching large datasets in a single query can be slow and resource-intensive
2. **User Experience**: Loading data incrementally provides faster initial page loads
3. **Bandwidth**: Reduces the amount of data transferred over the network
4. **Resource Utilization**: Minimizes database and application memory usage

## Standard Pagination Pattern

### Step 1: Define the pagination validator

Convex provides a built-in pagination validator that you can import:

```typescript
import { paginationOptsValidator } from "convex/server";
```

### Step 2: Add pagination to your query arguments

```typescript
export const listItems = query({
  args: {
    // ... other args
    paginationOpts: paginationOptsValidator,
  },
  // ... returns
  handler: async (ctx, args) => {
    // Query implementation
  },
});
```

### Step 3: Implement the paginated query

```typescript
export const listItems = query({
  args: {
    // ... other args
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    items: v.array(/* item schema */),
    hasMore: v.boolean(),
    cursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Set up your base query
    let itemsQuery = ctx.db
      .query("items")
      .withIndex("by_some_field", (q) => /* your index criteria */);

    // Apply any additional filters
    if (args.someFilter) {
      itemsQuery = itemsQuery.filter(/* your filter */);
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

### Step 4: Integrate with frontend

```tsx
const MyComponent = () => {
  const [cursor, setCursor] = useState<string | null>(null);
  const { data, isLoading } = useQuery(
    api.myModule.listItems,
    {
      /* other args */,
      paginationOpts: cursor
        ? { cursor, numItems: 20 }
        : { numItems: 20 },
    }
  );

  const handleLoadMore = () => {
    if (data?.cursor) {
      setCursor(data.cursor);
    }
  };

  return (
    <div>
      {data?.items.map(item => (
        <ItemComponent key={item._id} item={item} />
      ))}

      {data?.hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={isLoading}
        >
          Load More
        </button>
      )}
    </div>
  );
};
```

## Advanced Pagination Techniques

### Infinite Scroll Implementation

```tsx
import { useInView } from "react-intersection-observer";

const InfiniteScrollList = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const { ref, inView } = useInView();

  const { data, isLoading } = useQuery(api.myModule.listItems, {
    paginationOpts: cursor ? { cursor, numItems: 20 } : { numItems: 20 },
  });

  // When data changes, append new items
  useEffect(() => {
    if (data?.items) {
      setItems((prev) => [...prev, ...data.items]);
      setCursor(data.cursor || null);
    }
  }, [data]);

  // When bottom element is in view, load more if available
  useEffect(() => {
    if (inView && data?.hasMore && !isLoading) {
      // This will trigger a new query with the updated cursor
      setCursor(data.cursor || null);
    }
  }, [inView, data?.hasMore, isLoading]);

  return (
    <div>
      {items.map((item) => (
        <ItemComponent key={item._id} item={item} />
      ))}

      {/* Loading indicator at the bottom */}
      {data?.hasMore && <div ref={ref}>{isLoading ? "Loading..." : ""}</div>}
    </div>
  );
};
```

### Bidirectional Pagination

For use cases where you need to paginate in both directions:

```typescript
export const listItemsBidirectional = query({
  args: {
    // Forward or backward pagination
    direction: v.union(v.literal("forward"), v.literal("backward")),
    // Reference item ID (can be null for initial load)
    referenceId: v.optional(v.id("items")),
    // Number of items to fetch
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("items");

    if (args.referenceId) {
      const reference = await ctx.db.get(args.referenceId);
      if (!reference) {
        throw new Error("Reference item not found");
      }

      // Get timestamp from reference item
      const timestamp = reference.timestamp;

      if (args.direction === "forward") {
        // Items with timestamp greater than reference
        query = query
          .withIndex("by_timestamp", (q) => q.gt("timestamp", timestamp))
          .order("asc")
          .take(args.limit);
      } else {
        // Items with timestamp less than reference
        query = query
          .withIndex("by_timestamp", (q) => q.lt("timestamp", timestamp))
          .order("desc")
          .take(args.limit);
      }
    } else {
      // Initial load - most recent items
      query = query.withIndex("by_timestamp").order("desc").take(args.limit);
    }

    return await query.collect();
  },
});
```

## Optimizing Paginated Queries

1. **Use appropriate indexes**: Ensure your queries use indexes that match your sorting and filtering patterns
2. **Limit result sizes**: Keep page sizes reasonable (20-50 items)
3. **Avoid unnecessary fields**: Only request fields you need to display
4. **Consider denormalization**: For frequently accessed data, consider denormalizing to reduce joins
5. **Monitor query performance**: Use the query analyzer to identify slow queries

## Common Pagination Patterns

### Timestamp-based Pagination

Useful for chronological data like messages or activity feeds:

```typescript
// Index on timestamp field
.index("by_timestamp", ["timestamp"])

// Query using timestamp cursor
const query = ctx.db
  .query("messages")
  .withIndex("by_timestamp", (q) =>
    args.cursor
      ? q.lt("timestamp", args.cursor)
      : q
  )
  .order("desc")
  .take(args.limit);
```

### Composite Key Pagination

For queries that need to filter by multiple fields:

```typescript
// Composite index
.index("by_user_timestamp", ["userId", "timestamp"])

// Query using composite index
const query = ctx.db
  .query("userActivities")
  .withIndex("by_user_timestamp", (q) =>
    q.eq("userId", args.userId)
     .lt("timestamp", args.cursor || Date.now())
  )
  .order("desc")
  .take(args.limit);
```

## Best Practices

1. Always return a `hasMore` flag to indicate if more data is available
2. Use `null` cursors to indicate the end of data
3. Include helpful error handling for invalid cursors
4. Consider user experience when choosing page sizes
5. Implement loading states for better UX during pagination
6. Test with large datasets to ensure performance
7. Document your pagination approach for other developers
