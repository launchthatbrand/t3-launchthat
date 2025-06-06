/* eslint-disable @typescript-eslint/no-unnecessary-condition */
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { AlertCircle } from "lucide-react";

import type { DataType, DroppableZoneProps, ValidationResult } from "./types";

interface DragData {
  field?: {
    type: DataType;
    [key: string]: unknown;
  };
  transformation?: {
    inputTypes: DataType[];
    outputType: DataType;
    [key: string]: unknown;
  };
  type?: "field" | "transformation";
  isSource?: boolean;
  [key: string]: unknown;
}

/**
 * A droppable zone component that can accept draggable fields.
 * Uses @dnd-kit/core for drop functionality with validation support.
 */
const DroppableZone: React.FC<DroppableZoneProps> = ({
  id,
  onDrop: _onDrop, // Prefix with underscore to indicate it's not used in this component
  children,
  className,
  acceptTypes,
  isDisabled = false,
  validationResults = [],
  validationMode = "hover",
}) => {
  // Set up droppable with dnd-kit
  const { setNodeRef, isOver, active } = useDroppable({
    id,
    disabled: isDisabled,
    data: {
      acceptTypes,
      id,
    },
  });

  // Determine if the currently dragged item is compatible with this drop zone
  const getCompatibilityInfo = React.useMemo(() => {
    if (!active || !acceptTypes || acceptTypes.length === 0) {
      return { isCompatible: true, message: null };
    }

    const draggedItemData = active.data.current as DragData;

    // If dragging a field
    if (draggedItemData?.field) {
      const draggedFieldType = draggedItemData.field.type;

      // If dropping a field on a field (type compatibility check)
      if (acceptTypes.includes(draggedFieldType)) {
        return {
          isCompatible: true,
          message: `Compatible: ${draggedFieldType} → ${acceptTypes.join(" | ")}`,
        };
      }

      return {
        isCompatible: false,
        message: `Incompatible: ${draggedFieldType} cannot be mapped to ${acceptTypes.join(" | ")}`,
      };
    }

    // If dragging a transformation onto a field
    if (draggedItemData?.transformation) {
      const { transformation } = draggedItemData;

      // Check if any of the accept types match the transformation output
      const matchingType = acceptTypes.includes(transformation.outputType);

      if (matchingType) {
        return {
          isCompatible: true,
          message: `Compatible transformation: Output is ${transformation.outputType}`,
        };
      }

      return {
        isCompatible: false,
        message: `Incompatible transformation: Output ${transformation.outputType} doesn't match ${acceptTypes.join(" | ")}`,
      };
    }

    return { isCompatible: false, message: null };
  }, [active, acceptTypes]);

  // Visual states
  const isValidDrop = isOver && getCompatibilityInfo.isCompatible;
  const isInvalidDrop = isOver && !getCompatibilityInfo.isCompatible;

  // Determine if we should show validation indicators
  // 'always' - always show, 'hover' - show on hover, 'never' - never show
  const showValidation =
    validationMode === "always" || (validationMode === "hover" && isOver);

  // If validation results have errors, show them
  const hasValidationErrors = validationResults.some(
    (result: ValidationResult) =>
      !result.isValid && result.severity === "error",
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative rounded-md border border-dashed p-4 transition-colors",
        {
          "border-green-400 bg-green-50": isValidDrop,
          "border-red-400 bg-red-50": isInvalidDrop,
          "border-amber-300 bg-amber-50":
            !isOver && hasValidationErrors && showValidation,
          "border-gray-300 bg-gray-50": !isOver && !hasValidationErrors,
          "cursor-not-allowed opacity-50": isDisabled,
        },
        className,
      )}
    >
      {children}

      {/* Error tooltip indicator */}
      {isInvalidDrop && getCompatibilityInfo.message && (
        <div className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 shadow-sm">
          <AlertCircle className="h-4 w-4 text-red-500" />

          {/* Tooltip */}
          <div className="absolute right-0 top-5 w-48 rounded bg-white p-2 text-xs shadow-lg">
            {getCompatibilityInfo.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default DroppableZone;
