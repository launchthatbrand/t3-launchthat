/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/**
 * Monday.com Sync Utilities
 *
 * This module contains helpers for synchronizing data between Convex and Monday.com.
 */

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import type {
  MondayBoardMapping,
  MondayColumnMapping,
  MondayIntegration,
  SyncStatus,
} from "./types";
import {
  createItem,
  createSubitem,
  formatConvexValueForMonday as formatValueForMonday,
  getBoardItemCount,
  getBoardItems,
  getSubitems,
  updateItem,
} from "./api";
import { SyncDirection } from "./types";
import { createSyncLog, logMessage, logError } from "./logging";
import { detectConflicts, createConflictRecord } from "./conflicts";
import { 
  fetchMondayItemsBatched, 
  updateMondayItemsBatched,
  createMondayItemsBatched,
  deleteMondayItemsBatched
} from "./optimizedApi";
import {
  PERFORMANCE_CONSTANTS,
  createOptimizedQueryFilters
} from "./performance";

/**
 * Create a sync log entry
 */
export async function createSyncLog(
  ctx: MutationCtx,
  operation: string,
  status: string,
  options?: {
    boardMappingId?: Id<"mondayBoardMappings">;
    mondayBoardId?: string;
    convexTable?: string;
  },
) {
  const now = Date.now();

  return await ctx.db.insert("mondaySyncLogs", {
    operation,
    startTimestamp: now,
    endTimestamp: now, // Will be updated when sync completes
    status,
    boardMappingId: options?.boardMappingId,
    convexTable: options?.convexTable,
    mondayBoardId: options?.mondayBoardId,
  });
}

/**
 * Update a sync log with results
 */
export async function updateSyncLog(
  ctx: MutationCtx,
  logId: Id<"mondaySyncLogs">,
  status: string,
  results?: {
    recordsProcessed?: number;
    recordsCreated?: number;
    recordsUpdated?: number;
    recordsFailed?: number;
    error?: string;
    errorDetails?: string;
  },
) {
  const now = Date.now();

  await ctx.db.patch(logId, {
    status,
    endTimestamp: now,
    recordsProcessed: results?.recordsProcessed,
    recordsCreated: results?.recordsCreated,
    recordsUpdated: results?.recordsUpdated,
    recordsFailed: results?.recordsFailed,
    error: results?.error,
    errorDetails: results?.errorDetails,
  });

  return logId;
}

/**
 * Update a board mapping's sync status
 */
export async function updateBoardMappingStatus(
  ctx: MutationCtx,
  mappingId: Id<"mondayBoardMappings">,
  syncStatus: SyncStatus,
  updateLastSync = true,
) {
  const updates: Record<string, unknown> = {
    syncStatus,
  };

  if (updateLastSync) {
    updates.lastSyncTimestamp = Date.now();
  }

  await ctx.db.patch(mappingId, updates);
}

/**
 * Generate random sync results for simulation
 */
export function generateSimulatedSyncResults() {
  const totalRecords = Math.floor(Math.random() * 100) + 5;
  const successRecords = Math.floor(Math.random() * totalRecords);
  const errorRecords = totalRecords - successRecords;

  return {
    recordsProcessed: totalRecords,
    recordsCreated: Math.floor(successRecords / 2),
    recordsUpdated: successRecords - Math.floor(successRecords / 2),
    recordsFailed: errorRecords,
    status: errorRecords > 0 ? "completed_with_errors" : "completed",
  };
}

/**
 * Convert a Monday.com column value to the appropriate Convex type
 */
export function convertMondayValueToConvex(
  columnValue: {
    id: string;
    text: string;
    value: string;
    type: string;
  },
  targetType: string,
): unknown {
  // If no value, return null
  if (!columnValue.value && !columnValue.text) {
    return null;
  }

  // Use text as fallback for value
  const rawValue = columnValue.value || columnValue.text;

  try {
    switch (targetType) {
      case "string":
        return columnValue.text;

      case "number":
        return parseFloat(columnValue.text);

      case "boolean":
        if (columnValue.type === "checkbox") {
          // Monday checkbox values are {"checked": true/false}
          try {
            const parsed = JSON.parse(rawValue) as { checked?: boolean };
            return parsed?.checked === true;
          } catch {
            return columnValue.text.toLowerCase() === "true";
          }
        }
        return columnValue.text.toLowerCase() === "true";

      case "date":
        // Monday date values are objects with date info
        if (columnValue.type === "date") {
          try {
            const parsed = JSON.parse(rawValue) as { date?: string };
            if (parsed?.date) {
              return new Date(parsed.date).getTime();
            }
          } catch {
            // Fall back to using the text value
          }
        }
        return new Date(columnValue.text).getTime();

      case "array":
        try {
          return JSON.parse(rawValue);
        } catch {
          return [columnValue.text];
        }

      case "object":
        try {
          return JSON.parse(rawValue);
        } catch {
          return { value: columnValue.text };
        }

      case "id":
        // For IDs, just return the text value
        return columnValue.text;

      default:
        // For unknown types, return the raw text
        return columnValue.text;
    }
  } catch (error) {
    console.error(
      `Error converting Monday value to Convex type ${targetType}:`,
      error,
    );
    // If conversion fails, return the original text
    return columnValue.text;
  }
}

/**
 * Transform Monday.com item data to Convex document data
 */
export function transformMondayItemToConvexDocument(
  mondayItem: {
    id: string;
    name: string;
    column_values: {
      id: string;
      text: string;
      value: string;
      type: string;
    }[];
  },
  columnMappings: MondayColumnMapping[],
): Record<string, unknown> {
  const document: Record<string, unknown> = {
    // Include Monday item ID for reference
    _mondayItemId: mondayItem.id,
    // Use name as a default field if no specific mapping
    name: mondayItem.name,
  };

  // Map each column value based on mappings
  for (const mapping of columnMappings) {
    if (!mapping.isEnabled) continue;

    const columnValue = mondayItem.column_values.find(
      (cv) => cv.id === mapping.mondayColumnId,
    );

    if (columnValue) {
      document[mapping.convexField] = convertMondayValueToConvex(
        columnValue,
        mapping.convexFieldType,
      );
    } else if (mapping.isRequired && mapping.defaultValue) {
      // Use default value for required fields if no value provided
      document[mapping.convexField] = mapping.defaultValue;
    }
  }

  return document;
}

