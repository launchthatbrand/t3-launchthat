/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/**
 * Array transformation functions
 */

import type { TransformationFunction } from "../types";
import { registerTransformationFunction } from "../registry";
import { DataType, TransformationCategory } from "../types";

/**
 * Array transformation functions registry
 */

// Get array item by index
const getArrayItem: TransformationFunction = {
  id: "array.getItem",
  name: "Get Array Item",
  description: "Gets an item from an array at the specified index",
  category: TransformationCategory.Array,
  inputTypes: [DataType.Array],
  outputType: DataType.Any,
  parameters: [
    {
      name: "index",
      type: DataType.Number,
      required: true,
      description: "The index of the item to get",
    },
    {
      name: "defaultValue",
      type: DataType.Any,
      required: false,
      description: "Default value if index is out of bounds",
    },
  ],
  examples: [
    {
      input: ["a", "b", "c"],
      params: { index: 1 },
      output: "b",
    },
  ],
};

registerTransformationFunction(getArrayItem, (value, params) => {
  if (!Array.isArray(value)) {
    return {
      success: false,
      error: "Input value must be an array",
    };
  }

  const index = params?.index as number | undefined;
  if (index === undefined || typeof index !== "number") {
    return {
      success: false,
      error: "Index parameter is required and must be a number",
    };
  }

  if (index < 0 || index >= value.length) {
    // Return default value if provided
    if ("defaultValue" in (params ?? {})) {
      return {
        success: true,
        value: params?.defaultValue,
      };
    }
    return {
      success: false,
      error: `Index ${index} is out of bounds (array length: ${value.length})`,
    };
  }

  return {
    success: true,
    value: value[index],
  };
});

// Join array items
const joinArray: TransformationFunction = {
  id: "array.join",
  name: "Join Array",
  description: "Joins array elements into a string with a specified separator",
  category: TransformationCategory.Array,
  inputTypes: [DataType.Array],
  outputType: DataType.String,
  parameters: [
    {
      name: "separator",
      type: DataType.String,
      required: false,
      description: "The separator to use between elements",
      defaultValue: ",",
    },
  ],
  examples: [
    {
      input: ["a", "b", "c"],
      params: { separator: "-" },
      output: "a-b-c",
    },
  ],
};

registerTransformationFunction(joinArray, (value, params) => {
  if (!Array.isArray(value)) {
    return {
      success: false,
      error: "Input value must be an array",
    };
  }

  const separator = (params?.separator as string) ?? ",";

  return {
    success: true,
    value: value.join(separator),
  };
});

// Filter array
const filterArray: TransformationFunction = {
  id: "array.filter",
  name: "Filter Array",
  description: "Filters array elements based on a condition",
  category: TransformationCategory.Array,
  inputTypes: [DataType.Array],
  outputType: DataType.Array,
  parameters: [
    {
      name: "property",
      type: DataType.String,
      required: true,
      description: "The property to check (for object arrays)",
    },
    {
      name: "operator",
      type: DataType.String,
      required: true,
      description: "Comparison operator",
      enum: [
        "eq",
        "neq",
        "gt",
        "gte",
        "lt",
        "lte",
        "contains",
        "startsWith",
        "endsWith",
      ],
    },
    {
      name: "value",
      type: DataType.Any,
      required: true,
      description: "The value to compare against",
    },
  ],
  examples: [
    {
      input: [
        { name: "John", age: 30 },
        { name: "Jane", age: 25 },
      ],
      params: { property: "age", operator: "gt", value: 28 },
      output: [{ name: "John", age: 30 }],
    },
  ],
};

registerTransformationFunction(filterArray, (value, params) => {
  if (!Array.isArray(value)) {
    return {
      success: false,
      error: "Input value must be an array",
    };
  }

  const property = params?.property as string | undefined;
  if (!property) {
    return {
      success: false,
      error: "Property parameter is required",
    };
  }

  const operator = params?.operator as string | undefined;
  if (!operator) {
    return {
      success: false,
      error: "Operator parameter is required",
    };
  }

  const compareValue = params?.value;
  if (compareValue === undefined) {
    return {
      success: false,
      error: "Value parameter is required",
    };
  }

  try {
    const result = value.filter((item) => {
      if (typeof item !== "object" || item === null) {
        return false;
      }

      const itemValue = (item as Record<string, unknown>)[property];

      switch (operator) {
        case "eq":
          return itemValue === compareValue;
        case "neq":
          return itemValue !== compareValue;
        case "gt":
          return (
            typeof itemValue === "number" &&
            typeof compareValue === "number" &&
            itemValue > compareValue
          );
        case "gte":
          return (
            typeof itemValue === "number" &&
            typeof compareValue === "number" &&
            itemValue >= compareValue
          );
        case "lt":
          return (
            typeof itemValue === "number" &&
            typeof compareValue === "number" &&
            itemValue < compareValue
          );
        case "lte":
          return (
            typeof itemValue === "number" &&
            typeof compareValue === "number" &&
            itemValue <= compareValue
          );
        case "contains":
          return (
            typeof itemValue === "string" &&
            typeof compareValue === "string" &&
            itemValue.includes(compareValue)
          );
        case "startsWith":
          return (
            typeof itemValue === "string" &&
            typeof compareValue === "string" &&
            itemValue.startsWith(compareValue)
          );
        case "endsWith":
          return (
            typeof itemValue === "string" &&
            typeof compareValue === "string" &&
            itemValue.endsWith(compareValue)
          );
        default:
          return false;
      }
    });

    return {
      success: true,
      value: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error filtering array",
    };
  }
});

