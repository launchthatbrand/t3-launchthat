/**
 * Monday.com Order Sync Utilities
 *
 * This module contains specialized functions for synchronizing orders and line items
 * between Convex and Monday.com, with a focus on parent-child relationships.
 */

import type { Doc, Id } from "../../_generated/dataModel";
import type {
  MondayBoardMapping,
  MondayColumnMapping,
  MondayIntegration,
  MondayItemMapping,
  OrderLineItem,
} from "./types";
import {
  createItem,
  createSubitem,
  formatConvexValueForMonday,
  updateItem,
} from "./api";
import {
  saveItemMapping,
  transformConvexDocumentToMondayItem,
  updateBoardMappingStatus,
} from "./sync";

import type { MutationCtx } from "../../_generated/server";

/**
 * Synchronize an order and its line items to Monday.com
 */
export async function syncOrderToMonday(
  ctx: MutationCtx,
  integration: MondayIntegration,
  boardMapping: MondayBoardMapping,
  columnMappings: MondayColumnMapping[],
  orderId: Id<"orders">,
): Promise<{
  success: boolean;
  message: string;
  orderSynced: boolean;
  lineItemsSynced: number;
  lineItemsFailed: number;
}> {
  try {
    // Get the order from Convex
    const order = await ctx.db.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Transform order to Monday.com format
    const { name, columnValues } = transformConvexDocumentToMondayItem(
      order as Record<string, unknown>,
      columnMappings,
    );

    // Add special order-specific transformations if needed
    addOrderSpecificFields(columnValues, order);

    // Check if the order already has a Monday.com mapping
    const mondayItemId = order.mondayItemId;
    let mondayMapping: MondayItemMapping | null = null;

    if (mondayItemId) {
      // Verify the mapping exists in our database
      mondayMapping = await ctx.db
        .query("mondayItemMappings")
        .withIndex("by_monday_item", (q) =>
          q
            .eq("mondayBoardId", boardMapping.mondayBoardId)
            .eq("mondayItemId", mondayItemId),
        )
        .first();
    }

    // Variable to track if we synced a new or existing order
    let itemId: string;
    let orderSynced = false;

    if (mondayMapping && mondayItemId) {
      // Update existing item in Monday.com
      const updateResult = await updateItem(
        integration.apiKey,
        mondayItemId,
        boardMapping.mondayBoardId,
        columnValues,
      );

      if (!updateResult.success) {
        throw new Error(
          `Failed to update order in Monday.com: ${updateResult.message}`,
        );
      }

      itemId = mondayItemId;
      orderSynced = true;
    } else {
      // Create a new item in Monday.com
      const createResult = await createItem(
        integration.apiKey,
        boardMapping.mondayBoardId,
        name,
        columnValues,
      );

      if (!createResult.success || !createResult.item) {
        throw new Error(
          `Failed to create order in Monday.com: ${createResult.message}`,
        );
      }

      // Save the new Monday.com item ID to the order
      itemId = createResult.item.id;
      orderSynced = true;

      // Create a mapping for the new item
      await saveItemMapping(ctx, {
        mondayItemId: itemId,
        mondayBoardId: boardMapping.mondayBoardId,
        convexId: orderId,
        convexTable: "orders",
        boardMappingId: boardMapping._id,
      });

      // Update the order with the Monday.com item ID
      await ctx.db.patch(orderId, {
        mondayItemId: itemId,
        mondayBoardId: boardMapping.mondayBoardId,
        mondayLastSynced: Date.now(),
        mondaySyncStatus: "synced",
      });
    }

    // Now that we have the parent item synchronized, handle the line items
    const lineItems = Array.isArray(order.items) ? order.items : [];
    let lineItemsSynced = 0;
    let lineItemsFailed = 0;

    // Process each line item as a subitem
    for (let i = 0; i < lineItems.length; i++) {
      try {
        const lineItem = lineItems[i] as OrderLineItem;
        const lineItemName = getLineItemName(lineItem);

        // Convert line item to Monday.com column values
        const lineItemValues = createLineItemColumnValues(
          lineItem,
          columnMappings,
        );

        // Add position in array as a reference
        lineItemValues.position = i + 1;

        // Check if this line item already has a Monday.com ID
        if (lineItem.mondayItemId) {
          // Update existing subitem
          const updateResult = await updateItem(
            integration.apiKey,
            lineItem.mondayItemId,
            boardMapping.mondayBoardId,
            lineItemValues,
          );

          if (updateResult.success) {
            lineItemsSynced++;
          } else {
            lineItemsFailed++;
            console.error(
              `Failed to update line item in Monday.com: ${updateResult.message}`,
            );
          }
        } else {
          // Create a new subitem
          const createResult = await createSubitem(
            integration.apiKey,
            itemId,
            lineItemName,
            lineItemValues,
          );

          if (createResult.success && createResult.item) {
            // Update the line item with the Monday.com item ID
            const updatedItems = [...lineItems];
            updatedItems[i] = {
              ...lineItem,
              mondayItemId: createResult.item.id,
              mondayLastSynced: Date.now(),
            };

            await ctx.db.patch(orderId, {
              items: updatedItems,
            });

            lineItemsSynced++;
          } else {
            lineItemsFailed++;
            console.error(
              `Failed to create line item in Monday.com: ${createResult.message}`,
            );
          }
        }
      } catch (lineItemError) {
        lineItemsFailed++;
        console.error(`Error syncing line item: ${String(lineItemError)}`);
      }
    }

    // Update the order with the status of subitem synchronization
    await ctx.db.patch(orderId, {
      mondayLastSynced: Date.now(),
      mondaySyncStatus: "synced",
      mondaySubitemsStatus:
        lineItemsFailed > 0
          ? lineItemsSynced > 0
            ? "partial"
            : "failed"
          : "complete",
    });

    // Update the board mapping status
    const status = lineItemsFailed > 0 ? "partial" : "synced";
    await updateBoardMappingStatus(ctx, boardMapping._id, status);

    return {
      success: true,
      message: `Order synchronized with ${lineItemsSynced} line items (${lineItemsFailed} failed)`,
      orderSynced,
      lineItemsSynced,
      lineItemsFailed,
    };
  } catch (error) {
    console.error("Error syncing order to Monday.com:", error);

    // Update the order sync status
    await ctx.db.patch(orderId, {
      mondaySyncStatus: "failed",
      mondaySyncError: error instanceof Error ? error.message : "Unknown error",
    });

    // Update the board mapping status
    await updateBoardMappingStatus(ctx, boardMapping._id, "error");

    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      orderSynced: false,
      lineItemsSynced: 0,
      lineItemsFailed: 0,
    };
  }
}