/**
 * Compare Monday.com item with existing Convex document to detect changes
 */
export function detectChanges(
  mondayItemData: Record<string, unknown>,
  convexDocument: Record<string, unknown> | null,
): {
  hasChanges: boolean;
  changes: Record<string, unknown>;
} {
  if (!convexDocument) {
    // If no existing document, all fields are changes
    return {
      hasChanges: true,
      changes: mondayItemData,
    };
  }

  const changes: Record<string, unknown> = {};
  let hasChanges = false;

  // Compare each field in the Monday item data with the Convex document
  for (const [field, value] of Object.entries(mondayItemData)) {
    // Skip internal Convex fields
    if (field.startsWith("_") && field !== "_mondayItemId") {
      continue;
    }

    // Compare values - handle special cases like dates, arrays, objects
    let valueChanged = false;

    if (typeof value === "object" && value !== null) {
      // For objects and arrays, compare stringified versions
      const existingValue = convexDocument[field];
      valueChanged = JSON.stringify(value) !== JSON.stringify(existingValue);
    } else {
      // For primitive values, direct comparison
      valueChanged = value !== convexDocument[field];
    }

    if (valueChanged) {
      changes[field] = value;
      hasChanges = true;
    }
  }

  return {
    hasChanges,
    changes,
  };
}

/**
 * Get the mapping for a specific Monday.com item and Convex record
 */
export async function getItemMapping(
  ctx: MutationCtx,
  mondayItemId: string,
  mondayBoardId: string,
  convexTable?: string,
) {
  // Try to find by Monday item ID first
  const mapping = await ctx.db
    .query("mondayItemMappings")
    .withIndex("by_monday_item", (q) =>
      q.eq("mondayBoardId", mondayBoardId).eq("mondayItemId", mondayItemId),
    )
    .first();

  // If convex table is provided, make sure it matches
  if (mapping && convexTable && mapping.convexTable !== convexTable) {
    // This is unexpected - multiple tables mapping to the same Monday item
    console.warn(
      `Found mapping for item ${mondayItemId} but in different table ${mapping.convexTable} (expected ${convexTable})`,
    );
  }

  return mapping;
}

/**
 * Create or update the mapping between a Monday.com item and Convex record
 */
export async function saveItemMapping(
  ctx: MutationCtx,
  options: {
    mondayItemId: string;
    mondayBoardId: string;
    convexId: string;
    convexTable: string;
    boardMappingId: Id<"mondayBoardMappings">;
    isSubitem?: boolean;
    parentItemId?: string;
    existingMappingId?: Id<"mondayItemMappings">;
  },
) {
  const now = Date.now();

  if (options.existingMappingId) {
    // Update existing mapping
    await ctx.db.patch(options.existingMappingId, {
      convexId: options.convexId,
      lastSyncTimestamp: now,
      syncStatus: "synced",
    });
    return options.existingMappingId;
  } else {
    // Create new mapping
    return await ctx.db.insert("mondayItemMappings", {
      mondayItemId: options.mondayItemId,
      mondayBoardId: options.mondayBoardId,
      convexId: options.convexId,
      convexTable: options.convexTable,
      boardMappingId: options.boardMappingId,
      lastSyncTimestamp: now,
      syncStatus: "synced",
      isSubitem: options.isSubitem ?? false,
      parentItemId: options.parentItemId,
    });
  }
}

/**
 * Perform a pull sync operation from Monday.com to Convex
 */
