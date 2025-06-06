"use client";

import React, { useState } from "react";
import MappingConfiguration from "@/components/integrations/transformations/MappingConfiguration";
import {
  DataType,
  FieldItem,
  MappingItem,
  TransformationCategory,
  TransformationItem,
} from "@/components/integrations/transformations/types";
import { nanoid } from "nanoid";

export default function DndTestPage() {
  // Sample source fields
  const [sourceFields] = useState<FieldItem[]>([
    {
      id: "source1",
      name: "firstName",
      path: "firstName",
      type: DataType.String,
      required: true,
      description: "Customer's first name",
    },
    {
      id: "source2",
      name: "lastName",
      path: "lastName",
      type: DataType.String,
      required: true,
      description: "Customer's last name",
    },
    {
      id: "source3",
      name: "age",
      path: "age",
      type: DataType.Number,
      required: false,
      description: "Customer's age",
    },
    {
      id: "source4",
      name: "email",
      path: "email",
      type: DataType.String,
      required: true,
      description: "Customer's email address",
    },
    {
      id: "source5",
      name: "isActive",
      path: "isActive",
      type: DataType.Boolean,
      required: false,
      description: "Whether the customer is active",
    },
  ]);

  // Sample target fields
  const [targetFields] = useState<FieldItem[]>([
    {
      id: "target1",
      name: "user_name",
      path: "user_name",
      type: DataType.String,
      required: true,
      description: "User's full name",
    },
    {
      id: "target2",
      name: "user_email",
      path: "user_email",
      type: DataType.String,
      required: true,
      description: "User's email address",
    },
    {
      id: "target3",
      name: "user_age",
      path: "user_age",
      type: DataType.Number,
      required: false,
      description: "User's age",
    },
    {
      id: "target4",
      name: "user_status",
      path: "user_status",
      type: DataType.String,
      required: false,
      description: "User's status",
    },
  ]);

  // Sample transformations
  const [transformations] = useState<TransformationItem[]>([
    {
      id: "transform1",
      name: "concatenate",
      description: "Concatenate two strings with a separator",
      category: TransformationCategory.String,
      inputTypes: [DataType.String],
      outputType: DataType.String,
      parameters: [
        {
          name: "separator",
          type: DataType.String,
          required: false,
          description: "Separator between the strings",
          defaultValue: " ",
        },
      ],
    },
    {
      id: "transform2",
      name: "uppercase",
      description: "Convert string to uppercase",
      category: TransformationCategory.String,
      inputTypes: [DataType.String],
      outputType: DataType.String,
      parameters: [],
    },
    {
      id: "transform3",
      name: "multiply",
      description: "Multiply a number by a factor",
      category: TransformationCategory.Number,
      inputTypes: [DataType.Number],
      outputType: DataType.Number,
      parameters: [
        {
          name: "factor",
          type: DataType.Number,
          required: true,
          description: "Factor to multiply by",
          defaultValue: 1,
        },
      ],
    },
  ]);

  // Mappings state
  const [mappings, setMappings] = useState<MappingItem[]>([]);

  // Handler for creating new mappings
  const handleCreateMapping = (
    sourceFieldId: string,
    targetFieldId: string,
  ) => {
    const newMapping: MappingItem = {
      id: nanoid(),
      sourceFieldId,
      targetFieldId,
    };
    setMappings([...mappings, newMapping]);
  };

  // Handler for removing mappings
  const handleRemoveMapping = (id: string) => {
    setMappings(mappings.filter((mapping) => mapping.id !== id));
  };

  // Handler for changing transformation
  const handleTransformationChange = (
    mappingId: string,
    transformationId: string,
  ) => {
    setMappings(
      mappings.map((mapping) => {
        if (mapping.id === mappingId) {
          return {
            ...mapping,
            transformationId: transformationId || undefined,
            parameters: transformationId ? {} : undefined,
          };
        }
        return mapping;
      }),
    );
  };

  // Handler for changing parameters
  const handleParameterChange = (
    mappingId: string,
    paramName: string,
    value: unknown,
  ) => {
    setMappings(
      mappings.map((mapping) => {
        if (mapping.id === mappingId) {
          return {
            ...mapping,
            parameters: {
              ...(mapping.parameters ?? {}),
              [paramName]: value,
            },
          };
        }
        return mapping;
      }),
    );
  };

  // Handler for saving configuration
  const handleSave = () => {
    console.log("Saving configuration:", mappings);
    alert("Configuration saved!");
  };

  // Handler for testing mappings
  const handleTest = () => {
    console.log("Testing mappings:", mappings);
    alert("Testing mappings!");
  };

  // Handler for canceling
  const handleCancel = () => {
    if (
      confirm(
        "Are you sure you want to cancel? Any unsaved changes will be lost.",
      )
    ) {
      setMappings([]);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Data Mapping Configuration</h1>
      <p className="mb-8 text-gray-700">
        This page demonstrates the drag-and-drop mapping interface using
        @dnd-kit. Try dragging source fields and dropping them on target fields
        to create mappings.
      </p>

      <MappingConfiguration
        sourceFields={sourceFields}
        targetFields={targetFields}
        mappings={mappings}
        transformations={transformations}
        onMappingCreate={handleCreateMapping}
        onMappingRemove={handleRemoveMapping}
        onTransformationChange={handleTransformationChange}
        onParameterChange={handleParameterChange}
        onSave={handleSave}
        onTest={handleTest}
        onCancel={handleCancel}
      />
    </div>
  );
}
