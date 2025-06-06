/**
 * Logic transformation functions
 */

import type { TransformationFunction } from "../types";
import { registerTransformationFunction } from "../registry";
import { DataType, TransformationCategory } from "../types";
import { compareValues, isEmpty } from "../utils";

/**
 * Logic transformation functions registry
 */

// Conditional if-then-else function
const conditionalValue: TransformationFunction = {
  id: "logic.conditional",
  name: "Conditional (If-Then-Else)",
  description: "Returns one of two values based on a condition",
  category: TransformationCategory.Logic,
  inputTypes: [DataType.Any],
  outputType: DataType.Any,
  parameters: [
    {
      name: "condition",
      type: DataType.String,
      required: true,
      description: "The condition to evaluate",
      enum: [
        "equals",
        "notEquals",
        "greaterThan",
        "lessThan",
        "isEmpty",
        "isNotEmpty",
        "contains",
      ],
    },
    {
      name: "compareValue",
      type: DataType.Any,
      required: false,
      description: "The value to compare against (if needed)",
    },
    {
      name: "thenValue",
      type: DataType.Any,
      required: true,
      description: "The value to return if the condition is true",
    },
    {
      name: "elseValue",
      type: DataType.Any,
      required: false,
      description: "The value to return if the condition is false",
    },
    {
      name: "strictComparison",
      type: DataType.Boolean,
      required: false,
      description:
        "Whether to use strict comparison (===) or loose comparison (==)",
      defaultValue: true,
    },
  ],
  examples: [
    {
      input: "apple",
      params: {
        condition: "equals",
        compareValue: "apple",
        thenValue: "fruit",
        elseValue: "not a fruit",
      },
      output: "fruit",
    },
  ],
};

registerTransformationFunction(conditionalValue, (value, params) => {
  try {
    const condition = params?.condition as string;
    if (!condition) {
      return {
        success: false,
        error: "Condition parameter is required",
      };
    }

    const thenValue = params?.thenValue;
    if (thenValue === undefined) {
      return {
        success: false,
        error: "Then value parameter is required",
      };
    }

    const elseValue = params?.elseValue;
    const compareValue = params?.compareValue;
    const strictComparison = params?.strictComparison !== false;

    let conditionResult = false;

    switch (condition) {
      case "equals":
        conditionResult = compareValues(value, compareValue, strictComparison);
        break;
      case "notEquals":
        conditionResult = !compareValues(value, compareValue, strictComparison);
        break;
      case "greaterThan":
        conditionResult =
          typeof value === "number" &&
          typeof compareValue === "number" &&
          value > compareValue;
        break;
      case "lessThan":
        conditionResult =
          typeof value === "number" &&
          typeof compareValue === "number" &&
          value < compareValue;
        break;
      case "isEmpty":
        conditionResult = isEmpty(value);
        break;
      case "isNotEmpty":
        conditionResult = !isEmpty(value);
        break;
      case "contains":
        if (typeof value === "string" && typeof compareValue === "string") {
          conditionResult = value.includes(compareValue);
        } else if (Array.isArray(value)) {
          conditionResult = value.includes(compareValue as unknown);
        } else {
          conditionResult = false;
        }
        break;
      default:
        return {
          success: false,
          error: `Unknown condition: ${condition}`,
        };
    }

    return {
      success: true,
      value: conditionResult ? thenValue : elseValue,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error evaluating condition",
    };
  }
});

// Boolean NOT
const logicalNot: TransformationFunction = {
  id: "logic.not",
  name: "Logical NOT",
  description: "Inverts a boolean value",
  category: TransformationCategory.Logic,
  inputTypes: [DataType.Boolean, DataType.Any],
  outputType: DataType.Boolean,
  parameters: [],
  examples: [
    {
      input: true,
      output: false,
    },
    {
      input: false,
      output: true,
    },
  ],
};

registerTransformationFunction(logicalNot, (value) => {
  // Convert non-boolean values to boolean first
  const boolValue = Boolean(value);

  return {
    success: true,
    value: !boolValue,
  };
});

