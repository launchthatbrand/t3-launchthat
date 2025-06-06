/**
 * Monday.com Triggers
 *
 * This module provides trigger implementations for Monday.com rules.
 */

import { JSONSchema7 } from "json-schema";

import { RuleContext, Trigger, TriggerFactory } from "../../../interfaces";

/**
 * Schema for the Item Created trigger
 */
export const itemCreatedSchema: JSONSchema7 = {
  type: "object",
  properties: {
    boardId: {
      type: "string",
      title: "Board ID",
      description:
        "ID of the Monday.com board (optional - any board if not specified)",
    },
  },
  additionalProperties: false,
};

/**
 * Trigger that fires when a new item is created in Monday.com
 */
export class MondayItemCreatedTrigger implements Trigger {
  readonly type = "monday_item_created";
  private boardId?: string;

  /**
   * Creates a new instance of MondayItemCreatedTrigger
   * @param config The configuration for the trigger
   */
  constructor(config: Record<string, unknown>) {
    this.boardId = config.boardId as string | undefined;
  }

  /**
   * Evaluates whether the trigger should fire based on the context
   * @param context The rule execution context
   * @returns True if the trigger should fire, false otherwise
   */
  async evaluate(context: RuleContext): Promise<boolean> {
    // For Monday item created events, we check if the event type matches
    if (
      context.event?.type !== "monday_webhook" ||
      (context.event?.action !== "create_item" &&
        context.event?.action !== "create_pulse")
    ) {
      return false;
    }

    // If a specific boardId is configured, check if it matches
    if (this.boardId && context.data?.boardId !== this.boardId) {
      return false;
    }

    // The event is a Monday item creation that matches our configuration
    return true;
  }
}

/**
 * Factory for creating MondayItemCreatedTrigger instances
 * @param config The configuration for the trigger
 * @returns A new MondayItemCreatedTrigger instance
 */
export const createItemCreatedTrigger: TriggerFactory = (
  config: Record<string, unknown>,
) => {
  return new MondayItemCreatedTrigger(config);
};

/**
 * Schema for the Item Updated trigger
 */
export const itemUpdatedSchema: JSONSchema7 = {
  type: "object",
  properties: {
    boardId: {
      type: "string",
      title: "Board ID",
      description:
        "ID of the Monday.com board (optional - any board if not specified)",
    },
  },
  additionalProperties: false,
};

/**
 * Trigger that fires when an item is updated in Monday.com
 */
export class MondayItemUpdatedTrigger implements Trigger {
  readonly type = "monday_item_updated";
  private boardId?: string;

  /**
   * Creates a new instance of MondayItemUpdatedTrigger
   * @param config The configuration for the trigger
   */
  constructor(config: Record<string, unknown>) {
    this.boardId = config.boardId as string | undefined;
  }

  /**
   * Evaluates whether the trigger should fire based on the context
   * @param context The rule execution context
   * @returns True if the trigger should fire, false otherwise
   */
  async evaluate(context: RuleContext): Promise<boolean> {
    // For Monday item updated events, we check if the event type matches
    if (
      context.event?.type !== "monday_webhook" ||
      (context.event?.action !== "update_item" &&
        context.event?.action !== "update_column_value")
    ) {
      return false;
    }

    // If a specific boardId is configured, check if it matches
    if (this.boardId && context.data?.boardId !== this.boardId) {
      return false;
    }

    // The event is a Monday item update that matches our configuration
    return true;
  }
}

/**
 * Factory for creating MondayItemUpdatedTrigger instances
 * @param config The configuration for the trigger
 * @returns A new MondayItemUpdatedTrigger instance
 */
export const createItemUpdatedTrigger: TriggerFactory = (
  config: Record<string, unknown>,
) => {
  return new MondayItemUpdatedTrigger(config);
};

/**
 * Schema for the Status Changed trigger
 */
export const statusChangedSchema: JSONSchema7 = {
  type: "object",
  properties: {
    boardId: {
      type: "string",
      title: "Board ID",
      description:
        "ID of the Monday.com board (optional - any board if not specified)",
    },
    toStatus: {
      type: "string",
      title: "To Status",
      description:
        "The status value to check for (optional - any status change if not specified)",
    },
  },
  additionalProperties: false,
};

/**
 * Trigger that fires when an item's status changes in Monday.com
 */
export class MondayStatusChangedTrigger implements Trigger {
  readonly type = "monday_status_changed";
  private boardId?: string;
  private toStatus?: string;

  /**
   * Creates a new instance of MondayStatusChangedTrigger
   * @param config The configuration for the trigger
   */
  constructor(config: Record<string, unknown>) {
    this.boardId = config.boardId as string | undefined;
    this.toStatus = config.toStatus as string | undefined;
  }

