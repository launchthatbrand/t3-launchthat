/**
 * Object transformation functions
 */

import type { TransformationFunction } from "../types";
import { registerTransformationFunction } from "../registry";
import { DataType, TransformationCategory } from "../types";
import { getNestedValue, setNestedValue } from "../utils";

/**
 * Object transformation functions registry
 */

// Get property from an object
const getProperty: TransformationFunction = {
  id: "object.getProperty",
  name: "Get Object Property",
  description: "Gets a property value from an object",
  category: TransformationCategory.Object,
  inputTypes: [DataType.Object],
  outputType: DataType.Any,
  parameters: [
    {
      name: "path",
      type: DataType.String,
      required: true,
      description:
        "The path to the property (e.g., 'user.address.street' or 'items[0].name')",
    },
    {
      name: "defaultValue",
      type: DataType.Any,
      required: false,
      description: "Default value if the property doesn't exist",
    },
  ],
  examples: [
    {
      input: { user: { name: "John", age: 30 } },
      params: { path: "user.name" },
      output: "John",
    },
  ],
};

registerTransformationFunction(getProperty, (value, params) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      success: false,
      error: "Input value must be an object",
    };
  }

  if (!params || typeof params.path !== "string") {
    return {
      success: false,
      error: "Path parameter is required and must be a string",
    };
  }

  try {
    const result = getNestedValue(value, params.path);

    // If the result is undefined, use default value if provided
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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error getting property",
    };
  }
});

// Set property on an object
const setProperty: TransformationFunction = {
  id: "object.setProperty",
  name: "Set Object Property",
  description: "Sets a property value on an object",
  category: TransformationCategory.Object,
  inputTypes: [DataType.Object],
  outputType: DataType.Object,
  parameters: [
    {
      name: "path",
      type: DataType.String,
      required: true,
      description:
        "The path to the property (e.g., 'user.address.street' or 'items[0].name')",
    },
    {
      name: "value",
      type: DataType.Any,
      required: true,
      description: "The value to set",
    },
  ],
  examples: [
    {
      input: { user: { name: "John" } },
      params: { path: "user.age", value: 30 },
      output: { user: { name: "John", age: 30 } },
    },
  ],
};

registerTransformationFunction(setProperty, (value, params) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      success: false,
      error: "Input value must be an object",
    };
  }

  if (!params || typeof params.path !== "string") {
    return {
      success: false,
      error: "Path parameter is required and must be a string",
    };
  }

  if (!("value" in params)) {
    return {
      success: false,
      error: "Value parameter is required",
    };
  }

  try {
    // Clone the object to avoid modifying the original
    const result = JSON.parse(JSON.stringify(value));

    // Set the value at the specified path
    setNestedValue(result, params.path, params.value);

    return {
      success: true,
      value: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error setting property",
    };
  }
});

// Merge objects
const mergeObjects: TransformationFunction = {
  id: "object.merge",
  name: "Merge Objects",
  description: "Merges two objects together",
  category: TransformationCategory.Object,
  inputTypes: [DataType.Object],
  outputType: DataType.Object,
  parameters: [
    {
      name: "objectToMerge",
      type: DataType.Object,
      required: true,
      description: "The object to merge with the input object",
    },
    {
      name: "deep",
      type: DataType.Boolean,
      required: false,
      description: "Whether to perform a deep merge",
      defaultValue: false,
    },
  ],
  examples: [
    {
      input: { name: "John", age: 30 },
      params: { objectToMerge: { city: "New York", age: 31 } },
      output: { name: "John", age: 31, city: "New York" },
    },
  ],
};

registerTransformationFunction(mergeObjects, (value, params) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      success: false,
      error: "Input value must be an object",
    };
  }

  if (
    !params ||
    !params.objectToMerge ||
    typeof params.objectToMerge !== "object" ||
    Array.isArray(params.objectToMerge)
  ) {
    return {
      success: false,
      error: "Object to merge parameter is required and must be an object",
    };
  }

  try {
    // Clone the original object
    const result = JSON.parse(JSON.stringify(value));
    const shouldDeepMerge = params.deep === true;

    if (shouldDeepMerge) {
      // Deep merge implementation
      deepMerge(result, params.objectToMerge);
    } else {
      // Shallow merge
      Object.assign(result, params.objectToMerge);
    }

    return {
      success: true,
      value: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error merging objects",
    };
  }
});

