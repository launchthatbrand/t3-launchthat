"use client";

import React, { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { DataType, SchemaField } from "./types";

export interface DraggableFieldProps {
  field: SchemaField;
  type?: "source" | "target";
  isActive?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}

/**
 * A draggable field component that can be used in the mapping interface.
 * Uses @dnd-kit/core for drag functionality.
 */
const DraggableField: React.FC<DraggableFieldProps> = ({
  field,
  type,
  isActive,
  disabled = false,
  className,
}) => {
  // Configure draggable behavior
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `source-${field.path}`,
    data: {
      field,
      type,
    },
    disabled,
  });

  // Get background color based on field type
  const getTypeColor = (type: DataType): string => {
    switch (type) {
      case DataType.String:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case DataType.Number:
        return "bg-green-100 text-green-800 border-green-200";
      case DataType.Boolean:
        return "bg-purple-100 text-purple-800 border-purple-200";
      case DataType.Date:
        return "bg-amber-100 text-amber-800 border-amber-200";
      case DataType.Object:
        return "bg-gray-100 text-gray-800 border-gray-200";
      case DataType.Array:
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const style = transform
    ? {
        transform: CSS.Transform.toString(transform),
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex cursor-grab items-center justify-between rounded-md border p-2 text-sm",
        isActive ? "ring-2 ring-primary ring-offset-1" : "",
        disabled ? "cursor-not-allowed opacity-60" : "",
        getTypeColor(field.type),
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 opacity-60" />
        <span className="font-medium">{field.name}</span>
      </div>
      <Badge variant="outline" className="text-[10px]">
        {field.type}
      </Badge>
    </div>
  );
};

export default DraggableField;
