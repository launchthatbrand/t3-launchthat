"use client";

import type {
  FieldItem,
  MappingItem,
} from "@/components/integrations/transformations/types";
import { useState } from "react";
import AccessibleDraggableField from "@/components/integrations/transformations/AccessibleDraggableField";
import AccessibleDroppableZone from "@/components/integrations/transformations/AccessibleDroppableZone";
import {
  standardModifiers,
  useStandardSensors,
} from "@/components/integrations/transformations/dndUtils";
import { DataType } from "@/components/integrations/transformations/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DndContext } from "@dnd-kit/core";
import { nanoid } from "nanoid";

export default function A11yTestPage() {
  // Set up state for mappings
  const [mappings, setMappings] = useState<MappingItem[]>([]);

  // Set up test fields
  const [sourceFields] = useState<FieldItem[]>([
    {
      id: "source1",
      name: "First Name",
      path: "firstName",
      type: DataType.String,
      required: true,
      description: "Customer's first name",
    },
    {
      id: "source2",
      name: "Last Name",
      path: "lastName",
      type: DataType.String,
      required: true,
      description: "Customer's last name",
    },
    {
      id: "source3",
      name: "Age",
      path: "age",
      type: DataType.Number,
      required: false,
      description: "Customer's age in years",
    },
    {
      id: "source4",
      name: "Email",
      path: "email",
      type: DataType.String,
      required: true,
      description: "Customer's email address",
    },
  ]);

  const [targetFields] = useState<FieldItem[]>([
    {
      id: "target1",
      name: "Full Name",
      path: "fullName",
      type: DataType.String,
      required: true,
      description: "User's full name",
    },
    {
      id: "target2",
      name: "Contact Email",
      path: "contactEmail",
      type: DataType.String,
      required: true,
      description: "User's email address",
    },
    {
      id: "target3",
      name: "Years Old",
      path: "yearsOld",
      type: DataType.Number,
      required: false,
      description: "User's age",
    },
  ]);

  // Standard sensors for consistent behavior
  const sensors = useStandardSensors();

  // Handle drag end to create mappings
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!active || !over) return;

    const sourceId = active.id.toString();
    const targetId = over.id.toString();

    // Prevent dropping on self
    if (sourceId === targetId) return;

    // Find the source and target fields
    const sourceField = sourceFields.find((field) => field.id === sourceId);
    const targetField = targetFields.find((field) => field.id === targetId);

    // If both fields exist, create a mapping
    if (sourceField && targetField) {
      // Check if this mapping already exists
      const existingMapping = mappings.find(
        (mapping) =>
          mapping.sourceFieldId === sourceId &&
          mapping.targetFieldId === targetId,
      );

      if (!existingMapping) {
        setMappings([
          ...mappings,
          {
            id: nanoid(),
            sourceFieldId: sourceId,
            targetFieldId: targetId,
          },
        ]);
      }
    }
  };

  // Handle removing a mapping
  const handleRemoveMapping = (mappingId: string) => {
    setMappings(mappings.filter((mapping) => mapping.id !== mappingId));
  };

  // Get used field IDs
  const usedSourceFieldIds = mappings.map((mapping) => mapping.sourceFieldId);
  const usedTargetFieldIds = mappings.map((mapping) => mapping.targetFieldId);

  // Find field by ID
  const findFieldById = (id: string): FieldItem | undefined => {
    return [...sourceFields, ...targetFields].find((field) => field.id === id);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-4 text-3xl font-bold">Accessible Drag and Drop Test</h1>
      <p className="mb-8 text-gray-700">
        This page demonstrates the accessible drag and drop components with
        keyboard navigation and screen reader support.
      </p>

      <div className="mb-8 rounded-md border border-blue-200 bg-blue-50 p-4 text-blue-800">
        <h3 className="mb-2 font-medium">Accessibility features:</h3>
        <ul className="list-disc space-y-2 pl-5">
          <li>Keyboard navigation (Tab to focus, Enter/Space to activate)</li>
          <li>Screen reader announcements for drag operations</li>
          <li>ARIA attributes for meaningful relationships</li>
          <li>Focus management during drag and drop</li>
          <li>Color contrast compliance for visual feedback</li>
        </ul>

        <div className="mt-4">
          <h3 className="mb-2 font-medium">Try this:</h3>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Use Tab key to navigate between draggable fields</li>
            <li>Press Enter or Space to activate drag mode</li>
            <li>Use Tab to move to a drop target</li>
            <li>Press Enter or Space to drop the field</li>
          </ol>
        </div>
      </div>

      <Tabs defaultValue="visual" className="mb-8">
        <TabsList>
          <TabsTrigger value="visual">Visual Mode</TabsTrigger>
          <TabsTrigger value="keyboard">Keyboard Mode</TabsTrigger>
        </TabsList>

        <TabsContent value="visual">
          <p className="mb-4 text-gray-700">
            Drag fields from source to target zones using mouse or touch.
          </p>
        </TabsContent>

        <TabsContent value="keyboard">
          <p className="mb-4 text-gray-700">
            Tab to a field, press Space to pick it up, Tab to a target, press
            Space to drop.
          </p>
        </TabsContent>
      </Tabs>

      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        modifiers={standardModifiers}
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Source Fields */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle>Source Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sourceFields.map((field) => (
                  <AccessibleDraggableField
                    key={field.id}
                    field={field}
                    isSource={true}
                    className={
                      usedSourceFieldIds.includes(field.id) ? "opacity-60" : ""
                    }
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Target Fields */}
          <Card className="lg:col-span-5 lg:col-start-8">
            <CardHeader>
              <CardTitle>Target Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {targetFields.map((field) => (
                  <AccessibleDroppableZone
                    key={field.id}
                    id={field.id}
                    acceptTypes={[field.type]}
                    isDisabled={usedTargetFieldIds.includes(field.id)}
                  >
                    <AccessibleDraggableField field={field} isSource={false} />
                  </AccessibleDroppableZone>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mappings */}
          <Card className="lg:col-span-12">
            <CardHeader>
              <CardTitle>Current Mappings</CardTitle>
            </CardHeader>
            <CardContent>
              {mappings.length > 0 ? (
                <div className="space-y-2">
                  {mappings.map((mapping) => {
                    const sourceField = findFieldById(mapping.sourceFieldId);
                    const targetField = findFieldById(mapping.targetFieldId);

                    if (!sourceField || !targetField) return null;

                    return (
                      <div
                        key={mapping.id}
                        className="flex items-center justify-between rounded-md border border-gray-200 p-3"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="font-medium">{sourceField.name}</div>
                          <div className="text-gray-500">→</div>
                          <div className="font-medium">{targetField.name}</div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMapping(mapping.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <p>
                    No mappings yet. Drag a source field to a target field to
                    create a mapping.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DndContext>
    </div>
  );
}
