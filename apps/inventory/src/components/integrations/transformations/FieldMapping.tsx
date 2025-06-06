"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { ChevronDown, ChevronUp, Trash2, Zap } from "lucide-react";

import type { FieldMappingProps } from "./types";
import { DataType } from "./types";

/**
 * Component that represents a single field mapping in the configuration interface.
 * Shows source field, target field, and transformation options.
 */
const FieldMapping: React.FC<FieldMappingProps> = ({
  mapping,
  sourceField,
  targetField,
  transformation,
  onRemove,
  onTransformationChange,
  onParameterChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Set up droppable for transformation function
  const { setNodeRef, isOver } = useDroppable({
    id: `transformation-drop-${mapping.id}`,
    data: {
      mappingId: mapping.id,
      type: "transformation-target",
      sourceFieldType: sourceField.type,
      targetFieldType: targetField.type,
    },
  });

  // Generate a parameter editor based on the transformation
  const renderParameterInputs = () => {
    const hasNoParameters =
      !transformation || transformation.parameters.length === 0;

    if (hasNoParameters) {
      return (
        <div className="text-xs text-gray-500">No parameters required</div>
      );
    }

    return (
      <div className="grid gap-3">
        {transformation.parameters.map((param) => (
          <div key={param.name} className="grid grid-cols-2 items-center gap-2">
            <label className="text-xs font-medium">{param.name}</label>
            <Input
              type={param.type === DataType.Number ? "number" : "text"}
              value={
                (mapping.parameters?.[param.name] ??
                  param.defaultValue ??
                  "") as string
              }
              placeholder={param.description}
              className="h-8 text-xs"
              onChange={(e) =>
                onParameterChange(mapping.id, param.name, e.target.value)
              }
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center">
          {/* Source Field */}
          <div className="w-1/3 rounded border border-blue-200 bg-blue-50 p-2">
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <span className="font-medium">{sourceField.name}</span>
                <span className="text-xs text-gray-500">
                  ({sourceField.type})
                </span>
              </div>
            </div>
          </div>

          {/* Transformation */}
          <div
            ref={setNodeRef}
            className={cn(
              "w-1/3 px-3 transition-colors",
              isOver && "rounded-md border border-blue-200 bg-blue-50",
            )}
          >
            <div className="flex flex-col items-center">
              <div className="flex items-center">
                <span className="mb-1 mr-1 text-xs text-gray-500">
                  Transform with
                </span>
                {isOver && <Zap className="h-3 w-3 text-blue-500" />}
              </div>
              <Select
                value={transformation?.id ?? "none"}
                onValueChange={(value) =>
                  onTransformationChange(
                    mapping.id,
                    value === "none" ? "" : value,
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select transformation..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No transformation</SelectItem>

                  {/* We'll just use hardcoded transformations for now,
                      since this is just a test/demo page.
                      In a real implementation, this would be populated
                      dynamically based on source/target field types. */}
                  <SelectGroup>
                    <SelectLabel>String Transformations</SelectLabel>
                    <SelectItem value="transform1">Concatenate</SelectItem>
                    <SelectItem value="transform2">Uppercase</SelectItem>
                  </SelectGroup>

                  <SelectGroup>
                    <SelectLabel>Number Transformations</SelectLabel>
                    <SelectItem value="transform3">Multiply</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {transformation && (
                <span className="mt-1 text-xs text-gray-500">
                  {transformation.category} Category
                </span>
              )}
            </div>
          </div>

          {/* Target Field */}
          <div className="w-1/3 rounded border border-green-200 bg-green-50 p-2">
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <span className="font-medium">{targetField.name}</span>
                <span className="text-xs text-gray-500">
                  ({targetField.type})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-2 flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleExpanded}
            className="h-7 px-2 text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="mr-1 h-3 w-3" /> Hide Parameters
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-3 w-3" /> Show Parameters
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(mapping.id)}
            className="h-7 px-2 text-xs text-red-500 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="mr-1 h-3 w-3" /> Remove
          </Button>
        </div>

        {/* Parameters (conditional) */}
        {isExpanded && (
          <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3">
            <h4 className="mb-2 text-xs font-medium">Parameters</h4>
            {renderParameterInputs()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FieldMapping;
