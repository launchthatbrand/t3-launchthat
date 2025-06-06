/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/**
 * Date transformation functions
 */

import type { TransformationFunction } from "../types";
import { registerTransformationFunction } from "../registry";
import { DataType, TransformationCategory } from "../types";

/**
 * Date transformation functions registry
 */

// Format date
const formatDate: TransformationFunction = {
  id: "date.format",
  name: "Format Date",
  description: "Formats a date using locale-specific formatting",
  category: TransformationCategory.Date,
  inputTypes: [DataType.Date, DataType.String, DataType.Number],
  outputType: DataType.String,
  parameters: [
    {
      name: "format",
      type: DataType.String,
      required: false,
      description:
        "Format string (e.g., 'yyyy-MM-dd', or 'full', 'long', 'medium', 'short')",
      defaultValue: "medium",
    },
    {
      name: "locale",
      type: DataType.String,
      required: false,
      description: "The locale to use for formatting",
      defaultValue: "en-US",
    },
  ],
  examples: [
    {
      input: "2023-01-15T12:30:45.000Z",
      params: { format: "yyyy-MM-dd" },
      output: "2023-01-15",
    },
  ],
};

registerTransformationFunction(formatDate, (value, params) => {
  try {
    // Convert the input to a Date object
    let dateValue: Date;

    if (value instanceof Date) {
      dateValue = value;
    } else if (typeof value === "string" || typeof value === "number") {
      dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        return {
          success: false,
          error: "Invalid date string or timestamp",
        };
      }
    } else {
      return {
        success: false,
        error: "Input value must be a Date, string, or number",
      };
    }

    const locale = (params?.locale as string) || "en-US";
    const format = (params?.format as string) || "medium";

    // Handle predefined formats
    const dateTimeFormatOptions: Intl.DateTimeFormatOptions = {};

    if (
      format === "full" ||
      format === "long" ||
      format === "medium" ||
      format === "short"
    ) {
      dateTimeFormatOptions.dateStyle =
        format as Intl.DateTimeFormatOptions["dateStyle"];
    } else {
      // Custom format string processing - simplified version
      // In a complete implementation, we would parse the format string
      // and convert it to DateTimeFormatOptions

      // Basic date components
      if (format.includes("yyyy") || format.includes("yy")) {
        dateTimeFormatOptions.year = "numeric";
      }
      if (format.includes("MM") || format.includes("M")) {
        dateTimeFormatOptions.month = format.includes("MMM")
          ? "long"
          : "2-digit";
      }
      if (format.includes("dd") || format.includes("d")) {
        dateTimeFormatOptions.day = "2-digit";
      }

      // Time components
      if (format.includes("HH") || format.includes("hh")) {
        dateTimeFormatOptions.hour = "2-digit";
      }
      if (format.includes("mm")) {
        dateTimeFormatOptions.minute = "2-digit";
      }
      if (format.includes("ss")) {
        dateTimeFormatOptions.second = "2-digit";
      }
    }

    return {
      success: true,
      value: new Intl.DateTimeFormat(locale, dateTimeFormatOptions).format(
        dateValue,
      ),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error formatting date",
    };
  }
});

// Get date part (year, month, day, etc.)
const getDatePart: TransformationFunction = {
  id: "date.getPart",
  name: "Get Date Part",
  description: "Extracts a specific part from a date (year, month, day, etc.)",
  category: TransformationCategory.Date,
  inputTypes: [DataType.Date, DataType.String, DataType.Number],
  outputType: DataType.Number,
  parameters: [
    {
      name: "part",
      type: DataType.String,
      required: true,
      description:
        "The part to extract (year, month, day, hour, minute, second)",
      enum: ["year", "month", "day", "hour", "minute", "second"],
    },
  ],
  examples: [
    {
      input: "2023-01-15T12:30:45.000Z",
      params: { part: "year" },
      output: 2023,
    },
  ],
};

