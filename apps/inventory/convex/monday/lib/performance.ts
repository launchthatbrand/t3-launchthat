/**
 * Monday.com Performance Optimization Utilities
 *
 * This module contains utilities for optimizing performance when dealing with large datasets
 * during synchronization between Convex and Monday.com.
 */

import type { MondayBoardMapping, MondayIntegration } from "./types";

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { logMessage } from "./logging";

/**
 * Constants for performance optimization
 */
export const PERFORMANCE_CONSTANTS = {
  DEFAULT_BATCH_SIZE: 50, // Default number of items to process in a batch
  MAX_BATCH_SIZE: 100, // Maximum batch size to prevent memory issues
  MIN_BATCH_SIZE: 10, // Minimum batch size to ensure some parallelism
  DEFAULT_PAGE_SIZE: 100, // Default page size for pagination
  RATE_LIMIT_WINDOW_MS: 60000, // Window for rate limit tracking (1 minute)
  MAX_REQUESTS_PER_MINUTE: 100, // Maximum requests per minute to Monday.com API
  DELAY_BETWEEN_BATCHES_MS: 100, // Default delay between batch processing
  MAX_RETRIES: 3, // Maximum number of retries for failed operations
  RATE_LIMIT_BACKOFF_BASE_MS: 500, // Base delay for rate limit exponential backoff
};

/**
 * Performance metrics tracking interface
 */
export interface PerformanceMetrics {
  totalTime: number;
  apiCallCount: number;
  recordsProcessed: number;
  batchesProcessed: number;
  averageTimePerBatch: number;
  averageTimePerRecord: number;
  maxBatchTime: number;
  minBatchTime: number;
  rateLimitHits: number;
  totalDataSize: number; // in bytes
  timePerPhase: Record<string, number>;
  startTime: number;
  endTime?: number;
}

/**
 * Initialize performance metrics tracking
 */
export function initializePerformanceMetrics(): PerformanceMetrics {
  return {
    totalTime: 0,
    apiCallCount: 0,
    recordsProcessed: 0,
    batchesProcessed: 0,
    averageTimePerBatch: 0,
    averageTimePerRecord: 0,
    maxBatchTime: 0,
    minBatchTime: Number.MAX_SAFE_INTEGER,
    rateLimitHits: 0,
    totalDataSize: 0,
    timePerPhase: {},
    startTime: Date.now(),
  };
}

/**
 * Update performance metrics with batch results
 */
export function updatePerformanceMetrics(
  metrics: PerformanceMetrics,
  updates: Partial<{
    batchTime: number;
    recordsProcessed: number;
    apiCallCount: number;
    dataSize: number;
    rateLimitHits: number;
    phaseTime: { name: string; time: number };
  }>,
): PerformanceMetrics {
  const updatedMetrics = { ...metrics };

  // Update batch metrics
  if (updates.batchTime !== undefined) {
    updatedMetrics.batchesProcessed += 1;
    updatedMetrics.totalTime += updates.batchTime;
    updatedMetrics.maxBatchTime = Math.max(
      updatedMetrics.maxBatchTime,
      updates.batchTime,
    );
    updatedMetrics.minBatchTime = Math.min(
      updatedMetrics.minBatchTime,
      updates.batchTime,
    );
    updatedMetrics.averageTimePerBatch =
      updatedMetrics.totalTime / updatedMetrics.batchesProcessed;
  }

  // Update records processed
  if (updates.recordsProcessed !== undefined) {
    updatedMetrics.recordsProcessed += updates.recordsProcessed;
    updatedMetrics.averageTimePerRecord =
      updatedMetrics.totalTime / updatedMetrics.recordsProcessed;
  }

  // Update API call count
  if (updates.apiCallCount !== undefined) {
    updatedMetrics.apiCallCount += updates.apiCallCount;
  }

  // Update data size
  if (updates.dataSize !== undefined) {
    updatedMetrics.totalDataSize += updates.dataSize;
  }

  // Update rate limit hits
  if (updates.rateLimitHits !== undefined) {
    updatedMetrics.rateLimitHits += updates.rateLimitHits;
  }

  // Update phase time
  if (updates.phaseTime !== undefined) {
    const { name, time } = updates.phaseTime;
    updatedMetrics.timePerPhase[name] =
      (updatedMetrics.timePerPhase[name] || 0) + time;
  }

  return updatedMetrics;
}

/**
 * Finalize performance metrics at the end of an operation
 */
export function finalizePerformanceMetrics(
  metrics: PerformanceMetrics,
): PerformanceMetrics {
  const endTime = Date.now();
  return {
    ...metrics,
    endTime,
    totalTime: endTime - metrics.startTime,
  };
}

/**
 * Split an array into batches of the specified size
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];

  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }

  return batches;
}

/**
 * Calculate the optimal batch size based on the total number of items
 * and a base size that would be optimal for medium-sized datasets
 */
