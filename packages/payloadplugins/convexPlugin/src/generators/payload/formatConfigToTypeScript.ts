import type { PayloadCollectionConfig, PayloadField } from "./types";

// Use internal types for now

// Helper function to safely stringify values for TS code
// Handles strings, numbers, booleans, null, undefined, and basic objects/arrays
// Does NOT handle functions or complex objects well.
const safeStringify = (value: any, indentLevel = 1): string => {
  const indent = "  ".repeat(indentLevel);
  const parentIndent = "  ".repeat(indentLevel - 1);

  if (value === undefined) {
    return "undefined";
  }
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    // Handle potential multi-line strings or strings needing quotes escaped
    if (value.includes("\n")) {
      // Using template literals for multi-line strings
      return (
        "`\n" +
        indent +
        value.replace(/`/g, "\\`").split("\n").join(`\n${indent}`) +
        "\n" +
        parentIndent +
        "`"
      );
    } else {
      // Simple JSON stringify works for single-line strings that don't contain backticks
      if (!value.includes("`")) {
        return JSON.stringify(value);
      } else {
        // Use template literal even for single line if it contains backticks
        return "`" + value.replace(/`/g, "\\`") + "`";
      }
    }
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return value.toString();
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value
      .map((item) => safeStringify(item, indentLevel + 1))
      .join(`,\n${indent}  `);
    return `[\n${indent}  ${items}\n${indent}]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) return "{}";
    const properties = keys
      .map(
        (key) =>
          // Ensure keys are properly quoted if they contain special chars, though usually they don't for config
          `${/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key)}: ${safeStringify(value[key], indentLevel + 1)}`,
      )
      .join(`,\n${indent}  `);
    return `{\n${indent}  ${properties}\n${indent}}`;
  }
  // Fallback for unknown types (like functions represented as strings)
  return value.toString();
};

/**
 * Formats a generated PayloadCollectionConfig object into a TypeScript file string.
 *
 * @param config - The PayloadCollectionConfig object.
 * @returns A string representing the TypeScript collection file.
 */
export const formatConfigToTypeScript = (
  config: PayloadCollectionConfig,
): string => {
  // Convert slug to PascalCase for Collection Name
  const collectionName = config.slug
    .split(/[-_]/) // Split by hyphen or underscore
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  // Start building the string with the corrected import path
  let output = `import type { CollectionConfig } from 'payload';\n\n`;
  output += `export const ${collectionName}: CollectionConfig = {\n`;

  // Iterate through config properties and format them
  const configEntries = Object.entries(config);
  configEntries.forEach(([key, value], index) => {
    const isLastEntry = index === configEntries.length - 1;
    const comma = isLastEntry ? "" : ",";

    if (key === "fields") {
      // Special handling for fields array
      output += `  fields: [\n`;
      if (Array.isArray(value)) {
        value.forEach((field: PayloadField, fieldIndex) => {
          const isLastField = fieldIndex === value.length - 1;
          const fieldComma = isLastField ? "" : ",";
          output += `    {\n`;
          const fieldEntries = Object.entries(field);
          fieldEntries.forEach(([fieldKey, fieldValue], entryIndex) => {
            const isLastFieldEntry = entryIndex === fieldEntries.length - 1;
            const entryComma = isLastFieldEntry ? "" : ",";
            // Special handling for nested fields/options within a field definition
            if (
              (fieldKey === "fields" ||
                fieldKey === "options" ||
                fieldKey === "admin") &&
              typeof fieldValue === "object"
            ) {
              output += `      ${fieldKey}: ${safeStringify(fieldValue, 3)}${entryComma}\n`;
            } else {
              output += `      ${fieldKey}: ${safeStringify(fieldValue, 3)}${entryComma}\n`;
            }
          });
          output += `    }${fieldComma}\n`;
        });
      }
      output += `  ]${comma}\n`;
    } else if (key === "access") {
      // Special handling for access control functions (represented as strings)
      output += `  access: {\n`;
      const accessEntries = Object.entries(value);
      accessEntries.forEach(([accessKey, accessValue], accessIndex) => {
        const isLastAccess = accessIndex === accessEntries.length - 1;
        const accessComma = isLastAccess ? "" : ",";
        output += `    ${accessKey}: ${accessValue}${accessComma}\n`; // Output the string directly
      });
      output += `  }${comma}\n`;
    } else if (key === "indexes") {
      // Handle indexes array
      output += `  indexes: ${safeStringify(value, 1)}${comma}\n`;
    } else if (key === "admin") {
      // Handle admin object
      output += `  admin: ${safeStringify(value, 1)}${comma}\n`;
    } else {
      // Default handling for simple properties (slug, timestamps, auth)
      output += `  ${key}: ${safeStringify(value, 1)}${comma}\n`;
    }
  });

  output += `};\n`;

  return output;
};