export async function pullSyncFromMonday(
  ctx: MutationCtx,
  integration: MondayIntegration,
  boardMapping: MondayBoardMapping,
  columnMappings: MondayColumnMapping[],
  options?: {
    page?: number;
    limit?: number;
    processSubitems?: boolean;
    continuePaging?: boolean;
    maxPages?: number;
  },
): Promise<{
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  hasMorePages?: boolean;
  nextPage?: number;
  error?: string;
  errorDetails?: string;
}> {
  // Default values
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 100;
  const processSubitems =
    options?.processSubitems ?? boardMapping.supportsSubitems ?? false;
  const continuePaging = options?.continuePaging ?? false;
  // const maxPages = options?.maxPages ?? 5; // Unused for now, but may be used in future iterations

  // Skip if sync direction doesn't support pull
  if (
    boardMapping.syncDirection !== "pull" &&
    boardMapping.syncDirection !== "bidirectional"
  ) {
    return {
      success: false,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      error: "Board mapping does not support pull synchronization",
    };
  }

  try {
    // Step 1: Check total item count to determine pagination needs
    const countResult = await getBoardItemCount(
      integration.apiKey,
      boardMapping.mondayBoardId,
    );

    // Handle error in count result
    if (!countResult.success) {
      throw new Error(`Failed to get item count: ${countResult.message}`);
    }

    const totalItems = countResult.count;
    const totalPages = Math.ceil(totalItems / limit);
    const hasMorePages = page < totalPages;
    const nextPage = hasMorePages ? page + 1 : undefined;

    // Step 2: Fetch items from Monday.com for current page
    const itemsResult = await getBoardItems(
      integration.apiKey,
      boardMapping.mondayBoardId,
      {
        page,
        limit,
        includeColumnValues: true,
      },
    );

    if (!itemsResult.success) {
      return {
        success: false,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsFailed: 0,
        error: `Failed to fetch items from Monday.com: ${itemsResult.message}`,
      };
    }

    // Initialize counters
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;

    // Step 3: Process each item
    for (const mondayItem of itemsResult.items) {
      try {
        recordsProcessed++;

        // Transform Monday data to Convex document
        const documentData = transformMondayItemToConvexDocument(
          mondayItem,
          columnMappings,
        );

        // Check if a mapping already exists
        const existingMapping = await getItemMapping(
          ctx,
          mondayItem.id,
          boardMapping.mondayBoardId,
          boardMapping.convexTableName,
        );

        if (existingMapping) {
          // Existing mapping found - update the record
          // Get the existing Convex document
          const convexDoc = await ctx.db.get(
            existingMapping.convexId as Id<any>,
          );
          if (!convexDoc) {
            // Convex document no longer exists, recreate it
            const newId = await ctx.db.insert(
              boardMapping.convexTableName as string,
              documentData,
            );

            // Update the mapping with the new ID
            await saveItemMapping(ctx, {
              mondayItemId: mondayItem.id,
              mondayBoardId: boardMapping.mondayBoardId,
              convexId: newId,
              convexTable: boardMapping.convexTableName,
              boardMappingId: boardMapping._id,
              existingMappingId: existingMapping._id,
            });

            recordsCreated++;
          } else {
            // Check for changes
            const { hasChanges, changes } = detectChanges(
              documentData,
              convexDoc,
            );

            if (hasChanges) {
              // Update the Convex document with changes
              await ctx.db.patch(existingMapping.convexId as Id<any>, changes);
              recordsUpdated++;
            }

            // Update mapping timestamps even if no changes
            await saveItemMapping(ctx, {
              mondayItemId: mondayItem.id,
              mondayBoardId: boardMapping.mondayBoardId,
              convexId: existingMapping.convexId,
              convexTable: boardMapping.convexTableName,
              boardMappingId: boardMapping._id,
              existingMappingId: existingMapping._id,
            });
          }
        } else {
          // No mapping exists - create a new record
          const newId = await ctx.db.insert(
            boardMapping.convexTableName as string,
            documentData,
          );

          // Create a new mapping
          await saveItemMapping(ctx, {
            mondayItemId: mondayItem.id,
            mondayBoardId: boardMapping.mondayBoardId,
            convexId: newId,
            convexTable: boardMapping.convexTableName,
            boardMappingId: boardMapping._id,
          });

          recordsCreated++;
        }

        // Process subitems if enabled
        if (processSubitems) {
          try {
            const subitemsResult = await getSubitems(
              integration.apiKey,
              mondayItem.id,
              true,
            );

            if (subitemsResult.success && subitemsResult.subitems.length > 0) {
              // Process each subitem
              for (const subitem of subitemsResult.subitems) {
                try {
                  recordsProcessed++;

                  // Transform subitem data
                  const subitemData = transformMondayItemToConvexDocument(
                    subitem,
                    columnMappings,
                  );

                  // Add parent reference
                  if (existingMapping) {
                    subitemData.parentId = existingMapping.convexId;
                  }

                  // Check if mapping exists for subitem
                  const existingSubitemMapping = await getItemMapping(
                    ctx,
                    subitem.id,
                    boardMapping.mondayBoardId,
                    boardMapping.convexTableName,
                  );

                  if (existingSubitemMapping) {
                    // Update existing subitem
                    const subitemDoc = await ctx.db.get(
                      existingSubitemMapping.convexId as Id<any>,
                    );
                    if (!subitemDoc) {
                      // Recreate if document doesn't exist
                      const newSubitemId = await ctx.db.insert(
                        boardMapping.convexTableName as string,
                        subitemData,
                      );

                      await saveItemMapping(ctx, {
                        mondayItemId: subitem.id,
                        mondayBoardId: boardMapping.mondayBoardId,
                        convexId: newSubitemId,
                        convexTable: boardMapping.convexTableName,
                        boardMappingId: boardMapping._id,
                        isSubitem: true,
                        parentItemId: mondayItem.id,
                        existingMappingId: existingSubitemMapping._id,
                      });

                      recordsCreated++;
                    } else {
                      // Check for changes
                      const { hasChanges, changes } = detectChanges(
                        subitemData,
                        subitemDoc,
                      );

                      if (hasChanges) {
                        await ctx.db.patch(
                          existingSubitemMapping.convexId as Id<any>,
                          changes,
                        );
                        recordsUpdated++;
                      }

                      // Update mapping
                      await saveItemMapping(ctx, {
                        mondayItemId: subitem.id,
                        mondayBoardId: boardMapping.mondayBoardId,
                        convexId: existingSubitemMapping.convexId,
                        convexTable: boardMapping.convexTableName,
                        boardMappingId: boardMapping._id,
                        isSubitem: true,
                        parentItemId: mondayItem.id,
                        existingMappingId: existingSubitemMapping._id,
                      });
                    }
                  } else {
                    // Create new subitem
                    const newSubitemId = await ctx.db.insert(
                      boardMapping.convexTableName as string,
                      subitemData,
                    );

                    await saveItemMapping(ctx, {
                      mondayItemId: subitem.id,
                      mondayBoardId: boardMapping.mondayBoardId,
                      convexId: newSubitemId,
                      convexTable: boardMapping.convexTableName,
                      boardMappingId: boardMapping._id,
                      isSubitem: true,
                      parentItemId: mondayItem.id,
                    });

                    recordsCreated++;
                  }
                } catch (subitemError) {
                  console.error(
                    `Error processing subitem ${subitem.id}:`,
                    subitemError,
                  );
                  recordsFailed++;
                }
              }
            }
          } catch (subitemsError) {
            console.error(
              `Error fetching subitems for ${mondayItem.id}:`,
              subitemsError,
            );
            // Don't count subitem fetch errors as failed records
          }
        }
      } catch (itemError) {
        console.error(`Error processing item ${mondayItem.id}:`, itemError);
        recordsFailed++;
      }
    }

    // Update sync status on board mapping if this is the final page or not using pagination
    if (!hasMorePages || !continuePaging) {
      const status = recordsFailed > 0 ? "partial" : "synced";
      await updateBoardMappingStatus(
        ctx,
        boardMapping._id,
        status as SyncStatus,
      );
    }

    return {
      success: true,
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      recordsFailed,
      hasMorePages,
      nextPage,
    };
  } catch (error) {
    console.error("Error in pull sync:", error);

    // Update board mapping status to error
    await updateBoardMappingStatus(ctx, boardMapping._id, "error");

    return {
      success: false,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      error: error instanceof Error ? error.message : "Unknown error",
      errorDetails: error instanceof Error ? error.stack : undefined,
    };
  }
}

/**
 * Transform Convex document to Monday.com column values
 */