export function calculateOptimalBatchSize(
  totalItems: number,
  baseBatchSize = 50,
): number {
  if (totalItems <= PERFORMANCE_CONSTANTS.MIN_BATCH_SIZE * 2) {
    // For very small datasets, process in one or two batches
    return Math.max(Math.ceil(totalItems / 2), 1);
  }

  if (totalItems <= 100) {
    // For small datasets, use smaller batches
    return Math.min(
      Math.max(PERFORMANCE_CONSTANTS.MIN_BATCH_SIZE, Math.ceil(totalItems / 4)),
      PERFORMANCE_CONSTANTS.MAX_BATCH_SIZE,
    );
  }

  if (totalItems >= 1000) {
    // For large datasets, use larger batches to reduce overhead
    return Math.min(
      Math.max(baseBatchSize, Math.ceil(totalItems / 20)),
      PERFORMANCE_CONSTANTS.MAX_BATCH_SIZE,
    );
  }

  // For medium datasets, use the base batch size
  return Math.min(
    Math.max(baseBatchSize, Math.ceil(totalItems / 10)),
    PERFORMANCE_CONSTANTS.MAX_BATCH_SIZE,
  );
}

/**
 * Wait with exponential backoff when hitting rate limits
 */
export async function handleRateLimit(retryCount: number): Promise<void> {
  const baseDelay = PERFORMANCE_CONSTANTS.RATE_LIMIT_BACKOFF_BASE_MS;
  const delay = baseDelay * Math.pow(2, retryCount - 1); // Exponential backoff
  const jitter = Math.random() * 200; // Add some randomness to prevent thundering herd

  await sleep(delay + jitter);
}

/**
 * Sleep for the specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Store performance metrics in the sync log
 */
export async function storePerformanceMetrics(
  ctx: MutationCtx,
  syncLogId: Id<"mondaySyncLogs">,
  metrics: PerformanceMetrics,
): Promise<void> {
  // Update the sync log with performance metrics
  await ctx.db.patch(syncLogId, {
    performanceMetrics: JSON.stringify(metrics),
    timeTaken: metrics.totalTime,
  });

  // Log performance summary
  await logMessage(
    ctx,
    syncLogId,
    "info",
    `Performance metrics: ${metrics.recordsProcessed} records processed in ${
      metrics.totalTime / 1000
    }s, avg ${
      metrics.averageTimePerRecord
    }ms/record, ${metrics.apiCallCount} API calls`,
    { metrics },
  );
}

/**
 * Get an optimal page size for paginated API requests based on integration settings
 */
export function getOptimalPageSize(integration: MondayIntegration): number {
  // Use integration-specific settings if available
  if (integration.preferredPageSize) {
    return integration.preferredPageSize as number;
  }

  // Otherwise use default
  return PERFORMANCE_CONSTANTS.DEFAULT_PAGE_SIZE;
}

/**
 * Update the progress of a synchronization operation in the sync log
 */
export async function updateSyncProgress(
  ctx: MutationCtx,
  syncLogId: Id<"mondaySyncLogs">,
  current: number,
  total: number,
  statusMessage?: string,
): Promise<void> {
  const progress = Math.min(Math.round((current / total) * 100), 100);

  await ctx.db.patch(syncLogId, {
    progressPercentage: progress,
    progressCurrent: current,
    progressTotal: total,
    progressMessage: statusMessage ?? `Processed ${current} of ${total} items`,
  });
}

/**
 * Track API call frequency and detect potential rate limit issues
 */
export function checkRateLimitRisk(
  apiCallHistory: { timestamp: number; success: boolean }[],
): {
  isAtRisk: boolean;
  callsInWindow: number;
  recommendedDelay: number;
} {
  const now = Date.now();
  const windowStartTime = now - PERFORMANCE_CONSTANTS.RATE_LIMIT_WINDOW_MS;

  // Count calls within the rate limit window
  const callsInWindow = apiCallHistory.filter(
    (call) => call.timestamp >= windowStartTime,
  ).length;

  // Calculate risk level (0-1) based on proximity to rate limit
  const riskLevel =
    callsInWindow / PERFORMANCE_CONSTANTS.MAX_REQUESTS_PER_MINUTE;

  // Determine if we're at risk of hitting rate limits
  const isAtRisk = riskLevel > 0.8; // 80% of limit

  // Calculate recommended delay based on risk level
  let recommendedDelay = 0;
  if (riskLevel > 0.9) {
    // Over 90% of limit, add significant delay
    recommendedDelay = 1000;
  } else if (riskLevel > 0.7) {
    // Between 70-90% of limit, add moderate delay
    recommendedDelay = 500;
  } else if (riskLevel > 0.5) {
    // Between 50-70% of limit, add small delay
    recommendedDelay = 200;
  }

  return {
    isAtRisk,
    callsInWindow,
    recommendedDelay,
  };
}

/**
 * Create optimized query filters based on last sync time and other criteria
 * to minimize the amount of data retrieved from Monday.com
 */
export function createOptimizedQueryFilters(
  lastSyncTimestamp: number | undefined,
  entityType: string,
  additionalFilters?: Record<string, unknown>,
): Record<string, unknown> {
  const filters: Record<string, unknown> = {
    ...additionalFilters,
  };

  // Add time-based filters if we have a last sync timestamp
  if (lastSyncTimestamp) {
    // Different entity types might need different time filters
    switch (entityType) {
      case "items":
        filters.updated_at = { $gt: lastSyncTimestamp };
        break;
      case "updates":
        filters.created_at = { $gt: lastSyncTimestamp };
        break;
      default:
        // Default to updated_at for most entity types
        filters.updated_at = { $gt: lastSyncTimestamp };
    }
  }

  return filters;
}