// Boolean AND
const logicalAnd: TransformationFunction = {
  id: "logic.and",
  name: "Logical AND",
  description: "Returns true if both values are true",
  category: TransformationCategory.Logic,
  inputTypes: [DataType.Boolean, DataType.Any],
  outputType: DataType.Boolean,
  parameters: [
    {
      name: "otherValue",
      type: DataType.Any,
      required: true,
      description: "The second value to AND with",
    },
  ],
  examples: [
    {
      input: true,
      params: { otherValue: true },
      output: true,
    },
    {
      input: true,
      params: { otherValue: false },
      output: false,
    },
  ],
};

registerTransformationFunction(logicalAnd, (value, params) => {
  if (!params || params.otherValue === undefined) {
    return {
      success: false,
      error: "Other value parameter is required",
    };
  }

  // Convert both values to booleans
  const boolValue1 = Boolean(value);
  const boolValue2 = Boolean(params.otherValue);

  return {
    success: true,
    value: boolValue1 && boolValue2,
  };
});

// Boolean OR
const logicalOr: TransformationFunction = {
  id: "logic.or",
  name: "Logical OR",
  description: "Returns true if either value is true",
  category: TransformationCategory.Logic,
  inputTypes: [DataType.Boolean, DataType.Any],
  outputType: DataType.Boolean,
  parameters: [
    {
      name: "otherValue",
      type: DataType.Any,
      required: true,
      description: "The second value to OR with",
    },
  ],
  examples: [
    {
      input: false,
      params: { otherValue: true },
      output: true,
    },
    {
      input: false,
      params: { otherValue: false },
      output: false,
    },
  ],
};

registerTransformationFunction(logicalOr, (value, params) => {
  if (!params || params.otherValue === undefined) {
    return {
      success: false,
      error: "Other value parameter is required",
    };
  }

  // Convert both values to booleans
  const boolValue1 = Boolean(value);
  const boolValue2 = Boolean(params.otherValue);

  return {
    success: true,
    value: boolValue1 || boolValue2,
  };
});

// Switch/case function
const switchCase: TransformationFunction = {
  id: "logic.switch",
  name: "Switch/Case",
  description:
    "Returns a value based on matching the input against multiple cases",
  category: TransformationCategory.Logic,
  inputTypes: [DataType.Any],
  outputType: DataType.Any,
  parameters: [
    {
      name: "cases",
      type: DataType.Any,
      required: true,
      description: "Array of case objects with value and result properties",
    },
    {
      name: "defaultValue",
      type: DataType.Any,
      required: false,
      description: "Default value to return if no case matches",
    },
    {
      name: "strictComparison",
      type: DataType.Boolean,
      required: false,
      description:
        "Whether to use strict comparison (===) or loose comparison (==)",
      defaultValue: true,
    },
  ],
  examples: [
    {
      input: "apple",
      params: {
        cases: [
          { value: "apple", result: "fruit" },
          { value: "carrot", result: "vegetable" },
        ],
        defaultValue: "unknown food",
      },
      output: "fruit",
    },
  ],
};

registerTransformationFunction(switchCase, (value, params) => {
  try {
    const cases = params?.cases;
    if (!cases || !Array.isArray(cases)) {
      return {
        success: false,
        error: "Cases parameter is required and must be an array",
      };
    }

    const defaultValue = params?.defaultValue;
    const strictComparison = params?.strictComparison !== false;

    // Iterate through the cases
    for (const caseItem of cases) {
      if (typeof caseItem !== "object" || caseItem === null) {
        continue;
      }

      // Type assertion for case objects
      const typedCase = caseItem as { value: unknown; result: unknown };

      if (compareValues(value, typedCase.value, strictComparison)) {
        return {
          success: true,
          value: typedCase.result,
        };
      }
    }

    // No case matched, return the default value
    return {
      success: true,
      value: defaultValue,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error evaluating switch cases",
    };
  }
});

// Check if value exists
const valueExists: TransformationFunction = {
  id: "logic.exists",
  name: "Value Exists",
  description: "Checks if a value exists (not null, undefined, or empty)",
  category: TransformationCategory.Logic,
  inputTypes: [DataType.Any],
  outputType: DataType.Boolean,
  parameters: [],
  examples: [
    {
      input: "hello",
      output: true,
    },
    {
      input: "",
      output: false,
    },
    {
      input: null,
      output: false,
    },
  ],
};

registerTransformationFunction(valueExists, (value) => {
  return {
    success: true,
    value: !isEmpty(value),
  };
});
