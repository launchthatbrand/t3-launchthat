"use client";

import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { AlertCircle } from "lucide-react";

import type {
  FieldItem,
  MappingConfigurationWithValidationProps,
  MappingItem,
  TransformationCategory,
  TransformationItem,
  ValidationResult,
} from "./types";
import AccessibleDraggableField from "./AccessibleDraggableField";
import AccessibleDroppableZone from "./AccessibleDroppableZone";
import FieldMapping from "./FieldMapping";
import MappingValidationTooltip from "./MappingValidationTooltip";
import TransformationSelector from "./TransformationSelector";
import { DataType } from "./types";
import {
  defaultTypeCompatibilityRules,
  defaultValidationRules,
  findCompatibleTransformations,
  isTypeCompatible,
  validateAllMappings,
} from "./validation";

/**
 * Enhanced MappingConfiguration component with validation support.
 * Extends the base MappingConfiguration with real-time validation feedback.
 */
const MappingConfigurationWithValidation: React.FC<
  MappingConfigurationWithValidationProps
> = ({
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
  validationRules = defaultValidationRules,
  typeCompatibilityRules = defaultTypeCompatibilityRules,
}) => {
  // State for active drag
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [validationResults, setValidationResults] = useState<
    Record<string, ValidationResult[]>
  >({});
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);

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

  // Find the active field
  const activeField = useMemo(() => {
    if (!activeId) return null;
    return [...sourceFields, ...targetFields].find(
      (field) => field.id === activeId,
    );
  }, [activeId, sourceFields, targetFields]);

  // Find the hover target field
  const _hoverTargetField = useMemo(() => {
    if (!hoverTargetId) return null;
    return targetFields.find((field) => field.id === hoverTargetId);
  }, [hoverTargetId, targetFields]);

  // Validate all mappings when they change
  useEffect(() => {
    const results = validateAllMappings(
      mappings,
      sourceFields,
      targetFields,
      transformations,
      validationRules,
    );
    setValidationResults(results);
  }, [mappings, sourceFields, targetFields, transformations, validationRules]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  }, []);

  // Handle drag over for showing dynamic validation
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event;

      if (!over) {
        setHoverTargetId(null);
        return;
      }

      // If hovering over a target field, update the hover target ID
      const overId = over.id.toString();
      const isTargetField = targetFields.some((field) => field.id === overId);

      if (isTargetField) {
        setHoverTargetId(overId);
      } else {
        setHoverTargetId(null);
      }
    },
    [targetFields],
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setHoverTargetId(null);

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

        // Get the mapping, source field, and target field
        const mapping = mappings.find((m) => m.id === mappingId);
        if (!mapping) return;

        const sourceField = sourceFields.find(
          (f) => f.id === mapping.sourceFieldId,
        );
        const targetField = targetFields.find(
          (f) => f.id === mapping.targetFieldId,
        );
        const transformation = transformations.find(
          (t) => t.id === transformationId,
        );

        if (!sourceField || !targetField || !transformation) return;

        // Validate the transformation is compatible
        const isValid = isTypeCompatible(
          sourceField.type,
          targetField.type,
          transformation,
          typeCompatibilityRules,
        );

        // Apply only if valid
        if (isValid) {
          onTransformationChange(mappingId, transformationId);
        }
        return;
      }

      // Determine if this is a valid field mapping
      const sourceField = sourceFields.find((field) => field.id === sourceId);
      const targetField = targetFields.find((field) => field.id === targetId);

      // If both fields exist, check compatibility
      if (sourceField && targetField) {
        // Check if the fields are compatible
        const isValid = isTypeCompatible(
          sourceField.type,
          targetField.type,
          undefined,
          typeCompatibilityRules,
        );

        // Create mapping if valid
        if (isValid) {
          onMappingCreate(sourceId, targetId);
        }
      }
    },
    [
      sourceFields,
      targetFields,
      mappings,
      transformations,
      onMappingCreate,
      onTransformationChange,
      typeCompatibilityRules,
    ],
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

  // Get compatible transformations for a mapping
  const _getCompatibleTransformationsForMapping = useCallback(
    (mapping: MappingItem): TransformationItem[] => {
      const sourceField = sourceFields.find(
        (f) => f.id === mapping.sourceFieldId,
      );
      const targetField = targetFields.find(
        (f) => f.id === mapping.targetFieldId,
      );

      if (!sourceField || !targetField) return [];

      return findCompatibleTransformations(
        sourceField.type,
        targetField.type,
        transformations,
        typeCompatibilityRules,
      );
    },
    [sourceFields, targetFields, transformations, typeCompatibilityRules],
  );

  // Handle dynamic validation during drag
  const getDynamicValidationResults = useCallback(
    (sourceFieldId: string, targetFieldId: string): ValidationResult[] => {
      const sourceField = sourceFields.find((f) => f.id === sourceFieldId);
      const targetField = targetFields.find((f) => f.id === targetFieldId);

      if (!sourceField || !targetField) return [];

      // Check type compatibility
      const compatibilityResult = validationRules.find(
        (rule) => rule.id === "type-compatibility",
      );
      if (!compatibilityResult) return [];

      return [compatibilityResult.validate(sourceField, targetField)];
    },
    [sourceFields, targetFields, validationRules],
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
        // Get the mapping
        const mapping = mappings.find((m) => m.id === mappingId);
        if (!mapping) return;

        // Validate the transformation is compatible
        const sourceField = sourceFields.find(
          (f) => f.id === mapping.sourceFieldId,
        );
        const targetField = targetFields.find(
          (f) => f.id === mapping.targetFieldId,
        );

        if (!sourceField || !targetField) return;

        const isValid = isTypeCompatible(
          sourceField.type,
          targetField.type,
          transformation,
          typeCompatibilityRules,
        );

        // Apply only if valid
        if (isValid) {
          onTransformationChange(mappingId, transformation.id);
        }
      }
    },
    [
      activeId,
      mappings,
      sourceFields,
      targetFields,
      onTransformationChange,
      typeCompatibilityRules,
    ],
  );

  // Global validation status
  const hasGlobalErrors = useMemo(() => {
    return validationResults.GLOBAL?.some(
      (result) => !result.isValid && result.severity === "error",
    );
  }, [validationResults]);

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
            <div className="flex items-center justify-between">
              <CardTitle>Field Mappings</CardTitle>

              {/* Global validation error indicator */}
              {hasGlobalErrors && (
                <div className="flex items-center text-sm text-red-500">
                  <AlertCircle className="mr-1 h-4 w-4" />
                  <span>Required fields not mapped</span>
                </div>
              )}
            </div>
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
                const mappingValidation = validationResults[mapping.id] ?? [];

                if (!sourceField || !targetField) return null;

                return (
                  <MappingValidationTooltip
                    key={mapping.id}
                    validationResults={mappingValidation}
                  >
                    <FieldMapping
                      mapping={mapping}
                      sourceField={sourceField}
                      targetField={targetField}
                      transformation={transformation}
                      onRemove={handleRemoveMapping}
                      onTransformationChange={onTransformationChange}
                      onParameterChange={onParameterChange}
                    />
                  </MappingValidationTooltip>
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
                    .map((field) => {
                      // Get dynamic validation results if field is being hovered over
                      const dynamicValidation =
                        activeField &&
                        hoverTargetId === field.id &&
                        activeField.id !== field.id
                          ? getDynamicValidationResults(
                              activeField.id,
                              field.id,
                            )
                          : [];

                      return (
                        <AccessibleDroppableZone
                          key={field.id}
                          id={field.id}
                          acceptTypes={acceptableDataTypes}
                          isDisabled={usedTargetFieldIds.includes(field.id)}
                          validationResults={dynamicValidation}
                          validationMode="hover"
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
                      );
                    })}

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
                    .map((field) => {
                      // Get dynamic validation results if field is being hovered over
                      const dynamicValidation =
                        activeField &&
                        hoverTargetId === field.id &&
                        activeField.id !== field.id
                          ? getDynamicValidationResults(
                              activeField.id,
                              field.id,
                            )
                          : [];

                      return (
                        <AccessibleDroppableZone
                          key={field.id}
                          id={field.id}
                          acceptTypes={acceptableDataTypes}
                          isDisabled={usedTargetFieldIds.includes(field.id)}
                          validationResults={dynamicValidation}
                          validationMode="hover"
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
                      );
                    })}

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
              compatibleWith={activeField?.type}
            />
          </CardContent>
        </Card>

        {/* Validation Status and Action Buttons */}
        <div className="lg:col-span-12">
          {hasGlobalErrors && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
              <h3 className="mb-2 flex items-center font-medium">
                <AlertCircle className="mr-2 h-5 w-5" />
                Validation Errors
              </h3>
              <ul className="ml-7 list-disc space-y-1">
                {validationResults.GLOBAL?.map(
                  (result, index) =>
                    !result.isValid && <li key={index}>{result.message}</li>,
                )}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="outline" onClick={onTest}>
              Test Mappings
            </Button>
            <Button
              onClick={onSave}
              disabled={hasGlobalErrors}
              className={hasGlobalErrors ? "opacity-50" : ""}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </DndContext>
  );
};

export default MappingConfigurationWithValidation;
