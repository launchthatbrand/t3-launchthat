"use client";

import type {
  FieldItem,
  MappingItem,
  TransformationItem,
  ValidationRule,
} from "@/components/integrations/transformations/types";
import React, { useState } from "react";
import MappingConfigurationWithValidation from "@/components/integrations/transformations/MappingConfigurationWithValidation";
import {
  DataType,
  TransformationCategory,
} from "@/components/integrations/transformations/types";
import { nanoid } from "nanoid";

export default function ValidationTestPage() {
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

  // Sample target fields with some required
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

  // Custom validation rules example
  const [customValidationRules] = useState<ValidationRule[]>([
    {
      id: "email-validation",
      name: "Email Field Validation",
      description: "Checks if email fields are properly formatted",
      validate: (sourceField, targetField, _transformation) => {
        // Example: if mapping email fields, check if they're both labeled correctly
        if (
          (sourceField.name.toLowerCase().includes("email") ||
            targetField.name.toLowerCase().includes("email")) &&
          !(
            sourceField.name.toLowerCase().includes("email") &&
            targetField.name.toLowerCase().includes("email")
          )
        ) {
          return {
            isValid: false,
            message:
              "Email fields should be mapped to fields that are also labeled as email",
            severity: "warning",
          };
        }
        return {
          isValid: true,
        };
      },
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
      <h1 className="mb-4 text-3xl font-bold">
        Data Mapping Configuration with Validation
      </h1>
      <p className="mb-8 text-gray-700">
        This page demonstrates the validation features of the mapping interface.
        The system validates:
      </p>

      <ul className="mb-8 list-disc space-y-2 pl-8">
        <li>Type compatibility between fields</li>
        <li>Required target fields coverage</li>
        <li>Transformation compatibility with field types</li>
        <li>Required transformation parameters</li>
        <li>Custom validation rules (email field example)</li>
      </ul>

      <div className="mb-8 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <h3 className="mb-2 font-medium">Try these validation scenarios:</h3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Drag string fields to number fields without a conversion
            transformation (type mismatch)
          </li>
          <li>
            Try to save without mapping all required target fields (missing
            required fields)
          </li>
          <li>
            Apply a transformation but don't fill in its required parameters
            (missing parameters)
          </li>
          <li>
            Map email fields incorrectly to trigger the custom validation rule
            (custom rules)
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
        onSave={handleSave}
        onTest={handleTest}
        onCancel={handleCancel}
        validationRules={[...customValidationRules]}
      />
    </div>
  );
}