export function transformConvexDocumentToMondayItem(
  convexDocument: Record<string, unknown>,
  columnMappings: MondayColumnMapping[],
): {
  name: string;
  columnValues: Record<string, unknown>;
} {
  // Use name field as default item name if it exists
  const name = (convexDocument.name as string) ?? "New Item";
  const columnValues: Record<string, unknown> = {};

  // Map each Convex field to Monday column based on mappings
  for (const mapping of columnMappings) {
    if (!mapping.isEnabled) continue;

    const fieldValue = convexDocument[mapping.convexField];
    if (fieldValue !== undefined) {
      const mondayValue = formatValueForMonday(
        fieldValue,
        mapping.mondayColumnType,
      );

      // Add to column values using the Monday column ID
      columnValues[mapping.mondayColumnId] = mondayValue;
    }
  }

  return { name, columnValues };
}

/**
 * Perform a push sync operation from Convex to Monday.com
 */
export async function pushSyncToMonday(
  ctx: MutationCtx,
  integration: MondayIntegration,
  boardMapping: MondayBoardMapping,
  columnMappings: MondayColumnMapping[],
  options?: {
    limit?: number;
    processSubitems?: boolean;
    updatedSince?: number;
  },
): Promise<{
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  error?: string;
  errorDetails?: string;
}> {
  // Skip if sync direction doesn't support push
  if (
    boardMapping.syncDirection !== "push" &&
    boardMapping.syncDirection !== "bidirectional"
  ) {
    return {
      success: false,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      error: "Board mapping does not support push synchronization",
    };
  }

  try {
    // Default values
    const limit = options?.limit ?? 100;
    const processSubitems =
      options?.processSubitems ?? boardMapping.supportsSubitems ?? false;
    const updatedSince =
      options?.updatedSince ?? boardMapping.lastSyncTimestamp ?? 0;

    // Step 1: Query Convex for records that need to be synced
    // Using any type to bypass TypeScript's strict table name checking
    // Since we're using dynamic table names from the configuration
    const tableName = boardMapping.convexTableName;

    // Need to use any type here because the table and field names are dynamic
    // and not known at compile time
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const convexQuery = ctx.db.query(tableName as any);

    // Most tables have an _updatedAt field, but we need to handle cases where it might not exist
    if (updatedSince > 0) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        convexQuery.filter((q) =>
          q.gt(q.field("_updatedAt") as any, updatedSince),
        );
      } catch (error) {
        // If _updatedAt field doesn't exist, just skip filtering
        console.warn(
          `Table ${tableName} might not have _updatedAt field, skipping time-based filtering`,
        );
      }
    }

    const convexRecords = await convexQuery.take(limit);

    // Initialize counters
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;

    // Step 2: Process each Convex document
    for (const convexDoc of convexRecords) {
      try {
        recordsProcessed++;

        // Transform Convex document to Monday.com format
        const { name, columnValues } = transformConvexDocumentToMondayItem(
          convexDoc as Record<string, unknown>,
          columnMappings,
        );

        // Check if a mapping already exists
        const existingMapping = await ctx.db
          .query("mondayItemMappings")
          .withIndex("by_convex_id", (q) =>
            q
              .eq("convexTable", boardMapping.convexTableName)
              .eq("convexId", convexDoc._id as string),
          )
          .first();

        if (existingMapping) {
          // Update existing item in Monday.com
          const updateResult = await updateItem(
            integration.apiKey,
            existingMapping.mondayItemId,
            boardMapping.mondayBoardId,
            columnValues,
          );

          if (updateResult.success) {
            recordsUpdated++;

            // Update the mapping with latest sync info
            await saveItemMapping(ctx, {
              mondayItemId: existingMapping.mondayItemId,
              mondayBoardId: boardMapping.mondayBoardId,
              convexId: convexDoc._id as string,
              convexTable: boardMapping.convexTableName,
              boardMappingId: boardMapping._id,
              existingMappingId: existingMapping._id,
            });
          } else {
            recordsFailed++;
            console.error(
              `Failed to update Monday.com item: ${updateResult.message}`,
            );
          }
        } else {
          // Create a new item in Monday.com
          const createResult = await createItem(
            integration.apiKey,
            boardMapping.mondayBoardId,
            name,
            columnValues,
          );

          if (createResult.success && createResult.item) {
            recordsCreated++;

            // Create a new mapping
            await saveItemMapping(ctx, {
              mondayItemId: createResult.item.id,
              mondayBoardId: boardMapping.mondayBoardId,
              convexId: convexDoc._id as string,
              convexTable: boardMapping.convexTableName,
              boardMappingId: boardMapping._id,
            });
          } else {
            recordsFailed++;
            console.error(
              `Failed to create Monday.com item: ${createResult.message}`,
            );
          }
        }

        // Process subitems if enabled
        if (processSubitems && boardMapping.parentField) {
          try {
            // Look for records that have this record as their parent
            const parentFieldName = boardMapping.parentField;

            // Need to use any type because we're dealing with dynamic field names
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const subitemQuery = ctx.db.query(tableName as any);

            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              subitemQuery.filter((q) =>
                q.eq(q.field(parentFieldName) as any, convexDoc._id as any),
              );
            } catch (error) {
              console.warn(
                `Field ${parentFieldName} might not exist in table ${tableName}, skipping subitems`,
              );
              continue;
            }

            const subitems = await subitemQuery.take(50);

            for (const subitem of subitems) {
              try {
                recordsProcessed++;

                // Transform subitem to Monday.com format
                const { name: subitemName, columnValues: subitemValues } =
                  transformConvexDocumentToMondayItem(
                    subitem as Record<string, unknown>,
                    columnMappings,
                  );

                // Check if mapping exists
                const existingSubitemMapping = await ctx.db
                  .query("mondayItemMappings")
                  .withIndex("by_convex_id", (q) =>
                    q
                      .eq("convexTable", boardMapping.convexTableName)
                      .eq("convexId", subitem._id as string),
                  )
                  .first();

                if (existingSubitemMapping) {
                  // Update existing subitem
                  const updateResult = await updateItem(
                    integration.apiKey,
                    existingSubitemMapping.mondayItemId,
                    boardMapping.mondayBoardId,
                    subitemValues,
                  );

                  if (updateResult.success) {
                    recordsUpdated++;

                    // Update mapping
                    await saveItemMapping(ctx, {
                      mondayItemId: existingSubitemMapping.mondayItemId,
                      mondayBoardId: boardMapping.mondayBoardId,
                      convexId: subitem._id as string,
                      convexTable: boardMapping.convexTableName,
                      boardMappingId: boardMapping._id,
                      isSubitem: true,
                      parentItemId: existingMapping?.mondayItemId,
                      existingMappingId: existingSubitemMapping._id,
                    });
                  } else {
                    recordsFailed++;
                  }
                } else if (existingMapping) {
                  // Create new subitem
                  const createResult = await createSubitem(
                    integration.apiKey,
                    existingMapping.mondayItemId,
                    subitemName,
                    subitemValues,
                  );

                  if (createResult.success && createResult.item) {
                    recordsCreated++;

                    // Create mapping for subitem
                    await saveItemMapping(ctx, {
                      mondayItemId: createResult.item.id,
                      mondayBoardId: boardMapping.mondayBoardId,
                      convexId: subitem._id as string,
                      convexTable: boardMapping.convexTableName,
                      boardMappingId: boardMapping._id,
                      isSubitem: true,
                      parentItemId: existingMapping.mondayItemId,
                    });
                  } else {
                    recordsFailed++;
                  }
                }
              } catch (subitemError) {
                console.error(
                  `Error processing subitem ${subitem._id}:`,
                  subitemError,
                );
                recordsFailed++;
              }
            }
          } catch (subitemsError) {
            console.error(
              `Error fetching subitems for ${convexDoc._id}:`,
              subitemsError,
            );
            // Don't count subitem fetch errors as failed records
          }
        }
      } catch (itemError) {
        console.error(`Error processing item ${convexDoc._id}:`, itemError);
        recordsFailed++;
      }
    }

    // Update sync status on board mapping
    const status = recordsFailed > 0 ? "partial" : "synced";
    await updateBoardMappingStatus(ctx, boardMapping._id, status as SyncStatus);

    return {
      success: true,
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      recordsFailed,
    };
  } catch (error) {
    console.error("Error in push sync:", error);

    // Update board mapping status to error
    await updateBoardMappingStatus(ctx, boardMapping._id, "error");

    return {
      success: false,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      error: error instanceof Error ? error.message : "Unknown error",
      errorDetails: error instanceof Error ? error.stack : undefined,
    };
  }
}

