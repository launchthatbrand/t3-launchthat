/**
 * Transformation function registry
 *
 * This file provides a registry for data transformation functions and
 * methods to discover, register, and retrieve them.
 */

import {
  DataType,
  TransformationCategory,
  TransformationFunction,
  TransformationResult,
} from "./types";

/**
 * Type definition for a transformation function implementation
 */
export type TransformFunctionImpl = (
  value: unknown,
  params?: Record<string, unknown>,
) => Promise<TransformationResult> | TransformationResult;

/**
 * Registry of transformation functions
 */
const transformationRegistry = new Map<
  string,
  {
    definition: TransformationFunction;
    implementation: TransformFunctionImpl;
  }
>();

/**
 * Register a transformation function
 *
 * @param definition The function definition
 * @param implementation The function implementation
 */
export function registerTransformationFunction(
  definition: TransformationFunction,
  implementation: TransformFunctionImpl,
): void {
  transformationRegistry.set(definition.id, {
    definition,
    implementation,
  });
}

/**
 * Get a transformation function by ID
 *
 * @param id The function ID
 * @returns The transformation function or undefined if not found
 */
export function getTransformationFunction(
  id: string,
): TransformFunctionImpl | undefined {
  const entry = transformationRegistry.get(id);
  return entry?.implementation;
}

/**
 * Get all registered transformation functions
 *
 * @returns Array of transformation function definitions
 */
export function getAllTransformationFunctions(): TransformationFunction[] {
  return Array.from(transformationRegistry.values()).map(
    (entry) => entry.definition,
  );
}

/**
 * Get transformation functions by category
 *
 * @param category The category to filter by
 * @returns Array of transformation function definitions in the category
 */
export function getTransformationFunctionsByCategory(
  category: TransformationCategory,
): TransformationFunction[] {
  return Array.from(transformationRegistry.values())
    .filter((entry) => entry.definition.category === category)
    .map((entry) => entry.definition);
}

/**
 * Find compatible transformation functions for a given input type
 *
 * @param inputType The input data type
 * @param outputType Optional output type to also filter by
 * @returns Array of compatible transformation functions
 */
export function findCompatibleTransformations(
  inputType: DataType,
  outputType?: DataType,
): TransformationFunction[] {
  return Array.from(transformationRegistry.values())
    .filter((entry) => {
      // Check if the function accepts this input type
      const acceptsInput = entry.definition.inputTypes.includes(inputType);

      // If output type is specified, also check if the function produces that type
      const producesOutput = outputType
        ? entry.definition.outputType === outputType
        : true;

      return acceptsInput && producesOutput;
    })
    .map((entry) => entry.definition);
}
