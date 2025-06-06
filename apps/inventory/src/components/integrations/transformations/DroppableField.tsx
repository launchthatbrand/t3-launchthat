"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { Check } from "lucide-react";

import { DataType, SchemaField } from "./types";

export interface DroppableFieldProps {
  id: string;
  field: SchemaField;
  type: string;
  isActive: boolean;
  isMapped: boolean;
  disabled?: boolean;
  className?: string;
}

const DroppableField: React.FC<DroppableFieldProps> = ({
  id,
  field,
  type,
  isActive,
  isMapped,
  disabled = false,
  className,
}) => {
  // Configure droppable behavior
  const { isOver, setNodeRef } = useDroppable({
    id,
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
        return "bg-blue-50 text-blue-800 border-blue-200";
      case DataType.Number:
        return "bg-green-50 text-green-800 border-green-200";
      case DataType.Boolean:
        return "bg-purple-50 text-purple-800 border-purple-200";
      case DataType.Date:
        return "bg-amber-50 text-amber-800 border-amber-200";
      case DataType.Object:
        return "bg-gray-50 text-gray-800 border-gray-200";
      case DataType.Array:
        return "bg-indigo-50 text-indigo-800 border-indigo-200";
      default:
        return "bg-gray-50 text-gray-800 border-gray-200";
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex cursor-pointer items-center justify-between rounded-md border p-2 text-sm transition-colors",
        isOver && !disabled ? "ring-2 ring-primary ring-offset-1" : "",
        isActive ? "ring-2 ring-primary ring-offset-1" : "",
        isMapped ? "border-primary bg-primary/5" : "",
        disabled ? "cursor-not-allowed opacity-60" : "",
        getTypeColor(field.type),
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {isMapped && <Check className="h-4 w-4 text-primary" />}
        <span className="font-medium">{field.name}</span>
      </div>
      <Badge variant="outline" className="text-[10px]">
        {field.type}
      </Badge>
    </div>
  );
};

export default DroppableField;