// Map array
const mapArray: TransformationFunction = {
  id: "array.map",
  name: "Map Array",
  description:
    "Maps each element in an array to a new value based on a property",
  category: TransformationCategory.Array,
  inputTypes: [DataType.Array],
  outputType: DataType.Array,
  parameters: [
    {
      name: "property",
      type: DataType.String,
      required: true,
      description: "The property to extract (for object arrays)",
    },
  ],
  examples: [
    {
      input: [
        { name: "John", age: 30 },
        { name: "Jane", age: 25 },
      ],
      params: { property: "name" },
      output: ["John", "Jane"],
    },
  ],
};

registerTransformationFunction(mapArray, (value, params) => {
  if (!Array.isArray(value)) {
    return {
      success: false,
      error: "Input value must be an array",
    };
  }

  const property = params?.property as string | undefined;
  if (!property) {
    return {
      success: false,
      error: "Property parameter is required",
    };
  }

  try {
    const result = value.map((item) => {
      if (typeof item !== "object" || item === null) {
        return null;
      }
      return (item as Record<string, unknown>)[property];
    });

    return {
      success: true,
      value: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error mapping array",
    };
  }
});

// Sort array
const sortArray: TransformationFunction = {
  id: "array.sort",
  name: "Sort Array",
  description:
    "Sorts an array based on a property (for object arrays) or directly (for primitive arrays)",
  category: TransformationCategory.Array,
  inputTypes: [DataType.Array],
  outputType: DataType.Array,
  parameters: [
    {
      name: "property",
      type: DataType.String,
      required: false,
      description: "The property to sort by (for object arrays)",
    },
    {
      name: "direction",
      type: DataType.String,
      required: false,
      description: "Sort direction (asc or desc)",
      defaultValue: "asc",
      enum: ["asc", "desc"],
    },
  ],
  examples: [
    {
      input: [
        { name: "John", age: 30 },
        { name: "Jane", age: 25 },
      ],
      params: { property: "age", direction: "asc" },
      output: [
        { name: "Jane", age: 25 },
        { name: "John", age: 30 },
      ],
    },
  ],
};

registerTransformationFunction(sortArray, (value, params) => {
  if (!Array.isArray(value)) {
    return {
      success: false,
      error: "Input value must be an array",
    };
  }

  if (value.length === 0) {
    return {
      success: true,
      value: [],
    };
  }

  const property = params?.property as string | undefined;
  const direction = ((params?.direction as string) ?? "asc").toLowerCase();

  if (direction !== "asc" && direction !== "desc") {
    return {
      success: false,
      error: "Direction must be 'asc' or 'desc'",
    };
  }

  try {
    // Clone the array to avoid modifying the original
    const result = [...(value as unknown[])];

    // Sort function
    result.sort((a, b) => {
      let valueA: unknown;
      let valueB: unknown;

      if (property) {
        // Object array with property
        if (
          typeof a !== "object" ||
          a === null ||
          typeof b !== "object" ||
          b === null
        ) {
          return 0; // Can't compare if not objects
        }

        valueA = (a as Record<string, unknown>)[property];
        valueB = (b as Record<string, unknown>)[property];
      } else {
        // Direct comparison
        valueA = a;
        valueB = b;
      }

      // Handle different types
      if (typeof valueA === "string" && typeof valueB === "string") {
        return direction === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      if (typeof valueA === "number" && typeof valueB === "number") {
        return direction === "asc" ? valueA - valueB : valueB - valueA;
      }

      if (valueA instanceof Date && valueB instanceof Date) {
        return direction === "asc"
          ? valueA.getTime() - valueB.getTime()
          : valueB.getTime() - valueA.getTime();
      }

      // Convert to strings as fallback
      const strA = String(valueA);
      const strB = String(valueB);

      return direction === "asc"
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });

    return {
      success: true,
      value: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error sorting array",
    };
  }
});

// Slice array
const sliceArray: TransformationFunction = {
  id: "array.slice",
  name: "Slice Array",
  description: "Extracts a section of an array",
  category: TransformationCategory.Array,
  inputTypes: [DataType.Array],
  outputType: DataType.Array,
  parameters: [
    {
      name: "start",
      type: DataType.Number,
      required: false,
      description: "The start index",
      defaultValue: 0,
    },
    {
      name: "end",
      type: DataType.Number,
      required: false,
      description: "The end index (not included)",
    },
  ],
  examples: [
    {
      input: ["a", "b", "c", "d", "e"],
      params: { start: 1, end: 4 },
      output: ["b", "c", "d"],
    },
  ],
};

registerTransformationFunction(sliceArray, (value, params) => {
  if (!Array.isArray(value)) {
    return {
      success: false,
      error: "Input value must be an array",
    };
  }

  const start = params?.start ?? 0;
  const end = params?.end;

  if (typeof start !== "number") {
    return {
      success: false,
      error: "Start parameter must be a number",
    };
  }

  if (end !== undefined && typeof end !== "number") {
    return {
      success: false,
      error: "End parameter must be a number",
    };
  }

  return {
    success: true,
    value: value.slice(start, end),
  };
});