  /**
   * Evaluates whether the trigger should fire based on the context
   * @param context The rule execution context
   * @returns True if the trigger should fire, false otherwise
   */
  async evaluate(context: RuleContext): Promise<boolean> {
    // For Monday status changed events, we check if it's an update to a status column
    if (
      context.event?.type !== "monday_webhook" ||
      context.event?.action !== "update_column_value"
    ) {
      return false;
    }

    // If a specific boardId is configured, check if it matches
    if (this.boardId && context.data?.boardId !== this.boardId) {
      return false;
    }

    // Check if the column type is "status"
    if (context.event?.columnType !== "status") {
      return false;
    }

    // If a specific toStatus is configured, check if it matches
    if (this.toStatus && context.data?.value !== this.toStatus) {
      return false;
    }

    // The event is a Monday status change that matches our configuration
    return true;
  }
}

/**
 * Factory for creating MondayStatusChangedTrigger instances
 * @param config The configuration for the trigger
 * @returns A new MondayStatusChangedTrigger instance
 */
export const createStatusChangedTrigger: TriggerFactory = (
  config: Record<string, unknown>,
) => {
  return new MondayStatusChangedTrigger(config);
};

/**
 * Schema for the Field Value trigger
 */
export const fieldValueSchema: JSONSchema7 = {
  type: "object",
  properties: {
    boardId: {
      type: "string",
      title: "Board ID",
      description:
        "ID of the Monday.com board (optional - any board if not specified)",
    },
    fieldId: {
      type: "string",
      title: "Field ID",
      description: "ID of the Monday.com column/field",
    },
    value: {
      type: ["string", "number", "boolean", "null"],
      title: "Value",
      description: "The value to check for",
    },
  },
  required: ["fieldId"],
  additionalProperties: false,
};

/**
 * Trigger that fires when a field value matches a specific value
 */
export class MondayFieldValueTrigger implements Trigger {
  readonly type = "monday_field_value_is";
  private boardId?: string;
  private fieldId: string;
  private value: unknown;

  /**
   * Creates a new instance of MondayFieldValueTrigger
   * @param config The configuration for the trigger
   */
  constructor(config: Record<string, unknown>) {
    this.boardId = config.boardId as string | undefined;
    this.fieldId = config.fieldId as string;
    this.value = config.value;
  }

  /**
   * Evaluates whether the trigger should fire based on the context
   * @param context The rule execution context
   * @returns True if the trigger should fire, false otherwise
   */
  async evaluate(context: RuleContext): Promise<boolean> {
    // For field value triggers, we can check on both create and update events
    if (
      context.event?.type !== "monday_webhook" ||
      ![
        "create_item",
        "create_pulse",
        "update_item",
        "update_column_value",
      ].includes(context.event?.action as string)
    ) {
      return false;
    }

    // If a specific boardId is configured, check if it matches
    if (this.boardId && context.data?.boardId !== this.boardId) {
      return false;
    }

    // For column updates, check if the columnId matches our fieldId
    if (
      context.event?.action === "update_column_value" &&
      context.event?.columnId === this.fieldId
    ) {
      return context.data?.value === this.value;
    }

    // For other events, check the column values in the item data
    const columnValues = context.data?.item?.columnValues as
      | Record<string, unknown>
      | undefined;
    if (!columnValues) {
      return false;
    }

    // Check if the field value matches
    return columnValues[this.fieldId] === this.value;
  }
}

/**
 * Factory for creating MondayFieldValueTrigger instances
 * @param config The configuration for the trigger
 * @returns A new MondayFieldValueTrigger instance
 */
export const createFieldValueTrigger: TriggerFactory = (
  config: Record<string, unknown>,
) => {
  return new MondayFieldValueTrigger(config);
};

/**
 * Export all trigger factories
 */
export const mondayTriggers = {
  monday_item_created: {
    factory: createItemCreatedTrigger,
    schema: itemCreatedSchema,
    name: "When an item is created",
    description: "Triggers when a new item is created in Monday.com",
  },
  monday_item_updated: {
    factory: createItemUpdatedTrigger,
    schema: itemUpdatedSchema,
    name: "When an item is updated",
    description: "Triggers when an item is updated in Monday.com",
  },
  monday_status_changed: {
    factory: createStatusChangedTrigger,
    schema: statusChangedSchema,
    name: "When status changes",
    description: "Triggers when an item's status changes in Monday.com",
  },
  monday_field_value_is: {
    factory: createFieldValueTrigger,
    schema: fieldValueSchema,
    name: "When field value is",
    description: "Triggers when a field has a specific value in Monday.com",
  },
};
