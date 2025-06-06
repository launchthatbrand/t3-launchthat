/**
 * Custom transformation functions
 *
 * This file contains functions for implementing custom transformations
 * including JavaScript code execution in a controlled environment.
 */

import type { TransformationFunction, TransformationResult } from "../types";
import { registerTransformationFunction } from "../registry";
import { DataType, TransformationCategory } from "../types";
import { safeEval } from "../utils";

/**
 * Custom transformation functions registry
 */

// Custom JavaScript transformation
const customJsTransform: TransformationFunction = {
  id: "custom.js",
  name: "Custom JavaScript",
  description: "Transform data using a custom JavaScript function",
  category: TransformationCategory.Custom,
  inputTypes: [DataType.Any],
  outputType: DataType.Any,
  parameters: [
    {
      name: "code",
      type: DataType.String,
      required: true,
      description:
        "JavaScript code that transforms the input value (must return a value)",
    },
  ],
  examples: [
    {
      input: "hello world",
      params: { code: "return value.toUpperCase();" },
      output: "HELLO WORLD",
    },
    {
      input: [1, 2, 3, 4, 5],
      params: { code: "return value.filter(num => num % 2 === 0);" },
      output: [2, 4],
    },
  ],
};

registerTransformationFunction(customJsTransform, (value, params) => {
  if (!params || typeof params.code !== "string") {
    return {
      success: false,
      error: "Code parameter is required and must be a string",
    };
  }

  try {
    // Safe evaluation of JavaScript code
    const result = safeEval(params.code, { value });

    return {
      success: true,
      value: result,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error executing custom JavaScript",
    };
  }
});

// Template string transformation
const templateTransform: TransformationFunction = {
  id: "custom.template",
  name: "Template String",
  description:
    "Transform data using a template string with variable interpolation",
  category: TransformationCategory.Custom,
  inputTypes: [DataType.Any],
  outputType: DataType.String,
  parameters: [
    {
      name: "template",
      type: DataType.String,
      required: true,
      description: "Template string with {variable} placeholders",
    },
    {
      name: "variables",
      type: DataType.Object,
      required: false,
      description: "Additional variables to use in the template",
    },
  ],
  examples: [
    {
      input: { name: "John", age: 30 },
      params: { template: "Hello, {name}! You are {age} years old." },
      output: "Hello, John! You are 30 years old.",
    },
    {
      input: "world",
      params: {
        template: "Hello, {value}! The current date is {currentDate}.",
        variables: { currentDate: "2023-01-01" },
      },
      output: "Hello, world! The current date is 2023-01-01.",
    },
  ],
};

registerTransformationFunction(templateTransform, (value, params) => {
  if (!params || typeof params.template !== "string") {
    return {
      success: false,
      error: "Template parameter is required and must be a string",
    };
  }

  try {
    // Combine the input value with any additional variables
    let data: Record<string, unknown> = {};

    // Add the input value as 'value'
    data.value = value;

    // If the input is an object, add its properties
    if (value && typeof value === "object" && !Array.isArray(value)) {
      data = { ...data, ...(value as Record<string, unknown>) };
    }

    // Add any additional variables
    if (params.variables && typeof params.variables === "object") {
      data = { ...data, ...params.variables };
    }

    // Replace placeholders in the template
    const result = params.template.replace(/{([^{}]+)}/g, (match, key) => {
      const trimmedKey = key.trim();
      return data[trimmedKey] !== undefined ? String(data[trimmedKey]) : match;
    });

    return {
      success: true,
      value: result,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error processing template string",
    };
  }
});

// Multi-step transformation pipeline
const pipelineTransform: TransformationFunction = {
  id: "custom.pipeline",
  name: "Transformation Pipeline",
  description: "Apply multiple transformations in sequence",
  category: TransformationCategory.Custom,
  inputTypes: [DataType.Any],
  outputType: DataType.Any,
  parameters: [
    {
      name: "steps",
      type: DataType.Array,
      required: true,
      description: "Array of transformation steps to apply",
    },
  ],
  examples: [
    {
      input: "hello world",
      params: {
        steps: [
          { transform: "string.toUpperCase" },
          { transform: "string.split", params: { separator: " " } },
        ],
      },
      output: ["HELLO", "WORLD"],
    },
  ],
};

registerTransformationFunction(pipelineTransform, (value, params) => {
  if (!params || !params.steps || !Array.isArray(params.steps)) {
    return {
      success: false,
      error: "Steps parameter is required and must be an array",
    };
  }

  try {
    // Start with the input value
    let currentValue: unknown = value;

    // Process each step in the pipeline
    for (const step of params.steps) {
      if (typeof step !== "object" || step === null) {
        return {
          success: false,
          error: "Each step must be an object with a 'transform' property",
        };
      }

      const transform = (step as { transform: string }).transform;
      if (!transform) {
        return {
          success: false,
          error: "Each step must specify a 'transform' property",
        };
      }

      // Execute the transformation function
      const stepParams = (step as { params?: Record<string, unknown> }).params;
      const result = executeCustomTransform(
        transform,
        currentValue,
        stepParams,
      );

      // If the step failed, return the error
      if (!result.success) {
        return result;
      }

      // Use the result as input for the next step
      currentValue = result.value;
    }

    return {
      success: true,
      value: currentValue,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error executing transformation pipeline",
    };
  }
});

/**
 * Execute a custom transformation by ID
 *
 * @param transformId The ID of the transformation function
 * @param value The value to transform
 * @param params Optional parameters for the transformation
 * @returns The transformation result
 */
function executeCustomTransform(
  transformId: string,
  value: unknown,
  params?: Record<string, unknown>,
): TransformationResult {
  // Import needed to avoid circular dependency
  const { executeTransformation } = require("../core");

  // Execute the transformation
  try {
    const result = executeTransformation({
      sourceData: { value },
      targetData: {},
      mapping: [
        {
          targetPath: "result",
          sourcePath: "value",
          transformationType: transformId,
          transformationParams: params,
        },
      ],
      logger: console,
    });

    // Return the result
    return {
      success: true,
      value: result.result,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error executing transformation: ${transformId}`,
    };
  }
}
