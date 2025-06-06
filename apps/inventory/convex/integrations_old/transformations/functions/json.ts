/**
 * JSON transformation functions
 */

import type { TransformationFunction } from "../types";
import { registerTransformationFunction } from "../registry";
import { DataType, TransformationCategory } from "../types";

/**
 * JSON transformation functions registry
 */

// Parse JSON string into an object or array
const parseJson: TransformationFunction = {
  id: "json.parse",
  name: "Parse JSON",
  description: "Parses a JSON string into an object or array",
  category: TransformationCategory.Json,
  inputTypes: [DataType.String],
  outputType: DataType.Any,
  parameters: [
    {
      name: "defaultValue",
      type: DataType.Any,
      required: false,
      description: "Default value to return if parsing fails",
    },
  ],
  examples: [
    {
      input: '{"name":"John","age":30}',
      output: { name: "John", age: 30 },
    },
  ],
};

registerTransformationFunction(parseJson, (value, params) => {
  if (typeof value !== "string") {
    return {
      success: false,
      error: "Input value must be a string",
    };
  }

  try {
    const result = JSON.parse(value);
    return {
      success: true,
      value: result,
    };
  } catch (error) {
    // If parsing fails and a default value is provided, return it
    if (params && "defaultValue" in params) {
      return {
        success: true,
        value: params.defaultValue,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Error parsing JSON",
    };
  }
});

// Stringify object or array into a JSON string
const stringifyJson: TransformationFunction = {
  id: "json.stringify",
  name: "Stringify JSON",
  description: "Converts an object or array into a JSON string",
  category: TransformationCategory.Json,
  inputTypes: [DataType.Object, DataType.Array, DataType.Any],
  outputType: DataType.String,
  parameters: [
    {
      name: "pretty",
      type: DataType.Boolean,
      required: false,
      description: "Whether to format the JSON with indentation",
      defaultValue: false,
    },
    {
      name: "indent",
      type: DataType.Number,
      required: false,
      description: "Number of spaces to use for indentation when pretty=true",
      defaultValue: 2,
    },
  ],
  examples: [
    {
      input: { name: "John", age: 30 },
      output: '{"name":"John","age":30}',
    },
    {
      input: { name: "John", age: 30 },
      params: { pretty: true },
      output: '{\n  "name": "John",\n  "age": 30\n}',
    },
  ],
};

registerTransformationFunction(stringifyJson, (value, params) => {
  try {
    const pretty = params?.pretty === true;
    const indent = typeof params?.indent === "number" ? params.indent : 2;

    // Convert the value to a JSON string
    const result = pretty
      ? JSON.stringify(value, null, indent)
      : JSON.stringify(value);

    return {
      success: true,
      value: result,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error stringifying to JSON",
    };
  }
});

// Query JSON using JSONPath-like syntax
const queryJson: TransformationFunction = {
  id: "json.query",
  name: "Query JSON",
  description: "Extracts data from JSON using a simplified path expression",
  category: TransformationCategory.Json,
  inputTypes: [DataType.Object, DataType.Array],
  outputType: DataType.Any,
  parameters: [
    {
      name: "path",
      type: DataType.String,
      required: true,
      description:
        "The path expression (e.g., 'users[0].name' or 'data.items[*].id')",
    },
    {
      name: "defaultValue",
      type: DataType.Any,
      required: false,
      description: "Default value to return if the path doesn't exist",
    },
  ],
  examples: [
    {
      input: {
        users: [
          { name: "John", age: 30 },
          { name: "Jane", age: 25 },
        ],
      },
      params: { path: "users[0].name" },
      output: "John",
    },
    {
      input: {
        users: [
          { name: "John", age: 30 },
          { name: "Jane", age: 25 },
        ],
      },
      params: { path: "users[*].name" },
      output: ["John", "Jane"],
    },
  ],
};

registerTransformationFunction(queryJson, (value, params) => {
  if (!value || typeof value !== "object") {
    return {
      success: false,
      error: "Input value must be an object or array",
    };
  }

  if (!params || typeof params.path !== "string") {
    return {
      success: false,
      error: "Path parameter is required and must be a string",
    };
  }

  try {
    const result = evaluateJsonPath(value, params.path);

    // If the result is undefined and a default value is provided, return it
    if (result === undefined && "defaultValue" in params) {
      return {
        success: true,
        value: params.defaultValue,
      };
    }

    return {
      success: true,
      value: result,
    };
  } catch (error) {
    // If evaluation fails and a default value is provided, return it
    if ("defaultValue" in params) {
      return {
        success: true,
        value: params.defaultValue,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Error querying JSON",
    };
  }
});

/**
 * Evaluates a simplified JSONPath expression against a JSON object
 *
 * Supports:
 * - Property access: 'user.name'
 * - Array indexing: 'users[0]'
 * - Array wildcard: 'users[*].name'
 *
 * @param obj The object to query
 * @param path The path expression
 * @returns The extracted value(s)
 */
function evaluateJsonPath(obj: unknown, path: string): unknown {
  // Handle empty path
  if (!path) {
    return obj;
  }

  // Split the path into segments
  const segments = path.split(/\.|\[|\]/).filter(Boolean);

  // Start with the object
  let current: unknown = obj;
  let i = 0;

  while (i < segments.length && current !== undefined) {
    const segment = segments[i];

    // Handle array wildcard notation
    if (segment === "*") {
      // Must be an array
      if (!Array.isArray(current)) {
        return undefined;
      }

      // Get the remaining path
      const remainingPath = segments.slice(i + 1).join(".");

      // If this is the last segment, return the whole array
      if (remainingPath.length === 0) {
        return current;
      }

      // Otherwise, apply the remaining path to each item and return the results
      return current.map((item) => evaluateJsonPath(item, remainingPath));
    }

    // Handle regular property or array index
    if (Array.isArray(current)) {
      const index = parseInt(segment, 10);
      if (isNaN(index)) {
        // If not a number, apply to all elements
        return current.map((item) => {
          if (typeof item === "object" && item !== null) {
            return (item as Record<string, unknown>)[segment];
          }
          return undefined;
        });
      }
      current = current[index];
    } else if (typeof current === "object" && current !== null) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }

    i++;
  }
}
