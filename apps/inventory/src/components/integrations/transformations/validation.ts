"use client";

import type {
  FieldItem,
  MappingItem,
  TransformationItem,
  TypeCompatibilityRule,
  ValidationResult,
  ValidationRule,
} from "./types";
import { DataType, TransformationCategory } from "./types";

/**
 * Default type compatibility rules
 */
export const defaultTypeCompatibilityRules: TypeCompatibilityRule[] = [
  // String compatibility rules
  {
    sourceType: DataType.String,
    targetType: DataType.String,
    isCompatible: true,
  },
  {
    sourceType: DataType.String,
    targetType: DataType.Number,
    isCompatible: false,
    compatibleTransformations: [TransformationCategory.Conversion],
    message: "String to Number conversion requires a transformation",
  },
  {
    sourceType: DataType.String,
    targetType: DataType.Boolean,
    isCompatible: false,
    compatibleTransformations: [TransformationCategory.Conversion],
    message: "String to Boolean conversion requires a transformation",
  },
  {
    sourceType: DataType.String,
    targetType: DataType.Date,
    isCompatible: false,
    compatibleTransformations: [
      TransformationCategory.Date,
      TransformationCategory.Conversion,
    ],
    message: "String to Date conversion requires a date transformation",
  },

  // Number compatibility rules
  {
    sourceType: DataType.Number,
    targetType: DataType.Number,
    isCompatible: true,
  },
  {
    sourceType: DataType.Number,
    targetType: DataType.String,
    isCompatible: true,
    message: "Number will be automatically converted to String",
  },
  {
    sourceType: DataType.Number,
    targetType: DataType.Boolean,
    isCompatible: false,
    compatibleTransformations: [
      TransformationCategory.Conversion,
      TransformationCategory.Logic,
    ],
    message: "Number to Boolean conversion requires a transformation",
  },
  {
    sourceType: DataType.Number,
    targetType: DataType.Date,
    isCompatible: false,
    compatibleTransformations: [
      TransformationCategory.Date,
      TransformationCategory.Conversion,
    ],
    message:
      "Number to Date conversion requires a transformation (timestamp to date)",
  },

  // Boolean compatibility rules
  {
    sourceType: DataType.Boolean,
    targetType: DataType.Boolean,
    isCompatible: true,
  },
  {
    sourceType: DataType.Boolean,
    targetType: DataType.String,
    isCompatible: true,
    message:
      "Boolean will be automatically converted to String ('true'/'false')",
  },
  {
    sourceType: DataType.Boolean,
    targetType: DataType.Number,
    isCompatible: false,
    compatibleTransformations: [TransformationCategory.Conversion],
    message: "Boolean to Number conversion requires a transformation",
  },

  // Date compatibility rules
  {
    sourceType: DataType.Date,
    targetType: DataType.Date,
    isCompatible: true,
  },
  {
    sourceType: DataType.Date,
    targetType: DataType.String,
    isCompatible: false,
    compatibleTransformations: [
      TransformationCategory.Date,
      TransformationCategory.Conversion,
    ],
    message:
      "Date to String conversion requires a date formatting transformation",
  },
  {
    sourceType: DataType.Date,
    targetType: DataType.Number,
    isCompatible: false,
    compatibleTransformations: [
      TransformationCategory.Date,
      TransformationCategory.Conversion,
    ],
    message:
      "Date to Number conversion requires a transformation (date to timestamp)",
  },

  // Object compatibility rules
  {
    sourceType: DataType.Object,
    targetType: DataType.Object,
    isCompatible: true,
  },
  {
    sourceType: DataType.Object,
    targetType: DataType.String,
    isCompatible: false,
    compatibleTransformations: [
      TransformationCategory.Object,
      TransformationCategory.Json,
    ],
    message:
      "Object to String conversion requires a JSON stringification transformation",
  },

  // Array compatibility rules
  {
    sourceType: DataType.Array,
    targetType: DataType.Array,
    isCompatible: true,
  },
  {
    sourceType: DataType.Array,
    targetType: DataType.String,
    isCompatible: false,
    compatibleTransformations: [
      TransformationCategory.Array,
      TransformationCategory.Json,
    ],
    message:
      "Array to String conversion requires a JSON stringification or join transformation",
  },

  // Any type compatibility
  {
    sourceType: DataType.Any,
    targetType: DataType.Any,
    isCompatible: true,
  },
];

/**
 * Default validation rules
 */
