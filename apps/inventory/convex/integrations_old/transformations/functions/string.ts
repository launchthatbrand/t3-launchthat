/**
 * String transformation functions
 *
 * This file provides a collection of transformation functions for manipulating string values.
 */

import { registerTransformationFunction } from "../registry";
import {
  DataType,
  TransformationCategory,
  TransformationFunction,
  TransformationResult,
} from "../types";

// String concatenation transformation
const concatenateDefinition: TransformationFunction = {
  id: "string.concatenate",
  name: "Concatenate",
  description: "Combines strings with an optional separator",
  category: TransformationCategory.String,
  inputTypes: [DataType.String, DataType.Any],
  outputType: DataType.String,
  parameters: [
    {
      name: "value",
      type: DataType.String,
      required: false,
      description: "Additional string to append",
      defaultValue: "",
    },
    {
      name: "separator",
      type: DataType.String,
      required: false,
      description: "Separator between strings",
      defaultValue: "",
    },
  ],
  examples: [
    {
      input: "Hello",
      params: { value: "World", separator: " " },
      output: "Hello World",
    },
  ],
};

function concatenate(
  value: unknown,
  params?: Record<string, unknown>,
): TransformationResult {
  try {
    const stringValue =
      value !== null && value !== undefined ? String(value) : "";
    const additionalValue =
      params?.value !== undefined ? String(params.value) : "";
    const separator =
      params?.separator !== undefined ? String(params.separator) : "";

    const result = stringValue + separator + additionalValue;

    return {
      success: true,
      value: result,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error in concatenate: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Uppercase transformation
const uppercaseDefinition: TransformationFunction = {
  id: "string.uppercase",
  name: "Uppercase",
  description: "Converts string to uppercase",
  category: TransformationCategory.String,
  inputTypes: [DataType.String],
  outputType: DataType.String,
  parameters: [],
  examples: [
    {
      input: "hello world",
      output: "HELLO WORLD",
    },
  ],
};

function uppercase(
  value: unknown,
  _params?: Record<string, unknown>,
): TransformationResult {
  try {
    if (value === null || value === undefined) {
      return {
        success: true,
        value: "",
      };
    }

    const stringValue = String(value);
    return {
      success: true,
      value: stringValue.toUpperCase(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Error in uppercase: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Lowercase transformation
const lowercaseDefinition: TransformationFunction = {
  id: "string.lowercase",
  name: "Lowercase",
  description: "Converts string to lowercase",
  category: TransformationCategory.String,
  inputTypes: [DataType.String],
  outputType: DataType.String,
  parameters: [],
  examples: [
    {
      input: "HELLO WORLD",
      output: "hello world",
    },
  ],
};

function lowercase(
  value: unknown,
  _params?: Record<string, unknown>,
): TransformationResult {
  try {
    if (value === null || value === undefined) {
      return {
        success: true,
        value: "",
      };
    }

    const stringValue = String(value);
    return {
      success: true,
      value: stringValue.toLowerCase(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Error in lowercase: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Trim transformation
const trimDefinition: TransformationFunction = {
  id: "string.trim",
  name: "Trim",
  description: "Removes whitespace from both ends of a string",
  category: TransformationCategory.String,
  inputTypes: [DataType.String],
  outputType: DataType.String,
  parameters: [],
  examples: [
    {
      input: "  hello  ",
      output: "hello",
    },
  ],
};

function trim(
  value: unknown,
  _params?: Record<string, unknown>,
): TransformationResult {
  try {
    if (value === null || value === undefined) {
      return {
        success: true,
        value: "",
      };
    }

    const stringValue = String(value);
    return {
      success: true,
      value: stringValue.trim(),
    };
  } catch (error) {
    return {
      success: false,
      error: `Error in trim: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Replace transformation
const replaceDefinition: TransformationFunction = {
  id: "string.replace",
  name: "Replace",
  description: "Replaces occurrences of a substring with another",
  category: TransformationCategory.String,
  inputTypes: [DataType.String],
  outputType: DataType.String,
  parameters: [
    {
      name: "search",
      type: DataType.String,
      required: true,
      description: "Text to search for",
    },
    {
      name: "replacement",
      type: DataType.String,
      required: true,
      description: "Text to replace with",
      defaultValue: "",
    },
    {
      name: "replaceAll",
      type: DataType.Boolean,
      required: false,
      description: "Replace all occurrences",
      defaultValue: true,
    },
  ],
  examples: [
    {
      input: "hello world",
      params: { search: "world", replacement: "universe", replaceAll: true },
      output: "hello universe",
    },
  ],
};

function replace(
  value: unknown,
  params?: Record<string, unknown>,
): TransformationResult {
  try {
    if (value === null || value === undefined) {
      return {
        success: true,
        value: "",
      };
    }

    const stringValue = String(value);
    const search = params?.search !== undefined ? String(params.search) : "";
    const replacement =
      params?.replacement !== undefined ? String(params.replacement) : "";
    const replaceAll = params?.replaceAll !== false;

    if (search === "") {
      return {
        success: true,
        value: stringValue,
      };
    }

    let result: string;
    if (replaceAll) {
      result = stringValue.split(search).join(replacement);
    } else {
      result = stringValue.replace(search, replacement);
    }

    return {
      success: true,
      value: result,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error in replace: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Substring transformation
const substringDefinition: TransformationFunction = {
  id: "string.substring",
  name: "Substring",
  description: "Extracts a portion of a string",
  category: TransformationCategory.String,
  inputTypes: [DataType.String],
  outputType: DataType.String,
  parameters: [
    {
      name: "start",
      type: DataType.Number,
      required: true,
      description: "Starting position (0-based)",
      defaultValue: 0,
    },
    {
      name: "length",
      type: DataType.Number,
      required: false,
      description: "Length of substring (omit to get rest of string)",
    },
  ],
  examples: [
    {
      input: "hello world",
      params: { start: 0, length: 5 },
      output: "hello",
    },
  ],
};

function substring(
  value: unknown,
  params?: Record<string, unknown>,
): TransformationResult {
  try {
    if (value === null || value === undefined) {
      return {
        success: true,
        value: "",
      };
    }

    const stringValue = String(value);
    const start = params?.start !== undefined ? Number(params.start) : 0;
    const hasLength = params?.length !== undefined;
    const length = hasLength ? Number(params.length) : undefined;

    let result: string;
    if (hasLength && length !== undefined) {
      result = stringValue.substring(start, start + length);
    } else {
      result = stringValue.substring(start);
    }

    return {
      success: true,
      value: result,
    };
  } catch (error) {
    return {
      success: false,
      error: `Error in substring: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Register all transformation functions
export function registerStringTransformations(): void {
  registerTransformationFunction(concatenateDefinition, concatenate);
  registerTransformationFunction(uppercaseDefinition, uppercase);
  registerTransformationFunction(lowercaseDefinition, lowercase);
  registerTransformationFunction(trimDefinition, trim);
  registerTransformationFunction(replaceDefinition, replace);
  registerTransformationFunction(substringDefinition, substring);
}
