/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

"use client";

import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import React, { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import type {
  FieldItem,
  MappingConfigurationProps,
  TransformationCategory,
  TransformationItem,
} from "./types";
import AccessibleDraggableField from "./AccessibleDraggableField";
import AccessibleDroppableZone from "./AccessibleDroppableZone";
import FieldMapping from "./FieldMapping";
import TransformationSelector from "./TransformationSelector";
import { DataType } from "./types";

/**
 * Main component for the mapping configuration interface.
 * Provides a drag-and-drop interface for mapping source fields to target fields
 * with optional transformations.
 */
const MappingConfiguration: React.FC<MappingConfigurationProps> = ({
  sourceFields,
  targetFields,
  mappings,
  transformations,
  onMappingCreate,
  onMappingRemove,
  onTransformationChange,
  onParameterChange,
  onSave,
  onCancel,
  onTest,
}) => {
  // State for active drag
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Find the active field and transformation
  const activeField = useMemo(() => {
    if (!activeId) return null;
    return [...sourceFields, ...targetFields].find(
      (field) => field.id === activeId,
    );
  }, [activeId, sourceFields, targetFields]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Optional: implement additional logic for drag over events
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      // If no over target or same as source, do nothing
      if (!over) return;

      const sourceId = active.id.toString();
      const targetId = over.id.toString();

      // Prevent dropping on self
      if (sourceId === targetId) return;

      // Check if we're dropping a transformation function onto a mapping
      if (
        sourceId.startsWith("transformation-") &&
        targetId.startsWith("transformation-drop-")
      ) {
        // Extract IDs
        const transformationId = sourceId.replace("transformation-", "");
        const mappingId = targetId.replace("transformation-drop-", "");

        // Apply the transformation to the mapping
        onTransformationChange(mappingId, transformationId);
        return;
      }

      // Determine if this is a valid field mapping
      const sourceField = sourceFields.find((field) => field.id === sourceId);
      const targetField = targetFields.find((field) => field.id === targetId);

      // If both fields exist, create a mapping
      if (sourceField && targetField) {
        onMappingCreate(sourceId, targetId);
      }
    },
    [sourceFields, targetFields, onMappingCreate, onTransformationChange],
  );

  // Handle field removal
  const handleRemoveMapping = useCallback(
    (id: string) => {
      onMappingRemove(id);
    },
    [onMappingRemove],
  );

  // Get fields used in mappings
  const usedSourceFieldIds = useMemo(
    () => mappings.map((mapping) => mapping.sourceFieldId),
    [mappings],
  );

  const usedTargetFieldIds = useMemo(
    () => mappings.map((mapping) => mapping.targetFieldId),
    [mappings],
  );

  // Find fields by IDs (for mapping components)
  const findFieldById = useCallback(
    (id: string): FieldItem | undefined => {
      return [...sourceFields, ...targetFields].find(
        (field) => field.id === id,
      );
    },
    [sourceFields, targetFields],
  );

  // Find transformation by ID
  const findTransformationById = useCallback(
    (id: string | undefined): TransformationItem | undefined => {
      if (!id) return undefined;
      return transformations.find((t) => t.id === id);
    },
    [transformations],
  );

  // Accept data types for dropzones
  const acceptableDataTypes = [
    DataType.String,
    DataType.Number,
    DataType.Boolean,
    DataType.Date,
    DataType.Object,
    DataType.Array,
  ];

  // Handle click selection of transformation
  const handleTransformationSelect = useCallback(
    (transformation: TransformationItem) => {
      // If there's no active mapping, do nothing
      if (!activeId) return;

      // Find if this is a mapping item
      const mappingId = activeId.startsWith("transformation-drop-")
        ? activeId.replace("transformation-drop-", "")
        : null;

      if (mappingId) {
        // Apply the transformation to the mapping
        onTransformationChange(mappingId, transformation.id);
      }
    },
    [activeId, onTransformationChange],
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Panel - Source Fields */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Source Schema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-3">
                <h3 className="mb-2 text-sm font-medium">Available Fields</h3>
                <div className="space-y-2">
                  {sourceFields.map((field) => (
                    <AccessibleDraggableField
                      key={field.id}
                      field={field}
                      isSource={true}
                      className={
                        usedSourceFieldIds.includes(field.id)
                          ? "opacity-50"
                          : ""
                      }
                    />
                  ))}

                  {sourceFields.length === 0 && (
                    <div className="p-2 text-center text-sm text-gray-500">
                      No source fields available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Middle Panel - Mappings */}
        <Card className="lg:col-span-6">
          <CardHeader>
            <CardTitle>Field Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              {/* Existing Mappings */}
              {mappings.map((mapping) => {
                const sourceField = findFieldById(mapping.sourceFieldId);
                const targetField = findFieldById(mapping.targetFieldId);
                const transformation = findTransformationById(
                  mapping.transformationId,
                );

                if (!sourceField || !targetField) return null;

                return (
                  <FieldMapping
                    key={mapping.id}
                    mapping={mapping}
                    sourceField={sourceField}
                    targetField={targetField}
                    transformation={transformation}
                    onRemove={handleRemoveMapping}
                    onTransformationChange={onTransformationChange}
                    onParameterChange={onParameterChange}
                  />
                );
              })}

              {/* Drop Zone for New Mappings */}
              {mappings.length === 0 ? (
                <AccessibleDroppableZone
                  id="new-mapping-zone"
                  className="flex min-h-[120px] items-center justify-center"
                >
                  <div className="text-center text-gray-500">
                    <p>Drag source fields here to create mappings</p>
                    <p className="mt-1 text-xs">
                      Drop a source field onto a target field to create a
                      mapping
                    </p>
                  </div>
                </AccessibleDroppableZone>
              ) : (
                <AccessibleDroppableZone
                  id="new-mapping-zone"
                  className="flex min-h-[60px] items-center justify-center"
                >
                  <p className="text-center text-gray-500">
                    Drop a source field here to add another mapping
                  </p>
                </AccessibleDroppableZone>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Target Fields */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Target Schema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-3">
                <h3 className="mb-2 text-sm font-medium">Required Fields</h3>
                <div className="space-y-2">
                  {targetFields
                    .filter((field) => field.required)
                    .map((field) => (
                      <AccessibleDroppableZone
                        key={field.id}
                        id={field.id}
                        acceptTypes={acceptableDataTypes}
                        isDisabled={usedTargetFieldIds.includes(field.id)}
                      >
                        <AccessibleDraggableField
                          field={field}
                          isSource={false}
                          className={
                            usedTargetFieldIds.includes(field.id)
                              ? "opacity-50"
                              : ""
                          }
                        />
                      </AccessibleDroppableZone>
                    ))}

                  {targetFields.filter((field) => field.required).length ===
                    0 && (
                    <div className="p-2 text-center text-sm text-gray-500">
                      No required target fields
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-3">
                <h3 className="mb-2 text-sm font-medium">Optional Fields</h3>
                <div className="space-y-2">
                  {targetFields
                    .filter((field) => !field.required)
                    .map((field) => (
                      <AccessibleDroppableZone
                        key={field.id}
                        id={field.id}
                        acceptTypes={acceptableDataTypes}
                        isDisabled={usedTargetFieldIds.includes(field.id)}
                      >
                        <AccessibleDraggableField
                          field={field}
                          isSource={false}
                          className={
                            usedTargetFieldIds.includes(field.id)
                              ? "opacity-50"
                              : ""
                          }
                        />
                      </AccessibleDroppableZone>
                    ))}

                  {targetFields.filter((field) => !field.required).length ===
                    0 && (
                    <div className="p-2 text-center text-sm text-gray-500">
                      No optional target fields
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Function Selector */}
        <Card className="lg:col-span-12">
          <CardHeader>
            <CardTitle>Transformation Functions</CardTitle>
          </CardHeader>
          <CardContent>
            <TransformationSelector
              transformations={transformations}
              selectedCategory={selectedCategory as TransformationCategory}
              onCategoryChange={(category) =>
                setSelectedCategory(category as string)
              }
              onTransformationSelect={handleTransformationSelect}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 lg:col-span-12">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="outline" onClick={onTest}>
            Test Mappings
          </Button>
          <Button onClick={onSave}>Save Configuration</Button>
        </div>
      </div>
    </DndContext>
  );
};

export default MappingConfiguration;
