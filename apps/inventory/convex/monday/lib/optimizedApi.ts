/**
 * Optimized API Interactions with Monday.com
 *
 * This module provides optimized API interaction methods for Monday.com,
 * focusing on performance for large datasets through batching, pagination,
 * and efficient algorithms.
 */

import type { MondayBoardMapping, MondayIntegration } from "./types";
import {
  PERFORMANCE_CONSTANTS,
  batchArray,
  calculateOptimalBatchSize,
  handleRateLimit,
  sleep,
  updateSyncProgress,
} from "./performance";
import { logError, logMessage } from "./logging";

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";

// Cache for API call metrics to manage rate limiting
const apiCallMetrics: {
  timestamp: number;
  success: boolean;
  endpoint: string;
}[] = [];

/**
 * Optimized method to fetch items from Monday.com with automatic pagination and batching
 */
export async function fetchMondayItemsBatched(
  ctx: MutationCtx,
  integration: MondayIntegration,
  boardId: string,
  options: {
    pageSize?: number;
    syncLogId?: Id<"mondaySyncLogs">;
    limit?: number;
    filter?: Record<string, unknown>;
    onlyUpdatedSince?: number;
  } = {},
): Promise<Record<string, unknown>[]> {
  // Determine page size (prefer options, then integration settings, then default)
  const pageSize =
    options.pageSize ??
    integration.preferredPageSize ??
    PERFORMANCE_CONSTANTS.DEFAULT_PAGE_SIZE;

  // Initialize pagination variables
  let hasMorePages = true;
  let currentPage = 1;
  const allItems: Record<string, unknown>[] = [];
  const limit = options.limit ?? Number.MAX_SAFE_INTEGER;

  // Initialize counters for metrics
  let totalApiCalls = 0;
  let rateLimitHits = 0;

  // Log operation start
  if (options.syncLogId) {
    await logMessage(
      ctx,
      options.syncLogId,
      "info",
      `Starting optimized fetch of Monday.com items for board ${boardId}`,
      { boardId, pageSize, limit },
    );
  }

  try {
    // Paginate through results
    while (hasMorePages && allItems.length < limit) {
      try {
        // In a real implementation, this would be an actual API call to Monday.com
        // Using the integration.apiKey for authentication

        // MOCK IMPLEMENTATION:
        // This is where you would make the actual API call to Monday.com
        // For example:
        // const response = await mondayClient.api(`
        //   query ($boardId: ID!, $page: Int!, $pageSize: Int!) {
        //     boards(ids: [$boardId]) {
        //       items(page: $page, limit: $pageSize) {
        //         id
        //         name
        //         column_values {
        //           id
        //           title
        //           value
        //           text
        //         }
        //         updated_at
        //       }
        //     }
        //   }
        // `, { boardId, page: currentPage, pageSize });

        // For now, we'll simulate the API response
        await sleep(50); // Simulate network delay

        // Mock API response with pagination
        const mockItems = Array.from(
          { length: Math.min(pageSize, 20) },
          (_, i) => ({
            id: `item-${currentPage}-${i}`,
            name: `Item ${currentPage}-${i}`,
            updated_at: Date.now() - Math.random() * 1000000,
            column_values: [
              {
                id: "text",
                title: "Text",
                value: `Value ${i}`,
                text: `Text ${i}`,
              },
              {
                id: "status",
                title: "Status",
                value: JSON.stringify({ index: i % 3 }),
                text: ["Done", "Working on it", "Stuck"][i % 3],
              },
            ],
          }),
        );

        // Track API call
        apiCallMetrics.push({
          timestamp: Date.now(),
          success: true,
          endpoint: `boards/${boardId}/items`,
        });
        totalApiCalls++;

        // Filter by updated time if requested
        const filteredItems = options.onlyUpdatedSince
          ? mockItems.filter(
              (item) =>
                (item.updated_at as number) >
                (options.onlyUpdatedSince as number),
            )
          : mockItems;

        // Add items to result array
        allItems.push(...filteredItems);

        // Check if we have more pages (in real implementation, this would come from the API response)
        hasMorePages = currentPage < 3 && mockItems.length === pageSize; // Mock 3 pages max
        currentPage++;

        // Update progress if sync log provided
        if (options.syncLogId) {
          await updateSyncProgress(
            ctx,
            options.syncLogId,
            allItems.length,
            Math.min(limit, hasMorePages ? 10000 : allItems.length), // Estimate total or use known total
            `Fetching page ${currentPage - 1}`,
          );
        }

        // Rate limiting protection - add delay between requests if needed
        if (hasMorePages) {
          await sleep(100); // Small delay between pages
        }
      } catch (error) {
        // Handle rate limiting
        if (error instanceof Error && error.message.includes("rate limit")) {
          rateLimitHits++;

          // Log rate limit hit
          if (options.syncLogId) {
            await logMessage(
              ctx,
              options.syncLogId,
              "warning",
              `Rate limit hit during page ${currentPage} fetch, waiting before retry`,
              { error: error.message },
            );
          }

          // Wait with exponential backoff
          await handleRateLimit(rateLimitHits);

          // Don't increment page number, we'll retry
          continue;
        }

        // Log error and rethrow for other error types
        if (options.syncLogId) {
          await logError(
            ctx,
            options.syncLogId,
            `Error fetching Monday.com items for board ${boardId}, page ${currentPage}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
        throw error;
      }

      // Respect the limit parameter
      if (allItems.length >= limit) {
        allItems.splice(limit);
        break;
      }
    }

    // Log operation completion
    if (options.syncLogId) {
      await logMessage(
        ctx,
        options.syncLogId,
        "info",
        `Completed optimized fetch of ${allItems.length} Monday.com items for board ${boardId}`,
        {
          boardId,
          itemCount: allItems.length,
          pagesFetched: currentPage - 1,
          apiCalls: totalApiCalls,
          rateLimitHits,
        },
      );
    }

    return allItems;
  } catch (error) {
    // Log error summary
    if (options.syncLogId) {
      await logError(
        ctx,
        options.syncLogId,
        `Failed to fetch Monday.com items for board ${boardId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    throw error;
  }
}

/**
 * Optimized method to update items in Monday.com with batching
 */
export async function updateMondayItemsBatched(
  ctx: MutationCtx,
  integration: MondayIntegration,
  boardId: string,
  itemUpdates: {
    itemId: string;
    columnValues: Record<string, unknown>;
  }[],
  options: {
    syncLogId?: Id<"mondaySyncLogs">;
    batchSize?: number;
  } = {},
): Promise<{
  successCount: number;
  failureCount: number;
  results: { itemId: string; success: boolean; error?: string }[];
}> {
  // Determine batch size
  const batchSize =
    options.batchSize ??
    integration.batchSizeOverride ??
    calculateOptimalBatchSize(itemUpdates.length, 500);

  // Split updates into batches
  const batches = batchArray(itemUpdates, batchSize);

  // Initialize result variables
  let successCount = 0;
  let failureCount = 0;
  const results: { itemId: string; success: boolean; error?: string }[] = [];

  // Log operation start
  if (options.syncLogId) {
    await logMessage(
      ctx,
      options.syncLogId,
      "info",
      `Starting batched update of ${itemUpdates.length} Monday.com items for board ${boardId}`,
      { boardId, batchSize, batchCount: batches.length },
    );
  }

  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    let retryCount = 0;
    let batchSuccess = false;

    // Retry logic for the batch
    while (!batchSuccess && retryCount < 3) {
      try {
        // In a real implementation, this would batch update items in Monday.com
        // For now, we'll simulate the API calls

        // Process each item in the batch
        for (const update of batch) {
          try {
            // MOCK IMPLEMENTATION:
            // This is where you would make the actual API call to Monday.com
            // For example:
            // const response = await mondayClient.api(`
            //   mutation ($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
            //     change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $columnValues) {
            //       id
            //     }
            //   }
            // `, { boardId, itemId: update.itemId, columnValues: JSON.stringify(update.columnValues) });

            // Simulate API call
            await sleep(20);

            // Track API call
            apiCallMetrics.push({
              timestamp: Date.now(),
              success: true,
              endpoint: `boards/${boardId}/items/${update.itemId}`,
            });

            // Simulate success with 95% probability
            if (Math.random() > 0.05) {
              successCount++;
              results.push({ itemId: update.itemId, success: true });
            } else {
              // Simulate failure
              failureCount++;
              results.push({
                itemId: update.itemId,
                success: false,
                error: "Failed to update item (simulated failure)",
              });
            }
          } catch (itemError) {
            // Handle individual item update failure
            failureCount++;
            results.push({
              itemId: update.itemId,
              success: false,
              error:
                itemError instanceof Error
                  ? itemError.message
                  : String(itemError),
            });

            // Log individual error
            if (options.syncLogId) {
              await logError(
                ctx,
                options.syncLogId,
                `Error updating Monday.com item ${update.itemId}: ${itemError instanceof Error ? itemError.message : String(itemError)}`,
              );
            }
          }
        }

        // Batch completed successfully
        batchSuccess = true;

        // Update progress
        if (options.syncLogId) {
          const itemsProcessed = (batchIndex + 1) * batchSize;
          await updateSyncProgress(
            ctx,
            options.syncLogId,
            Math.min(itemsProcessed, itemUpdates.length),
            itemUpdates.length,
            `Processing batch ${batchIndex + 1}/${batches.length}`,
          );
        }
      } catch (batchError) {
        retryCount++;

        // Check if this is a rate limit error
        if (
          batchError instanceof Error &&
          batchError.message.includes("rate limit")
        ) {
          // Log rate limit hit
          if (options.syncLogId) {
            await logMessage(
              ctx,
              options.syncLogId,
              "warning",
              `Rate limit hit during batch ${batchIndex + 1} update, waiting before retry (attempt ${retryCount}/3)`,
              { error: batchError.message },
            );
          }

          // Wait with exponential backoff
          await handleRateLimit(retryCount);
        } else {
          // Log other batch errors
          if (options.syncLogId) {
            await logError(
              ctx,
              options.syncLogId,
              `Error processing update batch ${batchIndex + 1}: ${batchError instanceof Error ? batchError.message : String(batchError)}`,
            );
          }

          // Add failures for all items in this batch
          for (const update of batch) {
            failureCount++;
            results.push({
              itemId: update.itemId,
              success: false,
              error: `Batch error: ${batchError instanceof Error ? batchError.message : String(batchError)}`,
            });
          }

          // Don't retry non-rate-limit errors
          break;
        }
      }
    }

    // If max retries reached without success, log as batch failure
    if (!batchSuccess && options.syncLogId) {
      await logError(
        ctx,
        options.syncLogId,
        `Failed to process update batch ${batchIndex + 1} after 3 retries`,
      );
    }

    // Small delay between batches to prevent overwhelming the API
    if (batchIndex < batches.length - 1) {
      await sleep(100);
    }
  }

  // Log operation completion
  if (options.syncLogId) {
    await logMessage(
      ctx,
      options.syncLogId,
      "info",
      `Completed batched update of Monday.com items: ${successCount} successful, ${failureCount} failed`,
      { boardId, successCount, failureCount },
    );
  }

  return { successCount, failureCount, results };
}

/**
 * Create multiple items in Monday.com with batching
 */
export async function createMondayItemsBatched(
  ctx: MutationCtx,
  integration: MondayIntegration,
  boardId: string,
  itemCreations: {
    itemName: string;
    columnValues: Record<string, unknown>;
  }[],
  options: {
    syncLogId?: Id<"mondaySyncLogs">;
    batchSize?: number;
  } = {},
): Promise<{
  successCount: number;
  failureCount: number;
  results: {
    index: number;
    success: boolean;
    itemId?: string;
    error?: string;
  }[];
}> {
  // Determine batch size
  const batchSize =
    options.batchSize ??
    integration.batchSizeOverride ??
    calculateOptimalBatchSize(itemCreations.length, 800);

  // Split creations into batches
  const batches = batchArray(itemCreations, batchSize);

  // Initialize result variables
  let successCount = 0;
  let failureCount = 0;
  const results: {
    index: number;
    success: boolean;
    itemId?: string;
    error?: string;
  }[] = [];

  // Log operation start
  if (options.syncLogId) {
    await logMessage(
      ctx,
      options.syncLogId,
      "info",
      `Starting batched creation of ${itemCreations.length} Monday.com items for board ${boardId}`,
      { boardId, batchSize, batchCount: batches.length },
    );
  }

  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    let retryCount = 0;
    let batchSuccess = false;

    // Retry logic for the batch
    while (!batchSuccess && retryCount < 3) {
      try {
        // Process each item in the batch
        for (let i = 0; i < batch.length; i++) {
          const creation = batch[i];
          const globalIndex = batchIndex * batchSize + i;

          try {
            // MOCK IMPLEMENTATION:
            // This is where you would make the actual API call to Monday.com
            // For example:
            // const response = await mondayClient.api(`
            //   mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
            //     create_item(board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
            //       id
            //     }
            //   }
            // `, { boardId, itemName: creation.itemName, columnValues: JSON.stringify(creation.columnValues) });

            // Simulate API call
            await sleep(30);

            // Track API call
            apiCallMetrics.push({
              timestamp: Date.now(),
              success: true,
              endpoint: `boards/${boardId}/items/create`,
            });

            // Simulate success with 95% probability
            if (Math.random() > 0.05) {
              const mockItemId = `item-${Date.now()}-${globalIndex}`;
              successCount++;
              results.push({
                index: globalIndex,
                success: true,
                itemId: mockItemId,
              });
            } else {
              // Simulate failure
              failureCount++;
              results.push({
                index: globalIndex,
                success: false,
                error: "Failed to create item (simulated failure)",
              });
            }
          } catch (itemError) {
            // Handle individual item creation failure
            failureCount++;
            results.push({
              index: globalIndex,
              success: false,
              error:
                itemError instanceof Error
                  ? itemError.message
                  : String(itemError),
            });

            // Log individual error
            if (options.syncLogId) {
              await logError(
                ctx,
                options.syncLogId,
                `Error creating Monday.com item "${creation.itemName}": ${itemError instanceof Error ? itemError.message : String(itemError)}`,
              );
            }
          }
        }

        // Batch completed successfully
        batchSuccess = true;

        // Update progress
        if (options.syncLogId) {
          const itemsProcessed = (batchIndex + 1) * batchSize;
          await updateSyncProgress(
            ctx,
            options.syncLogId,
            Math.min(itemsProcessed, itemCreations.length),
            itemCreations.length,
            `Creating batch ${batchIndex + 1}/${batches.length}`,
          );
        }
      } catch (batchError) {
        retryCount++;

        // Check if this is a rate limit error
        if (
          batchError instanceof Error &&
          batchError.message.includes("rate limit")
        ) {
          // Log rate limit hit
          if (options.syncLogId) {
            await logMessage(
              ctx,
              options.syncLogId,
              "warning",
              `Rate limit hit during batch ${batchIndex + 1} creation, waiting before retry (attempt ${retryCount}/3)`,
              { error: batchError.message },
            );
          }

          // Wait with exponential backoff
          await handleRateLimit(retryCount);
        } else {
          // Log other batch errors
          if (options.syncLogId) {
            await logError(
              ctx,
              options.syncLogId,
              `Error processing creation batch ${batchIndex + 1}: ${batchError instanceof Error ? batchError.message : String(batchError)}`,
            );
          }

          // Add failures for all items in this batch
          for (let i = 0; i < batch.length; i++) {
            const globalIndex = batchIndex * batchSize + i;
            failureCount++;
            results.push({
              index: globalIndex,
              success: false,
              error: `Batch error: ${batchError instanceof Error ? batchError.message : String(batchError)}`,
            });
          }

          // Don't retry non-rate-limit errors
          break;
        }
      }
    }

    // If max retries reached without success, log as batch failure
    if (!batchSuccess && options.syncLogId) {
      await logError(
        ctx,
        options.syncLogId,
        `Failed to process creation batch ${batchIndex + 1} after 3 retries`,
      );
    }

    // Small delay between batches to prevent overwhelming the API
    if (batchIndex < batches.length - 1) {
      await sleep(100);
    }
  }

  // Log operation completion
  if (options.syncLogId) {
    await logMessage(
      ctx,
      options.syncLogId,
      "info",
      `Completed batched creation of Monday.com items: ${successCount} successful, ${failureCount} failed`,
      { boardId, successCount, failureCount },
    );
  }

  return { successCount, failureCount, results };
}

/**
 * Delete multiple items in Monday.com with batching
 */
export async function deleteMondayItemsBatched(
  ctx: MutationCtx,
  integration: MondayIntegration,
  itemIds: string[],
  options: {
    syncLogId?: Id<"mondaySyncLogs">;
    batchSize?: number;
  } = {},
): Promise<{
  successCount: number;
  failureCount: number;
  results: Array<{
    itemId: string;
    success: boolean;
    error?: string;
  }>;
}> {
  // Determine batch size
  const batchSize =
    options.batchSize ||
    integration.batchSizeOverride ||
    calculateOptimalBatchSize(itemIds.length, 200);

  // Split deletions into batches
  const batches = batchArray(itemIds, batchSize);

  // Initialize result variables
  let successCount = 0;
  let failureCount = 0;
  const results: Array<{
    itemId: string;
    success: boolean;
    error?: string;
  }> = [];

  // Log operation start
  if (options.syncLogId) {
    await logMessage(
      ctx,
      options.syncLogId,
      "info",
      `Starting batched deletion of ${itemIds.length} Monday.com items`,
      { batchSize, batchCount: batches.length },
    );
  }

  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    let retryCount = 0;
    let batchSuccess = false;

    // Retry logic for the batch
    while (!batchSuccess && retryCount < 3) {
      try {
        // Process each item in the batch
        for (const itemId of batch) {
          try {
            // MOCK IMPLEMENTATION:
            // This is where you would make the actual API call to Monday.com
            // For example:
            // const response = await mondayClient.api(`
            //   mutation ($itemId: ID!) {
            //     delete_item(item_id: $itemId) {
            //       id
            //     }
            //   }
            // `, { itemId });

            // Simulate API call
            await sleep(15);

            // Track API call
            apiCallMetrics.push({
              timestamp: Date.now(),
              success: true,
              endpoint: `items/${itemId}/delete`,
            });

            // Simulate success with 95% probability
            if (Math.random() > 0.05) {
              successCount++;
              results.push({
                itemId,
                success: true,
              });
            } else {
              // Simulate failure
              failureCount++;
              results.push({
                itemId,
                success: false,
                error: "Failed to delete item (simulated failure)",
              });
            }
          } catch (itemError) {
            // Handle individual item deletion failure
            failureCount++;
            results.push({
              itemId,
              success: false,
              error:
                itemError instanceof Error
                  ? itemError.message
                  : String(itemError),
            });

            // Log individual error
            if (options.syncLogId) {
              await logError(
                ctx,
                options.syncLogId,
                `Error deleting Monday.com item ${itemId}: ${itemError instanceof Error ? itemError.message : String(itemError)}`,
              );
            }
          }
        }

        // Batch completed successfully
        batchSuccess = true;

        // Update progress
        if (options.syncLogId) {
          const itemsProcessed = (batchIndex + 1) * batchSize;
          await updateSyncProgress(
            ctx,
            options.syncLogId,
            Math.min(itemsProcessed, itemIds.length),
            itemIds.length,
            `Deleting batch ${batchIndex + 1}/${batches.length}`,
          );
        }
      } catch (batchError) {
        retryCount++;

        // Check if this is a rate limit error
        if (
          batchError instanceof Error &&
          batchError.message.includes("rate limit")
        ) {
          // Log rate limit hit
          if (options.syncLogId) {
            await logMessage(
              ctx,
              options.syncLogId,
              "warning",
              `Rate limit hit during batch ${batchIndex + 1} deletion, waiting before retry (attempt ${retryCount}/3)`,
              { error: batchError.message },
            );
          }

          // Wait with exponential backoff
          await handleRateLimit(retryCount);
        } else {
          // Log other batch errors
          if (options.syncLogId) {
            await logError(
              ctx,
              options.syncLogId,
              `Error processing deletion batch ${batchIndex + 1}: ${batchError instanceof Error ? batchError.message : String(batchError)}`,
            );
          }

          // Add failures for all items in this batch
          for (const itemId of batch) {
            failureCount++;
            results.push({
              itemId,
              success: false,
              error: `Batch error: ${batchError instanceof Error ? batchError.message : String(batchError)}`,
            });
          }

          // Don't retry non-rate-limit errors
          break;
        }
      }
    }

    // If max retries reached without success, log as batch failure
    if (!batchSuccess && options.syncLogId) {
      await logError(
        ctx,
        options.syncLogId,
        `Failed to process deletion batch ${batchIndex + 1} after 3 retries`,
      );
    }

    // Small delay between batches to prevent overwhelming the API
    if (batchIndex < batches.length - 1) {
      await sleep(100);
    }
  }

  // Log operation completion
  if (options.syncLogId) {
    await logMessage(
      ctx,
      options.syncLogId,
      "info",
      `Completed batched deletion of Monday.com items: ${successCount} successful, ${failureCount} failed`,
      { successCount, failureCount },
    );
  }

  return { successCount, failureCount, results };
}
