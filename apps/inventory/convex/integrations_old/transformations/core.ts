/**
 * Core transformation engine
 *
 * This file contains the core functionality for executing data transformations
 * and mappings between different schemas.
 */

import type {
  FieldMapping,
  TransformationContext,
  TransformationResult,
} from "./types";
import { getTransformationFunction } from "./registry";
import { DataType } from "./types";
import { getNestedValue, setNestedValue } from "./utils";

/**
 * Execute a data mapping transformation
 *
 * @param context The transformation context including source and target data
 * @returns The transformed data
 */
export async function executeTransformation(
  context: TransformationContext,
): Promise<Record<string, unknown>> {
  const { sourceData, mapping, logger } = context;
  const result: Record<string, unknown> = { ...context.targetData };

  try {
    // Process each field mapping
    for (const fieldMapping of mapping.mappings) {
      try {
        const transformedValue = await transformField(
          sourceData,
          fieldMapping,
          logger,
        );
        if (transformedValue.success && transformedValue.value !== undefined) {
          setNestedValue(
            result,
            fieldMapping.targetField,
            transformedValue.value,
          );
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger?.(
          `Error transforming field ${fieldMapping.sourceField} to ${fieldMapping.targetField}: ${errorMessage}`,
          "error",
        );
      }
    }

    // Execute custom JS transformation if provided
    if (mapping.customJsTransform) {
      try {
        const customResult = executeCustomTransform(
          mapping.customJsTransform,
          sourceData,
          result,
        );
        if (customResult.success && customResult.value) {
          return customResult.value as Record<string, unknown>;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger?.(
          `Error executing custom transformation: ${errorMessage}`,
          "error",
        );
      }
    }

    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger?.(`Error executing transformation: ${errorMessage}`, "error");
    return result;
  }
}

/**
 * Transform a single field using the specified mapping
 *
 * @param sourceData Source data object
 * @param mapping Field mapping configuration
 * @param logger Optional logger function
 * @returns Transformation result
 */
async function transformField(
  sourceData: Record<string, unknown>,
  mapping: FieldMapping,
  logger?: (message: string, level?: string) => void,
): Promise<TransformationResult> {
  try {
    // Get source value
    const sourceValue = getNestedValue(sourceData, mapping.sourceField);

    // If no transformation specified, just pass through the value
    if (!mapping.transformation) {
      return {
        success: true,
        value: sourceValue,
      };
    }

    // Get the transformation function
    const transformFn = getTransformationFunction(
      mapping.transformation.functionId,
    );
    if (!transformFn) {
      return {
        success: false,
        error: `Transformation function '${mapping.transformation.functionId}' not found`,
      };
    }

    // Execute the transformation
    return await transformFn(sourceValue, mapping.transformation.parameters);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger?.(`Error in field transformation: ${errorMessage}`, "error");
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Execute a custom JavaScript transformation
 *
 * @param code Custom JS code to execute
 * @param sourceData Original source data
 * @param targetData Current target data
 * @returns Transformation result
 */
function executeCustomTransform(
  _code: string,
  _sourceData: Record<string, unknown>,
  _targetData: Record<string, unknown>,
): TransformationResult {
  // Note: Function constructor usage is a potential security risk
  // This implementation is provided for completeness but should be
  // replaced with a safer alternative in production systems
  return {
    success: false,
    error: "Custom JavaScript transformation is disabled for security reasons",
  };

  // A safer alternative would be to use a sandboxed environment or
  // pre-defined transformation functions instead of arbitrary code execution
}