/**
 * Process items with automatic batching and progress tracking
 */
export async function processBatchedItems<T, R>(
  ctx: MutationCtx,
  items: T[],
  processFn: (batch: T[], batchIndex: number) => Promise<R[]>,
  options: {
    batchSize?: number;
    syncLogId?: Id<"mondaySyncLogs">;
    phaseLabel?: string;
    boardMapping?: MondayBoardMapping;
  } = {},
): Promise<{ results: R[]; metrics: PerformanceMetrics }> {
  const batchSize =
    options.batchSize || PERFORMANCE_CONSTANTS.DEFAULT_BATCH_SIZE;
  const syncLogId = options.syncLogId;
  const phaseLabel = options.phaseLabel || "Processing items";

  // Initialize metrics
  const metrics = initializePerformanceMetrics();

  // Split into batches
  const batches = batchArray(items, batchSize);
  const results: R[] = [];

  // Process each batch
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchStartTime = Date.now();

    try {
      // Process the batch
      const batchResults = await processFn(batch, i);
      results.push(...batchResults);

      // Update metrics
      const batchTime = Date.now() - batchStartTime;
      updatePerformanceMetrics(metrics, {
        batchTime,
        recordsProcessed: batch.length,
        apiCallCount: 1, // Assuming each batch involves one API call
      });

      // Update progress if sync log ID is provided
      if (syncLogId) {
        const itemsProcessed = (i + 1) * batchSize;
        const totalItems = items.length;
        await updateSyncProgress(
          ctx,
          syncLogId,
          Math.min(itemsProcessed, totalItems),
          totalItems,
          `${phaseLabel} (${i + 1}/${batches.length} batches)`,
        );
      }
    } catch (error) {
      // If this is a rate limit error, wait and retry
      if (error instanceof Error && error.message.includes("rate limit")) {
        // Update rate limit hit counter
        updatePerformanceMetrics(metrics, { rateLimitHits: 1 });

        // Log rate limit hit
        if (syncLogId) {
          await logMessage(
            ctx,
            syncLogId,
            "warning",
            `Rate limit hit during batch ${i + 1}/${batches.length}, waiting before retry`,
            { error: error.message },
          );
        }

        // Wait with exponential backoff
        await handleRateLimit(metrics.rateLimitHits);

        // Retry this batch (decrement i to process this batch again)
        i--;
        continue;
      }

      // For other errors, log and rethrow
      if (syncLogId) {
        await logMessage(
          ctx,
          syncLogId,
          "error",
          `Error processing batch ${i + 1}/${batches.length}: ${error instanceof Error ? error.message : String(error)}`,
          { batchIndex: i },
        );
      }
      throw error;
    }
  }

  // Finalize metrics
  const finalMetrics = finalizePerformanceMetrics(metrics);

  // Store metrics if sync log ID is provided
  if (syncLogId) {
    await storePerformanceMetrics(ctx, syncLogId, finalMetrics);
  }

  return { results, metrics: finalMetrics };
}

/**
 * Incremental synchronization helper - only sync items that have changed since last sync
 */
export async function getChangedItemsSinceLastSync<T>(
  ctx: MutationCtx,
  boardMappingId: Id<"mondayBoardMappings">,
  allItems: T[],
  getItemLastUpdateTime: (item: T) => number,
): Promise<T[]> {
  // Get board mapping to find last sync time
  const boardMapping = await ctx.db.get(boardMappingId);
  if (!boardMapping) {
    throw new Error(`Board mapping ${boardMappingId} not found`);
  }

  // Get last sync timestamp (default to 0 if never synced)
  const lastSyncTimestamp = boardMapping.lastSyncTimestamp || 0;

  // Filter items that have been updated since last sync
  const changedItems = allItems.filter((item) => {
    const lastUpdateTime = getItemLastUpdateTime(item);
    return lastUpdateTime > lastSyncTimestamp;
  });

  return changedItems;
}

/**
 * Check if API throttling is needed based on recent API call metrics
 */
export function shouldThrottleApiCalls(
  recentApiCalls: { timestamp: number; success: boolean }[],
  timeWindow = 60000, // 1 minute window
  errorThreshold = 0.1, // 10% error rate threshold
  maxCallsPerMinute = 100, // Max API calls per minute
): boolean {
  const now = Date.now();

  // Filter calls within the time window
  const recentCalls = recentApiCalls.filter(
    (call) => now - call.timestamp < timeWindow,
  );

  // Check total call count
  if (recentCalls.length >= maxCallsPerMinute) {
    return true;
  }

  // Check error rate
  if (recentCalls.length > 0) {
    const errorCount = recentCalls.filter((call) => !call.success).length;
    const errorRate = errorCount / recentCalls.length;
    if (errorRate > errorThreshold) {
      return true;
    }
  }

  return false;
}
