"use client";

import type {
  FieldItem,
  TransformationItem,
} from "@/components/integrations/transformations/types";
import { useCallback, useEffect, useState } from "react";
import MappingConfigurationWithValidation from "@/components/integrations/transformations/MappingConfigurationWithValidation";
import MappingPreview from "@/components/integrations/transformations/MappingPreview";
import {
  DataType,
  MappingItem,
  MappingPreviewResult,
  SampleData,
  TransformationCategory,
} from "@/components/integrations/transformations/types";
import { Button } from "@/components/ui/button";
import { nanoid } from "nanoid";

export default function PreviewTestPage() {
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
    {
      id: "source6",
      name: "registrationDate",
      path: "registrationDate",
      type: DataType.Date,
      required: false,
      description: "When the customer registered",
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
    {
      id: "target5",
      name: "account_created",
      path: "account_created",
      type: DataType.Date,
      required: true,
      description: "Account creation date",
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
        {
          name: "secondString",
          type: DataType.String,
          required: true,
          description: "Second string to concatenate",
          defaultValue: "",
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
    {
      id: "transform4",
      name: "stringToNumber",
      description: "Convert string to number",
      category: TransformationCategory.Conversion,
      inputTypes: [DataType.String],
      outputType: DataType.Number,
      parameters: [
        {
          name: "defaultValue",
          type: DataType.Number,
          required: false,
          description: "Default value if conversion fails",
          defaultValue: 0,
        },
      ],
    },
    {
      id: "transform5",
      name: "formatDate",
      description: "Format a date as string",
      category: TransformationCategory.Date,
      inputTypes: [DataType.Date],
      outputType: DataType.String,
      parameters: [
        {
          name: "format",
          type: DataType.String,
          required: true,
          description: "Date format string (e.g. 'YYYY-MM-DD')",
          defaultValue: "YYYY-MM-DD",
        },
      ],
    },
    {
      id: "transform6",
      name: "booleanToString",
      description: "Convert boolean to string",
      category: TransformationCategory.Conversion,
      inputTypes: [DataType.Boolean],
      outputType: DataType.String,
      parameters: [
        {
          name: "trueValue",
          type: DataType.String,
          required: false,
          description: "Value for true",
          defaultValue: "true",
        },
        {
          name: "falseValue",
          type: DataType.String,
          required: false,
          description: "Value for false",
          defaultValue: "false",
        },
      ],
    },
  ]);

  // Sample data for preview
  const [sampleData] = useState<SampleData[]>([
    {
      id: "sample1",
      name: "John Doe",
      data: {
        firstName: "John",
        lastName: "Doe",
        age: 30,
        email: "john.doe@example.com",
        isActive: true,
        registrationDate: "2023-01-15T00:00:00.000Z",
      },
    },
    {
      id: "sample2",
      name: "Jane Smith",
      data: {
        firstName: "Jane",
        lastName: "Smith",
        age: 25,
        email: "jane.smith@example.com",
        isActive: false,
        registrationDate: "2023-04-22T00:00:00.000Z",
      },
    },
    {
      id: "sample3",
      name: "Bob Johnson",
      data: {
        firstName: "Bob",
        lastName: "Johnson",
        age: 42,
        email: "bob.johnson@example.com",
        isActive: true,
        registrationDate: "2022-11-05T00:00:00.000Z",
      },
    },
  ]);

  // Mappings state
  const [mappings, setMappings] = useState<MappingItem[]>([]);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string>("sample1");
  const [isLoading, setIsLoading] = useState(false);
  const [previewResults, setPreviewResults] = useState<
    Record<string, MappingPreviewResult>
  >({});

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

  // Simulate transformation execution
  const executeTransformations = useCallback(() => {
    const sample = sampleData.find((s) => s.id === selectedSampleId);
    if (!sample) return {};

    setIsLoading(true);

    // Simulate async processing
    setTimeout(() => {
      const results: Record<string, MappingPreviewResult> = {};

      // Process each mapping
      mappings.forEach((mapping) => {
        const sourceField = sourceFields.find(
          (f) => f.id === mapping.sourceFieldId,
        );
        const targetField = targetFields.find(
          (f) => f.id === mapping.targetFieldId,
        );
        const transformation = mapping.transformationId
          ? transformations.find((t) => t.id === mapping.transformationId)
          : undefined;

        if (!sourceField || !targetField) return;

        // Get source value
        const sourceValue = sample.data[sourceField.path];
        let targetValue = sourceValue;
        let isSuccess = true;
        let error: string | undefined;

        // Apply transformation if needed
        if (transformation) {
          try {
            // Simulate transformation execution based on type
            switch (transformation.id) {
              case "transform1": // concatenate
                const separator = mapping.parameters?.separator ?? " ";
                const secondString = mapping.parameters?.secondString ?? "";
                if (typeof sourceValue === "string") {
                  targetValue = `${sourceValue}${separator}${secondString}`;
                } else {
                  throw new Error("Source value is not a string");
                }
                break;

              case "transform2": // uppercase
                if (typeof sourceValue === "string") {
                  targetValue = sourceValue.toUpperCase();
                } else {
                  throw new Error("Source value is not a string");
                }
                break;

              case "transform3": // multiply
                const factor = Number(mapping.parameters?.factor) || 1;
                if (typeof sourceValue === "number") {
                  targetValue = sourceValue * factor;
                } else {
                  throw new Error("Source value is not a number");
                }
                break;

              case "transform4": // stringToNumber
                const defaultValue =
                  Number(mapping.parameters?.defaultValue) || 0;
                if (typeof sourceValue === "string") {
                  const parsed = Number(sourceValue);
                  targetValue = isNaN(parsed) ? defaultValue : parsed;
                } else {
                  throw new Error("Source value is not a string");
                }
                break;

              case "transform5": // formatDate
                // Simplified format handling for demo
                if (
                  sourceValue instanceof Date ||
                  typeof sourceValue === "string"
                ) {
                  const date = new Date(sourceValue);
                  targetValue = date.toISOString().split("T")[0]; // YYYY-MM-DD
                } else {
                  throw new Error("Source value is not a date");
                }
                break;

              case "transform6": // booleanToString
                const trueValue = mapping.parameters?.trueValue ?? "true";
                const falseValue = mapping.parameters?.falseValue ?? "false";
                if (typeof sourceValue === "boolean") {
                  targetValue = sourceValue ? trueValue : falseValue;
                } else {
                  throw new Error("Source value is not a boolean");
                }
                break;

              default:
                // For demo, just pass through the value
                targetValue = sourceValue;
            }
          } catch (err) {
            isSuccess = false;
            error = err instanceof Error ? err.message : "Unknown error";
            console.error("Transformation error:", err);
          }
        }

        // Store the result
        results[mapping.id] = {
          sourceValue,
          targetValue,
          isSuccess,
          error,
          transformation: transformation
            ? {
                name: transformation.name,
                parameters: mapping.parameters ?? {},
              }
            : undefined,
        };
      });

      setPreviewResults(results);
      setIsLoading(false);
    }, 1500); // Simulate processing delay
  }, [
    mappings,
    selectedSampleId,
    sampleData,
    sourceFields,
    targetFields,
    transformations,
  ]);

  // Update preview when sample changes
  useEffect(() => {
    if (showPreview && mappings.length > 0) {
      executeTransformations();
    }
  }, [showPreview, selectedSampleId, executeTransformations, mappings.length]);

  // Handler for testing mappings
  const handleTestMappings = () => {
    setShowPreview(true);
    executeTransformations();
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-4 text-3xl font-bold">Data Mapping Preview Test</h1>
      <p className="mb-8 text-gray-700">
        This page demonstrates the mapping preview feature that shows how data
        transformations would be applied in real-time.
      </p>

      <div className="mb-8 rounded-md border border-blue-200 bg-blue-50 p-4 text-blue-800">
        <h3 className="mb-2 font-medium">Preview feature:</h3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Create some mappings between source and target fields</li>
          <li>Add transformations to some of the mappings</li>
          <li>Click "Test Mappings" to open the preview panel</li>
          <li>
            Select different sample data sources to see how the transformations
            apply
          </li>
        </ol>
      </div>

      <MappingConfigurationWithValidation
        sourceFields={sourceFields}
        targetFields={targetFields}
        mappings={mappings}
        transformations={transformations}
        onMappingCreate={handleCreateMapping}
        onMappingRemove={handleRemoveMapping}
        onTransformationChange={handleTransformationChange}
        onParameterChange={handleParameterChange}
        onSave={() => alert("Mappings saved!")}
        onTest={handleTestMappings}
        onCancel={() => {
          if (confirm("Are you sure you want to cancel?")) {
            setMappings([]);
          }
        }}
      />

      {showPreview && (
        <MappingPreview
          sourceFields={sourceFields}
          targetFields={targetFields}
          mappings={mappings}
          transformations={transformations}
          sampleData={sampleData}
          onClose={() => setShowPreview(false)}
          onSelectSample={setSelectedSampleId}
          selectedSampleId={selectedSampleId}
          previewResults={previewResults}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