registerTransformationFunction(getDatePart, (value, params) => {
  try {
    // Convert the input to a Date object
    let dateValue: Date;

    if (value instanceof Date) {
      dateValue = value;
    } else if (typeof value === "string" || typeof value === "number") {
      dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        return {
          success: false,
          error: "Invalid date string or timestamp",
        };
      }
    } else {
      return {
        success: false,
        error: "Input value must be a Date, string, or number",
      };
    }

    const part = params?.part as string;
    if (!part) {
      return {
        success: false,
        error: "Part parameter is required",
      };
    }

    let result: number;

    switch (part.toLowerCase()) {
      case "year":
        result = dateValue.getFullYear();
        break;
      case "month":
        result = dateValue.getMonth() + 1; // January is 0
        break;
      case "day":
        result = dateValue.getDate();
        break;
      case "hour":
        result = dateValue.getHours();
        break;
      case "minute":
        result = dateValue.getMinutes();
        break;
      case "second":
        result = dateValue.getSeconds();
        break;
      default:
        return {
          success: false,
          error: `Unknown date part: ${part}`,
        };
    }

    return {
      success: true,
      value: result,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Error extracting date part",
    };
  }
});

// Add to date
const addToDate: TransformationFunction = {
  id: "date.add",
  name: "Add to Date",
  description: "Adds a specified amount of time to a date",
  category: TransformationCategory.Date,
  inputTypes: [DataType.Date, DataType.String, DataType.Number],
  outputType: DataType.Date,
  parameters: [
    {
      name: "amount",
      type: DataType.Number,
      required: true,
      description: "The amount to add",
    },
    {
      name: "unit",
      type: DataType.String,
      required: true,
      description: "The unit of time to add",
      enum: ["years", "months", "days", "hours", "minutes", "seconds"],
    },
  ],
  examples: [
    {
      input: "2023-01-15T12:30:45.000Z",
      params: { amount: 1, unit: "days" },
      output: "2023-01-16T12:30:45.000Z",
    },
  ],
};

registerTransformationFunction(addToDate, (value, params) => {
  try {
    // Convert the input to a Date object
    let dateValue: Date;

    if (value instanceof Date) {
      dateValue = new Date(value.getTime()); // Clone the date
    } else if (typeof value === "string" || typeof value === "number") {
      dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        return {
          success: false,
          error: "Invalid date string or timestamp",
        };
      }
    } else {
      return {
        success: false,
        error: "Input value must be a Date, string, or number",
      };
    }

    const amount = params?.amount as number;
    if (amount === undefined || typeof amount !== "number") {
      return {
        success: false,
        error: "Amount parameter is required and must be a number",
      };
    }

    const unit = params?.unit as string;
    if (!unit) {
      return {
        success: false,
        error: "Unit parameter is required",
      };
    }

    switch (unit.toLowerCase()) {
      case "years":
        dateValue.setFullYear(dateValue.getFullYear() + amount);
        break;
      case "months":
        dateValue.setMonth(dateValue.getMonth() + amount);
        break;
      case "days":
        dateValue.setDate(dateValue.getDate() + amount);
        break;
      case "hours":
        dateValue.setHours(dateValue.getHours() + amount);
        break;
      case "minutes":
        dateValue.setMinutes(dateValue.getMinutes() + amount);
        break;
      case "seconds":
        dateValue.setSeconds(dateValue.getSeconds() + amount);
        break;
      default:
        return {
          success: false,
          error: `Unknown time unit: ${unit}`,
        };
    }

    return {
      success: true,
      value: dateValue,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error adding to date",
    };
  }
});

