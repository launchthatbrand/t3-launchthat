/**
 * Monday.com Actions
 *
 * This module provides action implementations for Monday.com rules.
 */

import { JSONSchema7 } from "json-schema";

import { Action, ActionFactory, RuleContext } from "../../../interfaces";

/**
 * Schema for the Create Item action
 */
export const createItemSchema: JSONSchema7 = {
  type: "object",
  properties: {
    boardId: {
      type: "string",
      title: "Board ID",
      description: "ID of the Monday.com board where the item will be created",
    },
    groupId: {
      type: "string",
      title: "Group ID",
      description: "ID of the group where the item will be created",
    },
    itemName: {
      type: "string",
      title: "Item Name",
      description: "Name of the item to create",
    },
    columnValues: {
      type: "object",
      title: "Column Values",
      description: "Values for the item's columns",
      additionalProperties: true,
    },
  },
  required: ["boardId", "itemName"],
  additionalProperties: false,
};

/**
 * Action that creates a new item in Monday.com
 */
export class MondayCreateItemAction implements Action {
  readonly type = "monday_create_item";
  private boardId: string;
  private groupId?: string;
  private itemName: string;
  private columnValues: Record<string, unknown>;

  /**
   * Creates a new instance of MondayCreateItemAction
   * @param config The configuration for the action
   */
  constructor(config: Record<string, unknown>) {
    this.boardId = config.boardId as string;
    this.groupId = config.groupId as string | undefined;
    this.itemName = config.itemName as string;
    this.columnValues = (config.columnValues as Record<string, unknown>) ?? {};
  }

  /**
   * Executes the action
   * @param _context The rule execution context
   * @returns A promise that resolves to the result of the action
   */
  async execute(_context: RuleContext): Promise<Record<string, unknown>> {
    // In a real implementation, this would call the Monday.com API
    // For now, we'll just return a mock result
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Log information about the action
    console.log(`Creating item "${this.itemName}" in board ${this.boardId}`);

    // Return a mock result
    return {
      success: true,
      itemId: `mock-item-${Date.now()}`,
      boardId: this.boardId,
      name: this.itemName,
    };
  }
}

/**
 * Factory for creating MondayCreateItemAction instances
 * @param config The configuration for the action
 * @returns A new MondayCreateItemAction instance
 */
export const createItemActionFactory: ActionFactory = (
  config: Record<string, unknown>,
) => {
  return new MondayCreateItemAction(config);
};

/**
 * Schema for the Update Item action
 */
export const updateItemSchema: JSONSchema7 = {
  type: "object",
  properties: {
    itemId: {
      type: "string",
      title: "Item ID",
      description: "ID of the Monday.com item to update",
    },
    columnValues: {
      type: "object",
      title: "Column Values",
      description: "Values to update for the item's columns",
      additionalProperties: true,
    },
  },
  required: ["itemId", "columnValues"],
  additionalProperties: false,
};

/**
 * Action that updates an existing item in Monday.com
 */
export class MondayUpdateItemAction implements Action {
  readonly type = "monday_update_item";
  private itemId: string;
  private columnValues: Record<string, unknown>;

  /**
   * Creates a new instance of MondayUpdateItemAction
   * @param config The configuration for the action
   */
  constructor(config: Record<string, unknown>) {
    this.itemId = config.itemId as string;
    this.columnValues = (config.columnValues as Record<string, unknown>) ?? {};
  }

  /**
   * Executes the action
   * @param _context The rule execution context
   * @returns A promise that resolves to the result of the action
   */
  async execute(_context: RuleContext): Promise<Record<string, unknown>> {
    // In a real implementation, this would call the Monday.com API
    // For now, we'll just return a mock result
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Log information about the action
    console.log(
      `Updating item ${this.itemId} with new values`,
      this.columnValues,
    );

    // Return a mock result
    return {
      success: true,
      itemId: this.itemId,
      updatedColumns: Object.keys(this.columnValues),
    };
  }
}

/**
 * Factory for creating MondayUpdateItemAction instances
 * @param config The configuration for the action
 * @returns A new MondayUpdateItemAction instance
 */
export const updateItemActionFactory: ActionFactory = (
  config: Record<string, unknown>,
) => {
  return new MondayUpdateItemAction(config);
};

/**
 * Schema for the Change Status action
 */
export const changeStatusSchema: JSONSchema7 = {
  type: "object",
  properties: {
    itemId: {
      type: "string",
      title: "Item ID",
      description: "ID of the Monday.com item to update",
    },
    columnId: {
      type: "string",
      title: "Column ID",
      description: "ID of the status column to update",
    },
    status: {
      type: "string",
      title: "Status",
      description: "The new status value",
    },
  },
  required: ["itemId", "columnId", "status"],
  additionalProperties: false,
};

/**
 * Action that changes the status of an item in Monday.com
 */
export class MondayChangeStatusAction implements Action {
  readonly type = "monday_change_status";
  private itemId: string;
  private columnId: string;
  private status: string;

  /**
   * Creates a new instance of MondayChangeStatusAction
   * @param config The configuration for the action
   */
  constructor(config: Record<string, unknown>) {
    this.itemId = config.itemId as string;
    this.columnId = config.columnId as string;
    this.status = config.status as string;
  }

  /**
   * Executes the action
   * @param _context The rule execution context
   * @returns A promise that resolves to the result of the action
   */
  async execute(_context: RuleContext): Promise<Record<string, unknown>> {
    // In a real implementation, this would call the Monday.com API
    // For now, we'll just return a mock result
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Log information about the action
    console.log(
      `Changing status of item ${this.itemId} to "${this.status}" in column ${this.columnId}`,
    );

    // Return a mock result
    return {
      success: true,
      itemId: this.itemId,
      columnId: this.columnId,
      newStatus: this.status,
    };
  }
}

/**
 * Factory for creating MondayChangeStatusAction instances
 * @param config The configuration for the action
 * @returns A new MondayChangeStatusAction instance
 */
export const changeStatusActionFactory: ActionFactory = (
  config: Record<string, unknown>,
) => {
  return new MondayChangeStatusAction(config);
};

/**
 * Export all action factories
 */
export const mondayActions = {
  monday_create_item: {
    factory: createItemActionFactory,
    schema: createItemSchema,
    name: "Create item",
    description: "Creates a new item in Monday.com",
  },
  monday_update_item: {
    factory: updateItemActionFactory,
    schema: updateItemSchema,
    name: "Update item",
    description: "Updates an existing item in Monday.com",
  },
  monday_change_status: {
    factory: changeStatusActionFactory,
    schema: changeStatusSchema,
    name: "Change status",
    description: "Changes the status of an item in Monday.com",
  },
};