/**
 * Monday.com Synchronization Service
 * 
 * Handles data synchronization between Monday.com and Convex with optimized performance
 * for large datasets.
 */

/**
 * Perform an optimized sync from Monday.com to Convex
 */
export async function performOptimizedPullSync(
  ctx: MutationCtx,
  integrationId: Id<"mondayIntegration">,
  boardMappingId: Id<"mondayBoardMappings">,
  options: {
    forceFullSync?: boolean;
    batchSize?: number;
    pageSize?: number;
    onlyUpdatedSince?: number;
    progressCallback?: (current: number, total: number, message: string) => Promise<void>;
  } = {}
): Promise<{
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsFailed: number;
  conflictsDetected: number;
  timeTaken: number;
  syncLogId: Id<"mondaySyncLogs">;
}> {
  const startTime = Date.now();
  
  // Get integration and board mapping
  const integration = await ctx.db.get(integrationId);
  const boardMapping = await ctx.db.get(boardMappingId);
  
  if (!integration) {
    throw new Error(`Integration with ID ${integrationId} not found`);
  }
  
  if (!boardMapping) {
    throw new Error(`Board mapping with ID ${boardMappingId} not found`);
  }
  
  // Create sync log
  const syncLogId = await createSyncLog(ctx, {
    status: "running",
    syncType: "pull",
    syncDirection: "monday_to_convex",
    startTimestamp: startTime,
    integrationId,
    boardMappingId,
    mondayBoardId: boardMapping.mondayBoardId,
    entityType: "item",
    message: `Starting optimized pull sync for board ${boardMapping.mondayBoardName}`,
  });
  
  try {
    await logMessage(
      ctx,
      syncLogId,
      "info",
      `Starting optimized pull sync from Monday.com board "${boardMapping.mondayBoardName}" to Convex table "${boardMapping.convexTable}"`,
      { 
        mondayBoardId: boardMapping.mondayBoardId,
        convexTable: boardMapping.convexTable,
        forceFull: options.forceFullSync
      }
    );
    
    // Initialize counters
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;
    let recordsFailed = 0;
    let conflictsDetected = 0;
    
    // Determine timestamp to use for filtering
    const lastSyncTimestamp = options.forceFullSync 
      ? undefined 
      : options.onlyUpdatedSince ?? boardMapping.lastSyncTimestamp;
    
    // Fetch items from Monday.com with batching and pagination
    const mondayItems = await fetchMondayItemsBatched(
      ctx,
      integration,
      boardMapping.mondayBoardId,
      {
        pageSize: options.pageSize ?? integration.preferredPageSize ?? PERFORMANCE_CONSTANTS.DEFAULT_PAGE_SIZE,
        syncLogId,
        onlyUpdatedSince: lastSyncTimestamp,
        // Add any additional filters from the board mapping
        filter: boardMapping.syncFilters ? JSON.parse(boardMapping.syncFilters) : undefined
      }
    );
    
    await logMessage(
      ctx,
      syncLogId,
      "info",
      `Retrieved ${mondayItems.length} items from Monday.com board`,
      { itemCount: mondayItems.length }
    );
    
    // Process the items in batches
    if (mondayItems.length > 0) {
      // Get column mappings from the board mapping
      const columnMappings = boardMapping.columnMappings 
        ? JSON.parse(boardMapping.columnMappings) 
        : {};
      
      // Determine batch size
      const batchSize = options.batchSize ?? 
        integration.batchSizeOverride ?? 
        PERFORMANCE_CONSTANTS.DEFAULT_BATCH_SIZE;
      
      // Process items in batches
      for (let i = 0; i < mondayItems.length; i += batchSize) {
        const batchItems = mondayItems.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(mondayItems.length / batchSize);
        
        await logMessage(
          ctx,
          syncLogId,
          "info",
          `Processing batch ${batchNumber}/${totalBatches} (${batchItems.length} items)`,
          { batchNumber, totalBatches, batchSize: batchItems.length }
        );
        
        // Process each item in the batch
        for (const mondayItem of batchItems) {
          try {
            // Track progress
            recordsProcessed++;
            
            // Convert Monday.com item to Convex format
            const convexData = await convertMondayItemToConvexData(
              mondayItem,
              columnMappings,
              boardMapping.convexTable
            );
            
            // Check if item already exists in Convex (by Monday ID)
            const existingItems = await ctx.db
              .query(boardMapping.convexTable)
              .withIndex("by_monday_id", (q) => 
                q.eq("mondayItemId", mondayItem.id)
              )
              .collect();
            
            if (existingItems.length > 0) {
              // Item exists, update it
              const existingItem = existingItems[0];
              
              // Check for conflicts before updating
              const conflicts = await detectConflicts(
                ctx,
                {
                  mondayItem,
                  convexItem: existingItem,
                  boardMappingId,
                  columnMappings
                }
              );
              
              if (conflicts.hasConflicts) {
                // Log conflicts and create conflict records
                conflictsDetected += conflicts.conflictingFields.length;
                
                await logMessage(
                  ctx,
                  syncLogId,
                  "warning",
                  `Detected ${conflicts.conflictingFields.length} conflicts for item "${mondayItem.name}" (ID: ${mondayItem.id})`,
                  { 
                    itemId: mondayItem.id,
                    itemName: mondayItem.name,
                    conflictingFields: conflicts.conflictingFields
                  }
                );
                
                // Create conflict record for each conflicting field
                for (const field of conflicts.conflictingFields) {
                  await createConflictRecord(
                    ctx,
                    {
                      boardMappingId,
                      mondayItemId: mondayItem.id,
                      convexId: existingItem._id,
                      fieldName: field.fieldName,
                      mondayValue: field.mondayValue,
                      convexValue: field.convexValue,
                      resolutionStrategy: boardMapping.defaultConflictResolution || "manual",
                      status: "pending",
                      detectedAt: Date.now()
                    }
                  );
                }
                
                // Skip update if using manual conflict resolution
                if (boardMapping.defaultConflictResolution === "manual") {
                  recordsSkipped++;
                  continue;
                }
                
                // Apply conflict resolution if not manual
                // This would apply the configured resolution strategy
                // For now, we'll default to Monday wins for non-manual strategies
                if (
                  boardMapping.defaultConflictResolution === "monday_wins" ||
                  boardMapping.defaultConflictResolution === "latest_wins"
                ) {
                  // Update the item
                  await ctx.db.patch(existingItem._id, convexData);
                  recordsUpdated++;
                } else if (boardMapping.defaultConflictResolution === "convex_wins") {
                  // Skip update, keep Convex data
                  recordsSkipped++;
                }
              } else {
                // No conflicts, update the item
                await ctx.db.patch(existingItem._id, convexData);
                recordsUpdated++;
              }
            } else {
              // Item doesn't exist, create it
              await ctx.db.insert(boardMapping.convexTable, convexData);
              recordsCreated++;
            }
          } catch (itemError) {
            // Log the error and continue with the next item
            recordsFailed++;
            
            await logError(
              ctx,
              syncLogId,
              `Error processing Monday.com item "${mondayItem.name}" (ID: ${mondayItem.id}): ${itemError instanceof Error ? itemError.message : String(itemError)}`,
              itemError instanceof Error ? itemError : new Error(String(itemError))
            );
          }
          
          // Update progress
          if (options.progressCallback) {
            await options.progressCallback(
              recordsProcessed,
              mondayItems.length,
              `Processed ${recordsProcessed} of ${mondayItems.length} items`
            );
          }
        }
      }
    }
    
    // Update the board mapping with the sync timestamp
    await ctx.db.patch(boardMappingId, {
      lastSyncTimestamp: Date.now(),
      lastSyncStatus: "success",
      lastSyncMessage: `Successfully synced ${recordsProcessed} items (${recordsCreated} created, ${recordsUpdated} updated, ${recordsSkipped} skipped, ${recordsFailed} failed)`,
      itemCount: mondayItems.length
    });
    
    // Update the sync log
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    
    await ctx.db.patch(syncLogId, {
      status: "completed",
      endTimestamp: endTime,
      recordsProcessed,
      details: JSON.stringify({
        recordsCreated,
        recordsUpdated,
        recordsSkipped,
        recordsFailed,
        conflictsDetected,
        timeTaken,
        itemCount: mondayItems.length,
        startTime,
        endTime
      })
    });
    
    await logMessage(
      ctx,
      syncLogId,
      "info",
      `Completed optimized pull sync: ${recordsProcessed} items processed in ${Math.round(timeTaken / 1000)} seconds`,
      {
        recordsCreated,
        recordsUpdated,
        recordsSkipped,
        recordsFailed,
        conflictsDetected,
        timeTaken,
        itemCount: mondayItems.length
      }
    );
    
    return {
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      recordsSkipped,
      recordsFailed,
      conflictsDetected,
      timeTaken,
      syncLogId
    };
  } catch (error) {
    // Log the error and update the sync log
    const endTime = Date.now();
    
    await ctx.db.patch(syncLogId, {
      status: "error",
      endTimestamp: endTime,
      error: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error && error.stack ? error.stack : undefined
    });
    
    await logError(
      ctx,
      syncLogId,
      `Optimized pull sync failed: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : new Error(String(error))
    );
    
    throw error;
  }
}

/**
 * Perform an optimized sync from Convex to Monday.com
 */
export async function performOptimizedPushSync(
  ctx: MutationCtx,
  integrationId: Id<"mondayIntegration">,
  boardMappingId: Id<"mondayBoardMappings">,
  options: {
    forceFullSync?: boolean;
    batchSize?: number;
    onlyUpdatedSince?: number;
    progressCallback?: (current: number, total: number, message: string) => Promise<void>;
  } = {}
): Promise<{
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsFailed: number;
  timeTaken: number;
  syncLogId: Id<"mondaySyncLogs">;
}> {
  const startTime = Date.now();
  
  // Get integration and board mapping
  const integration = await ctx.db.get(integrationId);
  const boardMapping = await ctx.db.get(boardMappingId);
  
  if (!integration) {
    throw new Error(`Integration with ID ${integrationId} not found`);
  }
  
  if (!boardMapping) {
    throw new Error(`Board mapping with ID ${boardMappingId} not found`);
  }
  
  // Create sync log
  const syncLogId = await createSyncLog(ctx, {
    status: "running",
    syncType: "push",
    syncDirection: "convex_to_monday",
    startTimestamp: startTime,
    integrationId,
    boardMappingId,
    mondayBoardId: boardMapping.mondayBoardId,
    entityType: "item",
    message: `Starting optimized push sync for board ${boardMapping.mondayBoardName}`,
  });
  
  try {
    await logMessage(
      ctx,
      syncLogId,
      "info",
      `Starting optimized push sync from Convex table "${boardMapping.convexTable}" to Monday.com board "${boardMapping.mondayBoardName}"`,
      { 
        mondayBoardId: boardMapping.mondayBoardId,
        convexTable: boardMapping.convexTable,
        forceFull: options.forceFullSync
      }
    );
    
    // Initialize counters
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;
    let recordsFailed = 0;
    
    // Determine timestamp to use for filtering
    const lastSyncTimestamp = options.forceFullSync 
      ? undefined 
      : options.onlyUpdatedSince ?? boardMapping.lastSyncTimestamp;
    
    // Query for Convex items
    let convexQuery = ctx.db.query(boardMapping.convexTable);
    
    // Apply timestamp filter if not doing full sync
    if (lastSyncTimestamp) {
      convexQuery = convexQuery.filter((q) => 
        q.gt(q.field("_creationTime"), lastSyncTimestamp as number) ||
        (
          q.neq(q.field("_updatedAt"), undefined) &&
          q.gt(q.field("_updatedAt"), lastSyncTimestamp as number)
        )
      );
    }
    
    const convexItems = await convexQuery.collect();
    
    await logMessage(
      ctx,
      syncLogId,
      "info",
      `Retrieved ${convexItems.length} items from Convex table`,
      { itemCount: convexItems.length }
    );
    
    // Process the items in batches
    if (convexItems.length > 0) {
      // Get column mappings from the board mapping
      const columnMappings = boardMapping.columnMappings 
        ? JSON.parse(boardMapping.columnMappings) 
        : {};
      
      // Determine batch size
      const batchSize = options.batchSize ?? 
        integration.batchSizeOverride ?? 
        PERFORMANCE_CONSTANTS.DEFAULT_BATCH_SIZE;
      
      // Separate items into those with Monday IDs (updates) and those without (creates)
      const itemsToUpdate = convexItems.filter(item => item.mondayItemId);
      const itemsToCreate = convexItems.filter(item => !item.mondayItemId);
      
      // Process updates
      if (itemsToUpdate.length > 0) {
        // Prepare update batches
        const updateBatches = [];
        for (let i = 0; i < itemsToUpdate.length; i += batchSize) {
          updateBatches.push(itemsToUpdate.slice(i, i + batchSize));
        }
        
        // Process each update batch
        for (let batchIndex = 0; batchIndex < updateBatches.length; batchIndex++) {
          const batchItems = updateBatches[batchIndex];
          
          await logMessage(
            ctx,
            syncLogId,
            "info",
            `Processing update batch ${batchIndex + 1}/${updateBatches.length} (${batchItems.length} items)`,
            { batchIndex: batchIndex + 1, totalBatches: updateBatches.length, batchSize: batchItems.length }
          );
          
          // Convert Convex items to Monday format
          const itemUpdates = await Promise.all(batchItems.map(async (item) => {
            return {
              itemId: item.mondayItemId as string,
              columnValues: await convertConvexItemToMondayColumnValues(item, columnMappings)
            };
          }));
          
          // Send batch update to Monday.com
          const updateResult = await updateMondayItemsBatched(
            ctx,
            integration,
            boardMapping.mondayBoardId,
            itemUpdates,
            { syncLogId }
          );
          
          // Update counters
          recordsProcessed += itemUpdates.length;
          recordsUpdated += updateResult.successCount;
          recordsFailed += updateResult.failureCount;
          
          // Update progress
          if (options.progressCallback) {
            const processedSoFar = itemsToCreate.length + (batchIndex + 1) * batchSize;
            await options.progressCallback(
              processedSoFar,
              convexItems.length,
              `Processed ${processedSoFar} of ${convexItems.length} items (updating batch ${batchIndex + 1}/${updateBatches.length})`
            );
          }
        }
      }
      
      // Process creates
      if (itemsToCreate.length > 0) {
        // Prepare create batches
        const createBatches = [];
        for (let i = 0; i < itemsToCreate.length; i += batchSize) {
          createBatches.push(itemsToCreate.slice(i, i + batchSize));
        }
        
        // Process each create batch
        for (let batchIndex = 0; batchIndex < createBatches.length; batchIndex++) {
          const batchItems = createBatches[batchIndex];
          
          await logMessage(
            ctx,
            syncLogId,
            "info",
            `Processing create batch ${batchIndex + 1}/${createBatches.length} (${batchItems.length} items)`,
            { batchIndex: batchIndex + 1, totalBatches: createBatches.length, batchSize: batchItems.length }
          );
          
          // Convert Convex items to Monday format
          const itemCreations = await Promise.all(batchItems.map(async (item) => {
            return {
              itemName: getItemName(item),
              columnValues: await convertConvexItemToMondayColumnValues(item, columnMappings)
            };
          }));
          
          // Send batch create to Monday.com
          const createResult = await createMondayItemsBatched(
            ctx,
            integration,
            boardMapping.mondayBoardId,
            itemCreations,
            { syncLogId }
          );
          
          // Update counters
          recordsProcessed += itemCreations.length;
          recordsCreated += createResult.successCount;
          recordsFailed += createResult.failureCount;
          
          // Update Convex items with the new Monday IDs
          for (let i = 0; i < createResult.results.length; i++) {
            const result = createResult.results[i];
            if (result.success && result.itemId) {
              const convexItemIndex = result.index;
              const convexItem = batchItems[convexItemIndex];
              
              // Update the Convex item with the Monday item ID
              await ctx.db.patch(convexItem._id, {
                mondayItemId: result.itemId
              });
            }
          }
          
          // Update progress
          if (options.progressCallback) {
            const processedSoFar = itemsToUpdate.length + (batchIndex + 1) * batchSize;
            await options.progressCallback(
              processedSoFar,
              convexItems.length,
              `Processed ${processedSoFar} of ${convexItems.length} items (creating batch ${batchIndex + 1}/${createBatches.length})`
            );
          }
        }
      }
    }
    
    // Update the board mapping with the sync timestamp
    await ctx.db.patch(boardMappingId, {
      lastSyncTimestamp: Date.now(),
      lastSyncStatus: "success",
      lastSyncMessage: `Successfully synced ${recordsProcessed} items (${recordsCreated} created, ${recordsUpdated} updated, ${recordsSkipped} skipped, ${recordsFailed} failed)`,
      itemCount: convexItems.length
    });
    
    // Update the sync log
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    
    await ctx.db.patch(syncLogId, {
      status: "completed",
      endTimestamp: endTime,
      recordsProcessed,
      details: JSON.stringify({
        recordsCreated,
        recordsUpdated,
        recordsSkipped,
        recordsFailed,
        timeTaken,
        itemCount: convexItems.length,
        startTime,
        endTime
      })
    });
    
    await logMessage(
      ctx,
      syncLogId,
      "info",
      `Completed optimized push sync: ${recordsProcessed} items processed in ${Math.round(timeTaken / 1000)} seconds`,
      {
        recordsCreated,
        recordsUpdated,
        recordsSkipped,
        recordsFailed,
        timeTaken,
        itemCount: convexItems.length
      }
    );
    
    return {
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      recordsSkipped,
      recordsFailed,
      timeTaken,
      syncLogId
    };
  } catch (error) {
    // Log the error and update the sync log
    const endTime = Date.now();
    
    await ctx.db.patch(syncLogId, {
      status: "error",
      endTimestamp: endTime,
      error: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error && error.stack ? error.stack : undefined
    });
    
    await logError(
      ctx,
      syncLogId,
      `Optimized push sync failed: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : new Error(String(error))
    );
    
    throw error;
  }
}

