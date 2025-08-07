import type { MutationCtx, QueryCtx } from "./_generated/server";

/**
 * Performance monitoring and optimization utilities for Convex functions
 */

// Interface for timing information
interface TimingInfo {
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: unknown;
  metadata?: Record<string, unknown>;
}

// Current timing information (for nested operations)
const timings: TimingInfo[] = [];

/**
 * Time an async operation and log its performance
 * @param operationName Name of the operation being timed
 * @param operation The async operation to time
 * @param metadata Additional context about the operation
 * @returns The result of the operation
 */
export async function timeOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, unknown>,
): Promise<T> {
  const startTime = Date.now();
  const timingInfo: TimingInfo = {
    operationName,
    startTime,
    success: false,
    metadata,
  };

  timings.push(timingInfo);

  try {
    const result = await operation();

    // Update timing info
    timingInfo.endTime = Date.now();
    timingInfo.duration = timingInfo.endTime - startTime;
    timingInfo.success = true;

    // Log performance data
    console.log(
      `Performance: ${operationName} completed in ${timingInfo.duration}ms`,
      metadata ? { ...metadata } : {},
    );

    return result;
  } catch (error) {
    // Update timing info with error
    timingInfo.endTime = Date.now();
    timingInfo.duration = timingInfo.endTime - startTime;
    timingInfo.error = error;

    // Log error
    console.error(
      `Performance: ${operationName} failed after ${timingInfo.duration}ms`,
      { error, ...(metadata ?? {}) },
    );

    throw error;
  } finally {
    // Remove this timing info from the stack
    const index = timings.indexOf(timingInfo);
    if (index !== -1) {
      timings.splice(index, 1);
    }
  }
}

/**
 * Log index usage information for a query
 * @param ctx Convex query context
 * @param tableName The table being queried
 * @param indexName The index being used
 * @param additionalInfo Additional information about the query
 */
export function logIndexUsage(
  ctx: QueryCtx,
  tableName: string,
  indexName: string,
  additionalInfo?: Record<string, unknown>,
): void {
  console.log(
    `Index Usage: ${tableName} using ${indexName}`,
    additionalInfo ?? {},
  );
}

/**
 * Wrap a query function with performance monitoring
 * @param name Name of the query
 * @param queryFn The query function to wrap
 * @returns The wrapped query function with performance monitoring
 */
export function monitoredQuery<T, Args extends unknown[]>(
  name: string,
  queryFn: (ctx: QueryCtx, ...args: Args) => Promise<T>,
): (ctx: QueryCtx, ...args: Args) => Promise<T> {
  return async (ctx: QueryCtx, ...args: Args) => {
    return timeOperation(`query:${name}`, () => queryFn(ctx, ...args), {
      args: JSON.stringify(args),
    });
  };
}

/**
 * Wrap a mutation function with performance monitoring
 * @param name Name of the mutation
 * @param mutationFn The mutation function to wrap
 * @returns The wrapped mutation function with performance monitoring
 */
export function monitoredMutation<T, Args extends unknown[]>(
  name: string,
  mutationFn: (ctx: MutationCtx, ...args: Args) => Promise<T>,
): (ctx: MutationCtx, ...args: Args) => Promise<T> {
  return async (ctx: MutationCtx, ...args: Args) => {
    return timeOperation(`mutation:${name}`, () => mutationFn(ctx, ...args), {
      args: JSON.stringify(args),
    });
  };
}

// Simple in-memory caching utility for query results
// Note: This should be used carefully and only for data that doesn't change frequently
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const queryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Get a cached query result or compute and cache it
 * @param cacheKey Unique key for the cached result
 * @param ttl Time to live in milliseconds
 * @param queryFn Function to compute the result if not cached
 * @returns The cached or computed result
 */
export async function cachedQuery<T>(
  cacheKey: string,
  ttl: number,
  queryFn: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const cached = queryCache.get(cacheKey) as CacheEntry<T> | undefined;

  // Return cached value if it exists and hasn't expired
  if (cached && now - cached.timestamp < cached.ttl) {
    console.log(`Cache hit: ${cacheKey}`);
    return cached.value;
  }

  // Compute new value
  console.log(`Cache miss: ${cacheKey}`);
  const value = await queryFn();

  // Cache the result
  queryCache.set(cacheKey, {
    value,
    timestamp: now,
    ttl,
  });

  return value;
}

/**
 * Clear all entries from the cache
 */
export function clearCache(): void {
  queryCache.clear();
}

/**
 * Delete a specific entry from the cache
 * @param cacheKey The key to delete
 */
export function invalidateCache(cacheKey: string): void {
  queryCache.delete(cacheKey);
}

/**
 * Performance documentation for common operations
 */
export const performanceGuidelines = {
  /**
   * Performance guidelines for queries
   */
  queries: {
    /**
     * Always use indexes for queries that filter or sort data
     * @example
     * ```ts
     * // Good: Using an index
     * const emails = await ctx.db
     *   .query("emails")
     *   .withIndex("by_userId", (q) => q.eq("userId", userId))
     *   .collect();
     *
     * // Bad: Not using an index
     * const emails = await ctx.db
     *   .query("emails")
     *   .filter((q) => q.eq(q.field("userId"), userId))
     *   .collect();
     * ```
     */
    useIndexes: true,

    /**
     * Limit the number of results returned by queries
     * @example
     * ```ts
     * // Good: Limiting results
     * const emails = await ctx.db
     *   .query("emails")
     *   .withIndex("by_userId", (q) => q.eq("userId", userId))
     *   .take(10);
     * ```
     */
    limitResults: true,

    /**
     * Use pagination for large result sets
     * @example
     * ```ts
     * // Good: Using pagination
     * const { results, continueCursor } = await ctx.db
     *   .query("emails")
     *   .withIndex("by_userId", (q) => q.eq("userId", userId))
     *   .paginate({ numItems: 10, cursor });
     * ```
     */
    usePagination: true,
  },

  /**
   * Performance guidelines for mutations
   */
  mutations: {
    /**
     * Use batch operations for multiple updates
     * @example
     * ```ts
     * // Good: Using a batch delete operation
     * for (const emailId of emailIds) {
     *   await ctx.db.delete(emailId);
     * }
     * ```
     */
    useBatchOperations: true,

    /**
     * Minimize database round trips
     * @example
     * ```ts
     * // Good: Single operation
     * await ctx.db.patch(id, { field1: value1, field2: value2 });
     *
     * // Bad: Multiple operations
     * await ctx.db.patch(id, { field1: value1 });
     * await ctx.db.patch(id, { field2: value2 });
     * ```
     */
    minimizeRoundTrips: true,
  },
};