/**
 * Synchronize a Monday.com order item and its subitems to Convex
 *
 * This function is a placeholder - it will be implemented later when bidirectional sync is needed
 */
export function syncMondayOrderToConvex(
  _ctx: MutationCtx,
  _integration: MondayIntegration,
  _boardMapping: MondayBoardMapping,
  _columnMappings: MondayColumnMapping[],
  _mondayItemId: string,
  _convexOrderId?: Id<"orders">,
): Promise<{
  success: boolean;
  message: string;
  orderUpdated: boolean;
  orderCreated: boolean;
  lineItemsUpdated: number;
  lineItemsCreated: number;
  lineItemsFailed: number;
}> {
  return Promise.resolve({
    success: false,
    message: "Not implemented yet",
    orderUpdated: false,
    orderCreated: false,
    lineItemsUpdated: 0,
    lineItemsCreated: 0,
    lineItemsFailed: 0,
  });
}

/**
 * Get formatted line item name
 */
function getLineItemName(lineItem: OrderLineItem): string {
  let name = "Product";

  if (lineItem.productSnapshot?.name) {
    name = lineItem.productSnapshot.name;
  } else if (lineItem.productId) {
    name = `Product ${lineItem.productId}`;
  }

  if (lineItem.quantity > 1) {
    name = `${lineItem.quantity}x ${name}`;
  }

  if (lineItem.variantSnapshot?.name) {
    name = `${name} (${lineItem.variantSnapshot.name})`;
  }

  return name;
}

/**
 * Create Monday.com column values for a line item
 */
function createLineItemColumnValues(
  lineItem: OrderLineItem,
  columnMappings: MondayColumnMapping[],
): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  // Map standard fields that might exist in column mappings
  for (const mapping of columnMappings) {
    if (!mapping.isEnabled) continue;

    // Extract nested paths like "productSnapshot.name" from the mapping
    const fieldPath = mapping.convexField.split(".");
    let value: unknown = lineItem;

    // Navigate through the path
    for (const segment of fieldPath) {
      if (value && typeof value === "object" && segment in value) {
        value = (value as Record<string, unknown>)[segment];
      } else {
        value = undefined;
        break;
      }
    }

    if (value !== undefined) {
      values[mapping.mondayColumnId] = formatConvexValueForMonday(
        value,
        mapping.mondayColumnType,
      );
    }
  }

  // Add quantity if not already mapped
  values.quantity = lineItem.quantity;

  // Add price information if available
  if (lineItem.productSnapshot?.price) {
    values.price = formatPrice(lineItem.productSnapshot.price);
  } else if (lineItem.lineTotal) {
    // Calculate unit price from line total if available
    values.price = formatPrice(lineItem.lineTotal / lineItem.quantity);
  }

  // Add total information if available
  if (lineItem.lineTotal) {
    values.total = formatPrice(lineItem.lineTotal);
  } else if (lineItem.productSnapshot?.price) {
    // Calculate line total if not available
    values.total = formatPrice(
      lineItem.quantity * lineItem.productSnapshot.price,
    );
  }

  return values;
}

/**
 * Format price values for Monday.com
 */
function formatPrice(price: number): string {
  // Check if price is in cents (common in e-commerce systems)
  if (price > 100 && price % 1 === 0) {
    return (price / 100).toFixed(2);
  }
  return price.toFixed(2);
}