// Helper function for deep merging objects
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): void {
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      // If both values are objects, recursively merge them
      if (
        sourceValue &&
        targetValue &&
        typeof sourceValue === "object" &&
        typeof targetValue === "object" &&
        !Array.isArray(sourceValue) &&
        !Array.isArray(targetValue)
      ) {
        deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>,
        );
      } else {
        // Otherwise, overwrite the target value
        target[key] = sourceValue;
      }
    }
  }
}

// Pick specific properties from an object
const pickProperties: TransformationFunction = {
  id: "object.pick",
  name: "Pick Object Properties",
  description: "Creates a new object with only the specified properties",
  category: TransformationCategory.Object,
  inputTypes: [DataType.Object],
  outputType: DataType.Object,
  parameters: [
    {
      name: "properties",
      type: DataType.Array,
      required: true,
      description: "Array of property names to pick",
    },
  ],
  examples: [
    {
      input: { name: "John", age: 30, city: "New York", country: "USA" },
      params: { properties: ["name", "age"] },
      output: { name: "John", age: 30 },
    },
  ],
};

registerTransformationFunction(pickProperties, (value, params) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      success: false,
      error: "Input value must be an object",
    };
  }

  if (!params || !params.properties || !Array.isArray(params.properties)) {
    return {
      success: false,
      error: "Properties parameter is required and must be an array",
    };
  }

  try {
    const result: Record<string, unknown> = {};

    for (const prop of params.properties) {
      if (typeof prop === "string" && prop in value) {
        result[prop] = (value as Record<string, unknown>)[prop];
      }
    }

    return {
      success: true,
      value: result,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error picking properties",
    };
  }
});

// Omit specific properties from an object
const omitProperties: TransformationFunction = {
  id: "object.omit",
  name: "Omit Object Properties",
  description: "Creates a new object without the specified properties",
  category: TransformationCategory.Object,
  inputTypes: [DataType.Object],
  outputType: DataType.Object,
  parameters: [
    {
      name: "properties",
      type: DataType.Array,
      required: true,
      description: "Array of property names to omit",
    },
  ],
  examples: [
    {
      input: { name: "John", age: 30, city: "New York", country: "USA" },
      params: { properties: ["city", "country"] },
      output: { name: "John", age: 30 },
    },
  ],
};

registerTransformationFunction(omitProperties, (value, params) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      success: false,
      error: "Input value must be an object",
    };
  }

  if (!params || !params.properties || !Array.isArray(params.properties)) {
    return {
      success: false,
      error: "Properties parameter is required and must be an array",
    };
  }

  try {
    const result: Record<string, unknown> = {};
    const propsToOmit = new Set(
      params.properties.filter((p) => typeof p === "string"),
    );

    for (const key in value) {
      if (
        Object.prototype.hasOwnProperty.call(value, key) &&
        !propsToOmit.has(key)
      ) {
        result[key] = (value as Record<string, unknown>)[key];
      }
    }

    return {
      success: true,
      value: result,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error omitting properties",
    };
  }
});

// Get object keys
const getKeys: TransformationFunction = {
  id: "object.keys",
  name: "Get Object Keys",
  description: "Returns an array of the object's property names",
  category: TransformationCategory.Object,
  inputTypes: [DataType.Object],
  outputType: DataType.Array,
  parameters: [],
  examples: [
    {
      input: { name: "John", age: 30, city: "New York" },
      output: ["name", "age", "city"],
    },
  ],
};

registerTransformationFunction(getKeys, (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      success: false,
      error: "Input value must be an object",
    };
  }

  try {
    return {
      success: true,
      value: Object.keys(value),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error getting object keys",
    };
  }
});
