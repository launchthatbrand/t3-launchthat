"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { AlertCircle, Info } from "lucide-react";

import type { DataType, DroppableZoneProps, ValidationResult } from "./types";
import { dropVisualStyles, getDroppableA11yAttributes } from "./dndUtils";

interface DragData {
  type?: "field" | "transformation" | "mapping";
  field?: {
    type: DataType;
    [key: string]: unknown;
  };
  transformation?: {
    inputTypes: DataType[];
    outputType: DataType;
    [key: string]: unknown;
  };
  isSource?: boolean;
  [key: string]: unknown;
}

/**
 * An accessible droppable zone component that can accept draggable fields.
 * Enhances the base DroppableZone with proper accessibility attributes and keyboard support.
 */
const AccessibleDroppableZone: React.FC<DroppableZoneProps> = ({
  id,
  onDrop: _onDrop, // Prefix with underscore to indicate it's not used in this component
  children,
  className,
  acceptTypes,
  isDisabled = false,
  validationResults = [],
  validationMode = "hover",
}) => {
  // Reference to the droppable element for keyboard event handling
  const nodeRef = useRef<HTMLDivElement>(null);

  // Set up droppable with dnd-kit
  const { setNodeRef, isOver, active } = useDroppable({
    id,
    disabled: isDisabled,
    data: {
      id,
      acceptTypes,
      acceptFields: true,
      acceptTransformations: acceptTypes && acceptTypes.length > 0,
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

  // If validation results have warnings, show them
  const hasValidationWarnings = validationResults.some(
    (result: ValidationResult) =>
      !result.isValid && result.severity === "warning",
  );

  // Get a11y attributes
  const a11yAttributes = getDroppableA11yAttributes(isOver, isDisabled);

  // Handle keyboard interaction for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Space or Enter can confirm drop if an item is actively being dragged
    if ((e.key === " " || e.key === "Enter") && active) {
      e.preventDefault();
      // Let the drag and drop context handle this
    }
  };

  return (
    <div
      ref={(node) => {
        // Set both refs
        setNodeRef(node);
        if (nodeRef.current !== node) {
          nodeRef.current = node;
        }
      }}
      className={cn(
        "relative rounded-md border border-dashed p-4 transition-colors",
        {
          [dropVisualStyles.valid]: isValidDrop,
          [dropVisualStyles.invalid]: isInvalidDrop,
          "border-amber-300 bg-amber-50":
            !isOver && hasValidationErrors && showValidation,
          "border-yellow-300 bg-yellow-50":
            !isOver &&
            !hasValidationErrors &&
            hasValidationWarnings &&
            showValidation,
          "border-gray-300 bg-gray-50":
            !isOver && !hasValidationErrors && !hasValidationWarnings,
          [dropVisualStyles.disabled]: isDisabled,
        },
        className,
      )}
      {...a11yAttributes}
      onKeyDown={handleKeyDown}
      title={`Drop zone: ${id}`}
    >
      {children}

      {/* Error tooltip indicator */}
      {isInvalidDrop && getCompatibilityInfo.message && (
        <div
          className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 shadow-sm"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="h-4 w-4 text-red-500" />

          {/* Tooltip */}
          <div className="absolute right-0 top-5 w-48 rounded bg-white p-2 text-xs shadow-lg">
            {getCompatibilityInfo.message}
          </div>
        </div>
      )}

      {/* Validation errors/warnings */}
      {!isOver &&
        showValidation &&
        (hasValidationErrors || hasValidationWarnings) && (
          <div
            className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 shadow-sm"
            role="alert"
          >
            <Info
              className={cn("h-4 w-4", {
                "text-red-500": hasValidationErrors,
                "text-yellow-500":
                  !hasValidationErrors && hasValidationWarnings,
              })}
            />

            {/* Tooltip for validation messages */}
            <div className="absolute right-0 top-5 w-48 rounded bg-white p-2 text-xs shadow-lg">
              <ul className="space-y-1">
                {validationResults
                  .filter((r) => !r.isValid)
                  .map((result, index) => (
                    <li
                      key={index}
                      className={cn({
                        "text-red-500": result.severity === "error",
                        "text-yellow-500": result.severity === "warning",
                        "text-blue-500": result.severity === "info",
                      })}
                    >
                      {result.message}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}

      {/* Screen reader feedback */}
      <div className="sr-only" aria-live="polite">
        {isDisabled
          ? "This drop zone is disabled"
          : isValidDrop
            ? "Valid drop target"
            : isInvalidDrop
              ? "Invalid drop target: " +
                (getCompatibilityInfo.message || "Incompatible types")
              : acceptTypes?.length
                ? `Drop zone accepts: ${acceptTypes.join(", ")} types`
                : "Drop zone"}
        {hasValidationErrors && " Has validation errors."}
        {hasValidationWarnings && " Has validation warnings."}
      </div>
    </div>
  );
};

export default AccessibleDroppableZone;
