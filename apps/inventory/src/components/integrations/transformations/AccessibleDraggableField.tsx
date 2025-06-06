"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import type { DraggableFieldProps } from "./types";
import { dragVisualStyles, getDraggableA11yAttributes } from "./dndUtils";

/**
 * An accessible draggable field component that can be used in the mapping interface.
 * Enhances the base DraggableField with proper accessibility attributes and keyboard support.
 */
const AccessibleDraggableField: React.FC<DraggableFieldProps> = ({
  field,
  children,
  className,
  isSource = true,
}) => {
  // Reference to the draggable element for keyboard event handling
  const nodeRef = useRef<HTMLDivElement>(null);

  // Set up draggable with dnd-kit
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: field.id,
      data: {
        type: "field",
        field,
        isSource,
      },
    });

  // Create style for the draggable element
  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: "move",
  };

  // Define color schemes based on data type
  const typeColorMap: Record<string, string> = {
    string: isSource
      ? "bg-blue-50 border-blue-200"
      : "bg-green-50 border-green-200",
    number: isSource
      ? "bg-purple-50 border-purple-200"
      : "bg-green-50 border-green-200",
    boolean: isSource
      ? "bg-yellow-50 border-yellow-200"
      : "bg-green-50 border-green-200",
    date: isSource
      ? "bg-red-50 border-red-200"
      : "bg-green-50 border-green-200",
    object: isSource
      ? "bg-indigo-50 border-indigo-200"
      : "bg-green-50 border-green-200",
    array: isSource
      ? "bg-teal-50 border-teal-200"
      : "bg-green-50 border-green-200",
    any: isSource
      ? "bg-gray-50 border-gray-200"
      : "bg-green-50 border-green-200",
  };

  // Get appropriate color scheme based on field type
  const typeColors = typeColorMap[field.type] ?? "bg-gray-50 border-gray-200";

  // Get accessibility attributes
  const a11yAttributes = getDraggableA11yAttributes(isDragging);

  // Handle keyboard interaction for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        // Space or Enter triggers the drag
        e.preventDefault();
        if (nodeRef.current) {
          // Simulate a click to initiate drag
          nodeRef.current.click();
        }
        break;
      case "Escape":
        // Escape cancels the drag
        e.preventDefault();
        // Let the drag and drop context handle escape
        break;
      default:
        break;
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
      style={style}
      {...attributes}
      {...listeners}
      {...a11yAttributes}
      onKeyDown={handleKeyDown}
      className={cn(
        "rounded border p-2 shadow-sm transition-all hover:shadow-md",
        typeColors,
        isDragging && dragVisualStyles.dragging,
        className,
      )}
      title={`Draggable field: ${field.name} (${field.type})`}
    >
      {children ?? (
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <span className="font-medium">{field.name}</span>
            <span className="text-xs text-gray-500">({field.type})</span>
          </div>
          {field.description && (
            <p className="mt-1 text-xs text-gray-500">{field.description}</p>
          )}
          {field.required && (
            <div className="mt-1 text-xs text-red-500">Required</div>
          )}
          <div className="sr-only">
            {field.required ? "Required field" : "Optional field"}. Type:{" "}
            {field.type}.
            {field.description && ` Description: ${field.description}`}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibleDraggableField;