// Calculate date difference
const dateDifference: TransformationFunction = {
  id: "date.difference",
  name: "Date Difference",
  description:
    "Calculates the difference between two dates in the specified unit",
  category: TransformationCategory.Date,
  inputTypes: [DataType.Date, DataType.String, DataType.Number],
  outputType: DataType.Number,
  parameters: [
    {
      name: "compareDate",
      type: DataType.Date,
      required: true,
      description: "The date to compare with",
    },
    {
      name: "unit",
      type: DataType.String,
      required: true,
      description: "The unit of time for the difference",
      enum: [
        "years",
        "months",
        "days",
        "hours",
        "minutes",
        "seconds",
        "milliseconds",
      ],
    },
  ],
  examples: [
    {
      input: "2023-01-15T12:30:45.000Z",
      params: {
        compareDate: "2023-01-16T12:30:45.000Z",
        unit: "days",
      },
      output: 1,
    },
  ],
};

registerTransformationFunction(dateDifference, (value, params) => {
  try {
    // Convert the input to a Date object
    let dateValue: Date;

    if (value instanceof Date) {
      dateValue = value;
    } else if (typeof value === "string" || typeof value === "number") {
      dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        return {
          success: false,
          error: "Invalid date string or timestamp",
        };
      }
    } else {
      return {
        success: false,
        error: "Input value must be a Date, string, or number",
      };
    }

    // Convert the compare date
    const compareParam = params?.compareDate;
    let compareDate: Date;

    if (compareParam instanceof Date) {
      compareDate = compareParam;
    } else if (
      typeof compareParam === "string" ||
      typeof compareParam === "number"
    ) {
      compareDate = new Date(compareParam);
      if (isNaN(compareDate.getTime())) {
        return {
          success: false,
          error: "Invalid compare date string or timestamp",
        };
      }
    } else {
      return {
        success: false,
        error: "Compare date must be a Date, string, or number",
      };
    }

    const unit = params?.unit as string;
    if (!unit) {
      return {
        success: false,
        error: "Unit parameter is required",
      };
    }

    // Calculate difference in milliseconds
    const diffMs = compareDate.getTime() - dateValue.getTime();
    let result: number;

    switch (unit.toLowerCase()) {
      case "milliseconds":
        result = diffMs;
        break;
      case "seconds":
        result = diffMs / 1000;
        break;
      case "minutes":
        result = diffMs / (1000 * 60);
        break;
      case "hours":
        result = diffMs / (1000 * 60 * 60);
        break;
      case "days":
        result = diffMs / (1000 * 60 * 60 * 24);
        break;
      case "months":
        // Approximate - doesn't handle varying month lengths precisely
        result =
          (compareDate.getFullYear() - dateValue.getFullYear()) * 12 +
          (compareDate.getMonth() - dateValue.getMonth()) +
          (compareDate.getDate() < dateValue.getDate() ? -1 : 0);
        break;
      case "years":
        // Approximate - doesn't handle leap years precisely
        result = diffMs / (1000 * 60 * 60 * 24 * 365.25);
        break;
      default:
        return {
          success: false,
          error: `Unknown time unit: ${unit}`,
        };
    }

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
          : "Error calculating date difference",
    };
  }
});

// Convert date to ISO string
const toISOString: TransformationFunction = {
  id: "date.toISOString",
  name: "To ISO String",
  description: "Converts a date to ISO string format",
  category: TransformationCategory.Date,
  inputTypes: [DataType.Date, DataType.String, DataType.Number],
  outputType: DataType.String,
  parameters: [],
  examples: [
    {
      input: new Date("2023-01-15T12:30:45.000Z"),
      output: "2023-01-15T12:30:45.000Z",
    },
  ],
};

registerTransformationFunction(toISOString, (value) => {
  try {
    // Convert the input to a Date object
    let dateValue: Date;

    if (value instanceof Date) {
      dateValue = value;
    } else if (typeof value === "string" || typeof value === "number") {
      dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        return {
          success: false,
          error: "Invalid date string or timestamp",
        };
      }
    } else {
      return {
        success: false,
        error: "Input value must be a Date, string, or number",
      };
    }

    return {
      success: true,
      value: dateValue.toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error converting date to ISO string",
    };
  }
});