/**
 * Add order-specific fields to column values
 */
function addOrderSpecificFields(
  columnValues: Record<string, unknown>,
  order: Doc<"orders">,
): void {
  // Add status in a format that works with Monday.com status columns
  if (order.status) {
    columnValues.status = { label: order.status };
  }

  // Add payment status in a format that works with Monday.com status columns
  if (order.paymentStatus) {
    columnValues.payment_status = { label: order.paymentStatus };
  }

  // Format dates in a way Monday.com understands
  if (order.createdAt) {
    const date = new Date(order.createdAt).toISOString().split("T")[0];
    columnValues.date = { date };
  }

  // Add additional columns that may be useful for orders
  if (Array.isArray(order.items)) {
    columnValues.items_count = order.items.length;
  }

  // Add total amount in a currency format
  if (order.total) {
    columnValues.total = formatPrice(order.total);
  }
}

/**
 * Find orders that need to be synced to Monday.com
 *
 * This is used by batch synchronization processes
 */
export async function findOrdersToSync(
  ctx: MutationCtx,
  lastSyncTimestamp: number,
  limit = 50,
): Promise<Id<"orders">[]> {
  // Find orders that either have never been synced or have been updated since the last sync
  const orders = await ctx.db
    .query("orders")
    .filter((q) =>
      q.or(
        q.eq(q.field("mondaySyncStatus"), undefined),
        q.eq(q.field("mondaySyncStatus"), "pending"),
        q.and(
          q.gt(q.field("updatedAt"), lastSyncTimestamp),
          q.or(
            q.eq(q.field("mondaySyncStatus"), "synced"),
            q.eq(q.field("mondaySyncStatus"), "partial"),
          ),
        ),
      ),
    )
    .take(limit);

  return orders.map((order) => order._id);
}

/**
 * Pull order status changes from Monday.com to Convex
 *
 * This propagates status changes from Monday.com to the Convex order system
 *
 * This function is a placeholder - it will be implemented later when status propagation is needed
 */
export function pullOrderStatusChanges(
  _ctx: MutationCtx,
  _integration: MondayIntegration,
  _boardMapping: MondayBoardMapping,
  _columnMappings: MondayColumnMapping[],
  _statusColumnId: string,
): Promise<{
  success: boolean;
  message: string;
  ordersUpdated: number;
  ordersFailed: number;
}> {
  return Promise.resolve({
    success: false,
    message: "Not implemented yet",
    ordersUpdated: 0,
    ordersFailed: 0,
  });
}

/**
 * Batch sync orders to Monday.com
 */
export async function batchSyncOrdersToMonday(
  ctx: MutationCtx,
  integration: MondayIntegration,
  boardMapping: MondayBoardMapping,
  columnMappings: MondayColumnMapping[],
  limit = 10,
): Promise<{
  success: boolean;
  message: string;
  ordersProcessed: number;
  ordersSynced: number;
  ordersFailed: number;
}> {
  try {
    // Find orders that need to be synced
    const lastSyncTime = boardMapping.lastSyncTimestamp || 0;
    const orderIds = await findOrdersToSync(ctx, lastSyncTime, limit);

    if (orderIds.length === 0) {
      return {
        success: true,
        message: "No orders found that need synchronization",
        ordersProcessed: 0,
        ordersSynced: 0,
        ordersFailed: 0,
      };
    }

    let ordersSynced = 0;
    let ordersFailed = 0;

    // Process each order
    for (const orderId of orderIds) {
      try {
        // Mark the order as being synced
        await ctx.db.patch(orderId, {
          mondaySyncStatus: "syncing",
        });

        // Sync the order and its line items
        const result = await syncOrderToMonday(
          ctx,
          integration,
          boardMapping,
          columnMappings,
          orderId,
        );

        if (result.success) {
          ordersSynced++;
        } else {
          ordersFailed++;
        }
      } catch (orderError) {
        console.error(`Error syncing order ${orderId}:`, orderError);

        // Mark the order sync as failed
        await ctx.db.patch(orderId, {
          mondaySyncStatus: "failed",
          mondaySyncError:
            orderError instanceof Error ? orderError.message : "Unknown error",
        });

        ordersFailed++;
      }
    }

    // Update the board mapping status
    const status =
      ordersFailed > 0 ? (ordersSynced > 0 ? "partial" : "error") : "synced";

    await updateBoardMappingStatus(ctx, boardMapping._id, status);

    return {
      success: true,
      message: `Processed ${orderIds.length} orders: ${ordersSynced} synced, ${ordersFailed} failed`,
      ordersProcessed: orderIds.length,
      ordersSynced,
      ordersFailed,
    };
  } catch (error) {
    console.error("Error in batch sync orders:", error);

    // Update the board mapping status
    await updateBoardMappingStatus(ctx, boardMapping._id, "error");

    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      ordersProcessed: 0,
      ordersSynced: 0,
      ordersFailed: 0,
    };
  }
}
