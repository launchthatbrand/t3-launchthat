/**
 * Shared utilities for @dnd-kit implementation across components
 *
 * This file provides standardized utilities, types, and helpers
 * for creating consistent drag-and-drop experiences across the
 * transformation system.
 */

import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import type { FieldItem, TransformationItem } from "./types";
import { DataType } from "./types";

/**
 * Common drag data types for consistent data passing during drag operations
 */
export interface DragData {
  // Type of the dragged item
  type: "field" | "transformation" | "mapping";

  // If dragging a field
  field?: Partial<FieldItem>;

  // If dragging a transformation
  transformation?: Partial<TransformationItem>;

  // If dragging a mapping
  mapping?: {
    id: string;
    sourceFieldId: string;
    targetFieldId: string;
    [key: string]: unknown;
  };

  // For other properties
  [key: string]: unknown;
}

/**
 * Standard drop zone properties
 */
export interface DropZoneData {
  id: string;
  acceptTypes?: DataType[];
  acceptTransformations?: boolean;
  acceptFields?: boolean;
  [key: string]: unknown;
}

/**
 * Common sensor configuration for consistent drag behavior
 */
export function useStandardSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      // 5px movement required before drag starts (prevents accidental drags)
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
}

/**
 * Standard modifiers for drag operations
 */
export const standardModifiers = [restrictToWindowEdges];

/**
 * Standard type compatibility check between source and target
 */
export function isTypeCompatible(
  sourceType: DataType,
  targetType: DataType,
  transformation?: TransformationItem,
): boolean {
  // If there's a transformation, check if its output type is compatible with the target
  if (transformation) {
    return (
      transformation.outputType === targetType || targetType === DataType.Any
    );
  }

  // Direct type compatibility
  if (sourceType === targetType || targetType === DataType.Any) {
    return true;
  }

  // Special case compatibility checks
  switch (targetType) {
    case DataType.String:
      // Most types can be converted to strings
      return true;
    case DataType.Number:
      // Only numbers and strings containing numbers can be converted to numbers
      return sourceType === DataType.Number || sourceType === DataType.String;
    case DataType.Boolean:
      // Numbers and strings can be converted to booleans
      return (
        sourceType === DataType.Boolean ||
        sourceType === DataType.Number ||
        sourceType === DataType.String
      );
    default:
      return false;
  }
}

/**
 * Extract field data from drag event for consistent handling
 */
export function extractFieldFromDragEvent(
  event: DragStartEvent | DragOverEvent | DragEndEvent,
): FieldItem | null {
  if (!event.active || !event.active.data) return null;

  const data = event.active.data.current as DragData | undefined;

  if (!data || !data.field) return null;

  // Check if it has all required FieldItem properties
  if (
    typeof data.field.id === "string" &&
    typeof data.field.name === "string" &&
    typeof data.field.path === "string" &&
    data.field.type !== undefined
  ) {
    return data.field as FieldItem;
  }

  return null;
}

/**
 * Extract transformation data from drag event for consistent handling
 */
export function extractTransformationFromDragEvent(
  event: DragStartEvent | DragOverEvent | DragEndEvent,
): TransformationItem | null {
  if (!event.active || !event.active.data) return null;

  const data = event.active.data.current as DragData | undefined;

  if (!data || !data.transformation) return null;

  // Check if it has all required TransformationItem properties
  if (
    typeof data.transformation.id === "string" &&
    typeof data.transformation.name === "string" &&
    typeof data.transformation.description === "string" &&
    Array.isArray(data.transformation.inputTypes) &&
    data.transformation.outputType !== undefined &&
    typeof data.transformation.category === "string" &&
    Array.isArray(data.transformation.parameters)
  ) {
    return data.transformation as TransformationItem;
  }

  return null;
}

/**
 * Standard a11y attributes for draggable items
 */
export const getDraggableA11yAttributes = (isDragging: boolean) => ({
  role: "button",
  tabIndex: 0,
  "aria-pressed": isDragging,
  "aria-roledescription": "draggable item",
});

/**
 * Standard a11y attributes for droppable zones
 */
export const getDroppableA11yAttributes = (
  isOver: boolean,
  isDisabled: boolean,
) => ({
  role: "region",
  "aria-dropeffect": isDisabled ? "none" : ("copy" as const),
  "aria-disabled": isDisabled,
  "aria-relevant": "additions",
  "aria-roledescription": "drop zone",
  "aria-live": isOver ? "assertive" : "polite",
});

/**
 * Standard animation durations for consistent feel
 */
export const animationDurations = {
  drag: 150, // ms for drag start animation
  drop: 250, // ms for drop animation
  hover: 100, // ms for hover state transition
};

/**
 * Standard visual feedback styles for draggable elements
 */
export const dragVisualStyles = {
  active: "shadow-md scale-105 z-10",
  dragging: "opacity-50 border-dashed",
  disabled: "opacity-50 cursor-not-allowed",
};

/**
 * Standard visual feedback styles for droppable elements
 */
export const dropVisualStyles = {
  active: "border-blue-400 bg-blue-50",
  valid: "border-green-400 bg-green-50",
  invalid: "border-red-400 bg-red-50",
  hover: "border-blue-300",
  disabled: "opacity-50 cursor-not-allowed",
};