/**
 * Helpers to convert between Monday.com and Convex data formats
 */

/**
 * Convert a Monday.com item to Convex data format
 */
async function convertMondayItemToConvexData(
  mondayItem: Record<string, unknown>,
  columnMappings: Record<string, string>,
  convexTable: string
): Promise<Record<string, unknown>> {
  const convexData: Record<string, unknown> = {
    mondayItemId: mondayItem.id,
    mondayName: mondayItem.name,
    lastMondayUpdate: mondayItem.updated_at
  };
  
  // Process column values
  const columnValues = mondayItem.column_values as Array<{
    id: string;
    title: string;
    value: string;
    text: string;
  }>;
  
  // Map each Monday.com column to its corresponding Convex field
  for (const column of columnValues) {
    const convexField = columnMappings[column.id];
    
    if (convexField) {
      // Handle different column types appropriately
      if (column.value) {
        try {
          // Most Monday.com column types store their data as JSON strings
          const valueObj = JSON.parse(column.value);
          
          // Handle different column types
          if (column.id.includes("date")) {
            // Date columns
            convexData[convexField] = valueObj.date ? new Date(valueObj.date).getTime() : null;
          } else if (column.id.includes("status")) {
            // Status columns
            convexData[convexField] = column.text;
          } else if (column.id.includes("number")) {
            // Number columns
            convexData[convexField] = parseFloat(column.text);
          } else if (column.id.includes("checkbox")) {
            // Checkbox columns
            convexData[convexField] = valueObj.checked;
          } else if (column.id.includes("dropdown")) {
            // Dropdown columns
            convexData[convexField] = column.text;
          } else {
            // Default to using the text representation
            convexData[convexField] = column.text;
          }
        } catch (e) {
          // If JSON parsing fails, use the text value
          convexData[convexField] = column.text || column.value;
        }
      } else {
        // Empty values
        convexData[convexField] = null;
      }
    }
  }
  
  return convexData;
}