export const defaultValidationRules: ValidationRule[] = [
  // Type compatibility rule
  {
    id: "type-compatibility",
    name: "Type Compatibility",
    description: "Checks if the source and target field types are compatible",
    validate: (
      sourceField: FieldItem,
      targetField: FieldItem,
      transformation?: TransformationItem,
    ): ValidationResult => {
      // Find compatibility rule
      const rule = defaultTypeCompatibilityRules.find(
        (r) =>
          r.sourceType === sourceField.type &&
          r.targetType === targetField.type,
      );

      if (!rule) {
        return {
          isValid: false,
          message: `No compatibility rule found for ${sourceField.type} to ${targetField.type}`,
          severity: "error",
        };
      }

      // If types are directly compatible
      if (rule.isCompatible) {
        return {
          isValid: true,
          message: rule.message,
          severity: "info",
        };
      }

      // If transformation is required and provided
      if (rule.compatibleTransformations && transformation) {
        const isTransformationCompatible =
          rule.compatibleTransformations.includes(transformation.category);

        if (isTransformationCompatible) {
          // Check if transformation output type matches target type
          if (transformation.outputType === targetField.type) {
            return {
              isValid: true,
              message: `${transformation.name} successfully converts ${sourceField.type} to ${targetField.type}`,
              severity: "info",
            };
          } else {
            return {
              isValid: false,
              message: `Transformation output type (${transformation.outputType}) doesn't match target field type (${targetField.type})`,
              severity: "error",
            };
          }
        }
      }

      // If we need a transformation but don't have one
      if (rule.compatibleTransformations && !transformation) {
        const transformationTypes = rule.compatibleTransformations.join(", ");
        return {
          isValid: false,
          message: `Requires a ${transformationTypes} transformation. ${rule.message}`,
          severity: "error",
        };
      }

      return {
        isValid: false,
        message:
          rule.message ??
          `Incompatible types: ${sourceField.type} to ${targetField.type}`,
        severity: "error",
      };
    },
  },

  // Required parameters validation
  {
    id: "required-parameters",
    name: "Required Parameters",
    description:
      "Checks if all required transformation parameters are provided",
    validate: (
      _sourceField: FieldItem,
      _targetField: FieldItem,
      transformation?: TransformationItem,
      parameters?: Record<string, unknown>,
    ): ValidationResult => {
      if (!transformation?.parameters.length) {
        return {
          isValid: true,
        };
      }

      const missingParams = transformation.parameters
        .filter((param) => param.required && parameters?.[param.name] == null)
        .map((param) => param.name);

      if (missingParams.length > 0) {
        return {
          isValid: false,
          message: `Missing required parameters: ${missingParams.join(", ")}`,
          severity: "error",
        };
      }

      return {
        isValid: true,
      };
    },
  },

  // Target field required validation
  {
    id: "required-target-field",
    name: "Required Target Field",
    description: "Checks if all required target fields have mappings",
    validate: (
      _sourceField: FieldItem,
      targetField: FieldItem,
    ): ValidationResult => {
      if (targetField.required) {
        return {
          isValid: true,
          message: "Required field is mapped",
          severity: "info",
        };
      }

      return {
        isValid: true,
      };
    },
  },
];

/**
 * Validates a mapping using provided rules
 */
export function validateMapping(
  sourceField: FieldItem,
  targetField: FieldItem,
  transformation?: TransformationItem,
  parameters?: Record<string, unknown>,
  rules: ValidationRule[] = defaultValidationRules,
): ValidationResult[] {
  return rules.map((rule) =>
    rule.validate(sourceField, targetField, transformation, parameters),
  );
}

/**
 * Checks if a source field type is compatible with a target field type
 */
export function isTypeCompatible(
  sourceType: DataType,
  targetType: DataType,
  transformation?: TransformationItem,
  rules: TypeCompatibilityRule[] = defaultTypeCompatibilityRules,
): boolean {
  // Find the rule
  const rule = rules.find(
    (r) => r.sourceType === sourceType && r.targetType === targetType,
  );

  if (!rule) return false;

  // Direct compatibility
  if (rule.isCompatible) return true;

  // Check if transformation makes it compatible
  if (transformation && rule.compatibleTransformations) {
    const isTransformationCompatible = rule.compatibleTransformations.includes(
      transformation.category,
    );
    const isOutputTypeCorrect = transformation.outputType === targetType;

    return isTransformationCompatible && isOutputTypeCorrect;
  }

  return false;
}

/**
 * Validates all mappings in the configuration
 */
export function validateAllMappings(
  mappings: MappingItem[],
  sourceFields: FieldItem[],
  targetFields: FieldItem[],
  transformations: TransformationItem[],
  rules: ValidationRule[] = defaultValidationRules,
): Record<string, ValidationResult[]> {
  const validationResults: Record<string, ValidationResult[]> = {};

  // Validate each mapping
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

    if (sourceField && targetField) {
      validationResults[mapping.id] = validateMapping(
        sourceField,
        targetField,
        transformation,
        mapping.parameters,
        rules,
      );
    }
  });

  // Check required fields coverage
  const mappedTargetFieldIds = mappings.map((m) => m.targetFieldId);
  const unmappedRequiredFields = targetFields.filter(
    (field) => field.required && !mappedTargetFieldIds.includes(field.id),
  );

  if (unmappedRequiredFields.length > 0) {
    validationResults.GLOBAL = [
      {
        isValid: false,
        message: `Missing mappings for required fields: ${unmappedRequiredFields.map((f) => f.name).join(", ")}`,
        severity: "error",
      },
    ];
  }

  return validationResults;
}

/**
 * Finds compatible transformations for a source and target field pair
 */
export function findCompatibleTransformations(
  sourceType: DataType,
  targetType: DataType,
  transformations: TransformationItem[],
  rules: TypeCompatibilityRule[] = defaultTypeCompatibilityRules,
): TransformationItem[] {
  // Find compatibility rule
  const rule = rules.find(
    (r) => r.sourceType === sourceType && r.targetType === targetType,
  );

  if (!rule) return [];

  // If no compatibility rules or not compatible directly or via transformation, return empty
  if (!rule.compatibleTransformations && !rule.isCompatible) {
    return [];
  }

  // If direct compatibility, any transformation with matching input/output types is valid
  if (rule.isCompatible) {
    return transformations.filter(
      (t) => t.inputTypes.includes(sourceType) && t.outputType === targetType,
    );
  }

  // If transformation categories specified, filter by those
  if (rule.compatibleTransformations) {
    return transformations.filter(
      (t) =>
        rule.compatibleTransformations?.includes(t.category) &&
        t.inputTypes.includes(sourceType) &&
        t.outputType === targetType,
    );
  }

  return [];
}
