/**
 * Number transformation functions
 *
 * This file provides a collection of transformation functions for manipulating numeric values.
 */

import { registerTransformationFunction } from "../registry";
import {
  DataType,
  TransformationCategory,
  TransformationFunction,
  TransformationResult,
} from "../types";

// Format number transformation
const formatNumberDefinition: TransformationFunction = {
  id: "number.format",
  name: "Format Number",
  description:
    "Formats a number with options for decimal places, thousands separators, etc.",
  category: TransformationCategory.Number,
  inputTypes: [DataType.Number, DataType.String],
  outputType: DataType.String,
  parameters: [
    {
      name: "decimals",
      type: DataType.Number,
      required: false,
      description: "Number of decimal places",
      defaultValue: 2,
    },
    {
      name: "decimalSeparator",
      type: DataType.String,
      required: false,
      description: "Character used as decimal separator",
      defaultValue: ".",
    },
    {
      name: "thousandsSeparator",
      type: DataType.String,
      required: false,
      description: "Character used as thousands separator",
      defaultValue: ",",
    },
  ],
  examples: [
    {
      input: 1234.56,
      params: { decimals: 2, decimalSeparator: ".", thousandsSeparator: "," },
      output: "1,234.56",
    },
  ],
};

function formatNumber(
  value: unknown,
  params?: Record<string, unknown>,
): TransformationResult {
  try {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return {
        success: true,
        value: "",
      };
    }

    // Convert to number
    let numValue: number;
    if (typeof value === "string") {
      numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return {
          success: false,
          error: "Could not parse string as number",
        };
      }
    } else if (typeof value === "number") {
      numValue = value;
    } else {
      return {
        success: false,
        error: "Input must be a number or string representing a number",
      };
    }

    // Get parameters with defaults
    const decimals =
      params?.decimals !== undefined ? Number(params.decimals) : 2;
    const decimalSeparator =
      params?.decimalSeparator !== undefined
        ? String(params.decimalSeparator)
        : ".";
    const thousandsSeparator =
      params?.thousandsSeparator !== undefined
        ? String(params.thousandsSeparator)
        : ",";

    // Format the number
    const parts = numValue.toFixed(decimals).split(".");
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? parts[1] : "";

    // Add thousands separators
    const formattedIntegerPart = integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      thousandsSeparator,
    );

    // Combine parts
    return {
      success: true,
      value: decimalPart
        ? formattedIntegerPart + decimalSeparator + decimalPart
        : formattedIntegerPart,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error in formatNumber: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Round number transformation
const roundNumberDefinition: TransformationFunction = {
  id: "number.round",
  name: "Round Number",
  description: "Rounds a number to a specified number of decimal places",
  category: TransformationCategory.Number,
  inputTypes: [DataType.Number, DataType.String],
  outputType: DataType.Number,
  parameters: [
    {
      name: "decimals",
      type: DataType.Number,
      required: false,
      description: "Number of decimal places",
      defaultValue: 0,
    },
    {
      name: "mode",
      type: DataType.String,
      required: false,
      description: "Rounding mode (round, floor, ceil)",
      defaultValue: "round",
      enum: ["round", "floor", "ceil"],
    },
  ],
  examples: [
    {
      input: 1.234,
      params: { decimals: 2, mode: "round" },
      output: 1.23,
    },
  ],
};

function roundNumber(
  value: unknown,
  params?: Record<string, unknown>,
): TransformationResult {
  try {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return {
        success: true,
        value: 0,
      };
    }

    // Convert to number
    let numValue: number;
    if (typeof value === "string") {
      numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return {
          success: false,
          error: "Could not parse string as number",
        };
      }
    } else if (typeof value === "number") {
      numValue = value;
    } else {
      return {
        success: false,
        error: "Input must be a number or string representing a number",
      };
    }

    // Get parameters with defaults
    const decimals =
      params?.decimals !== undefined ? Number(params.decimals) : 0;
    const mode = params?.mode !== undefined ? String(params.mode) : "round";

    // Calculate multiplier for decimal places
    const multiplier = Math.pow(10, decimals);

    // Round based on mode
    let result: number;
    switch (mode) {
      case "floor":
        result = Math.floor(numValue * multiplier) / multiplier;
        break;
      case "ceil":
        result = Math.ceil(numValue * multiplier) / multiplier;
        break;
      case "round":
      default:
        result = Math.round(numValue * multiplier) / multiplier;
        break;
    }

    return {
      success: true,
      value: result,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error in roundNumber: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Math operation transformation
const mathOperationDefinition: TransformationFunction = {
  id: "number.mathOperation",
  name: "Math Operation",
  description: "Performs a mathematical operation with the input value",
  category: TransformationCategory.Number,
  inputTypes: [DataType.Number, DataType.String],
  outputType: DataType.Number,
  parameters: [
    {
      name: "operand",
      type: DataType.Number,
      required: true,
      description: "The second operand for the operation",
    },
    {
      name: "operation",
      type: DataType.String,
      required: true,
      description: "The operation to perform",
      enum: ["add", "subtract", "multiply", "divide"],
    },
  ],
  examples: [
    {
      input: 5,
      params: { operand: 3, operation: "multiply" },
      output: 15,
    },
  ],
};

function mathOperation(
  value: unknown,
  params?: Record<string, unknown>,
): TransformationResult {
  try {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return {
        success: true,
        value: 0,
      };
    }

    // Convert to number
    let numValue: number;
    if (typeof value === "string") {
      numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return {
          success: false,
          error: "Could not parse string as number",
        };
      }
    } else if (typeof value === "number") {
      numValue = value;
    } else {
      return {
        success: false,
        error: "Input must be a number or string representing a number",
      };
    }

    // Check required parameters
    if (params?.operand === undefined) {
      return {
        success: false,
        error: "Operand parameter is required",
      };
    }

    if (params?.operation === undefined) {
      return {
        success: false,
        error: "Operation parameter is required",
      };
    }

    const operand = Number(params.operand);
    const operation = String(params.operation);

    // Perform operation
    let result: number;
    switch (operation) {
      case "add":
        result = numValue + operand;
        break;
      case "subtract":
        result = numValue - operand;
        break;
      case "multiply":
        result = numValue * operand;
        break;
      case "divide":
        if (operand === 0) {
          return {
            success: false,
            error: "Division by zero is not allowed",
          };
        }
        result = numValue / operand;
        break;
      default:
        return {
          success: false,
          error: `Unknown operation: ${operation}`,
        };
    }

    return {
      success: true,
      value: result,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error in mathOperation: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Register all transformation functions
export function registerNumberTransformations(): void {
  registerTransformationFunction(formatNumberDefinition, formatNumber);
  registerTransformationFunction(roundNumberDefinition, roundNumber);
  registerTransformationFunction(mathOperationDefinition, mathOperation);
}