/**
 * Convert a Convex item to Monday.com column values
 */
async function convertConvexItemToMondayColumnValues(
  convexItem: Record<string, unknown>,
  columnMappings: Record<string, string>
): Promise<Record<string, unknown>> {
  const columnValues: Record<string, unknown> = {};
  
  // Create a reverse mapping (Convex field -> Monday column)
  const reverseMapping: Record<string, string> = {};
  for (const [mondayCol, convexField] of Object.entries(columnMappings)) {
    reverseMapping[convexField] = mondayCol;
  }
  
  // Map each Convex field to its corresponding Monday.com column
  for (const [convexField, mondayCol] of Object.entries(reverseMapping)) {
    if (convexItem[convexField] !== undefined) {
      // Handle different data types appropriately
      const value = convexItem[convexField];
      
      if (mondayCol.includes("date")) {
        // Date columns
        if (value !== null) {
          const dateValue = typeof value === "number" 
            ? new Date(value).toISOString().split("T")[0]
            : String(value);
          
          columnValues[mondayCol] = JSON.stringify({ date: dateValue });
        }
      } else if (mondayCol.includes("status")) {
        // Status columns (need to convert to index or label format based on board settings)
        columnValues[mondayCol] = String(value);
      } else if (mondayCol.includes("number")) {
        // Number columns
        columnValues[mondayCol] = typeof value === "number" ? value : parseFloat(String(value));
      } else if (mondayCol.includes("checkbox")) {
        // Checkbox columns
        columnValues[mondayCol] = JSON.stringify({ checked: Boolean(value) });
      } else if (mondayCol.includes("dropdown")) {
        // Dropdown columns
        columnValues[mondayCol] = String(value);
      } else {
        // Default to string for text columns
        columnValues[mondayCol] = String(value);
      }
    }
  }
  
  return columnValues;
}

/**
 * Get a display name for an item
 */
function getItemName(item: Record<string, unknown>): string {
  // Try to use a name field, or fall back to a reasonable alternative
  return String(
    item.name || 
    item.title || 
    item.mondayName || 
    item.displayName || 
    item.label || 
    `Item ${item._id}`
  );
}
